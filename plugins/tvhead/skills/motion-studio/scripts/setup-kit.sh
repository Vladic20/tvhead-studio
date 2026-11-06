#!/usr/bin/env bash
# One-time setup of the motion kit (~/motion-kit): JS libraries, shader/noise sources, RNNoise models, reference skill repos,
# and optionally Python tools and Claude Code plugins.
#   bash setup-kit.sh              # JS libs + git sources (~150 MB)
#   bash setup-kit.sh --python     # + faster-whisper (word timings, pronunciation check) and Chatterbox TTS (offline voice, ~3 GB on first use)
#   bash setup-kit.sh --plugins    # + Claude Code plugins: blender-agent-skills (28 Blender skills) and gsap-skills
# Needs: node ≥ 18, npm, git, ffmpeg. The tvhead studio (voice, music, verify) comes from the tvhead-video skill's bootstrap.
set -e
KIT="${MOTION_KIT:-$HOME/motion-kit}"; mkdir -p "$KIT/vendor" && cd "$KIT"
[ -f package.json ] || npm init -y >/dev/null
npm i --no-audit --no-fund gsap three postprocessing @tsparticles/engine @tsparticles/slim @tsparticles/confetti @tsparticles/fireworks \
  flubber roughjs @theatre/core @theatre/studio hydra-synth tone animejs scenejs konva zdog planck regl meshoptimizer mediabunny >/dev/null
cd vendor
clone() { [ -d "$2" ] || git clone --depth 1 "https://github.com/$1" "$2" >/dev/null 2>&1 && echo "  ✓ $1"; }
clone patriciogonzalezvivo/lygia patriciogonzalezvivo_lygia
clone PavelDoGreat/WebGL-Fluid-Simulation PavelDoGreat_WebGL-Fluid-Simulation
clone ashima/webgl-noise ashima_webgl-noise
clone GregorR/rnnoise-models rnnoise-models
clone EL4CTEO/blender-skills EL4CTEO_blender-skills
clone remotion-dev/skills remotion-dev_skills
echo "kit: $KIT (js libs + vendor sources)"

if [[ " $* " == *" --python "* ]]; then
  PY="${PYTHON:-python3}"; command -v "$PY" >/dev/null || PY=python
  cd "$KIT"
  [ -d py-whisper ] || "$PY" -m venv py-whisper
  VP=py-whisper/bin/python; [ -x "$VP" ] || VP=py-whisper/Scripts/python.exe
  "$VP" -m pip install -q faster-whisper && echo "  ✓ faster-whisper"
  [ -d py-tts ] || "$PY" -m venv py-tts
  VT=py-tts/bin/python; [ -x "$VT" ] || VT=py-tts/Scripts/python.exe
  "$VT" -m pip install -q chatterbox-tts && echo "  ✓ chatterbox-tts"
fi

if [[ " $* " == *" --plugins "* ]] && command -v claude >/dev/null; then
  claude plugin marketplace add EL4CTEO/blender-skills >/dev/null && claude plugin install blender-agent-skills@blender-agent-skills >/dev/null && echo "  ✓ blender-agent-skills"
  claude plugin marketplace add greensock/gsap-skills >/dev/null && claude plugin install gsap-skills@gsap-skills >/dev/null && echo "  ✓ gsap-skills"
fi
echo "done"
