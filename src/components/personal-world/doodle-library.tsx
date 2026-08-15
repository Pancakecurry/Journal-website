"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Doodle } from "@/domain/personal-world";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LocalPersonalWorldRepository } from "@/infrastructure/local/personal-world-repository";
import { LOCAL_FOUNDATION_USER_ID, readableDate } from "@/lib/journal-session";
import styles from "./doodle.module.css";

export function DoodleLibrary() {
  const repository = useMemo(() => new LocalPersonalWorldRepository(getApplicationDatabase()), []);
  const [items, setItems] = useState<Doodle[]>();
  useEffect(() => {
    let alive = true;
    void repository.doodles(LOCAL_FOUNDATION_USER_ID).then((rows) => {
      if (alive) setItems(rows);
    });
    return () => {
      alive = false;
    };
  }, [repository]);
  return (
    <main className={styles.library}>
      <header>
        <p>Your sketchbook</p>
        <h1>Doodles need absolutely no reason.</h1>
        <span>Draw a strange chair, a tiny cloud, or whatever your hand decides.</span>
        <div>
          <Link href="/my-world">Back to your desk</Link>
          <Link href="/my-world/doodles/new">+ New doodle</Link>
        </div>
      </header>
      {items === undefined ? (
        <p>Flipping through…</p>
      ) : items.length ? (
        <ol>
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/my-world/doodles/${item.id}`}>
                {/* Generated locally from structured strokes. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewDataUrl}
                  alt={item.description || item.title || "Saved doodle"}
                />
                <strong>{item.title || "Untitled doodle"}</strong>
                <time>
                  {readableDate(item.localDate, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <section>
          <h2>Very clean in here. For now.</h2>
          <p>Your first masterpiece can be one excellent potato.</p>
          <Link href="/my-world/doodles/new">Open a blank page</Link>
        </section>
      )}
    </main>
  );
}
