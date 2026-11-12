"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  MAX_EVENT_DESCRIPTION,
  MAX_EVENT_NAME,
  MAX_EVENT_XP,
  eventWindowState,
  generateEventCode,
} from "@/lib/events/events";
import { eventImageSrc } from "@/lib/events/images";
import type { AdminEvent } from "@/lib/events/admin-types";
import { AdminBadge } from "./admin-badge";
import { AdminButton } from "./admin-button";

const ERROR_KEYS: Record<string, string> = {
  invalidName: "errorInvalidName",
  invalidDescription: "errorInvalidDescription",
  invalidXp: "errorInvalidXp",
  invalidWindow: "errorInvalidWindow",
  invalidCode: "errorInvalidCode",
  codeTaken: "errorCodeTaken",
  lockedOnChain: "errorLockedOnChain",
  deployFailed: "errorDeploy",
  writeBackFailed: "errorDeploy",
  metadataUriRefused: "errorDeploy",
  invalidImage: "errorImage",
  imageTooLarge: "errorImageTooLarge",
  uploadFailed: "errorImage",
};

/** ISO → the `YYYY-MM-DDTHH:mm` a datetime-local input wants, in local time. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string {
  return value ? new Date(value).toISOString() : "";
}

async function send(
  url: string,
  method: string,
  body?: unknown
): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(url, {
    method,
    // Admin mutations are JSON-only, DELETE included (requireAdminAuth).
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, data };
}

/** Admin > Events: create events, deploy their badges, hand out codes. */
export function EventsPanel() {
  const t = useTranslations("admin.events");
  const tStates = useTranslations("admin.states");
  const [events, setEvents] = useState<AdminEvent[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(async () => {
    setLoadFailed(false);
    try {
      const res = await fetch("/api/admin/events");
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as { events: AdminEvent[] };
      setEvents(body.events);
    } catch {
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const replace = (event: AdminEvent) =>
    setEvents((prev) =>
      prev ? prev.map((e) => (e.id === event.id ? event : e)) : prev
    );

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-3">{t("description")}</p>
      <CreateEventForm
        onCreated={(e) => setEvents((prev) => [e, ...(prev ?? [])])}
      />
      {loadFailed ? (
        <div role="alert" className="space-y-2 text-sm text-danger">
          <p>{t("loadError")}</p>
          <AdminButton onClick={() => void load()}>
            {tStates("retry")}
          </AdminButton>
        </div>
      ) : events === null ? (
        <p role="status" className="text-sm text-text-3">
          {t("loading")}
        </p>
      ) : events.length === 0 ? (
        <p className="text-sm text-text-3">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {events.map((event) => (
            <li key={event.id}>
              <EventRow event={event} onChange={replace} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CreateEventForm({
  onCreated,
}: {
  onCreated: (e: AdminEvent) => void;
}) {
  const t = useTranslations("admin.events");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [xp, setXp] = useState("50");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    key: string;
  } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const { ok, data } = await send("/api/admin/events", "POST", {
        name,
        description,
        xpReward: Number(xp),
        startsAt: fromLocalInput(startsAt),
        endsAt: fromLocalInput(endsAt),
        code,
      });
      if (!ok) {
        setMessage({
          type: "error",
          key: ERROR_KEYS[String(data.error)] ?? "errorGeneric",
        });
        return;
      }
      onCreated(data.event as AdminEvent);
      setName("");
      setDescription("");
      setCode("");
      setMessage({ type: "success", key: "created" });
    } catch {
      setMessage({ type: "error", key: "errorGeneric" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-lg border border-border p-4"
    >
      <h3 className="font-display text-sm font-bold">{t("createTitle")}</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="set-label" htmlFor="event-name">
            {t("name")}
          </label>
          <input
            id="event-name"
            className="set-input"
            value={name}
            maxLength={MAX_EVENT_NAME}
            required
            onChange={(e) => setName(e.target.value)}
          />
          <p className="mt-1 text-xs text-text-3">{t("nameHint")}</p>
        </div>
        <div className="md:col-span-2">
          <label className="set-label" htmlFor="event-description">
            {t("descriptionLabel")}
          </label>
          <textarea
            id="event-description"
            className="set-input"
            rows={3}
            value={description}
            maxLength={MAX_EVENT_DESCRIPTION}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="set-label" htmlFor="event-starts">
            {t("startsAt")}
          </label>
          <input
            id="event-starts"
            type="datetime-local"
            className="set-input"
            value={startsAt}
            required
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div>
          <label className="set-label" htmlFor="event-ends">
            {t("endsAt")}
          </label>
          <input
            id="event-ends"
            type="datetime-local"
            className="set-input"
            value={endsAt}
            required
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
        <div>
          <label className="set-label" htmlFor="event-xp">
            {t("xp")}
          </label>
          <input
            id="event-xp"
            type="number"
            min={1}
            max={MAX_EVENT_XP}
            className="set-input"
            value={xp}
            required
            onChange={(e) => setXp(e.target.value)}
          />
          <p className="mt-1 text-xs text-text-3">
            {t("xpHint", { max: MAX_EVENT_XP })}
          </p>
        </div>
        <div>
          <label className="set-label" htmlFor="event-code-new">
            {t("code")}
          </label>
          <div className="flex gap-2">
            <input
              id="event-code-new"
              className="set-input font-mono uppercase placeholder:normal-case"
              value={code}
              maxLength={32}
              placeholder={t("codePlaceholder")}
              onChange={(e) => setCode(e.target.value)}
            />
            <AdminButton onClick={() => setCode(generateEventCode())}>
              {t("generate")}
            </AdminButton>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <AdminButton type="submit" variant="primary" disabled={busy}>
          {busy ? t("creating") : t("create")}
        </AdminButton>
        {message && (
          <p
            role={message.type === "error" ? "alert" : "status"}
            className={`text-xs ${message.type === "error" ? "text-danger" : "text-success"}`}
          >
            {t(message.key)}
          </p>
        )}
      </div>
    </form>
  );
}

function EventRow({
  event,
  onChange,
}: {
  event: AdminEvent;
  onChange: (e: AdminEvent) => void;
}) {
  const t = useTranslations("admin.events");
  const locale = useLocale();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    key: string;
  } | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    description: event.description,
    startsAt: toLocalInput(event.startsAt),
    endsAt: toLocalInput(event.endsAt),
    code: event.code,
  });

  const deployed = Boolean(event.collectionAddress);
  const status = !deployed ? "notDeployed" : eventWindowState(event);
  const tone =
    status === "live"
      ? "success"
      : status === "notDeployed"
        ? "warning"
        : "neutral";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setMessage(null);
    try {
      await fn();
    } catch {
      setMessage({ type: "error", key: "errorGeneric" });
    } finally {
      setBusy(null);
    }
  };

  const fail = (data: Record<string, unknown>) =>
    setMessage({
      type: "error",
      key: ERROR_KEYS[String(data.error)] ?? "errorGeneric",
    });

  const deploy = () =>
    run("deploy", async () => {
      const { ok, data } = await send(
        `/api/admin/events/${event.id}/deploy`,
        "POST",
        {}
      );
      if (!ok) return fail(data);
      onChange(data.event as AdminEvent);
      setMessage({ type: "success", key: "deployed" });
    });

  const saveEdit = () =>
    run("save", async () => {
      const { ok, data } = await send(
        `/api/admin/events/${event.id}`,
        "PATCH",
        {
          description: draft.description,
          startsAt: fromLocalInput(draft.startsAt),
          endsAt: fromLocalInput(draft.endsAt),
          code: draft.code,
        }
      );
      if (!ok) return fail(data);
      onChange(data.event as AdminEvent);
      setEditing(false);
      setMessage({ type: "success", key: "saved" });
    });

  const upload = (file: File) =>
    run("image", async () => {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const { ok, data } = await send(
        `/api/admin/events/${event.id}/image`,
        "POST",
        { dataUrl }
      );
      if (!ok) return fail(data);
      onChange({ ...event, imageUrl: (data.imageUrl as string) ?? null });
    });

  const removeImage = () =>
    run("image", async () => {
      const { ok, data } = await send(
        `/api/admin/events/${event.id}/image`,
        "DELETE",
        {}
      );
      if (!ok) return fail(data);
      onChange({ ...event, imageUrl: null });
    });

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setMessage({ type: "success", key: "copied" });
  };

  return (
    <div className="flex flex-col gap-4 py-4 sm:flex-row">
      {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of the badge artwork */}
      <img
        src={eventImageSrc(event)}
        alt=""
        width={72}
        height={72}
        className="h-[72px] w-[72px] shrink-0 rounded-full border border-border object-cover"
      />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-display text-sm font-bold text-text">
            {event.name}
          </h4>
          <AdminBadge tone={tone}>{t(`status.${status}`)}</AdminBadge>
          <span className="text-xs text-text-3">
            {t("attendees", { count: event.attendees })} · {event.xpReward} XP
          </span>
        </div>
        <p className="text-xs text-text-3">
          {fmt(event.startsAt)} → {fmt(event.endsAt)}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded bg-subtle px-2 py-0.5 font-mono text-sm tracking-[0.12em] text-text">
            {event.code}
          </code>
          <AdminButton onClick={() => void copy(event.code)}>
            {t("copyCode")}
          </AdminButton>
          <AdminButton
            onClick={() =>
              void copy(
                `${window.location.origin}/${locale}/events/redeem?code=${encodeURIComponent(event.code)}`
              )
            }
          >
            {t("copyLink")}
          </AdminButton>
        </div>

        {editing ? (
          <div className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="set-label" htmlFor={`desc-${event.id}`}>
                {t("descriptionLabel")}
              </label>
              <textarea
                id={`desc-${event.id}`}
                className="set-input"
                rows={3}
                maxLength={MAX_EVENT_DESCRIPTION}
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            </div>
            <div>
              <label className="set-label" htmlFor={`starts-${event.id}`}>
                {t("startsAt")}
              </label>
              <input
                id={`starts-${event.id}`}
                type="datetime-local"
                className="set-input"
                value={draft.startsAt}
                onChange={(e) =>
                  setDraft({ ...draft, startsAt: e.target.value })
                }
              />
            </div>
            <div>
              <label className="set-label" htmlFor={`ends-${event.id}`}>
                {t("endsAt")}
              </label>
              <input
                id={`ends-${event.id}`}
                type="datetime-local"
                className="set-input"
                value={draft.endsAt}
                onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })}
              />
            </div>
            <div>
              <label className="set-label" htmlFor={`code-${event.id}`}>
                {t("code")}
              </label>
              <input
                id={`code-${event.id}`}
                className="set-input font-mono uppercase"
                maxLength={32}
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value })}
              />
            </div>
            <div className="flex items-end gap-2">
              <AdminButton
                variant="primary"
                disabled={busy !== null}
                onClick={() => void saveEdit()}
              >
                {t("save")}
              </AdminButton>
              <AdminButton onClick={() => setEditing(false)}>
                {t("cancel")}
              </AdminButton>
            </div>
          </div>
        ) : (
          event.description && (
            <p className="line-clamp-2 text-xs text-text-2">
              {event.description}
            </p>
          )
        )}

        <div className="flex flex-wrap items-center gap-2">
          {!deployed && (
            <AdminButton
              variant="primary"
              disabled={busy !== null}
              onClick={() => void deploy()}
            >
              {busy === "deploy" ? t("deploying") : t("deploy")}
            </AdminButton>
          )}
          {!editing && (
            <AdminButton onClick={() => setEditing(true)}>
              {t("edit")}
            </AdminButton>
          )}
          <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-border bg-card px-3 py-1 font-display text-xs font-bold text-text-2 shadow-push-sm focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary hover:bg-subtle">
            {busy === "image" ? t("uploading") : t("uploadImage")}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={busy !== null}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void upload(file);
              }}
            />
          </label>
          {event.imageUrl && (
            <AdminButton
              disabled={busy !== null}
              onClick={() => void removeImage()}
            >
              {t("removeImage")}
            </AdminButton>
          )}
        </div>
        {!deployed && <p className="text-xs text-text-3">{t("deployHint")}</p>}
        {message && (
          <p
            role={message.type === "error" ? "alert" : "status"}
            className={`text-xs ${message.type === "error" ? "text-danger" : "text-success"}`}
          >
            {t(message.key)}
          </p>
        )}
      </div>
    </div>
  );
}
