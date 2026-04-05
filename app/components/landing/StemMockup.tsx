import { useEffect, useState } from "react";

interface Find {
  title: string;
  domain: string;
}

export interface StemData {
  emoji: string;
  title: string;
  author: string;
  finds: Find[];
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

export const STEM_POOL: StemData[] = [
  {
    emoji: "🧠", title: "Cognitive science", author: "amrith",
    finds: [
      { title: "How memory consolidation actually works", domain: "nature.com" },
      { title: "The predictive coding framework", domain: "aeon.co" },
      { title: "Embodied cognition: a reading list", domain: "philpapers.org" },
      { title: "The Default Mode Network, explained", domain: "sci.am" },
      { title: "Against Behaviorism (Chomsky, 1959)", domain: "mit.edu" },
    ],
  },
  {
    emoji: "🏛️", title: "Byzantine architecture", author: "claudia",
    finds: [
      { title: "Hagia Sophia's pendentive dome, explained", domain: "archdaily.com" },
      { title: "Why Justinian's mosaics still mesmerize", domain: "aeon.co" },
      { title: "The lost churches of Constantinople", domain: "jstor.org" },
      { title: "Byzantine influence on Islamic architecture", domain: "khanacademy.org" },
      { title: "Reading the Theodosian Walls today", domain: "atlasobscura.com" },
    ],
  },
  {
    emoji: "🌿", title: "Urban foraging", author: "dan",
    finds: [
      { title: "A beginner's guide to wild garlic", domain: "theguardian.com" },
      { title: "Foraging laws by state", domain: "forager.org" },
      { title: "Edible weeds hiding in your backyard", domain: "atlasobscura.com" },
      { title: "How to identify elderflower safely", domain: "woodlandtrust.org" },
      { title: "City foraging: a photo essay", domain: "nytimes.com" },
    ],
  },
  {
    emoji: "🎬", title: "New wave cinema", author: "priya",
    finds: [
      { title: "Godard's jump cuts, deconstructed", domain: "criterion.com" },
      { title: "The French New Wave manifesto", domain: "bfi.org.uk" },
      { title: "Agnès Varda: the grandmother of the wave", domain: "mubi.com" },
      { title: "Why Breathless still feels modern", domain: "rogerebert.com" },
      { title: "New wave influences on Tarantino", domain: "vulture.com" },
    ],
  },
  {
    emoji: "🧬", title: "CRISPR explained", author: "alex",
    finds: [
      { title: "Gene editing: a visual guide", domain: "nature.com" },
      { title: "The ethics of CRISPR babies", domain: "theatlantic.com" },
      { title: "Jennifer Doudna's Nobel lecture", domain: "nobelprize.org" },
      { title: "Base editing vs. prime editing", domain: "broadinstitute.org" },
      { title: "CRISPR in agriculture: what's next", domain: "science.org" },
    ],
  },
  {
    emoji: "📐", title: "Bauhaus design", author: "mika",
    finds: [
      { title: "Form follows function: a history", domain: "dezeen.com" },
      { title: "The Bauhaus school's lasting influence", domain: "moma.org" },
      { title: "Kandinsky's color theory lectures", domain: "jstor.org" },
      { title: "Bauhaus typography, then and now", domain: "typographica.org" },
      { title: "Dessau campus: a walking tour", domain: "archdaily.com" },
    ],
  },
  {
    emoji: "🌊", title: "Deep sea exploration", author: "ray",
    finds: [
      { title: "Mapping the Mariana Trench", domain: "oceanexplorer.noaa.gov" },
      { title: "Bioluminescence at 3,000 meters", domain: "nature.com" },
      { title: "The Trieste dive: a firsthand account", domain: "smithsonianmag.com" },
      { title: "Hydrothermal vents and the origin of life", domain: "science.org" },
      { title: "Deep-sea gigantism explained", domain: "bbc.com" },
    ],
  },
  {
    emoji: "🎭", title: "Commedia dell'arte", author: "sofia",
    finds: [
      { title: "The stock characters explained", domain: "britannica.com" },
      { title: "Harlequin's evolution through centuries", domain: "jstor.org" },
      { title: "Improvisation techniques from the 1500s", domain: "theatrehistory.com" },
      { title: "Commedia's influence on modern sketch comedy", domain: "newyorker.com" },
      { title: "Masks and physicality: a workshop guide", domain: "dramaturgy.co" },
    ],
  },
  {
    emoji: "🔭", title: "Amateur astronomy", author: "neil",
    finds: [
      { title: "Your first telescope: a buying guide", domain: "skyandtelescope.org" },
      { title: "Messier objects for beginners", domain: "nasa.gov" },
      { title: "Astrophotography with a phone", domain: "petapixel.com" },
      { title: "Light pollution maps and dark sky sites", domain: "darksitefinder.com" },
      { title: "How to spot the ISS tonight", domain: "spaceweather.com" },
    ],
  },
  {
    emoji: "🍞", title: "Sourdough science", author: "mike",
    finds: [
      { title: "The microbiology of sourdough", domain: "nature.com" },
      { title: "Why hydration percentage matters", domain: "theperfectloaf.com" },
      { title: "Wild yeast vs. commercial yeast", domain: "seriouseats.com" },
      { title: "A timeline of bread in civilization", domain: "smithsonianmag.com" },
      { title: "Troubleshooting your starter", domain: "kingarthurbaking.com" },
    ],
  },
  {
    emoji: "📚", title: "Lost libraries of antiquity", author: "elena",
    finds: [
      { title: "The burning of Alexandria: myth vs. reality", domain: "jstor.org" },
      { title: "Ashurbanipal's clay tablet library", domain: "britishmuseum.org" },
      { title: "The House of Wisdom in Baghdad", domain: "aeon.co" },
      { title: "Timbuktu manuscripts: a survival story", domain: "bbc.com" },
      { title: "Digital reconstruction of lost texts", domain: "science.org" },
    ],
  },
  {
    emoji: "🎨", title: "Color theory in film", author: "lena",
    finds: [
      { title: "Wes Anderson's pastel palette decoded", domain: "criterion.com" },
      { title: "How Spielberg uses red", domain: "nofilmschool.com" },
      { title: "Color grading: orange and teal explained", domain: "wolfcrow.com" },
      { title: "The Coen Brothers' desaturated Midwest", domain: "vulture.com" },
      { title: "Technicolor's golden age", domain: "mubi.com" },
    ],
  },
  {
    emoji: "🦠", title: "Microbiome research", author: "sara",
    finds: [
      { title: "The gut-brain axis, explained", domain: "nature.com" },
      { title: "How your microbiome shapes immunity", domain: "science.org" },
      { title: "Fecal transplants: promise and peril", domain: "theatlantic.com" },
      { title: "Soil microbiomes and plant health", domain: "newphytologist.org" },
      { title: "Probiotics: what actually works?", domain: "examine.com" },
    ],
  },
  {
    emoji: "🗺️", title: "Cartography history", author: "marco",
    finds: [
      { title: "Ptolemy's world map and its legacy", domain: "britishmuseum.org" },
      { title: "How medieval maps encoded power", domain: "aeon.co" },
      { title: "Mercator's projection: useful lie", domain: "vox.com" },
      { title: "Indigenous mapping traditions", domain: "jstor.org" },
      { title: "The first satellite maps of Earth", domain: "nasa.gov" },
    ],
  },
  {
    emoji: "🎹", title: "Synth sound design", author: "yuki",
    finds: [
      { title: "Subtractive vs. FM synthesis", domain: "soundonsound.com" },
      { title: "How the Moog changed everything", domain: "moogmusic.com" },
      { title: "Designing a pad from scratch", domain: "youtube.com" },
      { title: "Wavetable synthesis explained", domain: "reverb.com" },
      { title: "Aphex Twin's gear list decoded", domain: "musicradar.com" },
    ],
  },
  {
    emoji: "🦴", title: "Paleoanthropology", author: "zara",
    finds: [
      { title: "Lucy and the Afar Triangle", domain: "smithsonianmag.com" },
      { title: "Denisovans: the ghost lineage", domain: "nature.com" },
      { title: "What teeth reveal about ancient diets", domain: "science.org" },
      { title: "The Homo naledi cave discovery", domain: "nationalgeographic.com" },
      { title: "When did humans start cooking?", domain: "sapiens.org" },
    ],
  },
];

/** Pick `count` random non-repeating stems from the pool */
export function pickRandomStems(count: number, exclude: string[] = []): StemData[] {
  const available = STEM_POOL.filter((s) => !exclude.includes(s.title));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function StemMockup({
  emoji = "🏛️",
  title = "Byzantine architecture",
  meta,
  finds,
  animated = false,
  hoverable = false,
  contributors,
}: StemMockupProps) {
  const resolvedFinds = finds ?? STEM_POOL.find((s) => s.title === title)?.finds ?? STEM_POOL[0].finds;
  const [visibleCount, setVisibleCount] = useState(animated ? 0 : resolvedFinds.length);

  useEffect(() => {
    if (!animated) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    resolvedFinds.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), 1200 + i * 400));
    });
    return () => timers.forEach(clearTimeout);
  }, [animated, resolvedFinds.length]);

  const metaText =
    meta ??
    (contributors
      ? `${contributors.map((c) => `@${c}`).join(" + ")} · ${resolvedFinds.length} finds`
      : `@amrith · ${resolvedFinds.length} finds · public`);

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
        {resolvedFinds.map((f, i) => (
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
