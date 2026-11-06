// «Клод: эпизод 1» — anime opening. Hard cuts between shots, character animated on twos, impact frames on hits.
import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { Captions, Fonts, LINES, SC, TL, W, L, clamp, p, io, lerp, rand, backOut } from "../lib";
import { Particles } from "../fx";
import { Clay, ClayState, TOON_RAMP, INK } from "../cozy3d/Clay";
import { useFonts } from "../cozy3d/tex";
import { FocusLines, Petals, SkillCard, Sfx, Sky, SpeedLines, impactFilter } from "./AnimeFx";

const HIT = W("bug", 1, "удар"), FIX = W("bug", 1, "исправлен"), BUG = W("bug", 0, "баг"), BEAM = W("render", 0, "рендер");
const SKILLS: [number, string, string, string][] = [[W("power", 0, "ремоушн"), "REMOTION", "СИЛА I · монтаж", "#ff6a3d"], [W("power", 0, "три"), "THREE.JS", "СИЛА II · 3D", "#4fb3ff"], [W("power", 0, "шейдеры"), "ШЕЙДЕРЫ", "СИЛА III · свет", "#c77dff"]];
const IMPACTS = [HIT, HIT + 6, BEAM + 2, ...SKILLS.map((s) => s[0])];

// ── shots (hard cuts). Camera: position, look target, fov, dutch roll
type Shot = { from: number; pos: [number, number, number]; look: [number, number, number]; fov: number; roll?: number; push?: [number, number, number] };
const SHOTS: Shot[] = [
  { from: 0, pos: [0, 0.6, 9], look: [0, 2.2, 0], fov: 42, push: [0, 0.2, -1.2] },                              // title: low wide, hero on the hill
  { from: SC("hero").from, pos: [4.4, 1.9, 6.6], look: [0, 0.8, 0], fov: 36, roll: -0.12, push: [-0.6, 0, -1.2] }, // hero: 3/4 medium, dutch
  { from: W("hero", 0, "задание") - 2, pos: [0.9, 1.1, 4.2], look: [0, 0.75, 0], fov: 34, roll: 0.05 },         // push to the face
  { from: SC("power").from, pos: [0, 0.85, 2.9], look: [0, 0.68, 0], fov: 30 },                                 // extreme close-up: eyes shine
  { from: SKILLS[0][0] - 3, pos: [-2.6, 0.3, 4.4], look: [0, 0.9, 0], fov: 46, roll: 0.18 },                      // low angle power-up
  { from: SC("bug").from, pos: [1.3, 1.9, 11.5], look: [1.3, 0.9, 0], fov: 40 },                                  // two-shot: hero vs bug
  { from: BUG - 2, pos: [2.0, 1.1, 6.4], look: [2.6, 0.9, 0], fov: 34, roll: -0.1 },                            // bug reveal
  { from: HIT - 8, pos: [0.8, 0.9, 5.6], look: [1.4, 0.9, 0], fov: 50, roll: 0.22 },                             // the hit
  { from: FIX + 4, pos: [-2.2, 1.5, 6.4], look: [0, 0.8, 0], fov: 38 },                                          // after: hero proud
  { from: SC("render").from, pos: [0, 0.4, 4.2], look: [0, 2.35, 0], fov: 58, push: [0, -0.1, -0.5] },            // beam: low hero shot
  { from: SC("end").from, pos: [0, 2.2, 10], look: [0, 2.0, 0], fov: 40, push: [0, 0.3, 1.0] },                  // sunset wide
];
const shotAt = (f: number) => { let k = 0; SHOTS.forEach((s, i) => { if (f >= s.from) k = i; }); return k; };
const camState = (f: number) => {
  const k = shotAt(f), s = SHOTS[k], end = SHOTS[k + 1]?.from ?? TL.total, t = clamp((f - s.from) / Math.max(1, end - s.from));
  const pos = new THREE.Vector3(...s.pos).addScaledVector(new THREE.Vector3(...(s.push ?? [0, 0, 0])), io(t));
  // impact shake: a damped oscillation after each hit (smooth, decays in ~10 frames)
  for (const i of IMPACTS) { const d = f - i; if (d >= 0 && d < 14) { const a = 0.07 * Math.exp(-d / 4); pos.x += Math.sin(d * 2.3) * a; pos.y += Math.cos(d * 1.7) * a * 0.7; } }
  return { pos, look: new THREE.Vector3(...s.look), fov: s.fov, roll: s.roll ?? 0 };
};
const Cam: React.FC<{ f: number }> = ({ f }) => {
  const { camera } = useThree();
  useLayoutEffect(() => { const c = camState(f), cam = camera as THREE.PerspectiveCamera; cam.position.copy(c.pos); cam.lookAt(c.look); cam.rotateZ(c.roll); cam.fov = c.fov; cam.updateProjectionMatrix(); }, [f, camera]);
  return null;
};

