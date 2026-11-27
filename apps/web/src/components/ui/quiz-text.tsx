/** Text and inline code spans, split the way CommonMark pairs backtick runs. */
export function splitInlineCode(
  text: string
): { code: boolean; text: string }[] {
  const parts: { code: boolean; text: string }[] = [];
  const runs = [...text.matchAll(/`+/g)];
  let plainFrom = 0;
  let next = 0;
  while (next < runs.length) {
    const open = runs[next]!;
    const closeAt = runs.findIndex(
      (run, i) => i > next && run[0].length === open[0].length
    );
    if (closeAt === -1) {
      next += 1;
      continue;
    }
    const close = runs[closeAt]!;
    const body = text.slice(open.index + open[0].length, close.index);
    const padded = /^ .* $/s.test(body) && body.trim() !== "";
    if (open.index > plainFrom) {
      parts.push({ code: false, text: text.slice(plainFrom, open.index) });
    }
    parts.push({ code: true, text: padded ? body.slice(1, -1) : body });
    plainFrom = close.index + close[0].length;
    next = closeAt + 1;
  }
  if (plainFrom < text.length) {
    parts.push({ code: false, text: text.slice(plainFrom) });
  }
  return parts;
}

/**
 * Quiz copy is plain text, except that authors write inline code in backticks.
 * Deliberately not Markdown: inside a label, a link would swallow the click and
 * a list or heading would break the layout, so everything else stays the
 * characters the author typed.
 */
export function QuizText({ children }: { children: string }) {
  return splitInlineCode(children).map((part, i) =>
    part.code ? (
      <code
        key={i}
        className="font-mono font-semibold [overflow-wrap:anywhere]"
      >
        {part.text}
      </code>
    ) : (
      part.text
    )
  );
}
