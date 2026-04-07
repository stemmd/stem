// Basic content moderation — blocks hate speech, slurs, and explicit sexual content.
// Not a topic ban (drugs, violence in academic contexts, etc. are fine).
// Uses word-boundary matching to avoid false positives on substrings.

const BLOCKED: RegExp[] = [
  // Racial & ethnic slurs
  /\bn[i1!]+g+[e3]+r+s?\b/i,
  /\bn[i1!]+g+[a@]+s?\b/i,
  /\bch[i1]+nk+s?\b/i,
  /\bsp[i1]+c+s?\b/i,
  /\bk[i1]+k[e3]+s?\b/i,
  /\bw[e3]+tb[a@]+ck+s?\b/i,
  /\bc[o0]+[o0]+ns?\b/i,
  /\br[e3]+ds[k]+[i1]+ns?\b/i,
  /\btr[a@]+nn[yi1]+[e3]?s?\b/i,
  // Explicit sexual content
  /\bp[o0]+rn(hub|o)?\b/i,
  /\bc[u]+msh[o0]+t\b/i,
  /\bf[a@]+p+[s]?\b/i,
  /\bj[e3]+rk[i1]+ng\s+off\b/i,
  /\bfap+p?[i1]+ng\b/i,
  /\bc[u]+nt+s?\b/i,
  /\bf[u]+ck[i1]+ng\s+(wh[o0]+re|sl[u]+t)\b/i,
  /\bwh[o0]+r[e3]+s?\b/i,
  /\bsl[u]+ts?\b/i,
  // Hate speech phrases
  /\bheil\s+hitler\b/i,
  /\b1[4h][8b]8\b/,
  /\bwhite\s+(power|pride|suprem)\b/i,
  /\bdeath\s+to\s+(jews|blacks|muslims|gays)\b/i,
  /\bgas\s+the\s+jews\b/i,
];

export function checkContent(...fields: (string | null | undefined)[]): boolean {
  for (const field of fields) {
    if (!field) continue;
    for (const pattern of BLOCKED) {
      if (pattern.test(field)) return true;
    }
  }
  return false;
}

// Link shorteners — blocked, users must paste full URLs
const SHORTENER_DOMAINS = new Set([
  "bit.ly", "tinyurl.com", "goo.gl", "ow.ly", "is.gd",
  "buff.ly", "adf.ly", "bl.ink", "rb.gy", "shorturl.at",
  "cutt.ly", "s.id", "v.gd", "t.ly", "short.io",
  "rebrand.ly", "tiny.cc", "clck.ru", "qps.ru",
]);

// Known service short domains that are OK (first-party shorteners)
const ALLOWED_SHORT_DOMAINS = new Set([
  "youtu.be",     // YouTube
  "t.co",         // Twitter/X
  "lnkd.in",     // LinkedIn
  "redd.it",     // Reddit
  "vimeo.com",   // Vimeo (not short but sometimes flagged)
  "open.spotify.com",
  "music.apple.com",
]);

export function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export async function checkBlockedDomain(
  db: D1Database,
  url: string
): Promise<{ blocked: boolean; reason?: string; category?: string }> {
  const domain = extractDomain(url);
  if (!domain) return { blocked: false };

  // Block link shorteners (except known service short domains)
  if (SHORTENER_DOMAINS.has(domain)) {
    return { blocked: true, reason: "Link shorteners aren't allowed on Stem. Please paste the full URL instead." };
  }

  // Check exact domain match against blocklist
  const exact = await db
    .prepare("SELECT category FROM blocked_domains WHERE domain = ?")
    .bind(domain)
    .first<{ category: string }>();
  if (exact) return { blocked: true, reason: "This URL is not allowed on Stem.", category: exact.category };

  // Check parent domain (e.g., sub.pornhub.com → pornhub.com)
  const parts = domain.split(".");
  if (parts.length > 2) {
    const parent = parts.slice(-2).join(".");
    const parentMatch = await db
      .prepare("SELECT category FROM blocked_domains WHERE domain = ?")
      .bind(parent)
      .first<{ category: string }>();
    if (parentMatch) return { blocked: true, reason: "This URL is not allowed on Stem.", category: parentMatch.category };
  }

  return { blocked: false };
}

// Google Safe Browsing API — checks URLs for malware, phishing, unwanted software
export async function checkSafeBrowsing(
  url: string,
  apiKey: string | undefined
): Promise<{ unsafe: boolean; reason?: string }> {
  if (!apiKey) return { unsafe: false }; // Skip if no API key configured

  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "stem-md", clientVersion: "1.0" },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
        signal: AbortSignal.timeout(3000),
      }
    );

    if (!res.ok) return { unsafe: false }; // Don't block on API errors

    const data = await res.json() as { matches?: { threatType: string }[] };
    if (data.matches && data.matches.length > 0) {
      const threat = data.matches[0].threatType;
      const reasons: Record<string, string> = {
        MALWARE: "This URL has been flagged as malware",
        SOCIAL_ENGINEERING: "This URL has been flagged as a phishing site",
        UNWANTED_SOFTWARE: "This URL has been flagged for distributing unwanted software",
        POTENTIALLY_HARMFUL_APPLICATION: "This URL has been flagged as potentially harmful",
      };
      return {
        unsafe: true,
        reason: reasons[threat] || "This URL has been flagged as unsafe",
      };
    }

    return { unsafe: false };
  } catch {
    return { unsafe: false }; // Don't block on network errors
  }
}

// Follow redirects and check for suspicious chains
export async function checkRedirects(
  url: string
): Promise<{ suspicious: boolean; reason?: string; finalUrl?: string; hops: number }> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      headers: { "User-Agent": "Stem/1.0 (+https://stem.md)" },
      signal: AbortSignal.timeout(5000),
    });

    let hops = 0;
    let current = url;

    // Follow up to 5 redirects manually
    let response = res;
    while ((response.status >= 300 && response.status < 400) && hops < 5) {
      const location = response.headers.get("Location");
      if (!location) break;
      hops++;
      current = new URL(location, current).toString();
      response = await fetch(current, {
        method: "HEAD",
        redirect: "manual",
        headers: { "User-Agent": "Stem/1.0 (+https://stem.md)" },
        signal: AbortSignal.timeout(5000),
      });
    }

    if (hops > 2) {
      return {
        suspicious: true,
        reason: `This URL redirects ${hops} times, which looks suspicious. Please paste the final destination URL instead.`,
        finalUrl: current,
        hops,
      };
    }

    return { suspicious: false, finalUrl: current, hops };
  } catch {
    // Network errors or timeouts — don't block, just can't verify
    return { suspicious: false, hops: 0 };
  }
}
