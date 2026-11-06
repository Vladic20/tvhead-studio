// The tower: an elevator cabin that rides past six studio floors to a sunset roof. World units are metres.
import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useCanvasTex, useImgTex, rr } from "./tex";
import { rand, clamp } from "../lib";

export const H = 4;                 // floor pitch
export const ROOM_H = 3.4;
export const FLOORS = ["L", "01", "02", "03", "04", "05", "06", "R"];
export const TITLES = ["Лобби", "Сценарий", "Голос", "Моушн", "3D", "Проверка", "Рендер", "Крыша"];
const GOLD = "#d9b25c";

// ── shared materials
export const M = {
  woodDk: new THREE.MeshStandardMaterial({ color: "#4a2a1c", roughness: 0.55 }),
  wood: new THREE.MeshStandardMaterial({ color: "#7a4a30", roughness: 0.5 }),
  cream: new THREE.MeshStandardMaterial({ color: "#e8d6b8", roughness: 0.85 }),
  brass: new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.85, roughness: 0.3, emissive: "#3a2a08", emissiveIntensity: 0.4 }),
  glass: new THREE.MeshStandardMaterial({ color: "#dfeeff", transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.1, depthWrite: false }),
  concrete: new THREE.MeshStandardMaterial({ color: "#3b3532", roughness: 0.95 }),
  dark: new THREE.MeshStandardMaterial({ color: "#1d1716", roughness: 0.8 }),
  screenFrame: new THREE.MeshStandardMaterial({ color: "#16141a", roughness: 0.4, metalness: 0.3 }),
  pot: new THREE.MeshStandardMaterial({ color: "#b8583a", roughness: 0.7 }),
  leaf: new THREE.MeshStandardMaterial({ color: "#3f7a3a", roughness: 0.8 }),
};
export const B: React.FC<{ p: [number, number, number]; s: [number, number, number]; m: THREE.Material; shadow?: boolean }> = ({ p, s, m, shadow }) =>
  <mesh position={p} material={m} castShadow={shadow} receiveShadow><boxGeometry args={s} /></mesh>;

