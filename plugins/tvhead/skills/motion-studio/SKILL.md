---
name: motion-studio
description: Наш общий видео-скилл — тема → готовый mp4. Вертикальные Reels/Shorts 9:16 и 16:9, RU/EN, бесплатная озвучка. Пять готовых стилей одной командой — моушн с воксельным маскотом, cozy-3D башня-лифт, cozy-3D съёмочная площадка, аниме-опенинг (toon, контуры, удары, спид-лайны), «снято на телефон» (ноутбук с Claude Code, ручная камера, ГРИП) — плюс Remotion-монтаж из реальных материалов (графики, архивные фото), шейдеры LYGIA, частицы, морфинг, Rough.js, three.js, 3D-плейты из Blender, персонажные ролики через tvhead. Рабочий шаблон-ролик, проверка произношения Whisper'ом, контактные листы, стыки, выдача −14 LUFS. Используй для любых «сделай ролик / видео / рилс / шортс / монтаж / моушн / промо / анимация / 3D для видео».
---

# motion-studio — тема → mp4

Темп работы: **не останавливайся на вопросы**, если тема ясна. Сам выбери угол, длину (Reels 35–60 с), язык пользователя,
9:16 по умолчанию для Reels/Shorts. Правки — после первой выдачи.

`${CLAUDE_SKILL_DIR}` — папка скилла. Кит: `~/motion-kit` (библиотеки, vendor/, py-whisper, py-tts).
Эталоны: `Desktop/MOTION/claude-reel` (моушн + 3D, этот шаблон), `Desktop/MOTION/market-epochs` (документальный монтаж),
`Desktop/MOTION/series` (диалоги двух маскотов, архивный движок), `~/tvhead-studio` (персонажи и сеты).

## Установка (один раз на машину)
1. Студия tvhead (голос, музыка, проверка): `bash "${CLAUDE_SKILL_DIR}/../tvhead-video/scripts/bootstrap.sh"` → `~/tvhead-studio`;
   ключ `OPENROUTER_API_KEY` в `~/tvhead-studio/.env` (бесплатная озвучка; ключ не спрашивать в чате).
2. Кит: `bash "${CLAUDE_SKILL_DIR}/scripts/setup-kit.sh"` (+ `--python` для Whisper и Chatterbox, `--plugins` для 28 Blender-скиллов и GSAP-скиллов).
3. Node ≥ 18, ffmpeg, Google Chrome; для 3D-плейтов — Blender 5.2 (скилл `blender-3d`).
Соседние скиллы этого плагина: `tvhead-video` (персонажи, 13+ лупов, приложение-студия), `ai-montage` (документальный
монтаж), `blender-3d` (3D-сцены и плейты).

## 0. Выбери стек (можно смешивать: плейты из Blender/tvhead → финал в Remotion)

| Что в кадре | Стек | Читать |
|---|---|---|
| Моушн, кинетика, шейдеры, частицы, морфинг, 3D-объект, воксельный маскот | **шаблон Remotion** (по умолчанию) | этот файл + `references/fx-libraries.md` |
| **«Снято на телефон»**: ноутбук с терминалом Claude Code в темноте, ручная камера, ГРИП, карточка результата, телефон | шаблон + `src/screen/` (`ScreenVideo`) | `references/phone-shot.md`, эталон `Desktop/MOTION/claude-screen` |
| **Аниме**: cel-shading + чёрные контуры, анимация «на двойках», жёсткие склейки, небо Синкая, сакура, спид-лайны, кадры удара, «БАМ!», карточки сил | шаблон + `src/anime/` (`AnimeVideo`) + `Clay toon` | `references/anime.md`, эталон `Desktop/MOTION/claude-anime` |
| **Cozy 3D**: тёплый «блендеровский» мир, глиняный маскот с эмоциями, экраны и вывески в мире, «NN/MM Инструмент» — **башня-лифт** (`TowerVideo`) или **съёмочная площадка** с хлопушкой, роботами и титрами (`SetVideo`) | шаблон + `src/cozy3d/` | `references/cozy3d.md`, эталоны `Desktop/MOTION/claude-tower`, `Desktop/MOTION/claude-set` |
| Реальные графики, фото, скриншоты, документалка, рынок, история | шаблон + `src/montage/lib.tsx` | `references/montage.md` |
| Персонажи, сеты, дудл/мультяшный рассказ, приложение-студия | скилл `tvhead-video` | его SKILL.md |
| Настоящая 3D-сцена, окружение, погода, риг | Blender 5.2 + плагин `blender-agent-skills` | `references/blender.md` |
| Шоурил-промо из HTML-сцен с партитурой | скилл `motion-graphics` | его SKILL.md |

