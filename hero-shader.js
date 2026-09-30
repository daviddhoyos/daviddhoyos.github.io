/* Hero motion: a vanilla WebGL port of ShaderGradient (github.com/ruucm/shadergradient, MIT, © ruucm).
   Same scene as the customizer link: a noise-displaced, spiral-twisted sphere seen through a long lens,
   lit by the "city" environment (prefiltered and baked into two tiny textures below), then the
   ShaderGradient grain (its RGB halftone pass). No dependencies.
   Performance: renders at 1 device pixel per CSS pixel (pixelDensity 1, as configured), pauses when the
   hero is off screen or the tab is hidden, caps at 30 fps on touch devices, and starts after the page
   has loaded so it never competes with the headline. Reduced motion gets one still frame. */
(() => {
  'use strict';
  const hero = document.querySelector('[data-hero-shader]');
  if (!hero) return;

  /* ---------- config (from the shadergradient.co link) ---------- */
  const CFG = {
    color1: '#f8c4cd', color2: '#ff810a', color3: '#a95fce',
    uSpeed: 0.3, uStrength: 0.3, uDensity: 0.8, uFrequency: 5.5, uAmplitude: 3.2,
    position: [-0.1, 0, 0], rotation: [0, 130, 70],
    cAzimuthAngle: 270, cPolarAngle: 180, cameraZoom: 15.09, distance: 14, fov: 45,
    reflection: 0.4, pixelDensity: 1,
  };
  // per-page palette: data-shader-colors="#c1, #c2, #c3" (defaults to the home header's link)
  const colors = (hero.dataset.shaderColors || '').split(',').map((c) => c.trim()).filter((c) => /^#[0-9a-f]{6}$/i.test(c));
  if (colors.length === 3) [CFG.color1, CFG.color2, CFG.color3] = colors;
  const START = parseFloat(hero.dataset.shaderStart || '0') || 0; // seconds into the motion to open on
  const GRAIN = hero.dataset.shaderGrain !== 'off';

  /* city environment, prefiltered for roughness 0.6 (spec) and 1.0 (diffuse), log2-encoded */
  const ENV_SPEC = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAgCAIAAAAt/+nTAAAFDklEQVR42pVY22IrJwzU0P3/L2tfz5c0dpwFTR8EurAbJ8XJXrGZkUYSgL//+SMC8ZYuf2h8e/Wbx983/HTpd4cA6wZv+98OTxGhdSTzs3lDeqf4/47HPjQEsx/smvn57HgI0zfjFW6ZzL4GD0KBkFhgDPnbYyZaOWwDo1wQBDdI9oAHxd9SBKyGx62NAMPj0IWkUCi0Zk+2a6dxZZJwO/j0AcplQXQwfgcinI4CQZny2JUlzLANXmCfTeNS5v8bV2yGz7jjILAmAMIjB1U5H9y6giLARfpMirkiV7UrzTx474fsXDNvQXvXZLEABMdQRXyxHLm0xmqoGL9aXtXQp7P647cEXJqb7QGgtXmuh9XnGGM4q4l+nfwcIWXuqC7I8PW+XZ2wSchTYYa+0Df/QNHQNJM4Ru/JKxfwcesjZCVNByxDqw4dqqo6xlCdt3c+yFn4noCDRmsN188icPaOwqAc3fb1Wcn4Sobphw4dY4wxdP2raoRDVtC1GFTtoKG1BrTW1tkezCMaGo7z66sESBDYIqsSmzk0POBmH2OM7gfnYL02/IWGe3yKJ0FuqTl+Ox5fbwlsx/JKIscrmY3fe+92mhwcPyMH3yQ1H2hGbvumrVcA2vF6vRqS63bYtYJEnykkD+Fh+hm999GtLQ46PJDvansO6RWGSDBba39l9H42Cb0+P2uOvf+sH5ZIWSuVegiE+XvvvZ9nNwYpE4XWN/OnV1VCFwLBwQh8Pp85sQruIjnlZ2wMxPBz4R8L/Tnd0F1DlLDy+oUZRpGRsNz8rYASDzQcz+fjWukEtRrc1Bd4HC8NjaFj9NF7PxOD0fsYarlq6TxCiT4jmT7wHm1loU05ezAcz8eHVztB0XhlUtGHE2YUm4T66KP38+y9n30xsBjwkoikym0eGMk0OaGqaUtJ7Xh+PFrb5xmbB64TlCxjD4ISAy6hMXQM8xIEoRApItzykxeCnE+RKDij4/PxbyrMJY7TEgehTTefzdSFsirxlNDwNGT6GaoqSqFNbddgMUCa1FYGmUbWFFJxOz4fHzuBPGHIF0gBAfiKiRSvxOYDo2AXqoNGwAJUAEgLO5V10PRCDGVO9yncxJ4qWTtej0etA5CU5xkXiwwiU/nagJmBjtGHjiUeVarKWgC1JdMWS9mVgbKKatiJuJEbUplAw3GmLJQrbYZu2Y8pJFafVApWMfCSpkNp5idt5QkRBZoAEJ1OrKvrbf2HXNsifBBR247+enp4Lq/ORc1CP7FyPRSAaQ6zllzKWAZM6I7eCDRbZgBtajGvxisL5GhYWbGkAJ9Of71ywfWopWQO8WfO4VzURxJfsTxzqtW3GbsynadLRRoEgDqluDrBqx8v0xoBDj2/guWujQsBbkwiBvLqRmgEaEEOyRMFY5Py25tdnPSSqT+XJyE42PvcINlJB1ybsNxxMPOnGc0MR3pQoqoimXPbxrnb8EoMvSORceKgjvwNpqAKiS/cbvV8Wxa5DDlA6ANDBLRaIiIgFzbO3QPizglMGzfVg4xtlVXkswaLhFJ2y/trSLc+DsjN/0iZXdITz8L2XTPshcael3za5/XpHYESW9x/ac4cQyC83fUMGlG2Jn2ur8/FXQno26hgZWIEeLvzyp0MQ6mQvA0qdVRex17VKu/Csn7HsgjJ62rnh3YUu+22pny3zcgdN37eZ+asIDddC/Q66g9bzMfNGvs3G9/YrfubnfL/sWNfF2xv2n8oY4W2ocSb3AAAAABJRU5ErkJggg==';
  const ENV_DIFF = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAgCAIAAAAt/+nTAAAFDklEQVR42pVY22IrJwzU0P3/L2tfz5c0dpwFTR8EurAbJ8XJXrGZkUYSgL//+SMC8ZYuf2h8e/Wbx983/HTpd4cA6wZv+98OTxGhdSTzs3lDeqf4/47HPjQEsx/smvn57HgI0zfjFW6ZzL4GD0KBkFhgDPnbYyZaOWwDo1wQBDdI9oAHxd9SBKyGx62NAMPj0IWkUCi0Zk+2a6dxZZJwO/j0AcplQXQwfgcinI4CQZny2JUlzLANXmCfTeNS5v8bV2yGz7jjILAmAMIjB1U5H9y6giLARfpMirkiV7UrzTx474fsXDNvQXvXZLEABMdQRXyxHLm0xmqoGL9aXtXQp7P647cEXJqb7QGgtXmuh9XnGGM4q4l+nfwcIWXuqC7I8PW+XZ2wSchTYYa+0Df/QNHQNJM4Ru/JKxfwcesjZCVNByxDqw4dqqo6xlCdt3c+yFn4noCDRmsN188icPaOwqAc3fb1Wcn4Sobphw4dY4wxdP2raoRDVtC1GFTtoKG1BrTW1tkezCMaGo7z66sESBDYIqsSmzk0POBmH2OM7gfnYL02/IWGe3yKJ0FuqTl+Ox5fbwlsx/JKIscrmY3fe+92mhwcPyMH3yQ1H2hGbvumrVcA2vF6vRqS63bYtYJEnykkD+Fh+hm999GtLQ46PJDvansO6RWGSDBba39l9H42Cb0+P2uOvf+sH5ZIWSuVegiE+XvvvZ9nNwYpE4XWN/OnV1VCFwLBwQh8Pp85sQruIjnlZ2wMxPBz4R8L/Tnd0F1DlLDy+oUZRpGRsNz8rYASDzQcz+fjWukEtRrc1Bd4HC8NjaFj9NF7PxOD0fsYarlq6TxCiT4jmT7wHm1loU05ezAcz8eHVztB0XhlUtGHE2YUm4T66KP38+y9n30xsBjwkoikym0eGMk0OaGqaUtJ7Xh+PFrb5xmbB64TlCxjD4ISAy6hMXQM8xIEoRApItzykxeCnE+RKDij4/PxbyrMJY7TEgehTTefzdSFsirxlNDwNGT6GaoqSqFNbddgMUCa1FYGmUbWFFJxOz4fHzuBPGHIF0gBAfiKiRSvxOYDo2AXqoNGwAJUAEgLO5V10PRCDGVO9yncxJ4qWTtej0etA5CU5xkXiwwiU/nagJmBjtGHjiUeVarKWgC1JdMWS9mVgbKKatiJuJEbUplAw3GmLJQrbYZu2Y8pJFafVApWMfCSpkNp5idt5QkRBZoAEJ1OrKvrbf2HXNsifBBR247+enp4Lq/ORc1CP7FyPRSAaQ6zllzKWAZM6I7eCDRbZgBtajGvxisL5GhYWbGkAJ9Of71ywfWopWQO8WfO4VzURxJfsTxzqtW3GbsynadLRRoEgDqluDrBqx8v0xoBDj2/guWujQsBbkwiBvLqRmgEaEEOyRMFY5Py25tdnPSSqT+XJyE42PvcINlJB1ybsNxxMPOnGc0MR3pQoqoimXPbxrnb8EoMvSORceKgjvwNpqAKiS/cbvV8Wxa5DDlA6ANDBLRaIiIgFzbO3QPizglMGzfVg4xtlVXkswaLhFJ2y/trSLc+DsjN/0iZXdITz8L2XTPshcael3za5/XpHYESW9x/ac4cQyC83fUMGlG2Jn2ur8/FXQno26hgZWIEeLvzyp0MQ6mQvA0qdVRex17VKu/Csn7HsgjJ62rnh3YUu+22pny3zcgdN37eZ+asIDddC/Q66g9bzMfNGvs3G9/YrfubnfL/sWNfF2xv2n8oY4W2ocSb3AAAAABJRU5ErkJggg==';

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: true, stencil: false,
    premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'low-power' });
  if (!gl) return; // poster + CSS grain stay as the header

  /* ---------- shaders ---------- */
  const NOISE = `
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  vec3 fade(vec3 t){return t*t*t*(t*(t*6.0-15.0)+10.0);}
  float pnoise(vec3 P, vec3 rep){
    vec3 Pi0=mod(floor(P),rep); vec3 Pi1=mod(Pi0+vec3(1.0),rep);
    Pi0=mod289(Pi0); Pi1=mod289(Pi1);
    vec3 Pf0=fract(P); vec3 Pf1=Pf0-vec3(1.0);
    vec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x); vec4 iy=vec4(Pi0.yy,Pi1.yy);
    vec4 iz0=Pi0.zzzz; vec4 iz1=Pi1.zzzz;
    vec4 ixy=permute(permute(ix)+iy); vec4 ixy0=permute(ixy+iz0); vec4 ixy1=permute(ixy+iz1);
    vec4 gx0=ixy0*(1.0/7.0); vec4 gy0=fract(floor(gx0)*(1.0/7.0))-0.5; gx0=fract(gx0);
    vec4 gz0=vec4(0.5)-abs(gx0)-abs(gy0); vec4 sz0=step(gz0,vec4(0.0));
    gx0-=sz0*(step(0.0,gx0)-0.5); gy0-=sz0*(step(0.0,gy0)-0.5);
    vec4 gx1=ixy1*(1.0/7.0); vec4 gy1=fract(floor(gx1)*(1.0/7.0))-0.5; gx1=fract(gx1);
    vec4 gz1=vec4(0.5)-abs(gx1)-abs(gy1); vec4 sz1=step(gz1,vec4(0.0));
    gx1-=sz1*(step(0.0,gx1)-0.5); gy1-=sz1*(step(0.0,gy1)-0.5);
    vec3 g000=vec3(gx0.x,gy0.x,gz0.x); vec3 g100=vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010=vec3(gx0.z,gy0.z,gz0.z); vec3 g110=vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001=vec3(gx1.x,gy1.x,gz1.x); vec3 g101=vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011=vec3(gx1.z,gy1.z,gz1.z); vec3 g111=vec3(gx1.w,gy1.w,gz1.w);
    vec4 norm0=taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
    g000*=norm0.x; g010*=norm0.y; g100*=norm0.z; g110*=norm0.w;
    vec4 norm1=taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
    g001*=norm1.x; g011*=norm1.y; g101*=norm1.z; g111*=norm1.w;
    float n000=dot(g000,Pf0); float n100=dot(g100,vec3(Pf1.x,Pf0.yz));
    float n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z)); float n110=dot(g110,vec3(Pf1.xy,Pf0.z));
    float n001=dot(g001,vec3(Pf0.xy,Pf1.z)); float n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));
    float n011=dot(g011,vec3(Pf0.x,Pf1.yz)); float n111=dot(g111,Pf1);
    vec3 fade_xyz=fade(Pf0);
    vec4 n_z=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
    vec2 n_yz=mix(n_z.xy,n_z.zw,fade_xyz.y);
    return 2.2*mix(n_yz.x,n_yz.y,fade_xyz.x);
  }`;

  const SPHERE_VS = `
  precision highp float;
  attribute vec3 position;
  uniform mat4 modelViewMatrix, projectionMatrix;
  uniform float uTime, uSpeed, uNoiseDensity, uNoiseStrength, uFrequency, uAmplitude;
  varying vec3 vPos; varying vec3 vNormal; varying vec3 vViewPosition;
  ${NOISE}
  mat3 rotation3dY(float a){float s=sin(a);float c=cos(a);return mat3(c,0.0,-s,0.0,1.0,0.0,s,0.0,c);}
  void main(){
    vec3 normal = position;                                   // unit sphere
    float uvY = 0.5 + asin(clamp(position.y, -1.0, 1.0)) * 0.3183098862; // three.js polyhedron uv.y
    float t = uTime * uSpeed;
    float distortion = pnoise((normal + t) * uNoiseDensity, vec3(10.0)) * uNoiseStrength;
    float angle = sin(uvY * uFrequency + t) * uAmplitude;
    vec3 pos = rotation3dY(angle) * (position + normal * distortion);
    vPos = pos; vNormal = normal;
    vViewPosition = -(modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }`;

  /* Gradient + MeshPhysicalMaterial image-based lighting (metalness 0.2, roughness 1 - reflection),
     reproduced term by term from three.js r169, no tone mapping, linear output as in ShaderGradient. */
  const SPHERE_FS = `
  precision highp float;
  uniform vec3 uC1, uC2, uC3; uniform mat4 viewMatrix; uniform float uRoughness;
  uniform sampler2D uEnvSpec, uEnvDiff;
  varying vec3 vPos; varying vec3 vNormal; varying vec3 vViewPosition;
  vec3 env(sampler2D m, vec3 d){
    d = normalize((vec4(d, 0.0) * viewMatrix).xyz);           // view -> world
    vec2 uv = vec2(atan(d.z, d.x) * 0.1591549431 + 0.5, asin(clamp(d.y, -1.0, 1.0)) * 0.3183098862 + 0.5);
    return exp2(texture2D(m, uv).rgb * 7.0 - 5.0);            // log-encoded HDR
  }
  void main(){
    float d2c = distance(vPos, vec3(0.0));
    vec3 base = mix(uC3, mix(uC2, uC1, smoothstep(-1.0, 1.0, vPos.y)), d2c);
    vec3 n = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
    vec3 v = normalize(vViewPosition);
    float r = uRoughness;
    vec3 diffC = base * 0.8;
    vec3 specC = mix(vec3(0.04), base, 0.2);
    vec3 irr = env(uEnvDiff, n);
    vec3 rv = reflect(-v, n); rv = normalize(mix(rv, n, r * r * r * r));
    vec3 rad = env(uEnvSpec, rv);
    float dotNV = clamp(dot(n, v), 0.0, 1.0);
    vec4 rr = r * vec4(-1.0, -0.0275, -0.572, 0.022) + vec4(1.0, 0.0425, 1.04, -0.04);
    float a004 = min(rr.x * rr.x, exp2(-9.28 * dotNV)) * rr.x + rr.y;
    vec2 fab = vec2(-1.04, 1.04) * a004 + rr.zw;
    vec3 FssEss = specC * fab.x + fab.y;
    float Ems = 1.0 - (fab.x + fab.y);
    vec3 Favg = specC + (1.0 - specC) * 0.047619;
    vec3 Fms = FssEss * Favg / (1.0 - Ems * Favg);
    vec3 total = FssEss + Fms * Ems;
    vec3 diff = diffC * (1.0 - max(max(total.r, total.g), total.b));
    gl_FragColor = vec4(rad * FssEss + Fms * Ems * irr + diff * irr, 1.0);
  }`;

  const QUAD_VS = `
  attribute vec2 position; attribute vec2 uv;
  varying vec2 vUV; varying vec2 vPosition;
  void main(){ vUV = uv; vPosition = position; gl_Position = vec4(position, 0.0, 1.0); }`;

  /* ShaderGradient's grain: its RGB halftone pass (dot shape, radius 2, scatter 1, linear blend 1).
     Its 8 ring samples sit at distance 0, so a single read gives the identical result. */
  const GRAIN_FS = `
  precision highp float;
  #define PI2 6.28318531
  uniform sampler2D tDiffuse; uniform float width, height; uniform bool grain;
  varying vec2 vUV; varying vec2 vPosition;
  const float radius = 2.0; const float scatter = 1.0;
  float hypot(float x, float y){ return sqrt(x * x + y * y); }
  float rand(vec2 s){ return fract(sin(dot(s.xy, vec2(12.9898, 78.233))) * 43758.5453); }
  vec3 getSample(vec2 p){ return texture2D(tDiffuse, vec2(p.x / width, p.y / height)).rgb; }
  float dotRad(float ch, vec2 c, vec2 p){ return pow(abs(ch), 1.125) * radius - hypot(c.x - p.x, c.y - p.y); }
  float cellValue(vec2 p, float ga, int channel){
    vec2 n = vec2(cos(ga), sin(ga));
    float th = radius * 0.5;
    float dn = n.x * p.x + n.y * p.y;
    float dl = -n.y * p.x + n.x * p.y;
    vec2 off = vec2(n.x * dn, n.y * dn);
    float on = mod(hypot(off.x, off.y), radius);
    float ndir = (dn < 0.0) ? 1.0 : -1.0;
    float ns = ((on < th) ? -on : radius - on) * ndir;
    float ol = mod(hypot(p.x - off.x, p.y - off.y), radius);
    float ldir = (dl < 0.0) ? 1.0 : -1.0;
    float ls = ((ol < th) ? -ol : radius - ol) * ldir;
    vec2 p1 = vec2(p.x - n.x * ns + n.y * ls, p.y - n.y * ns - n.x * ls);
    float oa = rand(vec2(floor(p1.x), floor(p1.y))) * PI2;
    p1 += vec2(cos(oa), sin(oa)) * (scatter * th * 0.5);
    float nst = ndir * ((on < th) ? radius : -radius);
    float lst = ldir * ((ol < th) ? radius : -radius);
    vec2 p2 = vec2(p1.x - n.x * nst, p1.y - n.y * nst);
    vec2 p3 = vec2(p1.x + n.y * lst, p1.y - n.x * lst);
    vec2 p4 = vec2(p1.x - n.x * nst + n.y * lst, p1.y - n.y * nst - n.x * lst);
    vec3 s1 = getSample(p1), s2 = getSample(p2), s3 = getSample(p3), s4 = getSample(p4);
    float a = channel == 0 ? s1.r : channel == 1 ? s1.g : s1.b;
    float b = channel == 0 ? s2.r : channel == 1 ? s2.g : s2.b;
    float c = channel == 0 ? s3.r : channel == 1 ? s3.g : s3.b;
    float d = channel == 0 ? s4.r : channel == 1 ? s4.g : s4.b;
    float aa = radius * 0.5;
    float d1 = dotRad(a, p1, p), d2 = dotRad(b, p2, p), d3 = dotRad(c, p3, p), d4 = dotRad(d, p4, p);
    float res = (d1 > 0.0 ? clamp(d1 / aa, 0.0, 1.0) : 0.0) + (d2 > 0.0 ? clamp(d2 / aa, 0.0, 1.0) : 0.0)
              + (d3 > 0.0 ? clamp(d3 / aa, 0.0, 1.0) : 0.0) + (d4 > 0.0 ? clamp(d4 / aa, 0.0, 1.0) : 0.0);
    return clamp(res, 0.0, 1.0);
  }
  void main(){
    vec3 col = texture2D(tDiffuse, vUV).rgb;
    if (!grain) { gl_FragColor = vec4(col, 1.0); return; }
    vec2 p = vec2(vUV.x * width, vUV.y * height) - vPosition * 3.0;
    float r = col.r == 0.0 ? 0.0 : cellValue(p, 0.2617993878, 0);
    float g = col.g == 0.0 ? 0.0 : cellValue(p, 0.5235987756, 1);
    float b = col.b == 0.0 ? 0.0 : cellValue(p, 0.7853981634, 2);
    gl_FragColor = vec4(r, g, b, 1.0);
  }`;

  const compile = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const program = (vs, fs) => {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
    return { p, u, a: (name) => gl.getAttribLocation(p, name) };
  };

  /* ---------- math (column-major, like WebGL) ---------- */
  const rad = (d) => (d * Math.PI) / 180;
  const mul = (a, b) => {
    const o = new Float64Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  };
  const rotX = (a) => [1, 0, 0, 0, 0, Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1];
  const rotY = (a) => [Math.cos(a), 0, -Math.sin(a), 0, 0, 1, 0, 0, Math.sin(a), 0, Math.cos(a), 0, 0, 0, 0, 1];
  const rotZ = (a) => [Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

  // model: translate * Euler XYZ (three.js order)
  const [px, py, pz] = CFG.position;
  const model = mul(mul(mul([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, px, py, pz, 1], rotX(rad(CFG.rotation[0]))),
    rotY(rad(CFG.rotation[1]))), rotZ(rad(CFG.rotation[2])));
  // camera: orbit around the origin (camera-controls spherical, polar kept just off the pole), looking at it
  const phi = Math.min(Math.max(rad(CFG.cPolarAngle), 1e-6), Math.PI - 1e-6), theta = rad(CFG.cAzimuthAngle);
  const eye = [CFG.distance * Math.sin(phi) * Math.sin(theta), CFG.distance * Math.cos(phi), CFG.distance * Math.sin(phi) * Math.cos(theta)];
  const zA = norm(eye), xA = norm(cross([0, 1, 0], zA)), yA = cross(zA, xA);
  const dotE = (a) => a[0] * eye[0] + a[1] * eye[1] + a[2] * eye[2];
  const view = [xA[0], yA[0], zA[0], 0, xA[1], yA[1], zA[1], 0, xA[2], yA[2], zA[2], 0, -dotE(xA), -dotE(yA), -dotE(zA), 1];
  const modelView = new Float32Array(mul(view, model));
  const viewF = new Float32Array(view);
  const projection = (aspect) => {
    const f = 1 / Math.tan(Math.atan(Math.tan(rad(CFG.fov) / 2) / CFG.cameraZoom)), near = 0.1, far = 1000;
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, (2 * far * near) / (near - far), 0]);
  };
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

  /* ---------- resources ---------- */
  let sphere, quad, sphereBuf, indexBuf, indexCount, quadBuf, fbo, fboTex, depthRb, envSpec, envDiff;
  let W = 0, H = 0;

  const buildSphere = (wSeg, hSeg) => { // three.js SphereGeometry layout and winding
    const pos = new Float32Array((wSeg + 1) * (hSeg + 1) * 3), idx = [];
    let k = 0;
    for (let iy = 0; iy <= hSeg; iy++) {
      const v = iy / hSeg;
      for (let ix = 0; ix <= wSeg; ix++) {
        const u = ix / wSeg;
        pos[k++] = -Math.cos(u * Math.PI * 2) * Math.sin(v * Math.PI);
        pos[k++] = Math.cos(v * Math.PI);
        pos[k++] = Math.sin(u * Math.PI * 2) * Math.sin(v * Math.PI);
      }
    }
    const row = wSeg + 1;
    for (let iy = 0; iy < hSeg; iy++) for (let ix = 0; ix < wSeg; ix++) {
      const a = iy * row + ix + 1, b = iy * row + ix, c = (iy + 1) * row + ix, d = (iy + 1) * row + ix + 1;
      if (iy !== 0) idx.push(a, b, d);
      if (iy !== hSeg - 1) idx.push(b, c, d);
    }
    return { pos, idx: new Uint16Array(idx) };
  };

  const loadTex = (src) => new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      res(t);
    };
    img.onerror = rej;
    img.src = src;
  });

  const setup = async () => {
    sphere = program(SPHERE_VS, SPHERE_FS);
    quad = program(QUAD_VS, GRAIN_FS);
    const geo = buildSphere(320, 160);
    sphereBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuf); gl.bufferData(gl.ARRAY_BUFFER, geo.pos, gl.STATIC_DRAW);
    indexBuf = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.idx, gl.STATIC_DRAW);
    indexCount = geo.idx.length;
    // full-screen triangle, same attributes as three.js FullScreenQuad
    quadBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 3, 0, 2, -1, -1, 0, 0, 3, -1, 2, 0]), gl.STATIC_DRAW);
    fboTex = gl.createTexture(); depthRb = gl.createRenderbuffer(); fbo = gl.createFramebuffer();
    [envSpec, envDiff] = await Promise.all([loadTex(ENV_SPEC), loadTex(ENV_DIFF)]);

    gl.useProgram(sphere.p);
    const [c1, c2, c3] = [CFG.color1, CFG.color2, CFG.color3].map(hex);
    gl.uniform3fv(sphere.u.uC1, c1); gl.uniform3fv(sphere.u.uC2, c2); gl.uniform3fv(sphere.u.uC3, c3);
    gl.uniform1f(sphere.u.uSpeed, CFG.uSpeed); gl.uniform1f(sphere.u.uNoiseDensity, CFG.uDensity);
    gl.uniform1f(sphere.u.uNoiseStrength, CFG.uStrength); gl.uniform1f(sphere.u.uFrequency, CFG.uFrequency);
    gl.uniform1f(sphere.u.uAmplitude, CFG.uAmplitude); gl.uniform1f(sphere.u.uRoughness, 1 - CFG.reflection);
    gl.uniformMatrix4fv(sphere.u.modelViewMatrix, false, modelView);
    gl.uniformMatrix4fv(sphere.u.viewMatrix, false, viewF);
    gl.uniform1i(sphere.u.uEnvSpec, 0); gl.uniform1i(sphere.u.uEnvDiff, 1);
    gl.useProgram(quad.p);
    gl.uniform1i(quad.u.tDiffuse, 2); gl.uniform1i(quad.u.grain, GRAIN ? 1 : 0);
  };

  const resize = () => {
    const r = hero.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * CFG.pixelDensity)), h = Math.max(1, Math.round(r.height * CFG.pixelDensity));
    if (w === W && h === H) return false;
    W = w; H = h; canvas.width = w; canvas.height = h;
    gl.bindTexture(gl.TEXTURE_2D, fboTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthRb);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fboTex, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRb);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(sphere.p); gl.uniformMatrix4fv(sphere.u.projectionMatrix, false, projection(w / h));
    gl.useProgram(quad.p); gl.uniform1f(quad.u.width, w / CFG.pixelDensity); gl.uniform1f(quad.u.height, h / CFG.pixelDensity);
    return true;
  };

  const draw = (time) => {
    // pass 1: the sphere into an offscreen buffer (black = the configured background)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    gl.useProgram(sphere.p);
    gl.uniform1f(sphere.u.uTime, time);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, envSpec);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, envDiff);
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuf);
    const ap = sphere.a('position'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
    gl.disableVertexAttribArray(ap);
    // pass 2: grain to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H); gl.disable(gl.DEPTH_TEST);
    gl.useProgram(quad.p);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, fboTex);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    const qp = quad.a('position'), qu = quad.a('uv');
    gl.enableVertexAttribArray(qp); gl.vertexAttribPointer(qp, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(qu); gl.vertexAttribPointer(qu, 2, gl.FLOAT, false, 16, 8);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disableVertexAttribArray(qp); gl.disableVertexAttribArray(qu);
  };

  /* ---------- loop ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)');
  let elapsed = START, last = 0, raf = 0, visible = true, ready = false, lost = false;

  const frame = (now) => {
    raf = 0;
    const minStep = coarse.matches ? 1000 / 30 - 2 : 0;
    if (last && now - last < minStep) { raf = requestAnimationFrame(frame); return; }
    if (last) elapsed += Math.min(now - last, 100) / 1000; // no jump after a stall
    last = now;
    resize();
    draw(elapsed);
    raf = requestAnimationFrame(frame);
  };
  const running = () => ready && !lost && visible && !document.hidden && !reduceMotion.matches;
  const sync = () => {
    if (running()) { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
    else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  };
  const still = () => { if (ready && !lost) { resize(); draw(elapsed); } };

  const start = async () => {
    try { await setup(); } catch (e) { return; } // keep the poster if anything fails
    ready = true;
    resize(); draw(elapsed);
    hero.insertBefore(canvas, hero.firstChild);
    requestAnimationFrame(() => hero.classList.add('is-shader-on'));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => { visible = en[0].isIntersecting; sync(); }).observe(hero);
    }
    if ('ResizeObserver' in window) new ResizeObserver(() => { if (!raf) still(); }).observe(hero);
    document.addEventListener('visibilitychange', sync);
    reduceMotion.addEventListener?.('change', () => { sync(); still(); });
    sync();
  };

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault(); lost = true; sync(); hero.classList.remove('is-shader-on');
  });
  canvas.addEventListener('webglcontextrestored', async () => {
    W = H = 0; try { await setup(); } catch (e) { return; }
    lost = false; still(); hero.classList.add('is-shader-on'); sync();
  });

  // start once the page has painted and settled, so the headline is never waiting on the GPU
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
  const kick = () => idle(start, { timeout: 1500 });
  if (document.readyState === 'complete') kick(); else window.addEventListener('load', kick, { once: true });
})();
