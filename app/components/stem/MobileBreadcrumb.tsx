/**
 * Sticky breadcrumb bar for mobile drill-down navigation.
 * Shows the path from root to current node, with tappable segments.
 */
export function MobileBreadcrumb({
  breadcrumbs,
  onNavigate,
}: {
  breadcrumbs: { id: string; title: string; emoji: string }[];
  onNavigate: (index: number) => void; // -1 = root
}) {
  return (
    <div style={bcStyles.bar}>
      <button
        onClick={() => onNavigate(-1)}
        style={{
          ...bcStyles.segment,
          ...(breadcrumbs.length === 0 ? bcStyles.segmentActive : {}),
        }}
      >
        Root
      </button>
      {breadcrumbs.map((crumb, i) => (
        <span key={crumb.id} style={bcStyles.segmentWrap}>
          <span style={bcStyles.sep}>/</span>
          <button
            onClick={() => onNavigate(i)}
            style={{
              ...bcStyles.segment,
              ...(i === breadcrumbs.length - 1 ? bcStyles.segmentActive : {}),
            }}
          >
            {crumb.emoji && `${crumb.emoji} `}{crumb.title}
          </button>
        </span>
      ))}
    </div>
  );
}

const bcStyles: Record<string, React.CSSProperties> = {
  bar: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    padding: "10px 16px",
    background: "var(--surface)",
    borderBottom: "1px solid var(--paper-dark)",
    position: "sticky" as const,
    top: 0,
    zIndex: 20,
    overflowX: "auto" as const,
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  },
  segmentWrap: {
    display: "inline-flex",
    alignItems: "center",
    gap: 2,
    flexShrink: 0,
  },
  sep: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
    padding: "0 4px",
  },
  segment: {
    background: "none",
    border: "none",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-light)",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 6,
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  },
  segmentActive: {
    color: "var(--ink)",
    fontWeight: 600,
    background: "var(--paper-mid)",
  },
};
