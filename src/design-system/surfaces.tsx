import type { HTMLAttributes, ReactNode } from "react";
import styles from "./surfaces.module.css";

export function DeskSurface({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={styles.desk} {...props}>
      {children}
    </div>
  );
}

export function Sheet({ children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section className={styles.sheet} {...props}>
      {children}
    </section>
  );
}

export function NotebookPage({ children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section className={styles.notebook} {...props}>
      {children}
    </section>
  );
}

export function FocusPaper({ children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <article className={styles.paper} {...props}>
      {children}
    </article>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <span className={styles.label}>{children}</span>;
}

export function DateMark({ children }: { children: ReactNode }) {
  return <div className={styles.dateMark}>{children}</div>;
}

export function Divider() {
  return <hr className={styles.divider} />;
}

export function Highlight({ children }: { children: ReactNode }) {
  return <span className={styles.highlight}>{children}</span>;
}
