// The pixel Claude mascot as real voxels: every pixel of the sprite is extruded into DEPTH cubes (one InstancedMesh).
import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clamp, rand } from "./lib";

const CL = ["....oooooooooooooooo....", "...occcccccccccccccco...", "...ocheeccccccccceeco...", "...occeecccccccceecco...", "oooocccccccccccccccoooo.", "occccccccccccccccccccco.", "oooocccccccccccccccoooo.", "...occcccccccccccccco...", "...occcccccccccccccco...", "...oooooooooooooooooo...", "....olo.olo....olo.olo..", "....ooo.ooo....ooo.ooo.."];
const PAL: Record<string, string> = { o: "#2a1810", c: "#D9774F", h: "#F3B08F", e: "#0E0C0A", l: "#A9573A" };
export const DEPTH = 5;
type Vox = { x: number; y: number; z: number; col: THREE.Color; leg: boolean; eye: boolean };
export const VOXELS: Vox[] = (() => {
  const out: Vox[] = []; const cols = CL[0].length, rows = CL.length;
  CL.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch === ".") return;
    for (let z = 0; z < DEPTH; z++) {
      // eyes and highlight only on the front layer, the rest of the head is clay
      const c = (ch === "e" || ch === "h") && z < DEPTH - 1 ? "c" : ch;
      out.push({ x: x - cols / 2 + 0.5, y: rows / 2 - y - 0.5, z: z - (DEPTH - 1) / 2, col: new THREE.Color(PAL[c]), leg: y >= 10, eye: ch === "e" && z === DEPTH - 1 });
    }
  }));
  return out;
})();
export const VOXEL_COUNT = VOXELS.length;

export type MState = {
  x: number; y: number; s: number;          // screen px of the centre, px per voxel
  rx?: number; ry?: number; rz?: number;    // radians
  build?: number;                           // frames since assembly started (Infinity = built)
  explode?: number;                         // 0 = solid, 1 = blown apart
  hop?: number;                             // 0..1 squash/stretch hop
  blink?: boolean; wire?: number;           // wire 1 = wireframe look
  walk?: number;                            // leg phase
  vanish?: number;                          // 0..1 shrinks every cube to nothing
};

const tmp = new THREE.Object3D();
export const Mascot: React.FC<{ st: MState; seed?: number }> = ({ st, seed = 3 }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(0.9, 0.9, 0.9), []);
  const { x, y, s, rx = 0, ry = 0, rz = 0, build = Infinity, explode = 0, hop = 0, blink, wire = 0, walk = 0, vanish = 0 } = st;
  useLayoutEffect(() => {
    const m = ref.current!; const black = new THREE.Color("#0E0C0A");
    VOXELS.forEach((v, i) => {
      const r1 = rand(seed + i * 1.7), r2 = rand(seed + i * 3.1), r3 = rand(seed + i * 5.3);
      const dir = new THREE.Vector3(r1 - 0.5, r2 - 0.5, r3 - 0.3).normalize();
      // assembly: each cube flies in from far away with its own delay
      const delay = (r1 * 0.6 + (1 - (v.y + 6) / 12) * 0.4) * 26, t = clamp((build - delay) / 16);
      const k = 1 - Math.pow(1 - t, 3), over = Math.sin(t * Math.PI) * 0.25;
      const far = (1 - k) * (22 + r2 * 26) + explode * (6 + r3 * 14);
      const legY = v.leg ? Math.max(0, Math.sin(walk + (v.x > 0 ? Math.PI : 0))) * 0.6 : 0;
      tmp.position.set(v.x + dir.x * far, v.y + dir.y * far + legY, v.z + dir.z * far);
      tmp.rotation.set((1 - k) * r1 * 9 + explode * r2 * 4, (1 - k) * r2 * 9 + explode * r3 * 4, 0);
      const sc = (t <= 0 ? 0 : 1 + over) * (1 - explode * 0.35) * (1 - vanish);
      tmp.scale.setScalar(sc); tmp.updateMatrix(); m.setMatrixAt(i, tmp.matrix);
      m.setColorAt(i, blink && v.eye ? VOXELS[i - 1]?.col ?? v.col : v.col);
      if (wire > 0 && !v.eye) m.setColorAt(i, v.col.clone().lerp(black, wire * 0.75));
    });
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  const sq = 1 + Math.sin(hop * Math.PI) * 0.12;
  return (
    <group position={[x - 540, 960 - y + Math.sin(hop * Math.PI) * s * 2.2, 0]} rotation={[rx, ry, rz]} scale={[s / Math.sqrt(sq), s * sq, s]}>
      <instancedMesh ref={ref} args={[geo, undefined, VOXELS.length]}>
        <meshStandardMaterial roughness={0.55} metalness={0.05} wireframe={wire > 0.5} />
      </instancedMesh>
    </group>
  );
};