Правило: **реальный материал — основа, моушн — слой поверх.** Цифры только посчитанные (в скрипте/данных), не придуманные.
Если число звучит в кадре («1 085 кубиков», «кадр 1 299»), оно берётся из кода/таймлайна.

## 1. Новый проект — одна команда, пять стилей
```bash
bash "${CLAUDE_SKILL_DIR}/scripts/new-project.sh" Desktop/MOTION/<slug> <style>
```
| style | Что получится | Компонент | Сценарий-образец | Справочник | Эталон |
|---|---|---|---|---|---|
| `reel` (по умолч.) | моушн: кинетика, шейдер-фон, частицы, морфинг, 3D-воксельный Клод, контактный лист | `Video` + `scenes.tsx` | `script.reel.mjs` | этот файл, `fx-libraries.md` | `claude-reel` |
| `tower` | cozy 3D: лифт по этажам, вывески NN/06, экраны в комнатах, крыша на закате | `cozy3d/TowerVideo` | `script.tower.mjs` (ids lobby, f1…f6, roof) | `cozy3d.md` | `claude-tower` |
| `set` | cozy 3D: съёмочная площадка, хлопушка «SCENE NN/08 ★», станции-инструменты, роботы, титры | `cozy3d/SetVideo` | `script.set.mjs` + `src/crew.ts` | `cozy3d.md` | `claude-set` |
| `anime` | аниме-опенинг: toon + контур, на двойках, склейки, небо, сакура, карточки сил, удар-кадр, «БАМ!» | `anime/AnimeVideo` | `script.anime.mjs` | `anime.md` | `claude-anime` |
| `screen` | «снято на телефон»: ноутбук с живым терминалом Claude Code, карточка результата, телефон с уведомлением | `screen/ScreenVideo` | `script.screen.mjs` | `phone-shot.md` | `claude-screen` |

Скрипт копирует шаблон, ставит зависимости, кладёт сценарий стиля в `tools/script.mjs`, подключает компонент в
`src/Root.tsx` и пресет музыки (hype / upbeat / epic / lofi). Для всех стилей кроме `reel` сначала `npm run voice`:
компоненты ключуют кадры по словам озвучки (`W(scene, line, "слово")`), а образцовый таймлайн принадлежит reel.
Меняешь тексты/сцены — движок остаётся. Эталоны лежат в `Desktop/MOTION/<эталон>`.

