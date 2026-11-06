import React, { useLayoutEffect } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { C, Captions, Fonts, Grain, L, LINES, SC, TL, W, clamp, p, io, lerp, backOut } from "../lib";
import { Particles } from "../fx";
import { Cabin, Floors, FLOORS, H, Outside, TITLES, Wire } from "./World";
import { Clay, ClayState, Face } from "./Clay";
import { useFonts } from "./tex";

const IDS = TL.scenes.map((s) => s.id);           // lobby, f1..f6, roof — index = floor
const FROM = TL.scenes.map((s) => s.from);
const ARRIVE = FROM.map((f, k) => (k === 0 ? 0 : f + 14));
const ROOF = IDS.length - 1;

const sceneAt = (f: number) => { let k = 0; FROM.forEach((s, i) => { if (f >= s - 10) k = i; }); return k; };
const cabinY = (f: number) => { const k = sceneAt(f); if (k === 0) return 0; const t = io(clamp((f - (FROM[k] - 10)) / 24)); return (k - 1 + t) * H; };
const doorOpen = (f: number) => {
  const k = sceneAt(f); const o = p(f, ARRIVE[k] + 4, 12, io);
  const close = k < ROOF ? p(f, FROM[k + 1] - 22, 10, io) : 0; return o * (1 - close);
};
const words = TL.scenes.flatMap((s) => s.lines.flatMap((l) => l.words.map((w) => w[1])));
const lineWords = (id: string) => SC(id).lines.flatMap((l) => l.words.map((w) => w[1]));

// ── roof camera crane: inside → out over the terrace → wide shot of the whole tower at sunset
const RY = ROOF * H, CRANE = W("roof", 1, "хочешь") + 14;
const camAt = (f: number) => {
  const y = cabinY(f), sway = Math.sin(f / 80) * 0.06;
  let pos = new THREE.Vector3(sway, y + 1.42, -2.45), look = new THREE.Vector3(0, y + 1.62, 3.0);
  if (sceneAt(f) === ROOF) {
    const a = p(f, ARRIVE[ROOF] + 10, 40, io);
    pos = new THREE.Vector3(sway, lerp(y + 1.5, y + 1.75, a), lerp(-2.35, 0.4, a)); look = new THREE.Vector3(0, y + lerp(1.25, 1.0, a), lerp(3, 4, a));
    const c = p(f, CRANE, 95, Easing.inOut(Easing.quad));
    if (c > 0) {
      const P = [pos, new THREE.Vector3(3.5, RY + 6, 10), new THREE.Vector3(9, 12, 50)], Lk = [look, new THREE.Vector3(0, RY + 0.6, 3.5), new THREE.Vector3(0, 19, 0)];
      const seg = (arr: THREE.Vector3[]) => (c < 0.5 ? arr[0].clone().lerp(arr[1], io(c * 2)) : arr[1].clone().lerp(arr[2], io((c - 0.5) * 2)));
      pos = seg(P); look = seg(Lk);
      const drift = clamp((f - CRANE - 95) / 120); pos.x += -drift * 2.5; pos.y += drift * 0.8;
    }
  }
  return { pos, look };
};
const Cam: React.FC<{ f: number }> = ({ f }) => {
  const { camera } = useThree();
  useLayoutEffect(() => { const { pos, look } = camAt(f); camera.position.copy(pos); camera.lookAt(look); (camera as THREE.PerspectiveCamera).updateProjectionMatrix(); }, [f, camera]);
  return null;
};

// ── what Clawd does in each moment
const clayAt = (f: number): ClayState => {
  const k = sceneAt(f), y = cabinY(f), id = IDS[k];
  const arrive = k === 0 ? -99 : ARRIVE[k], bump = f >= arrive - 6 && f < arrive + 10 ? clamp((f - arrive + 6) / 16) : 0;
  const ws = lineWords(id), last = [...ws].reverse().find((t) => f >= t) ?? -99;
  const st: ClayState = { s: 0.62, pos: [-0.3, y, 0.72], ry: Math.PI - 0.32 + Math.sin(f / 45) * 0.08, blink: f % 83 < 4, hop: bump, face: "smile" };
  const faces: Record<string, Face> = { lobby: "happy", f1: "focus", f2: "smile", f3: "wow", f4: "proud", f5: "focus", f6: "happy", roof: "happy" };
  st.face = faces[id];
  if (id === "lobby") { st.wave = Math.sin(clamp((f - 6) / 50) * Math.PI); }
  if (id === "f1") { st.ry = Math.PI - 0.9; st.look = 0.6; }
  if (id === "f2") { st.phones = true; st.hop = Math.max(bump, f - last < 8 ? Math.sin(((f - last) / 8) * Math.PI) * 0.25 : 0); }
  if (id === "f3") { st.ry = Math.PI - 0.8 + Math.sin(f / 12) * 0.15; }
  if (id === "f4") { st.face = f >= W("f4", 0, "сам") ? "wink" : "proud"; }
  if (id === "f5") { st.glass = true; st.ry = Math.PI - 0.85; st.look = 0.7; }
  if (id === "f6") { st.hop = Math.max(bump, f >= LE6 ? Math.sin(clamp((f - LE6) / 14) * Math.PI) : 0); }
  if (id === "roof") {
    const w = p(f, ARRIVE[ROOF] + 12, 44, io), turn = p(f, CRANE - 30, 18, io);
    st.pos = [lerp(-0.3, 0, w), y, lerp(0.72, 3.4, w)];
    st.walk = w > 0 && w < 1 ? f / 2.2 : 0;
    st.ry = lerp(lerp(Math.PI - 0.32, 0.05, Math.min(1, w * 3)), Math.PI, turn);
    st.wave = f > CRANE - 12 ? 0.6 + Math.sin(f / 5) * 0.4 : 0;
  }
  return st;
};
const LE6 = W("f6", 0, "эм") + 20;

