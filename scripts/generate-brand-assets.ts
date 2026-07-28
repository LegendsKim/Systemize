import { chromium, type Page } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  systemizeBrandColors as colors,
  systemizeMarkGeometry as geometry,
  systemizeMarkSvg,
} from "../src/components/brand/systemize-mark-geometry";

const projectRoot = process.cwd();
const brandDirectory = join(projectRoot, "brand");
const fontPath = join(
  projectRoot,
  "src",
  "assets",
  "fonts",
  "SpaceGrotesk-Latin.woff2"
);

function markSvg(ink: string, accent?: string): string {
  return systemizeMarkSvg({ ink, accent, viewBox: geometry.tightViewBox });
}

function appIconSvg(): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${geometry.viewBox}" fill="none">`,
    `<rect width="24" height="24" rx="5.4" fill="${colors.deepInk}"/>`,
    '<g transform="translate(12 12) scale(.82) translate(-12 -12)">',
    `<path d="${geometry.path}" stroke="${colors.paper}" stroke-width="${geometry.strokeWidth}" stroke-linecap="butt" stroke-linejoin="miter"/>`,
    `<path d="${geometry.accentPath}" stroke="${colors.paper}" stroke-width="${geometry.strokeWidth}" stroke-linecap="butt"/>`,
    "</g></svg>",
  ].join("");
}

function lockupSvg(fontBase64: string, knockout: boolean): string {
  const ink = knockout ? colors.paper : colors.ink;

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 72" fill="none">',
    "<style>",
    `@font-face{font-family:"Space Grotesk Embedded";src:url(data:font/woff2;base64,${fontBase64}) format("woff2");font-weight:300 700;font-style:normal}`,
    ".name{font-family:\"Space Grotesk Embedded\",\"Space Grotesk\",sans-serif;font-size:40px;font-weight:600;letter-spacing:8.8px}",
    "</style>",
    '<g transform="translate(0 4) scale(2.6666667)">',
    `<path d="${geometry.path}" stroke="${ink}" stroke-width="${geometry.strokeWidth}" stroke-linecap="butt" stroke-linejoin="miter"/>`,
    `<path d="${geometry.accentPath}" stroke="${ink}" stroke-width="${geometry.strokeWidth}" stroke-linecap="butt"/>`,
    "</g>",
    `<text class="name" x="80" y="51" fill="${ink}">SYSTEMIZE</text>`,
    "</svg>",
  ].join("");
}

async function rasterise(
  page: Page,
  svg: string,
  outputName: string,
  width: number,
  height: number
): Promise<void> {
  await page.setViewportSize({
    width: Math.max(1, Math.ceil(width)),
    height: Math.max(1, Math.ceil(height)),
  });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${width}px;height:${height}px}</style>${svg}`
  );
  await page.locator("svg").screenshot({
    path: join(brandDirectory, outputName),
    omitBackground: true,
    animations: "disabled",
  });
}

async function renderStressTest(page: Page): Promise<void> {
  const colourMark = markSvg(colors.ink);
  const monoMark = markSvg(colors.ink);
  const knockoutMark = markSvg(colors.paper);
  const sizes = [16, 24, 36, 128, 512];
  const samples = sizes
    .map(
      (size) =>
        `<figure><div class="light" style="width:${size}px;height:${size}px">${colourMark}</div><figcaption>${size}px</figcaption></figure>`
    )
    .join("");

  await page.setViewportSize({ width: 1180, height: 760 });
  await page.setContent(`<!doctype html><html dir="rtl"><style>
    *{box-sizing:border-box}body{margin:0;padding:32px;background:#e7e9eb;color:#20262f;font:14px Arial,sans-serif}
    h1{margin:0 0 24px;font-size:20px}section{display:flex;direction:ltr;align-items:end;gap:24px;margin-block-end:32px}
    figure{margin:0;text-align:center}.light,.dark{display:grid;place-items:center}.light{background:#f5f6f7}.dark{background:#20262f}
    svg{width:100%;height:100%}figcaption{margin-block-start:8px}
    .variant{width:128px;height:128px;padding:12px}.rtl-lockup{display:flex;direction:ltr;align-items:center;gap:14px;padding:18px 24px;background:#f5f6f7}
    .rtl-lockup svg{width:48px;height:48px}.rtl-lockup span{font:600 28px "Space Grotesk",Arial,sans-serif;letter-spacing:.22em}
  </style><body>
    <h1>Systemize mark stress test</h1>
    <section>${samples}</section>
    <section>
      <figure><div class="light variant">${monoMark}</div><figcaption>single colour</figcaption></figure>
      <figure><div class="dark variant">${knockoutMark}</div><figcaption>knockout</figcaption></figure>
      <div class="rtl-lockup">${colourMark}<span>SYSTEMIZE</span></div>
    </section>
  </body></html>`);
  await page.screenshot({
    path: join(brandDirectory, "systemize-stress-test.png"),
    fullPage: true,
    animations: "disabled",
  });
}

async function main(): Promise<void> {
  await mkdir(brandDirectory, { recursive: true });
  const fontBase64 = (await readFile(fontPath)).toString("base64");

  const assets = {
    "systemize-mark.svg": markSvg(colors.ink),
    "systemize-mark-white.svg": markSvg(colors.paper),
    "systemize-mark-mono.svg": markSvg(colors.ink),
    "systemize-app-icon.svg": appIconSvg(),
    "systemize-lockup.svg": lockupSvg(fontBase64, false),
    "systemize-lockup-white.svg": lockupSvg(fontBase64, true),
  } as const;

  await Promise.all(
    Object.entries(assets).map(([name, source]) =>
      writeFile(join(brandDirectory, name), `${source}\n`, "utf8")
    )
  );
  await writeFile(join(projectRoot, "src", "app", "icon.svg"), `${assets["systemize-app-icon.svg"]}\n`);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    await rasterise(page, assets["systemize-mark.svg"], "systemize-mark-512.png", 512, 512);
    await rasterise(
      page,
      assets["systemize-app-icon.svg"],
      "systemize-app-icon-512.png",
      512,
      512
    );
    await rasterise(
      page,
      assets["systemize-app-icon.svg"],
      "systemize-app-icon-1024.png",
      1024,
      1024
    );
    await rasterise(
      page,
      assets["systemize-lockup.svg"],
      "systemize-lockup-400h.png",
      (480 / 72) * 400,
      400
    );
    await rasterise(
      page,
      assets["systemize-lockup.svg"],
      "systemize-lockup-800h.png",
      (480 / 72) * 800,
      800
    );
    await renderStressTest(page);
  } finally {
    await browser.close();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
