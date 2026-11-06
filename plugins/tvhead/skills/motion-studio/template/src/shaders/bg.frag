precision highp float;
uniform vec2 u_resolution; uniform float u_time; uniform vec3 u_a; uniform vec3 u_b; uniform vec3 u_c; uniform float u_glow; uniform float u_pulse;
#include "lygia/generative/snoise.glsl"
#include "lygia/generative/random.glsl"
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 q = vec2(uv.x, uv.y * 1.777);
  float n = snoise(vec3(q * 1.3, u_time * 0.18));
  float m = snoise(vec3(q * 2.6 + 4.0, u_time * 0.27 + 3.0));
  vec3 col = mix(u_a, u_b, smoothstep(-0.7, 0.8, n));
  col = mix(col, u_c, smoothstep(0.35, 0.95, m) * u_glow);
  // pixel grid that pulses on beats: the «code» texture under everything
  vec2 g = fract(gl_FragCoord.xy / 36.0);
  float grid = step(0.94, max(g.x, g.y));
  col += grid * 0.035 * (1.0 + u_pulse * 3.0);
  float d = length(uv - vec2(0.5, 0.45));
  col *= 1.0 - smoothstep(0.35, 0.95, d) * 0.7;
  col += (random(gl_FragCoord.xy + u_time) - 0.5) * 0.02;
  gl_FragColor = vec4(col, 1.0);
}
