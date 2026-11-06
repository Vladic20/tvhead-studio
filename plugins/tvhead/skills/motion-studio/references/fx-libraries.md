# Моушн-библиотеки: что установлено и как использовать в рендере

Всё лежит в `~/motion-kit` (`node_modules` — для HTML-движков и прототипов; в Remotion-проект ставь через стартер).
Исходники для чтения/копирования: `~/motion-kit/vendor/`.

Главное правило: в Remotion кадр — чистая функция от `frame`. Realtime-библиотеку можно брать только если
её время управляется снаружи (seek, фиксированный шаг) или заменять аналитической формулой.

| Библиотека | Версия | Для чего | Как детерминированно |
|---|---|---|---|
| GSAP | 3.15 | кинетический текст, сложные изинги, stagger | `useGsap` в `fx.tsx`: paused timeline → `seek(frame/fps)`; SplitText/stagger на объектах значений |
| Flubber | 0.4 | морфинг форм | `morph(a,b,t)` (кэш интерполятора), `maxSegmentLength` 4–8 |
| Rough.js | 4.6 | рисованный стиль | `Rough` с `seed`; `boil` = новый seed раз в N кадров |
| three.js | 0.187 | 3D-объекты, свет, камера | `@remotion/three` `ThreeCanvas` + `useCurrentFrame`; рендер с `--gl=angle` |
| postprocessing | 6.39 | bloom, glitch, DOF, chromatic aberration | `EffectComposer` в r3f, параметры от frame; Glitch — свой seed вместо random |
| LYGIA | git | шумы, SDF, цвет, блюр в GLSL | `#include "lygia/..."` → `node tools/lygia-inline.mjs x.frag` → `import x from "./x.shader"` |
| Theatre.js | 0.7 | ручной таймлайн-редактор кейфреймов | в студии Theatre настроить, экспортировать state JSON, в Remotion `sheet.sequence.position = frame/fps` |
| Tone.js | 15.1 | музыка и SFX кодом | `Tone.Offline(() => {...}, seconds)` → AudioBuffer → WAV → `<Audio>`; не играть в реальном времени |
| tsParticles | 4.5 | конфетти, фейерверки, частицы | realtime → в рендере используй `Particles` из `fx.tsx`; tsParticles только для HTML-превью |
| Hydra | 1.4 | лайв-кодинг визуала под музыку | realtime → задать `time` вручную на каждый кадр (`synth.time = t`, `tick(0)`) или переписать паттерн в GLSL |
| WebGL-Fluid | git | дым, жидкость | realtime → фиксированный dt (1/fps) и сим кадр за кадром от 0, или пре-рендер в mp4/PNG и наложить как `<OffthreadVideo>` |
| ShaderGradient | — (не ставили) | движущиеся градиенты | заменено `Shader` + LYGIA `snoise` (`template/src/shaders/gradient.frag`) |

## Рецепты

**Кинетический заголовок (GSAP).**
```tsx
const v = useGsap(() => ({ y: 120, o: 0, sx: 1.4 }), (tl, o) => {
  tl.to(o, { y: 0, o: 1, duration: 0.5, ease: "power4.out" }, 0.1)
    .to(o, { sx: 1, duration: 0.9, ease: "elastic.out(1,0.4)" }, 0.1);
});
```
Для побуквенного входа: массив объектов + `stagger: 0.03`.

**Морф логотипа в цифру (Flubber).** Пути с одинаковой ориентацией; для текста — `opentype.js`/экспорт из Figma в path.

**Обводка маркером поверх фото (Rough.js + Mk).** `Rough kind="ellipse"` с `roughness: 2, strokeWidth: 8`; раскрытие —
маска `stroke-dasharray` от прогресса (см. `Mk` в market-epochs).

**Шейдер-фон под монтажом.** `<Shader frag={grad} uniforms={{u_a: hex3("#10162b"), ...}} />` → затемнить слоем
`rgba(0,0,0,.35)` под субтитрами. Шум/зерно: `lygia/generative/random.glsl`, `fbm.glsl`, `voronoi.glsl`.

**3D-акцент (three.js).** Простые меши/текст (`TextGeometry` с `FontLoader`) в `ThreeCanvas`; сложнее — модель из Blender
в glTF (`useGLTF` через `@react-three/drei`, ставить отдельно) или готовый рендер-плейт из Blender.

**Bloom/glitch (postprocessing).** `@react-three/postprocessing` (ставить в проект: `npm i @react-three/postprocessing`),
`<EffectComposer><Bloom intensity={…} /></EffectComposer>`; интенсивность от `interpolate(frame,…)`.

**Музыка кодом (Tone.js).** В Node нет WebAudio: рендерь в браузере Remotion-студии/puppeteer через `Tone.Offline`
и сохраняй WAV, или используй `renderMusic` из `~/tvhead-studio/lib/music.mjs` (уже Node, пресеты lofi/ambient/upbeat/
epic/chiptune/synthwave/hype).

## Для HTML-движка tvhead
`~/tvhead-studio` рендерит HTML-кадры в headless Chrome и уже содержит gsap и lottie-web. Новые библиотеки
подключай как UMD/ESM из `~/motion-kit/node_modules/<pkg>/dist` в `engine/index.html` или через episode `scripts`
(motion.md §6) — с теми же правилами детерминизма.
