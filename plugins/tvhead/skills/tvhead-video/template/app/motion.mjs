// motion-studio inside the app: the Remotion styles (reel / tower / set / anime / screen / montage / Blender plate),
// the video library of the user's MOTION folder, and the render of an approved motion job.
//   A motion job is an ordinary job (episodes/<id>/job.json) whose brief has family: 'motion' and a style. Claude builds a
//   Remotion project in MEDIA_ROOT/<id>, voices it, renders a contact sheet and hands it back with `bridge.mjs motion-ready`
//   (episodes/<id>/motion.json + build/sheet.jpg). "Render" then runs `npm run render` + deliver in that project.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync, mkdirSync, createWriteStream, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { STUDIO, jobDir, readJson, writeJson, getJob, saveJob, setStatus } from './jobs.mjs';

export const MEDIA_ROOT = path.resolve(process.env.TVHEAD_MEDIA || path.join(os.homedir(), 'Desktop', 'MOTION'));

// style id → motion-studio style + which skills Claude should use
export const MOTION_STYLES = {
  'motion-reel':    { style: 'reel',   skills: ['motion-studio'], music: 'hype',   label: 'Motion reel — kinetic type, shaders, voxel Clawd' },
  'motion-tower':   { style: 'tower',  skills: ['motion-studio'], music: 'upbeat', label: 'Cozy 3D tower — elevator through the floors' },
  'motion-set':     { style: 'set',    skills: ['motion-studio'], music: 'upbeat', label: 'Cozy 3D film set — clapperboard, stations, credits' },
  'motion-anime':   { style: 'anime',  skills: ['motion-studio'], music: 'epic',   label: 'Anime opening — toon, impact frames, speed lines' },
  'motion-screen':  { style: 'screen', skills: ['motion-studio'], music: 'lofi',   label: 'Shot on a phone — laptop with Claude Code, handheld' },
  'motion-montage': { style: 'reel',   skills: ['ai-montage', 'motion-studio'], music: 'epic', label: 'Documentary montage — real charts and archive photos' },
  'motion-blender': { style: 'reel',   skills: ['blender-3d', 'motion-studio'], music: 'upbeat', label: 'Blender 3D plates — a real 3D scene in the reel' },
};
export const isMotionLook = id => Object.prototype.hasOwnProperty.call(MOTION_STYLES, id);

// where the skills live: env, the user's skills folder, or the installed plugin
export function skillDir(name) {
  const cands = [process.env.TVHEAD_SKILLS && path.join(process.env.TVHEAD_SKILLS, name), path.join(os.homedir(), '.claude', 'skills', name)];
  const cache = path.join(os.homedir(), '.claude', 'plugins', 'cache');
  try { for (const mk of readdirSync(cache)) { const p = path.join(cache, mk, 'tvhead'); if (!existsSync(p)) continue; for (const v of readdirSync(p).sort().reverse()) cands.push(path.join(p, v, 'skills', name)); } } catch {}
  return cands.filter(Boolean).find(d => existsSync(path.join(d, 'SKILL.md'))) || null;
}

// ─── video library: every mp4 in MEDIA_ROOT (and the studio's out/) ───────────────────────────
const SKIP = new Set(['node_modules', 'out', 'public', 'voice-cache', 'refs', 'refs-x', 'refs-x2', '.git', 'stills', 'build', 'review', 'src', 'tools']);
const MEDIA_CACHE = path.join(STUDIO, 'app', 'thumbs', 'media');
const metaFile = path.join(MEDIA_CACHE, 'meta.json');
let meta = null;
const loadMeta = () => (meta ??= readJson(metaFile, {}));
export const mediaId = rel => createHash('sha1').update(rel).digest('hex').slice(0, 12);

