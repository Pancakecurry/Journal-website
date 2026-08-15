"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import type { DoodleStroke } from "@/domain/personal-world";
import { newEntityId } from "@/domain/shared";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LocalPersonalWorldRepository } from "@/infrastructure/local/personal-world-repository";
import { currentDayContext, LOCAL_FOUNDATION_USER_ID } from "@/lib/journal-session";
import { KeepsakeButton } from "./keepsake-button";
import styles from "./doodle.module.css";
import { storageFailureMessage } from "@/lib/storage-errors";

const COLORS = {
  ink: "#252b2a",
  coral: "#c86f5d",
  powder: "#719bb2",
  sage: "#758c70",
  lavender: "#8f80aa",
} as const;

export function DoodleStudio({ fresh = false }: { fresh?: boolean }) {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const id = fresh ? undefined : params.id;
  const repository = useMemo(() => new LocalPersonalWorldRepository(getApplicationDatabase()), []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<DoodleStroke | null>(null);
  const [strokes, setStrokes] = useState<DoodleStroke[]>([]);
  const [redo, setRedo] = useState<DoodleStroke[]>([]);
  const [tool, setTool] = useState<DoodleStroke["tool"]>("pen");
  const [color, setColor] = useState<DoodleStroke["color"]>("ink");
  const [size, setSize] = useState(4);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [savedId, setSavedId] = useState(id);
  const [status, setStatus] = useState(id ? "Opening the sketchbook…" : "Blank page. Go wild-ish.");
  const context = useMemo(() => currentDayContext(), []);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    void repository.doodle(id).then((item) => {
      if (!alive) return;
      if (!item) {
        setStatus("That doodle isn't on this device.");
        return;
      }
      setStrokes(item.strokes);
      setTitle(item.title);
      setDescription(item.description);
      setStatus("Ready for another line.");
    });
    return () => {
      alive = false;
    };
  }, [id, repository]);

  const render = useCallback((items: DoodleStroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCanvas(canvas, items);
  }, []);

  useEffect(() => {
    render(strokes);
  }, [render, strokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => render(strokes));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [render, strokes]);

  function pointerDown(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    canvas.setPointerCapture(event.pointerId);
    drawing.current = {
      id: newEntityId(),
      tool,
      color,
      size,
      points: [pointFor(event, canvas)],
    };
    drawCanvas(canvas, [...strokes, drawing.current]);
  }
  function pointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const stroke = drawing.current;
    if (!stroke || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    stroke.points.push(pointFor(event, event.currentTarget));
    drawLatestSegment(event.currentTarget, stroke);
  }
  function pointerUp(event: PointerEvent<HTMLCanvasElement>) {
    const completedStroke = drawing.current;
    if (!completedStroke) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    drawing.current = null;
    setStrokes((items) => [...items, completedStroke]);
    setRedo([]);
  }
  async function save() {
    if (!strokes.length) {
      setStatus("Draw at least one tiny thing first.");
      return;
    }
    const canvas = canvasRef.current!;
    try {
      const item = await repository.saveDoodle({
        id: savedId,
        userId: LOCAL_FOUNDATION_USER_ID,
        ...context,
        title,
        description,
        width: Math.round(canvas.clientWidth),
        height: Math.round(canvas.clientHeight),
        strokes,
        previewDataUrl: thumbnail(canvas),
      });
      setSavedId(item.id);
      setStatus("Saved to Today. Your scribble has an address now.");
      if (!id && navigator.onLine) router.replace(`/my-world/doodles/${item.id}`);
    } catch (error) {
      setStatus(
        storageFailureMessage(
          error,
          "That doodle couldn't be saved yet. It is still on this canvas.",
        ),
      );
    }
  }
  return (
    <main className={styles.studio}>
      <header>
        <div>
          <p>Sketchbook open</p>
          <h1>{id ? "There you are, little scribble." : "Draw something. Anything, really."}</h1>
          <span>Mouse, finger, stylus. Use whichever one is already nearby.</span>
        </div>
        <Link href="/my-world/doodles">Close sketchbook</Link>
      </header>
      <div className={styles.tools} role="toolbar" aria-label="Drawing tools">
        <button aria-pressed={tool === "pen"} onClick={() => setTool("pen")}>
          Pen
        </button>
        <button aria-pressed={tool === "eraser"} onClick={() => setTool("eraser")}>
          Eraser
        </button>
        <label>
          Ink{" "}
          <select
            value={color}
            onChange={(event) => setColor(event.target.value as DoodleStroke["color"])}
            disabled={tool === "eraser"}
          >
            {Object.keys(COLORS).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Stroke{" "}
          <input
            aria-label="Stroke size"
            type="range"
            min="1"
            max="18"
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
          />
        </label>
        <button
          disabled={!strokes.length}
          onClick={() => {
            setStrokes((items) => {
              const last = items.at(-1);
              if (last) setRedo((redoItems) => [...redoItems, last]);
              return items.slice(0, -1);
            });
          }}
        >
          Undo
        </button>
        <button
          disabled={!redo.length}
          onClick={() => {
            setRedo((items) => {
              const last = items.at(-1);
              if (last) setStrokes((strokeItems) => [...strokeItems, last]);
              return items.slice(0, -1);
            });
          }}
        >
          Redo
        </button>
        <button
          disabled={!strokes.length}
          onClick={() => {
            if (window.confirm("Clear the whole doodle? This can't be undone after saving.")) {
              setStrokes([]);
              setRedo([]);
            }
          }}
        >
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-label="Doodle canvas"
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
      />
      <div className={styles.details}>
        <label>
          Title{" "}
          <input
            value={title}
            maxLength={120}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Bus-stop masterpiece"
          />
        </label>
        <label>
          What is it?{" "}
          <input
            value={description}
            maxLength={500}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional, but useful if the drawing is… abstract."
          />
        </label>
      </div>
      <div className={styles.saveRow}>
        <button className={styles.save} onClick={() => void save()}>
          Save to Today
        </button>
        {savedId ? (
          <KeepsakeButton
            sourceType="doodle"
            sourceId={savedId}
            localDate={context.localDate}
            title={title || "Untitled doodle"}
            preview={description}
          />
        ) : null}
      </div>
      <p role="status">{status}</p>
    </main>
  );
}

