// «Снято на телефон»: a dark desk, a laptop running Claude Code, a phone. Handheld camera, depth of field (blurred
// masked overlay), focus pulls, phone-camera grain and exposure. Numbers in the terminal are real (claude-anime render).
import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Captions, Fonts, LINES, SC, TL, W, L, clamp, p, io, lerp, rand, smoothNoise } from "../lib";
import { useCanvasTex, useFonts, rr } from "../cozy3d/tex";
import { Glow } from "../cozy3d/World";
import { Session, drawCard, drawTerminal } from "./Terminal";

// ── terminal session keyed to the voice
const SESSION: Session = {
  typed: { at: W("phone", 0, "пишу") - 4, until: W("phone", 0, "строчку") + 14, text: "сделай аниме-ролик про Клода" },
  lines: [
    { at: L("script", 0), text: "Write(tools/script.mjs)", kind: "tool" },
    { at: L("script", 0) + 6, text: "6 сцен · 7 фраз · CTA «АНИМЕ»" },
    { at: W("script", 0, "озвучивает"), text: "Bash(npm run voice)", kind: "tool" },
    { at: W("script", 0, "озвучивает") + 8, text: "voice[ru]: line 7/7 ✓  total 23.7 s", color: "#5fd38a" },
    { at: L("check", 0), text: "Bash(npm run asr)", kind: "tool" },
    { at: L("check", 0) + 6, text: "say «баг» · heard «бак» — норм", kind: "redact", bar: 120 },
    { at: L("check", 0) + 12, text: "say «Клод» · heard «Клод» ✓", kind: "redact", bar: 160, color: "#5fd38a" },
    { at: W("check", 0, "каждое"), text: "6 / 7 фраз совпали дословно", color: "#f2c14e" },
    { at: L("render", 0), text: "Bash(npm run render)", kind: "tool" },
    ...[0.2, 0.45, 0.7, 1].map((k, i) => ({ at: L("render", 0) + 6 + i * 10, text: `Encoded ${Math.round(711 * k)}/711`, color: k === 1 ? "#5fd38a" : "#8b8780" })),
    { at: W("render", 1, "проверяет"), text: "Bash(npm run deliver)", kind: "tool" },
    { at: W("render", 1, "громкость"), text: "PASS  loudness  −14.5 LUFS", color: "#5fd38a" },
    { at: W("render", 1, "пики"), text: "PASS  true peak  −1.8 dBTP", color: "#5fd38a" },
    { at: W("render", 1, "пики") + 6, text: "claude-anime.mp4  11.1 MB · _share 5.4 MB", color: "#e6e3dc" },
  ],
};
const CARD = W("card", 0, "готово") - 4;
const PHONE_BACK = L("end", 0) - 6, NOTIF = W("end", 0, "телефоне") - 6;

// ── props
const Laptop: React.FC<{ f: number }> = ({ f }) => {
  const term = useCanvasTex(1600, 1000, (g, w, h) => drawTerminal(g, w, h, f, SESSION), [f]);
  const card = useCanvasTex(720, 520, (g, w, h) => drawCard(g, w, h, clamp((f - CARD) / 8)), [f >= CARD]);
  const keys = useCanvasTex(1024, 420, (g, w, h) => {
    g.fillStyle = "#141416"; g.fillRect(0, 0, w, h); const rows = ["esc 1 2 3 4 5 6 7 8 9 0 - = ⌫", "⇥ Q W E R T Y U I O P [ ]", "⇪ A S D F G H J K L ; ' ⏎", "⇧ Z X C V B N M , . / ⇧", "fn ⌃ ⌥ ⌘ ␣ ⌘ ⌥ ◀ ▼ ▶"];
    rows.forEach((r, j) => { const ks = r.split(" "); const kw = (w - 40) / 14; let x = 20; ks.forEach((k) => { const ww = k === "␣" ? kw * 5.2 : ["⌫", "⏎", "⇪", "⇧"].includes(k) ? kw * 1.5 : kw; g.fillStyle = "#050506"; rr(g, x + 3, 20 + j * 78, ww - 6, 68, 8); g.fill(); g.fillStyle = "#cfcac0"; g.font = "700 22px Mono"; g.textAlign = "center"; g.fillText(k === "␣" ? "" : k, x + ww / 2, 58 + j * 78); x += ww; }); });
    g.textAlign = "left";
  }, []);
  const alu = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a2b2e", metalness: 0.7, roughness: 0.38 }), []);
  const base = useMemo(() => new RoundedBoxGeometry(3.3, 0.12, 2.3, 4, 0.05), []), lid = useMemo(() => new RoundedBoxGeometry(3.3, 2.15, 0.07, 4, 0.03), []);
  const pop = clamp((f - CARD) / 8), popE = 1 - Math.pow(1 - pop, 3);
  return <group>
    <mesh geometry={base} material={alu} position={[0, 0.06, 0]} castShadow receiveShadow />
    <mesh position={[0, 0.125, 0.25]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[3.0, 1.23]} /><meshStandardMaterial map={keys} roughness={0.6} emissiveMap={keys} emissive="#ffffff" emissiveIntensity={0.05} /></mesh>
    <mesh position={[0, 0.125, 0.98]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.3, 0.6]} /><meshStandardMaterial color="#1f2023" metalness={0.5} roughness={0.25} /></mesh>
    <group position={[0, 0.12, -1.12]} rotation={[-0.28, 0, 0]}>
      <mesh geometry={lid} material={alu} position={[0, 1.07, -0.04]} castShadow />
      <mesh position={[0, 1.1, 0.0]}><planeGeometry args={[3.1, 1.94]} /><meshBasicMaterial map={term} toneMapped={false} /></mesh>
      {pop > 0 && <mesh position={[0.35, 1.05 + (1 - popE) * -0.1, 0.012]} scale={0.9 + 0.1 * popE}><planeGeometry args={[1.55, 1.12]} /><meshBasicMaterial map={card} transparent opacity={popE} toneMapped={false} /></mesh>}
      <Glow p={[0, 1.1, 0.6]} s={5} color="#9fb6ff" o={0.08} />
    </group>
  </group>;
};

