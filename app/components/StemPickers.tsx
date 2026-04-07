// Shared pickers for stem visibility, contribution mode, and category tagging.
// Used in stem creation (/new), stem settings, and user settings.
import { useState } from "react";
import { useFetcher } from "@remix-run/react";

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
  { id: "cat_archaeology",  name: "Archaeology",  emoji: "🏺" },
  { id: "cat_cs",           name: "Computer Science", emoji: "🖥️" },
  { id: "cat_culture",      name: "Culture",      emoji: "🎭" },
  { id: "cat_education",    name: "Education",    emoji: "🎓" },
  { id: "cat_engineering",  name: "Engineering",  emoji: "⚙️" },
  { id: "cat_environment",  name: "Environment",  emoji: "🌍" },
  { id: "cat_fashion",      name: "Fashion",      emoji: "👗" },
  { id: "cat_finance",      name: "Finance",      emoji: "💰" },
  { id: "cat_gaming",       name: "Gaming",       emoji: "🎮" },
  { id: "cat_law",          name: "Law",           emoji: "⚖️" },
  { id: "cat_medicine",     name: "Medicine",      emoji: "🩺" },
  { id: "cat_travel",       name: "Travel",        emoji: "✈️" },
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
  cat_archaeology:  { light: "#f2ebe0", dark: "#28241a" },
  cat_cs:           { light: "#e4ecf5", dark: "#1e2430" },
  cat_culture:      { light: "#f0e8ed", dark: "#282024" },
  cat_education:    { light: "#eae8f2", dark: "#201e28" },
  cat_engineering:  { light: "#eaeef0", dark: "#20262a" },
  cat_environment:  { light: "#e4f2ea", dark: "#1e2a20" },
  cat_fashion:      { light: "#f5e8f0", dark: "#2a2028" },
  cat_finance:      { light: "#f0ede4", dark: "#28251e" },
  cat_gaming:       { light: "#e8e4f5", dark: "#1e1e30" },
  cat_law:          { light: "#eceae4", dark: "#24221e" },
  cat_medicine:     { light: "#e4f0ee", dark: "#1e2826" },
  cat_travel:       { light: "#e8f0f5", dark: "#1e2830" },
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
      <SuggestCategory />
    </div>
  );
}

function SuggestCategory() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const fetcher = useFetcher<{ success?: boolean; error?: string }>();
  const submitted = fetcher.state === "idle" && fetcher.data?.success;

  if (submitted) {
    return (
      <p style={catStyles.suggestSuccess}>
        Thanks! Your suggestion has been submitted for review.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={catStyles.suggestToggle}
      >
        Don't see your category? Suggest one
      </button>
    );
  }

  return (
    <div style={catStyles.suggestForm}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          maxLength={40}
          style={catStyles.suggestInput}
        />
        <button
          type="button"
          disabled={!name.trim() || fetcher.state !== "idle"}
          onClick={() => {
            fetcher.submit(
              { name: name.trim() },
              { method: "post", action: "/api/suggest-category" }
            );
          }}
          style={{
            ...catStyles.suggestBtn,
            opacity: !name.trim() || fetcher.state !== "idle" ? 0.5 : 1,
          }}
        >
          {fetcher.state !== "idle" ? "..." : "Suggest"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setName(""); }}
          style={catStyles.suggestCancel}
        >
          Cancel
        </button>
      </div>
      {fetcher.data?.error && (
        <p style={catStyles.suggestError}>{fetcher.data.error}</p>
      )}
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
  suggestToggle: {
    background: "none",
    border: "none",
    padding: "8px 0 0",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: "var(--ink-light)",
    cursor: "pointer",
    textDecoration: "underline",
    textDecorationColor: "var(--paper-dark)",
  },
  suggestForm: {
    marginTop: 10,
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  suggestInput: {
    flex: 1,
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid var(--paper-dark)",
    background: "var(--paper-mid)",
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    color: "var(--ink)",
    outline: "none",
  },
  suggestBtn: {
    padding: "6px 14px",
    background: "var(--forest)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 12,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
  suggestCancel: {
    background: "none",
    border: "none",
    fontSize: 12,
    fontFamily: "'DM Sans', sans-serif",
    color: "var(--ink-light)",
    cursor: "pointer",
    padding: 0,
  },
  suggestSuccess: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: "'DM Mono', monospace",
    color: "var(--forest)",
  },
  suggestError: {
    fontSize: 12,
    fontFamily: "'DM Mono', monospace",
    color: "var(--taken)",
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
