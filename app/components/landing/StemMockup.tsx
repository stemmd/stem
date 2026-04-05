import { useEffect, useState } from "react";

interface Find {
  title: string;
  domain: string;
}

interface StemMockupProps {
  emoji?: string;
  title?: string;
  meta?: string;
  finds?: Find[];
  animated?: boolean;
  hoverable?: boolean;
  contributors?: string[];
}

const DEFAULT_FINDS: Find[] = [
  { title: "Hagia Sophia's pendentive dome, explained", domain: "archdaily.com" },
  { title: "Why Justinian's mosaics still mesmerize", domain: "aeon.co" },
  { title: "The lost churches of Constantinople", domain: "jstor.org" },
  { title: "Byzantine influence on Islamic architecture", domain: "khanacademy.org" },
  { title: "Reading the Theodosian Walls today", domain: "atlasobscura.com" },
];

export function StemMockup({
  emoji = "🏛️",
  title = "Byzantine architecture",
  meta,
  finds = DEFAULT_FINDS,
  animated = false,
  hoverable = false,
  contributors,
}: StemMockupProps) {
  const [visibleCount, setVisibleCount] = useState(animated ? 0 : finds.length);

  useEffect(() => {
    if (!animated) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    finds.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), 1200 + i * 400));
    });
    return () => timers.forEach(clearTimeout);
  }, [animated, finds.length]);

  const metaText =
    meta ??
    (contributors
      ? `${contributors.map((c) => `@${c}`).join(" + ")} · ${finds.length} finds`
      : `@amrith · ${finds.length} finds · public`);

  return (
    <div style={s.wrap}>
      <div style={s.top}>
        <span style={s.emoji}>{emoji}</span>
        <div>
          <p style={s.title}>{title}</p>
          <p style={s.meta}>{metaText}</p>
        </div>
      </div>
      {contributors && (
        <div style={s.branchBadge}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8" cy="13" r="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 6v2a3 3 0 003 3h2a3 3 0 003-3V6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span>Branch</span>
        </div>
      )}
      <div style={s.rule} />
      <div style={s.findList}>
        {finds.map((f, i) => (
          <div
            key={f.title}
            className={hoverable ? "landing-find-row" : undefined}
            style={{
              ...s.findRow,
              opacity: i < visibleCount ? 1 : 0,
              transform: i < visibleCount ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 0.5s ease, transform 0.5s ease, background 0.15s, padding-left 0.15s",
            }}
          >
            <span style={s.findTitle}>{f.title}</span>
            <span style={s.findDomain}>{f.domain}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    background: "var(--surface, var(--paper))",
    border: "1px solid var(--paper-dark)",
    borderRadius: 18,
    padding: 28,
    boxShadow: "0 8px 32px rgba(28, 26, 23, 0.08)",
    width: "100%",
    maxWidth: 360,
    boxSizing: "border-box",
  },
  top: { display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 },
  emoji: { fontSize: 36, lineHeight: 1, flexShrink: 0, marginTop: 2 },
  title: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 20,
    color: "var(--ink)",
    lineHeight: 1.2,
  },
  meta: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--ink-light)",
    marginTop: 5,
  },
  branchBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: "var(--forest)",
    background: "var(--paper-mid)",
    borderRadius: 6,
    padding: "3px 8px",
    marginBottom: 12,
    marginTop: -8,
  },
  rule: { height: 1, background: "var(--paper-dark)", marginBottom: 16 },
  findList: { display: "flex", flexDirection: "column", gap: 10 },
  findRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    borderRadius: 6,
    padding: "2px 0",
  },
  findTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink)",
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  findDomain: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: "var(--ink-light)",
    flexShrink: 0,
  },
};