// additive halo: fake bloom (postprocessing does not render inside Remotion's ThreeCanvas)
let haloTex: THREE.CanvasTexture | null = null;
const halo = () => { if (haloTex) return haloTex; const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d")!; const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.45)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); haloTex = new THREE.CanvasTexture(c); return haloTex; };
export const Glow: React.FC<{ p: [number, number, number]; s: number; color: string; o?: number }> = ({ p, s, color, o = 0.6 }) =>
  <sprite position={p} scale={[s, s, 1]}><spriteMaterial map={halo()} color={color} transparent opacity={o} blending={THREE.AdditiveBlending} depthWrite={false} /></sprite>;

// a screen on a wall facing the cabin (−z)
export const Screen: React.FC<{ p: [number, number, number]; w: number; h: number; tex: THREE.Texture | null; glow?: number }> = ({ p, w, h, tex, glow = 1.2 }) => (
  <group position={p} rotation={[0, Math.PI, 0]}>
    <mesh position={[0, 0, -0.04]} material={M.screenFrame}><boxGeometry args={[w + 0.16, h + 0.16, 0.06]} /></mesh>
    <mesh><planeGeometry args={[w, h]} /><meshStandardMaterial map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={glow} roughness={0.4} toneMapped={false} /></mesh>
    <Glow p={[0, 0, -0.3]} s={Math.max(w, h) * 1.8} color="#ffd9b0" o={0.18} />
  </group>
);
export const Plant: React.FC<{ p: [number, number, number]; s?: number }> = ({ p, s = 1 }) => (
  <group position={p} scale={s}>
    <mesh material={M.pot} position={[0, 0.25, 0]} castShadow><cylinderGeometry args={[0.22, 0.17, 0.5, 20]} /></mesh>
    {[[0, 0.75, 0, 0.34], [0.15, 0.95, 0.05, 0.26], [-0.14, 0.9, -0.05, 0.24]].map(([x, y, z, r], i) => <mesh key={i} material={M.leaf} position={[x, y, z]} castShadow><icosahedronGeometry args={[r, 1]} /></mesh>)}
  </group>
);

// ── the cabin (local: floor at y = 0, camera looks +z at the doors)
export const Cabin: React.FC<{ y: number; open: number; label: string; moving: number; f: number }> = ({ y, open, label, moving, f }) => {
  const sign = useCanvasTex(1024, 288, (g, w, h) => {
    g.fillStyle = "#120d0b"; rr(g, 0, 0, w, h, 26); g.fill(); g.strokeStyle = GOLD; g.lineWidth = 10; rr(g, 8, 8, w - 16, h - 16, 20); g.stroke();
    const [num, title] = label.split("|");
    g.fillStyle = "#f6e7c8"; g.font = "400 150px Russo"; g.textBaseline = "middle"; g.textAlign = "left";
    const arrow = moving > 0.05 ? "▲" : ""; g.fillText(arrow + num, 50, h / 2 + 8);
    if (num !== "L" && num !== "R") { const wNum = g.measureText(arrow + num).width; g.font = "400 60px Russo"; g.fillStyle = "#c9b28a"; g.fillText("/06", 60 + wNum, h / 2 + 40); }
    g.textAlign = "right"; g.font = "800 92px Inter"; g.fillStyle = GOLD; g.fillText(title, w - 54, h / 2 + 6);
  }, [label, moving > 0.05]);
  const doorX = 0.42 + open * 0.8;
  return (
    <group position={[0, y, 0]}>
      <B p={[0, -0.03, -0.75]} s={[2.6, 0.06, 3.7]} m={M.woodDk} />
      <B p={[0, 2.93, -0.75]} s={[2.6, 0.06, 3.7]} m={M.cream} />
      <mesh position={[0, 2.89, -0.6]}><boxGeometry args={[1.5, 0.02, 0.8]} /><meshStandardMaterial color="#fff2d8" emissive="#ffe2b0" emissiveIntensity={0.9} /></mesh>
      {[-1, 1].map((k) => <group key={k}>
        <B p={[k * 1.32, 0.55, -0.75]} s={[0.04, 1.1, 3.7]} m={M.wood} />
        <B p={[k * 1.32, 2.0, -0.75]} s={[0.04, 1.8, 3.7]} m={M.cream} />
        <B p={[k * 1.29, 1.12, -0.75]} s={[0.04, 0.05, 3.7]} m={M.brass} />
        <B p={[k * 1.29, 0.96, -0.75]} s={[0.05, 0.05, 3.7]} m={M.brass} />
      </group>)}
      <B p={[0, 1.45, -2.62]} s={[2.6, 2.9, 0.04]} m={M.wood} />
      {/* front wall around the door opening */}
      <B p={[-1.06, 1.45, 1.1]} s={[0.52, 2.9, 0.08]} m={M.woodDk} />
      <B p={[1.06, 1.45, 1.1]} s={[0.52, 2.9, 0.08]} m={M.woodDk} />
      <B p={[0, 2.62, 1.1]} s={[1.6, 0.56, 0.08]} m={M.woodDk} />
      <B p={[0, 2.33, 1.06]} s={[1.66, 0.05, 0.04]} m={M.brass} />
      <mesh position={[0, 2.62, 1.05]} rotation={[0, Math.PI, 0]}><planeGeometry args={[1.5, 0.42]} /><meshStandardMaterial map={sign} emissiveMap={sign} emissive="#ffffff" emissiveIntensity={0.9} /></mesh>
      {/* call buttons */}
      <mesh position={[0.98, 1.2, 1.05]} rotation={[0, Math.PI, 0]}><circleGeometry args={[0.05, 20]} /><meshStandardMaterial color="#ffd27a" emissive="#ffb030" emissiveIntensity={moving > 0.05 ? 3 : 0.6} /></mesh>
      {/* sliding glass doors */}
      {[-1, 1].map((k) => <group key={k} position={[k * doorX, 1.16, 1.17]}>
        <mesh material={M.glass}><boxGeometry args={[0.8, 2.3, 0.02]} /></mesh>
        <B p={[0, 1.13, 0]} s={[0.82, 0.04, 0.04]} m={M.brass} /><B p={[0, -1.13, 0]} s={[0.82, 0.04, 0.04]} m={M.brass} />
        <B p={[-0.39, 0, 0]} s={[0.04, 2.3, 0.04]} m={M.brass} /><B p={[0.39, 0, 0]} s={[0.04, 2.3, 0.04]} m={M.brass} />
        <B p={[0, 0.05, 0]} s={[0.8, 0.025, 0.03]} m={M.brass} />
      </group>)}
      <pointLight position={[0, 2.6, -0.4]} intensity={6} distance={8} decay={2} color="#ffd9a8" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.002} />
    </group>
  );
};

