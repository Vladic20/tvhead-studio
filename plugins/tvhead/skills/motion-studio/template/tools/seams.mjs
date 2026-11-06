// node tools/seams.mjs out/x.mp4 — frames 3 before / 4 after every scene cut of the rendered mp4 → out/seams/seams.jpg
import { execFileSync } from "node:child_process"; import fs from "node:fs"; import path from "node:path";
const mp4 = process.argv[2] || "out/reel.mp4";
const tl = JSON.parse(fs.readFileSync("src/timeline.json", "utf8"));
const dir = "out/seams"; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
const ts = tl.scenes.slice(1).flatMap((s) => [s.from - 3, s.from + 4]);
ts.forEach((f, i) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", (f / tl.fps).toFixed(3), "-i", mp4, "-frames:v", "1", "-vf", "scale=216:384", path.join(dir, String(i).padStart(2, "0") + ".png")]));
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", path.join(dir, "%02d.png"), "-vf", `tile=${Math.min(8, ts.length)}x${Math.ceil(ts.length / 8)}`, path.join(dir, "seams.jpg")]);
console.log("seams", path.join(dir, "seams.jpg"), "— pairs: before|after each cut");
