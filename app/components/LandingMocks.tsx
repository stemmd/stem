import type React from "react";

// ── Data ─────────────────────────────────────────────────────────────────────

const HERO_STEM = {
  emoji: "🧭",
  title: "The history of mapmaking",
  user: "@mira",
  count: 11,
  category: { emoji: "🏛️", name: "History", tint: "var(--cat-history)" },
  finds: [
    { title: "How medieval monks mapped the world", domain: "aeon.co", type: "Article", note: "The Hereford Mappa Mundi is genuinely wild" },
    { title: "Mercator's projection and its discontents", domain: "lrb.co.uk", type: "Article" },
    { title: "The phantom island of Hy-Brasil", domain: "atlasobscura.com", type: "Article", quote: "It appeared on charts for centuries before anyone thought to question it" },
    { title: "Japanese cartography before Western contact", domain: "jstor.org", type: "Paper" },
    { title: "How Google Maps decides what to show you", domain: "theverge.com", type: "Article" },
  ],
};

const BEAT1_STEM = {
  emoji: "🔬",
  title: "Fermentation science",
  user: "@lena",
  count: 8,
  category: { emoji: "🔬", name: "Science", tint: "var(--cat-science)" },
  finds: [
    { title: "The Art of Fermentation (Sandor Katz)", domain: "goodreads.com", type: "Book" },
    { title: "Why lacto-fermentation works", domain: "seriouseats.com", type: "Article" },
    { title: "Noma's guide to fermentation", domain: "youtube.com", type: "Video" },
    { title: "The microbiome connection", domain: "nature.com", type: "Paper" },
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
      { title: "Blue Note Records and the birth of modern jazz", domain: "newyorker.com" },
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
  Article: "📄", Video: "🎥", Book: "📖", Paper: "🔬",
};

// ── Shared sub-components ────────────────────────────────────────────────────

function FindRow({
  title, domain, type, note, quote, index, animated,
}: {
  title: string; domain: string; type?: string; note?: string; quote?: string;
  index: number; animated?: boolean;
}) {
  return (
    <div
      className="find-row-hover"
      style={{
        ...m.findRow,
        ...(animated ? { opacity: 0, animation: `staggerIn 0.4s ease forwards`, animationDelay: `${index * 80}ms` } : {}),
      }}
    >
      <div style={m.findMain}>
        <span style={m.findTitle}>{title}</span>
        <span style={m.findDomain}>{domain}</span>
      </div>
      {type && (
        <span style={m.findType}>{TYPE_EMOJI[type] || "📄"} {type}</span>
      )}
      {note && <p style={m.findNote}>{note}</p>}
      {quote && <p style={m.findQuote}>"{quote}"</p>}
    </div>
  );
}

// ── InteractiveStemMock (Hero) ───────────────────────────────────────────────

export function InteractiveStemMock() {
  return (
    <div style={m.card}>
      <div style={m.stemHeader}>
        <span style={m.stemEmoji}>{HERO_STEM.emoji}</span>
        <div>
          <div style={m.stemTitle}>{HERO_STEM.title}</div>
          <div style={m.stemMeta}>
            {HERO_STEM.user} · {HERO_STEM.count} finds · public
          </div>
        </div>
      </div>
      <div style={m.catRow}>
        <span style={{ ...m.catPill, background: HERO_STEM.category.tint }}>
          {HERO_STEM.category.emoji} {HERO_STEM.category.name}
        </span>
      </div>
      <div style={m.findList}>
        {HERO_STEM.finds.map((f, i) => (
          <FindRow key={i} {...f} index={i} animated />
        ))}
      </div>
      <div style={m.cardFooter}>
        <button className="follow-btn" style={m.followBtn}>Follow this stem</button>
        <div className="typing-indicator" style={m.typingWrap}>
          <span className="typing-dot" style={{ ...m.typingDot, animationDelay: "0ms" }} />
          <span className="typing-dot" style={{ ...m.typingDot, animationDelay: "150ms" }} />
          <span className="typing-dot" style={{ ...m.typingDot, animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

// ── StemMock (Beat 1) ────────────────────────────────────────────────────────

export function StemMock() {
  return (
    <div style={m.card}>
      <div style={m.stemHeader}>
        <span style={m.stemEmoji}>{BEAT1_STEM.emoji}</span>
        <div>
          <div style={m.stemTitle}>{BEAT1_STEM.title}</div>
          <div style={m.stemMeta}>
            {BEAT1_STEM.user} · {BEAT1_STEM.count} finds · public
          </div>
        </div>
      </div>
      <div style={m.catRow}>
        <span style={{ ...m.catPill, background: BEAT1_STEM.category.tint }}>
          {BEAT1_STEM.category.emoji} {BEAT1_STEM.category.name}
        </span>
      </div>
      <div style={m.findList}>
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
    <div style={m.feedCard}>
      <div style={m.feedHeader}>
        <span style={m.feedTitle}>Feed</span>
        <span style={m.feedExplore}>Explore stems</span>
      </div>
      {FEED_GROUPS.map((g, gi) => (
        <div key={gi} style={{ ...m.feedGroup, borderLeftColor: g.tint }}>
          <div style={m.feedGroupHead}>
            <span style={m.feedGroupEmoji}>{g.emoji}</span>
            <span style={m.feedGroupTitle}>{g.title}</span>
            <span style={m.feedGroupDot}>·</span>
            <span style={m.feedGroupUser}>{g.user}</span>
            <span style={m.feedGroupDot}>·</span>
            <span style={m.feedGroupTime}>{g.time}</span>
          </div>
          {g.finds.map((f, fi) => (
            <div key={fi} className="find-row-hover" style={m.feedFindRow}>
              <span style={m.findTitle}>{f.title}</span>
              <span style={m.findDomain}>{f.domain}</span>
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
    <div style={{ ...m.card, maxWidth: 400, margin: "0 auto" }}>
      <div style={m.stemHeader}>
        <span style={m.stemEmoji}>🎶</span>
        <div>
          <div style={m.stemTitle}>Music theory for producers</div>
          <div style={m.stemMeta}>6 finds · public</div>
        </div>
      </div>
      <div style={m.branchRow}>
        <span style={m.branchBadge}>Branch</span>
        <div style={m.avatarStack}>
          <div style={{ ...m.avatar, background: "var(--forest)", zIndex: 2 }}>K</div>
          <div style={{ ...m.avatar, background: "var(--branch)", marginLeft: -8, zIndex: 1 }}>S</div>
        </div>
        <span style={m.branchUsers}>@kai + @sol</span>
      </div>
    </div>
  );
}

// ── ChromeExtensionMock (Beat 4) ─────────────────────────────────────────────

export function ChromeExtensionMock() {
  return (
    <div style={m.browserFrame}>
      <div style={m.browserBar}>
        <div style={m.browserDots}>
          <span style={{ ...m.browserDot, background: "#FF5F57" }} />
          <span style={{ ...m.browserDot, background: "#FFBD2E" }} />
          <span style={{ ...m.browserDot, background: "#28C840" }} />
        </div>
        <div style={m.addressBar}>
          <span style={m.addressText}>medium.com/article...</span>
        </div>
        <div style={m.extensionIcon}>
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 14, height: 14, color: "var(--forest)" }}>
            <line x1="32" y1="68" x2="32" y2="42" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
            <line x1="32" y1="20" x2="32" y2="42" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
            <path d="M32 42 Q46 38 52 28" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none"/>
          </svg>
        </div>
      </div>
      <div style={m.popover}>
        <div style={m.popoverTitle}>Save to stem</div>
        <div style={m.popoverStem}>🧭 The history of mapmaking</div>
        <div style={m.popoverBtn}>Save find</div>
      </div>
    </div>
  );
}

// ── IOSAppMock (Beat 4) ──────────────────────────────────────────────────────

export function IOSAppMock() {
  return (
    <div style={m.phoneFrame}>
      <div style={m.phoneScreen}>
        <div style={m.phoneStatusBar}>
          <span style={m.phoneTime}>9:41</span>
        </div>
        <div style={m.phoneFeed}>
          <div style={m.phoneCard}>
            <span style={{ fontSize: 14 }}>🧭</span>
            <div style={m.phoneCardLines}>
              <div style={{ ...m.phoneLine, width: "75%", background: "var(--ink)" }} />
              <div style={{ ...m.phoneLine, width: "50%", background: "var(--ink-light)" }} />
            </div>
          </div>
          <div style={m.phoneCard}>
            <span style={{ fontSize: 14 }}>🎵</span>
            <div style={m.phoneCardLines}>
              <div style={{ ...m.phoneLine, width: "60%", background: "var(--ink)" }} />
              <div style={{ ...m.phoneLine, width: "40%", background: "var(--ink-light)" }} />
            </div>
          </div>
          <div style={m.phoneCard}>
            <span style={{ fontSize: 14 }}>🔬</span>
            <div style={m.phoneCardLines}>
              <div style={{ ...m.phoneLine, width: "65%", background: "var(--ink)" }} />
              <div style={{ ...m.phoneLine, width: "45%", background: "var(--ink-light)" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const m: Record<string, React.CSSProperties> = {
  // Card
  card: {
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 16,
    padding: 28,
    boxShadow: "0 8px 48px rgba(0,0,0,0.07)",
    maxWidth: 520,
    width: "100%",
  },

  // Stem header
  stemHeader: { display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 12 },
  stemEmoji: { fontSize: 32, lineHeight: 1 },
  stemTitle: { fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "var(--ink)", lineHeight: 1.3 },
  stemMeta: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--ink-light)", marginTop: 4 },

  // Category
  catRow: { marginBottom: 16 },
  catPill: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "var(--forest)",
    padding: "3px 10px", borderRadius: 20, display: "inline-block",
  },

  // Find rows
  findList: { display: "flex", flexDirection: "column" as const, gap: 2 },
  findRow: {
    padding: "8px 10px", borderRadius: 8,
    transition: "background 0.15s",
    cursor: "default",
  },
  findMain: {
    display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12,
  },
  findTitle: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--ink)",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
    minWidth: 0, flex: 1, transition: "color 0.15s",
  },
  findDomain: {
    fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--ink-light)",
    flexShrink: 0,
  },
  findType: {
    fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--ink-light)",
    marginTop: 2,
  },
  findNote: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--ink-mid)",
    fontStyle: "italic" as const, marginTop: 4, lineHeight: 1.5,
  },
  findQuote: {
    fontFamily: "'DM Serif Display', serif", fontSize: 12, color: "var(--ink-mid)",
    fontStyle: "italic" as const, marginTop: 4, lineHeight: 1.5,
    paddingLeft: 10, borderLeft: "2px solid var(--paper-dark)",
  },

  // Follow + typing
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  followBtn: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500,
    color: "var(--forest)", background: "transparent",
    border: "1px solid var(--forest)", borderRadius: 20,
    padding: "5px 14px", cursor: "pointer",
    transition: "all 0.15s",
  },
  typingWrap: {
    display: "flex", gap: 3, alignItems: "center",
    opacity: 0, animation: "typingAppear 0.4s ease forwards 0.6s",
  },
  typingDot: {
    width: 4, height: 4, borderRadius: "50%",
    background: "var(--ink-light)",
    animation: "bounce 1.2s ease infinite",
  },

  // Feed mock
  feedCard: {
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 8px 48px rgba(0,0,0,0.07)",
    maxWidth: 520,
    width: "100%",
  },
  feedHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "baseline",
    marginBottom: 20,
  },
  feedTitle: { fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "var(--ink)" },
  feedExplore: { fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: "var(--forest)" },
  feedGroup: {
    borderLeft: "3px solid",
    paddingLeft: 14,
    marginBottom: 20,
  },
  feedGroupHead: {
    display: "flex", flexWrap: "wrap" as const, gap: 5, alignItems: "baseline",
    marginBottom: 8,
  },
  feedGroupEmoji: { fontSize: 14 },
  feedGroupTitle: { fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--ink)" },
  feedGroupDot: { color: "var(--ink-light)", fontSize: 11 },
  feedGroupUser: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--ink-light)" },
  feedGroupTime: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--ink-light)" },
  feedFindRow: {
    padding: "5px 8px", borderRadius: 6,
    display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12,
    transition: "background 0.15s", cursor: "default",
  },

  // Branch mock
  branchRow: { display: "flex", alignItems: "center", gap: 10, marginTop: 12 },
  branchBadge: {
    fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--forest)",
    background: "var(--leaf)", padding: "2px 8px", borderRadius: 10,
  },
  avatarStack: { display: "flex", alignItems: "center" },
  avatar: {
    width: 28, height: 28, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
    color: "#fff", border: "2px solid var(--surface)",
  },
  branchUsers: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--ink-light)" },

  // Chrome extension mock
  browserFrame: {
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
    position: "relative" as const,
  },
  browserBar: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 14px",
    background: "var(--paper-mid)",
    borderBottom: "1px solid var(--paper-dark)",
  },
  browserDots: { display: "flex", gap: 5 },
  browserDot: { width: 8, height: 8, borderRadius: "50%" },
  addressBar: {
    flex: 1,
    background: "var(--surface)",
    borderRadius: 6,
    padding: "4px 10px",
  },
  addressText: {
    fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--ink-light)",
  },
  extensionIcon: {
    width: 24, height: 24, borderRadius: 4,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "var(--leaf)",
  },
  popover: {
    position: "absolute" as const,
    top: 44, right: 14,
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 10,
    padding: 14,
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    minWidth: 180,
  },
  popoverTitle: { fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 8 },
  popoverStem: { fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--ink-mid)", marginBottom: 10 },
  popoverBtn: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500,
    color: "#fff", background: "var(--forest)",
    padding: "5px 12px", borderRadius: 6, textAlign: "center" as const,
  },

  // iOS mock
  phoneFrame: {
    width: 180,
    border: "2px solid var(--paper-dark)",
    borderRadius: 24,
    overflow: "hidden",
    background: "var(--surface)",
    margin: "0 auto",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
  },
  phoneScreen: { padding: "0 10px 14px" },
  phoneStatusBar: {
    display: "flex", justifyContent: "center",
    padding: "8px 0 12px",
  },
  phoneTime: { fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: "var(--ink)" },
  phoneFeed: { display: "flex", flexDirection: "column" as const, gap: 8 },
  phoneCard: {
    display: "flex", gap: 8, alignItems: "center",
    padding: "8px 10px",
    background: "var(--paper-mid)",
    borderRadius: 8,
  },
  phoneCardLines: { display: "flex", flexDirection: "column" as const, gap: 4, flex: 1 },
  phoneLine: { height: 6, borderRadius: 3 },
};
