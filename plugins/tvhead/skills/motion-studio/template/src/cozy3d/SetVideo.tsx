// «Клод снимает кино»: a camera dollies around the director's chair; every crew member gets a clapperboard and a station.
import React, { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { Captions, Fonts, Grain, LINES, SC, TL, W, clamp, p, io, lerp, backOut } from "../lib";
import { Particles } from "../fx";
import { Clay, ClayState } from "./Clay";
import { Chair, Credits, CrewItem, Robot, Slate, Stage, Station, stationAngle, stationPos } from "./FilmSet";
import { useFonts } from "./tex";
import { CREW as CREW_RAW } from "../crew";

const CREW = CREW_RAW as CrewItem[];
const N = CREW.length;
const ITEMS = TL.scenes.filter((s) => /^s\d+$/.test(s.id));
const itemAt = (f: number) => { let k = -1; ITEMS.forEach((s, i) => { if (f >= s.from - 8) k = i; }); return f >= SC("credits").from - 8 ? -2 : k; };
const CR = SC("credits"), SNAP = W("credits", 0, "снято"), CTA = W("credits", 1, "хочешь");

// camera: wide establishing → orbit to each station (Clawd in the foreground) → pull back to the credits
// stand between the chair and station i, look at its screen (Clawd stays behind the camera)
const orbit = (i: number) => { const a = stationAngle(i, N), u = new THREE.Vector3(Math.sin(a), 0, -Math.cos(a)), side = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)); const st = stationPos(i, N); return { pos: st.clone().addScaledVector(u, -4.4).addScaledVector(side, 0.55).setY(2.05), look: st.clone().setY(1.75) }; };
const WIDE = { pos: new THREE.Vector3(0, 4.2, 11.5), look: new THREE.Vector3(0, 1.8, -2.5) };
const END = { pos: new THREE.Vector3(0, 2.3, 8.0), look: new THREE.Vector3(0, 2.3, -4) };
const camAt = (f: number) => {
  const k = itemAt(f), mix = (a: typeof WIDE, b: typeof WIDE, t: number) => ({ pos: a.pos.clone().lerp(b.pos, t), look: a.look.clone().lerp(b.look, t) });
  if (k === -1) { const t = p(f, 0, SC("intro").to - 10, Easing.inOut(Easing.quad)); return mix(WIDE, { pos: new THREE.Vector3(0, 2.4, 6.0), look: new THREE.Vector3(0, 1.3, -1) }, t); }
  if (k === -2) { const from = orbit(N - 1); const t = p(f, CR.from - 8, 40, io); const c = mix(from, END, t); c.pos.z += clamp((f - CR.from - 40) / 200) * 1.2; return c; }
  const s = ITEMS[k], prev = k === 0 ? { pos: new THREE.Vector3(0, 2.4, 6.0), look: new THREE.Vector3(0, 1.3, -1) } : orbit(k - 1);
  const t = p(f, s.from - 8, 22, io), c = mix(prev, orbit(k), t);
  const push = clamp((f - s.from - 14) / 120) * 0.25; c.pos.lerp(c.look, push * 0.3);
  return c;
};

// slate lives in camera space: rises from below, claps on the tool's name, flies up and out
const SlateRig: React.FC<{ f: number }> = ({ f }) => {
  const { camera } = useThree(); const g = useRef<THREE.Group>(null);
  const k = itemAt(f), s = k >= 0 ? ITEMS[k] : null;
  const name = s ? s.lines[0].words[2]?.[1] ?? s.from + 20 : 0;     // «Сцена один. <Name>» → the third word
  const inn = s ? p(f, s.from - 2, 12, backOut) : 0, out = s ? p(f, name + 16, 12, Easing.in(Easing.cubic)) : 1, clap = s ? p(f, name - 2, 4) : 0;
  useLayoutEffect(() => { const G = g.current!; G.position.copy(camera.position); G.quaternion.copy(camera.quaternion); G.translateZ(-2.1); G.translateY(lerp(-1.4, -0.08, inn) + out * 1.6); G.rotateZ(lerp(-0.25, -0.05, inn) + out * 0.3); G.visible = !!s && out < 1 && f >= s.from - 2; });
  return <group ref={g}>{s && <Slate it={CREW[k]} i={k} n={N} clap={clap} />}</group>;
};

