"use client";

import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [message, setMessage] = useState("Choose a new password for this private space.");
  async function submit(event: FormEvent) {
    event.preventDefault();
    const client = createSupabaseBrowserClient();
    if (!client) return;
    const { error } = await client.auth.updateUser({ password });
    if (error) setMessage("That password could not be updated. Request a fresh recovery link.");
    else {
      router.push("/today");
      router.refresh();
    }
  }
  return (
    <main className="identity-loading">
      <form onSubmit={submit}>
        <h1>Set a new password.</h1>
        <label>
          New password
          <input
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button>Save new password</button>
        <p role="status">{message}</p>
      </form>
    </main>
  );
}
