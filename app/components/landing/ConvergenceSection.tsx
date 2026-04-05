// Silhouette avatars for doom-scroll cards — abstract head shapes
function DoomAvatar({ variant }: { variant: number }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="14" cy="14" r="14" fill="var(--paper-dark)" />
      {variant === 0 && (
        /* Tall swooping hair — Trump-like */
        <g fill="var(--ink-light)">
          <ellipse cx="14" cy="16" rx="6" ry="7" />
          <path d="M8 13c0-4 2-7 6-7s6 2 6 5c0 1-.5 2-1.5 2-.5 0-1-.3-1-.8 0-.5.2-1 .2-1.5 0-2-1.5-3-3.7-3C11 8 9.5 10 9.5 12c0 .5.1 1 .1 1.5H8.2c-.1-.2-.2-.5-.2-.5z" />
          <path d="M20 11c1-3-1-6-3-7 2 0 4 2 4 5 0 1-.3 2-1 2z" />
          <rect x="9" y="22" width="10" height="4" rx="2" />
        </g>
      )}
      {variant === 1 && (
        /* Angular face, short hair — Musk-like */
        <g fill="var(--ink-light)">
          <path d="M9 12c0-3.5 2.5-6 5-6s5 2.5 5 6c0 2-1 4-2 5l-1 2h-4l-1-2c-1-1-2-3-2-5z" />
          <path d="M10 10c0-2 1.5-4.5 4-4.5S18 8 18 10c0 .5-.2 1-.5 1h-7c-.3 0-.5-.5-.5-1z" />
          <rect x="10" y="22" width="8" height="4" rx="2" />
        </g>
      )}
      {variant === 2 && (
        /* Bald round head, thick neck — Rogan-like */
        <g fill="var(--ink-light)">
          <circle cx="14" cy="13" r="6" />
          <rect x="10.5" y="18" width="7" height="3" rx="1" />
          <rect x="9" y="22" width="10" height="4" rx="2" />
        </g>
      )}
      {variant === 3 && (
        /* Wild curly hair + glasses — pundit */
        <g fill="var(--ink-light)">
          <ellipse cx="14" cy="15" rx="5.5" ry="6" />
          <path d="M7 10c0-1 1-4 3-5 1.5-1 3-1.5 4-1.5s2.5.5 4 1.5c2 1 3 4 3 5 0 .5-.5 1-1 .5-.5-1-1.5-3-3-4-1-.5-2-.5-3-.5s-2 0-3 .5c-1.5 1-2.5 3-3 4-.5.5-1 0-1-.5z" />
          <circle cx="11.5" cy="14" r="2" fill="var(--paper-dark)" />
          <circle cx="16.5" cy="14" r="2" fill="var(--paper-dark)" />
          <circle cx="11.5" cy="14" r="1.3" fill="var(--ink-light)" />
          <circle cx="16.5" cy="14" r="1.3" fill="var(--ink-light)" />
          <line x1="13.5" y1="14" x2="14.5" y2="14" stroke="var(--paper-dark)" strokeWidth="0.8" />
          <rect x="10" y="22" width="8" height="4" rx="2" />
        </g>
      )}
      {variant === 4 && (
        /* Slicked-back hair + beard — podcast bro */
        <g fill="var(--ink-light)">
          <ellipse cx="14" cy="14.5" rx="5.5" ry="6.5" />
          <path d="M9 11c.5-3 2.5-5 5-5s4.5 2 5 5c.1.5-.2.8-.5.5-.5-.5-1.5-2-2.5-2.5-1-.4-2-.4-2-.4s-1 0-2 .4C11 9.5 10 11 9.5 11.5c-.3.3-.6 0-.5-.5z" />
          <ellipse cx="14" cy="20" rx="3.5" ry="2" />
          <rect x="10" y="22" width="8" height="4" rx="2" />
        </g>
      )}
      {variant === 5 && (
        /* Pompadour / big hair — media personality */
        <g fill="var(--ink-light)">
          <ellipse cx="14" cy="16" rx="5" ry="6" />
          <path d="M9 12c0-5 2-8 5-8s5 3 5 8c0 .5-.3.8-.6.4-.5-.8-1-2.5-2-3.5-.8-.7-1.5-1-2.4-1s-1.6.3-2.4 1c-1 1-1.5 2.7-2 3.5-.3.4-.6.1-.6-.4z" />
          <rect x="10" y="22" width="8" height="4" rx="2" />
        </g>
      )}
      {variant === 6 && (
        /* Spiky messy hair — edgy tech bro */
        <g fill="var(--ink-light)">
          <ellipse cx="14" cy="15.5" rx="5" ry="6" />
          <path d="M9 13l1-4 1.5 2 1-3 1.5 2.5L15.5 7l1 3.5L18 8l1 3 .5-1c.3 1 .5 2 .5 3h-11z" />
          <rect x="10" y="22" width="8" height="4" rx="2" />
        </g>
      )}
      {variant === 7 && (
        /* Buzz cut + earrings — culture war commentator */
        <g fill="var(--ink-light)">
          <ellipse cx="14" cy="14" rx="5.5" ry="6.5" />
          <path d="M9 11c0-2.5 2.2-5 5-5s5 2.5 5 5c0 .3-.1.5-.3.5H9.3c-.2 0-.3-.2-.3-.5z" />
          <circle cx="8" cy="15" r="1.2" />
          <circle cx="20" cy="15" r="1.2" />
          <rect x="10" y="22" width="8" height="4" rx="2" />
        </g>
      )}
    </svg>
  );
}