const Cam: React.FC<{ f: number }> = ({ f }) => {
  const { camera } = useThree();
  useLayoutEffect(() => { const { pos, look } = camAt(f); camera.position.copy(pos); camera.lookAt(look); }, [f, camera]);
  return null;
};

const clayAt = (f: number): ClayState => {
  const { pos } = camAt(f); const toCam = Math.atan2(pos.x, pos.z);
  const k = itemAt(f), s = k >= 0 ? ITEMS[k] : null;
  const st: ClayState = { pos: [0, 0.5, 0.05], s: 0.85, ry: toCam * 0.6, blink: f % 83 < 4, beret: true, mega: 0, face: "smile" };
  if (k === -1) { st.face = "happy"; st.mega = 0.4 + Math.sin(clamp(f / 40) * Math.PI) * 0.6; }
  if (s) { const name = s.lines[0].words[2]?.[1] ?? s.from; const call = f >= name - 6 && f < name + 14; st.mega = call ? 1 : 0.15; st.face = call ? "wow" : (["focus", "proud", "happy", "smile"] as const)[k % 4]; st.ry = lerp(toCam, stationAngle(k, N) * -0.4 + Math.PI * 0, 0.4); st.look = -Math.sin(stationAngle(k, N)) * 0.8; }
  if (k === -2) { const jump = f >= SNAP && f < SNAP + 24 ? Math.sin(((f - SNAP) / 24) * Math.PI) : 0; st.hop = f >= SNAP ? clamp((f - SNAP) / 24) : 0; st.face = "happy"; st.mega = f < CTA ? 1 - jump : 0.3; st.wave = f >= CTA + 10 ? 0.6 + Math.sin(f / 5) * 0.4 : 0; st.ry = toCam; }
  return st;
};

type Fx = [number, string, number, number?];
const SFX: Fx[] = [
  [0, "swoosh-slow", 0.3],
  ...ITEMS.flatMap((s): Fx[] => { const name = s.lines[0].words[2]?.[1] ?? s.from + 20; return [[s.from - 8, "air-woosh-quick", 0.35], [name - 1, "clap", 0.7, 20], [name + 16, "swoosh-slow", 0.2]]; }),
  [SNAP - 2, "clap", 0.9, 20], [SNAP, "impact-cine-big", 0.4], [SNAP + 2, "sparkle", 0.45],
  [CR.from + 10, "riser-cine", 0.3, 90], [W("credits", 1, "кино") - 4, "impact-cine-big", 0.45],
];