| Файл | Что внутри |
|---|---|
| `tools/script.mjs` | сцены → фразы: `say` (для голоса, числа словами) и `cap` |
| `tools/voice.mjs` | бесплатный Fish S2.1 (OpenRouter, ключ в `~/tvhead-studio/.env`) → `public/voice/*.mp3` + `src/timeline.json` (кадры фраз и слов). Кэш по фразе: правка одной фразы = переозвучка только её |
| `tools/music.mjs` | процедурная музыка tvhead (`hype` 150 BPM; есть lofi/ambient/upbeat/epic/chiptune/synthwave) |
| `tools/asr.mjs` | faster-whisper: что **услышит** зритель vs что в `say` |
| `tools/stills.mjs` | один бандл → стиллы по кадрам → `out/stills/sheet.jpg` |
| `tools/seams.mjs` | кадры до/после каждого стыка из готового mp4 |
| `tools/deliver.mjs` | мастер crf 18 yuv420p −14 LUFS точной длины, лимитер с 4× передискретизацией (true peak ≤ −1,5 dBTP даже с ударами) + копия ≤ 29 МБ + verify обоих |
| `src/lib.tsx` | таймлайн (`SC`, `L`, `LE`, `W(id, i, "слово")` — кадр слова, неверное слово роняет сборку), `Stage` (вход/выход сцены вип-блюром), `Captions` (караоке ≤4 слов), `Fonts`, `Grain`, изинги |
| `src/fx.tsx` | `useGsap`, `Morph`/`morph`, `Rough`, `Particles` (confetti/sparks/embers/snow), `Shader` |
| `src/Mascot3D.tsx` | маскот Claude: спрайт → 1 085 вокселей (InstancedMesh). `MState`: x, y (px экрана), s (px на воксель), rx/ry/rz, `build` (сборка из летящих кубиков), `explode`, `vanish`, `hop`, `blink`, `wire`, `walk` |
| `src/scenes.tsx` | 8 сцен-образцов + `mascotAt(f)` — где маскот в каждый момент |
| `src/Video.tsx` | слои: шейдер-фон (палитра на сцену) → ThreeCanvas (1 ед. = 1 px) → UI сцен → субтитры → зерно; звук: голос, музыка с даком 0.12/0.3, SFX-список |
| `src/cozy3d/` | Clay (глиняный маскот: 6 эмоций, моргание, wave/walk/hop, наушники, монокль), World (кабина лифта, 6 комнат, крыша, фасад, небо, `Glow`, `Wire`), tex (canvas-текстуры, шрифты+картинки до 3D), TowerVideo (лифт/двери/кран от таймлайна), FilmSet + SetVideo (площадка, хлопушка, станции, роботы, титры). Clay умеет `toon` (контур INK, TOON_RAMP), `band`, `shine`, `beret`, `mega` |
| `src/anime/` | AnimeVideo (SHOTS-склейки, на двойках, герой, баг, луч), AnimeFx (Sky, Petals, FocusLines, SpeedLines, Sfx, SkillCard, impactFilter) |
| `src/screen/` | ScreenVideo (стол, ноутбук, телефон, камера с руки, ГРИП-маска, экспозиция, шум), Terminal (drawTerminal — сессия Claude Code, drawCard — карточка результата) |
| `src/montage/lib.tsx` | монтажные компоненты market-epochs: Photo (Ken Burns), Series/Axes/Panel (свечи, линии, лог-шкала), Mk/ring/arrow/HandText (маркер), Stamp, Banknote (прожиг), Pixels-переход. Импортируй как `import * as M from "./montage/lib"` |
| `src/shaders/*.frag` | GLSL c `#include "lygia/..."` → `node tools/lygia-inline.mjs src/shaders/x.frag` → `import x from "./shaders/x.shader"` |

Образцы сцен в шаблоне (бери и меняй): кинетический заголовок по буквам + зачёркивание маркером + глитч; терминал
с печатью промпта в такт голосу; карточки сцен + волна + слова с реальными таймингами; «кадр = f(t)» + плитки
(шейдер / частицы / морфинг / живой текст); 3D-поворот с каркасом, взрывом кубиков и сеткой вьюпорта; контактный лист
с кругом на косяке и штампом; телефон со счётчиком кадров и конфетти; CTA с плашкой.

## 2. Конвейер (в таком порядке)
0. **Бриф** (если тема сырая): ≤5 вопросов одним пакетом — точные слова и цифры, формат и площадка, длина, бренд/цвета,
   референс. Если пользователь сказал «делай» — дефолты и вперёд, назвав их. Бренд есть → `brand.md` + `MOTION.md` в проекте
   (`external/charlie947/skills/brand-intake/RECIPE.md`). Бит-карта: дроп музыки на ключевой визуал.
