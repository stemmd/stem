const DOOM_CARDS = [
  { text: "Hot take: everything you know about this is wrong", metrics: "2.1K · 847 · 12K" },
  { text: "I can't believe people still think this in 2026", metrics: "938 · 412 · 5.6K" },
  { text: "Unpopular opinion thread 🧵👇", metrics: "1.4K · 623 · 8.2K" },
  { text: "This might be the worst take I've ever seen", metrics: "3.2K · 1.1K · 15K" },
  { text: "We need to talk about what happened yesterday", metrics: "756 · 389 · 4.1K" },
];

const STEM_CARDS = [
  { emoji: "🎵", title: "Jazz lineage", author: "@jamie", findCount: 12, topFind: "Miles Davis and the Birth of Cool" },
  { emoji: "🌿", title: "Urban foraging", author: "@dan", findCount: 8, topFind: "A beginner's guide to wild garlic" },
  { emoji: "🎬", title: "New wave cinema", author: "@priya", findCount: 15, topFind: "Godard's jump cuts, deconstructed" },
  { emoji: "🏛️", title: "Byzantine architecture", author: "@claudia", findCount: 9, topFind: "Hagia Sophia's pendentive dome" },
  { emoji: "🧪", title: "Fermentation science", author: "@mike", findCount: 6, topFind: "The microbiology of sourdough" },
];

export function ConvergenceSection() {
  return (
    <section style={s.section}>
      <p style={s.label}>The problem</p>
      <h2 style={s.heading}>You know this scroll</h2>

      <div style={s.columns} className="convergence-columns">
        {/* Doom feed */}
        <div style={s.column}>
          <div style={s.feedColumn}>
            {DOOM_CARDS.map((card, i) => (
              <div key={i} style={s.doomCard}>
                <div style={s.doomAvatar} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={s.doomText}>{card.text}</p>
                  <p style={s.doomMetrics}>
                    <span style={s.doomMetricIcon}>💬</span>
                    <span style={s.doomMetricIcon}>🔁</span>
                    <span style={s.doomMetricIcon}>❤️</span>
                    <span style={s.doomMetricNum}>{card.metrics}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stem feed */}
        <div style={s.column}>
          <p style={s.columnLabel}>What if it felt like this instead?</p>
          <div style={s.feedColumn}>
            {STEM_CARDS.map((card, i) => (
              <div key={i} style={s.stemCard}>
                <div style={s.stemTop}>
                  <span style={s.stemEmoji}>{card.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={s.stemTitle}>{card.title}</p>
                    <p style={s.stemMeta}>{card.author} · {card.findCount} finds</p>
                  </div>
                </div>
                <p style={s.stemFind}>{card.topFind}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const s: Record<string, React.CSSProperties> = {
  section: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "80px 40px 60px",
    textAlign: "center",
  },
  label: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--forest)",
    marginBottom: 14,
  },
  heading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
    lineHeight: 1.18,
    color: "var(--ink)",
    letterSpacing: "-0.01em",
    marginBottom: 48,
  },
  columns: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 32,
    alignItems: "start",
  },
  column: {},
  columnLabel: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(1rem, 1.8vw, 1.2rem)",
    color: "var(--ink-mid)",
    fontStyle: "italic",
    marginBottom: 16,
    textAlign: "center",
  },
  feedColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  // Doom cards
  doomCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    background: "var(--surface, var(--paper))",
    border: "1px solid var(--paper-dark)",
    borderRadius: 12,
    padding: "12px 14px",
    textAlign: "left",
  },
  doomAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "var(--paper-dark)",
    flexShrink: 0,
  },
  doomText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: "var(--ink)",
    lineHeight: 1.4,
    marginBottom: 6,
  },
  doomMetrics: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    color: "var(--ink-light)",
  },
  doomMetricIcon: { fontSize: 8 },
  doomMetricNum: { fontSize: 9, color: "var(--ink-light)" },

  // Stem cards
  stemCard: {
    background: "var(--surface, var(--paper))",
    border: "1px solid var(--paper-dark)",
    borderRadius: 14,
    padding: "14px 16px",
    textAlign: "left",
  },
  stemTop: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  stemEmoji: {
    fontSize: 22,
    lineHeight: 1,
    flexShrink: 0,
  },
  stemTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 14,
    color: "var(--ink)",
    lineHeight: 1.2,
  },
  stemMeta: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    color: "var(--ink-light)",
    marginTop: 2,
  },
  stemFind: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    color: "var(--ink-mid)",
    paddingLeft: 32,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};
