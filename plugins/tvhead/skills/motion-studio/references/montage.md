
# ai-montage — монтаж из реальных материалов

Главное правило: **кадр = реальный материал** (архивное фото, архивный график, свечи из выгруженных данных, обложка, скриншот), а моушн — только слой поверх: маркер, зум, счётчик, штамп, переход. Ролик без реальных материалов — не этот скилл.

Эталонный проект: `Desktop/MOTION/market-epochs` (src/lib.tsx — все компоненты, src/scenes.tsx — сцены, tools/ — данные/озвучка/музыка).

## Конвейер (6 шагов, без остановок)

1. **Сюжет → сцены → фразы.** `tools/script.mjs`: сцена = 2–5 фраз; у фразы `say` (числа словами для TTS) и `cap` (коротко, с цифрами). Хук ≤ 6 с, эпоха 12–18 с, финал с CTA-вопросом.
2. **Данные и честная математика.** Котировки: Yahoo chart API (`query1.finance.yahoo.com/v8/finance/chart/<sym>?period1=…&interval=1d`, ^GSPC с 1927), FRED CSV (`fredgraph.csv?id=DCOILWTICO`, `WTISPLC`), blockchain.info (`api.blockchain.info/charts/market-price?timespan=all`). Stooq закрыт JS-проверкой — не обходить. Любые «итоговые суммы» считай механически в скрипте (см. `data/prep.mjs`: система черепах 20/10, стоп 2N, риск 2 %) и пиши в кадре условия симуляции + «Не инвестсовет». Цифры в озвучке = цифры из скрипта, без украшений.
3. **Материалы с лицензиями.** Wikimedia Commons API: `list=search&srnamespace=6` → `prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1600` (лицензия и автор в extmetadata; паузы ≥3 с между запросами, иначе rate limit). SVG-графики Commons приходят PNG-превью. Обложки книг: `covers.openlibrary.org/b/isbn/<ISBN>-L.jpg?default=false` (как цитата). Подпись источника — в каждом кадре с фото (`credit`).
4. **Озвучка.** `tools/voice.mjs` вызывает `~/tvhead-studio/lib/voice.mjs` (Fish S2.1 free через OpenRouter, ключ в `~/tvhead-studio/.env`), пишет `src/timeline.json`: кадры начала каждой фразы, длительность и тайминги слов. Вся анимация ключуется от `L[i]` = начало фразы i — сменили текст, перегенерили, монтаж сам сдвинулся. Голос по умолчанию RU «Энергичный Рассказчик» 48ec28a45588422b977a86460c11977f.
5. **Монтаж (Remotion 4, TypeScript 5.x — с TS 6 бандлер падает).** Компоненты из `src/lib.tsx`:
   - `Photo` — Ken Burns + sepia для архива + credit; `ArchiveChart` — картинка во viewBox, маркер рисует в пикселях исходника.
   - `makeScale` + `Series` (candle/line/area, лог-шкала, прогрессивная отрисовка) + `Axes` внутри `Panel`. Зум «в свечу»: `Panel transform/origin` (масштабируется svg внутри overflow:hidden).
   - Маркер: `Mk` (stroke по pathLength), `ring` (кривой круг с перехлёстом), `arrow`, `HandText` (рукописный Neucha, раскрытие слева направо), `Stamp` (штамп-удар).
   - Деньги: `Banknote` (своя купюра, не копия реальной; `burn` 0→1 — прожиг маской с турбулентностью + искры), `Money`, `tween`, HUD-счётчики.
   - `Captions` — караоке по таймингам слов, ≤4 слова, текущее — золотом. `Pixels` — пиксельный переход между сценами. `Grain` + `Backdrop` — фактура.
6. **Звук и проверка.** Музыка — процедурная `renderMusic({preset:"epic"})` из tvhead (бесплатно), с даком под голос (0.13 / 0.3). SFX из video-shotcraft (`assets/audio/sfx`, бесплатная лицензия): whoosh на переход, marker-pen-line на каждый штрих маркера, bass-hit + sand-swish на сгорание, синтезированная монета на рост счётчика, glass-break на лопнувшее плечо. Перед рендером — `npx remotion still --frame=N --scale=0.4` по кадру на сцену, склейка в лист через ffmpeg hstack/vstack, глазами проверить наложения. Рендер: `npx remotion render src/index.ts Epochs out/x.mp4 --crf=18`.

## Правила вкуса (из video-shotcraft aesthetic-rules)
- Один главный приём на фразу; ключевая цифра держится ≥1 с.
- Текст, который надо прочитать: субтитры ≥56 px на 1920, подписи ≥32 px.
- Без дрожи камеры; зум — плавный inOut cubic, обратно тем же.
- Звук = действие в кадре (маркер скрипит, монета звенит), не случайные «вжухи».
- Детерминизм: никакого Math.random/Date.now — только `rand(seed)`.

## Источники приёмов
- video-shotcraft — пайплайн, эстетические правила, SFX-библиотека, идея «реальные материалы + 2.5D-камера».
- brag — бриф/сториборд перед композицией, музыкальные cue-метки.
- Remotion templates / rendercomp / locomotion / ali-abassi — пиксельный переход, счётчики, графики; diffusion.studio — альтернатива как редактор с ручной правкой таймлайна.
