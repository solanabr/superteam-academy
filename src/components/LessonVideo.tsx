interface LessonVideoProps {
  url: string;
  title: string;
  openExternalLabel: string;
}

interface EmbedData {
  provider: "youtube" | "vimeo" | "loom";
  src: string;
}

function parseEmbed(url: string): EmbedData | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const pathParts = parsed.pathname.split("/").filter(Boolean);

  if (host === "youtu.be") {
    const id = pathParts[0];
    if (id) {
      return {
        provider: "youtube",
        src: `https://www.youtube-nocookie.com/embed/${id}`,
      };
    }
  }

  if (host === "youtube.com" || host === "m.youtube.com") {
    const watchId = parsed.searchParams.get("v");
    const embedId =
      pathParts[0] === "embed" || pathParts[0] === "shorts"
        ? pathParts[1]
        : null;
    const id = watchId ?? embedId;
    if (id) {
      return {
        provider: "youtube",
        src: `https://www.youtube-nocookie.com/embed/${id}`,
      };
    }
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = pathParts.find((part) => /^\d+$/.test(part));
    if (id) {
      return {
        provider: "vimeo",
        src: `https://player.vimeo.com/video/${id}`,
      };
    }
  }

  if (host === "loom.com") {
    let id: string | undefined;
    if (pathParts[0] === "share" || pathParts[0] === "embed") {
      id = pathParts[1];
    }
    if (id) {
      return {
        provider: "loom",
        src: `https://www.loom.com/embed/${id}`,
      };
    }
  }

  return null;
}

export function LessonVideo({ url, title, openExternalLabel }: LessonVideoProps) {
  const embed = parseEmbed(url);

  return (
    <section
      className="mb-6 rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div
        className="px-4 py-3 flex items-center justify-between gap-3"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-elevated)",
        }}
      >
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h2>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline"
          style={{ color: "var(--text-purple)" }}
        >
          {openExternalLabel}
        </a>
      </div>

      {embed ? (
        <div className="aspect-video w-full bg-black">
          <iframe
            title={title}
            src={embed.src}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="px-4 py-4">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline"
            style={{ color: "var(--text-purple)" }}
          >
            {openExternalLabel}
          </a>
        </div>
      )}
    </section>
  );
}

