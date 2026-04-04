// Single source of truth for username validation across the app.

export const USERNAME_RE = /^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$|^[a-z0-9]{3}$/;

// Keep this list in sync when adding new top-level routes in app/routes/
export const RESERVED_USERNAMES = new Set([
  // Current routes
  "admin", "api", "auth", "feed", "explore", "new", "settings",
  "signin", "signup", "login", "logout", "register", "signout",
  "terms", "privacy", "discord", "about", "help", "support",
  "import", "extension", "notifications", "waitlist",
  // Common reserved
  "www", "mail", "blog", "app", "static", "assets", "cdn",
  "stem", "stems", "curator", "official", "team", "staff",
  "root", "moderator", "mod", "system", "null", "undefined",
  // Future routes
  "messages", "search", "discover", "invite", "onboarding", "welcome",
  "pricing", "pro", "premium", "plus",
  "download", "install",
  "changelog", "updates", "news",
  "profile", "home", "dashboard", "account",
  "ios", "android", "mobile",
  "docs", "developers", "documentation",
  "status", "guidelines", "community",
  "brand", "careers", "jobs", "partners",
  "legal", "contact", "report",
  "verify", "unsubscribe",
]);

const BLOCKED_PATTERNS: RegExp[] = [
  /nigg/i, /f[a@]gg/i, /ch[i1]nk/i, /sp[i1]c/i, /k[i1]ke/i, /wetback/i,
  /p[o0]rn/i, /h[e3]ntai/i, /xxx/i, /s[e3]x[y]?[a-z]*/i,
  /n[a@]z[i1]/i, /kkk/i,
  /^stem-?official/i, /^stem-?team/i, /^stem-?admin/i,
];

export function validateUsername(name: string): { valid: boolean; reason?: string } {
  if (!USERNAME_RE.test(name)) {
    return { valid: false, reason: "3-20 characters: lowercase letters, numbers, hyphens. Must start and end with a letter or number." };
  }
  if (RESERVED_USERNAMES.has(name)) {
    return { valid: false, reason: "That username is reserved." };
  }
  if (BLOCKED_PATTERNS.some((p) => p.test(name))) {
    return { valid: false, reason: "That username is not allowed." };
  }
  return { valid: true };
}
