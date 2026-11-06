// Film set: director's chair in the middle, a semicircle of tool stations, helper robots, a marquee, a dusk backdrop,
// a 3D clapperboard and a big screen for the end credits. World units are metres; the chair stands at the origin facing +z.
import React, { useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useCanvasTex, rr } from "./tex";
import { B, Glow, M, Plant } from "./World";
import { clamp, rand } from "../lib";

export type CrewItem = { name: string; role: string; repo: string; stars: number };
export const STATION_R = 6.4;
export const stationAngle = (i: number, n: number) => -1.35 + (2.7 * i) / Math.max(1, n - 1);   // radians, behind the chair
export const stationPos = (i: number, n: number) => { const a = stationAngle(i, n); return new THREE.Vector3(Math.sin(a) * STATION_R, 0, -Math.cos(a) * STATION_R); };
export const kStars = (n: number) => (n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n));
const CLAY = "#E07A52";

// ── stage: plank floor, dusk backdrop with hills and a moon, marquee bulbs
export const Stage: React.FC<{ f: number }> = ({ f }) => {
  const planks = useCanvasTex(1024, 1024, (g, w, h) => { for (let i = 0; i < 16; i++) { g.fillStyle = ["#8a5634", "#7d4c2e", "#94603a"][i % 3]; g.fillRect(0, (i * h) / 16, w, h / 16); g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(0, (i * h) / 16, w, 3); for (let k = 0; k < 3; k++) g.fillRect(((rand(i * 3 + k) * w) | 0), (i * h) / 16, 3, h / 16); } }, []);
  const floorMat = useMemo(() => { planks.wrapS = planks.wrapT = THREE.RepeatWrapping; planks.repeat.set(2, 2); return new THREE.MeshStandardMaterial({ map: planks, roughness: 0.55 }); }, [planks]);
  const sky = useCanvasTex(1024, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#160f2a"); gr.addColorStop(0.55, "#6a3a6a"); gr.addColorStop(0.8, "#d9885f"); gr.addColorStop(1, "#f0b070"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = "#fff6e0"; g.beginPath(); g.arc(w * 0.72, h * 0.22, 26, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + rand(i) * 0.6})`; g.fillRect(rand(i * 3) * w, rand(i * 7) * h * 0.5, 2, 2); }
    g.fillStyle = "#2a1830"; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 16) g.lineTo(x, h * 0.78 - Math.sin(x / 90) * 30 - Math.sin(x / 37) * 12); g.lineTo(w, h); g.fill();
  }, []);
  const bulbs = useMemo(() => Array.from({ length: 34 }, (_, i) => { const a = -1.5 + (3.0 * i) / 33; return [Math.sin(a) * 8.6, 4.8 + Math.cos(a * 2) * 0.15, -Math.cos(a) * 8.6] as [number, number, number]; }), []);
  return <>
    <mesh position={[0, -0.03, 0]} material={floorMat} receiveShadow><cylinderGeometry args={[9, 9, 0.06, 64]} /></mesh>
    <mesh position={[0, -0.2, 0]}><cylinderGeometry args={[9.1, 9.3, 0.3, 64]} /><meshStandardMaterial color="#3a2418" roughness={0.8} /></mesh>
    <mesh position={[0, 5, 0]} rotation={[0, Math.PI, 0]}><cylinderGeometry args={[11, 11, 14, 64, 1, true, -1.8, 3.6]} /><meshBasicMaterial map={sky} side={THREE.BackSide} toneMapped={false} /></mesh>
    <mesh position={[0, -0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[80, 80]} /><meshStandardMaterial color="#140d10" /></mesh>
    {bulbs.map((p, i) => <group key={i}><mesh position={p}><sphereGeometry args={[0.07, 10, 10]} /><meshStandardMaterial color="#fff1c8" emissive="#ffcf70" emissiveIntensity={2.5 + Math.sin(f / 5 + i * 0.7) * 0.8} toneMapped={false} /></mesh><Glow p={p} s={0.8} color="#ffcf70" o={0.5} /></group>)}
    {/* cables */}
    {[[-2.5, 1.2], [1.8, 2.4], [3.2, -0.8]].map(([x, z], i) => <mesh key={i} position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, rand(i) * 3]}><torusGeometry args={[0.6 + i * 0.2, 0.025, 6, 40, Math.PI * 1.4]} /><meshStandardMaterial color="#111" /></mesh>)}
    <Plant p={[-7.6, 0, 3.2]} s={1.5} /><Plant p={[7.4, 0, 3.6]} s={1.3} />
    <pointLight position={[0, 4.2, 2.5]} intensity={40} distance={14} decay={2} color="#ffd2a0" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.002} />
    <pointLight position={[-4, 3, -3]} intensity={16} distance={10} decay={2} color="#c79bff" />
    <pointLight position={[4, 3, -3]} intensity={16} distance={10} decay={2} color="#ffb070" />
  </>;
};