// ── a room shell with an opening toward the shaft; children are the room's props (room-local coords)
const Room: React.FC<{ k: number; floor: THREE.Material; wall: THREE.Material; light?: string; children?: React.ReactNode; roof?: boolean }> = ({ k, floor, wall, light = "#ffcf9a", children, roof }) => (
  <group position={[0, k * H, 0]}>
    <mesh position={[0, -0.02, 4.6]} material={floor} receiveShadow><boxGeometry args={[9.4, 0.04, 6.8]} /></mesh>
    {!roof && <>
      <B p={[0, ROOM_H, 4.6]} s={[9.4, 0.06, 6.8]} m={M.cream} />
      <mesh position={[0, ROOM_H / 2, 7.98]} material={wall} receiveShadow><boxGeometry args={[9.4, ROOM_H, 0.04]} /></mesh>
      <B p={[-4.7, ROOM_H / 2, 4.6]} s={[0.04, ROOM_H, 6.8]} m={wall} /><B p={[4.7, ROOM_H / 2, 4.6]} s={[0.04, ROOM_H, 6.8]} m={wall} />
      <pointLight position={[0, ROOM_H - 0.3, 4.4]} intensity={22} distance={12} decay={2} color={light} />
      <pointLight position={[-2.5, 2.2, 6.5]} intensity={6} distance={7} decay={2} color={light} />
    </>}
    {/* shaft-side wall with the door opening */}
    <B p={[-2.9, 1.7, 1.24]} s={[4.0, 3.4, 0.06]} m={M.woodDk} /><B p={[2.9, 1.7, 1.24]} s={[4.0, 3.4, 0.06]} m={M.woodDk} />
    <B p={[0, 2.95, 1.24]} s={[1.8, 0.9, 0.06]} m={M.woodDk} />
    <B p={[0, 2.42, 1.2]} s={[1.84, 0.05, 0.04]} m={M.brass} />
    {/* slab between this floor and the next one, seen while riding */}
    {!roof && <B p={[0, ROOM_H + (H - ROOM_H) / 2, 1.24]} s={[9.4, H - ROOM_H, 0.06]} m={M.concrete} />}
    {children}
  </group>
);

const useMat = (draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, w = 512, h = 512, rep = 1, opts: THREE.MeshStandardMaterialParameters = {}) => {
  const t = useCanvasTex(w, h, draw, []);
  return useMemo(() => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, ...opts }); }, [t]); // eslint-disable-line
};

// ── floors
const Lobby: React.FC<{ f: number }> = () => {
  const checker = useMat((g, w) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? "#f1e6d2" : "#2a201c"; g.fillRect(i * w / 8, j * w / 8, w / 8, w / 8); } }, 512, 512, 3, { roughness: 0.35 });
  const wall = useMat((g, w, h) => { g.fillStyle = "#c98f63"; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(0,0,0,0.08)"; for (let i = 0; i < w; i += 32) g.fillRect(i, 0, 3, h); }, 512, 512);
  const logo = useCanvasTex(1400, 360, (g, w, h) => { g.fillStyle = "#1a120e"; rr(g, 0, 0, w, h, 30); g.fill(); g.strokeStyle = GOLD; g.lineWidth = 12; rr(g, 12, 12, w - 24, h - 24, 22); g.stroke(); g.fillStyle = GOLD; g.font = "400 150px Russo"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("БАШНЯ КЛОДА", w / 2, h / 2 - 10); g.font = "800 46px Inter"; g.fillStyle = "#e8d6b8"; g.fillText("студия роликов · 6 этажей", w / 2, h / 2 + 105); }, []);
  return <Room k={0} floor={checker} wall={wall}>
    <Screen p={[0, 2.25, 7.9]} w={3.4} h={0.875} tex={logo} glow={0.7} />
    <mesh position={[0.9, 0.55, 5.6]} material={M.wood} castShadow receiveShadow><boxGeometry args={[2.6, 1.1, 0.8]} /></mesh>
    <B p={[0.9, 1.12, 5.6]} s={[2.7, 0.05, 0.9]} m={M.brass} />
    <Plant p={[-2.6, 0, 6.6]} s={1.4} /><Plant p={[3.2, 0, 6.8]} s={1.2} />
    <mesh position={[-1.4, 0.005, 3.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[2.2, 3.4]} /><meshStandardMaterial color="#9a2a24" roughness={0.9} /></mesh>
  </Room>;
};

const SCRIPT = ["> сделай ролик про студию", "", "01  Лобби — знакомство", "02  Сценарий", "03  Голос", "04  Моушн", "05  3D", "06  Проверка · Рендер"];
const Script: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const n = clamp((f - at) / 70) * SCRIPT.join("").length;
  const scr = useCanvasTex(1024, 600, (g, w, h) => {
    g.fillStyle = "#121318"; g.fillRect(0, 0, w, h); g.fillStyle = "#E07A52"; g.font = "700 44px Mono"; g.fillText("✻ Claude Code", 40, 70);
    let left = n; g.font = "700 40px Mono";
    SCRIPT.forEach((l, i) => { const s = l.slice(0, Math.max(0, Math.min(l.length, left))); left -= l.length; g.fillStyle = i === 0 ? "#f4efe8" : "#e8c9a0"; g.fillText(s, 40, 150 + i * 56); });
    if (f % 20 < 10) { g.fillStyle = "#E07A52"; g.fillRect(40, 520, 22, 40); }
  }, [Math.floor(n), f % 20 < 10]);
  const wall = useMat((g, w, h) => { g.fillStyle = "#3d5a4f"; g.fillRect(0, 0, w, h); }, 64, 64);
  const floor = useMat((g, w, h) => { g.fillStyle = "#8a5a3a"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineWidth = 3; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); } }, 512, 512, 3);
  return <Room k={1} floor={floor} wall={wall}>
    <Screen p={[0.3, 1.85, 7.9]} w={3.6} h={2.1} tex={scr} />
    <B p={[-2.2, 0.75, 6.4]} s={[1.8, 0.06, 0.9]} m={M.wood} shadow />
    {[-2.95, -1.45].map((x) => <B key={x} p={[x, 0.37, 6.4]} s={[0.06, 0.74, 0.8]} m={M.woodDk} />)}
    {/* bookshelf */}
    <B p={[3.4, 1.2, 7.4]} s={[1.6, 2.4, 0.5]} m={M.woodDk} shadow />
    {Array.from({ length: 18 }, (_, i) => <B key={i} p={[2.75 + (i % 9) * 0.15, 0.55 + Math.floor(i / 9) * 0.8, 7.2]} s={[0.12, 0.5 + rand(i) * 0.15, 0.3]} m={new THREE.MeshStandardMaterial({ color: ["#c44", "#3a7", "#36b", "#db4", "#a5c"][i % 5], roughness: 0.7 })} />)}
    <Plant p={[-3.6, 0, 7.2]} />
  </Room>;
};

