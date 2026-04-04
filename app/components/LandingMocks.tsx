import type React from "react";

// ── Data ─────────────────────────────────────────────────────────────────────

const HERO_STEM = {
  emoji: "🧭",
  title: "The history of mapmaking",
  user: "@mira",
  count: 11,
  category: { emoji: "🏛️", name: "History", tint: "var(--cat-history)" },
  finds: [
    {
      title: "How medieval monks mapped the world",
      domain: "aeon.co",
      type: "Article",
      note: "The Hereford Mappa Mundi is genuinely wild",
    },
    {
      title: "Mercator's projection and its discontents",
      domain: "lrb.co.uk",
      type: "Article",
    },
    {
      title: "The phantom island of Hy-Brasil",
      domain: "atlasobscura.com",
      type: "Article",
      quote:
        "It appeared on charts for centuries before anyone thought to question it",
    },
    {
      title: "Japanese cartography before Western contact",
      domain: "jstor.org",
      type: "Paper",
    },
    {
      title: "How Google Maps decides what to show you",
      domain: "theverge.com",
      type: "Article",
    },
  ],
};

const BEAT1_STEM = {
  emoji: "🔬",
  title: "Fermentation science",
  user: "@lena",
  count: 8,
  category: { emoji: "🔬", name: "Science", tint: "var(--cat-science)" },
  finds: [
    {
      title: "The Art of Fermentation (Sandor Katz)",
      domain: "goodreads.com",
      type: "Book",
    },
    {
      title: "Why lacto-fermentation works",
      domain: "seriouseats.com",
      type: "Article",
    },
    {
      title: "Noma's guide to fermentation",
      domain: "youtube.com",
      type: "Video",
    },
    {
      title: "The microbiome connection",
      domain: "nature.com",
      type: "Paper",
    },
  ],
};

const FEED_GROUPS = [
  {
    emoji: "🎵",
    title: "Jazz lineage",
    user: "@nico",
    time: "3h ago",
    tint: "var(--cat-music)",
    finds: [
      { title: "The Coltrane Changes, explained", domain: "youtube.com" },
      {
        title: "Blue Note Records and the birth of modern jazz",
        domain: "newyorker.com",
      },
    ],
  },
  {
    emoji: "🏛️",
    title: "Brutalist architecture",
    user: "@priya",
    time: "5h ago",
    tint: "var(--cat-architecture)",
    finds: [
      { title: "Why brutalism is having a revival", domain: "dezeen.com" },
      { title: "The Barbican Estate at 40", domain: "guardian.com" },
      { title: "Tadao Ando's concrete poetry", domain: "archdaily.com" },
    ],
  },
];

// ── Type badges ──────────────────────────────────────────────────────────────

const TYPE_EMOJI: Record<string, string> = {
  Article: "📄",
  Video: "🎥",
  Book: "📖",
  Paper: "🔬",
};

// ── Shared sub-components ────────────────────────────────────────────────────

function FindRow({
  title,
  domain,
  type,
  note,
  quote,
  index,
  animated,
}: {
  title: string;
  domain: string;
  type?: string;
  note?: string;
  quote?: string;
  index: number;
  animated?: boolean;
}) {
  return (
    <div
      className="find-row-hover"
      style={{
        ...s.findRow,
        ...(animated
          ? {
              opacity: 0,
              animation: "staggerIn 0.5s ease forwards",
              animationDelay: `${index * 100}ms`,
            }
          : {}),
      }}
    >
      <div style={s.findMain}>
        <span style={s.findTitle}>{title}</span>
        <span style={s.findDomain}>{domain}</span>
      </div>
      {type && (
        <span style={s.findType}>
          {TYPE_EMOJI[type] || "📄"} {type}
        </span>
      )}
      {note && <p style={s.findNote}>{note}</p>}
      {quote && (
        <p style={s.findQuote}>
          &ldquo;{quote}&rdquo;
        </p>
      )}
    </div>
  );
}

// ── InteractiveStemMock (Hero) ───────────────────────────────────────────────

