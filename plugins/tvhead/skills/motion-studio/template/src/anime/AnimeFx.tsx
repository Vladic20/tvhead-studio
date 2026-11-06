// Anime 2D layers (DOM/SVG over and under the 3D): painted sky, petals, focus/speed lines, impact frame, onomatopoeia,
// ability cards, title and end cards. All pure functions of the frame.
import React from "react";
import { AbsoluteFill } from "remotion";
import { clamp, rand } from "../lib";

const W = 1080, H = 1920;

// Shinkai-ish sky: deep zenith → bright horizon, big lit cumulus, sun glow. `t` 0 = day, 1 = sunset. `pan` shifts clouds.
export const Sky: React.FC<{ f: number; t: number; pan?: number }> = ({ f, t, pan = 0 }) => {
  const mix = (a: string, b: string) => { const A = a.match(/\w\w/g)!.map((x) => parseInt(x, 16)), B = b.match(/\w\w/g)!.map((x) => parseInt(x, 16)); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`; };
  const top = mix("#1d4fb8", "#2a1d5c"), mid = mix("#4f9ff0", "#d0607a"), hor = mix("#bfe6ff", "#ffb36b");
  const clouds = Array.from({ length: 7 }, (_, i) => ({ x: ((rand(i) * 1600 + f * (0.4 + rand(i * 3) * 0.5) + pan) % 1700) - 300, y: 380 + rand(i * 5) * 700, s: 0.7 + rand(i * 7) * 0.9 }));
  return <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top} 0%, ${mid} 48%, ${hor} 78%)` }}>
    <svg width={W} height={H} style={{ position: "absolute" }}>
      <defs>
        <radialGradient id="sun"><stop offset="0" stopColor={mix("#ffffff", "#fff0c0")} stopOpacity="1" /><stop offset="0.25" stopColor={mix("#fff8e0", "#ffc070")} stopOpacity="0.8" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" /></radialGradient>
        <linearGradient id="cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="0.55" stopColor={mix("#f3f8ff", "#ffd8c0")} /><stop offset="1" stopColor={mix("#9fb8dc", "#b0607a")} /></linearGradient>
      </defs>
      <circle cx={760} cy={1180 - t * 120} r={420} fill="url(#sun)" />
      {clouds.map((c, i) => <g key={i} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
        {[[0, 0, 130], [120, -40, 110], [230, 10, 120], [330, 40, 80], [-110, 30, 90], [60, 60, 120], [190, 70, 110]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} fill="url(#cl)" />)}
        <ellipse cx={110} cy={120} rx={300} ry={40} fill={mix("#a9c2e4", "#a05a78")} opacity={0.6} />
      </g>)}
      {/* distant birds */}
      {Array.from({ length: 4 }, (_, i) => { const x = (f * 1.6 + i * 90 + 200) % 1300 - 100, y = 520 + i * 26 + Math.sin(f / 10 + i) * 8; return <path key={i} d={`M${x - 12} ${y} q6 -8 12 0 q6 -8 12 0`} stroke="#1c2340" strokeWidth={3} fill="none" opacity={0.6} />; })}
    </svg>
  </AbsoluteFill>;
};

export const Petals: React.FC<{ f: number; n?: number; wind?: number }> = ({ f, n = 26, wind = 1 }) => (
  <svg width={W} height={H} style={{ position: "absolute", pointerEvents: "none" }}>
    {Array.from({ length: n }, (_, i) => { const sp = 1.5 + rand(i) * 2.2, x = ((rand(i * 3) * 1400 - f * sp * 2.2 * wind) % 1400 + 1400) % 1400 - 160, y = ((rand(i * 5) * 2100 + f * sp * 1.4) % 2100) - 100, r = f * (2 + rand(i) * 5) + i * 40;
      return <ellipse key={i} cx={0} cy={0} rx={14 + rand(i * 7) * 8} ry={7 + rand(i) * 4} fill={i % 3 ? "#ffd1e0" : "#ffb3cb"} opacity={0.9} transform={`translate(${x} ${y}) rotate(${r}) scale(1 ${Math.abs(Math.cos(f / 9 + i))})`} />; })}
  </svg>
);

