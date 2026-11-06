// node tools/asr.mjs [file-prefix ...] — transcribe voice clips with faster-whisper and print what the viewer will HEAR,
// next to what the script SAYS. Use it to catch brand/term pronunciation (Claude → «клоуд»). Output also in out/asr.txt.
import { execFileSync } from "node:child_process"; import fs from "node:fs"; import os from "node:os"; import path from "node:path";
const PY = path.join(os.homedir(), "motion-kit/py-whisper/Scripts/python.exe");
const tl = JSON.parse(fs.readFileSync("src/timeline.json", "utf8"));
const want = process.argv.slice(2);
const lines = tl.scenes.flatMap((s) => s.lines).filter((l) => !want.length || want.some((w) => path.basename(l.file).startsWith(w)));
fs.mkdirSync("out", { recursive: true });
const list = path.resolve("out/asr-in.json"); fs.writeFileSync(list, JSON.stringify(lines.map((l) => path.resolve("public", l.file))));
const code = `
import json,sys
from faster_whisper import WhisperModel
m=WhisperModel('small', device='cpu', compute_type='int8')
o=open(sys.argv[2],'w',encoding='utf-8')
for f in json.load(open(sys.argv[1],encoding='utf-8')):
  s,_=m.transcribe(f, language=sys.argv[3]); o.write(' '.join(x.text.strip() for x in s)+'\\n')`;
const outp = path.resolve("out/asr-raw.txt");
execFileSync(PY, ["-I", "-c", code, list, outp, process.env.LANG_ASR || "ru"], { stdio: ["ignore", "ignore", "inherit"] });
const heard = fs.readFileSync(outp, "utf8").split("\n");
const report = lines.map((l, i) => `${path.basename(l.file)}\n  say:   ${l.say}\n  heard: ${heard[i]}`).join("\n");
fs.writeFileSync("out/asr.txt", report); console.log(report);
