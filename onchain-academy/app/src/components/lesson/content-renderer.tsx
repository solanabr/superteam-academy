import React from "react";

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /`([^`]+)`/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <code
        key={`ic-${key++}`}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.88em",
          background: "rgba(255,255,255,0.06)",
          padding: "2px 6px",
          borderRadius: "3px",
          color: "var(--nd-highlight-blue)",
        }}
      >
        {match[1]}
      </code>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

const BULLET_RE = /^[•\-*]\s/;
const NUMBERED_RE = /^\d+[.)]\s/;

const CODE_INDICATORS = [
  "import ",
  "from '",
  'from "',
  "const ",
  "let ",
  "pub fn ",
  "pub struct ",
  "pub mod ",
  "#[",
  "fn ",
  "async ",
  "await ",
  "use anchor",
  "use solana",
  "export ",
  "interface ",
  "type ",
  "class ",
  "return ",
  "if (",
  "for (",
  "while (",
  "match ",
  "impl ",
  "mod ",
];

const CMD_PREFIXES = [
  "npm ",
  "pnpm ",
  "cargo ",
  "solana ",
  "anchor ",
  "npx ",
  "curl ",
  "sh ",
  "git ",
  "cd ",
  "mkdir ",
  "rustc ",
  "rustup ",
  "yarn ",
  "node ",
  "$ ",
];

function isCodeBlock(text: string): boolean {
  const hasIndicator = CODE_INDICATORS.some((kw) => text.includes(kw));
  const hasCodeSyntax =
    text.includes(";") || text.includes("{") || text.includes("(");
  if (hasIndicator && hasCodeSyntax) return true;
  if (text.includes("\u251C\u2500\u2500") || text.includes("\u2514\u2500\u2500")) return true;
  return false;
}

function isCommandBlock(text: string): boolean {
  const lines = text.split("\n");
  return lines.some((l) => CMD_PREFIXES.some((p) => l.trim().startsWith(p)));
}

function isHeadingLine(line: string): boolean {
  const t = line.trim();
  if (t.length > 80) return false;
  if (/^(Step|Phase)\s+\d+/i.test(t)) return true;
  if (/^[A-Z][^.!?]*:\s*$/.test(t)) return true;
  return false;
}

function isCalloutLabel(line: string): boolean {
  return /^(NEVER|ALWAYS|IMPORTANT|CRITICAL|NOTE|WARNING|TIP|CAUTION)[:\s]/i.test(
    line.trim(),
  );
}

export function V9ContentRenderer({ text }: { text: string }) {
  const blocks = text.split("\n\n");

  return (
    <div>
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (isCodeBlock(trimmed) || isCommandBlock(trimmed)) {
          return (
            <div style={{ marginBottom: "clamp(28px, 4vh, 40px)" }} key={i}>
              <pre
                style={{
                  background: "var(--code-bg)",
                  color: "#e0e0e0",
                  padding: "clamp(16px, 2vh, 24px) clamp(16px, 2vw, 24px)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  lineHeight: 1.7,
                  overflowX: "auto",
                  whiteSpace: "pre-wrap",
                  margin: "clamp(24px, 3vh, 36px) 0",
                  borderLeft: "3px solid var(--xp)",
                }}
              >
                {trimmed}
              </pre>
            </div>
          );
        }

        const lines = trimmed.split("\n").filter((l) => l.trim());

        if (lines.length > 0 && isCalloutLabel(lines[0])) {
          const label = lines[0].trim().replace(/:?\s*$/, "");
          const bodyLines = lines.slice(1);
          return (
            <div
              key={i}
              style={{
                marginBottom: "clamp(28px, 4vh, 40px)",
                padding: "clamp(24px, 3vh, 36px) clamp(24px, 3vw, 40px)",
                background: "rgba(255,255,255,0.03)",
                borderLeft: "3px solid var(--nd-highlight-orange)",
                margin: "clamp(32px, 4vh, 48px) 0",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--nd-highlight-orange)",
                  marginBottom: "12px",
                  fontWeight: 700,
                }}
              >
                {label}
              </div>
              {bodyLines.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {bodyLines.map((line, j) => (
                    <div
                      key={j}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        fontFamily: "var(--font-sans)",
                        fontSize: "clamp(17px, 1.8vw, 20px)",
                        lineHeight: 1.75,
                        color: "var(--c-text-body)",
                        fontWeight: 300,
                      }}
                    >
                      <span style={{ color: "var(--nd-highlight-orange)" }}>&#x25B8;</span>
                      <span>
                        {renderInline(
                          line
                            .replace(/^[•\-*]\s+/, "")
                            .replace(/^\d+[.)]\s+/, ""),
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        const bulletLines = lines.filter(
          (l) => BULLET_RE.test(l.trim()) || NUMBERED_RE.test(l.trim()),
        );
        const hasMixedList =
          bulletLines.length >= 2 &&
          bulletLines.length >= lines.length - 1 &&
          lines.length > 1;

        if (hasMixedList) {
          const headerLines = lines.filter(
            (l) => !BULLET_RE.test(l.trim()) && !NUMBERED_RE.test(l.trim()),
          );
          const isNumbered = bulletLines.every((l) =>
            NUMBERED_RE.test(l.trim()),
          );

          return (
            <div style={{ marginBottom: "clamp(28px, 4vh, 40px)" }} key={i}>
              {headerLines.length > 0 && (
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "clamp(18px, 2vw, 22px)",
                    fontWeight: 600,
                    color: "var(--foreground)",
                    lineHeight: 1.4,
                    marginBottom: "12px",
                  }}
                >
                  {renderInline(headerLines.join(" "))}
                </p>
              )}
              {isNumbered ? (
                <ol
                  style={{
                    listStyle: "none",
                    counterReset: "ordered",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    padding: 0,
                    margin: 0,
                  }}
                >
                  {bulletLines.map((line, j) => (
                    <li
                      key={j}
                      style={{
                        counterIncrement: "ordered",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        fontFamily: "var(--font-sans)",
                        fontSize: "clamp(17px, 1.8vw, 20px)",
                        lineHeight: 1.75,
                        color: "var(--c-text-body)",
                        fontWeight: 300,
                      }}
                    >
                      {renderInline(line.trim().replace(/^\d+[.)]\s+/, ""))}
                    </li>
                  ))}
                </ol>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {bulletLines.map((line, j) => (
                    <div
                      key={j}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        fontFamily: "var(--font-sans)",
                        fontSize: "clamp(17px, 1.8vw, 20px)",
                        lineHeight: 1.75,
                        color: "var(--c-text-body)",
                        fontWeight: 300,
                      }}
                    >
                      <span style={{ color: "var(--nd-highlight-orange)" }}>&#x25B8;</span>
                      <span>
                        {renderInline(line.trim().replace(/^[•\-*]\s+/, ""))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        if (lines.length > 1 && lines.every((l) => BULLET_RE.test(l.trim()))) {
          return (
            <div
              key={i}
              style={{
                marginBottom: "clamp(28px, 4vh, 40px)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {lines.map((line, j) => (
                <div
                  key={j}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    fontFamily: "var(--font-sans)",
                    fontSize: "clamp(17px, 1.8vw, 20px)",
                    lineHeight: 1.75,
                    color: "var(--c-text-body)",
                    fontWeight: 300,
                  }}
                >
                  <span style={{ color: "var(--nd-highlight-orange)" }}>&#x25B8;</span>
                  <span>
                    {renderInline(line.trim().replace(/^[•\-*]\s+/, ""))}
                  </span>
                </div>
              ))}
            </div>
          );
        }

        if (
          lines.length > 1 &&
          lines.every((l) => NUMBERED_RE.test(l.trim()))
        ) {
          return (
            <div style={{ marginBottom: "clamp(28px, 4vh, 40px)" }} key={i}>
              <ol
                style={{
                  listStyle: "none",
                  counterReset: "ordered",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  padding: 0,
                  margin: 0,
                }}
              >
                {lines.map((line, j) => (
                  <li
                    key={j}
                    style={{
                      counterIncrement: "ordered",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontFamily: "var(--font-sans)",
                      fontSize: "clamp(17px, 1.8vw, 20px)",
                      lineHeight: 1.75,
                      color: "var(--c-text-body)",
                      fontWeight: 300,
                    }}
                  >
                    {renderInline(line.trim().replace(/^\d+[.)]\s+/, ""))}
                  </li>
                ))}
              </ol>
            </div>
          );
        }

        if (lines.length === 1 && isHeadingLine(lines[0])) {
          return (
            <div style={{ marginBottom: "clamp(28px, 4vh, 40px)" }} key={i}>
              <h3
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "clamp(18px, 2vw, 22px)",
                  fontWeight: 600,
                  color: "var(--foreground)",
                  lineHeight: 1.4,
                  marginBottom: "12px",
                }}
              >
                {renderInline(lines[0].trim().replace(/:$/, ""))}
              </h3>
            </div>
          );
        }

        if (lines.length > 1 && isHeadingLine(lines[0])) {
          const heading = lines[0].trim().replace(/:$/, "");
          const rest = lines.slice(1);
          return (
            <div style={{ marginBottom: "clamp(28px, 4vh, 40px)" }} key={i}>
              <h3
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "clamp(18px, 2vw, 22px)",
                  fontWeight: 600,
                  color: "var(--foreground)",
                  lineHeight: 1.4,
                  marginBottom: "12px",
                }}
              >
                {renderInline(heading)}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "clamp(17px, 1.8vw, 20px)",
                  lineHeight: 1.75,
                  color: "var(--c-text-body)",
                  fontWeight: 300,
                }}
              >
                {rest.map((line, j) => (
                  <span key={j}>
                    {j > 0 && <br />}
                    {renderInline(line)}
                  </span>
                ))}
              </p>
            </div>
          );
        }

        return (
          <div style={{ marginBottom: "clamp(28px, 4vh, 40px)" }} key={i}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "clamp(17px, 1.8vw, 20px)",
                lineHeight: 1.75,
                color: "var(--c-text-body)",
                fontWeight: 300,
              }}
            >
              {lines.map((line, j) => (
                <span key={j}>
                  {j > 0 && <br />}
                  {renderInline(line)}
                </span>
              ))}
            </p>
          </div>
        );
      })}
    </div>
  );
}