type Fx = [number, string, number, number?];
const SFX: Fx[] = [
  [2, "swoosh-slow", 0.3],
  ...FROM.slice(1).flatMap((s): Fx[] => [[s - 26, "paper-slide", 0.25, 14], [s - 10, "lift-hum", 0.55, 30], [s + 13, "ding", 0.45, 50], [s + 18, "swoosh-slow", 0.18, 30]]),
  [W("f2", 0, "голос"), "sparkle", 0.25],
  [W("f3", 0, "частицы"), "sparkle", 0.45],
  [W("f4", 0, "сам"), "glitch-static", 0.4, 18], [W("f4", 0, "код") + 16, "hit-blow", 0.35],
  [W("f5", 0, "косяки") - 10, "marker-pen-line", 0.55, 22], [W("f5", 0, "косяки") + 18, "impact-cine-big", 0.35],
  [LE6 - 2, "coin", 0.5], [LE6 + 2, "sparkle", 0.45],
  [CRANE - 6, "riser-cine", 0.35, 90], [W("roof", 1, "студия") - 4, "impact-cine-big", 0.45],
];

export const TowerVideo: React.FC = () => {
  const f = useCurrentFrame(); const ok = useFonts(["sheet/s1.png", "sheet/s2.png", "sheet/s3.png", "sheet/s4.png", "sheet/s5.png", "sheet/s5f.png", "sheet/s6.png"]);
  const k = sceneAt(f), y = cabinY(f), moving = k > 0 && f > FROM[k] - 10 && f < FROM[k] + 14 ? 1 : 0;
  const ring = p(f, W("f5", 0, "косяки") - 10, 18, io), fixed = p(f, W("f5", 0, "косяки") + 18, 10, backOut);
  const pr = p(f, W("f6", 0, "рендер"), LE6 - W("f6", 0, "рендер"), io);
  const wire = f >= W("f4", 0, "сам") && f < W("f4", 0, "код") + 16;
  const speech = LINES.map((l) => [l.from - 4, l.from + l.dur + 4]);
  const cta = p(f, W("roof", 1, "студия") - 6, 16, backOut);
  return (
    <AbsoluteFill style={{ background: "#120c0a" }}>
      <Fonts />
      {ok && <ThreeCanvas width={1080} height={1920} shadows camera={{ fov: 64, near: 0.05, far: 900, position: [0, 1.5, -2.35] }} gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}>
        <Cam f={f} />
        <hemisphereLight args={["#ffe9cf", "#2a1810", 0.55]} />
        <directionalLight position={[30, 40, 60]} intensity={sceneAt(f) === ROOF ? 1.6 : 0.2} color="#ffb27a" />
        <Outside />
        <Floors f={f} near={y / H} data={{ at: FROM, words: lineWords("f2"), ring, fixed, pr, total: TL.total }} />
        <Cabin y={y} open={doorOpen(f)} label={`${FLOORS[Math.round(y / H)]}|${TITLES[Math.round(y / H)]}`} moving={moving} f={f} />
        <Clay st={clayAt(f)} />
        <Wire on={wire} />
      </ThreeCanvas>}
      {f >= LE6 - 4 && f < LE6 + 60 && <svg width={1080} height={1920} style={{ position: "absolute" }}><Particles at={LE6} x={540} y={760} kind="confetti" n={110} seed={8} life={60} power={1.3} /></svg>}
      {cta > 0 && <div style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center" }}>
        <div style={{ font: "800 54px Inter", color: "#f6e7c8", textShadow: "0 6px 30px rgba(0,0,0,0.7)", opacity: cta }}>хочешь такую студию?</div>
        <div style={{ display: "inline-block", marginTop: 26, font: "400 120px Russo", color: "#1a120e", background: "#d9b25c", borderRadius: 26, padding: "6px 40px", transform: `scale(${cta}) rotate(-2deg)`, boxShadow: "0 0 60px rgba(217,178,92,0.6)" }}>«СТУДИЯ»</div>
        <div style={{ font: "800 44px Inter", color: "#f6e7c8", marginTop: 22, opacity: p(f, W("roof", 1, "студия") + 10, 10), textShadow: "0 6px 30px rgba(0,0,0,0.7)" }}>пиши в комментариях</div>
      </div>}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 60% at 50% 45%, rgba(0,0,0,0) 55%, rgba(10,5,3,0.55) 100%)", pointerEvents: "none" }} />
      <Captions f={f} />
      <Grain f={f} o={0.05} />
      <Audio src={staticFile("music.mp3")} volume={(fr) => (fr > TL.total - 14 ? interpolate(fr, [TL.total - 14, TL.total], [0.3, 0]) : speech.some(([a, b]) => fr >= a && fr <= b) ? 0.12 : 0.3)} />
      {LINES.map((l) => <Sequence key={l.file} from={Math.max(0, l.from - Math.round(l.lead * 30))}><Audio src={staticFile(l.file)} /></Sequence>)}
      {SFX.map(([at, n, v, len], i) => <Sequence key={i} from={Math.max(0, Math.round(at))} durationInFrames={len ?? 80}><Audio src={staticFile(`sfx/${n}.mp3`)} volume={v} /></Sequence>)}
    </AbsoluteFill>
  );
};
export { C, L };
