import React from "react";
import { AbsoluteFill, Img, staticFile, Easing } from "remotion";
import { C, L, LE, SC, W, TL, clamp, p, backOut, io, lerp, rand, Stage } from "./lib";
import { Morph, Particles, Rough, Shader, hex3 } from "./fx";
import bg from "./shaders/bg.shader";
import { VOXEL_COUNT, MState } from "./Mascot3D";

const f2 = (n: number) => n.toLocaleString("ru-RU").replace(/ |,/g, " ");

// ── where the 3D mascot is in every moment of the film
export const mascotAt = (f: number): MState => {
  const hk = SC("hook"), pr = SC("prompt"), sr = SC("script"), mo = SC("motion"), th = SC("three"), ck = SC("check"), rn = SC("render"), fi = SC("final");
  const hopOn = (id: string) => { const l = SC(id).lines.flatMap((x) => x.words); const w = [...l].reverse().find(([, t]) => f >= t); return w ? clamp((f - w[1]) / 7) : 0; };
  const blink = f % 90 >= 84;
  if (f < pr.from) { // hook: assembles from flying cubes on «написал код»
    const b = f - (L("hook", 1) - 14);
    return { x: 540, y: 1000, s: 30, ry: Math.sin(f / 30) * 0.35 + (1 - p(f, L("hook", 1) - 14, 50)) * 2.4, rx: 0.12, build: b, blink };
  }
  if (f < mo.from) { // prompt + script: small, sits under the terminal and hops on words
    const t = p(f, pr.from - 4, 22, io), id = f < sr.from ? "prompt" : "script";
    const x = lerp(540, 830, t), y = lerp(1000, 1540, t), s = lerp(30, 14, t);
    const ex = p(f, mo.from - 8, 10, Easing.in(Easing.cubic));
    return { x, y, s, ry: -0.5 + Math.sin(f / 22) * 0.15, rx: 0.15, hop: hopOn(id) * 0.6, blink, explode: ex, vanish: ex };
  }
  if (f < th.from) return { x: 540, y: 1100, s: 14, explode: 1, vanish: 1 };
  if (f < ck.from) { // three: big turntable, wireframe → solid, blows apart on «кубиков», Blender grid on line 2
    const b = f - th.from + 6, k = W("three", 0, "кубик");
    const ex = Math.sin(clamp((f - k) / 34) * Math.PI) * 0.55;
    const exit = p(f, ck.from - 8, 10, Easing.in(Easing.cubic));
    return { x: 540, y: 840, s: 34, ry: (f - th.from) / 26 - 0.6, rx: 0.32 + p(f, L("three", 1), 30, io) * 0.25, build: b, explode: ex + exit, vanish: exit, wire: 1 - p(f, th.from + 30, 18), blink };
  }
  if (f < rn.from) return { x: 540, y: 900, s: 30, explode: 1, vanish: 1 };
  if (f < fi.from) { // render: lives inside the phone
    const b = f - rn.from + 4;
    return { x: 540, y: 800, s: 12, ry: Math.sin(f / 15) * 0.4, rx: 0.1, build: b, hop: hopOn("render") * 0.5, blink };
  }
  // final: hops in the centre, then blows apart in the last frames so the loop restarts on an empty frame
  const b = f - fi.from + 4, out = p(f, TL.total - 22, 18, Easing.in(Easing.cubic));
  const g = p(f, fi.from - 4, 18, io); // grows out of the phone instead of popping
  return { x: 540, y: lerp(800, 1010, g), s: lerp(12, 26, g), ry: Math.sin(f / 18) * 0.5, rx: 0.12, build: Math.max(b, 60), hop: hopOn("final"), blink, explode: out, vanish: out, walk: f / 3 };
};

