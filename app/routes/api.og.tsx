import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { requireUser } from "~/lib/auth.server";
import { fetchOG } from "~/lib/og.server";
import { isHttpUrl } from "~/lib/utils";

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireUser(request, context);
  const url = new URL(request.url).searchParams.get("url");
  if (!url) return json({ error: "missing url" }, { status: 400 });
  if (!isHttpUrl(url)) return json({ error: "invalid url" }, { status: 400 });
  return json(await fetchOG(url));
}