1. **Сценарий** (`tools/script.mjs`). Хук ≤ 4 с и в первой фразе. 6–8 сцен, 1–2 фразы на сцену, ~150 слов/мин.
   Один тезис на ролик, финал — один CTA («Напиши в комментариях «СЛОВО»…»), последний кадр = пустой/как первый (луп).
   Бренды и термины пиши так, как надо **слышать**: «Клод Код», «эм-пэ-четыре», «три дэ», «джи-пи-ти».
2. **Голос** `npm run voice` → **слух** `npm run asr`. Если в «heard» бренд искажён — правь `say`, повтори voice.
   Голос RU по умолчанию «Энергичный Рассказчик» `48ec28a45588422b977a86460c11977f`; второй персонаж (Claude из сериала)
   `868377a7b08f4c0d9acf8c9f059571aa`. Офлайн-запасные: Chatterbox, Kokoro (`references/audio.md`).
3. **Музыка** `npm run music` (после voice — длина берётся из таймлайна).
4. **Сцены** (`src/scenes.tsx`, `src/Video.tsx`). Карточка плана на сцену (смысл, действие, текст, камера, звук, риск —
   `tvhead-video/references/direction.md`). Все акценты ключуй через `W(scene, line, "слово")`, не числами.
   Один главный приём на фразу. SFX — на действие в кадре (список `SFX` в Video.tsx).
5. **Стиллы** `npx tsc --noEmit -p . && npm run stills -- <кадр на сцену>` → **Read** `out/stills/sheet.jpg`.
   Чини: вылезание за край, наложения, пустоты, слишком мелкий текст, висящие кубики. 1–3 круга.
6. **Рендер** `npm run render` (в фоне, ~3–4 мин на 45 с) → `npm run seams` → **Read** `out/seams/seams.jpg`
   (рывки, поп-ап объектов на стыках).
7. **Выдача** `npm run deliver -- Desktop/MOTION <slug>` → все PASS → `SendUserFile` копии `_share`, мастер — ссылкой.
   В ответе: что в каждой сцене, что исправлено по ходу, что не проверено (смотреть/слушать целиком человеку).

## 3. Правила (выученные на наших роликах)
- **Детерминизм**: кадр = функция от `frame`. Никаких `Math.random`/`Date.now`/rAF; только `rand(seed)`.
  Realtime-библиотеки (tsParticles, Hydra, WebGL-Fluid, ShaderGradient, плеер Theatre) — только через аналоги в
  `fx.tsx` или с внешним временем (`references/fx-libraries.md`).
- **Плавность камеры**: дрожь/«ручная камера»/вобл — только `smoothNoise(f, period, seed)` из `lib.tsx` или синусы.
  Никогда `rand(Math.floor(f / n))` на камере: новое смещение раз в n кадров без сглаживания = видимый тик (так дёргался
  первый «телефон»). Тряска на ударе — затухающие синусы, не rand на каждый кадр.
- **«На двойках»** — только персонаж (и враги): камера, небо, частицы, лепестки идут каждый кадр, иначе весь кадр шагает.
- **Безопасная зона соцсетей** (Reels / TikTok / Shorts 1080×1920): слова и логотипы только в x 60…960, y 160…1420
  (`SAFE` в `lib.tsx`). Субтитры — на тёмной подложке с y 1250. Маскот и визуал могут уходить ниже — интерфейс
  приложения закрывает только низ и правый край. Горизонтальный ролик в Reel — рецепт `reel-export` (external).
- **Живые кадры**: кроме финального холда ничего не замирает; премиум = один объект превращается в другой;
  стаггер на долю бита; иллюстративные цифры подписывать «Пример».
- **Читаемость**: субтитры ≥ 56 px на 1920 (в шаблоне 66), подписи ≥ 32 px, ключевая цифра держится ≥ 1 с, поля ≥ 60 px.
  Широкие моно-формулы — ≤ 100 px. Шейдер/3D под текстом приглушай.