// ── 1. HOOK
const Kinetic: React.FC<{ text: string; f: number; at: number; y: number; size: number; color?: string; accent?: [string, string] }> = ({ text, f, at, y, size, color = C.ink, accent }) => {
  let n = 0;
  return <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", font: `400 ${size}px Russo`, color, letterSpacing: 2, lineHeight: 1.15 }}>
    {text.split("|").map((ln, row) => <div key={row} style={{ whiteSpace: "pre" }}>{[...ln].map((ch) => { const i = n++; const k = p(f, at + i * 1.4, 14, backOut); const r = (rand(i + at) - 0.5) * 50 * (1 - k);
      const acc = accent && text.indexOf(accent[0]) <= i && i < text.indexOf(accent[0]) + accent[0].length;
      return <span key={i} style={{ display: "inline-block", transform: `translateY(${(1 - k) * -140}px) rotate(${r}deg) scale(${0.4 + k * 0.6})`, opacity: clamp(k * 2), color: acc ? accent![1] : undefined, textShadow: acc ? `0 0 40px ${accent![1]}` : "0 8px 30px rgba(0,0,0,0.6)" }}>{ch}</span>; })}</div>)}
  </div>;
};
export const Hook: React.FC<{ f: number }> = ({ f }) => {
  const a = L("hook", 0), b = L("hook", 1), k = W("hook", 1, "код");
  const strike = p(f, W("hook", 0, "монтир") + 6, 14, io);
  const glitch = f >= k && f < k + 10 ? (rand(f) - 0.5) * 30 : 0;
  return <Stage id="hook" f={f}>
    <Kinetic text={"НИКТО НЕ|МОНТИРОВАЛ"} f={f} at={a} y={250} size={104} />
    <div style={{ position: "absolute", left: 0, top: 0, width: 140 + 800 * strike, height: 1920, overflow: "hidden" }}>
      <svg width={1080} height={1920}><Rough kind="line" args={[150, 452, 930, 438]} opts={{ stroke: C.red, strokeWidth: 14, roughness: 2.2 }} boil={0} seed={9} /></svg>
    </div>
    <div style={{ transform: `translateX(${glitch}px)` }}><Kinetic text={"ЕГО НАПИСАЛ КОД"} f={f} at={b} y={600} size={92} accent={["КОД", C.clay]} /></div>
    {f >= k && f < k + 10 && <div style={{ position: "absolute", left: 0, right: 0, top: 600, textAlign: "center", font: "400 92px Russo", color: C.blue, opacity: 0.5, transform: `translateX(${-glitch * 1.5}px)`, mixBlendMode: "screen" }}>ЕГО НАПИСАЛ КОД</div>}
    <svg width={1080} height={1920} style={{ position: "absolute" }}><Particles at={L("hook", 1) + 18} x={540} y={1000} kind="sparks" n={60} seed={5} life={34} colors={[C.clay, C.clayHi, "#fff"]} power={1.6} /></svg>
  </Stage>;
};
// the strike line is revealed left to right by the clip box (`strike`)

// ── 2. PROMPT: Claude Code terminal, the prompt is typed in sync with the voice
const PROMPT = "сделай вертикальный ролик про то, как делают ролики";
export const Prompt: React.FC<{ f: number }> = ({ f }) => {
  const s = SC("prompt"), a = L("prompt", 1), e = LE("prompt", 1);
  const n = Math.round(PROMPT.length * clamp((f - a + 4) / (e - a - 6)));
  const win = p(f, s.from, 16, backOut);
  const enter = f >= e + 2;
  return <Stage id="prompt" f={f}>
    <Term f={f} win={win} y={330} h={700}>
      <div style={{ font: "700 40px Mono", color: C.clay, marginBottom: 26 }}>✻ Claude Code</div>
      <div style={{ font: "700 30px Mono", color: C.dim, marginBottom: 40 }}>~/Desktop/MOTION</div>
      <div style={{ border: `3px solid ${enter ? C.clay : "rgba(244,239,232,0.25)"}`, borderRadius: 18, padding: "26px 28px", font: "700 46px Mono", color: C.ink, lineHeight: 1.35, minHeight: 200 }}>
        <span style={{ color: C.clay }}>&gt; </span>{PROMPT.slice(0, n)}<span style={{ opacity: f % 16 < 8 ? 1 : 0, color: C.clay }}>▋</span>
      </div>
      <div style={{ font: "700 30px Mono", color: enter ? C.green : C.dim, marginTop: 30, opacity: p(f, e - 6, 6) }}>⏎ enter</div>
      {["● Write  tools/script.mjs", "● Bash   node tools/voice.mjs", "● Bash   remotion render"].map((t, i) => <div key={t} style={{ font: "700 30px Mono", color: i ? C.dim : C.ink, marginTop: 14, opacity: p(f, e + 2 + i * 6, 6), transform: `translateX(${(1 - p(f, e + 2 + i * 6, 10)) * 40}px)` }}>{t}</div>)}
      {f >= L("prompt", 0) && <div style={{ position: "absolute", right: 40, top: 40, font: "800 34px Inter", color: C.ink, background: C.clay, borderRadius: 40, padding: "10px 26px", transform: `scale(${p(f, W("prompt", 0, "одну"), 10, backOut)})` }}>одна фраза</div>}
    </Term>
  </Stage>;
};
const Term: React.FC<{ f: number; win: number; y: number; h: number; children: React.ReactNode }> = ({ win, y, h, children }) => (
  <div style={{ position: "absolute", left: 70, right: 70, top: y, height: h, background: "rgba(16,17,24,0.92)", borderRadius: 34, border: "2px solid rgba(255,255,255,0.08)", boxShadow: "0 40px 120px rgba(0,0,0,0.6)", padding: "84px 50px 40px", transform: `scale(${0.85 + win * 0.15})`, opacity: win, overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 30, left: 36, display: "flex", gap: 14 }}>{["#ff5f57", "#febc2e", "#28c840"].map((c) => <div key={c} style={{ width: 22, height: 22, borderRadius: 11, background: c }} />)}</div>
    {children}
  </div>
);

