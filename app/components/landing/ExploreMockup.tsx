import { useState } from "react";

interface StemCard {
  emoji: string;
  title: string;
  author: string;
  findCount: number;
  finds: string[];
}

const CARDS: StemCard[] = [
  {
    emoji: "🎵",
    title: "Jazz lineage",
    author: "jamie",
    findCount: 12,
    finds: ["Miles Davis and the Birth of Cool", "The Anatomy of a Jazz Standard", "How Coltrane changed harmony"],
  },
  {
    emoji: "🏛️",
    title: "Byzantine architecture",
    author: "claudia",
    findCount: 8,
    finds: ["The Hagia Sophia's engineering secrets", "Pendentives and the dome problem"],
  },
  {
    emoji: "🌿",
    title: "Mycology for beginners",
    author: "dan",
    findCount: 15,
    finds: ["The hidden network beneath forests", "Mushroom identification field guide", "Paul Stamets on fungal intelligence"],
  },
  {
    emoji: "🎬",
    title: "New wave cinema",
    author: "priya",
    findCount: 9,
    finds: ["Godard's jump cuts explained", "The French New Wave manifesto"],
  },
  {
    emoji: "🧬",
    title: "CRISPR explained",
    author: "alex",
    findCount: 11,
    finds: ["Gene editing: a visual guide", "The ethics of CRISPR babies", "Jennifer Doudna's Nobel lecture"],
  },
  {
    emoji: "📐",
    title: "Bauhaus design",
    author: "mika",
    findCount: 7,
    finds: ["Form follows function: a history", "The Bauhaus school's lasting influence"],
  },
];

export function ExploreMockup() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div style={s.grid}>
      {CARDS.map((card, i) => {
        const isExpanded = expandedIndex === i;
        return (
          <button
            key={card.title}
            style={s.card}
            className="explore-card"
            onClick={() => setExpandedIndex(isExpanded ? null : i)}
            aria-expanded={isExpanded}
          >
            <div style={s.cardTop}>
              <span style={s.cardEmoji}>{card.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={s.cardTitle}>{card.title}</p>
                <p style={s.cardMeta}>@{card.author} · {card.findCount} finds</p>
              </div>
            </div>
            <div
              style={{
                maxHeight: isExpanded ? 120 : 0,
                opacity: isExpanded ? 1 : 0,
                overflow: "hidden",
                transition: "max-height 0.35s ease, opacity 0.25s ease",
              }}
            >
              <div style={s.expandedFinds}>
                {card.finds.map((f) => (
                  <p key={f} style={s.expandedFind}>{f}</p>
                ))}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    width: "100%",
  },
  card: {
    background: "var(--surface, var(--paper))",
    border: "1px solid var(--paper-dark)",
    borderRadius: 14,
    padding: "16px 18px",
    textAlign: "left",
    cursor: "pointer",
    transition: "border-color 0.2s, box-shadow 0.2s",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    fontFamily: "inherit",
  },
  cardTop: { display: "flex", alignItems: "flex-start", gap: 10 },
  cardEmoji: { fontSize: 22, lineHeight: 1, flexShrink: 0 },
  cardTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 14,
    color: "var(--ink)",
    lineHeight: 1.2,
  },
  cardMeta: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: "var(--ink-light)",
    marginTop: 3,
  },
  expandedFinds: {
    borderTop: "1px solid var(--paper-dark)",
    marginTop: 10,
    paddingTop: 8,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  expandedFind: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    color: "var(--ink-mid)",
    lineHeight: 1.4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};