const Phone: React.FC<{ f: number }> = ({ f }) => {
  const notif = clamp((f - NOTIF) / 8), wake = f < SESSION.typed.at + 8 ? 1 : f >= PHONE_BACK + 6 ? 1 : 0.06, morning = f >= PHONE_BACK;
  const scr = useCanvasTex(600, 1240, (g, w, h) => {
    g.fillStyle = "#050505"; g.fillRect(0, 0, w, h); if (wake < 0.1) return;
    g.fillStyle = "#cfcfcf"; g.beginPath(); g.arc(w / 2, h * 0.78, w * 0.48, 0, Math.PI * 2); g.fill();
    [[0.38, 0.7, 50], [0.62, 0.74, 34], [0.5, 0.86, 60], [0.7, 0.9, 28], [0.33, 0.88, 26]].forEach(([x, y, r]) => { g.fillStyle = "#9a9a9a"; g.beginPath(); g.arc(w * x, h * y, r, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = "#e8e8e8"; g.textAlign = "center"; g.font = "700 30px Inter"; g.fillText(!morning ? "четверг, 6 ноября" : "пятница, 7 ноября", w / 2, 150);
    g.font = "800 150px Inter"; g.fillText(!morning ? "23:51" : "08:12", w / 2, 290);
    if (notif > 0) { g.globalAlpha = notif; g.fillStyle = "rgba(60,60,64,0.92)"; rr(g, 30, 340 - (1 - notif) * 60, w - 60, 150, 26); g.fill(); g.fillStyle = "#E07A52"; rr(g, 52, 370 - (1 - notif) * 60, 60, 60, 14); g.fill(); g.textAlign = "left"; g.fillStyle = "#fff"; g.font = "800 30px Inter"; g.fillText("Claude Code", 130, 392 - (1 - notif) * 60); g.font = "500 26px Inter"; g.fillStyle = "#ddd"; g.fillText("claude-anime.mp4 готов · 23,7 с", 130, 434 - (1 - notif) * 60); g.fillText("−14,5 LUFS · PASS", 130, 468 - (1 - notif) * 60); g.globalAlpha = 1; }
    g.textAlign = "left";
  }, [morning, Math.round(notif * 10), wake > 0.1]);
  const body = useMemo(() => new RoundedBoxGeometry(0.75, 0.06, 1.55, 4, 0.05), []);
  return <group position={[3.1, 0.03, 0.9]} rotation={[0, -0.35, 0]}>
    <mesh geometry={body} castShadow receiveShadow><meshStandardMaterial color="#111" metalness={0.6} roughness={0.3} /></mesh>
    <mesh position={[0, 0.032, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.69, 1.47]} /><meshBasicMaterial map={scr} toneMapped={false} /></mesh>
    {wake > 0.1 && <Glow p={[0, 0.25, 0]} s={2.2} color="#dde4ff" o={0.12} />}
  </group>;
};

const Desk: React.FC = () => {
  const wood = useCanvasTex(1024, 1024, (g, w, h) => { g.fillStyle = "#3b332c"; g.fillRect(0, 0, w, h); for (let i = 0; i < 140; i++) { g.strokeStyle = `rgba(${20 + rand(i) * 30},${16 + rand(i) * 20},${12},${0.25 + rand(i * 3) * 0.3})`; g.lineWidth = 1 + rand(i * 5) * 3; g.beginPath(); const y = rand(i * 7) * h; g.moveTo(0, y); for (let x = 0; x <= w; x += 64) g.lineTo(x, y + Math.sin(x / 140 + i) * 6); g.stroke(); } }, []);
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[30, 30]} /><meshStandardMaterial map={wood} roughness={0.75} /></mesh>
    {/* charging cable */}
    <mesh position={[2.3, 0.04, -0.4]} rotation={[-Math.PI / 2, 0, 0.8]}><torusGeometry args={[1.1, 0.035, 8, 60, Math.PI * 1.3]} /><meshStandardMaterial color="#e8e6e0" roughness={0.5} /></mesh>
    {/* mug */}
    <mesh position={[-3.2, 0.45, -0.6]} castShadow><cylinderGeometry args={[0.38, 0.34, 0.9, 32]} /><meshStandardMaterial color="#d9d2c4" roughness={0.6} /></mesh>
  </>;
};

// ── handheld camera: shots + breathing drift + micro shake; returns also how fast it moves (for motion blur)
type K = { at: number; pos: [number, number, number]; look: [number, number, number]; focus: number };
const KEYS: K[] = [
  { at: 0, pos: [3.55, 2.5, 1.95], look: [3.1, 0.05, 0.9], focus: 0.55 },                  // phone on the desk, 23:51
  { at: SESSION.typed.at + 4, pos: [-0.35, 2.15, 1.95], look: [-0.55, 1.28, -1.35], focus: 0.36 }, // swing up to the screen (top-left)
  { at: L("check", 0), pos: [-0.45, 2.0, 1.8], look: [-0.5, 1.08, -1.4], focus: 0.42 },
  { at: L("render", 0), pos: [-0.3, 1.85, 1.75], look: [-0.35, 0.86, -1.4], focus: 0.46 },        // lower lines + keyboard
  { at: CARD, pos: [0.45, 1.6, 1.15], look: [0.35, 1.0, -1.45], focus: 0.45 },                     // push in on the card
  { at: PHONE_BACK, pos: [3.6, 2.55, 2.0], look: [3.1, 0.05, 0.9], focus: 0.52 },                  // back down to the phone
];
const camAt = (f: number) => {
  let i = 0; KEYS.forEach((k, j) => { if (f >= k.at) i = j; });
  const a = KEYS[i], b = KEYS[i + 1], move = b ? 22 : 0;
  const t = b ? io(clamp((f - (b.at - move)) / move)) : 0;
  const lp = (x: number[], y: number[]) => new THREE.Vector3(...x.map((v, k) => lerp(v, y[k], t)));
  const pos = b ? lp(a.pos, b.pos) : new THREE.Vector3(...a.pos), look = b ? lp(a.look, b.look) : new THREE.Vector3(...a.look);
  const focus = b ? lerp(a.focus, b.focus, t) : a.focus;
  // hand: slow breathing + 1/f-ish jitter
  // hand: slow breathing + smooth micro-tremor (continuous, no per-frame jumps)
  const n = (s: number) => Math.sin(f / 37 + s) * 0.02 + Math.sin(f / 17 + s * 2) * 0.006 + smoothNoise(f, 9, s) * 0.012 + smoothNoise(f, 4, s + 50) * 0.003;
  pos.x += n(1); pos.y += n(2); look.x += n(3) * 0.6; look.y += n(4) * 0.6;
  const speed = b && f > b.at - move && f < b.at ? Math.sin(t * Math.PI) : 0;
  return { pos, look, focus, speed, roll: n(5) * 0.6 };
};
const Cam: React.FC<{ f: number }> = ({ f }) => {
  const { camera } = useThree();
  useLayoutEffect(() => { const c = camAt(f); camera.position.copy(c.pos); camera.lookAt(c.look); camera.rotateZ(c.roll); }, [f, camera]);
  return null;
};

type Fx = [number, string, number, number?];
const SFX: Fx[] = [
  ...Array.from({ length: 26 }, (_, i): Fx => [SESSION.typed.at + i * ((SESSION.typed.until - SESSION.typed.at) / 26), "clock-tick-single", 0.12 + rand(i) * 0.08, 5]),
  [SESSION.typed.until + 2, "hit-blow", 0.18, 10],
  ...SESSION.lines.filter((l) => l.kind === "tool").map((l): Fx => [l.at, "paper-slide", 0.12, 10]),
  [CARD, "sparkle", 0.4], [CARD + 2, "coin", 0.3],
  [NOTIF, "ding", 0.35, 40], [PHONE_BACK - 18, "swoosh-slow", 0.2],
];

export const ScreenVideo: React.FC = () => {
  const f = useCurrentFrame(); const ok = useFonts();
  const c = camAt(f);
  const speech = LINES.map((l) => [l.from - 4, l.from + l.dur + 4]);
  // exposure: the phone camera adapts when it swings from the dark desk to the bright screen
  const expo = 1 + 0.25 * Math.sin(clamp((f - SESSION.typed.at - 4) / 30) * Math.PI) - 0.15 * c.speed;
  const band = c.focus * 1920, bw = 360;   // focus band (px) on the 9:16 frame
  return (
    <AbsoluteFill style={{ background: "#050505" }}>
      <Fonts />
      <AbsoluteFill style={{ filter: `brightness(${expo}) saturate(0.92) contrast(1.06)${c.speed > 0.2 ? ` blur(${c.speed * 5}px)` : ""}` }}>
        {ok && <ThreeCanvas width={1080} height={1920} shadows camera={{ fov: 50, near: 0.05, far: 100, position: [4, 1.5, 2.6] }} gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}>
          <Cam f={f} />
          <ambientLight intensity={0.08} color="#8090b0" />
          <pointLight position={[0, 1.5, 0.2]} intensity={7} distance={7} decay={2} color="#b8c8ff" />
          <pointLight position={[-4, 3.5, 2]} intensity={10} distance={12} decay={2} color="#ffb070" castShadow shadow-mapSize={[1024, 1024]} />
          <Desk /><Laptop f={f} /><Phone f={f} />
        </ThreeCanvas>}
      </AbsoluteFill>
      {/* depth of field: a blurred copy of everything outside the focus band */}
      <AbsoluteFill style={{ backdropFilter: "blur(7px)", WebkitBackdropFilter: "blur(7px)", maskImage: `linear-gradient(180deg, #000 0px, #000 ${band - bw - 160}px, transparent ${band - bw * 0.5}px, transparent ${band + bw * 0.5}px, #000 ${band + bw + 160}px, #000 1920px)`, WebkitMaskImage: `linear-gradient(180deg, #000 0px, #000 ${band - bw - 160}px, transparent ${band - bw * 0.5}px, transparent ${band + bw * 0.5}px, #000 ${band + bw + 160}px, #000 1920px)` }} />
      {/* lens: vignette, slight chromatic fringe, sensor noise */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 65% at 50% 48%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)" }} />
      <AbsoluteFill style={{ boxShadow: "inset 6px 0 18px rgba(255,40,40,0.06), inset -6px 0 18px rgba(40,120,255,0.06)" }} />
      <AbsoluteFill style={{ opacity: 0.16, mixBlendMode: "overlay" }}><svg width="1080" height="1920"><filter id="sn"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed={f % 30} /><feColorMatrix type="saturate" values="0" /></filter><rect width="1080" height="1920" filter="url(#sn)" /></svg></AbsoluteFill>
      {f >= W("end", 0, "хочешь") && <div style={{ position: "absolute", left: 0, right: 0, top: 220, textAlign: "center" }}>
        <div style={{ font: "800 52px Inter", color: "#f3ead8", textShadow: "0 4px 24px rgba(0,0,0,0.8)", opacity: p(f, W("end", 0, "хочешь"), 10) }}>хочешь так же?</div>
        <div style={{ display: "inline-block", marginTop: 22, font: "400 124px Russo", color: "#2a1c10", background: "#e8a23a", borderRadius: 18, padding: "4px 40px", transform: `scale(${p(f, W("end", 0, "экран") - 4, 12, Easing.out(Easing.back(1.7)))})` }}>«ЭКРАН»</div>
        <div style={{ font: "800 42px Inter", color: "#f3ead8", marginTop: 18, textShadow: "0 4px 24px rgba(0,0,0,0.8)", opacity: p(f, W("end", 0, "экран") + 8, 10) }}>пиши в комментариях</div>
      </div>}
      <Captions f={f} />
      <Audio src={staticFile("music.mp3")} volume={(fr) => (fr > TL.total - 14 ? interpolate(fr, [TL.total - 14, TL.total], [0.22, 0]) : speech.some(([a, b]) => fr >= a && fr <= b) ? 0.09 : 0.22)} />
      {LINES.map((l) => <Sequence key={l.file} from={Math.max(0, l.from - Math.round(l.lead * 30))}><Audio src={staticFile(l.file)} /></Sequence>)}
      {SFX.map(([at, n, v, len], i) => <Sequence key={i} from={Math.max(0, Math.round(at))} durationInFrames={len ?? 80}><Audio src={staticFile(`sfx/${n}.mp3`)} volume={v} /></Sequence>)}
    </AbsoluteFill>
  );
};