// ── 3. SCRIPT: scene cards fly out, then the real word timings of this very voice-over scroll by
export const Script: React.FC<{ f: number }> = ({ f }) => {
  const s = SC("script"), b = L("script", 1);
  const cards = TL.scenes.map((x) => x.id);
  const words = TL.scenes.flatMap((x) => x.lines.flatMap((l) => l.words)).slice(0, 40);
  const scroll = clamp((f - b) / (s.to - b)) * 26;
  return <Stage id="script" f={f}>
    <div style={{ position: "absolute", left: 80, top: 250, font: "800 44px Inter", color: C.dim }}>сценарий → сцены</div>
    {cards.map((id, i) => { const k = p(f, s.from + 6 + i * 4, 16, backOut); const col = i % 2, row = Math.floor(i / 2);
      const x = 80 + col * 470, y = 330 + row * 118;
      return <div key={id} style={{ position: "absolute", left: x, top: y, width: 450, height: 98, borderRadius: 22, background: i === 0 ? C.clay : "rgba(20,22,31,0.92)", border: "2px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 20, padding: "0 26px", transform: `translate(${(1 - k) * (col ? 300 : -300)}px, ${(1 - k) * 60}px) rotate(${(1 - k) * (col ? 8 : -8)}deg)`, opacity: clamp(k * 1.5) }}>
        <span style={{ font: "700 34px Mono", color: i === 0 ? C.bg : C.clay }}>{String(i + 1).padStart(2, "0")}</span>
        <span style={{ font: "800 38px Inter", color: i === 0 ? C.bg : C.ink }}>{id}</span>
        <span style={{ marginLeft: "auto", font: "700 26px Mono", color: i === 0 ? C.bg : C.dim }}>{((SC(id).to - SC(id).from) / 30).toFixed(1)}s</span>
      </div>; })}
    {/* voice waveform built from real word onsets */}
    <div style={{ position: "absolute", left: 80, right: 80, top: 850, height: 150, opacity: p(f, b - 4, 10) }}>
      <svg width={920} height={150}>{Array.from({ length: 46 }, (_, i) => { const t = b + i * 2.2; const on = f >= t; const h = 20 + rand(i * 7) * 100 * (on ? 1 : 0.25) * (0.6 + 0.4 * Math.sin(f / 4 + i));
        return <rect key={i} x={i * 20} y={75 - h / 2} width={12} height={h} rx={6} fill={on ? C.clay : "rgba(244,239,232,0.2)"} />; })}</svg>
    </div>
    <div style={{ position: "absolute", left: 80, right: 80, top: 1020, height: 200, overflow: "hidden", opacity: p(f, b + 10, 10), maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)" }}>
      <div style={{ display: "flex", gap: 14, transform: `translateX(${-scroll * 78}px)` }}>
        {words.map(([w, t], i) => <div key={i} style={{ flex: "none", borderRadius: 16, background: "rgba(20,22,31,0.92)", border: `2px solid ${C.clay}55`, padding: "14px 20px" }}>
          <div style={{ font: "800 34px Inter", color: C.ink }}>{w.replace(/[.,?«»—]/g, "") || "—"}</div>
          <div style={{ font: "700 24px Mono", color: C.clay }}>{(t / 30).toFixed(2)}s</div></div>)}
      </div>
    </div>
  </Stage>;
};

// ── 4. MOTION: «кадр = f(t)», then three tiles — particles, morph, kinetic type
const STAR = "M0 -150 L44 -46 L150 -42 L70 26 L96 132 L0 72 L-96 132 L-70 26 L-150 -42 L-44 -46 Z";
const BLOB = "M0 -140 C90 -140 150 -80 150 0 C150 90 80 140 0 140 C-80 140 -150 90 -150 0 C-150 -80 -90 -140 0 -140 Z";
const SQ = "M-120 -120 L120 -120 L120 120 L-120 120 Z";
export const Motion: React.FC<{ f: number }> = ({ f }) => {
  const s = SC("motion"), a = L("motion", 0), b = L("motion", 1);
  const ft = W("motion", 0, "функц");
  const tiles = [W("motion", 1, "шейдер"), W("motion", 1, "частиц"), W("motion", 1, "морфинг"), W("motion", 1, "живая")];
  const m1 = p(f, tiles[2], 22, io), m2 = p(f, tiles[2] + 26, 22, io);
  return <Stage id="motion" f={f}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 230, textAlign: "center", font: "700 100px Mono", color: C.ink, transform: `scale(${0.6 + p(f, a + 6, 16, backOut) * 0.4})`, opacity: p(f, a + 6, 8) }}>
      кадр = <span style={{ color: C.clay, textShadow: `0 0 ${20 + 20 * Math.sin(f / 5)}px ${C.clay}` }}>f</span>(<span style={{ color: C.blue }}>{f >= ft ? ((f - a) / 30).toFixed(2) : "t"}</span>)
    </div>
    {/* frame strip ticking */}
    <div style={{ position: "absolute", left: 0, right: 0, top: 420, display: "flex", justifyContent: "center", gap: 10, opacity: p(f, ft, 10) }}>
      {Array.from({ length: 9 }, (_, i) => <div key={i} style={{ width: 92, height: 60, borderRadius: 10, border: `3px solid ${i === 4 ? C.clay : "rgba(255,255,255,0.2)"}`, font: "700 22px Mono", color: i === 4 ? C.clay : C.dim, display: "flex", alignItems: "center", justifyContent: "center" }}>{f - 4 + i}</div>)}
    </div>
    {[["шейдеры", C.blue], ["частицы", C.clay], ["морфинг", C.green], ["типографика", C.ink]].map(([lab, col], i) => {
      const k = p(f, tiles[i] - 2, 14, backOut); const x = 70 + (i % 2) * 480, y = 560 + Math.floor(i / 2) * 470;
      return <div key={i} style={{ position: "absolute", left: x, top: y, width: 460, height: 450, borderRadius: 30, background: i === 0 ? "transparent" : "rgba(16,17,24,0.82)", border: `3px solid ${col}`, transform: `scale(${k})`, opacity: k, overflow: "hidden", boxShadow: i === 0 ? `0 0 80px ${C.blue}66 inset` : undefined }}>
        {i === 0 && <Shader frag={bg} uniforms={{ u_a: hex3("#081a4a"), u_b: hex3("#3c6dff"), u_c: hex3("#ff8a5c"), u_glow: 1, u_pulse: 0 }} />}
        <div style={{ position: "absolute", left: 26, top: 20, font: "800 36px Inter", color: i === 0 ? "#fff" : col, zIndex: 2 }}>{lab}</div>
        <svg width={460} height={450} style={{ position: "absolute" }}>
          {i === 1 && <><Particles at={tiles[1] + 4} x={230} y={260} kind="confetti" n={70} seed={11} life={90} power={0.9} /><Particles at={tiles[1] + 30} x={230} y={260} kind="sparks" n={40} seed={19} life={40} colors={[C.clay, "#fff"]} /></>}
          {i === 2 && <g transform="translate(230 250)"><Morph from={m1 < 1 ? STAR : BLOB} to={m1 < 1 ? BLOB : SQ} t={m1 < 1 ? m1 : m2} fill={C.green} /></g>}
          {i === 0 && <Rough kind="circle" args={[230, 250, 300]} opts={{ stroke: "#fff", strokeWidth: 4 }} boil={4} />}
        </svg>
        {i === 3 && <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center" }}>{["ЖИВОЙ", "ТЕКСТ"].map((w, r) => <div key={w} style={{ font: "400 84px Russo", color: r ? C.clay : C.ink, transform: `translateX(${Math.sin((f - tiles[3]) / 6 + r * 2) * 30}px) skewX(${Math.sin((f - tiles[3]) / 9 + r) * 12}deg) scaleX(${1 + 0.15 * Math.sin((f - tiles[3]) / 7 + r)})` }}>{w}</div>)}</div>}
      </div>;
    })}
  </Stage>;
};

// ── 5. THREE: counter of cubes, Blender chip, viewport grid
export const Three: React.FC<{ f: number }> = ({ f }) => {
  const s = SC("three"), k = W("three", 0, "кубик"), bl = W("three", 1, "blender", 0);
  const n = Math.round(VOXEL_COUNT * p(f, k - 10, 26, io));
  return <Stage id="three" f={f}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 200, textAlign: "center", font: "400 104px Russo", color: C.ink, opacity: p(f, s.from, 10), transform: `translateY(${(1 - p(f, s.from, 16, backOut)) * -80}px)` }}>3D <span style={{ color: C.clay }}>из кода</span></div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1085, textAlign: "center", opacity: p(f, k - 10, 8) }}>
      <span style={{ font: "700 110px Mono", color: C.clay }}>{f2(n)}</span><span style={{ font: "800 48px Inter", color: C.ink }}> кубиков</span>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 345, display: "flex", justifyContent: "center", gap: 18, opacity: p(f, bl - 4, 10), transform: `scale(${0.7 + 0.3 * p(f, bl - 4, 12, backOut)})` }}>
      {["Blender 5.2", "bpy-скрипт", "28 скиллов"].map((t, i) => <div key={t} style={{ font: "800 36px Inter", color: i === 0 ? C.bg : C.ink, background: i === 0 ? "#f5792a" : "rgba(20,22,31,0.9)", border: "2px solid rgba(255,255,255,0.15)", borderRadius: 40, padding: "14px 28px" }}>{t}</div>)}
    </div>
  </Stage>;
};

