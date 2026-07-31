import { expect, test, type Page } from "@playwright/test";

const mobileViewports = [
  { name: "narrow Android", width: 280, height: 653 },
  { name: "iPhone SE", width: 320, height: 568 },
  { name: "iPhone 14", width: 390, height: 844 },
  { name: "OnePlus portrait", width: 412, height: 915 },
  { name: "iPhone landscape", width: 844, height: 390 },
  { name: "OnePlus landscape", width: 915, height: 412 },
] as const;

function overlapOnInlineAxis(
  first: { x: number; width: number },
  second: { x: number; width: number }
): number {
  return Math.min(first.x + first.width, second.x + second.width) -
    Math.max(first.x, second.x);
}

async function openMobileHome(
  page: Page,
  viewport: (typeof mobileViewports)[number]
): Promise<void> {
  await page.setViewportSize({
    width: viewport.width,
    height: viewport.height,
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".hero-heading")).toBeVisible();
}

for (const viewport of mobileViewports) {
  test(`${viewport.name} keeps the hero readable and inside the viewport`, async ({
    page,
  }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await openMobileHome(page, viewport);

    await expect(
      page.locator(
        "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay"
      )
    ).toHaveCount(0);
    expect(consoleErrors).toEqual([]);

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(
      dimensions.clientWidth + 1
    );
    await expect(page.locator(".site-wordmark-name")).toBeVisible();

    const header = await page.locator(".site-header").boundingBox();
    const heading = await page.locator(".hero-heading").boundingBox();
    const primaryAction = await page.locator(".hero-cta").boundingBox();
    expect(header).not.toBeNull();
    expect(heading).not.toBeNull();
    expect(primaryAction).not.toBeNull();

    expect(heading!.y).toBeGreaterThanOrEqual(header!.y + header!.height - 1);
    expect(heading!.x).toBeGreaterThanOrEqual(0);
    expect(heading!.x + heading!.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(primaryAction!.x).toBeGreaterThanOrEqual(0);
    expect(primaryAction!.x + primaryAction!.width).toBeLessThanOrEqual(
      viewport.width + 1
    );
    expect(primaryAction!.height).toBeGreaterThanOrEqual(44);

    if (
      viewport.width <= 480 &&
      viewport.height >= 844 &&
      viewport.height > viewport.width
    ) {
      const finalMilestone = await page
        .locator(".hero-milestone")
        .last()
        .boundingBox();
      const nextSection = await page.locator(".process-story").boundingBox();
      expect(finalMilestone).not.toBeNull();
      expect(nextSection).not.toBeNull();
      expect(finalMilestone!.y + finalMilestone!.height).toBeLessThanOrEqual(
        viewport.height
      );
      expect(finalMilestone!.y + finalMilestone!.height).toBeGreaterThanOrEqual(
        viewport.height * 0.72
      );
      expect(nextSection!.y).toBeGreaterThanOrEqual(viewport.height - 1);
      await expect(page.locator(".hero-mobile-route")).toBeVisible();
      await expect(page.locator(".process-kicker")).not.toBeInViewport();
    }

    if (viewport.name.startsWith("OnePlus")) {
      await testInfo.attach(`${viewport.name}.png`, {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    }

    const floatingControls = [
      page.locator(".whatsapp-launcher-disc"),
      page.locator(".a11y-trigger"),
    ];
    for (const control of floatingControls) {
      const box = await control.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }

    const firstMilestone = page.locator(".hero-milestone").first();
    await firstMilestone.scrollIntoViewIfNeeded();
    const node = await firstMilestone
      .locator(".hero-milestone-number")
      .boundingBox();
    const whatsapp = await page
      .locator(".whatsapp-launcher-disc")
      .boundingBox();
    expect(node).not.toBeNull();
    expect(whatsapp).not.toBeNull();
    expect(overlapOnInlineAxis(node!, whatsapp!)).toBeLessThanOrEqual(0);

    if (viewport.height <= 544) {
      await expect(page.locator(".site-nav")).toBeHidden();
      await expect(page.locator(".hero-stage")).toBeHidden();
    } else {
      const navigation = await page.locator(".site-nav").boundingBox();
      const wordmark = await page.locator(".site-wordmark").boundingBox();
      expect(navigation).not.toBeNull();
      expect(wordmark).not.toBeNull();
      expect(overlapOnInlineAxis(navigation!, wordmark!)).toBeLessThanOrEqual(0);
    }

  });
}