// ── the hill, grass tufts, a lone tree, the bug
const toon = (color: string) => new THREE.MeshToonMaterial({ color, gradientMap: TOON_RAMP });
const Hill: React.FC = () => {
  const grass = useMemo(() => toon("#5fbf4a"), []), dark = useMemo(() => toon("#3f8f3a"), []), trunk = useMemo(() => toon("#6b4228"), []), leaf = useMemo(() => toon("#ff9ec0"), []);
  return <group>
    <mesh position={[0, -14.0, 0]} material={grass} receiveShadow><sphereGeometry args={[14, 64, 32]} /></mesh>
    <mesh position={[0, -14.0, 0]} material={INK} scale={1.004}><sphereGeometry args={[14, 64, 32]} /></mesh>
    <mesh position={[-9, -22, -30]} material={dark}><sphereGeometry args={[26, 48, 24]} /></mesh>
    <mesh position={[16, -24, -40]} material={toon("#4a9fa0")}><sphereGeometry args={[30, 48, 24]} /></mesh>
    {Array.from({ length: 40 }, (_, i) => { const a = rand(i) * Math.PI * 2, r = 1.2 + rand(i * 3) * 5; const x = Math.cos(a) * r, z = Math.sin(a) * r; const y = Math.sqrt(Math.max(0, 196 - x * x - z * z)) - 14;
      return <mesh key={i} position={[x, y + 0.08, z]} rotation={[0, a, 0]} material={dark}><coneGeometry args={[0.06, 0.25, 4]} /></mesh>; })}
    <group position={[-2.6, -0.25, -2.2]}>
      <mesh position={[0, 1.2, 0]} material={trunk} castShadow><cylinderGeometry args={[0.12, 0.2, 2.4, 10]} /></mesh>
      {[[0, 2.6, 0, 1.1], [0.7, 2.3, 0.2, 0.8], [-0.6, 2.4, -0.1, 0.85], [0.1, 3.2, 0, 0.75]].map(([x, y, z, r], i) => <group key={i}><mesh position={[x, y, z]} material={leaf} castShadow><icosahedronGeometry args={[r, 1]} /></mesh><mesh position={[x, y, z]} material={INK} scale={1.06}><icosahedronGeometry args={[r, 1]} /></mesh></group>)}
    </group>
  </group>;
};
const Bug: React.FC<{ f: number; appear: number; dead: number }> = ({ f, appear, dead }) => {
  const geo = useMemo(() => { const g = new THREE.IcosahedronGeometry(0.55, 2); const p = g.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i); v.multiplyScalar(1 + (rand(i * 7.3) > 0.82 ? 0.55 : rand(i) * 0.12)); p.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals(); return g; }, []);
  const mat = useMemo(() => toon("#24192e"), []);
  if (appear <= 0 || dead >= 1) return null;
  const s = backOut(clamp(appear)) * (1 - dead), jit = Math.floor(f / 2);
  return <group position={[2.6 + (rand(jit) - 0.5) * 0.06, 0.85 + Math.sin(f / 6) * 0.06, 0]} scale={s} rotation={[0, f * 0.04, rand(jit) * 0.1]}>
    <mesh geometry={geo} material={mat} castShadow /><mesh geometry={geo} material={INK} scale={1.05} />
    {[-0.17, 0.17].map((x) => <mesh key={x} position={[x - 0.15, 0.08, 0.5]} rotation={[0, -0.3, 0]}><circleGeometry args={[0.09, 3]} /><meshBasicMaterial color="#ff2a3a" toneMapped={false} /></mesh>)}
    {Array.from({ length: 6 }, (_, i) => <mesh key={i} position={[(rand(jit * 5 + i) - 0.5) * 1.6, (rand(jit * 3 + i) - 0.5) * 1.4, 0.3]}><boxGeometry args={[0.08 + rand(i) * 0.12, 0.04, 0.04]} /><meshBasicMaterial color={i % 2 ? "#ff2a3a" : "#33fff0"} toneMapped={false} /></mesh>)}
  </group>;
};
const Beam: React.FC<{ p: number; f: number }> = ({ p: k, f }) => k <= 0 ? null : (
  <group position={[0, 0, -1.4]}>
    <mesh position={[0, 30, 0]} scale={[k * (1 + Math.sin(f) * 0.05), 1, k]}><cylinderGeometry args={[0.55, 0.85, 60, 24, 1, true]} /><meshBasicMaterial color="#fff4c0" transparent opacity={0.85} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} /></mesh>
    <mesh position={[0, 30, 0]} scale={[k * 1.8, 1, k * 1.8]}><cylinderGeometry args={[0.55, 0.85, 60, 24, 1, true]} /><meshBasicMaterial color="#ff8a3d" transparent opacity={0.35} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} /></mesh>
  </group>
);