const Voice: React.FC<{ f: number; words: number[] }> = ({ f, words }) => {
  const last = [...words].reverse().find((t) => f >= t) ?? -99, pulse = Math.exp(-(f - last) / 5);
  const scr = useCanvasTex(1024, 600, (g, w, h) => {
    g.fillStyle = "#0f1420"; g.fillRect(0, 0, w, h); g.fillStyle = "#7db7ff"; g.font = "700 40px Mono"; g.fillText("voice · fish s2.1 free", 40, 64);
    for (let i = 0; i < 40; i++) { const on = words[i] !== undefined && f >= words[i]; const a = 30 + rand(i * 7) * 200 * (on ? 1 : 0.2) * (0.7 + 0.3 * Math.sin(f / 3 + i)); g.fillStyle = on ? "#E07A52" : "#2c3650"; rr(g, 40 + i * 24, 320 - a / 2, 14, a, 7); g.fill(); }
    g.fillStyle = "#e8d6b8"; g.font = "700 34px Mono"; g.fillText(`${words.filter((t) => f >= t).length} слов · тайминг каждого`, 40, 540);
  }, [f]);
  const foam = useMat((g, w, h) => { g.fillStyle = "#2b2e3a"; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const gr = g.createLinearGradient(i * 64, j * 64, i * 64 + 64, j * 64 + 64); gr.addColorStop(0, "#3c4152"); gr.addColorStop(1, "#1c1f28"); g.fillStyle = gr; g.fillRect(i * 64 + 3, j * 64 + 3, 58, 58); } }, 512, 512, 2);
  return <Room k={2} floor={M.woodDk} wall={foam} light="#ffd2b0">
    <Screen p={[1.2, 1.85, 7.9]} w={3.4} h={2.0} tex={scr} />
    <group position={[-1.6, 0, 5.2]}>
      <mesh material={M.dark} position={[0, 0.02, 0]}><cylinderGeometry args={[0.35, 0.4, 0.04, 24]} /></mesh>
      <mesh material={M.dark} position={[0, 0.75, 0]} castShadow><cylinderGeometry args={[0.03, 0.03, 1.5, 12]} /></mesh>
      <mesh position={[0, 1.62, 0]} castShadow><capsuleGeometry args={[0.13, 0.25, 8, 16]} /><meshStandardMaterial color="#cfd3dc" metalness={0.8} roughness={0.25} emissive="#E07A52" emissiveIntensity={pulse * 1.5} /></mesh>
    </group>
  </Room>;
};

