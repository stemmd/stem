import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { requireUser } from "~/lib/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireUser(request, context);
  const q = new URL(request.url).searchParams.get("q");
  if (!q) return json({ error: "missing q" }, { status: 400 });

  const apiKey = context.cloudflare.env.YOUTUBE_API_KEY;
  if (!apiKey) return json({ error: "YouTube search not configured" }, { status: 503 });

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(q)}&key=${apiKey}`
    );
    if (!res.ok) return json({ error: "YouTube API error" }, { status: 502 });
    const data = (await res.json()) as {
      items: Array<{
        id: { videoId: string };
        snippet: { title: string; thumbnails: { default: { url: string } }; channelTitle: string };
      }>;
    };
    return json(
      (data.items || []).map((item) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.default.url,
        channelTitle: item.snippet.channelTitle,
      }))
    );
  } catch {
    return json({ error: "YouTube search failed" }, { status: 500 });
  }
}
