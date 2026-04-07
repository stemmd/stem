import { useState, useRef, useEffect } from "react";

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: "Smileys",
    emojis: ["😀","😂","🥹","😊","😇","🤩","🤔","🤯","😎","🥳","😴","🤓","🧐","😤","💀","👻","🤖","👽","💩"],
  },
  {
    label: "People",
    emojis: ["👋","🤝","👏","🙌","🤲","💪","🧠","👀","👁️","🫀","🦾","🧑‍🚀","🧑‍🔬","🧑‍🎨","🧑‍💻","🧑‍🏫","🧑‍🍳","🧑‍🌾","🏃"],
  },
  {
    label: "Nature",
    emojis: ["🌱","🌿","🍀","🌳","🌲","🌵","🌸","🌺","🌻","🌼","🍄","🐝","🦋","🐛","🐚","🦑","🐙","🐬","🐳","🦈","🐊","🦎","🐍","🦅","🦉","🐧","🐦","🦜"],
  },
  {
    label: "Food",
    emojis: ["🍎","🍊","🍋","🍇","🍓","🫐","🥑","🌽","🥕","🧄","🍞","🧀","🍕","🍜","🍣","🍱","🥘","🍪","🍫","🍰","🧁","☕","🍵","🧃","🍷","🍺"],
  },
  {
    label: "Travel",
    emojis: ["🌍","🌎","🌏","🗺️","🏔️","⛰️","🌋","🏖️","🏜️","🏕️","🗼","🗽","🏛️","⛩️","🕌","🕍","🏰","🚀","✈️","🚂","🚢","🗿"],
  },
  {
    label: "Activities",
    emojis: ["⚽","🏀","🎾","🏋️","🧗","🎯","🎮","🎲","🧩","🎨","🎭","🎬","🎤","🎧","🎵","🎶","🎹","🎸","🥁","🎻","🎺"],
  },
  {
    label: "Objects",
    emojis: ["💡","🔦","📷","🔬","🔭","🧬","💊","🩺","📚","📖","📝","✏️","🖊️","📐","📏","🗂️","📁","📌","📎","🔗","🔧","🔨","⚙️","🧲","💎","🪙"],
  },
  {
    label: "Symbols",
    emojis: ["❤️","🧡","💛","💚","💙","💜","🤎","🖤","🤍","💯","✨","⭐","🌟","💫","⚡","🔥","💧","🌊","♻️","☮️","☯️","🏳️‍🌈","🎌","🏴‍☠️"],
  },
  {
    label: "Science",
    emojis: ["⚛️","🧪","🧫","🧬","🔬","🔭","📡","🛰️","🪐","🌙","☀️","🌡️","🧲","⚗️","💉","🩻","🦠","🧮"],
  },
  {
    label: "Flags",
    emojis: ["🏁","🚩","🎌","🏴","🏳️","🇺🇸","🇬🇧","🇯🇵","🇫🇷","🇩🇪","🇮🇹","🇪🇸","🇧🇷","🇮🇳","🇨🇳","🇰🇷","🇦🇺","🇨🇦","🇲🇽"],
  },
];

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

  return (
    <div ref={ref} style={pickerStyles.container}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={pickerStyles.trigger}
        title={value ? "Change emoji" : "Pick an emoji"}
      >
        {value || <span style={pickerStyles.placeholder}>+</span>}
      </button>

      {open && (
        <div style={pickerStyles.dropdown}>
          <div style={pickerStyles.searchRow}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter..."
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
          <div style={pickerStyles.grid}>
            {EMOJI_CATEGORIES.map((cat) => {
              const filtered = search
                ? cat.emojis.filter(() => cat.label.toLowerCase().includes(search.toLowerCase()))
                : cat.emojis;
              if (filtered.length === 0) return null;
              return (
                <div key={cat.label}>
                  {!search && (
                    <div style={pickerStyles.categoryLabel}>{cat.label}</div>
                  )}
                  <div style={pickerStyles.emojiRow}>
                    {filtered.map((emoji) => (
                      <button
                        key={emoji}
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
              );
            })}
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
    width: 320,
    maxHeight: 360,
    overflowY: "auto",
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 12,
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    zIndex: 200,
    padding: "8px",
  },
  searchRow: {
    display: "flex",
    gap: 6,
    marginBottom: 8,
    position: "sticky",
    top: 0,
    background: "var(--surface)",
    paddingBottom: 4,
  },
  searchInput: {
    flex: 1,
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid var(--paper-dark)",
    background: "var(--paper)",
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    color: "var(--ink)",
    outline: "none",
  },
  clearBtn: {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid var(--paper-dark)",
    background: "none",
    fontSize: 12,
    fontFamily: "'DM Sans', sans-serif",
    color: "var(--ink-light)",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  categoryLabel: {
    fontSize: 11,
    fontFamily: "'DM Mono', monospace",
    color: "var(--ink-light)",
    padding: "6px 4px 2px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  emojiRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 2,
  },
  emojiBtn: {
    width: 36,
    height: 36,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.1s",
    padding: 0,
    lineHeight: 1,
  },
};
