#!/usr/bin/env bash
# Usage: bash new-project.sh <dest-dir> [style]
#   style: reel (default: moush + voxel mascot) | tower (cozy 3D elevator) | set (cozy 3D film set)
#          | anime (toon opening) | screen (phone-shot laptop with Claude Code)
# Copies the working template, installs deps, picks the style's sample script + component, makes music.
set -e
DEST="${1:?usage: new-project.sh <dest-dir> [reel|tower|set|anime|screen]}"; STYLE="${2:-reel}"
SRC="$(cd "$(dirname "$0")/../template" && pwd)"
case "$STYLE" in
  reel)   IMP='import { Video as Comp } from "./Video";' ;;
  tower)  IMP='import { TowerVideo as Comp } from "./cozy3d/TowerVideo";' ;;
  set)    IMP='import { SetVideo as Comp } from "./cozy3d/SetVideo";' ;;
  anime)  IMP='import { AnimeVideo as Comp } from "./anime/AnimeVideo";' ;;
  screen) IMP='import { ScreenVideo as Comp } from "./screen/ScreenVideo";' ;;
  *) echo "unknown style: $STYLE"; exit 1 ;;
esac
[ -e "$DEST" ] && { echo "exists: $DEST"; exit 1; }
mkdir -p "$DEST" && cp -r "$SRC"/. "$DEST"/ && cd "$DEST"
cp "tools/script.$STYLE.mjs" tools/script.mjs
case "$STYLE" in reel) MP=hype;; tower|set) MP=upbeat;; anime) MP=epic;; screen) MP=lofi;; esac
sed -i "s/preset: \"[a-z]*\"/preset: \"$MP\"/" tools/music.mjs
cat > src/Root.tsx <<ROOT
import React from "react";
import { Composition } from "remotion";
$IMP
import { TL } from "./lib";
// style: $STYLE — see the skill's references for this style
export const Root: React.FC = () => (
  <Composition id="Reel" component={Comp} durationInFrames={TL.total} fps={30} width={1080} height={1920} />
);
ROOT
npm ci --no-audit --no-fund >/dev/null 2>&1 || npm i --no-audit --no-fund >/dev/null
mkdir -p out
if [ "$STYLE" != reel ]; then rm -f public/voice/*.mp3; echo "style $STYLE: run npm run voice first (the sample timeline belongs to the reel)"; else node tools/music.mjs >/dev/null; fi
echo "ready: $DEST [$STYLE] — edit tools/script.mjs → npm run voice → npm run music → npm run asr → scenes → npm run stills -- 80,200 → npm run render → npm run seams → npm run deliver -- <dest> <name>"