const Motion: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const t = (f - at) / 30;
  const scr = useCanvasTex(1024, 600, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, `hsl(${(t * 60) % 360},70%,25%)`); gr.addColorStop(1, `hsl(${(t * 60 + 120) % 360},70%,40%)`); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.textAlign = "center"; g.textBaseline = "middle"; g.font = "400 150px Russo";
    [..."МОУШН"].forEach((ch, i) => { const y = h / 2 + Math.sin(t * 6 + i * 0.8) * 50; g.fillStyle = i % 2 ? "#ffd27a" : "#ffffff"; g.save(); g.translate(170 + i * 170, y); g.rotate(Math.sin(t * 4 + i) * 0.25); g.fillText(ch, 0, 0); g.restore(); });
  }, [f]);
  return <Room k={3} floor={M.dark} wall={M.dark} light="#b8a0ff">
    <Screen p={[0, 1.85, 7.9]} w={3.8} h={2.2} tex={scr} glow={1.4} />
    <mesh position={[2.4, 1.6, 5.4]} rotation={[t * 0.8, t * 1.2, 0]} castShadow><torusKnotGeometry args={[0.38, 0.12, 120, 16]} /><meshStandardMaterial color="#7db7ff" emissive="#3c6dff" emissiveIntensity={1.6} roughness={0.3} /></mesh>
    {Array.from({ length: 40 }, (_, i) => { const a = rand(i) * Math.PI * 2, r = 1 + rand(i * 3) * 3; const y = 0.4 + ((rand(i * 5) * 3 + t * (0.2 + rand(i) * 0.4)) % 3);
      return <mesh key={i} position={[Math.cos(a + t * 0.3) * r * 0.8, y, 5 + Math.sin(a + t * 0.3) * r * 0.5]}><sphereGeometry args={[0.035 + rand(i * 9) * 0.04, 10, 10]} /><meshBasicMaterial color={["#ffd27a", "#ff8a5c", "#7db7ff", "#c7a0ff"][i % 4]} /></mesh>; })}
  </Room>;
};

