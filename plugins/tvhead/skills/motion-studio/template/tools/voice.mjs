// Voices the script with tvhead's free Fish S2.1 (OpenRouter) pipeline, copies clips into
// public/voice and writes src/timeline.json (frame-exact scene + line timings at 30 fps).
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";
import { SCENES } from "./script.mjs";

const studio = path.join(os.homedir(), "tvhead-studio");
for (const l of fs.readFileSync(path.join(studio, ".env"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { buildVoice } = await import(pathToFileURL(path.join(studio, "lib/voice.mjs")).href);

const root = path.resolve(import.meta.dirname, "..");
const VOICE = "48ec28a45588422b977a86460c11977f"; // «Энергичный Рассказчик»
const lines = SCENES.flatMap((s) => s.lines.map((l) => ({ text: l.say })));
const { clips } = await buildVoice({ lines, voice: VOICE, cacheDir: path.join(root, "voice-cache"), lang: "ru" });

const FPS = 30, GAP = 0.32, PAD_FIRST = 0.5, PAD_LAST = 2.8, PAD = 0.55; // seconds after a scene (first, last, others)
fs.mkdirSync(path.join(root, "public/voice"), { recursive: true });
let t = 0.3, k = 0; const scenes = [];
for (const s of SCENES) {
  const start = t; const ls = [];
  for (const l of s.lines) {
    const c = clips[k++]; const name = `${s.id}-${ls.length}.mp3`;
    fs.copyFileSync(c.file, path.join(root, "public/voice", name));
    ls.push({ ...l, file: `voice/${name}`, from: Math.round(t * FPS), lead: c.lead, dur: Math.round(c.dur * FPS), words: c.words.map(([w, x]) => [w, Math.round((t + x) * FPS)]) });
    t += c.dur + GAP;
  }
  t += s === SCENES[0] ? PAD_FIRST : s === SCENES[SCENES.length - 1] ? PAD_LAST : PAD;
  scenes.push({ id: s.id, from: Math.round(start * FPS), to: Math.round(t * FPS), lines: ls });
}
const timeline = { fps: FPS, total: Math.round(t * FPS), scenes };
fs.writeFileSync(path.join(root, "src/timeline.json"), JSON.stringify(timeline, null, 1));
console.log(scenes.map((s) => `${s.id}: ${(s.from / FPS).toFixed(1)}–${(s.to / FPS).toFixed(1)}s`).join("\n"), "\ntotal", (t).toFixed(1), "s");
