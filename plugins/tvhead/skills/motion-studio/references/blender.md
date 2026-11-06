# Blender: 3D-сцены и плейты для монтажа

- Blender **5.2.1 LTS**: `C:/Program Files/Blender Foundation/Blender 5.2/blender.exe` (в PATH его нет — вызывай по полному пути).
- **Blender MCP** подключён (инструменты `mcp__Blender__*`: execute_blender_code, скриншоты окна, рендер вьюпорта,
  поиск по API и мануалу). Работает, только когда Blender открыт с включённым MCP-аддоном. Без него — headless:
  `"<blender.exe>" -b -P build.py -- <args>`.
- **Blender Agent Skills** (EL4CTEO, 28 скиллов) установлены плагином `blender-agent-skills@blender-agent-skills`.
  Начинай с `blender-core` (маршрутизация задач, правила API 5.x), в конце — `blender-asset-qa`
  (z-fighting, висящие детали, нормали, веса, текстуры). Копия репо: `~/motion-kit/vendor/EL4CTEO_blender-skills`.
  Полезные для видео: `blender-lighting-lookdev`, `blender-time-of-day`, `blender-weather-fx`, `blender-environment-kits`,
  `blender-stylized-npr`, `blender-rendering`, `blender-animation`, `blender-simulation`, `blender-workflow-recipes`.
- Видеокарта GTX 1050 Ti (4 ГБ): EEVEE — основной движок, Cycles — только для стиллов/коротких плейтов с малым числом
  сэмплов и денойзом. 1080×1920 EEVEE ≈ секунды на кадр.

## Как работать (из гайда Alliance «3D-модели в Blender с Claude», 2026-11-04)
1. Модель строится **скриптом на Python** (bpy), Blender запускается без окна; сохраняй `.py`, `.blend` и рендер
   рядом в папке проекта. Правки — точечно в скрипте («флаги синими», «камера на уровень глаз»), не с нуля.
2. Агент не видит модель: после каждого шага делай рендер/скриншот и смотри глазами; проверяй стыки, предметы в
   воздухе и в земле. Конкретные замечания («бочка стоит в стене») исправляются быстрее.
3. Начинай с low-poly и простых форм, потом детализация; большие сцены — модулями (коллекции на объект).

## Плейт для Remotion
- Камера и тайминг сцены считаются в кадрах ролика (fps 30). Рендер `-a` в PNG-последовательность
  (`//plates/<name>/####.png`, RGBA, если нужен альфа) или в mp4 (H.264) без альфы.
- В Remotion: `<OffthreadVideo src={staticFile("plates/x.mp4")} />` или `<Img>` по номеру кадра для PNG-секвенции
  (`staticFile(\`plates/x/${String(frame+1).padStart(4,"0")}.png\`)`).
- Экспорт объекта для three.js: glTF (`blender-export-pipelines` → web), затем `useGLTF` в `ThreeCanvas`.
- Кэшируй: плейт не перерендеривать, если скрипт и параметры не менялись (хэш в имени файла).