// manga focus lines (集中線) around a centre; `o` opacity, `seed` reshuffles each frame for the jitter
export const FocusLines: React.FC<{ f: number; cx?: number; cy?: number; o?: number; inner?: number; color?: string }> = ({ f, cx = 540, cy = 900, o = 1, inner = 360, color = "#ffffff" }) => {
  if (o <= 0) return null; const s = Math.floor(f / 2);
  return <svg width={W} height={H} style={{ position: "absolute", pointerEvents: "none", opacity: o }}>
    {Array.from({ length: 90 }, (_, i) => { const a = (i / 90) * Math.PI * 2 + rand(s * 91 + i) * 0.05, r0 = inner + rand(s * 7 + i) * 220, wdt = 2 + rand(s + i * 3) * 9;
      const x1 = cx + Math.cos(a) * r0, y1 = cy + Math.sin(a) * r0, x2 = cx + Math.cos(a) * 2200, y2 = cy + Math.sin(a) * 2200, nx = -Math.sin(a) * wdt, ny = Math.cos(a) * wdt;
      return <path key={i} d={`M${x1} ${y1} L${x2 + nx} ${y2 + ny} L${x2 - nx} ${y2 - ny} Z`} fill={color} />; })}
  </svg>;
};

// horizontal speed streaks for a dash
export const SpeedLines: React.FC<{ f: number; o?: number; dir?: number }> = ({ f, o = 1, dir = 1 }) => o <= 0 ? null : (
  <svg width={W} height={H} style={{ position: "absolute", pointerEvents: "none", opacity: o }}>
    {Array.from({ length: 40 }, (_, i) => { const y = rand(i * 3 + Math.floor(f / 2)) * H, len = 300 + rand(i) * 700, x = ((rand(i * 5) * 2000 + f * 90 * dir) % 2400) - 600; return <rect key={i} x={dir > 0 ? x : W - x - len} y={y} width={len} height={2 + rand(i * 9) * 6} fill="#ffffff" opacity={0.7} />; })}
  </svg>
);

// big onomatopoeia with a thick ink outline
export const Sfx: React.FC<{ text: string; p: number; x: number; y: number; rot?: number; size?: number; color?: string }> = ({ text, p, x, y, rot = -10, size = 220, color = "#ffe14a" }) => p <= 0 ? null : (
  <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${p < 0.3 ? 0.5 + p * 3 : 1.4 - p * 0.4})`, font: `400 ${size}px Russo`, color, WebkitTextStroke: "14px #140b0a", paintOrder: "stroke fill", letterSpacing: 4, opacity: p > 0.85 ? (1 - p) / 0.15 : 1, whiteSpace: "nowrap" }}>{text}</div>
);

// ability card slamming in (glowing frame, name, kanji-like rune line)
export const SkillCard: React.FC<{ name: string; sub: string; p: number; x: number; y: number; rot: number; color: string }> = ({ name, sub, p, x, y, rot, color }) => {
  if (p <= 0) return null; const k = clamp(p * 4), sh = (1 - k) * 600;
  return <div style={{ position: "absolute", left: x, top: y, width: 760, transform: `translate(-50%,-50%) translateX(${sh}px) rotate(${rot}deg) skewX(-8deg)`, opacity: p > 0.9 ? (1 - p) * 10 : 1 }}>
    <div style={{ background: "linear-gradient(90deg, rgba(10,8,20,0.92), rgba(10,8,20,0.7))", border: `6px solid ${color}`, boxShadow: `0 0 50px ${color}, inset 0 0 30px ${color}55`, padding: "18px 36px" }}>
      <div style={{ font: "800 34px Inter", color, letterSpacing: 6 }}>{sub}</div>
      <div style={{ font: "400 118px Russo", color: "#fff", textShadow: `0 0 30px ${color}`, lineHeight: 1.05 }}>{name}</div>
    </div>
  </div>;
};

// impact frame: the whole picture flips to harsh black/white for a few frames
export const impactFilter = (on: boolean, f: number) => (on ? `grayscale(1) invert(${f % 2 ? 1 : 0}) contrast(6) brightness(1.1)` : undefined);