// ── Clawd per moment. Only the CHARACTER (and the bug) is animated on twos (`fa` = f − f % 2), like hand-drawn anime;
// camera, sky and petals run on every frame — twos on the camera make the whole picture stutter.
const clayAt = (f: number, fa: number): ClayState => {
  const st: ClayState = { pos: [0, 0, 0], s: 1, ry: 0.15, toon: true, band: fa / 4, face: "proud", blink: fa % 96 < 4 };
  if (f < SC("hero").from) { st.ry = 0.3; st.face = "smile"; }
  if (f >= SC("hero").from && f < SC("power").from) { st.ry = 0.55; st.face = f >= W("hero", 0, "задание") ? "focus" : "smile"; st.look = 0.4; }
  if (f >= SC("power").from && f < SC("bug").from) { st.ry = 0; st.face = "focus"; st.shine = clamp((f - W("power", 0, "призывает")) / 10); st.hop = SKILLS.some((s) => f >= s[0] && f < s[0] + 10) ? Math.sin(clamp((f - SKILLS.find((s) => f >= s[0] && f < s[0] + 10)![0]) / 10) * Math.PI) * 0.4 : 0; st.wave = SKILLS.some((s) => f >= s[0] - 2 && f < s[0] + 14) ? 1 : 0; }
  if (f >= SC("bug").from && f < SC("render").from) {
    st.ry = 1.2; st.face = f < BUG + 6 ? "wow" : "focus"; st.look = 0.8;
    const dash = p(f, HIT - 8, 8, Easing.in(Easing.cubic)), back = p(f, HIT + 10, 14, io);
    st.pos = [lerp(0, 1.7, dash) - back * 1.7, 0, 0]; st.wave = f >= HIT - 4 && f < HIT + 12 ? 1 : 0;
    if (f >= FIX + 4) { st.ry = 0.35; st.face = "proud"; st.shine = 1; }
  }
  if (f >= SC("render").from) { st.ry = 0; st.face = f >= BEAM ? "happy" : "focus"; st.wave = f >= BEAM - 4 && f < SC("end").from ? 1 : 0; st.shine = 1; }
  if (f >= SC("end").from) { st.ry = 0.25; st.face = "happy"; st.wave = 0.6 + Math.sin(fa / 4) * 0.4; }
  return st;
};

