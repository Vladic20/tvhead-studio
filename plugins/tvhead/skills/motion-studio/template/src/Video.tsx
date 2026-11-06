import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { C, Captions, Fonts, Grain, L, LINES, SC, TL, W, clamp, p } from "./lib";
import { Shader, hex3 } from "./fx";
import bg from "./shaders/bg.shader";
import { Mascot } from "./Mascot3D";
import { Check, Final, Hook, Motion, Prompt, Render, Script, Three, mascotAt } from "./scenes";

// background palette per scene: [base, second, glow]
const PALS: Record<string, [string, string, string, number]> = {
  hook: ["#07080d", "#1a1024", "#D9774F", 0.35], prompt: ["#07080d", "#101626", "#D9774F", 0.2], script: ["#08090f", "#1b1426", "#D9774F", 0.25],
  motion: ["#060912", "#132044", "#7db7ff", 0.55], three: ["#0a0807", "#2a1610", "#D9774F", 0.45], check: ["#07090a", "#102018", "#7ee0a1", 0.25],
  render: ["#08080c", "#20121a", "#D9774F", 0.4], final: ["#0a0706", "#2b140c", "#E99A76", 0.6],
};
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);

type Fx = [number, string, number, number?];
const SFX: Fx[] = [
  [0, "riser-cine", 0.3, 60],
  ...[0, 1].map((i): Fx => [L("hook", i) - 2, "swoosh-slow", 0.45]),
  [W("hook", 0, "монтир") + 6, "marker-pen-line", 0.6, 22],
  [L("hook", 1) - 14, "zoom-air-fast", 0.5], [W("hook", 1, "код"), "impact-cine-big", 0.55], [W("hook", 1, "код"), "glitch-static", 0.35, 12],
  ...TL.scenes.slice(1).map((s): Fx => [s.from - 4, "air-woosh-quick", 0.5]),
  ...Array.from({ length: 18 }, (_, i): Fx => [L("prompt", 1) + i * 3.6, "clock-tick-single", 0.18, 6]),
  [W("prompt", 0, "одну"), "hit-blow", 0.35],
  ...Array.from({ length: 8 }, (_, i): Fx => [SC("script").from + 6 + i * 4, "paper-slide", 0.35, 14]),
  [W("motion", 0, "функц"), "hit-blow", 0.45],
  ...[0, 1, 2, 3].map((i): Fx => [W("motion", 1, ["шейдер", "частиц", "морфинг", "живая"][i]) - 2, "swoosh-slow", 0.35]),
  [W("motion", 1, "частиц") + 4, "sparkle", 0.5],
  [SC("three").from + 6, "projector-spin-antique", 0.3, 30], [W("three", 0, "кубик"), "bass-hit-short", 0.55], [W("three", 0, "кубик") + 4, "sand-swish", 0.5, 40],
  [W("three", 1, "blender"), "hit-blow", 0.4],
  ...Array.from({ length: 6 }, (_, i): Fx => [SC("check").from + 4 + i * 3, "paper-slide", 0.3, 12]),
  [W("check", 0, "косяк") - 4, "marker-pen-line", 0.6, 22], [W("check", 1, "чисто") - 6, "impact-cine-big", 0.45],
  [L("render", 0), "riser-cine", 0.3, 70], [LINES[LINES.length - 2].from + LINES[LINES.length - 2].dur + 4, "coin", 0.6], [LINES[LINES.length - 2].from + LINES[LINES.length - 2].dur + 6, "sparkle", 0.55],
  [W("final", 0, "ролик") - 3, "impact-cine-big", 0.5], [W("final", 0, "ролик"), "sparkle", 0.45], [TL.total - 22, "sand-swish", 0.4, 30],
];

export const Video: React.FC = () => {
  const f = useCurrentFrame();
  const sc = [...TL.scenes].reverse().find((s) => f >= s.from - 6) ?? TL.scenes[0];
  const prev = TL.scenes[Math.max(0, TL.scenes.indexOf(sc) - 1)];
  const t = clamp((f - sc.from + 6) / 14);
  const A = PALS[prev.id], B = PALS[sc.id];
  const u = { u_a: mix(hex3(A[0]), hex3(B[0]), t), u_b: mix(hex3(A[1]), hex3(B[1]), t), u_c: mix(hex3(A[2]), hex3(B[2]), t), u_glow: A[3] + (B[3] - A[3]) * t, u_pulse: Math.pow(1 - ((f / 30 * 2.5) % 1), 3) };
  const ms = mascotAt(f);
  const speech = LINES.map((l) => [l.from - 4, l.from + l.dur + 4]);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Fonts />
      <Shader frag={bg} uniforms={u} />
      {/* the 3D grid floor of the «Blender» beat */}
      <AbsoluteFill>
        <ThreeCanvas width={1080} height={1920} camera={{ fov: 2 * Math.atan(960 / 2000) * 180 / Math.PI, position: [0, 0, 2000], near: 10, far: 8000 }}>
          <ambientLight intensity={0.75} />
          <directionalLight position={[-600, 900, 1200]} intensity={2.4} />
          <directionalLight position={[700, -300, 600]} intensity={0.7} color="#ffb48a" />
          {f >= L("three", 1) - 6 && f < SC("check").from && (
            <gridHelper args={[1600, 32, "#f5792a", "#5a4a40"]} position={[0, 960 - 840 - 330, 0]} rotation={[0.32 + p(f, L("three", 1), 30) * 0.25, 0, 0]} scale={[p(f, L("three", 1) - 6, 18), 1, p(f, L("three", 1) - 6, 18)]} />
          )}
          <Mascot st={ms} />
        </ThreeCanvas>
      </AbsoluteFill>
      <Hook f={f} /><Prompt f={f} /><Script f={f} /><Motion f={f} /><Three f={f} /><Check f={f} /><Render f={f} /><Final f={f} />
      <Captions f={f} />
      <Grain f={f} />
      <Audio src={staticFile("music.mp3")} volume={(fr) => (fr > TL.total - 12 ? interpolate(fr, [TL.total - 12, TL.total], [0.3, 0]) : speech.some(([a, b]) => fr >= a && fr <= b) ? 0.12 : 0.3)} />
      {LINES.map((l) => <Sequence key={l.file} from={Math.max(0, l.from - Math.round(l.lead * 30))}><Audio src={staticFile(l.file)} /></Sequence>)}
      {SFX.map(([at, n, v, len], k) => <Sequence key={k} from={Math.max(0, Math.round(at))} durationInFrames={len ?? 80}><Audio src={staticFile(`sfx/${n}.mp3`)} volume={v} /></Sequence>)}
    </AbsoluteFill>
  );
};
