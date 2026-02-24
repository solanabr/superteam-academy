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
      <code className="v9-inline-code" key={`ic-${key++}`}>
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
            <div className="v9-content-block" key={i}>
              <pre className="v9-content-code">{trimmed}</pre>
            </div>
          );
        }

        const lines = trimmed.split("\n").filter((l) => l.trim());

        if (lines.length > 0 && isCalloutLabel(lines[0])) {
          const label = lines[0].trim().replace(/:?\s*$/, "");
          const bodyLines = lines.slice(1);
          return (
            <div className="v9-content-block v9-content-callout" key={i}>
              <div className="v9-callout-label">{label}</div>
              {bodyLines.length > 0 && (
                <div className="v9-content-bullets">
                  {bodyLines.map((line, j) => (
                    <div className="v9-content-bullet" key={j}>
                      <span className="v9-content-bullet-marker">&#x25B8;</span>
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
            <div className="v9-content-block" key={i}>
              {headerLines.length > 0 && (
                <p className="v9-content-subheading">
                  {renderInline(headerLines.join(" "))}
                </p>
              )}
              {isNumbered ? (
                <ol className="v9-content-ordered">
                  {bulletLines.map((line, j) => (
                    <li className="v9-content-ordered-item" key={j}>
                      {renderInline(line.trim().replace(/^\d+[.)]\s+/, ""))}
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="v9-content-bullets">
                  {bulletLines.map((line, j) => (
                    <div className="v9-content-bullet" key={j}>
                      <span className="v9-content-bullet-marker">&#x25B8;</span>
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
            <div className="v9-content-block v9-content-bullets" key={i}>
              {lines.map((line, j) => (
                <div className="v9-content-bullet" key={j}>
                  <span className="v9-content-bullet-marker">&#x25B8;</span>
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
            <div className="v9-content-block" key={i}>
              <ol className="v9-content-ordered">
                {lines.map((line, j) => (
                  <li className="v9-content-ordered-item" key={j}>
                    {renderInline(line.trim().replace(/^\d+[.)]\s+/, ""))}
                  </li>
                ))}
              </ol>
            </div>
          );
        }

        if (lines.length === 1 && isHeadingLine(lines[0])) {
          return (
            <div className="v9-content-block" key={i}>
              <h3 className="v9-content-heading">
                {renderInline(lines[0].trim().replace(/:$/, ""))}
              </h3>
            </div>
          );
        }

        if (lines.length > 1 && isHeadingLine(lines[0])) {
          const heading = lines[0].trim().replace(/:$/, "");
          const rest = lines.slice(1);
          return (
            <div className="v9-content-block" key={i}>
              <h3 className="v9-content-heading">{renderInline(heading)}</h3>
              <p className="v9-content-text">
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
          <div className="v9-content-block" key={i}>
            <p className="v9-content-text">
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
