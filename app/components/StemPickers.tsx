// Shared pickers for stem visibility, contribution mode, and category tagging.
// Used in stem creation (/new), stem settings, and user settings.

export const CATEGORIES = [
  { id: "cat_architecture", name: "Architecture", emoji: "🏗️" },
  { id: "cat_art",          name: "Art",          emoji: "🎨" },
  { id: "cat_biology",      name: "Biology",      emoji: "🌿" },
  { id: "cat_craft",        name: "Craft",        emoji: "🪡" },
  { id: "cat_design",       name: "Design",       emoji: "✏️" },
  { id: "cat_economics",    name: "Economics",    emoji: "📊" },
  { id: "cat_film",         name: "Film",         emoji: "🎬" },
  { id: "cat_food",         name: "Food",         emoji: "🍳" },
  { id: "cat_health",       name: "Health",       emoji: "🫀" },
  { id: "cat_history",      name: "History",      emoji: "🏛️" },
  { id: "cat_linguistics",  name: "Linguistics",  emoji: "🗣️" },
  { id: "cat_literature",   name: "Literature",   emoji: "📖" },
  { id: "cat_mathematics",  name: "Mathematics",  emoji: "∑" },
  { id: "cat_music",        name: "Music",        emoji: "🎵" },
  { id: "cat_nature",       name: "Nature",       emoji: "🌲" },
  { id: "cat_philosophy",   name: "Philosophy",   emoji: "🧠" },
  { id: "cat_photography",  name: "Photography",  emoji: "📷" },
  { id: "cat_physics",      name: "Physics",      emoji: "⚛️" },
  { id: "cat_politics",     name: "Politics",     emoji: "🌐" },
  { id: "cat_psychology",   name: "Psychology",   emoji: "🪞" },
  { id: "cat_science",      name: "Science",      emoji: "🔬" },
  { id: "cat_space",        name: "Space",        emoji: "🔭" },
  { id: "cat_sport",        name: "Sport",        emoji: "⚽" },
  { id: "cat_technology",   name: "Technology",   emoji: "💻" },
  { id: "cat_urbanism",     name: "Urbanism",     emoji: "🏙️" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const CATEGORY_COLORS: Record<string, { light: string; dark: string }> = {
  cat_architecture: { light: "#f5ede4", dark: "#2a2520" },
  cat_art:          { light: "#f5e8ef", dark: "#2a2025" },
  cat_biology:      { light: "#e8f2e8", dark: "#1e2a1e" },
  cat_craft:        { light: "#f2ede4", dark: "#282520" },
  cat_design:       { light: "#eee8f2", dark: "#242028" },
  cat_economics:    { light: "#e8edf2", dark: "#1e2228" },
  cat_film:         { light: "#ede8f0", dark: "#232028" },
  cat_food:         { light: "#f5ede4", dark: "#2a2520" },
  cat_health:       { light: "#eaf0ea", dark: "#1f281f" },
  cat_history:      { light: "#f2ece4", dark: "#28251e" },
  cat_linguistics:  { light: "#e8eaf2", dark: "#1e2028" },
  cat_literature:   { light: "#f0ebe4", dark: "#28241e" },
  cat_mathematics:  { light: "#e4ecf2", dark: "#1e2428" },
  cat_music:        { light: "#e4eaf5", dark: "#1e2230" },
  cat_nature:       { light: "#e4f0e8", dark: "#1e281f" },
  cat_philosophy:   { light: "#ece4f2", dark: "#241e28" },
  cat_photography:  { light: "#f0ece8", dark: "#282420" },
  cat_physics:      { light: "#e4eef5", dark: "#1e2430" },
  cat_politics:     { light: "#e8eee8", dark: "#202820" },
  cat_psychology:   { light: "#f0e8f0", dark: "#282028" },
  cat_science:      { light: "#e4f0f2", dark: "#1e2828" },
  cat_space:        { light: "#e4e8f5", dark: "#1e2030" },
  cat_sport:        { light: "#f2ece4", dark: "#28251e" },
  cat_technology:   { light: "#e8eef2", dark: "#202428" },
  cat_urbanism:     { light: "#eeeae4", dark: "#26221e" },
};

export function getCategoryTint(categoryId: string | null | undefined): string {
  if (!categoryId || !CATEGORY_COLORS[categoryId]) return "var(--surface)";
  const shortId = categoryId.replace("cat_", "");
  return `var(--cat-${shortId}, var(--surface))`;
}

/** Multi-select pill picker. Renders hidden inputs for form submission. */
export function CategoryPicker({
  name,
  selected,
  onChange,
  max = 3,
  label,
}: {
  name: string;
  selected: string[];
  onChange: (ids: string[]) => void;
  max?: number;
  label?: string;
}) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else if (selected.length < max) {
      onChange([...selected, id]);
    }
  };

  return (
    <div>
      {label && <p style={styles.groupLabel}>{label}</p>}
      <p style={styles.radioSub}>
        {selected.length}/{max} selected
      </p>
      {selected.map((id, i) => (
        <input key={id} type="hidden" name={`${name}_${i}`} value={id} />
      ))}
      <input type="hidden" name={`${name}_count`} value={selected.length} />
      <div style={catStyles.pills}>
        {CATEGORIES.map((cat) => {
          const active = selected.includes(cat.id);
          const disabled = !active && selected.length >= max;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggle(cat.id)}
              disabled={disabled}
              style={{
                ...catStyles.pill,
                background: active ? "var(--forest)" : "var(--paper-mid)",
                color: active ? "#fff" : "var(--ink-mid)",
                borderColor: active ? "var(--forest)" : "var(--paper-dark)",
                opacity: disabled ? 0.35 : 1,
                cursor: disabled ? "default" : "pointer",
              }}
            >
              {cat.emoji} {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const catStyles: Record<string, React.CSSProperties> = {
  pills: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 6,
    marginTop: 10,
  },
  pill: {
    padding: "5px 12px",
    border: "1px solid",
    borderRadius: 20,
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    transition: "background 0.12s, color 0.12s",
    lineHeight: 1.4,
  },
};

const VISIBILITY_OPTIONS = [
  { value: "public",  label: "Public",       sub: "shown in Explore, visible to anyone" },
  { value: "mutuals", label: "Mutuals only", sub: "visible to people you follow back" },
  { value: "private", label: "Just me",      sub: "fully private" },
] as const;

const CONTRIBUTION_OPTIONS = [
  { value: "open",    label: "Anyone",       sub: "you approve each suggestion" },
  { value: "mutuals", label: "Mutuals only", sub: "people you follow back" },
  { value: "closed",  label: "Just me",      sub: "no suggestions accepted" },
] as const;

interface PickerProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
}

function RadioPicker({
  name,
  value,
  onChange,
  label,
  options,
}: PickerProps & { options: readonly { value: string; label: string; sub: string }[] }) {
  return (
    <div>
      <p style={styles.groupLabel}>{label}</p>
      <div style={styles.radioGroup}>
        {options.map((opt) => (
          <label key={opt.value} style={styles.radioLabel}>
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              style={{ marginRight: 8, flexShrink: 0 }}
            />
            <span style={styles.radioMain}>{opt.label}</span>
            <span style={styles.radioSub}> — {opt.sub}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function VisibilityPicker(props: Omit<PickerProps, "label"> & { label?: string }) {
  return (
    <RadioPicker
      {...props}
      label={props.label ?? "Who can see this stem?"}
      options={VISIBILITY_OPTIONS}
    />
  );
}

export function ContributionPicker(props: Omit<PickerProps, "label"> & { label?: string }) {
  return (
    <RadioPicker
      {...props}
      label={props.label ?? "Who can suggest finds?"}
      options={CONTRIBUTION_OPTIONS}
    />
  );
}

const styles: Record<string, React.CSSProperties> = {
  groupLabel: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--ink-mid)",
    marginBottom: 8,
  },
  radioGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink)",
    cursor: "pointer",
  },
  radioMain: {
    fontWeight: 500,
    color: "var(--ink)",
  },
  radioSub: {
    color: "var(--ink-light)",
    fontSize: 13,
  },
};
