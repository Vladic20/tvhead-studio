// Claude Code terminal session drawn into a canvas, as a pure function of the frame.
// Every number shown here comes from the real claude-anime render (voice total, frames, loudness, peak).
import { rr } from "../cozy3d/tex";

type Ln = { at: number; text: string; color?: string; kind?: "prompt" | "tool" | "out" | "redact" | "ok" | "head"; bar?: number };
export type Session = { lines: Ln[]; typed: { at: number; until: number; text: string } };

const C = { bg: "#0c0c0e", ink: "#e6e3dc", dim: "#8b8780", clay: "#E07A52", green: "#5fd38a", blue: "#6aa8ff", yellow: "#f2c14e", red: "#ff5f57", gray: "#3a3a40" };

export const drawTerminal = (g: CanvasRenderingContext2D, w: number, h: number, f: number, s: Session) => {
  g.fillStyle = C.bg; g.fillRect(0, 0, w, h);
  const lh = 46, x0 = 46; g.textBaseline = "middle";
  // header
  g.font = "700 34px Mono"; g.fillStyle = C.clay; g.fillText("✻ Claude Code", x0, 50); g.fillStyle = C.dim; g.fillText("· Opus 5.5 · ~/Desktop/MOTION/claude-anime", x0 + 290, 50);
  g.font = "700 28px Mono"; g.fillStyle = C.dim; g.fillText("model Opus 5.5 · folder ~/Desktop/MOTION · CLAUDE.md loaded · accept edits on", x0, 92);
  const vis = s.lines.filter((l) => f >= l.at);
  // typed prompt
  const ty = s.typed, n = Math.round(ty.text.length * Math.min(1, Math.max(0, (f - ty.at) / (ty.until - ty.at))));
  const rows: Ln[] = [{ at: 0, text: "> " + ty.text.slice(0, n) + (f < ty.until + 6 && f % 16 < 8 ? "▋" : ""), kind: "prompt" }, ...vis];
  const maxRows = Math.floor((h - 150) / lh), start = Math.max(0, rows.length - maxRows);
  rows.slice(start).forEach((l, i) => {
    const y = 150 + i * lh;
    g.font = "700 32px Mono";
    if (l.kind === "prompt") { g.fillStyle = C.ink; g.fillText(l.text, x0, y); return; }
    if (l.kind === "tool") { g.fillStyle = C.green; g.fillText("●", x0, y); g.fillStyle = C.ink; g.fillText(l.text, x0 + 34, y); return; }
    if (l.kind === "redact") { g.fillStyle = C.dim; g.fillText("  ⎿", x0, y); g.fillStyle = C.gray; rr(g, x0 + 90, y - 14, l.bar ?? 200, 28, 4); g.fill(); g.fillStyle = l.color ?? C.ink; g.fillText(l.text, x0 + 110 + (l.bar ?? 200), y); return; }
    g.fillStyle = C.dim; g.fillText("  ⎿", x0, y); g.fillStyle = l.color ?? C.dim; g.fillText(l.text, x0 + 90, y);
  });
  // cursor line at the bottom while working
  const last = vis[vis.length - 1];
  if (last && f - last.at < 40 && f > ty.until) { g.fillStyle = C.clay; g.font = "700 30px Mono"; g.fillText(["✻", "✳", "✶", "✷"][Math.floor(f / 4) % 4] + " Работаю…  (esc чтобы прервать)", x0, h - 40); }
};

// the cream popup card, like a result panel over the terminal
export const drawCard = (g: CanvasRenderingContext2D, w: number, h: number, k: number) => {
  g.clearRect(0, 0, w, h); if (k <= 0) return;
  g.fillStyle = "#f3ead8"; rr(g, 0, 0, w, h, 22); g.fill();
  g.fillStyle = "#E07A52"; g.font = "700 30px Mono"; g.textBaseline = "middle"; g.fillText("▲ готово · claude-anime.mp4", 40, 52);
  g.fillStyle = "#9a8f80"; g.font = "700 24px Mono"; g.fillText("9:16 · 1080×1920 · 30 fps", 40, 92);
  g.fillStyle = "#e0342a"; g.font = "400 96px Russo"; g.fillText("23,7 с аниме", 40, 190);
  const rows = [["кадров", "711 / 711"], ["голос", "7 фраз · Fish free"], ["громкость", "−14,5 LUFS"], ["пик", "−1,8 dBTP"], ["проверка", "PASS × 14"]];
  rows.forEach(([a, b], i) => { g.fillStyle = "#9a8f80"; g.font = "700 26px Mono"; g.fillText(a, 40, 270 + i * 40); g.fillStyle = "#e0342a"; g.fillText(b, 260, 270 + i * 40); });
  g.fillStyle = "#e8a23a"; rr(g, 40, h - 92, 320, 60, 10); g.fill(); g.fillStyle = "#2a1c10"; g.font = "800 28px Inter"; g.fillText("открыть ролик", 70, h - 62);
  g.fillStyle = "#d8cfbe"; rr(g, 380, h - 92, 260, 60, 10); g.fill(); g.fillStyle = "#5a5248"; g.fillText("show out/", 420, h - 62);
};
