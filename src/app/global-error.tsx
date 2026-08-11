"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main style={{ maxWidth: "42rem", margin: "4rem auto", padding: "2rem" }}>
          <h1>This page could not be opened.</h1>
          <p>
            Your locally saved journal data has not been cleared. Please try opening the page again.
          </p>
          <button type="button" onClick={reset}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
