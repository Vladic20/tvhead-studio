# Звук: голос, тайминги, музыка, SFX

## Голос (по умолчанию бесплатно)
1. **Fish S2.1 free через OpenRouter** — `~/tvhead-studio/lib/voice.mjs` (ключ `OPENROUTER_API_KEY` в `~/tvhead-studio/.env`,
   никогда не спрашивать в чате). Голос RU по умолчанию «Энергичный Рассказчик» `48ec28a45588422b977a86460c11977f`.
   Поиск голосов: `cd ~/tvhead-studio && node voices.mjs deep calm --lang ru`. Голоса-имитации реальных людей не брать.
   403 «Access denied by security policy» = Node fetch мимо прокси песочницы: импортируй `lib/net.mjs`.
2. **Chatterbox** (локально, офлайн, Resemble AI, MIT) — venv `~/motion-kit/py-tts`:
   ```bash
   ~/motion-kit/py-tts/Scripts/python.exe -c "from chatterbox.tts import ChatterboxTTS; import torchaudio as ta; m=ChatterboxTTS.from_pretrained(device='cpu'); w=m.generate('Hello there'); ta.save('out.wav', w, m.sr)"
   ```
   Английский из коробки; для RU — `from chatterbox.mtl_tts import ChatterboxMultilingualTTS`,
   `m.generate(text, language_id='ru')`. Первая загрузка
   весов ~2–3 ГБ. Torch в venv — CPU-сборка (2.6.0+cpu); медленнее Fish, но бесплатно без лимитов.
   Клонирование голоса (`audio_prompt_path`) — только своего голоса или с согласия владельца.
3. **Kokoro 82M** — `~/tvhead-studio/films/promo3d/kokoro` (EN, голос am_michael), самый быстрый офлайн-запасной.

## Тайминги слов и субтитры
**faster-whisper** — venv `~/motion-kit/py-whisper`:
```bash
~/motion-kit/py-whisper/Scripts/python.exe -I -c "
from faster_whisper import WhisperModel; import json,sys
m=WhisperModel('small', device='cpu', compute_type='int8')
segs,_=m.transcribe(sys.argv[1], language='ru', word_timestamps=True)
print(json.dumps([[w.word.strip(), round(w.start,3), round(w.end,3)] for s in segs for w in s.words], ensure_ascii=False))
" voice.wav > words.json
```
Модель `small` — баланс для CPU; `medium` точнее. Слова → `Captions` (караоке ≤ 4 слова) или `@remotion/captions`
(скилл `remotion-captions`). Бесплатно и офлайн — это замена платного STT (`TVHEAD_STT=on`).

## Музыка
- `renderMusic({ preset })` из `~/tvhead-studio/lib/music.mjs` — процедурная, бесплатная: lofi, ambient, upbeat, epic,
  chiptune, synthwave, hype. Дак под голос 0.13 / 0.3.
- Tone.js (`~/motion-kit/node_modules/tone`) — своя партитура кодом через `Tone.Offline` → WAV (см. fx-libraries.md).

## SFX
Библиотека video-shotcraft `assets/audio/sfx` (бесплатная лицензия): whoosh — переход, marker-pen-line — штрих маркера,
bass-hit + sand-swish — сгорание, монета — счётчик, glass-break — лопнуло. Звук только на действие в кадре.

## Сведение
ffmpeg: голос −16 LUFS, музыка под даком, итог −14 LUFS, true peak ≤ −1 dBTP (`loudnorm=I=-14:TP=-1`).

## Проверка произношения (faster-whisper, вывод в файл — консоль Windows ломает кириллицу)
```bash
~/motion-kit/py-whisper/Scripts/python.exe -I -c "
from faster_whisper import WhisperModel
m=WhisperModel('small', device='cpu', compute_type='int8'); o=open('asr.txt','w',encoding='utf-8')
for f in ['public/voice/prompt-0.mp3']: s,_=m.transcribe(f, language='ru'); o.write(f+' | '+' '.join(x.text for x in s)+'\n')"
```
Пример: «Claude Code» в say → Fish читает «клоуд-код»; пиши «Клод Код».
