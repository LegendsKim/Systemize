import { expect, test } from "@playwright/test";

const invitationToken = "A".repeat(43);

test("/ exposes the stable public marketing preview image", async ({
  page,
  request,
}) => {
  await page.goto("/");

  const imageUrl = await page
    .locator('meta[property="og:image"]')
    .first()
    .getAttribute("content");
  expect(imageUrl).toBeTruthy();

  const parsed = new URL(imageUrl ?? "");
  expect(parsed.pathname).toBe("/systemize-share-card.png");
  expect(parsed.search).toBe("");

  const imageResponse = await request.get(imageUrl ?? "");
  expect(imageResponse.status()).toBe(200);
  expect(imageResponse.headers()["content-type"]).toContain("image/png");
  expect((await imageResponse.body()).byteLength).toBeGreaterThan(100_000);
});

for (const path of ["/login", `/invite/${invitationToken}`]) {
  test(`${path} exposes a public WhatsApp preview without private data`, async ({
    page,
    request,
  }) => {
    await page.goto(path);

    const title = await page
      .locator('meta[property="og:title"]')
      .getAttribute("content");
    const description = await page
      .locator('meta[property="og:description"]')
      .getAttribute("content");
    const imageUrl = await page
      .locator('meta[property="og:image"]')
      .first()
      .getAttribute("content");

    expect(title).toContain("Systemize");
    expect(description).toBeTruthy();
    expect(imageUrl).toBeTruthy();
    expect(new URL(imageUrl ?? "").pathname).toBe("/portal-share-card.png");

    const html = await page.content();
    expect(html).not.toContain("projectId");
    expect(html).not.toContain("companyId");
    expect(html).not.toContain("@gmail.com");

    const imageResponse = await request.get(imageUrl ?? "");
    expect(imageResponse.status()).toBe(200);
    expect(imageResponse.headers()["content-type"]).toContain("image/png");
    expect((await imageResponse.body()).byteLength).toBeGreaterThan(100_000);
  });
}