// ── 6. CHECK: contact sheet made of real stills of this very film, a ring on the bad one, then «fixed»
export const Check: React.FC<{ f: number }> = ({ f }) => {
  const s = SC("check"), a = L("check", 0), b = L("check", 1);
  const ring = p(f, W("check", 0, "косяк") - 4, 16, io), fixed = p(f, W("check", 1, "чисто") - 6, 10, backOut);
  return <Stage id="check" f={f}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", font: "800 44px Inter", color: C.dim }}>contact sheet</div>
    <div style={{ position: "absolute", left: 105, top: 300, display: "grid", gridTemplateColumns: "repeat(3, 270px)", gap: 20 }}>
      {Array.from({ length: 6 }, (_, i) => { const k = p(f, s.from + 4 + i * 3, 14, backOut); const bad = i === 4;
        return <div key={i} style={{ width: 270, height: 420, borderRadius: 16, overflow: "hidden", border: `3px solid ${bad && fixed > 0.5 ? C.green : "rgba(255,255,255,0.15)"}`, transform: `scale(${k})`, opacity: k, position: "relative", background: "#000" }}>
          <Img src={staticFile(`sheet/s${i + 1}${bad && fixed > 0.5 ? "f" : ""}.png`)} style={{ width: 270, height: 420, objectFit: "cover" }} />
          {bad && fixed <= 0.5 && <div style={{ position: "absolute", inset: 0, background: `repeating-linear-gradient(0deg, transparent 0 40px, rgba(255,60,60,0.12) 40px 44px)` }} />}
        </div>; })}
    </div>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      {ring > 0 && <g style={{ opacity: 1 - fixed }}><Rough kind="ellipse" args={[540, 950, 330, 500]} opts={{ stroke: C.red, strokeWidth: 10, roughness: 2.4 }} boil={3} seed={2} /></g>}
      {ring > 0 && <text x={540} y={262} textAnchor="middle" fill={C.red} style={{ font: "700 50px Mono", opacity: ring * (1 - fixed) }}>текст вылез за край</text>}
    </svg>
    {fixed > 0 && <div style={{ position: "absolute", left: 0, right: 0, top: 1040, textAlign: "center" }}><span style={{ display: "inline-block", font: "400 88px Russo", color: C.green, border: `8px solid ${C.green}`, borderRadius: 20, padding: "6px 34px", transform: `rotate(-6deg) scale(${2 - fixed})`, opacity: clamp(fixed * 1.4) }}>ИСПРАВЛЕНО</span></div>}
  </Stage>;
};

