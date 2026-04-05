// Client-side YouTube watch history parser.
// Parses Google Takeout JSON, groups videos by channel, and assigns categories.

import { CATEGORIES } from "~/components/StemPickers";

// ── Types ───────────────────────────────────────────────────────────────────

export interface YouTubeEntry {
  header: string;
  title: string;
  titleUrl?: string;
  subtitles?: { name: string; url: string }[];
  time: string;
}

export interface ProposedArtifact {
  url: string;
  title: string;
  source_type: "youtube";
  channel: string;
  watchedAt: string;
}

export interface ProposedStem {
  id: string; // temporary client-side id
  title: string;
  description: string;
  emoji: string;
  categoryId: string;
  visibility: "public";
  artifacts: ProposedArtifact[];
  channelUrl?: string;
  selected: boolean;
}

// ── Category mapping ────────────────────────────────────────────────────────

// Keywords that map to category IDs. Checked against channel name + video titles.
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  cat_food: ["cook", "recipe", "food", "kitchen", "chef", "baking", "biryani", "cuisine", "restaurant", "meal", "dinner", "lunch", "breakfast", "eating", "mukbang", "grocery", "cocktail", "drink", "bar", "coffee", "tea", "wine", "beer", "bbq", "grill"],
  cat_music: ["music", "song", "album", "concert", "band", "guitar", "piano", "rapper", "hip hop", "r&b", "jazz", "classical", "producer", "beat", "mixtape", "vinyl", "tiny desk", "live session"],
  cat_technology: ["tech", "programming", "software", "code", "developer", "javascript", "python", "react", "startup", "app", "saas", "ai ", "artificial intelligence", "machine learning", "gadget", "review", "unbox", "iphone", "android", "laptop", "mkbhd", "marques brownlee", "linus tech", "computer"],
  cat_science: ["science", "experiment", "research", "laboratory", "discovery", "veritasium", "kurzgesagt", "minutephysics", "smarter every day", "vsauce"],
  cat_film: ["film", "movie", "cinema", "director", "trailer", "review", "screenplay", "actor", "actress", "oscar", "netflix", "anime", "animation"],
  cat_sport: ["sport", "football", "soccer", "basketball", "cricket", "tennis", "gym", "workout", "fitness", "nba", "nfl", "premier league", "champions league", "training", "match", "goal"],
  cat_history: ["history", "ancient", "medieval", "war", "civilization", "empire", "dynasty", "historical", "century", "era"],
  cat_art: ["art", "painting", "sculpture", "gallery", "museum", "artist", "creative", "illustration", "drawing", "sketch"],
  cat_design: ["design", "ui", "ux", "graphic", "typography", "layout", "figma", "logo", "branding", "web design"],
  cat_architecture: ["architecture", "building", "architect", "structure", "interior", "house", "construction", "home design"],
  cat_philosophy: ["philosophy", "ethics", "morality", "existential", "meaning", "consciousness", "stoic", "mindset"],
  cat_psychology: ["psychology", "mental health", "therapy", "behavior", "brain", "cognitive", "personality", "anxiety", "depression", "self help"],
  cat_economics: ["economics", "economy", "finance", "investing", "stock", "market", "crypto", "bitcoin", "money", "business", "entrepreneur", "wealth"],
  cat_politics: ["politics", "election", "government", "policy", "debate", "democrat", "republican", "geopolitics", "diplomacy", "law"],
  cat_space: ["space", "nasa", "rocket", "planet", "asteroid", "telescope", "galaxy", "cosmos", "star", "orbit", "spacex"],
  cat_nature: ["nature", "wildlife", "animal", "forest", "ocean", "mountain", "earth", "environment", "climate", "ecology"],
  cat_health: ["health", "medical", "doctor", "hospital", "disease", "vitamin", "nutrition", "diet", "exercise", "wellness"],
  cat_literature: ["book", "novel", "reading", "author", "writer", "poetry", "literary", "library", "fiction"],
  cat_physics: ["physics", "quantum", "relativity", "particle", "energy", "atom", "thermodynamic", "mechanics"],
  cat_mathematics: ["math", "mathematics", "equation", "calculus", "algebra", "geometry", "statistics", "probability"],
  cat_photography: ["photography", "camera", "photo", "lens", "portrait", "landscape photo", "lightroom", "photoshop"],
  cat_linguistics: ["language", "linguistic", "grammar", "vocabulary", "translation", "accent", "dialect", "polyglot"],
  cat_biology: ["biology", "cell", "dna", "evolution", "genetics", "organism", "microbiology", "anatomy"],
  cat_craft: ["diy", "craft", "handmade", "woodwork", "sewing", "knitting", "pottery", "maker"],
  cat_urbanism: ["urban", "city", "transit", "zoning", "walkable", "housing", "infrastructure", "public transport", "not just bikes"],
};

