import type { LoaderFunctionArgs } from "@remix-run/cloudflare";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const host = new URL(request.url).origin;
  const db = context.cloudflare.env.DB;

  const [usersResult, stemsResult] = await Promise.all([
    db
      .prepare(
        "SELECT DISTINCT u.username FROM users u JOIN stems s ON s.user_id = u.id WHERE s.visibility = 'public' LIMIT 1000"
      )
      .all<{ username: string }>(),
    db
      .prepare(
        `SELECT u.username, s.slug, s.updated_at
         FROM stems s JOIN users u ON u.id = s.user_id
         WHERE s.visibility = 'public'
         ORDER BY s.updated_at DESC
         LIMIT 1000`
      )
      .all<{ username: string; slug: string; updated_at: string }>(),
  ]);

  const urls: string[] = [
    urlEntry(host, "/", "weekly", "1.0"),
    urlEntry(host, "/explore", "daily", "0.8"),
  ];

  for (const { username } of usersResult.results) {
    urls.push(urlEntry(host, `/${username}`, "weekly", "0.7"));
  }

  for (const { username, slug, updated_at } of stemsResult.results) {
    urls.push(urlEntry(host, `/${username}/${slug}`, "weekly", "0.9", updated_at));
  }

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

function urlEntry(
  host: string,
  path: string,
  changefreq: string,
  priority: string,
  lastmod?: string
): string {
  return [
    `  <url>`,
    `    <loc>${host}${path}</loc>`,
    ...(lastmod ? [`    <lastmod>${lastmod.slice(0, 10)}</lastmod>`] : []),
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    `  </url>`,
  ].join("\n");
}