// ── 7. RENDER: phone + frame counter of the real film length
export const Render: React.FC<{ f: number }> = ({ f }) => {
  const s = SC("render"), a = L("render", 0), e = LE("render", 0) + 4;
  const pr = p(f, a, e - a, io), frames = Math.round(TL.total * pr);
  const ph = p(f, s.from, 16, backOut);
  return <Stage id="render" f={f}>
    <div style={{ position: "absolute", left: 340, top: 450, width: 400, height: 760, borderRadius: 60, border: "10px solid #2a2d38", background: "rgba(10,11,16,0.6)", boxShadow: `0 0 ${60 * pr}px ${C.clay}88`, transform: `scale(${0.7 + 0.3 * ph}) rotate(${(1 - ph) * -10}deg)`, opacity: ph }}>
      <div style={{ position: "absolute", left: 150, top: 18, width: 100, height: 24, borderRadius: 12, background: "#2a2d38" }} />
      <div style={{ position: "absolute", left: 30, right: 30, bottom: 50, height: 10, borderRadius: 5, background: "rgba(255,255,255,0.15)" }}><div style={{ width: `${pr * 100}%`, height: 10, borderRadius: 5, background: C.clay }} /></div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 280, textAlign: "center", font: "700 64px Mono", color: C.ink }}>render <span style={{ color: C.clay }}>{Math.round(pr * 100)}%</span></div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 380, textAlign: "center", font: "700 40px Mono", color: C.dim }}>кадр {f2(frames)} / {f2(TL.total)}</div>
    {pr >= 1 && <div style={{ position: "absolute", left: 0, right: 0, top: 1100, textAlign: "center" }}><span style={{ font: "800 54px Inter", color: C.bg, background: C.green, borderRadius: 40, padding: "12px 34px", display: "inline-block", transform: `scale(${p(f, e, 10, backOut)})` }}>✓ claude-reel.mp4</span></div>}
    <svg width={1080} height={1920} style={{ position: "absolute" }}><Particles at={e} x={540} y={900} kind="confetti" n={120} seed={33} life={80} power={1.4} /></svg>
  </Stage>;
};