// ── director's chair with a name on the back
export const Chair: React.FC<{ name: string }> = ({ name }) => {
  const back = useCanvasTex(512, 160, (g, w, h) => { g.fillStyle = "#b8282a"; g.fillRect(0, 0, w, h); g.fillStyle = "#fff4e0"; g.font = "400 96px Russo"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(name, w / 2, h / 2 + 6); }, [name]);
  const red = useMemo(() => new THREE.MeshStandardMaterial({ color: "#b8282a", roughness: 0.8 }), []);
  return <group>
    {[[-0.62, 0.42], [0.62, 0.42], [-0.62, -0.42], [0.62, -0.42]].map(([x, z], i) => <B key={i} p={[x, 0.55, z]} s={[0.07, 1.1, 0.07]} m={M.wood} shadow />)}
    {[-1, 1].map((k) => <mesh key={k} position={[0, 0.3, k * 0.42]} rotation={[0, 0, k * 0.6]} material={M.wood}><boxGeometry args={[1.5, 0.05, 0.05]} /></mesh>)}
    <B p={[0, 0.56, 0]} s={[1.22, 0.04, 0.84]} m={red} shadow />
    {[-1, 1].map((k) => <B key={k} p={[k * 0.62, 0.95, 0]} s={[0.1, 0.05, 0.9]} m={M.wood} />)}
    {[-1, 1].map((k) => <B key={k} p={[k * 0.62, 1.35, -0.42]} s={[0.07, 0.9, 0.07]} m={M.wood} />)}
    <mesh position={[0, 1.45, -0.43]}><planeGeometry args={[1.24, 0.42]} /><meshStandardMaterial map={back} roughness={0.8} /></mesh>
    <mesh position={[0, 1.45, -0.45]} rotation={[0, Math.PI, 0]}><planeGeometry args={[1.24, 0.42]} /><meshStandardMaterial map={back} roughness={0.8} /></mesh>
  </group>;
};