function guessCategory(channelName: string, titles: string[]): string {
  const text = [channelName, ...titles.slice(0, 20)].join(" ").toLowerCase();
  let bestCat = "cat_technology"; // default
  let bestScore = 0;

  for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCat = catId;
    }
  }

  return bestCat;
}

function getCategoryEmoji(categoryId: string): string {
  return CATEGORIES.find((c) => c.id === categoryId)?.emoji ?? "🌱";
}

// ── Parser ──────────────────────────────────────────────────────────────────

const MIN_VIDEOS_FOR_STEM = 3;

export function parseYouTubeHistory(entries: YouTubeEntry[]): ProposedStem[] {
  // Filter to actual video watches with channel info
  const videos = entries.filter(
    (e) =>
      e.header === "YouTube" &&
      e.titleUrl &&
      e.subtitles?.[0]?.name &&
      e.title.startsWith("Watched ")
  );

  // Group by channel
  const channels = new Map<
    string,
    { name: string; url: string; videos: { title: string; url: string; time: string }[] }
  >();

  for (const v of videos) {
    const channel = v.subtitles![0];
    const key = channel.url;
    if (!channels.has(key)) {
      channels.set(key, { name: channel.name, url: channel.url, videos: [] });
    }
    const title = v.title.replace(/^Watched\s+/, "");
    // Dedupe by URL
    const group = channels.get(key)!;
    if (!group.videos.some((existing) => existing.url === v.titleUrl)) {
      group.videos.push({ title, url: v.titleUrl!, time: v.time });
    }
  }

  // Convert channels with enough videos into proposed stems
  const stems: ProposedStem[] = [];
  let idCounter = 0;

  // Sort channels by video count descending
  const sorted = [...channels.values()].sort((a, b) => b.videos.length - a.videos.length);

  for (const ch of sorted) {
    if (ch.videos.length < MIN_VIDEOS_FOR_STEM) continue;

    const titles = ch.videos.map((v) => v.title);
    const categoryId = guessCategory(ch.name, titles);
    const emoji = getCategoryEmoji(categoryId);

    // Sort videos by watch time (newest first)
    ch.videos.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    const firstDate = new Date(ch.videos[ch.videos.length - 1].time);
    const lastDate = new Date(ch.videos[0].time);
    const dateRange =
      firstDate.getFullYear() === lastDate.getFullYear() &&
      firstDate.getMonth() === lastDate.getMonth()
        ? formatMonth(firstDate)
        : `${formatMonth(firstDate)} to ${formatMonth(lastDate)}`;

    stems.push({
      id: `import_${idCounter++}`,
      title: ch.name.trim(),
      description: `${ch.videos.length} videos watched from ${dateRange}`,
      emoji,
      categoryId,
      visibility: "public",
      channelUrl: ch.url,
      selected: true,
      artifacts: ch.videos.map((v) => ({
        url: v.url,
        title: v.title,
        source_type: "youtube" as const,
        channel: ch.name,
        watchedAt: v.time,
      })),
    });
  }

  return stems;
}

function formatMonth(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// ── Hash for dedup ──────────────────────────────────────────────────────────

export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
