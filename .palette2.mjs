import sharp from "sharp";

/*
 * Sample the outermost 2px frame of each plate. Averaging a wide strip pulls the result
 * dark, because the contour lines drawn near the edge are counted in; the field only has
 * to match the pixels actually adjacent to the boundary.
 */
async function edge(file) {
  const { width, height } = await sharp(file).metadata();
  const strips = [
    { left: 0, top: 0, width, height: 2 },
    { left: 0, top: height - 2, width, height: 2 },
    { left: 0, top: 0, width: 2, height },
    { left: width - 2, top: 0, width: 2, height },
  ];

  const all = [];
  for (const strip of strips) {
    const { data, info } = await sharp(file).extract(strip).raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += info.channels) {
      all.push([data[i], data[i + 1], data[i + 2]]);
    }
  }

  // Median per channel: immune to the handful of dark contour pixels that touch the edge.
  const median = [0, 1, 2].map((c) => {
    const sorted = all.map((p) => p[c]).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  });

  console.log(
    `${file}  ${width}x${height}  median edge #${median.map((v) => v.toString(16).padStart(2, "0")).join("")}  rgb(${median.join(", ")})`
  );
}

await edge("public/hero/hero-desktop.webp");
await edge("public/hero/hero-mobile.webp");