// ── a station: a screen on a stand facing the chair, its own UI drawn per frame
const drawStation = (g: CanvasRenderingContext2D, w: number, h: number, it: CrewItem, i: number, n: number, t: number, on: number) => {
  g.fillStyle = "#121318"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#1d1f27"; g.fillRect(0, 0, w, 84); g.fillStyle = "#f4efe8"; g.font = "400 46px Russo"; g.textBaseline = "middle";
  g.fillText(`${String(i + 1).padStart(2, "0")}/${String(n).padStart(2, "0")}`, 28, 44); g.font = "800 42px Inter"; g.fillText(it.name, 190, 44);
  g.fillStyle = "#c9b28a"; g.font = "500 30px Inter"; g.fillText("· " + it.role, 200 + g.measureText(it.name).width * 1.35, 46);
  g.fillStyle = on > 0.5 ? "#ff5f57" : "#3a3a44"; g.beginPath(); g.arc(w - 40, 42, 12, 0, Math.PI * 2); g.fill();
  const k = i % 8; g.save(); g.translate(0, 84); const H = h - 84;
  if (k === 0) { g.font = "700 30px Mono"; ["> сделай ролик про съёмочную группу", "✻ пишу сценарий…", "● Write tools/script.mjs", "● Bash npm run voice", "● Bash npm run render"].forEach((l, j) => { g.fillStyle = j ? (t * 2 > j ? "#e8c9a0" : "#3a3a44") : "#f4efe8"; g.fillText(l, 28, 50 + j * 52); }); }
  if (k === 1) { for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) { g.fillStyle = ["#E07A52", "#7db7ff", "#7ee0a1", "#c79bff"][r]; rr(g, 28 + c * 104 + ((t * 40) % 104) * (r % 2 ? -1 : 1) * 0, 30 + r * 70, 90, 50, 8); g.globalAlpha = 0.35 + 0.65 * ((c + r + Math.floor(t * 3)) % 5 === 0 ? 1 : 0.4); g.fill(); g.globalAlpha = 1; } g.fillStyle = "#fff"; g.fillRect(28 + ((t * 120) % 900), 20, 4, 290); }
  if (k === 2) { g.font = "400 110px Russo"; g.textAlign = "center"; [..."TITLE"].forEach((ch, j) => { const y = 180 + Math.sin(t * 5 + j * 0.9) * 40; g.fillStyle = j % 2 ? "#ffd27a" : "#fff"; g.fillText(ch, 180 + j * 165, y); }); g.textAlign = "left"; }
  if (k === 3) { g.strokeStyle = "#7db7ff"; g.lineWidth = 3; const cx = w / 2, cy = H / 2, s = 90, a = t * 0.9; const P = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map(([x, y, z]) => { const X = x * Math.cos(a) - z * Math.sin(a), Z = x * Math.sin(a) + z * Math.cos(a), Y = y * Math.cos(0.5) - Z * Math.sin(0.5); return [cx + X * s, cy + Y * s]; }); [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([p1, p2]) => { g.beginPath(); g.moveTo(P[p1][0], P[p1][1]); g.lineTo(P[p2][0], P[p2][1]); g.stroke(); }); }
  if (k === 4) { const img = g.createImageData(w / 8, H / 8); for (let y = 0; y < H / 8; y++) for (let x = 0; x < w / 8; x++) { const v = Math.sin(x * 0.15 + t * 2) + Math.sin(y * 0.2 - t * 1.5) + Math.sin((x + y) * 0.1 + t); const o = (y * (w / 8) + x) * 4; img.data[o] = 120 + 120 * Math.sin(v); img.data[o + 1] = 60 + 60 * Math.sin(v + 2); img.data[o + 2] = 160 + 90 * Math.sin(v + 4); img.data[o + 3] = 255; } const c2 = document.createElement("canvas"); c2.width = w / 8; c2.height = H / 8; c2.getContext("2d")!.putImageData(img, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(c2, 0, 0, w, H); }
  if (k === 5) { g.fillStyle = "#2a2d38"; g.fillRect(0, 0, w, H); g.strokeStyle = "#555a6a"; g.lineWidth = 1; for (let x = 0; x < w; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } g.fillStyle = "#f5792a"; g.beginPath(); g.arc(w / 2 + Math.sin(t) * 120, H / 2, 70, 0, Math.PI * 2); g.fill(); g.fillStyle = "#fff"; g.font = "700 28px Mono"; g.fillText("bpy.ops.mesh.primitive_uv_sphere_add()", 28, H - 30); }
  if (k === 6) { for (let j = 0; j < 46; j++) { const a = 20 + rand(j * 7) * 160 * (0.6 + 0.4 * Math.sin(t * 6 + j)); g.fillStyle = j / 46 < (t * 0.4) % 1 ? "#E07A52" : "#3a4060"; rr(g, 28 + j * 20, 140 - a / 2, 12, a, 6); g.fill(); } g.fillStyle = "#fff"; g.font = "800 40px Inter"; g.fillText("…и каждое слово — с таймингом", 28, 290); }
  if (k === 7) { g.fillStyle = "#2a2730"; rr(g, 28, 60, w - 56, 36, 18); g.fill(); g.fillStyle = "#4fd38a"; rr(g, 28, 60, (w - 56) * clamp(t / 2.4), 36, 18); g.fill(); g.fillStyle = "#e8d6b8"; g.font = "700 36px Mono"; g.fillText(`frame ${Math.round(1248 * clamp(t / 2.4))} / 1248`, 28, 160); if (t > 2.4) { g.fillStyle = "#4fd38a"; g.font = "800 46px Inter"; g.fillText("✓ claude-set.mp4", 28, 250); } }
  g.restore();
  g.fillStyle = "#ffd27a"; g.font = "800 34px Inter"; g.textAlign = "right"; g.fillText(`★ ${kStars(it.stars)}`, w - 30, h - 30); g.textAlign = "left";
};
export const Station: React.FC<{ it: CrewItem; i: number; n: number; t: number; on: number }> = ({ it, i, n, t, on }) => {
  const tex = useCanvasTex(1024, 420, (g, w, h) => drawStation(g, w, h, it, i, n, t, on), [Math.floor(t * 15), on > 0.5]);
  const p = stationPos(i, n), a = stationAngle(i, n);
  return <group position={[p.x, 0, p.z]} rotation={[0, -a, 0]}>
    <mesh position={[0, 0.75, 0]} material={M.dark} castShadow><cylinderGeometry args={[0.05, 0.05, 1.5, 10]} /></mesh>
    <mesh position={[0, 0.03, 0]} material={M.dark}><cylinderGeometry args={[0.35, 0.4, 0.06, 20]} /></mesh>
    <group position={[0, 2.0, 0]}>
      <mesh material={M.screenFrame} position={[0, 0, -0.04]} castShadow><boxGeometry args={[2.32, 1.0, 0.06]} /></mesh>
      <mesh position={[0, 0, 0.0]}><planeGeometry args={[2.2, 0.9]} /><meshStandardMaterial map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.6 + on * 0.7} toneMapped={false} /></mesh>
      <Glow p={[0, 0, -0.2]} s={2.6} color="#ffd9b0" o={0.08 + on * 0.18} />
    </group>
  </group>;
};

