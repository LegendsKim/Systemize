import { headers } from "next/headers";

interface JsonLdProps {
  /** A JSON-serializable JSON-LD document. */
  readonly data: unknown;
  /** Stable element id, so the block is identifiable in the rendered document. */
  readonly id: string;
}

/**
 * Renders a JSON-LD block.
 *
 * Two details that are easy to get wrong:
 *
 *  1. **The nonce.** `src/proxy.ts` sets `script-src 'self' 'nonce-…' 'strict-dynamic'`.
 *     A browser applies `script-src` to every `<script>` element, including
 *     `type="application/ld+json"`, the block is data, but the element is a script, and
 *     without the nonce it is dropped before a crawler ever sees it. The nonce is read
 *     from the request header the proxy sets.
 *  2. **The `<` escape.** A `</script>` sequence anywhere inside serialized content ends
 *     the element early. Escaping `<` as the `<` JSON escape is valid JSON and valid
 *     JSON-LD, and it makes that impossible. The content here is trusted repository copy; the escape is
 *     the invariant, not a reaction to untrusted input.
 *
 * A Server Component. Emits no client JavaScript.
 */
export async function JsonLd({ data, id }: JsonLdProps) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <script
      id={id}
      type="application/ld+json"
      nonce={nonce}
      /*
       * Browsers deliberately hide a script nonce from the live DOM after CSP consumes it.
       * React therefore sees an empty client-side value during hydration even though the
       * server attribute and the enforced policy are correct. This escape hatch is scoped
       * to that unavoidable browser-managed attribute; the JSON-LD content must still
       * remain deterministic.
       */
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replaceAll("<", "\\u003c"),
      }}
    />
  );
}