type Fx = [number, string, number, number?];
const SFX: Fx[] = [
  [0, "riser-cine", 0.35, 60], [L("title", 0) + 30, "swoosh-slow", 0.3],
  ...SHOTS.slice(1).map((s): Fx => [s.from, "air-woosh-quick", 0.35, 14]),
  [W("power", 0, "призывает"), "sparkle", 0.5],
  ...SKILLS.flatMap(([t]): Fx[] => [[t - 1, "impact-cine-big", 0.55], [t, "hit-blow", 0.45]]),
  [BUG - 2, "glitch-static", 0.5, 24], [HIT - 8, "zoom-air-fast", 0.6], [HIT, "impact-cine-big", 0.8], [HIT + 1, "glass-break-hammer", 0.55], [HIT + 6, "bass-hit-short", 0.6],
  [FIX, "sparkle", 0.5], [BEAM - 10, "riser-cine", 0.4, 30], [BEAM, "impact-cine-big", 0.7], [BEAM + 2, "sand-swish", 0.5, 40],
  [W("end", 0, "аниме") - 4, "impact-cine-big", 0.45], [W("end", 0, "аниме"), "sparkle", 0.4],
];

export const AnimeVideo: React.FC = () => {
  const f = useCurrentFrame(), fa = f - (f % 2); const ok = useFonts();
  const sunset = p(f, BEAM, 40, io);
  const bugIn = p(f, BUG - 2, 10), bugDead = p(f, HIT + 2, 6);
  const impact = IMPACTS.some((i) => f >= i && f < i + 3);
  const focus = Math.max(...SKILLS.map(([t]) => (f >= t - 2 && f < t + 16 ? 1 - clamp((f - t - 8) / 8) : 0)), f >= HIT - 8 && f < HIT + 14 ? 1 : 0, f >= BEAM - 2 && f < BEAM + 24 ? 1 - clamp((f - BEAM - 12) / 12) : 0);
  const dash = f >= HIT - 8 && f < HIT ? 1 : 0;
  const speech = LINES.map((l) => [l.from - 4, l.from + l.dur + 4]);
  const k = shotAt(f);
  return (
    <AbsoluteFill style={{ background: "#0d0a14" }}>
      <Fonts />
      <AbsoluteFill style={{ filter: impactFilter(impact, f) }}>
        <Sky f={f} t={sunset} pan={k * 260} />
        {ok && <ThreeCanvas width={1080} height={1920} shadows camera={{ fov: 40, near: 0.05, far: 300, position: [0, 0.6, 9] }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, toneMapping: THREE.NoToneMapping }}>
          <Cam f={f} />
          <ambientLight intensity={0.55} color="#c9d8ff" />
          <directionalLight position={[4, 6, 5]} intensity={2.4 - sunset * 0.6} color={sunset > 0.5 ? "#ffb070" : "#fff6e0"} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />
          <Hill />
          <Clay st={clayAt(fa, fa)} />
          <Bug f={fa} appear={bugIn} dead={bugDead} />
          <Beam p={p(f, BEAM - 2, 8, backOut) * (1 - p(f, SC("end").from + 10, 20))} f={fa} />
        </ThreeCanvas>}
        <Petals f={f} wind={f >= SC("bug").from && f < SC("render").from ? 2.2 : 1} />
        <FocusLines f={f} o={focus} cy={k === 7 ? 1000 : 900} />
        <SpeedLines f={f} o={dash} />
        {f >= HIT && f < HIT + 40 && <svg width={1080} height={1920} style={{ position: "absolute" }}><Particles at={HIT} x={700} y={980} kind="sparks" n={80} seed={13} life={36} colors={["#ff2a3a", "#33fff0", "#ffffff", "#24192e"]} power={2.2} /></svg>}
        {f >= FIX && f < FIX + 60 && <svg width={1080} height={1920} style={{ position: "absolute" }}><Particles at={FIX} x={540} y={700} kind="confetti" n={60} seed={5} life={60} power={1.2} colors={["#ffd1e0", "#ffe14a", "#fff"]} /></svg>}
      </AbsoluteFill>
      {/* overlays that stay readable through impact frames */}
      {SKILLS.map(([t, name, sub, col], i) => <SkillCard key={i} name={name} sub={sub} p={clamp((f - t + 2) / 26)} x={540} y={420 + i * 40} rot={[-4, 3, -2][i]} color={col} />)}
      <Sfx text="БАМ!" p={clamp((f - HIT) / 30)} x={620} y={560} rot={-12} />
      <Sfx text="ВЖУХ" p={clamp((f - BEAM) / 26)} x={540} y={420} rot={8} size={180} color="#fff4c0" />
      {f < SC("hero").from && <div style={{ position: "absolute", right: 70, top: 190, display: "flex", gap: 26, opacity: p(f, 6, 10) * (1 - p(f, SC("hero").from - 8, 8)) }}>
        <div style={{ writingMode: "vertical-rl", font: "400 150px Russo", color: "#fff", WebkitTextStroke: "10px #140b0a", paintOrder: "stroke fill", transform: `translateY(${(1 - p(f, 6, 14, backOut)) * -120}px)` }}>КЛОД</div>
        <div style={{ writingMode: "vertical-rl", font: "800 54px Inter", color: "#fff", background: "#e8302a", padding: "18px 10px", alignSelf: "flex-start", marginTop: 20, transform: `scale(${p(f, 16, 10, backOut)})` }}>ЭПИЗОД 1</div>
      </div>}
      {f >= SC("end").from && <div style={{ position: "absolute", left: 0, right: 0, top: 200, textAlign: "center" }}>
        <div style={{ font: "400 150px Russo", color: "#fff", WebkitTextStroke: "12px #140b0a", paintOrder: "stroke fill", transform: `scale(${p(f, SC("end").from, 12, backOut)}) rotate(-4deg)` }}>СНЯТО!</div>
        {f >= W("end", 0, "хочешь") && <div style={{ marginTop: 30 }}>
          <div style={{ font: "800 54px Inter", color: "#fff", textShadow: "0 4px 0 #140b0a, 0 0 30px rgba(0,0,0,0.6)" }}>хочешь так же?</div>
          <div style={{ display: "inline-block", marginTop: 22, font: "400 130px Russo", color: "#140b0a", background: "#ffe14a", border: "10px solid #140b0a", borderRadius: 24, padding: "0 40px", transform: `scale(${p(f, W("end", 0, "аниме") - 4, 14, backOut)}) rotate(-3deg)` }}>«АНИМЕ»</div>
          <div style={{ font: "800 44px Inter", color: "#fff", marginTop: 18, textShadow: "0 4px 0 #140b0a", opacity: p(f, W("end", 0, "аниме") + 8, 10) }}>пиши в комментариях</div>
        </div>}
      </div>}
      {f >= SC("end").from && <div style={{ position: "absolute", left: 60, bottom: 420, font: "800 30px Inter", color: "#fff", opacity: 0.8, letterSpacing: 4 }}>NEXT EPISODE ▶</div>}
      <AbsoluteFill style={{ boxShadow: "inset 0 0 0 26px #0d0a14", pointerEvents: "none" }} />
      <Captions f={f} />
      <Audio src={staticFile("music.mp3")} volume={(fr) => (fr > TL.total - 14 ? interpolate(fr, [TL.total - 14, TL.total], [0.32, 0]) : speech.some(([a, b]) => fr >= a && fr <= b) ? 0.13 : 0.32)} />
      {LINES.map((l) => <Sequence key={l.file} from={Math.max(0, l.from - Math.round(l.lead * 30))}><Audio src={staticFile(l.file)} /></Sequence>)}
      {SFX.map(([at, n, v, len], i) => <Sequence key={i} from={Math.max(0, Math.round(at))} durationInFrames={len ?? 80}><Audio src={staticFile(`sfx/${n}.mp3`)} volume={v} /></Sequence>)}
    </AbsoluteFill>
  );
};
