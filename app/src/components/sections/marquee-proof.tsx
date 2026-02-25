"use client";

const QUOTES = [
  '"CHANGED HOW I APPROACH RUST" \u2014 ALEX R.',
  '"THE INTERACTIVE IDE IS INCREDIBLE" \u2014 MARIA S.',
  '"EARNING XP WHILE CODING IS ADDICTIVE" \u2014 CARLOS M.',
];

function MarqueeRow({ reverse }: { reverse?: boolean }) {
  // Duplicate content for seamless loop
  const items = [...QUOTES, ...QUOTES];
  return (
    <div
      className={`marquee-track flex whitespace-nowrap ${reverse ? "marquee-reverse" : ""}`}
      style={{
        fontFamily:
          "var(--font-instrument-serif), 'Instrument Serif', serif",
        fontSize: "clamp(4rem, 8vw, 8rem)",
        fontStyle: "italic",
        color: "transparent",
        WebkitTextStroke: "1px rgba(0,0,0,0.25)",
      }}
    >
      {items.map((q, i) => (
        <span key={i} className="px-8 shrink-0">
          {i % QUOTES.length !== 0 && (
            <span className="px-8 opacity-40">{"\u2605"}</span>
          )}
          {q}
        </span>
      ))}
    </div>
  );
}

export function MarqueeProof() {
  return (
    <section className="py-24 md:py-32 overflow-hidden bg-[#00FFA3]">
      <MarqueeRow />
      <div className="mt-4">
        <MarqueeRow reverse />
      </div>
    </section>
  );
}