function walk(root, dir, depth, out) {
  let ents; try { ents = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) { if (depth < 3 && !SKIP.has(e.name) && !e.name.startsWith('.')) walk(root, abs, depth + 1, out); continue; }
    if (!/\.mp4$/i.test(e.name)) continue;
    out.push({ root, abs, rel: path.relative(root, abs).split(path.sep).join('/') });
  }
}
function probe(abs) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', abs], { encoding: 'utf8' });
  try { const j = JSON.parse(r.stdout); return { w: j.streams?.[0]?.width || 0, h: j.streams?.[0]?.height || 0, dur: +(+j.format?.duration || 0).toFixed(1) }; } catch { return { w: 0, h: 0, dur: 0 }; }
}
export function listMedia() {
  const files = [];
  if (existsSync(MEDIA_ROOT)) walk(MEDIA_ROOT, MEDIA_ROOT, 0, files);
  const studioOut = path.join(STUDIO, 'out');
  if (existsSync(studioOut)) for (const f of readdirSync(studioOut)) if (/\.mp4$/i.test(f)) files.push({ root: STUDIO, abs: path.join(studioOut, f), rel: `studio/${f}`, studio: true });
  const m = loadMeta(); let dirty = false;
  const byAbs = new Map(files.map(f => [f.abs, f]));
  const items = [];
  for (const f of files) {
    if (/_share\.mp4$/i.test(f.abs) && byAbs.has(f.abs.replace(/_share\.mp4$/i, '.mp4'))) continue;   // shown as the master's phone copy
    const st = statSync(f.abs), id = mediaId(f.rel);
    if (!m[id] || m[id].mtime !== (st.mtimeMs | 0)) { m[id] = { ...probe(f.abs), mtime: st.mtimeMs | 0 }; dirty = true; }
    const share = f.abs.replace(/\.mp4$/i, '_share.mp4');
    const parts = f.rel.split('/');
    items.push({ id, name: parts[parts.length - 1].replace(/\.mp4$/i, ''), group: f.studio ? 'tvhead studio' : parts.length > 1 ? parts.slice(0, -1).join('/') : '', rel: f.rel,
      mb: +(st.size / 1048576).toFixed(1), mtime: st.mtimeMs | 0, ...m[id], vertical: m[id].h > m[id].w, share: existsSync(share) && share !== f.abs ? mediaId(f.rel.replace(/\.mp4$/i, '_share.mp4')) : null });
    if (existsSync(share) && share !== f.abs) MEDIA_INDEX.set(mediaId(f.rel.replace(/\.mp4$/i, '_share.mp4')), share);
    MEDIA_INDEX.set(id, f.abs);
  }
  if (dirty) { mkdirSync(MEDIA_CACHE, { recursive: true }); writeJson(metaFile, m); }
  return items.sort((a, b) => b.mtime - a.mtime);
}
export const MEDIA_INDEX = new Map();   // id → absolute path (filled by listMedia; only these files are ever served)
export function mediaPath(id) { if (!MEDIA_INDEX.size) listMedia(); return MEDIA_INDEX.get(id) || null; }
// thumbnails: async ffmpeg with a small queue (never block the server), cached in app/thumbs/media/<id>.jpg
const pendingThumbs = new Map(); let active = 0; const queue = [];
const pump = () => { while (active < 3 && queue.length) { const job = queue.shift(); active++; job().finally(() => { active--; pump(); }); } };
export function mediaThumb(id) {
  const abs = mediaPath(id); if (!abs) return Promise.resolve(null);
  const out = path.join(MEDIA_CACHE, id + '.jpg');
  if (existsSync(out) && statSync(out).mtimeMs >= statSync(abs).mtimeMs) return Promise.resolve(out);
  if (pendingThumbs.has(id)) return pendingThumbs.get(id);
  const pr = new Promise(res => queue.push(() => new Promise(done => {
    mkdirSync(MEDIA_CACHE, { recursive: true });
    const dur = loadMeta()[id]?.dur || 4;
    const p = spawn('ffmpeg', ['-y', '-v', 'error', '-ss', String(Math.min(dur * 0.35, 8).toFixed(2)), '-i', abs, '-frames:v', '1', '-vf', 'scale=360:-2', '-q:v', '5', out], { windowsHide: true });
    p.on('exit', () => { pendingThumbs.delete(id); res(existsSync(out) ? out : null); done(); });
    p.on('error', () => { pendingThumbs.delete(id); res(null); done(); });
  })));
  pendingThumbs.set(id, pr); pump(); return pr;
}
export function warmThumbs() { for (const it of listMedia()) mediaThumb(it.id); }

// ─── motion job: storyboard view and render ─────────────────────────────────────────────────
export function motionBoard(id) {
  const m = readJson(path.join(jobDir(id), 'motion.json')); if (!m) return null;
  const sheet = path.join(jobDir(id), 'build', 'sheet.jpg');
  return { motion: true, style: m.style, project: m.project, duration: m.duration, format: m.format || '9:16', languages: m.languages || ['ru'],
    title: m.title || id, sheet: existsSync(sheet) ? `/files/episodes/${id}/build/sheet.jpg?v=${statSync(sheet).mtimeMs | 0}` : null,
    scenes: (m.scenes || []).map((s, i) => ({ i, id: s.id, note: s.note || '', say: s.say || {}, from: s.from ?? null, to: s.to ?? null })), notes: m.notes || '' };
}

