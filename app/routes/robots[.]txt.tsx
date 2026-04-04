import type { LoaderFunctionArgs } from "@remix-run/cloudflare";

export async function loader({ request }: LoaderFunctionArgs) {
  const host = new URL(request.url).origin;
  return new Response(
    [
      "User-agent: *",
      "Allow: /",
      "",
      `Sitemap: ${host}/sitemap.xml`,
    ].join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
}
