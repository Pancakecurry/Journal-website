import type { ReactNode } from "react";
import { DeskSurface, Label, NotebookPage, Sheet } from "@/design-system/surfaces";
import styles from "./foundation-screen.module.css";

interface FoundationScreenProps {
  intensity: "desk" | "notebook";
  label: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  children?: ReactNode;
}

export function FoundationScreen(props: FoundationScreenProps) {
  const content = (
    <>
      <header className={styles.header}>
        <div className={styles.eyebrow}>
          <Label>{props.label}</Label>
        </div>
        <h1
          className={`${styles.title} ${props.intensity === "notebook" ? styles.notebookTitle : ""}`}
        >
          {props.title}
        </h1>
        <p className={styles.description}>{props.description}</p>
      </header>
      {props.children ?? (
        <section className={styles.empty} aria-labelledby="empty-title">
          <h2 id="empty-title">{props.emptyTitle}</h2>
          <p>{props.emptyDescription}</p>
        </section>
      )}
      <p className={styles.foundationNote}>
        Phase 1 foundation · no sample history has been invented.
      </p>
    </>
  );

  return (
    <DeskSurface>
      {props.intensity === "desk" ? (
        <Sheet>{content}</Sheet>
      ) : (
        <NotebookPage>{content}</NotebookPage>
      )}
    </DeskSurface>
  );
}
