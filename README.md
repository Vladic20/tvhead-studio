# tvhead studio: from a topic to a finished motion video

A [Claude Code](https://claude.com/claude-code) skill and a local app. Type a topic and get a **finished 1920×1080 mp4** narrated in **English, Russian or both**. The style is hand-drawn and black-and-white: TV-headed stick figures on grey paper, floating pencil doodles, boiling lines and film grain.

![One frame per scene of the demo episode](docs/tvhead-preview.jpg)

## Features

- **Free narration.** Fish Audio S2.1 (free tier) runs through OpenRouter. Use any voice from the fish.audio library or your own clone: the id is in the link, `fish.audio/m/<id>`.
- **EN, RU or both from one story.** The pictures are shared, and each language gets its own voice and timing. You get `out/<slug>.en.mp4` and `out/<slug>.ru.mp4`, each with an `.srt`.
- **Edited like a motion designer would.**
  - Velocity-matched transitions: cut-the-curve, zoom-through and inverse zoom, plus whip pan, iris, wipe and page.
  - Kinetic type: each word lands exactly when it is spoken.
  - Doodle infographics: counter, bars, pie, progress, timeline, checklist and an odd-one-out grid.
- **A living rig.** About 20 poses and 17 faces. The figures anticipate moves, their antennas swing after a move, and they squash on landing. There are about 50 props.
- **Themes and references.** Six palettes: grey paper, sepia, blueprint, chalkboard, night and mint. You can also upload your own frames, and Claude takes the palette and pacing from them. User photos can appear in the video as taped polaroids.
- **Custom motion.** For one-off scenes, write GSAP timelines (seeked and deterministic) inside the episode.
- **Fast.** Rendering runs at about real time: 50 s of 1080p takes about 30 s on 16 threads.

## The app

![Storyboard in the app](docs/app-storyboard.jpg)

1. In the studio folder, run `start-app.cmd` (Windows), `./start-app.sh` or `npm run app`. It opens http://localhost:4777.
2. Pick the languages (EN / RU / EN + RU), choose a style or drop in reference images, and type the topic.
3. Tell Claude in chat: **"check the tvhead app"**. Claude starts listening to the app (the header shows "Claude is listening"), picks up the brief, and writes the script and a storyboard with transitions.
4. Review the frames. You can edit the narration right in the cards or send feedback. Then press **Render**.
5. Watch and download the finished videos in the app.

You can also skip the chat: the "Claude Code CLI in the background" mode runs `claude -p` for you.

![Finished videos in the app](docs/app-done.jpg)

## Install

```
/plugin marketplace add Vladic20/tvhead-studio
/plugin install tvhead@tvhead-studio
```

You need Node ≥ 18, ffmpeg and Google Chrome. On first use the skill sets up its studio in `~/tvhead-studio`.

Put your key into `~/tvhead-studio/.env`:

```
OPENROUTER_API_KEY=sk-or-v1-...
```

Get a key at https://openrouter.ai/keys.

- The default model is free, but OpenRouter limits free models to about 20 requests per minute plus a daily cap.
- For a more "acted" delivery, set the paid model `TVHEAD_TTS_MODEL=fish-audio/drama-3` (about $2 per million characters).
- A Fish Audio key only works with paid Fish API credit. The free fish.audio plan credits don't apply to the API.
- Captions and cues use free word timing aligned on the audio's pauses. For more precise sync, set `TVHEAD_STT=on` (Whisper, about $0.0002 per minute).

## Without the app

Just ask Claude: *"Make a 60-second video about why we procrastinate, in English and Russian."*

Commands inside the studio:

```bash
node make.mjs demo --stills auto     # one frame per scene → episodes/demo/build/<lang>/sheet.png
node make.mjs demo --preview         # fast 720p draft
node make.mjs demo                   # final 1080p for every language
node voices.mjs deep calm --lang en  # search Fish voices (no key needed)
```

## What's inside

```
plugins/tvhead/skills/tvhead-video/
  SKILL.md                 the workflow Claude follows (chat requests and app jobs)
  references/              story.json API, motion rules, writing guide, reference sheet
  scripts/bootstrap.sh     sets up or refreshes the studio (~/tvhead-studio)
  template/
    make.mjs               story.json → voice → timeline → frames → mix → mp4, once per language
    app/                   local studio app: server, Claude bridge, UI
    engine/                SVG drawing: paper, doodles, rig, props, kinetic type, transitions
    lib/                   story → timeline, TTS and alignment, sound, parallel frame capture
```

## Credits

- The motion rules are distilled from open skills: [HyperFrames](https://github.com/heygen-com/hyperframes), [GSAP skills](https://github.com/greensock/gsap-skills), [Charlie's motion-graphics-skills](https://github.com/charlie947/motion-graphics-skills), [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft), [product-launch-motion](https://github.com/AbubakrChan/product-launch-motion) and [claude-motion-design](https://github.com/howseen-ai/claude-motion-design). For more, see [awesome-claude-video-skills](https://github.com/zhuyansen/awesome-claude-video-skills).
- The code-rendering approach started from [garazh-skill](https://github.com/lubluniky/garazh-skill) (MIT).
- Fonts: Patrick Hand and Neucha (SIL OFL 1.1). GSAP is used under its standard no-charge license.
- Voices are Fish Audio voice models, used under Fish Audio's terms. Don't use voices that imitate real people without their consent.

MIT, see [LICENSE](LICENSE).
