import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const root = process.cwd();
const outputPath = join(root, "src", "app", "opengraph-image.png");
const portalOutputPath = join(root, "public", "portal-share-card.png");

function dataUri(buffer, mimeType) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

const [hero, mark, mediumFont, boldFont] = await Promise.all([
  readFile(join(root, "public", "hero", "hero-landscape.webp")),
  readFile(join(root, "brand", "systemize-mark.svg")),
  readFile(join(root, "src", "assets", "fonts", "Heebo-Medium.ttf")),
  readFile(join(root, "src", "assets", "fonts", "Heebo-Bold.ttf")),
]);

const browser = await chromium.launch();

try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });

  await page.setContent(`
    <!doctype html>
    <html lang="he" dir="ltr">
      <head>
        <meta charset="utf-8" />
        <style>
          @font-face {
            font-family: "Heebo OG";
            src: url("${dataUri(mediumFont, "font/ttf")}") format("truetype");
            font-weight: 500;
          }
          @font-face {
            font-family: "Heebo OG";
            src: url("${dataUri(boldFont, "font/ttf")}") format("truetype");
            font-weight: 700;
          }
          * { box-sizing: border-box; }
          html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
          body {
            position: relative;
            background: #f1f2f3;
            color: #20262f;
            font-family: "Heebo OG", sans-serif;
          }
          .hero {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
          }
          .wash {
            position: absolute;
            inset: 0;
            background:
              radial-gradient(circle at 56% 56%, rgba(30, 205, 200, 0.14), transparent 26%),
              linear-gradient(90deg, rgba(245,246,247,.995) 0%, rgba(245,246,247,.97) 31%, rgba(245,246,247,.62) 49%, rgba(245,246,247,.02) 72%);
          }
          .frame {
            position: absolute;
            inset: 22px;
            border: 1px solid rgba(32,38,47,.1);
            border-radius: 30px;
            box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 24px 80px rgba(32,38,47,.12);
          }
          .trail {
            position: absolute;
            inset: 0;
            filter: drop-shadow(0 0 10px rgba(31,202,199,.55));
          }
          .copy {
            position: absolute;
            inset-inline-start: 58px;
            inset-block: 48px 54px;
            width: 520px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .lockup {
            display: flex;
            align-items: center;
            gap: 16px;
            color: #20262f;
          }
          .lockup img { width: 40px; height: 40px; }
          .lockup span {
            direction: ltr;
            font-family: Arial, sans-serif;
            font-size: 25px;
            font-weight: 700;
            letter-spacing: .28em;
          }
          .message {
            direction: rtl;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            text-align: start;
          }
          .eyebrow {
            display: flex;
            align-items: center;
            gap: 13px;
            margin-block-end: 18px;
            color: #53707a;
            font-size: 21px;
            font-weight: 500;
          }
          .eyebrow::before {
            content: "";
            width: 54px;
            height: 3px;
            border-radius: 999px;
            background: #159b99;
          }
          h1 {
            margin: 0;
            font-size: 54px;
            font-weight: 700;
            line-height: 1.12;
            letter-spacing: -.025em;
          }
          h1 span { display: block; }
          h1 .accent { color: #0f8584; }
          .support {
            margin: 20px 0 0;
            color: #5d6975;
            font-size: 23px;
            font-weight: 500;
          }
          .footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
          }
          .domain {
            direction: ltr;
            color: #6d7782;
            font-family: Arial, sans-serif;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: .12em;
          }
          .portal {
            direction: rtl;
            padding: 10px 16px;
            border: 1px solid rgba(21,155,153,.35);
            border-radius: 999px;
            background: rgba(255,255,255,.78);
            box-shadow: 0 8px 24px rgba(21,155,153,.14), inset 0 1px 0 #fff;
            color: #116f6e;
            font-size: 18px;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <img class="hero" src="${dataUri(hero, "image/webp")}" alt="" />
        <div class="wash"></div>
        <svg class="trail" width="1200" height="630" viewBox="0 0 1200 630" aria-hidden="true">
          <path d="M430 512 C535 548 585 430 665 410 C735 392 760 330 820 306"
            fill="none" stroke="rgba(31,202,199,.18)" stroke-width="16" stroke-linecap="round" />
          <path d="M430 512 C535 548 585 430 665 410 C735 392 760 330 820 306"
            fill="none" stroke="#20c9c6" stroke-width="5" stroke-linecap="round" />
          <circle cx="430" cy="512" r="10" fill="#f5f6f7" stroke="#20c9c6" stroke-width="4" />
          <circle cx="665" cy="410" r="10" fill="#f5f6f7" stroke="#20c9c6" stroke-width="4" />
          <circle cx="820" cy="306" r="10" fill="#20c9c6" stroke="#f5f6f7" stroke-width="4" />
        </svg>
        <div class="frame"></div>
        <div class="copy">
          <div class="lockup">
            <img src="${dataUri(mark, "image/svg+xml")}" alt="" />
            <span>SYSTEMIZE</span>
          </div>
          <div class="message">
            <div class="eyebrow">מערכות ניהול בענן בהתאמה לעסק</div>
            <h1>
              <span>לא מתאימים את</span>
              <span>העסק למערכת</span>
              <span class="accent">בונים את המערכת</span>
              <span class="accent">סביב העסק</span>
            </h1>
            <p class="support">מאפיון ותכנון ועד פיתוח, הטמעה וליווי</p>
          </div>
          <div class="footer">
            <div class="domain">SYSTEMIZE.CO.IL</div>
            <div class="portal">אתר ופורטל לקוחות מאובטח</div>
          </div>
        </div>
      </body>
    </html>
  `);

  await page.screenshot({ path: outputPath, type: "png" });
  console.log(`Generated ${outputPath}`);

  await page.locator(".eyebrow").evaluate((element) => {
    element.textContent = "SYSTEMIZE PORTAL";
  });
  await page.locator("h1").evaluate((element) => {
    element.innerHTML = `
      <span>הזמנה אישית</span>
      <span class="accent">למרחב הפרויקט שלך</span>
    `;
  });
  await page.locator(".support").evaluate((element) => {
    element.textContent = "כל שלב, מסמך והחלטה — במקום אחד מאובטח";
    element.style.fontSize = "20px";
  });
  await page.locator(".portal").evaluate((element) => {
    element.textContent = "כניסה מאובטחת באמצעות Google";
  });

  await page.screenshot({ path: portalOutputPath, type: "png" });
  console.log(`Generated ${portalOutputPath}`);
} finally {
  await browser.close();
}
