// Clawd-style clay mascot: rounded body, nub arms, four stubby legs, a drawn face with expressions.
import React, { useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useCanvasTex } from "./tex";

export type Face = "smile" | "happy" | "wow" | "wink" | "focus" | "proud";
export type ClayState = {
  pos: [number, number, number]; ry?: number; s?: number;
  face?: Face; blink?: boolean; talk?: number;   // talk 0..1 opens the mouth
  hop?: number; wave?: number; walk?: number;    // hop 0..1, wave 0..1 raises the right arm, walk = leg phase
  look?: number;                                  // -1..1 eyes left/right
  phones?: boolean; glass?: boolean;              // accessories
  beret?: boolean; mega?: number;                 // director beret; megaphone raised 0..1 in the left hand
  toon?: boolean; band?: number;                  // anime: cel shading + black outlines; hachimaki headband (value = wind phase)
  shine?: number;                                 // anime eye sparkle 0..1
};

const CLAY = "#E07A52", CLAY_DK = "#B8583A";
const body = new RoundedBoxGeometry(1.1, 0.86, 0.86, 6, 0.24);
const nub = new RoundedBoxGeometry(0.26, 0.26, 0.3, 4, 0.1);
const leg = new RoundedBoxGeometry(0.2, 0.3, 0.22, 4, 0.08);
// anime: 3-step light ramp for cel shading, and an inverted-hull outline material
export const TOON_RAMP = (() => { const d = new Uint8Array([70, 160, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
export const INK = new THREE.MeshBasicMaterial({ color: "#140b0a", side: THREE.BackSide });

const drawFace = (g: CanvasRenderingContext2D, w: number, h: number, face: Face, blink: boolean, talk: number, look: number) => {
  const ink = "#2a1712"; g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = ink; g.fillStyle = ink;
  const ex = 150, ey = 205, lx = look * 14;
  // blush
  g.fillStyle = "rgba(255,120,110,0.55)"; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(w / 2 + s * 205, 285, 46, 26, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = ink;
  const eye = (s: number) => {
    const x = w / 2 + s * ex + lx;
    if (blink || face === "happy" || (face === "wink" && s > 0)) { g.lineWidth = 16; g.beginPath(); g.arc(x, ey + 14, 30, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); return; }
    if (face === "wow") { g.beginPath(); g.ellipse(x, ey, 26, 34, 0, 0, Math.PI * 2); g.fill(); }
    else { g.beginPath(); g.ellipse(x, ey, 22, 30, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = "#fff"; g.beginPath(); g.arc(x + 8, ey - 11, 8, 0, Math.PI * 2); g.fill(); g.fillStyle = ink;
  };
  eye(-1); eye(1);
  if (face === "focus" || face === "proud") { g.lineWidth = 12; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(w / 2 + s * (ex + 34) + lx, ey - 60 + (face === "focus" ? 0 : -6)); g.lineTo(w / 2 + s * (ex - 26) + lx, ey - 48 + (face === "focus" ? 12 : -10)); g.stroke(); } }
  // mouth
  g.lineWidth = 14; const my = 290;
  if (talk > 0.15 || face === "wow") { const o = face === "wow" ? 1 : talk; g.beginPath(); g.ellipse(w / 2, my, 26 + 10 * o, 14 + 24 * o, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = "#e9686a"; g.beginPath(); g.ellipse(w / 2, my + 10 * o, 16 + 6 * o, 6 + 9 * o, 0, 0, Math.PI * 2); g.fill(); }
  else { g.beginPath(); g.arc(w / 2, my - 26, 40, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
};

export const Clay: React.FC<{ st: ClayState }> = ({ st }) => {
  const { pos, ry = 0, s = 1, face = "smile", blink = false, talk = 0, hop = 0, wave = 0, walk = 0, look = 0, phones, glass, beret, mega = -1, toon, band, shine = 0 } = st;
  const faceTex = useCanvasTex(700, 420, (g, w, h) => { drawFace(g, w, h, face, blink, talk, look); if (shine > 0 && !blink && face !== "happy") { g.fillStyle = `rgba(255,255,255,${shine})`; for (const sx of [-1, 1]) { const x = w / 2 + sx * 150 + look * 14; g.beginPath(); g.arc(x - 8, 196, 11, 0, Math.PI * 2); g.fill(); g.save(); g.translate(x + 10, 178); g.rotate(Math.PI / 4); g.fillRect(-3, -16 * shine, 6, 32 * shine); g.fillRect(-16 * shine, -3, 32 * shine, 6); g.restore(); } } }, [face, blink, Math.round(talk * 6), Math.round(look * 10), Math.round(shine * 8)]);
  const mat = useMemo(() => (toon ? new THREE.MeshToonMaterial({ color: CLAY, gradientMap: TOON_RAMP }) : new THREE.MeshStandardMaterial({ color: CLAY, roughness: 0.62, metalness: 0 })), [toon]);
  const matDk = useMemo(() => (toon ? new THREE.MeshToonMaterial({ color: CLAY_DK, gradientMap: TOON_RAMP }) : new THREE.MeshStandardMaterial({ color: CLAY_DK, roughness: 0.7 })), [toon]);
  const j = Math.sin(hop * Math.PI), sq = 1 - j * 0.08 + (hop > 0.85 ? (1 - hop) * 0.4 : 0);
  return (
    <group position={[pos[0], pos[1] + j * 0.35, pos[2]]} rotation={[0, ry, 0]} scale={s}>
      <group position={[0, 0.58, 0]} scale={[1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq)]}>
        <mesh geometry={body} material={mat} castShadow receiveShadow />
        {toon && <mesh geometry={body} material={INK} scale={1.045} />}
        {band !== undefined && <group position={[0, 0.27, 0]}>
          <mesh><boxGeometry args={[1.16, 0.13, 0.92]} /><meshToonMaterial color="#e8302a" gradientMap={TOON_RAMP} /></mesh>
          {toon && <mesh material={INK} scale={[1.03, 1.25, 1.035]}><boxGeometry args={[1.16, 0.13, 0.92]} /></mesh>}
          {[0, 1].map((k) => <group key={k} position={[0.3 + k * 0.08, 0, -0.47]} rotation={[0.25 + Math.sin(band * 2.3 + k) * 0.25, 0.5 + k * 0.35, Math.sin(band * 3.1 + k * 2) * 0.35]}>
            <mesh position={[0, 0, -0.32]}><boxGeometry args={[0.1, 0.03, 0.64]} /><meshToonMaterial color="#e8302a" gradientMap={TOON_RAMP} /></mesh>
          </group>)}
        </group>}
        <mesh position={[0, 0.02, 0.432]}><planeGeometry args={[0.98, 0.59]} /><meshStandardMaterial map={faceTex} transparent roughness={0.6} depthWrite={false} polygonOffset polygonOffsetFactor={-2} /></mesh>
        <mesh geometry={nub} material={mat} position={[-0.62, -0.06, 0]} castShadow />
        {toon && <mesh geometry={nub} material={INK} position={[-0.62, -0.06, 0]} scale={1.14} />}
        <group position={[0.6, -0.02, 0]} rotation={[0, 0, wave * 1.9 + Math.sin(wave * 18) * 0.25 * wave]}><mesh geometry={nub} material={mat} position={[0.04, 0, 0]} castShadow />{toon && <mesh geometry={nub} material={INK} position={[0.04, 0, 0]} scale={1.14} />}</group>
        {phones && <group position={[0, 0.3, 0]}>
          <mesh rotation={[0, 0, 0]}><torusGeometry args={[0.6, 0.05, 10, 40, Math.PI]} /><meshStandardMaterial color="#2b2b33" roughness={0.4} /></mesh>
          {[-1, 1].map((k) => <mesh key={k} position={[k * 0.6, -0.12, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.16, 0.16, 0.12, 24]} /><meshStandardMaterial color="#3a3a46" roughness={0.35} /></mesh>)}
        </group>}
        {beret && <group position={[0.12, 0.47, -0.02]} rotation={[0.05, 0, -0.18]}>
          <mesh castShadow><cylinderGeometry args={[0.42, 0.46, 0.12, 32]} /><meshStandardMaterial color="#2b1d1a" roughness={0.85} /></mesh>
          <mesh position={[0, 0.09, 0]}><cylinderGeometry args={[0.03, 0.03, 0.08, 10]} /><meshStandardMaterial color="#2b1d1a" /></mesh>
        </group>}
        {mega >= 0 && <group position={[-0.72, -0.02 + mega * 0.25, 0.25]} rotation={[0.2 - mega * 0.5, -0.5, Math.PI / 2 - mega * 0.4]}>
          <mesh castShadow><cylinderGeometry args={[0.24, 0.08, 0.55, 24, 1, true]} /><meshStandardMaterial color="#eeeeee" roughness={0.35} side={THREE.DoubleSide} /></mesh>
          <mesh position={[0, 0.28, 0]}><torusGeometry args={[0.24, 0.025, 8, 32]} /><meshStandardMaterial color="#E07A52" /></mesh>
        </group>}
        {glass && <group position={[0.22, 0.06, 0.47]}>
          <mesh><torusGeometry args={[0.13, 0.022, 10, 32]} /><meshStandardMaterial color="#d9b25c" metalness={0.9} roughness={0.25} /></mesh>
          <mesh><circleGeometry args={[0.12, 28]} /><meshStandardMaterial color="#cfe6ff" transparent opacity={0.35} roughness={0.05} /></mesh>
        </group>}
      </group>
      {[[-0.32, 0.22], [0.32, 0.22], [-0.32, -0.22], [0.32, -0.22]].map(([x, z], i) => {
        const ph = walk + (i % 3 === 0 ? 0 : Math.PI), lift = walk ? Math.max(0, Math.sin(ph)) * 0.08 : 0;
        return <group key={i}><mesh geometry={leg} material={matDk} position={[x, 0.15 + lift, z]} castShadow />{toon && <mesh geometry={leg} material={INK} position={[x, 0.15 + lift, z]} scale={1.14} />}</group>;
      })}
    </group>
  );
};