export function startMotionRender(id, running) {
  const job = getJob(id), m = readJson(path.join(jobDir(id), 'motion.json'));
  if (!job || !m || running.has(id)) return job;
  const proj = m.project;
  if (!existsSync(path.join(proj, 'package.json'))) { setStatus(id, 'error', 'Проект ролика не найден', { error: `${proj} has no package.json` }); return getJob(id); }
  setStatus(id, 'rendering', 'Рендер запущен', { progress: { stage: 'frames', done: 0, total: 1 }, error: null, outputs: {} });
  const log = createWriteStream(path.join(jobDir(id), 'render.log'), { flags: 'a' });
  const sh = process.platform === 'win32';
  const step = (args, onLine) => new Promise(res => {
    const p = spawn('npm', args, { cwd: proj, shell: sh, env: { ...process.env, FORCE_COLOR: '0' } });
    running.set(id, p); let buf = '';
    const feed = d => { buf += d; let i; while ((i = buf.search(/[\r\n]/)) >= 0) { const l = buf.slice(0, i).replace(/\x1b\[[0-9;]*m/g, ''); buf = buf.slice(i + 1); if (l.trim()) { log.write(l + '\n'); onLine?.(l); } } };
    p.stdout.on('data', feed); p.stderr.on('data', feed); p.on('exit', code => res(code));
  });
  (async () => {
    let last = 0;
    const c1 = await step(['run', 'render'], l => {
      const r = l.match(/(?:Rendered|Encoded)\s+(\d+)\/(\d+)/); if (!r || Date.now() - last < 700) return; last = Date.now();
      const j = getJob(id); j.progress = { stage: /Encoded/.test(l) ? 'encode' : 'frames', done: +r[1], total: +r[2], lang: (m.languages || ['ru'])[0], at: Date.now() }; saveJob(j);
    });
    if (c1 !== 0) { running.delete(id); log.end(); return setStatus(id, 'error', 'Рендер упал', { error: 'npm run render failed, see render.log' }); }
    const j = getJob(id); j.progress = { stage: 'audio', done: 1, total: 1, lang: (m.languages || ['ru'])[0] }; saveJob(j);
    const c2 = await step(['run', 'deliver', '--', MEDIA_ROOT, id]);
    running.delete(id); log.end();
    const master = path.join(MEDIA_ROOT, `${id}.mp4`);
    if (c2 !== 0 || !existsSync(master)) return setStatus(id, 'error', 'Сборка финального файла упала', { error: 'npm run deliver failed, see render.log' });
    listMedia();   // refresh the index so the new files can be served
    const pr = probe(master), share = master.replace(/\.mp4$/, '_share.mp4'), lang = (m.languages || ['ru'])[0];
    setStatus(id, 'done', 'Видео готово', { outputs: { [lang]: { lang, url: `/media/${mediaId(path.relative(MEDIA_ROOT, master).split(path.sep).join('/'))}`, share: existsSync(share) ? `/media/${mediaId(path.relative(MEDIA_ROOT, share).split(path.sep).join('/'))}` : null, width: pr.w, height: pr.h, duration: pr.dur, mb: +(statSync(master).size / 1048576).toFixed(1), path: master } } });
  })();
  return getJob(id);
}

// hand a finished Claude build back to the app (used by bridge.mjs motion-ready)
export function motionReady(id, project) {
  const proj = path.resolve(project || path.join(MEDIA_ROOT, id));
  const tl = readJson(path.join(proj, 'src', 'timeline.json'));
  if (!tl) throw new Error(`${proj}/src/timeline.json missing — run npm run voice first`);
  const sheet = path.join(proj, 'out', 'stills', 'sheet.jpg');
  if (!existsSync(sheet)) throw new Error(`${sheet} missing — run npm run stills -- <frames> first`);
  mkdirSync(path.join(jobDir(id), 'build'), { recursive: true });
  copyFileSync(sheet, path.join(jobDir(id), 'build', 'sheet.jpg'));
  const brief = readJson(path.join(jobDir(id), 'brief.json')) || {};
  const prev = readJson(path.join(jobDir(id), 'motion.json')) || {};
  const lang = (brief.languages || ['ru'])[0];
  const motion = { ...prev, project: proj, style: MOTION_STYLES[brief.look]?.style || prev.style, format: '9:16', languages: [lang], duration: +(tl.total / tl.fps).toFixed(1),
    scenes: tl.scenes.map(s => ({ id: s.id, from: +(s.from / tl.fps).toFixed(1), to: +(s.to / tl.fps).toFixed(1), say: { [lang]: s.lines.map(l => l.say).join(' ') }, note: prev.scenes?.find(x => x.id === s.id)?.note || '' })) };
  writeJson(path.join(jobDir(id), 'motion.json'), motion);
  return motion;
}
