import type { AppLoadContext } from "@remix-run/cloudflare";
import type { GetLoadContextFunction } from "@remix-run/cloudflare-pages";
import { type PlatformProxy } from "wrangler";

interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  AVATAR_BUCKET: R2Bucket;
  AVATAR_BUCKET_URL: string;
  ADMIN_SECRET: string;
  ADMIN_USERNAME?: string;
  DEFAULT_FOLLOW_USERNAME?: string;
  TURNSTILE_SECRET?: string;
  YOUTUBE_API_KEY?: string;
  GOOGLE_SAFE_BROWSING_KEY?: string;
}

type Cloudflare = Omit<PlatformProxy<Env>, "dispose">;

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    cloudflare: Cloudflare;
  }
}

// Shared implementation compatible with Vite dev server and Cloudflare Pages
export const getLoadContext: GetLoadContextFunction<Env> = ({ context }) => {
  return context as unknown as AppLoadContext;
};
