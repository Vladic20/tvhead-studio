---
name: ai-montage
description: Документальный ИИ-монтаж роликов (9:16 и 16:9) в Remotion из реальных материалов — графики из настоящих данных (Yahoo, FRED, Binance, blockchain.info), архивные фото и иллюстрации с лицензиями (Wikimedia Commons), обложки, скриншоты; маркер поверх, счётчики, штампы, Ken Burns, пиксельные переходы, бесплатная озвучка, SFX. Честная математика и подписи источников. Используй для «смонтируй ролик из графиков/фото», документалка, рынок, история, «что было бы, если вложить…», Vox-style explainer, инфографика на реальных источниках.
---

# ai-montage — документальный монтаж из реальных материалов

Главное правило: **кадр = реальный материал** (архивное фото, график из выгруженных данных, скриншот), моушн — только
слой поверх: маркер, зум, счётчик, штамп, переход. Цифры считаются в скрипте, в кадре — условия и источник.

## Старт
```bash
bash "${CLAUDE_SKILL_DIR}/../motion-studio/scripts/new-project.sh" Desktop/MOTION/<slug> reel
```
Это шаблон motion-studio (озвучка, таймлайн по словам, стиллы, стыки, выдача −14 LUFS, безопасная зона соцсетей).
Монтажные компоненты — `src/montage/lib.tsx` (`import * as M from "./montage/lib"`): `Photo` (Ken Burns, сепия, credit),
`makeScale` + `Series` (свечи/линия/area, лог-шкала, прогрессивная отрисовка) + `Axes` + `Panel` (зум в свечу),
`Mk`/`ring`/`arrow`/`HandText` (маркер), `Stamp`, `Banknote` (прожиг), `Money`, `tween`, `Pixels`, `Grain`, `Backdrop`.
Сцены-образцы `src/scenes.tsx` замени своими (эталон с реальными данными: `Desktop/MOTION/market-epochs`).

## Конвейер (полностью: `../motion-studio/references/montage.md`)
1. Сюжет → сцены → фразы (`tools/script.mjs`: `say` числа словами, `cap` с цифрами). Хук ≤ 4 с.
2. **Данные**: Yahoo chart API (`query1.finance.yahoo.com/v8/finance/chart/<sym>?period1=…&interval=1d`), FRED CSV,
   blockchain.info, Binance klines (есть `interval=1s` исторически), Open-Meteo archive. Stooq закрыт JS-проверкой — не обходить.
   Любой итог (депозит, доходность) — механически в скрипте, в кадре условия симуляции + «Не инвестсовет».
3. **Материалы с лицензиями**: Commons `list=categorymembers` (лучше поиска) / `list=search&srnamespace=6` →
   `prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1600`, пауза ≥ 3 с между запросами; автор и лицензия — `credit` в кадре.
   Всегда смотри контактный лист: поиск Commons часто приносит не то (не тот доллар, не то здание, чужое лицо).
4. Голос → `npm run voice` → `npm run asr` (проверка произношения) → `npm run music`.
5. Сцены → `npm run stills -- …` → Read листа → правки → `npm run render` → `npm run seams` → `npm run deliver -- <dest> <name>`.

## Стили документалки
- Тёмный терминал с графиками и маркером (market-epochs), тетрадь-«sheet» (Кот-индикатор), архивный движок
  с реальными картинками и камерой по фото (`Desktop/MOTION/series/src/ar`).
- Vox-style: рваная бумага, полутон, жирный узкий шрифт, движение на двойках — рецепт
  `../motion-studio/external/charlie947/skills/vox-explainer/RECIPE.md`.
- Анимированный график для LinkedIn/рассылки — `../motion-studio/external/charlie947/skills/animated-chart/RECIPE.md`.

## Правила
- Один главный приём на фразу; ключевая цифра держится ≥ 1 с; без дрожи камеры (зум inOut cubic).
- Звук = действие: маркер скрипит, монета звенит, купюра горит.
- Никогда не ставить узнаваемого частного человека под подпись про чужую историю.
- Серия «Кот-индикатор» — без футера «Сатира · не инвестсовет».