// ── 8. FINAL: CTA
export const Final: React.FC<{ f: number }> = ({ f }) => {
  const s = SC("final"), w = W("final", 0, "напиши"), r = W("final", 0, "ролик");
  return <Stage id="final" f={f}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 260, textAlign: "center", font: "800 60px Inter", color: C.dim, opacity: p(f, s.from, 10) }}>хочешь так же?</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 380, textAlign: "center", font: "400 96px Russo", color: C.ink, opacity: p(f, w - 2, 8), transform: `translateY(${(1 - p(f, w - 2, 14, backOut)) * 60}px)` }}>ПИШИ</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 500, textAlign: "center" }}>
      <span style={{ display: "inline-block", font: "400 150px Russo", color: C.bg, background: C.clay, borderRadius: 30, padding: "4px 44px", transform: `scale(${p(f, r - 3, 16, backOut)}) rotate(-3deg)`, boxShadow: `0 0 ${50 + 20 * Math.sin(f / 6)}px ${C.clay}` }}>РОЛИК</span>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 740, textAlign: "center", font: "800 46px Inter", color: C.ink, opacity: p(f, r + 8, 10) }}>в комментариях — скину весь сетап</div>
    <svg width={1080} height={1920} style={{ position: "absolute" }}><Particles at={r} x={540} y={600} kind="sparks" n={50} seed={44} life={40} colors={[C.clay, "#fff", C.clayHi]} power={1.4} /></svg>
  </Stage>;
};
