import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import type { ServerBuild } from "@remix-run/cloudflare";
import * as build from "../build/server/index.js";
import { getLoadContext } from "../load-context";

const handleRequest = createPagesFunctionHandler({ build: build as unknown as ServerBuild, getLoadContext });

export function onRequest(context: Parameters<typeof handleRequest>[0]) {
  return handleRequest(context);
}
