// Inline LYGIA #include lines into a single GLSL string module for Remotion.
// usage: node tools/lygia-inline.mjs src/shaders/gradient.frag  -> src/shaders/gradient.shader.ts
import fs from "node:fs"; import path from "node:path"; import os from "node:os";
const LYGIA = process.env.LYGIA_DIR || path.join(os.homedir(), "motion-kit/vendor/patriciogonzalezvivo_lygia");
const seen = new Set();
const resolve = (file, from) => {
  const p = file.startsWith("lygia/") ? path.join(LYGIA, file.slice(6)) : path.resolve(path.dirname(from), file);
  if (seen.has(p)) return ""; seen.add(p);
  return fs.readFileSync(p, "utf8").replace(/^\s*#include\s+"([^"]+)"/gm, (_, f) => resolve(f, p));
};
const src = process.argv[2]; if (!src) { console.error("usage: lygia-inline <file.frag>"); process.exit(1); }
const out = resolve(path.basename(src), path.resolve(src));
const dst = src.replace(/.(frag|glsl)$/, "") + ".shader.ts";
fs.writeFileSync(dst, "export default " + JSON.stringify(out) + ";\n");
console.log("wrote", dst, out.length, "chars");
