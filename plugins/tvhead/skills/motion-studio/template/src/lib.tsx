import React from "react";
import { AbsoluteFill, Easing, staticFile } from "remotion";
import tlj from "./timeline.json";

export type Word = [string, number];
export type Line = { say: string; cap: string; file: string; from: number; dur: number; lead: number; words: Word[] };
export type Scene = { id: string; from: number; to: number; lines: Line[] };
export const TL = tlj as unknown as { fps: number; total: number; scenes: Scene[] };
export const LINES = TL.scenes.flatMap((s) => s.lines);
export const SC = (id: string) => TL.scenes.find((s) => s.id === id)!;
export const L = (id: string, i: number) => SC(id).lines[i].from;
export const LE = (id: string, i: number) => SC(id).lines[i].from + SC(id).lines[i].dur;
const norm = (s: string) => s.toLowerCase().replace(/[^а-яёa-z0-9]/g, "");
// frame of a word in a line (fails the build on a wrong prefix instead of silently shifting a cue)
export const W = (id: string, i: number, w: string, nth = 0) => {
  const m = SC(id).lines[i].words.filter(([t]) => norm(t).startsWith(w));
  if (!m[nth]) throw new Error(`no word ${w} in ${id}/${i}`); return m[nth][1];
};

export const C = { bg: "#0b0c12", ink: "#f4efe8", dim: "rgba(244,239,232,0.55)", clay: "#D9774F", clayHi: "#E99A76", clayLo: "#A9573A", green: "#7ee0a1", red: "#ff5a4e", blue: "#7db7ff", panel: "#14161f" };
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const rand = (s: number) => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
export const io = Easing.inOut(Easing.cubic), expoOut = Easing.out(Easing.exp), backOut = Easing.out(Easing.back(1.7));
export const p = (f: number, at: number, len: number, e: (t: number) => number = expoOut) => e(clamp((f - at) / len));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// smooth value noise in [-0.5, 0.5]: random keys every `period` frames, smoothstep between them.
// Use for handheld cameras and wobble — never raw rand(floor(f/n)), which jumps and reads as stutter.
export const smoothNoise = (f: number, period = 12, seed = 0) => { const x = f / period, i = Math.floor(x), t = x - i, s = t * t * (3 - 2 * t); return lerp(rand(i * 13.7 + seed * 101), rand((i + 1) * 13.7 + seed * 101), s) - 0.5; };

export const Fonts: React.FC = () => <style>{`
  ${[["Inter", "Inter-800", 800], ["Inter", "Inter-500", 500], ["Mono", "JetBrainsMono-700", 700], ["Russo", "RussoOne-400", 400]].flatMap(([n, b, w]) => ["cyrillic", "latin"].map((u) => `@font-face{font-family:${n};font-weight:${w};src:url(${staticFile(`fonts/${b}-${u}.woff2`)}) format('woff2');unicode-range:${u === "cyrillic" ? "U+0400-04FF" : "U+0000-03FF,U+2000-20AC,U+2190-27FF"};}`)).join("\n")}
`}</style>;

// enter/exit of a scene's UI layer: slides up and blurs out like a quick whip
export const Stage: React.FC<{ id: string; f: number; children: React.ReactNode; inDir?: number }> = ({ id, f, children, inDir = 1 }) => {
  const s = SC(id); if (f < s.from - 2 || f > s.to + 10) return null;
  const a = p(f, s.from - 2, 10), b = p(f, s.to - 2, 10, Easing.in(Easing.cubic));
  const y = (1 - a) * 140 * inDir - b * 160, blur = (1 - a) * 18 + b * 22, op = a * (1 - b);
  return <AbsoluteFill style={{ transform: `translateY(${y}px) scale(${1 + b * 0.06})`, filter: blur > 0.4 ? `blur(${blur}px)` : undefined, opacity: op }}>{children}</AbsoluteFill>;
};

// karaoke captions: groups of ≤4 words, current word in clay
// Reels/TikTok/Shorts safe zone (1080×1920): the app draws its caption, buttons and profile over the bottom ~500 px and the
// right ~120 px. Keep every word and logo inside x 60…960, y 160…1420. Captions sit at y 1250 so two lines end by ~1420.
export const SAFE = { left: 60, right: 960, top: 160, bottom: 1420 };
export const Captions: React.FC<{ f: number; y?: number }> = ({ f, y = 1250 }) => {
  const l = [...LINES].reverse().find((l) => f >= l.from - 2 && f < l.from + l.dur + 6); if (!l) return null;
  const ws = l.words; let idx = 0; ws.forEach(([, t], i) => { if (f >= t) idx = i; });
  const g0 = Math.floor(idx / 4) * 4, grp = ws.slice(g0, g0 + 4);
  const at = ws[g0][1], pop = p(f, at - 2, 8, backOut);
  return <div style={{ position: "absolute", left: SAFE.left, right: 1080 - SAFE.right, top: y, display: "flex", justifyContent: "center", transform: `scale(${0.9 + pop * 0.1})`, opacity: pop }}>
    <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 18px", background: "rgba(8,8,12,0.62)", borderRadius: 26, padding: "10px 26px 14px", backdropFilter: "blur(6px)" }}>
    {grp.map(([w, t], k) => { const on = f >= t && (k === grp.length - 1 || f < grp[k + 1][1]) && g0 + k === idx; return (
      <span key={k} style={{ font: "800 66px Inter", color: on ? C.clay : f >= t ? C.ink : "rgba(244,239,232,0.35)", textShadow: "0 6px 24px rgba(0,0,0,0.65)", transform: on ? "translateY(-6px)" : undefined, display: "inline-block" }}>{w.replace(/[«»]/g, "")}</span>); })}
    </div>
  </div>;
};

export const Grain: React.FC<{ f: number; o?: number }> = ({ f, o = 0.07 }) => <AbsoluteFill style={{ pointerEvents: "none", opacity: o, mixBlendMode: "overlay" }}><svg width="1080" height="1920"><filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 24} /><feColorMatrix type="saturate" values="0" /></filter><rect width="1080" height="1920" filter="url(#gr)" /></svg></AbsoluteFill>;
export const Vignette: React.FC = () => <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.65) 100%)", pointerEvents: "none" }} />;
