import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";

export async function loader(_: LoaderFunctionArgs) {
  throw redirect("https://discord.gg/mqYrHp9CJv");
}
