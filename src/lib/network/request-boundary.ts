import { siteUrl } from "@/lib/site-config";

export function hasTrustedMutationOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const allowed = new Set([
    new URL(siteUrl).origin,
    new URL(request.url).origin,
  ]);
  return allowed.has(origin);
}

export async function readBoundedJson(
  request: Request,
  maxBytes = 10_000
): Promise<unknown | null> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return null;
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return null;
  }
  if (!request.body) return null;

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