import { VOXELS } from "../Mascot3D";
const Voxels: React.FC<{ ry: number }> = ({ ry }) => {
  const ref = React.useRef<THREE.InstancedMesh>(null); const geo = useMemo(() => new THREE.BoxGeometry(0.9, 0.9, 0.9), []);
  useLayoutEffect(() => { const o = new THREE.Object3D(); VOXELS.forEach((v, i) => { o.position.set(v.x, v.y, v.z); o.updateMatrix(); ref.current!.setMatrixAt(i, o.matrix); ref.current!.setColorAt(i, v.col); }); ref.current!.instanceMatrix.needsUpdate = true; }, []);
  return <group rotation={[0, ry, 0]} scale={0.055}><instancedMesh ref={ref} args={[geo, undefined, VOXELS.length]} castShadow><meshStandardMaterial roughness={0.5} /></instancedMesh></group>;
};
const ThreeD: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const t = (f - at) / 30;
  const scr = useCanvasTex(1024, 600, (g, w, h) => {
    g.fillStyle = "#14110f"; g.fillRect(0, 0, w, h); g.font = "700 38px Mono"; g.fillStyle = "#E07A52"; g.fillText("three.js · blender", 40, 64);
    ["const tower = new Group()", "floors.forEach(addRoom)", "clawd.position.y = lift(t)", `turntable.rotation.y = ${(t * 0.9).toFixed(2)}`, "renderer.render(scene)"].forEach((l, i) => { g.fillStyle = i === 3 ? "#ffd27a" : "#e8d6b8"; g.fillText(l, 40, 150 + i * 62); });
  }, [Math.floor(f / 2)]);
  return <Room k={4} floor={M.concrete} wall={M.wood} light="#ffd0a0">
    <Screen p={[2.0, 1.9, 7.9]} w={3.0} h={1.75} tex={scr} />
    <gridHelper args={[8, 32, "#E07A52", "#5a4a40"]} position={[0, 0.01, 4.6]} />
    <group position={[-0.9, 0, 5.0]}>
      <mesh material={M.dark} position={[0, 0.15, 0]} castShadow receiveShadow><cylinderGeometry args={[1.0, 1.05, 0.3, 40]} /></mesh>
      <mesh position={[0, 0.31, 0]}><torusGeometry args={[1.0, 0.025, 8, 60]} /><meshStandardMaterial color="#E07A52" emissive="#E07A52" emissiveIntensity={2} /></mesh>
      <group position={[0, 1.0, 0]}><Voxels ry={t * 0.9} /></group>
    </group>
    {/* robot arm */}
    <group position={[1.8, 0, 4.2]}>
      <mesh material={M.dark} position={[0, 0.1, 0]}><cylinderGeometry args={[0.3, 0.35, 0.2, 20]} /></mesh>
      <group rotation={[0, Math.sin(t) * 0.6, 0]}><mesh position={[0, 0.7, 0]} castShadow><cylinderGeometry args={[0.08, 0.1, 1.2, 16]} /><meshStandardMaterial color="#f2a23a" roughness={0.4} /></mesh>
        <group position={[0, 1.3, 0]} rotation={[0, 0, 1.1 + Math.sin(t * 1.4) * 0.2]}><mesh position={[0, 0.5, 0]} castShadow><cylinderGeometry args={[0.06, 0.07, 1.0, 16]} /><meshStandardMaterial color="#f2a23a" roughness={0.4} /></mesh><mesh position={[0, 1.02, 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color="#222" /></mesh></group></group>
    </group>
  </Room>;
};

const Check: React.FC<{ f: number; ring: number; fixed: number }> = ({ ring, fixed }) => {
  const imgs = [1, 2, 3, 4, 5, 6].map((i) => useImgTex(`sheet/s${i === 5 && fixed > 0.5 ? "5f" : i}.png`)); // eslint-disable-line
  const ringTex = useCanvasTex(300, 500, (g, w, h) => { if (ring <= 0) return; g.strokeStyle = "#ff4a3d"; g.lineWidth = 14; g.lineCap = "round"; g.beginPath(); g.ellipse(w / 2, h / 2, w / 2 - 14, h / 2 - 14, -0.1, -1.8, -1.8 + Math.PI * 2.2 * ring); g.stroke(); }, [Math.round(ring * 20)]);
  const wall = useMat((g, w, h) => { g.fillStyle = "#e8d6b8"; g.fillRect(0, 0, w, h); }, 32, 32);
  const stamp = useCanvasTex(800, 200, (g, w, h) => { g.fillStyle = "#4fd38a"; rr(g, 0, 0, w, h, 28); g.fill(); g.fillStyle = "#0f2a1a"; g.font = "400 120px Russo"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("ИСПРАВЛЕНО", w / 2, h / 2 + 6); }, []);
  return <Room k={5} floor={M.wood} wall={wall}>
    <B p={[0.4, 1.75, 7.9]} s={[4.2, 2.6, 0.06]} m={new THREE.MeshStandardMaterial({ color: "#b07a4a", roughness: 0.9 })} />
    {imgs.map((t, i) => t && <mesh key={`${i}-${t.uuid}`} position={[0.4 + 1.3 - (i % 3) * 1.3, 2.4 - Math.floor(i / 3) * 1.25, 7.85]} rotation={[0, Math.PI, 0]}><planeGeometry args={[0.66, 1.17]} /><meshStandardMaterial map={t} emissiveMap={t} emissive="#fff" emissiveIntensity={0.55} /></mesh>)}
    <mesh position={[0.4, 1.15, 7.83]} rotation={[0, Math.PI, 0]}><planeGeometry args={[0.95, 1.55]} /><meshBasicMaterial map={ringTex} transparent opacity={1 - fixed} depthWrite={false} /></mesh>
    {fixed > 0 && <mesh position={[0.4, 0.42, 7.82]} rotation={[0, Math.PI, -0.08]} scale={0.6 + 0.4 * fixed}><planeGeometry args={[1.6, 0.4]} /><meshBasicMaterial map={stamp} transparent opacity={fixed} depthWrite={false} toneMapped={false} /></mesh>}
    <Plant p={[-3.4, 0, 7.0]} s={1.2} />
  </Room>;
};

const Render: React.FC<{ f: number; pr: number; total: number }> = ({ f, pr, total }) => {
  const scr = useCanvasTex(1024, 600, (g, w, h) => {
    g.fillStyle = "#0d0c10"; g.fillRect(0, 0, w, h); g.fillStyle = "#e8d6b8"; g.font = "700 46px Mono"; g.fillText(`render ${Math.round(pr * 100)}%`, 40, 80);
    g.fillStyle = "#2a2730"; rr(g, 40, 130, w - 80, 40, 20); g.fill(); g.fillStyle = "#E07A52"; rr(g, 40, 130, (w - 80) * pr, 40, 20); g.fill();
    g.fillStyle = "#c9b28a"; g.font = "700 38px Mono"; g.fillText(`кадр ${Math.round(total * pr)} / ${total}`, 40, 240);
    for (let i = 0; i < 9; i++) { g.fillStyle = i / 9 < pr ? "#E07A52" : "#2a2730"; rr(g, 40 + i * 106, 300, 92, 160, 10); g.fill(); g.fillStyle = "#0d0c10"; for (let k = 0; k < 4; k++) { g.fillRect(48 + i * 106, 308 + k * 40, 10, 18); g.fillRect(118 + i * 106, 308 + k * 40, 10, 18); } }
    if (pr >= 1) { g.fillStyle = "#4fd38a"; g.font = "800 50px Inter"; g.fillText("✓ claude-tower.mp4", 40, 540); }
  }, [Math.round(pr * 200), pr >= 1]);
  const box = useCanvasTex(256, 256, (g, w, h) => { g.fillStyle = "#c49a64"; g.fillRect(0, 0, w, h); g.fillStyle = "#3a2a1a"; g.font = "400 84px Russo"; g.textAlign = "center"; g.fillText("MP4", w / 2, h / 2 + 30); }, []);
  const boxGeo = useMemo(() => new RoundedBoxGeometry(0.9, 0.7, 0.7, 3, 0.04), []);
  return <Room k={6} floor={M.woodDk} wall={M.dark} light="#ffc890">
    <Screen p={[0, 1.9, 7.9]} w={3.6} h={2.1} tex={scr} />
    <mesh geometry={boxGeo} position={[1.6, 0.35 + (1 - clamp(pr * 1.2)) * 0, 4.2]} rotation={[0, -0.3, 0]} castShadow><meshStandardMaterial map={box} roughness={0.85} /></mesh>
    <group position={[-2.4, 1.1, 4.4]} rotation={[0, 0.7, 0]}>
      <mesh material={M.dark} castShadow><boxGeometry args={[0.6, 0.5, 0.8]} /></mesh>
      {[-0.25, 0.25].map((z) => <mesh key={z} position={[0, 0.45, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.25, 0.25, 0.08, 24]} /><meshStandardMaterial color="#333" metalness={0.6} roughness={0.3} /></mesh>)}
    </group>
  </Room>;
};

const Roof: React.FC<{ f: number }> = ({ f }) => {
  const shot = useImgTex("sheet/s3.png");
  const play = useCanvasTex(512, 512, (g, w, h) => { g.fillStyle = "rgba(0,0,0,0.35)"; g.beginPath(); g.arc(w / 2, h / 2, 140, 0, Math.PI * 2); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.moveTo(w / 2 - 40, h / 2 - 70); g.lineTo(w / 2 + 75, h / 2); g.lineTo(w / 2 - 40, h / 2 + 70); g.closePath(); g.fill(); }, []);
  return <Room k={7} floor={M.wood} wall={M.wood} roof>
    {[-4.6, 4.6].map((x) => <B key={x} p={[x, 0.55, 4.6]} s={[0.06, 0.06, 6.8]} m={M.brass} />)}
    <B p={[0, 0.55, 8.0]} s={[9.2, 0.06, 0.06]} m={M.brass} />
    {Array.from({ length: 13 }, (_, i) => <B key={i} p={[-4.6 + i * 0.766, 0.28, 8.0]} s={[0.04, 0.56, 0.04]} m={M.brass} />)}
    {Array.from({ length: 16 }, (_, i) => { const x = -4.3 + i * 0.57, sag = Math.sin((i / 15) * Math.PI) * 0.5;
      return <mesh key={i} position={[x, 3.0 - sag, 6.6]}><sphereGeometry args={[0.06, 10, 10]} /><meshStandardMaterial color="#fff1c8" emissive="#ffcf70" emissiveIntensity={3 + Math.sin(f / 6 + i) * 0.8} /></mesh>; })}
    {Array.from({ length: 16 }, (_, i) => <Glow key={i} p={[-4.3 + i * 0.57, 3.0 - Math.sin((i / 15) * Math.PI) * 0.5, 6.6]} s={0.7} color="#ffcf70" o={0.55} />)}
    <group position={[0.4, 1.9, 7.4]} rotation={[0, Math.PI, 0]}>
      <mesh material={M.screenFrame} position={[0, 0, -0.04]}><boxGeometry args={[1.25, 2.1, 0.06]} /></mesh>
      {shot && <mesh key={shot.uuid}><planeGeometry args={[1.12, 1.98]} /><meshStandardMaterial map={shot} emissiveMap={shot} emissive="#fff" emissiveIntensity={0.9} /></mesh>}
      <mesh position={[0, 0, 0.01]}><planeGeometry args={[0.8, 0.8]} /><meshBasicMaterial map={play} transparent depthWrite={false} /></mesh>
    </group>
    <B p={[0.4, 0.45, 7.4]} s={[0.1, 0.9, 0.1]} m={M.dark} />
    <pointLight position={[0, 2.6, 5]} intensity={12} distance={10} decay={2} color="#ffbf80" />
    <Plant p={[-3.6, 0, 7.2]} s={1.3} /><Plant p={[3.8, 0, 3.0]} s={1.1} />
  </Room>;
};

// ── outside: facade with lit windows, sky, ground, hills
export const Outside: React.FC = () => {
  const sky = useCanvasTex(16, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#1c1430"); gr.addColorStop(0.42, "#5b3150"); gr.addColorStop(0.5, "#c4675a"); gr.addColorStop(0.53, "#f2a65a"); gr.addColorStop(0.56, "#3a2230"); gr.addColorStop(1, "#140e12"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, []);
  const facade = useCanvasTex(512, 1400, (g, w, h) => {
    g.fillStyle = "#3a2a24"; g.fillRect(0, 0, w, h); const fh = h / 7;
    for (let k = 0; k < 7; k++) { g.fillStyle = "#2a1e1a"; g.fillRect(0, k * fh, w, 10); for (let i = 0; i < 4; i++) { const lit = rand(k * 7 + i) > 0.15; g.fillStyle = lit ? ["#ffd9a0", "#ffc27a", "#ffe8c0"][(k + i) % 3] : "#4a3a34"; g.fillRect(30 + i * 122, k * fh + 40, 92, fh - 80); } }
  }, []);
  return <>
    <mesh><sphereGeometry args={[400, 32, 16]} /><meshBasicMaterial map={sky} side={THREE.BackSide} depthWrite={false} /></mesh>
    <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[600, 600]} /><meshStandardMaterial color="#1c1416" roughness={1} /></mesh>
    {[[-60, -140, 70], [40, -170, 90], [130, -150, 60], [-150, -120, 50]].map(([x, z, r], i) => <mesh key={i} position={[x, -r * 0.62, z]} scale={[1.6, 1, 1]}><sphereGeometry args={[r, 32, 16]} /><meshBasicMaterial color="#26182a" /></mesh>)}
    {/* tower shell (invisible from inside: front faces only) */}
    <mesh position={[0, H * 3.5, 2.5]}><boxGeometry args={[9.6, H * 7, 11.2]} /><meshStandardMaterial color="#3a2a24" roughness={0.9} /></mesh>
    <mesh position={[0, H * 3.5, 8.11]}><planeGeometry args={[9.6, H * 7]} /><meshStandardMaterial map={facade} emissiveMap={facade} emissive="#ffffff" emissiveIntensity={1.1} toneMapped={false} /></mesh>
    <Glow p={[0, H * 3.5, 9]} s={40} color="#ffb070" o={0.22} />
    {Array.from({ length: 10 }, (_, i) => <mesh key={i} position={[-20 + rand(i) * 40, 0.5, 14 + rand(i * 3) * 20]}><coneGeometry args={[0.7 + rand(i) * 0.6, 2.2 + rand(i * 2) * 1.5, 7]} /><meshStandardMaterial color="#1a2a1c" /></mesh>)}
  </>;
};

export const Floors: React.FC<{ f: number; near: number; data: { at: number[]; words: number[]; ring: number; fixed: number; pr: number; total: number } }> = ({ f, near, data }) => {
  const show = (k: number) => Math.abs(k - near) <= 1.2;
  return <>
    {show(0) && <Lobby f={f} />}
    {show(1) && <Script f={f} at={data.at[1]} />}
    {show(2) && <Voice f={f} words={data.words} />}
    {show(3) && <Motion f={f} at={data.at[3]} />}
    {show(4) && <ThreeD f={f} at={data.at[4]} />}
    {show(5) && <Check f={f} ring={data.ring} fixed={data.fixed} />}
    {show(6) && <Render f={f} pr={data.pr} total={data.total} />}
    <Roof f={f} />
  </>;
};

// world goes wireframe for the «тоже код» beat
export const Wire: React.FC<{ on: boolean }> = ({ on }) => {
  const { scene } = useThree();
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#E07A52", wireframe: true }), []);
  useLayoutEffect(() => { scene.overrideMaterial = on ? mat : null; }, [on]); // eslint-disable-line
  return null;
};
