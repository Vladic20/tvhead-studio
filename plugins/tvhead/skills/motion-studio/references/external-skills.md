# Чужие моушн-пакеты в нашем скилле (MIT) и что из них взято

Лежат в `${CLAUDE_SKILL_DIR}/external/` как **рецепты** (`RECIPE.md`, не отдельные скиллы — чтобы не спорили с нашим
роутером). Читай рецепт, когда задача совпадает; движок и выдача — наши (Remotion-шаблон, `deliver.mjs`), либо их
HTML+`seek(t)`-движок, если нужен лёгкий луп/GIF.

| Нужно | Рецепт | Откуда |
|---|---|---|
| Сначала бриф, а не сборка | `charlie947/skills/motion-brief-writer` — ≤5 вопросов одним пакетом (точные слова и цифры, размер, длина, бренд), затем build-prompt: размер, секунды, 4 состояния start→change→hold→return | charlie947 |
| Фирменный стиль | `charlie947/skills/brand-intake` → `brand.md` + `MOTION.md` (цвета, шрифты, тайминг, правила движения) в папке проекта | charlie947 |
| Повторить чужой ролик | `charlie947/skills/reference-to-motion` + наш порядок разбора (`references/reference-reels.md`) | charlie947 |
| Горизонталь → Reel/TikTok | `charlie947/skills/reel-export` — хук 2 строки сверху, видео на y≈660, H.264 yuv420p `color_range=tv` bt709, faststart, логотип на тёмной плашке | charlie947 |
| Анимированный график для LinkedIn/рассылки | `charlie947/skills/animated-chart` (значения — ровно как даны) | charlie947 |
| Число из «звёздного неба» частиц (подписчики, выручка) | `charlie947/skills/milestone-reveal` | charlie947 |
| Документалка в духе Vox: рваная бумага, полутон, жирный узкий шрифт, на двойках | `charlie947/skills/vox-explainer` — сочетать с `references/montage.md` | charlie947 |
| 3D-титры с пролётом камеры по сцене (неоновые вывески, дождь) | `charlie947/skills/title-sequence-3d` (three.js) — сочетать с нашим cozy3d | charlie947 |
| Запуск продукта 30–45 с, Apple-стиль | `launch-video`, `apple-launch-film` | charlie947 |
| 16 премиум-эффектов (кнопка → плеер, бары → линия…) | `motion-effects` | charlie947 |
| Луп-обложка/GIF, промо рассылки, сравнение моделей | `loop-cover`, `newsletter-promo`, `model-showdown` | charlie947 |
| Полный HTML-конвейер: brief → beat map → stills → seek(t) → Playwright → ffmpeg → музыка/SFX → QA; поиск стока (Mixkit, Pexels, Unsplash, svgl) | `howseen/PIPELINE.md` + `howseen/scripts/` (render/audio-шаблоны, анализ трека, Mixkit SFX, svgl-логотипы) | howseen |

Не нашли: `Miftahul-Islam-Efaz/Motion-graphics-skill` (ссылка из поста мёртвая). Близкое уже стоит: скилл
`motion-graphics` (Mort1d) — HTML-сцены с моушн-блюром и партитурой. Официальные `remotion-dev/skills` и
`greensock/gsap-skills` (плагин `gsap-skills`: core, timeline, plugins/SplitText, utils, performance, react) установлены.

## Правила, перенесённые в наш конвейер (SKILL.md §3)
- **Безопасная зона Reels/TikTok/Shorts**: текст и логотипы — x 60…960, y 160…1420 (`SAFE` в `lib.tsx`); нижние
  ~500 px и правые 120 px закрывает интерфейс приложения. Визуал туда можно, слова — нет.
- «Премиум» = **один объект превращается в другой**; призрак начального состояния помогает глазу.
- **Нет мёртвых кадров** кроме финального холда: в холде что-то малое живёт (дрейф, мерцание).
- **Стаггер на долю бита**, не всё сразу; следующий план входит уже в движении по направлению выхода предыдущего.
- **Музыкальный дроп — на ключевой визуал** (бит-карта до сборки).
- **Ни одной выдуманной цифры без пометки**: иллюстративное — «Пример» / «Иллюстрация» прямо в кадре.
- **Критики отдельными агентами** (моушн и дизайн, только чтение, «по умолчанию отклонить») на больших роликах — потом
  правки и v2.
- Короткий тестовый ролик/кадры **до** длинного рендера; сначала бриф и этапы.