export const SetVideo: React.FC = () => {
  const f = useCurrentFrame(); const ok = useFonts();
  const k = itemAt(f);
  const t0 = (i: number) => (f - ITEMS[i].from) / 30;
  const lift = p(f, CR.from - 4, 40, io);
  const speech = LINES.map((l) => [l.from - 4, l.from + l.dur + 4]);
  const cta = p(f, W("credits", 1, "кино") - 6, 16, backOut);
  const robots: [number, number, number, number][] = [[-2.2, 0, 1.4, 0.5], [2.4, 0, 1.2, -0.6], [-1.6, 0, -1.6, 0.3], [1.8, 0, -1.8, -0.4]];
  // the helper robot walks to the station that is shooting now
  const helper = (() => { if (k < 0) return null; const a = stationAngle(k, N), st = stationPos(k, N); const sd = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)); const goal = st.clone().addScaledVector(sd, 0.95).addScaledVector(new THREE.Vector3(Math.sin(a), 0, -Math.cos(a)), -0.45); return { p: [goal.x, 0, goal.z] as [number, number, number], ry: -a + 0.5 }; })();
  return (
    <AbsoluteFill style={{ background: "#120c0a" }}>
      <Fonts />
      {ok && <ThreeCanvas width={1080} height={1920} shadows camera={{ fov: 58, near: 0.05, far: 200, position: [0, 3.6, 9.5] }} gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}>
        <Cam f={f} />
        <hemisphereLight args={["#ffe2c4", "#26160e", 0.5]} />
        <Stage f={f} />
        <Chair name="CLAWD" />
        <Clay st={clayAt(f)} />
        {CREW.map((it, i) => <Station key={i} it={it} i={i} n={N} t={k === i ? t0(i) : 2.5} on={k === i ? 1 : 0} />)}
        {helper && <Robot p={helper.p} ry={helper.ry} f={f} seed={9} wave={0.7} />}
        {robots.map(([x, y, z, ry], i) => <Robot key={i} p={[x, y, z]} ry={ry} f={f} seed={i * 3} wave={f >= SNAP + 6 ? 1 : k >= 0 && k % robots.length === i ? 0.5 : 0} />)}
        <Credits crew={CREW} t={Math.max(0, (f - CR.from - 20) / 30)} lift={lift} />
        <SlateRig f={f} />
      </ThreeCanvas>}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 60% at 50% 45%, rgba(0,0,0,0) 55%, rgba(10,5,3,0.55) 100%)", pointerEvents: "none" }} />
      {f >= SNAP && f < SNAP + 70 && <svg width={1080} height={1920} style={{ position: "absolute" }}><Particles at={SNAP} x={540} y={900} kind="confetti" n={130} seed={4} life={70} power={1.4} /></svg>}
      {f >= SNAP - 2 && f < CTA && <div style={{ position: "absolute", left: 0, right: 0, top: 230, textAlign: "center", font: "400 150px Russo", color: "#ffd27a", textShadow: "0 0 50px rgba(255,180,80,0.6), 0 8px 30px rgba(0,0,0,0.6)", transform: `scale(${p(f, SNAP - 2, 12, backOut)}) rotate(-4deg)` }}>СНЯТО!</div>}
      {cta > 0 && <div style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center" }}>
        <div style={{ font: "800 54px Inter", color: "#f6e7c8", textShadow: "0 6px 30px rgba(0,0,0,0.7)", opacity: cta }}>хочешь такую команду?</div>
        <div style={{ display: "inline-block", marginTop: 26, font: "400 130px Russo", color: "#1a120e", background: "#d9b25c", borderRadius: 26, padding: "6px 44px", transform: `scale(${cta}) rotate(-2deg)`, boxShadow: "0 0 60px rgba(217,178,92,0.6)" }}>«КИНО»</div>
        <div style={{ font: "800 44px Inter", color: "#f6e7c8", marginTop: 22, opacity: p(f, W("credits", 1, "кино") + 10, 10), textShadow: "0 6px 30px rgba(0,0,0,0.7)" }}>пиши в комментариях</div>
      </div>}
      <Captions f={f} />
      <Grain f={f} o={0.05} />
      <Audio src={staticFile("music.mp3")} volume={(fr) => (fr > TL.total - 14 ? interpolate(fr, [TL.total - 14, TL.total], [0.3, 0]) : speech.some(([a, b]) => fr >= a && fr <= b) ? 0.12 : 0.3)} />
      {LINES.map((l) => <Sequence key={l.file} from={Math.max(0, l.from - Math.round(l.lead * 30))}><Audio src={staticFile(l.file)} /></Sequence>)}
      {SFX.map(([at, n, v, len], i) => <Sequence key={i} from={Math.max(0, Math.round(at))} durationInFrames={len ?? 80}><Audio src={staticFile(`sfx/${n}.mp3`)} volume={v} /></Sequence>)}
    </AbsoluteFill>
  );
};
