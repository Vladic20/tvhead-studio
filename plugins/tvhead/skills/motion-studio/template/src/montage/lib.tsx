import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, Easing } from "remotion";

export const W = 1080, H = 1920;
export const C = {
  bg: "#0a0c10", panel: "#11151c", grid: "rgba(255,255,255,0.07)", text: "#f3f1ea", dim: "#8a93a3",
  red: "#ff3b30", green: "#2bd576", gold: "#f6c445", blue: "#4aa3ff", paper: "#efe9dc", ink: "#16181d",
};
export const F = {
  head: "'Russo One', sans-serif", body: "'Inter', sans-serif", hand: "'Neucha', cursive", mono: "'JetBrains Mono', monospace",
};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const prog = (f: number, a: number, len: number, ease = Easing.inOut(Easing.cubic)) =>
  ease(clamp((f - a) / Math.max(1, len)));
export const outBack = Easing.out(Easing.back(1.6));
export const outExpo = Easing.out(Easing.exp);
// deterministic pseudo-random
export const rand = (seed: number) => { const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
export const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU").replace(/,/g, " ").replace(/ /g, " ");

export const Fonts: React.FC = () => (
  <style>{`
  @font-face{font-family:'Inter';font-weight:800;src:url(${staticFile("fonts/Inter-800-cyrillic.woff2")}) format('woff2');unicode-range:U+0400-04FF;}
  @font-face{font-family:'Inter';font-weight:800;src:url(${staticFile("fonts/Inter-800-latin.woff2")}) format('woff2');unicode-range:U+0000-03FF,U+2000-20FF;}
  @font-face{font-family:'Inter';font-weight:500;src:url(${staticFile("fonts/Inter-500-cyrillic.woff2")}) format('woff2');unicode-range:U+0400-04FF;}
  @font-face{font-family:'Inter';font-weight:500;src:url(${staticFile("fonts/Inter-500-latin.woff2")}) format('woff2');unicode-range:U+0000-03FF,U+2000-20FF;}
  @font-face{font-family:'Russo One';src:url(${staticFile("fonts/RussoOne-400-cyrillic.woff2")}) format('woff2');unicode-range:U+0400-04FF;}
  @font-face{font-family:'Russo One';src:url(${staticFile("fonts/RussoOne-400-latin.woff2")}) format('woff2');unicode-range:U+0000-03FF,U+2000-20FF;}
  @font-face{font-family:'Neucha';src:url(${staticFile("fonts/Neucha-cyrillic.woff2")}) format('woff2');unicode-range:U+0400-04FF;}
  @font-face{font-family:'Neucha';src:url(${staticFile("fonts/PatrickHand-latin.woff2")}) format('woff2');unicode-range:U+0000-03FF,U+2000-20FF;}
  @font-face{font-family:'JetBrains Mono';src:url(${staticFile("fonts/JetBrainsMono-700-cyrillic.woff2")}) format('woff2');unicode-range:U+0400-04FF;}
  @font-face{font-family:'JetBrains Mono';src:url(${staticFile("fonts/JetBrainsMono-700-latin.woff2")}) format('woff2');unicode-range:U+0000-03FF,U+2000-20FF;}
  `}</style>
);

// ── background: dark terminal with grid, vignette and film grain ─────────────
export const Backdrop: React.FC<{ tint?: string }> = ({ tint = "#1a2230" }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 40%, ${tint} 0%, ${C.bg} 70%)` }}>
      <svg width={W} height={H} style={{ position: "absolute", opacity: 0.5 }}>
        <defs><pattern id="g" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke={C.grid} strokeWidth="1" /></pattern></defs>
        <rect width={W} height={H} fill="url(#g)" transform={`translate(0 ${(f * 0.4) % 60})`} />
      </svg>
    </AbsoluteFill>
  );
};
export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.28 }}>
      <svg width={W} height={H}>
        <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 12} /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width={W} height={H} filter="url(#n)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(100% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.75) 100%)", mixBlendMode: "normal" }} />
    </AbsoluteFill>
  );
};

// ── archive photo: Ken Burns, optional sepia, credit line ────────────────────
export const Photo: React.FC<{ src: string; from: number; len: number; credit?: string; zoom?: [number, number]; pan?: [number, number, number, number]; sepia?: boolean; box?: { x: number; y: number; w: number; h: number }; fit?: "cover" | "contain"; bg?: string; radius?: number }> =
  ({ src, from, len, credit, zoom = [1.05, 1.18], pan = [0, 0, 0, 0], sepia, box = { x: 40, y: 430, w: 1000, h: 980 }, fit = "cover", bg = "#000", radius = 18 }) => {
    const f = useCurrentFrame();
    const t = clamp((f - from) / len);
    const op = interpolate(f, [from, from + 8, from + len - 8, from + len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    if (op <= 0) return null;
    const s = zoom[0] + (zoom[1] - zoom[0]) * t;
    const tx = pan[0] + (pan[2] - pan[0]) * t, ty = pan[1] + (pan[3] - pan[1]) * t;
    const pop = interpolate(f, [from, from + 10], [0.94, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: outExpo });
    return (
      <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, opacity: op, transform: `scale(${pop})`, borderRadius: radius, overflow: "hidden", background: bg, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: fit, transform: `scale(${s}) translate(${tx}px, ${ty}px)`, filter: sepia ? "sepia(0.55) contrast(1.15) brightness(0.92)" : "contrast(1.05) saturate(0.9)" }} />
        {credit && <div style={{ position: "absolute", left: 16, bottom: 12, font: `500 22px ${F.body}`, color: "rgba(255,255,255,0.75)", textShadow: "0 1px 4px #000" }}>{credit}</div>}
      </div>
    );
  };

// ── chart scales ──────────────────────────────────────────────────────────────
export type Bar = { d: string; o?: number; h?: number; l?: number; c: number };
export type Scale = { x: (i: number) => number; y: (v: number) => number; i: (d: string) => number; bw: number; data: Bar[]; box: Box; lo: number; hi: number };
export type Box = { x: number; y: number; w: number; h: number };
export const makeScale = (data: Bar[], box: Box, opts: { log?: boolean; pad?: number; lo?: number; hi?: number } = {}): Scale => {
  const lows = data.map((b) => b.l ?? b.c), highs = data.map((b) => b.h ?? b.c);
  let lo = opts.lo ?? Math.min(...lows), hi = opts.hi ?? Math.max(...highs);
  const pad = opts.pad ?? 0.08;
  const tf = opts.log ? Math.log10 : (v: number) => v;
  const a = tf(lo), b = tf(hi), span = b - a;
  const A = a - span * pad, B = b + span * pad;
  const bw = box.w / data.length;
  return {
    data, box, lo, hi, bw,
    x: (i) => box.x + (i + 0.5) * bw,
    y: (v) => box.y + box.h - ((tf(Math.max(v, 1e-9)) - A) / (B - A)) * box.h,
    i: (d) => { const k = data.findIndex((b) => b.d >= d); return k < 0 ? data.length - 1 : k; },
  };
};

// Renders a candle / line / area series progressively. `upTo` = how many bars are visible (fractional ok).
export const Series: React.FC<{ s: Scale; kind: "candle" | "line" | "area"; upTo: number; color?: string; width?: number; dimBefore?: number; highlight?: number }> =
  ({ s, kind, upTo, color = C.blue, width = 4, highlight }) => {
    const n = Math.min(s.data.length, upTo);
    if (kind === "candle") {
      return (
        <g>
          {s.data.slice(0, Math.ceil(n)).map((b, i) => {
            const up = b.c >= (b.o ?? b.c); const col = up ? C.green : C.red;
            const x = s.x(i), bw = Math.max(2, s.bw * 0.62);
            const a = clamp(n - i); const yo = s.y(b.o ?? b.c), yc = s.y(b.c);
            const hl = highlight === i;
            return (
              <g key={i} opacity={a}>
                <line x1={x} x2={x} y1={s.y(b.h ?? b.c)} y2={s.y(b.l ?? b.c)} stroke={col} strokeWidth={Math.max(1.5, s.bw * 0.12)} />
                <rect x={x - bw / 2} y={Math.min(yo, yc)} width={bw} height={Math.max(2, Math.abs(yc - yo))} fill={col} stroke={hl ? C.gold : "none"} strokeWidth={hl ? 3 : 0} />
              </g>
            );
          })}
        </g>
      );
    }
    const k = Math.max(1, Math.floor(n));
    const pts = s.data.slice(0, k).map((b, i) => `${s.x(i).toFixed(1)},${s.y(b.c).toFixed(1)}`);
    if (n > k && k < s.data.length) { const fr = n - k; const x = s.x(k - 1) + (s.x(k) - s.x(k - 1)) * fr; const y = s.y(s.data[k - 1].c) + (s.y(s.data[k].c) - s.y(s.data[k - 1].c)) * fr; pts.push(`${x.toFixed(1)},${y.toFixed(1)}`); }
    const line = "M" + pts.join("L");
    const last = pts[pts.length - 1].split(",").map(Number);
    return (
      <g>
        {kind === "area" && <path d={`${line}L${last[0]},${s.box.y + s.box.h}L${s.x(0)},${s.box.y + s.box.h}Z`} fill={color} opacity={0.18} />}
        <path d={line} fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={last[0]} cy={last[1]} r={width * 2} fill={color} />
        <circle cx={last[0]} cy={last[1]} r={width * 5} fill={color} opacity={0.25} />
      </g>
    );
  };

export const Axes: React.FC<{ s: Scale; ticks: { d: string; label: string }[]; prices?: number[]; fmtP?: (v: number) => string; op?: number }> = ({ s, ticks, prices = [], fmtP = (v) => String(v), op = 1 }) => (
  <g opacity={op}>
    {prices.map((p) => (
      <g key={p}>
        <line x1={s.box.x} x2={s.box.x + s.box.w} y1={s.y(p)} y2={s.y(p)} stroke="rgba(255,255,255,0.09)" strokeDasharray="4 8" />
        <text x={s.box.x + s.box.w + 8} y={s.y(p) + 8} fill={C.dim} style={{ font: `700 24px ${F.mono}` }}>{fmtP(p)}</text>
      </g>
    ))}
    {ticks.map((t) => (
      <text key={t.d} x={s.x(s.i(t.d))} y={s.box.y + s.box.h + 40} fill={C.dim} textAnchor="middle" style={{ font: `700 26px ${F.mono}` }}>{t.label}</text>
    ))}
  </g>
);

// Chart panel: dark card with a header (ticker) — like a terminal screenshot.
export const Panel: React.FC<{ title: string; sub?: string; children: React.ReactNode; op?: number; y?: number; h?: number; transform?: string; origin?: string }> = ({ title, sub, children, op = 1, y = 430, h = 980, transform, origin }) => (
  <div style={{ position: "absolute", left: 30, top: y, width: 1020, height: h, opacity: op, background: "linear-gradient(180deg,#121823,#0b0f15)", borderRadius: 22, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 30px 90px rgba(0,0,0,0.65)", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 28, top: 20, font: `800 30px ${F.body}`, color: C.text, letterSpacing: 0.5 }}>{title}</div>
    {sub && <div style={{ position: "absolute", right: 28, top: 24, font: `700 22px ${F.mono}`, color: C.dim }}>{sub}</div>}
    <svg width={1020} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", transform, transformOrigin: origin }}>{children}</svg>
  </div>
);

// ── marker: hand-drawn strokes revealed over time ────────────────────────────
export const Mk: React.FC<{ d: string; p: number; color?: string; w?: number; dash?: string; op?: number }> = ({ d, p, color = C.red, w = 9, dash, op = 1 }) =>
  p <= 0 ? null : (
    <g opacity={op}>
      <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={w * 2.2} strokeLinecap="round" strokeLinejoin="round" opacity={0.18} strokeDasharray={`${p} 1`} />
      <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash ? undefined : `${p} 1`} style={dash ? { strokeDasharray: dash, clipPath: undefined } : undefined} opacity={dash ? Math.min(1, p * 3) : 1} />
    </g>
  );
// rough ellipse that overshoots like a human circle
export const ring = (cx: number, cy: number, rx: number, ry: number, seed = 1) => {
  const pts: string[] = []; const n = 48; const a0 = -2.2 + rand(seed) * 0.6;
  for (let k = 0; k <= n * 1.12; k++) {
    const a = a0 + (k / n) * Math.PI * 2; const j = 1 + (rand(seed * 7 + k) - 0.5) * 0.05 + (k / n) * 0.06;
    pts.push(`${(cx + Math.cos(a) * rx * j).toFixed(1)},${(cy + Math.sin(a) * ry * j).toFixed(1)}`);
  }
  return "M" + pts.join("L");
};
export const arrow = (x1: number, y1: number, x2: number, y2: number, head = 34, bend = 0.15) => {
  const mx = (x1 + x2) / 2 - (y2 - y1) * bend, my = (y1 + y2) / 2 + (x2 - x1) * bend;
  const ang = Math.atan2(y2 - my, x2 - mx);
  const h1 = [x2 - head * Math.cos(ang - 0.45), y2 - head * Math.sin(ang - 0.45)], h2 = [x2 - head * Math.cos(ang + 0.45), y2 - head * Math.sin(ang + 0.45)];
  return `M${x1},${y1}Q${mx},${my} ${x2},${y2}M${h1[0]},${h1[1]}L${x2},${y2}L${h2[0]},${h2[1]}`;
};
// handwritten label revealed left→right
export const HandText: React.FC<{ x: number; y: number; p: number; children: React.ReactNode; color?: string; size?: number; anchor?: "start" | "middle" | "end"; rot?: number }> = ({ x, y, p, children, color = C.red, size = 64, anchor = "start", rot = -3 }) =>
  p <= 0 ? null : (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      <defs><clipPath id={`ht${x}${y}`}><rect x={anchor === "middle" ? x - 700 : anchor === "end" ? x - 1400 : x - 10} y={y - size * 1.2} width={1400 * p} height={size * 1.8} /></clipPath></defs>
      <text x={x} y={y} textAnchor={anchor} clipPath={`url(#ht${x}${y})`} fill={color} style={{ font: `${size}px ${F.hand}`, paintOrder: "stroke", stroke: "rgba(0,0,0,0.55)", strokeWidth: 8 }}>{children}</text>
    </g>
  );

// ── stamp (rubber-stamp slam) ────────────────────────────────────────────────
export const Stamp: React.FC<{ at: number; text: string; color?: string; x: number; y: number; rot?: number; size?: number; until?: number }> = ({ at, text, color = C.red, x, y, rot = -8, size = 84, until = 1e9 }) => {
  const f = useCurrentFrame();
  if (f < at || f > until) return null;
  const s = interpolate(f, [at, at + 6], [2.4, 1], { extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
  const o = interpolate(f, [at, at + 4], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`, opacity: o, padding: "10px 30px", border: `8px solid ${color}`, borderRadius: 14, color, font: `${size}px ${F.head}`, letterSpacing: 2, whiteSpace: "nowrap", background: "rgba(10,12,16,0.55)", boxShadow: `0 0 40px ${color}55` }}>{text}</div>
  );
};

// ── big rolling money number ─────────────────────────────────────────────────
export const Money: React.FC<{ v: number; color?: string; size?: number; suffix?: string }> = ({ v, color = C.gold, size = 120, suffix = " ₽" }) => (
  <span style={{ font: `${size}px ${F.head}`, color, fontVariantNumeric: "tabular-nums", textShadow: `0 0 30px ${color}66` }}>{fmt(v)}{suffix}</span>
);
export const tween = (f: number, keys: [number, number][], len = 24) => {
  let v = keys[0][1];
  for (let k = 1; k < keys.length; k++) { const [t, val] = keys[k]; if (f >= t) { const p = Easing.out(Easing.cubic)(clamp((f - t) / len)); v = v + (val - v) * p; } }
  return v;
};

// ── stylised banknote (generic card, not a copy of real currency) ────────────
export const Banknote: React.FC<{ w?: number; burn?: number; seed?: number }> = ({ w = 520, burn = 0, seed = 3 }) => {
  const h = w * 0.48;
  const id = `bn${seed}`;
  return (
    <svg width={w} height={h} viewBox="0 0 520 250" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`${id}g`} x1="0" x2="1"><stop offset="0" stopColor="#3f7d52" /><stop offset="0.55" stopColor="#7aa35a" /><stop offset="1" stopColor="#c9a24a" /></linearGradient>
        <filter id={`${id}f`}><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed={seed} result="t" /><feColorMatrix in="t" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.6 0 0 0 -0.3" /></filter>
        <mask id={`${id}m`}>
          <rect width="520" height="250" fill="white" />
          <circle cx="430" cy="215" r={burn * 620} fill="black" filter={`url(#${id}f)`} />
          <circle cx="430" cy="215" r={burn * 560} fill="black" />
        </mask>
      </defs>
      {burn > 0 && <circle cx="430" cy="215" r={burn * 600 + 12} fill="none" stroke="#ff8a1e" strokeWidth={18} opacity={burn < 0.98 ? 0.9 : 0} filter="blur(6px)" />}
      <g mask={`url(#${id}m)`}>
        <rect x="0" y="0" width="520" height="250" rx="14" fill={`url(#${id}g)`} />
        {Array.from({ length: 14 }).map((_, k) => <ellipse key={k} cx="120" cy="125" rx={20 + k * 7} ry={14 + k * 5} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />)}
        <rect x="10" y="10" width="500" height="230" rx="10" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="3" strokeDasharray="2 6" />
        <text x="500" y="92" textAnchor="end" fill="#fffbe8" style={{ font: `76px ${F.head}` }}>10 000</text>
        <text x="500" y="140" textAnchor="end" fill="#fffbe8" style={{ font: `30px ${F.body}`, fontWeight: 800 }}>РУБЛЕЙ · ДЕПОЗИТ</text>
        <text x="500" y="226" textAnchor="end" fill="rgba(255,255,255,0.7)" style={{ font: `22px ${F.mono}` }}>№ 000 001</text>
        <text x="120" y="142" textAnchor="middle" fill="rgba(255,255,255,0.9)" style={{ font: `64px ${F.head}` }}>₽</text>
      </g>
      {burn > 0 && burn < 1 && Array.from({ length: 18 }).map((_, k) => {
        const a = rand(seed + k) * Math.PI - Math.PI; const r = burn * 600 * (0.8 + rand(k) * 0.3);
        return <circle key={k} cx={430 + Math.cos(a) * r} cy={215 + Math.sin(a) * r - burn * 140 * rand(k + 9)} r={3 + rand(k + 3) * 4} fill={k % 3 ? "#ffb347" : "#555"} opacity={1 - burn} />;
      })}
    </svg>
  );
};

// ── karaoke captions (chunks of ≤4 words, current word highlighted) ──────────
export type Line = { say: string; cap: string; file: string; from: number; dur: number; words: [string, number][] };
export const Captions: React.FC<{ lines: Line[]; y?: number }> = ({ lines, y = 1500 }) => {
  const f = useCurrentFrame();
  const line = [...lines].reverse().filter((l) => !l.file.includes("final-3")).find((l) => f >= l.from - 2 && f <= l.from + l.dur + 10);
  if (!line) return null;
  const ws = line.words; const cur = Math.max(0, ws.findIndex((w, k) => f < (ws[k + 1]?.[1] ?? 1e9)) );
  const chunks: number[][] = []; let c: number[] = [];
  ws.forEach((w, k) => { c.push(k); const end = /[.,!?—:]$/.test(w[0]) || c.length >= 4; if (end) { chunks.push(c); c = []; } });
  if (c.length) chunks.push(c);
  const ch = chunks.find((g) => g.includes(cur)) || chunks[0];
  const t0 = ws[ch[0]][1];
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: y, textAlign: "center", lineHeight: 1.15 }}>
      {ch.map((k, j) => {
        const on = f >= ws[k][1]; const p = clamp((f - Math.max(t0, ws[k][1] - 3)) / 5);
        return (
          <span key={k} style={{ display: "inline-block", margin: "0 10px", font: `800 66px ${F.body}`, color: k === cur ? C.gold : C.text, opacity: on ? 1 : 0.35, transform: `translateY(${(1 - p) * 14}px) scale(${k === cur ? 1.06 : 1})`, textShadow: "0 4px 18px rgba(0,0,0,0.9), 0 0 2px #000" }}>{ws[k][0]}</span>
        );
      })}
    </div>
  );
};

// ── pixel transition (grid of squares) ───────────────────────────────────────
export const Pixels: React.FC<{ at: number; color?: string }> = ({ at, color = "#05070a" }) => {
  const f = useCurrentFrame(); const S = 90, cols = 12, rows = 22;
  if (f < at - 10 || f > at + 10) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      {Array.from({ length: cols * rows }).map((_, k) => {
        const r = rand(k * 3.7 + at); const tIn = at - 10 + r * 9, tOut = at + 1 + rand(k * 1.3 + 9) * 9;
        if (f < tIn || f > tOut) return null;
        return <rect key={k} x={(k % cols) * S} y={Math.floor(k / cols) * S} width={S + 1} height={S + 1} fill={k % 7 === 0 ? C.gold : color} />;
      })}
    </svg>
  );
};

export const EraTitle: React.FC<{ year: string; title: string; at: number; color?: string }> = ({ year, title, at, color = C.gold }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 14, outExpo);
  return (
    <div style={{ position: "absolute", left: 50, top: 150, display: "flex", alignItems: "baseline", gap: 24, opacity: p, transform: `translateX(${(1 - p) * -60}px)` }}>
      <span style={{ font: `120px ${F.head}`, color, textShadow: `0 0 40px ${color}55` }}>{year}</span>
      <span style={{ font: `800 40px ${F.body}`, color: C.text, maxWidth: 560, lineHeight: 1.1 }}>{title}</span>
    </div>
  );
};
