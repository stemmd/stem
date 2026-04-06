import { useState, useRef, useEffect } from "react";

/**
 * Floating action button for owners to quickly add items to the stem.
 * Fixed position in the bottom-right corner.
 */
export function FloatingAddButton({
  onAdd,
}: {
  onAdd: (type: "node" | "link" | "note") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} style={fabStyles.container}>
      {open && (
        <div style={fabStyles.menu}>
          <button
            style={fabStyles.menuItem}
            onClick={() => { onAdd("node"); setOpen(false); }}
          >
            <span style={fabStyles.menuEmoji}>{"🏷"}</span>
            <span style={fabStyles.menuLabel}>Node</span>
          </button>
          <button
            style={fabStyles.menuItem}
            onClick={() => { onAdd("link"); setOpen(false); }}
          >
            <span style={fabStyles.menuEmoji}>{"🔗"}</span>
            <span style={fabStyles.menuLabel}>Link</span>
          </button>
          <button
            style={fabStyles.menuItem}
            onClick={() => { onAdd("note"); setOpen(false); }}
          >
            <span style={fabStyles.menuEmoji}>{"📝"}</span>
            <span style={fabStyles.menuLabel}>Note</span>
          </button>
        </div>
      )}
      <button
        style={{
          ...fabStyles.button,
          transform: open ? "rotate(45deg)" : "none",
        }}
        onClick={() => setOpen((o) => !o)}
        title="Add to stem"
        aria-label="Add to stem"
      >
        +
      </button>
    </div>
  );
}

const fabStyles: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed",
    bottom: 24,
    right: 24,
    zIndex: 50,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 12,
  },
  button: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "var(--forest)",
    color: "#fff",
    border: "none",
    fontSize: 28,
    fontWeight: 300,
    lineHeight: 1,
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  menu: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    animation: "fadeUp 0.15s ease-out",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 18px",
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 10,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    transition: "background 0.12s",
    whiteSpace: "nowrap",
  },
  menuEmoji: {
    fontSize: 16,
  },
  menuLabel: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--ink)",
  },
};
