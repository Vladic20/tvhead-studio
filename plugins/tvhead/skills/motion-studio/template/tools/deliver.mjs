// node tools/deliver.mjs out/reel.mp4 <dest-dir> <name> — master (crf 18, yuv420p, −14 LUFS, exact length)
// + phone copy (crf 25, ≤30 MB target) + verify both with tvhead's verify.mjs. Prints file sizes and FAILs.
import { execFileSync } from "node:child_process"; import fs from "node:fs"; import os from "node:os"; import path from "node:path";
const [src = "out/reel.mp4", dest = ".", name = "reel"] = process.argv.slice(2);
const tl = JSON.parse(fs.readFileSync("src/timeline.json", "utf8")), dur = (tl.total / tl.fps).toFixed(3);
const { width, height } = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", src])).streams[0];
const master = path.join(dest, `${name}.mp4`), share = path.join(dest, `${name}_share.mp4`);
const ff = (args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
ff(["-i", src, "-t", dur, "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-color_range", "tv", "-af", "loudnorm=I=-14:TP=-2:LRA=11,aresample=192000,alimiter=limit=0.7:level=false:attack=1:release=50,aresample=48000", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", master]);
let crf = 25;
for (;;) {
  ff(["-i", master, "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", share]);
  if (fs.statSync(share).size <= 29e6 || crf >= 31) break; crf += 2;
}
const verify = path.join(os.homedir(), "tvhead-studio/tools/verify.mjs");
for (const f of [master, share]) {
  console.log(`== ${f}  ${(fs.statSync(f).size / 1e6).toFixed(1)} MB`);
  try { console.log(execFileSync("node", [verify, f, "--w", String(width), "--h", String(height), "--duration", dur], { encoding: "utf8" }).split("\n").filter((l) => /FAIL|loudness|peak|duration/.test(l)).join("\n")); }
  catch (e) { console.log(String(e.stdout || e.message)); }
}
