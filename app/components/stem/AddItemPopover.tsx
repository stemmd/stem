import { useEffect, useRef } from "react";

/**
 * Popover that appears when the owner clicks on the trunk line.
 * Offers quick-add options: Node, Link, or Note.
 */
export function AddItemPopover({
  position,
  stemId,
  onClose,
}: {
  position: { y: number; index: number };
  stemId: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    };
    // Delay adding listener to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        ...popoverStyles.container,
        top: position.y,
      }}
    >
      <p style={popoverStyles.label}>Add to stem</p>
      <div style={popoverStyles.buttons}>
        <button style={popoverStyles.option} onClick={onClose} title="Coming soon">
          <span style={popoverStyles.optionEmoji}>{"🏷"}</span>
          <span style={popoverStyles.optionText}>Node</span>
        </button>
        <button style={popoverStyles.option} onClick={onClose} title="Coming soon">
          <span style={popoverStyles.optionEmoji}>{"🔗"}</span>
          <span style={popoverStyles.optionText}>Link</span>
        </button>
        <button style={popoverStyles.option} onClick={onClose} title="Coming soon">
          <span style={popoverStyles.optionEmoji}>{"📝"}</span>
          <span style={popoverStyles.optionText}>Note</span>
        </button>
      </div>
    </div>
  );
}

const popoverStyles: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 12,
    padding: "12px 16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    zIndex: 100,
    animation: "fadeUp 0.15s ease-out",
  },
  label: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--ink-light)",
    marginBottom: 8,
    textAlign: "center",
  },
  buttons: {
    display: "flex",
    gap: 8,
  },
  option: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: "10px 16px",
    background: "var(--paper-mid)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 8,
    cursor: "pointer",
    transition: "background 0.12s",
  },
  optionEmoji: {
    fontSize: 18,
  },
  optionText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: "var(--ink-mid)",
    fontWeight: 500,
  },
};