// ── helper robot: white rounded body, dark visor with glowing eyes, antenna
const rbody = new RoundedBoxGeometry(0.5, 0.55, 0.42, 4, 0.12), rhead = new RoundedBoxGeometry(0.46, 0.34, 0.38, 4, 0.12);
export const Robot: React.FC<{ p: [number, number, number]; ry: number; f: number; seed: number; wave?: number }> = ({ p, ry, f, seed, wave = 0 }) => {
  const bob = Math.abs(Math.sin(f / 9 + seed)) * 0.05, blink = (f + seed * 13) % 70 < 4;
  return <group position={[p[0], p[1] + bob, p[2]]} rotation={[0, ry, 0]}>
    <mesh geometry={rbody} position={[0, 0.42, 0]} castShadow><meshStandardMaterial color="#eef0f2" roughness={0.4} /></mesh>
    <mesh position={[0, 0.42, 0.215]}><planeGeometry args={[0.28, 0.16]} /><meshStandardMaterial color="#4fd3c8" emissive="#4fd3c8" emissiveIntensity={0.6} /></mesh>
    <mesh geometry={rhead} position={[0, 0.88, 0]} castShadow><meshStandardMaterial color="#f4f5f7" roughness={0.35} /></mesh>
    <mesh position={[0, 0.88, 0.19]}><planeGeometry args={[0.36, 0.2]} /><meshStandardMaterial color="#14161c" roughness={0.2} /></mesh>
    {[-0.08, 0.08].map((x) => <mesh key={x} position={[x, 0.88, 0.2]} scale={[1, blink ? 0.2 : 1, 1]}><circleGeometry args={[0.035, 16]} /><meshBasicMaterial color="#7ff3ff" toneMapped={false} /></mesh>)}
    <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[0.012, 0.012, 0.14, 6]} /><meshStandardMaterial color="#888" /></mesh>
    <mesh position={[0, 1.18, 0]}><sphereGeometry args={[0.035, 10, 10]} /><meshBasicMaterial color={CLAY} toneMapped={false} /></mesh>
    {[-1, 1].map((k) => <mesh key={k} position={[k * 0.3, 0.45, 0]} rotation={[0, 0, k * (0.3 + (k > 0 ? wave * 2.2 + Math.sin(f / 4) * 0.3 * wave : 0))]}><capsuleGeometry args={[0.05, 0.25, 4, 8]} /><meshStandardMaterial color="#d8dbe0" /></mesh>)}
    {[-0.12, 0.12].map((x) => <mesh key={x} position={[x, 0.07, 0]}><cylinderGeometry args={[0.07, 0.08, 0.14, 12]} /><meshStandardMaterial color="#3a3d46" /></mesh>)}
  </group>;
};

