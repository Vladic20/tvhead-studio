// [COMP=Reel] node tools/stills.mjs 80,228,416 [scale] [outdir] — bundle once, render several stills, glue a contact sheet.
import { bundle } from "@remotion/bundler"; import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process"; import fs from "node:fs"; import path from "node:path";
const frames = (process.argv[2] || "60").split(",").map(Number), scale = Number(process.argv[3] || 0.4), out = process.argv[4] || "out/stills";
fs.mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const opts = { serveUrl, browserExecutable: "C:/Program Files/Google/Chrome/Application/chrome.exe", chromiumOptions: { gl: "angle" }, chromeMode: "headless-shell" };
const composition = await selectComposition({ ...opts, id: process.env.COMP || "Reel" });
const files = [];
for (const frame of frames) { const o = path.join(out, `f${String(frame).padStart(5, "0")}.png`); await renderStill({ ...opts, composition, frame, output: o, scale, onBrowserLog: (l) => { if (process.env.LOGS && !/Clock/.test(l.text)) console.log("  [browser]", l.type, l.text.slice(0, 200)); } }); files.push(o); console.log("still", frame); }
if (files.length > 1) {
  const cols = Math.min(4, files.length), rows = Math.ceil(files.length / cols);
  const inputs = files.flatMap((f) => ["-i", f]);
  const layout = files.map((_, i) => `${(i % cols) === 0 ? "0" : Array.from({ length: i % cols }, (_, k) => `w${k}`).join("+")}_${Math.floor(i / cols) === 0 ? "0" : Array.from({ length: Math.floor(i / cols) }, (_, k) => `h${k * cols}`).join("+")}`).join("|");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...inputs, "-filter_complex", `xstack=inputs=${files.length}:layout=${layout}:fill=black`, path.join(out, "sheet.jpg")]);
  console.log("sheet", path.join(out, "sheet.jpg"));
}
