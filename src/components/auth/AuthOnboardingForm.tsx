"use client";

import { FormEvent, useState } from "react";
import { SpotlightCard } from "@/components/ui/spotlight-card";

export function AuthOnboardingForm({
  title,
  subtitle,
  displayNameLabel,
  displayNamePlaceholder,
  usernameLabel,
  usernamePlaceholder,
  submitLabel,
  submittingLabel,
  validationMessage,
  initialDisplayName,
  initialUsername,
  onSubmit,
}: {
  title: string;
  subtitle: string;
  displayNameLabel: string;
  displayNamePlaceholder: string;
  usernameLabel: string;
  usernamePlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
  validationMessage: string;
  initialDisplayName?: string;
  initialUsername?: string;
  onSubmit: (payload: { displayName: string; username: string }) => Promise<void>;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const [username, setUsername] = useState(initialUsername ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const normalizedName = displayName.trim();
    const normalizedUsername = username.trim();

    if (!normalizedName && !normalizedUsername) {
      setError(validationMessage);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        displayName: normalizedName,
        username: normalizedUsername,
      });
    } catch {
      setError(validationMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SpotlightCard className="rounded-2xl" spotlightColor="rgba(25, 251, 155, 0.18)">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl p-6"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h2>
        <p className="text-sm mt-1 mb-5" style={{ color: "var(--text-secondary)" }}>
          {subtitle}
        </p>

        <label className="block mb-3">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {displayNameLabel}
          </span>
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder={displayNamePlaceholder}
            className="mt-1 w-full h-10 px-3 rounded-lg outline-none"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            }}
          />
        </label>

        <label className="block mb-2">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {usernameLabel}
          </span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder={usernamePlaceholder}
            className="mt-1 w-full h-10 px-3 rounded-lg outline-none"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            }}
          />
        </label>

        {error ? (
          <p className="text-xs mb-3" style={{ color: "#f87171" }}>
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[44px] rounded-xl px-4 text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: "var(--solana-purple)",
            color: "#fff",
          }}
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
      </form>
    </SpotlightCard>
  );
}
