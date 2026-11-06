// motion-studio fx: deterministic wrappers for GSAP, Flubber, Rough.js, particles and GLSL (LYGIA) in Remotion.
// Rule: every frame is a pure function of `frame`. No Math.random, no Date, no requestAnimationFrame.
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from "remotion";
import gsap from "gsap";
import { interpolate as flubberInterpolate } from "flubber";
import rough from "roughjs";

export const rand = (seed: number) => { const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

// ── GSAP: build a paused timeline over a plain values object, seek it to the current time, read the values.
// const v = useGsap(() => ({ x: 0, s: 1 }), (tl, o) => tl.to(o, { x: 500, ease: "elastic.out(1,0.4)", duration: 1.2 }));
export function useGsap<T extends object>(init: () => T, build: (tl: gsap.core.Timeline, o: T) => void): T {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const st = useMemo(() => { const o = init(); const tl = gsap.timeline({ paused: true }); build(tl, o); return { o, tl }; }, []); // eslint-disable-line
  st.tl.seek(frame / fps, false);
  return { ...st.o };
}

// ── Flubber: smooth morph between any two SVG paths (or arrays of points).
const morphCache = new Map<string, (t: number) => string>();
export const morph = (a: string, b: string, t: number, maxSegmentLength = 6) => {
  const k = a + "|" + b; let f = morphCache.get(k);
  if (!f) { f = flubberInterpolate(a, b, { maxSegmentLength }); morphCache.set(k, f); }
  return f(Math.min(1, Math.max(0, t)));
};
export const Morph: React.FC<{ from: string; to: string; t: number; fill?: string; stroke?: string; width?: number }> =
  ({ from, to, t, fill = "#f5c542", stroke, width = 0 }) => <path d={morph(from, to, t)} fill={fill} stroke={stroke} strokeWidth={width} />;

// ── Rough.js: hand-drawn shapes. `boil` re-seeds every N frames for the classic hand-drawn jitter (0 = still).
const gen = rough.generator();
type RoughKind = "rect" | "circle" | "ellipse" | "line" | "path" | "polygon";
export const Rough: React.FC<{ kind: RoughKind; args: any[]; opts?: any; boil?: number; seed?: number }> =
  ({ kind, args, opts = {}, boil = 3, seed = 1 }) => {
    const frame = useCurrentFrame();
    const s = seed + (boil ? Math.floor(frame / boil) : 0);
    const o = { roughness: 1.4, bowing: 1.2, stroke: "#111", strokeWidth: 4, seed: s, ...opts };
    const d = kind === "rect" ? gen.rectangle(args[0], args[1], args[2], args[3], o)
      : kind === "circle" ? gen.circle(args[0], args[1], args[2], o)
      : kind === "ellipse" ? gen.ellipse(args[0], args[1], args[2], args[3], o)
      : kind === "line" ? gen.line(args[0], args[1], args[2], args[3], o)
      : kind === "polygon" ? gen.polygon(args[0], o)
      : gen.path(args[0], o);
    return <g>{gen.toPaths(d).map((p, i) => <path key={i} d={p.d} stroke={p.stroke} strokeWidth={p.strokeWidth} fill={p.fill || "none"} />)}</g>;
  };

// ── Particles: analytic (closed-form) bursts, so any frame renders without simulating the previous ones.
// kind: "confetti" | "sparks" | "embers" | "snow"
export const Particles: React.FC<{ at: number; x: number; y: number; n?: number; kind?: "confetti" | "sparks" | "embers" | "snow"; colors?: string[]; seed?: number; life?: number; power?: number }> =
  ({ at, x, y, n = 80, kind = "confetti", colors = ["#f5c542", "#e94b3c", "#3cb4e9", "#7ee96b", "#fff"], seed = 7, life = 60, power = 1 }) => {
    const frame = useCurrentFrame(); const t = frame - at;
    if (t < 0 || t > life) return null;
    const g = kind === "embers" ? -0.05 : kind === "snow" ? 0.02 : kind === "sparks" ? 0.25 : 0.35;
    const drag = kind === "confetti" ? 0.94 : kind === "snow" ? 0.99 : 0.9;
    const dk = (1 - Math.pow(drag, t)) / (1 - drag); // sum of drag^k for k < t
    return <g>{Array.from({ length: n }, (_, i) => {
      const a = rand(seed + i) * Math.PI * 2, sp = (kind === "snow" ? 1 : 6 + rand(seed + i * 3) * 16) * power;
      const vx = Math.cos(a) * sp, vy = Math.sin(a) * sp - (kind === "confetti" ? 10 * power : 0);
      const px = x + vx * dk + (kind === "snow" ? Math.sin(t * 0.05 + i) * 30 : 0), py = y + vy * dk + 0.5 * g * t * t;
      const fade = 1 - t / life, c = colors[i % colors.length];
      if (kind === "confetti") {
        const rot = (rand(seed + i * 7) - 0.5) * 30 * t, flip = Math.abs(Math.cos(t * 0.2 + i));
        return <rect key={i} x={-9} y={-5} width={18} height={10 * flip + 1} fill={c} opacity={Math.min(1, fade * 2)} transform={`translate(${px} ${py}) rotate(${rot})`} />;
      }
      const r = kind === "sparks" ? 3 + 3 * fade : kind === "embers" ? 2 + 4 * rand(seed + i * 5) : 4 + 4 * rand(i);
      return <circle key={i} cx={px} cy={py} r={r} fill={c} opacity={fade} style={kind !== "snow" ? { filter: `drop-shadow(0 0 6px ${c})` } : undefined} />;
    })}</g>;
  };

// ── GLSL layer: a fullscreen fragment shader driven by frame time. Pair with tools/lygia-inline.mjs for LYGIA includes.
// uniforms: u_time (s), u_resolution, plus any vec3/float you pass in `uniforms`.
export const Shader: React.FC<{ frag: string; uniforms?: Record<string, number | number[]>; style?: React.CSSProperties }> = ({ frag, uniforms = {}, style }) => {
  const ref = useRef<HTMLCanvasElement>(null); const frame = useCurrentFrame(); const { fps, width, height } = useVideoConfig();
  const glRef = useRef<{ gl: WebGLRenderingContext; prog: WebGLProgram } | null>(null);
  useLayoutEffect(() => {
    const cv = ref.current!; let st = glRef.current;
    if (!st) {
      const gl = cv.getContext("webgl", { preserveDrawingBuffer: true, antialias: false })!;
      const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader"); return s; };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}"));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag)); gl.linkProgram(prog); gl.useProgram(prog);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      st = glRef.current = { gl, prog };
    }
    const { gl, prog } = st;
    gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform1f(gl.getUniformLocation(prog, "u_time"), frame / fps);
    gl.uniform2f(gl.getUniformLocation(prog, "u_resolution"), cv.width, cv.height);
    for (const [k, v] of Object.entries(uniforms)) {
      const l = gl.getUniformLocation(prog, k); if (!l) continue;
      if (typeof v === "number") gl.uniform1f(l, v); else if (v.length === 2) gl.uniform2fv(l, v); else if (v.length === 3) gl.uniform3fv(l, v); else gl.uniform4fv(l, v);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }, [frame]); // eslint-disable-line
  return <AbsoluteFill><canvas ref={ref} width={width} height={height} style={{ width: "100%", height: "100%", ...style }} /></AbsoluteFill>;
};

export const hex3 = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
