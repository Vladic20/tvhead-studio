// Canvas textures that redraw every frame (signs, screens, faces). Deterministic: drawing depends only on the args.
import { useLayoutEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { continueRender, delayRender, staticFile } from "remotion";

export type Draw = (g: CanvasRenderingContext2D, w: number, h: number) => void;
export const useCanvasTex = (w: number, h: number, draw: Draw, deps: unknown[]) => {
  const { cv, tex } = useMemo(() => {
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    return { cv, tex };
  }, [w, h]);
  useLayoutEffect(() => { const g = cv.getContext("2d")!; g.clearRect(0, 0, w, h); draw(g, w, h); tex.needsUpdate = true; }, deps); // eslint-disable-line
  return tex;
};

// wait for the web fonts before the first canvas draw, otherwise signs render in a fallback font
const cache = new Map<string, THREE.Texture>();
let fontsReady: Promise<unknown> | null = null;
// gate for the 3D canvas: web fonts (with Cyrillic) + every image texture, so the first drawn frame is complete
export const useFonts = (images: string[] = []) => {
  const [ok, setOk] = useState(false);
  useLayoutEffect(() => {
    const h = delayRender("fonts+textures");
    fontsReady ??= Promise.all([...images.map((src) => new Promise<void>((res) => new THREE.TextureLoader().load(staticFile(src), (x) => { x.colorSpace = THREE.SRGBColorSpace; cache.set(src, x); res(); }, undefined, () => res()))), ...["400 40px Russo", "800 40px Inter", "500 40px Inter", "700 40px Mono", "40px Hand"].map((f) => document.fonts.load(f, "БАШНЯ Клода abc 0123 ✓▲"))]);
    fontsReady.then(() => { setOk(true); continueRender(h); });
  }, []);
  return ok;
};

export const useImgTex = (src: string) => {
  const [t, setT] = useState<THREE.Texture | null>(cache.get(src) ?? null);
  useLayoutEffect(() => {
    if (t) return; const h = delayRender("tex " + src);
    new THREE.TextureLoader().load(staticFile(src), (x) => { x.colorSpace = THREE.SRGBColorSpace; cache.set(src, x); setT(x); continueRender(h); }, undefined, () => continueRender(h));
  }, [src]); // eslint-disable-line
  return t;
};

export const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
};
