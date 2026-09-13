import fs from "node:fs";
const path = "src/styles.css";
const linear = (v) => {
  const n = v / 255;
  return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
};
const contrast = (rgb) =>
  1.05 /
  (0.2126 * linear(rgb[0]) +
    0.7152 * linear(rgb[1]) +
    0.0722 * linear(rgb[2]) +
    0.05);
const css = fs
  .readFileSync(path, "utf8")
  .replace(
    /(?<![\w-])color:\s*(#[a-fA-F0-9]{6})(?![a-fA-F0-9])/g,
    (match, hex) => {
      let rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      // Near-white foregrounds intentionally sit on dark pine surfaces.
      if (rgb.every((v) => v > 215)) return match;
      while (contrast(rgb) < 5.2) rgb = rgb.map((v) => Math.floor(v * 0.97));
      return `color:#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
    },
  );
fs.writeFileSync(path, css);
