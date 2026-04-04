import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { API_BASE } from "~/lib/config";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) throw redirect("/signin");

  const res = await fetch(
    `${API_BASE}/auth/verify?token=${encodeURIComponent(token)}`,
    { redirect: "manual" }
  );

  const location = res.headers.get("Location");
  const setCookie = res.headers.get("Set-Cookie");

  if (!setCookie || !location) throw redirect("/signin?error=invalid_link");

  return new Response(null, {
    status: 302,
    headers: { Location: location, "Set-Cookie": setCookie },
  });
}

export default function AuthVerify() {
  return null;
}