// ── clapperboard: drawn slate + striped clapper stick that snaps shut at `clap` (0 open → 1 shut)
export const Slate: React.FC<{ it: CrewItem; i: number; n: number; clap: number }> = ({ it, i, n, clap }) => {
  const tex = useCanvasTex(1024, 720, (g, w, h) => {
    g.fillStyle = "#1c1a1d"; rr(g, 0, 0, w, h, 24); g.fill(); g.strokeStyle = "#e8e2d6"; g.lineWidth = 6;
    g.fillStyle = "#e8e2d6"; g.font = "800 46px Inter"; g.textBaseline = "middle"; g.fillText("SCENE", 44, 70); g.font = "400 70px Russo"; g.fillText(`${String(i + 1).padStart(2, "0")}/${String(n).padStart(2, "0")}`, 210, 72);
    g.fillStyle = "#ffd27a"; rr(g, w - 300, 32, 256, 76, 16); g.fill(); g.fillStyle = "#1c1a1d"; g.font = "800 52px Inter"; g.textAlign = "center"; g.fillText(`★ ${kStars(it.stars)}`, w - 172, 72);
    g.strokeStyle = "rgba(232,226,214,0.5)"; g.lineWidth = 4; g.beginPath(); g.moveTo(30, 130); g.lineTo(w - 30, 130); g.moveTo(30, 520); g.lineTo(w - 30, 520); g.moveTo(w / 3, 520); g.lineTo(w / 3, h - 30); g.moveTo((2 * w) / 3, 520); g.lineTo((2 * w) / 3, h - 30); g.stroke();
    g.fillStyle = "#ffffff"; g.font = `400 ${it.name.length > 10 ? 112 : 140}px Russo`; g.fillText(it.name, w / 2, 290);
    g.fillStyle = "#e8c9a0"; g.font = "500 56px Inter"; g.fillText(it.role, w / 2, 420);
    [["DIRECTOR", "CLAWD"], ["CAMERA", "REMOTION"], ["TAKE", "1"]].forEach(([a, b], k) => { g.fillStyle = "#9a948a"; g.font = "800 30px Inter"; g.fillText(a, (w / 6) * (2 * k + 1), 570); g.fillStyle = "#ffffff"; g.font = "800 50px Inter"; g.fillText(b, (w / 6) * (2 * k + 1), 640); });
    g.textAlign = "left";
  }, [i]);
  const stripes = useCanvasTex(1024, 128, (g, w, h) => { g.fillStyle = "#1c1a1d"; g.fillRect(0, 0, w, h); g.fillStyle = "#f2efe8"; for (let x = -h; x < w; x += 140) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 70, h); g.lineTo(x + 70 + h, 0); g.lineTo(x + h, 0); g.closePath(); g.fill(); } }, []);
  const open = (1 - clamp(clap)) * 0.55;
  return <group>
    <mesh><boxGeometry args={[1.0, 0.7, 0.04]} /><meshStandardMaterial color="#1c1a1d" /></mesh>
    <mesh position={[0, 0, 0.021]}><planeGeometry args={[1.0, 0.7]} /><meshStandardMaterial map={tex} roughness={0.6} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.25} /></mesh>
    <mesh position={[0, 0.38, 0.0]}><boxGeometry args={[1.0, 0.08, 0.05]} /><meshStandardMaterial map={stripes} /></mesh>
    <group position={[-0.5, 0.43, 0]} rotation={[0, 0, open]}><mesh position={[0.5, 0.04, 0]}><boxGeometry args={[1.0, 0.08, 0.05]} /><meshStandardMaterial map={stripes} /></mesh></group>
  </group>;
};

// ── big screen at the back with rolling end credits
export const Credits: React.FC<{ crew: CrewItem[]; t: number; lift: number }> = ({ crew, t, lift }) => {
  const tex = useCanvasTex(1024, 640, (g, w, h) => {
    g.fillStyle = "#2a1f1a"; g.fillRect(0, 0, w, h); g.textAlign = "center"; g.textBaseline = "middle";
    const rows: [string, string][] = [["", "END CREDITS"], ...crew.map((c) => [c.role.toUpperCase(), c.name] as [string, string]), ["", ""], ["DIRECTED BY", "CLAWD"]];
    const y0 = h - t * 150;
    rows.forEach(([a, b], k) => { const y = y0 + k * 62; if (y < -40 || y > h + 40) return; if (!a) { g.fillStyle = "#ffd27a"; g.font = "800 46px Inter"; g.fillText(b, w / 2, y); return; } g.fillStyle = "#c9b28a"; g.font = "800 30px Inter"; g.textAlign = "right"; g.fillText(a, w / 2 - 20, y); g.fillStyle = "#f4efe8"; g.font = "800 38px Inter"; g.textAlign = "left"; g.fillText(b, w / 2 + 20, y); g.textAlign = "center"; });
    const last = y0 + (rows.length - 1) * 62; if (last < h / 2) { /* hold the final card */ }
  }, [Math.floor(t * 30)]);
  return <group position={[0, -3.2 + lift * 3.2, -6.6]}>
    <mesh position={[0, 3.2, -0.05]} material={M.dark}><boxGeometry args={[6.6, 4.2, 0.1]} /></mesh>
    <mesh position={[0, 3.2, 0.01]}><planeGeometry args={[6.3, 3.94]} /><meshStandardMaterial map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.9} toneMapped={false} /></mesh>
    {[-3.1, 3.1].map((x) => <B key={x} p={[x, 0.6, 0]} s={[0.08, 1.2, 0.08]} m={M.dark} />)}
  </group>;
};
