import { useState, useRef, useEffect, useMemo } from "react";
import { EMOJI_CATEGORIES } from "./emoji-data";

export function EmojiPicker({
  value,
  onChange,
  name,
}: {
  value: string;
  onChange: (emoji: string) => void;
  name?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setOpen(false);
  };

  const filteredCategories = useMemo(() => {
    if (!search) return EMOJI_CATEGORIES;
    const q = search.toLowerCase();
    return EMOJI_CATEGORIES
      .filter((cat) => cat.label.toLowerCase().includes(q))
  }, [search]);

  const scrollToCategory = (index: number) => {
    setActiveCategory(index);
    setSearch("");
    const el = gridRef.current?.querySelector(`[data-cat="${index}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={ref} style={pickerStyles.container}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setSearch(""); }}
        style={pickerStyles.trigger}
        title={value ? "Change emoji" : "Pick an emoji"}
      >
        {value || <span style={pickerStyles.placeholder}>+</span>}
      </button>

      {open && (
        <div style={pickerStyles.dropdown}>
          {/* Search */}
          <div style={pickerStyles.searchRow}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category..."
              style={pickerStyles.searchInput}
              autoFocus
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                style={pickerStyles.clearBtn}
                title="Remove emoji"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category tabs */}
          {!search && (
            <div style={pickerStyles.categoryTabs}>
              {EMOJI_CATEGORIES.map((cat, i) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => scrollToCategory(i)}
                  style={{
                    ...pickerStyles.categoryTab,
                    borderBottomColor: activeCategory === i ? "var(--forest)" : "transparent",
                  }}
                  title={cat.label}
                >
                  {cat.emojis[0]}
                </button>
              ))}
            </div>
          )}

          {/* Emoji grid */}
          <div ref={gridRef} style={pickerStyles.grid}>
            {filteredCategories.map((cat, catIndex) => (
              <div key={cat.label} data-cat={EMOJI_CATEGORIES.indexOf(cat)}>
                <div style={pickerStyles.categoryLabel}>{cat.label}</div>
                <div style={pickerStyles.emojiRow}>
                  {cat.emojis.map((emoji, i) => (
                    <button
                      key={`${emoji}-${i}`}
                      type="button"
                      onClick={() => handleSelect(emoji)}
                      style={{
                        ...pickerStyles.emojiBtn,
                        background: emoji === value ? "var(--leaf)" : "none",
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filteredCategories.length === 0 && (
              <p style={pickerStyles.noResults}>No matching category</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const pickerStyles: Record<string, React.CSSProperties> = {
  container: {
    position: "relative",
    display: "inline-block",
  },
  trigger: {
    width: 52,
    height: 48,
    borderRadius: 10,
    border: "1.5px solid var(--paper-dark)",
    background: "var(--paper-mid)",
    fontSize: 26,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "border-color 0.15s",
    padding: 0,
    lineHeight: 1,
  },
  placeholder: {
    fontSize: 20,
    color: "var(--ink-light)",
    fontWeight: 300,
    fontFamily: "'DM Sans', sans-serif",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: 6,
    width: 352,
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 12,
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    zIndex: 200,
    display: "flex",
    flexDirection: "column",
  },
  searchRow: {
    display: "flex",
    gap: 6,
    padding: "8px 8px 0",
  },
  searchInput: {
    flex: 1,
    padding: "7px 10px",
    borderRadius: 8,
    border: "1px solid var(--paper-dark)",
    background: "var(--paper)",
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    color: "var(--ink)",
    outline: "none",
  },
  clearBtn: {
    padding: "7px 10px",
    borderRadius: 8,
    border: "1px solid var(--paper-dark)",
    background: "none",
    fontSize: 12,
    fontFamily: "'DM Sans', sans-serif",
    color: "var(--ink-light)",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  categoryTabs: {
    display: "flex",
    gap: 0,
    padding: "6px 8px 0",
    borderBottom: "1px solid var(--paper-dark)",
    overflowX: "auto",
  },
  categoryTab: {
    flex: "0 0 auto",
    padding: "4px 6px 6px",
    border: "none",
    borderBottom: "2px solid transparent",
    background: "none",
    fontSize: 18,
    cursor: "pointer",
    lineHeight: 1,
    borderRadius: 0,
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    padding: "6px 8px 8px",
    maxHeight: 320,
    overflowY: "auto",
  },
  categoryLabel: {
    fontSize: 11,
    fontFamily: "'DM Mono', monospace",
    color: "var(--ink-light)",
    padding: "8px 2px 4px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    position: "sticky",
    top: 0,
    background: "var(--surface)",
    zIndex: 1,
  },
  emojiRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 1,
  },
  emojiBtn: {
    width: 36,
    height: 36,
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.1s",
    padding: 0,
    lineHeight: 1,
  },
  noResults: {
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    color: "var(--ink-light)",
    textAlign: "center",
    padding: "24px 0",
  },
};
