import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import { TL } from "./lib";
// Cozy-3D styles (see references/cozy3d.md): copy the matching script to tools/script.mjs and swap Video for —
//   elevator tower: TowerVideo from "./cozy3d/TowerVideo" + tools/script.cozy3d.mjs (scene ids lobby, f1…f6, roof)
//   anime:          AnimeVideo from "./anime/AnimeVideo" + tools/script.anime.mjs (ids title, hero, power, bug, render, end)
//   film set:       SetVideo from "./cozy3d/SetVideo" + tools/script.filmset.mjs (+ src/crew.ts with real GitHub stars)

export const Root: React.FC = () => (
  <Composition id="Reel" component={Video} durationInFrames={TL.total} fps={30} width={1080} height={1920} />
);