const DOOM_CARDS = [
  { text: "Hot take: everything you know about this is wrong", metrics: "2.1K · 847 · 12K" },
  { text: "I can't believe people still think this in 2026", metrics: "938 · 412 · 5.6K" },
  { text: "Unpopular opinion thread 🧵👇", metrics: "1.4K · 623 · 8.2K" },
  { text: "This might be the worst take I've ever seen", metrics: "3.2K · 1.1K · 15K" },
  { text: "We need to talk about what happened yesterday", metrics: "756 · 389 · 4.1K" },
  { text: "Ratio + L + nobody asked", metrics: "2.8K · 901 · 9.4K" },
  { text: "Why is nobody talking about this", metrics: "1.7K · 534 · 7.1K" },
  { text: "Thread: I did the research so you don't have to 🧵", metrics: "4.1K · 1.8K · 22K" },
];

const STEM_CARDS = [
  { emoji: "🎵", title: "Jazz lineage", author: "@jamie", artifactCount: 12, topArtifact: "Miles Davis and the Birth of Cool" },
  { emoji: "🌿", title: "Urban foraging", author: "@dan", artifactCount: 8, topArtifact: "A beginner's guide to wild garlic" },
  { emoji: "🎬", title: "New wave cinema", author: "@priya", artifactCount: 15, topArtifact: "Godard's jump cuts, deconstructed" },
  { emoji: "🏛️", title: "Byzantine architecture", author: "@claudia", artifactCount: 9, topArtifact: "Hagia Sophia's pendentive dome" },
  { emoji: "🧪", title: "Fermentation science", author: "@mike", artifactCount: 6, topArtifact: "The microbiology of sourdough" },
];

export function ConvergenceSection() {
  return (
    <section style={s.section} className="convergence-section">
      <p style={s.label}>Feed your curiosity</p>
      <h2 style={s.heading}>From brainrot to breadcrumbs</h2>

      <div style={s.columns} className="convergence-columns">
        {/* Doom feed */}
        <div style={s.column}>
          <p style={s.columnLabel}>You know this timeline</p>
          <div style={s.feedColumn}>
            {DOOM_CARDS.map((card, i) => (
              <div key={i} style={s.doomCard}>
                <DoomAvatar variant={i} />
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
          <p style={s.columnLabel}>Imagine this instead</p>
          <div style={s.feedColumn}>
            {STEM_CARDS.map((card, i) => (
              <div key={i} style={s.stemCard}>
                <div style={s.stemTop}>
                  <span style={s.stemEmoji}>{card.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={s.stemTitle}>{card.title}</p>
                    <p style={s.stemMeta}>{card.author} · {card.artifactCount} artifacts</p>
                  </div>
                </div>
                <p style={s.stemArtifact}>{card.topArtifact}</p>
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
    marginBottom: 36,
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
  stemArtifact: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    color: "var(--ink-mid)",
    paddingLeft: 32,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};
