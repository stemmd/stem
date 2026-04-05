import { useEffect, useRef, useState } from "react";

interface SourceItem {
  label: string;
  detail: string;
  icon: string;
  scatterX: number;
  scatterY: number;
  rotation: number;
}

const SOURCES: SourceItem[] = [
  { label: "nature.com", detail: "How memory consolidation works", icon: "🌐", scatterX: -140, scatterY: -80, rotation: -6 },
  { label: "YouTube", detail: "The Default Mode Network", icon: "▶️", scatterX: 120, scatterY: -60, rotation: 4 },
  { label: "Notes app", detail: "predictive coding → read more", icon: "📝", scatterX: -100, scatterY: 70, rotation: -3 },
  { label: "@neurosci_daily", detail: "Saved bookmark", icon: "🐦", scatterX: 150, scatterY: 50, rotation: 5 },
  { label: "Podcast", detail: "Ep 47: Embodied cognition", icon: "🎧", scatterX: -160, scatterY: 10, rotation: -4 },
  { label: "Wikipedia", detail: "Chomsky's review of Skinner", icon: "📖", scatterX: 100, scatterY: -20, rotation: 3 },
];

const CONVERGED_FINDS = [
  { title: "How memory consolidation actually works", domain: "nature.com" },
  { title: "The predictive coding framework", domain: "aeon.co" },
  { title: "Embodied cognition: a reading list", domain: "philpapers.org" },
  { title: "The Default Mode Network, explained", domain: "youtube.com" },
  { title: "Against Behaviorism (Chomsky, 1959)", domain: "wikipedia.org" },
];

export function ConvergenceSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [converged, setConverged] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // Check prefers-reduced-motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setConverged(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setConverged(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Mobile detection for smaller scatter
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 600;
  const scatterScale = isMobile ? 0.5 : 1;

  return (
    <section style={s.section}>
      <p style={s.label}>The problem</p>
      <h2 style={s.heading}>Your curiosity is everywhere.<br />It doesn't have to be.</h2>

      <div ref={sectionRef} style={s.arena}>
        {/* Scattered sources */}
        <div style={{ ...s.sourcesWrap, opacity: converged ? 0 : 1, pointerEvents: converged ? "none" : "auto" }}>
          {SOURCES.map((src) => (
            <div
              key={src.label}
              style={{
                ...s.sourceCard,
                transform: converged
                  ? "translate(0, 0) rotate(0deg)"
                  : `translate(${src.scatterX * scatterScale}px, ${src.scatterY * scatterScale}px) rotate(${src.rotation}deg)`,
                opacity: converged ? 0 : 1,
                transition: "transform 0.8s ease, opacity 0.6s ease",
              }}
            >
              <span style={s.sourceIcon}>{src.icon}</span>
              <div>
                <p style={s.sourceLabel}>{src.label}</p>
                <p style={s.sourceDetail}>{src.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Converged stem card */}
        <div
          style={{
            ...s.stemCard,
            opacity: converged ? 1 : 0,
            transform: converged ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s",
          }}
        >
          <div style={s.stemTop}>
            <span style={{ fontSize: 32, lineHeight: 1 }}>🧠</span>
            <div>
              <p style={s.stemTitle}>Cognitive science</p>
              <p style={s.stemMeta}>@amrith · 5 finds · public</p>
            </div>
          </div>
          <div style={s.stemRule} />
          {CONVERGED_FINDS.map((f) => (
            <div key={f.title} style={s.stemFind}>
              <span style={s.stemFindTitle}>{f.title}</span>
              <span style={s.stemFindDomain}>{f.domain}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const s: Record<string, React.CSSProperties> = {
  section: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "80px 40px 100px",
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
    marginBottom: 60,
  },
  arena: {
    position: "relative",
    minHeight: 380,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sourcesWrap: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    transition: "opacity 0.5s ease",
  },
  sourceCard: {
    position: "absolute",
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "var(--surface, var(--paper))",
    border: "1px solid var(--paper-dark)",
    borderRadius: 12,
    padding: "10px 16px",
    boxShadow: "0 4px 16px rgba(28, 26, 23, 0.06)",
    whiteSpace: "nowrap",
  },
  sourceIcon: { fontSize: 18, flexShrink: 0 },
  sourceLabel: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--ink)",
    lineHeight: 1.2,
  },
  sourceDetail: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 10,
    color: "var(--ink-light)",
    marginTop: 1,
  },
  stemCard: {
    background: "var(--surface, var(--paper))",
    border: "1px solid var(--paper-dark)",
    borderRadius: 18,
    padding: 24,
    boxShadow: "0 8px 32px rgba(28, 26, 23, 0.08)",
    maxWidth: 400,
    width: "100%",
    textAlign: "left",
  },
  stemTop: { display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 },
  stemTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 18,
    color: "var(--ink)",
    lineHeight: 1.2,
  },
  stemMeta: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: "var(--ink-light)",
    marginTop: 4,
  },
  stemRule: { height: 1, background: "var(--paper-dark)", marginBottom: 12 },
  stemFind: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    padding: "3px 0",
  },
  stemFindTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: "var(--ink)",
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  stemFindDomain: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    color: "var(--ink-light)",
    flexShrink: 0,
  },
};