export function InteractiveStemMock() {
  return (
    <div style={s.card}>
      {/* Header */}
      <div style={s.stemHeader}>
        <span style={s.stemEmoji}>{HERO_STEM.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.stemTitle}>{HERO_STEM.title}</div>
          <div style={s.stemMeta}>
            {HERO_STEM.user} · {HERO_STEM.count} finds · public
          </div>
        </div>
      </div>

      {/* Category pill */}
      <div style={s.catRow}>
        <span style={{ ...s.catPill, background: HERO_STEM.category.tint }}>
          {HERO_STEM.category.emoji} {HERO_STEM.category.name}
        </span>
      </div>

      {/* Finds */}
      <div style={s.findList}>
        {HERO_STEM.finds.map((f, i) => (
          <FindRow key={i} {...f} index={i} animated />
        ))}
      </div>

      {/* Footer: follow + typing */}
      <div style={s.cardFooter}>
        <button className="follow-btn" style={s.followBtn} type="button">
          Follow this stem
        </button>
        <div className="typing-indicator" style={s.typingWrap}>
          <span
            className="typing-dot"
            style={{ ...s.typingDot, animationDelay: "0ms" }}
          />
          <span
            className="typing-dot"
            style={{ ...s.typingDot, animationDelay: "150ms" }}
          />
          <span
            className="typing-dot"
            style={{ ...s.typingDot, animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}

// ── StemMock (Beat 1) ────────────────────────────────────────────────────────

export function StemMock() {
  return (
    <div style={s.card}>
      <div style={s.stemHeader}>
        <span style={s.stemEmoji}>{BEAT1_STEM.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.stemTitle}>{BEAT1_STEM.title}</div>
          <div style={s.stemMeta}>
            {BEAT1_STEM.user} · {BEAT1_STEM.count} finds · public
          </div>
        </div>
      </div>

      <div style={s.catRow}>
        <span style={{ ...s.catPill, background: BEAT1_STEM.category.tint }}>
          {BEAT1_STEM.category.emoji} {BEAT1_STEM.category.name}
        </span>
      </div>

      <div style={s.findList}>
        {BEAT1_STEM.finds.map((f, i) => (
          <FindRow key={i} {...f} index={i} />
        ))}
      </div>
    </div>
  );
}

// ── FeedMock (Beat 2) ────────────────────────────────────────────────────────

export function FeedMock() {
  return (
    <div style={s.feedCard}>
      {/* Feed header */}
      <div style={s.feedHeader}>
        <span style={s.feedTitle}>Feed</span>
        <span style={s.feedExplore}>Explore stems</span>
      </div>

      {/* Groups */}
      {FEED_GROUPS.map((g, gi) => (
        <div
          key={gi}
          style={{ ...s.feedGroup, borderLeftColor: g.tint }}
        >
          <div style={s.feedGroupHead}>
            <span style={s.feedGroupEmoji}>{g.emoji}</span>
            <span style={s.feedGroupTitle}>{g.title}</span>
            <span style={s.feedGroupDot}>&middot;</span>
            <span style={s.feedGroupUser}>{g.user}</span>
            <span style={s.feedGroupDot}>&middot;</span>
            <span style={s.feedGroupTime}>{g.time}</span>
          </div>
          {g.finds.map((f, fi) => (
            <div
              key={fi}
              className="find-row-hover"
              style={s.feedFindRow}
            >
              <span style={s.findTitle}>{f.title}</span>
              <span style={s.findDomain}>{f.domain}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── BranchMock (Beat 3) ──────────────────────────────────────────────────────

export function BranchMock() {
  return (
    <div style={{ ...s.card, maxWidth: 380, margin: "0 auto" }}>
      <div style={s.stemHeader}>
        <span style={s.stemEmoji}>🎶</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.stemTitle}>Music theory for producers</div>
          <div style={s.stemMeta}>6 finds · public</div>
        </div>
      </div>

      <div style={s.branchRow}>
        <div style={s.avatarStack}>
          <div
            style={{
              ...s.avatar,
              background: "var(--forest)",
              zIndex: 2,
            }}
          >
            K
          </div>
          <div
            style={{
              ...s.avatar,
              background: "var(--branch)",
              marginLeft: -8,
              zIndex: 1,
            }}
          >
            S
          </div>
        </div>
        <span style={s.branchUsers}>@kai + @sol</span>
        <span style={s.branchBadge}>Branch</span>
      </div>
    </div>
  );
}

// ── ChromeExtensionMock (Beat 4) ─────────────────────────────────────────────

function StemLogoMini() {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: 14, height: 14, color: "var(--forest)" }}
    >
      <line
        x1="32"
        y1="68"
        x2="32"
        y2="42"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="20"
        x2="32"
        y2="42"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M32 42 Q46 38 52 28"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function ChromeExtensionMock() {
  return (
    <div style={s.browserFrame}>
      {/* Browser toolbar */}
      <div style={s.browserBar}>
        <div style={s.browserDots}>
          <span style={{ ...s.browserDot, background: "#FF5F57" }} />
          <span style={{ ...s.browserDot, background: "#FFBD2E" }} />
          <span style={{ ...s.browserDot, background: "#28C840" }} />
        </div>
        <div style={s.addressBar}>
          <span style={s.addressText}>medium.com/article...</span>
        </div>
        <div style={s.extensionIcon}>
          <StemLogoMini />
        </div>
      </div>

      {/* Page content area */}
      <div style={s.browserPage} />

      {/* Popover card */}
      <div style={s.popover}>
        <div style={s.popoverTitle}>Save to stem</div>
        <div style={s.popoverStem}>🧭 The history of mapmaking</div>
        <div style={s.popoverBtn}>Save find</div>
      </div>
    </div>
  );
}

// ── IOSAppMock (Beat 4) ──────────────────────────────────────────────────────

export function IOSAppMock() {
  const cards = [
    { emoji: "🧭", w1: "75%", w2: "50%" },
    { emoji: "🎵", w1: "65%", w2: "40%" },
    { emoji: "🔬", w1: "70%", w2: "45%" },
  ];

  return (
    <div style={s.phoneFrame}>
      <div style={s.phoneScreen}>
        {/* Status bar */}
        <div style={s.phoneStatusBar}>
          <span style={s.phoneTime}>9:41</span>
        </div>

        {/* Feed cards */}
        <div style={s.phoneFeed}>
          {cards.map((c, i) => (
            <div key={i} style={s.phoneCard}>
              <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>
                {c.emoji}
              </span>
              <div style={s.phoneCardLines}>
                <div
                  style={{
                    ...s.phoneLine,
                    width: c.w1,
                    background: "var(--ink)",
                  }}
                />
                <div
                  style={{
                    ...s.phoneLine,
                    width: c.w2,
                    background: "var(--ink-light)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  // ── Card shell ─────────────────────────────────────────────────────────────
  card: {
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 20,
    padding: 32,
    boxShadow:
      "0 1px 2px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.08), 0 24px 60px rgba(0,0,0,0.04)",
    maxWidth: 500,
    width: "100%",
  },

  // ── Stem header ────────────────────────────────────────────────────────────
  stemHeader: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    marginBottom: 14,
  },
  stemEmoji: {
    fontSize: 36,
    lineHeight: 1,
    flexShrink: 0,
  },
  stemTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 21,
    color: "var(--ink)",
    lineHeight: 1.3,
  },
  stemMeta: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--ink-light)",
    marginTop: 4,
    letterSpacing: "0.01em",
  },

  // ── Category pill ──────────────────────────────────────────────────────────
  catRow: {
    marginBottom: 18,
  },
  catPill: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    fontWeight: 500,
    color: "var(--forest)",
    padding: "4px 12px",
    borderRadius: 20,
    display: "inline-block",
    letterSpacing: "0.01em",
  },

  // ── Find rows ──────────────────────────────────────────────────────────────
  findList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  },
  findRow: {
    padding: 10,
    borderRadius: 8,
    transition: "background 0.15s ease",
    cursor: "default",
  },
  findMain: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 12,
  },
  findTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13.5,
    color: "var(--ink)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    minWidth: 0,
    flex: 1,
    transition: "color 0.15s ease",
  },
  findDomain: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10.5,
    color: "var(--ink-light)",
    flexShrink: 0,
    letterSpacing: "0.01em",
  },
  findType: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: "var(--ink-light)",
    marginTop: 3,
    display: "block",
    letterSpacing: "0.02em",
  },
  findNote: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: "var(--ink-mid)",
    fontStyle: "italic" as const,
    marginTop: 6,
    lineHeight: 1.55,
    margin: "6px 0 0 0",
  },
  findQuote: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 12,
    color: "var(--ink-mid)",
    fontStyle: "italic" as const,
    marginTop: 6,
    lineHeight: 1.55,
    paddingLeft: 12,
    borderLeft: "2px solid var(--paper-dark)",
    margin: "6px 0 0 0",
  },

  // ── Follow button + typing indicator ───────────────────────────────────────
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTop: "1px solid var(--paper-mid)",
  },
  followBtn: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    fontWeight: 500,
    color: "var(--forest)",
    background: "transparent",
    border: "1px solid var(--forest)",
    borderRadius: 20,
    padding: "6px 16px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    lineHeight: 1.4,
  },
  typingWrap: {
    display: "flex",
    gap: 4,
    alignItems: "center",
    opacity: 0,
    animation: "typingAppear 0.4s ease forwards 0.8s",
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: "50%",
    background: "var(--ink-light)",
    animation: "bounce 1.2s ease infinite",
  },

  // ── Feed mock ──────────────────────────────────────────────────────────────
  feedCard: {
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 20,
    padding: 28,
    boxShadow:
      "0 1px 2px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.08), 0 24px 60px rgba(0,0,0,0.04)",
    maxWidth: 500,
    width: "100%",
  },
  feedHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 24,
  },
  feedTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 20,
    color: "var(--ink)",
  },
  feedExplore: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    fontWeight: 500,
    color: "var(--forest)",
    letterSpacing: "0.01em",
  },
  feedGroup: {
    borderLeft: "3px solid",
    paddingLeft: 14,
    marginBottom: 24,
  },
  feedGroupHead: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 6,
    alignItems: "baseline",
    marginBottom: 10,
  },
  feedGroupEmoji: {
    fontSize: 14,
  },
  feedGroupTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--ink)",
  },
  feedGroupDot: {
    color: "var(--ink-light)",
    fontSize: 11,
  },
  feedGroupUser: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--ink-light)",
  },
  feedGroupTime: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--ink-light)",
  },
  feedFindRow: {
    padding: "6px 10px",
    borderRadius: 8,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 12,
    transition: "background 0.15s ease",
    cursor: "default",
  },

  // ── Branch mock ────────────────────────────────────────────────────────────
  branchRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTop: "1px solid var(--paper-mid)",
  },
  avatarStack: {
    display: "flex",
    alignItems: "center",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    color: "#fff",
    border: "2px solid var(--surface)",
    position: "relative" as const,
  },
  branchUsers: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--ink-light)",
    flex: 1,
  },
  branchBadge: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--forest)",
    background: "var(--leaf)",
    padding: "3px 10px",
    borderRadius: 12,
    flexShrink: 0,
    letterSpacing: "0.01em",
  },

  // ── Chrome extension mock ──────────────────────────────────────────────────
  browserFrame: {
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow:
      "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)",
    position: "relative" as const,
  },
  browserBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    background: "var(--paper-mid)",
    borderBottom: "1px solid var(--paper-dark)",
  },
  browserDots: {
    display: "flex",
    gap: 6,
    flexShrink: 0,
  },
  browserDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },
  addressBar: {
    flex: 1,
    background: "var(--surface)",
    borderRadius: 6,
    padding: "5px 10px",
  },
  addressText: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--ink-light)",
  },
  extensionIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--leaf)",
    flexShrink: 0,
  },
  browserPage: {
    height: 60,
    background: "var(--paper-mid)",
  },
  popover: {
    position: "absolute" as const,
    top: 48,
    right: 14,
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 10,
    padding: 14,
    boxShadow:
      "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.1)",
    minWidth: 180,
    zIndex: 2,
  },
  popoverTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--ink)",
    marginBottom: 8,
  },
  popoverStem: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: "var(--ink-mid)",
    marginBottom: 12,
  },
  popoverBtn: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    fontWeight: 500,
    color: "#fff",
    background: "var(--forest)",
    padding: "6px 14px",
    borderRadius: 6,
    textAlign: "center" as const,
    cursor: "default",
  },

  // ── iOS app mock ───────────────────────────────────────────────────────────
  phoneFrame: {
    width: 180,
    border: "2px solid var(--paper-dark)",
    borderRadius: 28,
    overflow: "hidden",
    background: "var(--surface)",
    margin: "0 auto",
    boxShadow:
      "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)",
  },
  phoneScreen: {
    padding: "0 12px 16px",
  },
  phoneStatusBar: {
    display: "flex",
    justifyContent: "center",
    padding: "10px 0 14px",
  },
  phoneTime: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    color: "var(--ink)",
    letterSpacing: "0.02em",
  },
  phoneFeed: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  phoneCard: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    padding: 10,
    background: "var(--paper-mid)",
    borderRadius: 10,
  },
  phoneCardLines: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 5,
    flex: 1,
  },
  phoneLine: {
    height: 6,
    borderRadius: 3,
  },
};
