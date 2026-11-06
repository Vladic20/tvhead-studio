---
name: blender-3d
description: 3D-сцены и плейты для роликов в Blender 5.2 — модель, окружение, свет, анимация, рендер EEVEE/Cycles в PNG с альфой или mp4, чтобы вставить в монтаж Remotion/tvhead. Готовый стартовый скрипт с глиняным маскотом Клода (cozy-свет или toon с контуром, поворотный стол, прыжок). Работает через Blender MCP в открытом Blender или headless-скриптом bpy; для сложных задач опирается на 28 Blender Agent Skills (модели, риг, PBR, погода, время суток, QA). Используй, когда нужна настоящая 3D-сцена, модель, «сделай в Blender», 3D-плейт для ролика, low-poly мир, турнтейбл продукта.
---

# blender-3d — 3D из Blender для роликов

`${CLAUDE_SKILL_DIR}` — папка скилла. Соседний скилл `motion-studio` собирает финальный ролик.

## 0. Где Blender
- Windows: `C:/Program Files/Blender Foundation/Blender 5.2/blender.exe` (в PATH обычно нет), macOS:
  `/Applications/Blender.app/Contents/MacOS/Blender`, Linux: `blender` или распакованный архив. Переменная `BLENDER` перекрывает.
- Нет Blender → скачать LTS с blender.org (5.2+), на Windows ставит пользователь (нужны права администратора).
- **Blender MCP** (`mcp__Blender__*`) — если Blender открыт с аддоном: правки прямо в сцене, скриншоты окна.
  Без него — headless: `"<blender>" -b --factory-startup -P script.py -- <args>`.
- **Blender Agent Skills** (28 скиллов EL4CTEO): `blender-agent-skills:blender-core` первым, `blender-asset-qa` последним.
  Если не установлены: `claude plugin marketplace add EL4CTEO/blender-skills` → `claude plugin install blender-agent-skills@blender-agent-skills`
  (с согласия пользователя — это настройка Claude Code).

## 1. Быстрый плейт: маскот Клода (проверено на Blender 5.2.1)
```bash
"<blender>" -b --factory-startup -P "${CLAUDE_SKILL_DIR}/scripts/plate.py" -- --out out/plate --frames 60 --res 1080x1920 --look cozy --shot turntable
```
- `--look cozy` — тёплый студийный свет, AgX Punchy, мягкие тени на диске-shadow-catcher.
- `--look toon` — cel-shading (Shader to RGB → ColorRamp constant, 3 тона) + чёрный контур (solidify inverted hull).
- `--shot turntable | hop | still`, `--engine EEVEE|CYCLES`, `--samples`, `--blend scene.blend` (сохранить сцену для правок).
- Выход: `out/plate/f_0001.png…` RGBA (прозрачный фон) или `still.png`.
На GTX 1050 Ti: EEVEE 540×960 — секунды на кадр; 1080×1920 — ~5–15 с; Cycles только для стиллов.

## 2. Своя сцена
1. Скрипт bpy строит всё кодом (как `plate.py`): объекты → материалы → свет → камера → анимация → рендер. Сохраняй
   `.py` + `.blend` + рендеры рядом; правки — точечно в скрипте («флаги синими», «камера на уровень глаз»), не с нуля.
2. Агент не видит модель: после каждого шага рендер/скриншот → Read → исправить (висящие объекты, щели, пересечения).
3. Начинать с low-poly, большие сцены — модулями (коллекции); перед выдачей `blender-asset-qa`.
4. Погода/время суток/окружение/риг — соответствующий `blender-agent-skills:*`.

## 3. В ролик
- В Remotion (`motion-studio`): PNG-секвенция в `public/plates/<name>/` →
  `<Img src={staticFile(\`plates/x/f_${String(frame + 1).padStart(4, "0")}.png\`)} />`, или mp4 → `<OffthreadVideo>`.
  Кадры плейта = кадры ролика (fps 30), камера плейта рассчитывается под тайминг фразы (`W(scene, line, "слово")`).
- В three.js: экспорт glTF (`blender-export-pipelines` → web, сжатие meshoptimizer) → `useGLTF`.
- Кэш: не перерендерить плейт, если скрипт и аргументы не менялись (хэш в имени папки).
Подробнее: `../motion-studio/references/blender.md`.