- **Многострочный кинетический текст** — разделитель `|`, по div на строку (inline-block-буквы не переносят `\n`).
- **3D**: скрытая сцена → `vanish: 1` (иначе разлетевшиеся воксели висят поверх). Переход маскота между сценами —
  через lerp позиции/масштаба, не прыжком. WebGL требует `Config.setChromiumOpenGlRenderer("angle")` (есть в шаблоне).
- **Постобработка**: `@react-three/postprocessing` в Remotion даёт чёрный кадр — свечение делаем ACES-тонмаппингом
  рендерера + `Glow`-спрайтами + DOM-виньеткой (`references/cozy3d.md`).
- **Canvas-текстуры**: шрифт грузить с кириллическим образцом (`document.fonts.load(font, "БАШНЯ abc")`), картинки —
  предзагрузкой до монтирования `ThreeCanvas` (поздний setState не перерисует кадр).
- **Референсы пользователя**: лист кадров `ffmpeg -vf fps=1.2,scale=320:180,tile=6x6`, деталь 960 px, звук через
  `faster-whisper` (есть ли речь), ритм — длительность пункта. Сохраняй в `Desktop/MOTION/refs-*`, выводы — в references.
- **Шейдеры**: выход инлайнера — `*.shader.ts` (имя `*.frag.ts` заставит webpack грузить сырой .frag).
- **Remotion 4.0.484, все `remotion*` пакеты одной версии, TypeScript 5.6** (TS 6 ломает бандлер).
- **Честность**: контактный лист и «косяки» в ролике — из настоящих кадров/черновика; числа — из кода.
- **Windows**: кириллица из Python — только в файл с `encoding='utf-8'`; Python для ML — venv'ы в `~/motion-kit`.
- Серии: «Кот-индикатор» — без футера «Сатира · не инвестсовет»; «Claude × Codex» — архивный движок `series/src/ar`.
- Голоса, имитирующие реальных людей, не брать; клонировать голос — только свой или с согласия.

## Справочники
- `references/montage.md` — документальный монтаж: данные (Yahoo, FRED, blockchain.info, Binance 1s), Commons с лицензиями, компоненты, SFX.
- `references/fx-libraries.md` — все моушн-библиотеки, детерминированные рецепты.
- `references/blender.md` — Blender 5.2 + MCP + 28 скиллов, плейты для монтажа.
- `references/audio.md` — голоса, faster-whisper, Chatterbox, музыка, SFX, сведение.
- `references/sources.md` — что установлено (в т.ч. anime.js, Scene.js, Konva, Zdog, Planck, regl, meshoptimizer, Mediabunny, RNNoise, Rubber Band, MeloTTS), что сознательно не ставили.
- `references/external-skills.md` — рецепты charlie947 (бриф, бренд, reel-export, Vox, 3D-титры, графики, 16 эффектов) и howseen (HTML-конвейер, сток, SFX) в `external/`; GSAP-скиллы плагином.
- `references/reference-reels.md` — разбор 8 референсов пользователя (башня, площадка, Tesseract, Awards, Motion Mart, учебник, аватар-explainer, «снято на телефон») и как повторить каждый.
- `references/anime.md` — аниме-канон и наш движок.
- `references/phone-shot.md` — псевдо-реальная съёмка экрана: камера с руки, ГРИП маской, автоэкспозиция, честный терминал.
- `references/cozy3d.md` — тёплый 3D: глиняный маскот, лифт-башня, съёмочная площадка, грабли постобработки и текстур.
- Рядом: `tvhead-video`, `motion-graphics`, `remotion-best-practices` (+captions/render/multimedia/docs), `blender-agent-skills:*`
  (начинать с `blender-core`, заканчивать `blender-asset-qa`), darkugc MCP (`top_hooks`, `get_video`) для хуков.
