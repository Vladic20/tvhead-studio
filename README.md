# tvhead studio: from a topic to a finished motion video

A [Claude Code](https://claude.com/claude-code) skill and a local app. You write a topic and get a **ready mp4 at 1920×1080** with narration in **English, Russian or both**. The style is hand-drawn and black-and-white: TV-headed figures on grey paper, floating doodles, "boiling" pencil lines and film grain.

![One frame per scene of the demo episode](docs/tvhead-preview.jpg)

**Contents:** [Русский](#по-русски) · [English](#english)

---

## По-русски

### Что умеет
- **Озвучка бесплатно.** Fish Audio S2.1 (free) через OpenRouter, с любым голосом из библиотеки fish.audio или твоим клоном (ID из ссылки `fish.audio/m/<id>`).
- **EN, RU или оба.** Картинка одна, у каждого языка своя озвучка и свой тайминг. На выходе `out/<тема>.en.mp4` и `out/<тема>.ru.mp4`, к каждому `.srt`.
- **Монтаж как у моушн-дизайнера.** Переходы с совпадающей скоростью (cut-the-curve, zoom-through, inverse zoom), а также whip-pan, iris, шторка и «новый лист». Кинетический текст, где слова появляются ровно в момент произнесения. Инфографика: счётчики, графики, чек-листы, сетка «один не такой».
- **Персонажи живые.** Около 20 поз, 17 лиц, предвосхищение движения, доигрывание антенн, сжатие при приземлении. Около 50 пропов.
- **Темы и референсы.** Шесть палитр: серая бумага, сепия, blueprint, мел, ночь, мята. Или загрузи свои кадры, и Claude возьмёт из них палитру и ритм. Фото можно вставить в ролик полароидом.
- **Свои анимации.** Для нестандартных сцен есть GSAP-таймлайны прямо в эпизоде.
- **Быстро.** 50 секунд 1080p рендерятся примерно за 30 секунд на 16 потоках.

### Приложение
![Раскадровка в приложении](docs/app-storyboard.jpg)

1. Запусти `start-app.cmd` (Windows), `./start-app.sh` или `npm run app` в папке студии. Откроется http://localhost:4777.
2. Выбери язык (EN / RU / EN + RU), стиль или приложи референсы, напиши тему.
3. Напиши Claude в чате: **«проверь tvhead-приложение»**. Он начнёт слушать приложение (в шапке загорится «Claude на связи»), возьмёт бриф и соберёт сценарий и раскадровку с переходами.
4. Проверь кадры, поправь текст прямо в карточках или отправь правки. Нажми **«Рендерить»**.
5. Смотри и скачивай готовые видео тут же.

Можно обойтись без чата: режим «Claude Code CLI в фоне» сам вызывает `claude -p`.

![Готовые видео](docs/app-done.jpg)

### Установка
```
/plugin marketplace add Vladic20/tvhead-studio
/plugin install tvhead@tvhead-studio
```
Нужны Node ≥ 18, ffmpeg и Google Chrome. При первом запуске скилл разворачивает студию в `~/tvhead-studio`.

Ключ кладётся в `~/tvhead-studio/.env`:
```
OPENROUTER_API_KEY=sk-or-v1-...
```
Взять его можно на https://openrouter.ai/keys. Модель по умолчанию бесплатная, но у бесплатных моделей OpenRouter есть лимиты: около 20 запросов в минуту и дневной потолок. Платный вариант с более «актёрской» подачей: `TVHEAD_TTS_MODEL=fish-audio/drama-3` (примерно $2 за миллион символов). Ключ Fish Audio нужен только при платном Fish API-кредите: бесплатные кредиты сайта на API не действуют.

### Без приложения
Просто попроси Claude: *«Сделай видео на тему почему мы откладываем дела, 60 секунд, на русском и английском»*.

Команды внутри студии:
```bash
node make.mjs demo --stills auto   # кадр на сцену → episodes/demo/build/<lang>/sheet.png
node make.mjs demo --preview       # быстрый черновик 720p
node make.mjs demo                 # финал 1080p для всех языков
node voices.mjs спокойный --lang ru   # поиск голосов Fish (без ключа)
```

---

## English

### Features
- **Free narration.** Fish Audio S2.1 (free tier) via OpenRouter with any fish.audio voice or your own clone (the id from `fish.audio/m/<id>`).
- **EN, RU or both from one story.** The pictures are shared; each language gets its own voice and timing. Output is `out/<slug>.<lang>.mp4` plus `.srt`.
- **Motion-designer editing.**
  - Velocity-matched seams: cut-the-curve, zoom-through and inverse zoom, plus whip pan, iris, wipe and page.
  - Kinetic type that lands on the spoken word.
  - Doodle infographics: counter, bars, pie, progress, timeline, checklist, odd-one-out grid.
- **A living rig.** About 20 poses, 17 faces, anticipation, antenna follow-through, squash on landing, and about 50 props.
- **Themes and references.** Six palettes, or upload frames and Claude derives the palette and pacing. User photos can go in as polaroids.
- **Custom motion.** For one-off scenes, use GSAP timelines (seeked, deterministic) inside the episode.
- **Fast.** About real time: 50 s of 1080p renders in about 30 s on 16 threads.

### The app
Run `start-app.cmd` / `./start-app.sh` / `npm run app` in the studio. Then:
1. Pick the languages and a style or reference, and enter the topic.
2. Tell Claude *"check the tvhead app"*. Claude listens through `node app/bridge.mjs wait`, writes the storyboard and renders the stills.
3. Review, edit or send feedback, then press **Render**.

A headless mode runs `claude -p` for you.

### Install
```
/plugin marketplace add Vladic20/tvhead-studio
/plugin install tvhead@tvhead-studio
```
Needs Node ≥ 18, ffmpeg and Google Chrome. Put `OPENROUTER_API_KEY=` into `~/tvhead-studio/.env`.

### What's inside
```
plugins/tvhead/skills/tvhead-video/
  SKILL.md                 the workflow Claude follows (chat requests and app jobs)
  references/              story.json API, motion rules, writing guide, reference sheet
  scripts/bootstrap.sh     deploy/refresh the studio (~/tvhead-studio)
  template/
    make.mjs               story.json → voice → timeline → frames → mix → mp4 (per language)
    app/                   local studio app: server, Claude bridge, UI
    engine/                SVG drawing: paper, doodles, rig, props, kinetic type, transitions
    lib/                   story → timeline, TTS + alignment, sound, parallel frame capture
```

### Credits
- The motion rules are distilled from open skills: [HyperFrames](https://github.com/heygen-com/hyperframes), [GSAP skills](https://github.com/greensock/gsap-skills), [Charlie's motion-graphics-skills](https://github.com/charlie947/motion-graphics-skills), [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft), [product-launch-motion](https://github.com/AbubakrChan/product-launch-motion) and [claude-motion-design](https://github.com/howseen-ai/claude-motion-design). More are listed in [awesome-claude-video-skills](https://github.com/zhuyansen/awesome-claude-video-skills).
- The code-rendering approach started from [garazh-skill](https://github.com/lubluniky/garazh-skill) (MIT).
- Fonts: Patrick Hand and Neucha (SIL OFL 1.1). GSAP uses its standard no-charge license.
- The voices are Fish Audio voice models, used under Fish Audio's terms. Don't use voices that imitate real people without their consent.

MIT, see [LICENSE](LICENSE).