function pointFor(event: PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
    y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    pressure: event.pressure || 0.5,
  };
}
function prepare(canvas: HTMLCanvasElement) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
  const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  return { context: canvas.getContext("2d")!, width, height, ratio };
}
function drawCanvas(canvas: HTMLCanvasElement, strokes: DoodleStroke[]) {
  const { context, width, height, ratio } = prepare(canvas);
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#fbf7eb";
  context.fillRect(0, 0, width, height);
  for (const stroke of strokes) drawStroke(context, stroke, width, height, ratio);
}
function drawStroke(
  context: CanvasRenderingContext2D,
  stroke: DoodleStroke | null | undefined,
  width: number,
  height: number,
  ratio: number,
) {
  if (!stroke || !Array.isArray(stroke.points)) return;
  const points = stroke.points;
  if (!points.length) return;
  context.save();
  context.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over";
  context.strokeStyle = COLORS[stroke.color];
  context.lineWidth = stroke.size * ratio;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(points[0]!.x * width, points[0]!.y * height);
  for (const point of points.slice(1)) context.lineTo(point.x * width, point.y * height);
  if (points.length === 1) context.lineTo(points[0]!.x * width + 0.1, points[0]!.y * height + 0.1);
  context.stroke();
  context.restore();
}
function drawLatestSegment(canvas: HTMLCanvasElement, stroke: DoodleStroke) {
  const { context, width, height, ratio } = prepare(canvas);
  const points = stroke.points.slice(-2);
  drawStroke(context, { ...stroke, points }, width, height, ratio);
}
function thumbnail(canvas: HTMLCanvasElement) {
  const thumb = document.createElement("canvas");
  thumb.width = 420;
  thumb.height = 280;
  const context = thumb.getContext("2d")!;
  context.fillStyle = "#fbf7eb";
  context.fillRect(0, 0, 420, 280);
  context.drawImage(canvas, 0, 0, 420, 280);
  return thumb.toDataURL("image/jpeg", 0.72);
}
