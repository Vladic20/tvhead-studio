# Каталог репозиториев (обновлено 2026-11-06)

## Установлено
| Репозиторий | Где | Зачем |
|---|---|---|
| EL4CTEO/blender-skills | плагин `blender-agent-skills`, копия `~/motion-kit/vendor` | 28 Blender-скиллов + QA |
| remotion-dev/skills | `~/.claude/skills/remotion-{best-practices,captions,render,multimedia,docs}` | официальные правила Remotion |
| greensock/GSAP | `~/motion-kit/node_modules/gsap`, стартер | кинетика |
| mrdoob/three.js + @remotion/three + @react-three/fiber | стартер | 3D в Remotion |
| pmndrs/postprocessing | стартер | bloom/glitch/DOF |
| veltman/flubber | стартер | морфинг |
| rough-stuff/rough | стартер | рисованный стиль |
| theatre-js/theatre | `~/motion-kit` (@theatre/core + studio), стартер (core) | таймлайн-редактор |
| patriciogonzalezvivo/lygia | `~/motion-kit/vendor/patriciogonzalezvivo_lygia` | GLSL-библиотека |
| PavelDoGreat/WebGL-Fluid-Simulation | `~/motion-kit/vendor/...` | дым/жидкость (realtime) |
| tsparticles/tsparticles | `~/motion-kit` (engine, slim, confetti, fireworks) | частицы для HTML-превью |
| hydra-synth/hydra | `~/motion-kit` | аудиореактивный визуал |
| Tonejs/Tone.js | `~/motion-kit` | музыка кодом |
| SYSTRAN/faster-whisper | `~/motion-kit/py-whisper` | субтитры/тайминги офлайн |
| resemble-ai/chatterbox | `~/motion-kit/py-tts` | офлайн TTS |

## Уже было до этого
Blender 5.2.1 LTS + Blender MCP, FFmpeg, Remotion-проекты, tvhead-studio (GSAP, lottie-web, puppeteer), After Effects 2024
+ AE MCP, скиллы anthropic-skills / hyperframes / motion-graphics / 12-principles-of-animation, Figma MCP.

## Сознательно не ставили
- **ruucm/shadergradient** — React-компонент поверх r3f с realtime-циклом; заменён своим шейдером на LYGIA.
- **ComfyUI** и **facebookresearch/sam2** — тяжёлые GPU-пайплайны (модели по 2–10 ГБ), на GTX 1050 Ti 4 ГБ работают
  плохо или очень медленно. Ставить, если появится GPU ≥ 8 ГБ или по прямой просьбе.
- **excalidraw/excalidraw** — это приложение-доска; сториборд делаем стиллами Remotion/tvhead и Rough.js.
  Если нужна доска — https://excalidraw.com в браузере.
- **ahujasid/blender-mcp** — не нужен: уже подключён Blender MCP.
- **anthropics/skills** — уже стоит как плагин `anthropic-skills`.

## Добавлено 2026-11-06 (список «20 open-source skills»)
| Репозиторий | Где | Зачем |
|---|---|---|
| juliangarnier/anime (4.5) | `~/motion-kit/node_modules/animejs` | таймлайны/стаггеры; в Remotion — `createTimeline({autoplay:false})` + `.seek(ms)` от frame |
| daybrush/scenejs (1.10) | `~/motion-kit` | CSS-кейфреймы; `scene.setTime(t)` от frame |
| konvajs/konva (10.9) | `~/motion-kit` | слоистая 2D-графика на canvas (рисовать в offscreen stage → `toCanvas`) |
| metafizzy/zdog (1.1) | `~/motion-kit` | псевдо-3D иллюстрации (плоские цвета, круглые формы) — `illo.updateRenderGraph()` на каждый кадр |
| piqnt/planck.js (1.4) | `~/motion-kit/node_modules/planck` | 2D-физика: детерминированно — фиксированный шаг `world.step(1/30)` с нуля до кадра (кэшировать) |
| regl-project/regl (2.1) | `~/motion-kit` | свой WebGL без three.js |
| ashima/webgl-noise | `~/motion-kit/vendor/ashima_webgl-noise` | GLSL-шумы (как LYGIA, `src/*.glsl`) |
| zeux/meshoptimizer (1.3) | `~/motion-kit` | сжатие glTF перед three.js (`gltfpack` — отдельный бинарь) |
| Vanilagy/mediabunny (1.65) | `~/motion-kit` + скилл `remotion-multimedia` | чтение/резка видео в браузере |
| xiph/rnnoise | встроен в ffmpeg (`arnndn`), модели `~/motion-kit/vendor/rnnoise-models` | очистка голоса: `cd …/somnolent-hogwash-2018-09-01 && ffmpeg -i in.wav -af arnndn=m=sh.rnnn out.wav` (на Windows путь к модели — только относительный: двоеточие ломает фильтр) |
| breakfastquay/rubberband | встроен в ffmpeg (`rubberband`) | тайм-стретч/питч: `-af rubberband=tempo=1.1:pitch=1.0` (подогнать фразу под бит) |
| myshell-ai/MeloTTS | `~/motion-kit/py-melo` | офлайн TTS EN/ES/FR/ZH/JP/KR (русского нет) — для англ./японских реплик |

Не ставили: **Pencil2D, OBS Studio, OpenRV** — это десктоп-приложения для ручной работы, агенту не нужны (рисованный стиль —
Rough.js/канвас, запись экрана — не наш конвейер, ревью — контактные листы). **Filament** и **ozz-animation** — C++-движки
без удобной JS-сборки; PBR и скелетная анимация у нас — three.js (+ Blender для ригов).
