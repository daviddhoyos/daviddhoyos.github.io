/* Section backgrounds: a vanilla WebGL port of ShaderGradient's "plane" and "waterPlane" meshes with the "3d" light,
   from @shadergradient/react (MIT, © ruucm and stone-skipper, github.com/ruucm/shadergradient). No dependencies.
   Same engine as hero-shader.js, but one instance per [data-bg-shader] element, each with its own settings:
     data-bg-shader="plane | waterPlane"   data-bg-colors="#c1, #c2, #c3"   data-bg-brightness (default 1.2)
     data-bg-distance (cDistance)  data-bg-polar  data-bg-azimuth  data-bg-position="x, y, z"  data-bg-rotation="x, y, z" (degrees)
     data-bg-speed  data-bg-density  data-bg-strength  data-bg-start (seconds into the motion)  data-bg-grain="on" (ShaderGradient's RGB halftone, off by default)
   What the official package does, and what this reproduces:
   - color = mix(mix(c1, c2, smoothstep(-3, 3, pos.x)), c3, pos.z), where pos is the vertex after a 3D-noise push along its normal
   - "3d" light = one ambient light of intensity brightness * PI, MeshPhysicalMaterial metalness 0.2, so the output is color * 0.8 * brightness
   - canvas is linear + flat (no tone mapping, no sRGB encode), 1 device pixel per CSS pixel, fov 45, zoom 1, camera orbiting the origin
   - plane = 10 x 10 with 1 x 192 segments, waterPlane = 10 x 10 with 192 x 192; then the RGB halftone "grain" pass
   Performance: the GL context is only created when the section is near the viewport, rendering pauses when it leaves, when the tab is
   hidden, and is capped at 30 fps on touch devices. Reduced motion gets one still frame. No WebGL: the CSS poster stays. */
(() => {
  'use strict';
  const hosts = document.querySelectorAll('[data-bg-shader]');
  if (!hosts.length) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)');

  /* ---------- GLSL ---------- */
  const NOISE = `
vec3 mod289(vec3 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x)
{
  return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

float cnoise(vec3 P)
{
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}
`;

  const VS = `
  precision highp float;
  attribute vec3 position;
  uniform mat4 modelViewMatrix, projectionMatrix;
  uniform float uTime, uSpeed, uNoiseDensity, uNoiseStrength;
  varying vec3 vPos;
  ${NOISE}
  void main(){
    float t = uTime * uSpeed;
    vec3 noisePos = 0.43 * position * uNoiseDensity;
    float distortion = 0.75 * cnoise(noisePos + t);
    vec3 pos = position + vec3(0.0, 0.0, 1.0) * distortion * uNoiseStrength; // plane normal is +Z
    vPos = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }`;

  const FS = `
  precision highp float;
  uniform vec3 uC1, uC2, uC3; uniform float uGain;
  varying vec3 vPos;
  void main(){
    vec3 base = mix(mix(uC1, uC2, smoothstep(-3.0, 3.0, vPos.x)), uC3, vPos.z);
    gl_FragColor = vec4(base * uGain, 1.0);   // uGain = (1 - metalness 0.2) * brightness
  }`;

  const QUAD_VS = `
  attribute vec2 position; attribute vec2 uv;
  varying vec2 vUV; varying vec2 vPosition;
  void main(){ vUV = uv; vPosition = position; gl_Position = vec4(position, 0.0, 1.0); }`;

  /* ShaderGradient's grain: its RGB halftone pass (same as hero-shader.js). */
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

  /* ---------- helpers ---------- */
  const rad = (d) => (d * Math.PI) / 180;
  const num = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
  const vec3 = (v, d) => { const a = (v || '').split(',').map((s) => parseFloat(s)); return a.length === 3 && a.every(Number.isFinite) ? a : d; };
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
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

  // three.js PlaneGeometry(10, 10, wSeg, hSeg): same vertex layout and winding
  const buildPlane = (wSeg, hSeg) => {
    const gx = wSeg + 1, gy = hSeg + 1, pos = new Float32Array(gx * gy * 3), idx = [];
    let k = 0;
    for (let iy = 0; iy < gy; iy++) {
      const y = (iy * 10) / hSeg - 5;
      for (let ix = 0; ix < gx; ix++) { pos[k++] = (ix * 10) / wSeg - 5; pos[k++] = -y; pos[k++] = 0; }
    }
    for (let iy = 0; iy < hSeg; iy++) for (let ix = 0; ix < wSeg; ix++) {
      const a = ix + gx * iy, b = ix + gx * (iy + 1), c = ix + 1 + gx * (iy + 1), d = ix + 1 + gx * iy;
      idx.push(a, b, d, b, c, d);
    }
    return { pos, idx: new Uint16Array(idx) };
  };

  hosts.forEach((host) => {
    const d = host.dataset;
    const colors = (d.bgColors || '').split(',').map((c) => c.trim()).filter((c) => /^#[0-9a-f]{6}$/i.test(c));
    if (colors.length !== 3) return;
    const CFG = {
      water: d.bgShader === 'waterPlane',
      colors: colors.map(hex),
      gain: 0.8 * num(d.bgBrightness, 1.2),
      distance: num(d.bgDistance, 3.6), polar: num(d.bgPolar, 90), azimuth: num(d.bgAzimuth, 180),
      position: vec3(d.bgPosition, [0, 0, 0]), rotation: vec3(d.bgRotation, [0, 0, 0]),
      speed: num(d.bgSpeed, 0.4), density: num(d.bgDensity, 1.3), strength: num(d.bgStrength, 4),
      fov: 45, pixelDensity: 1,
    };
    const START = num(d.bgStart, 0);
    // the mesh can leave corners of the view uncovered (perspective + displacement): those show the middle color, not black
    const bg = CFG.colors[1].map((v) => Math.min(1, Math.max(0, v * CFG.gain)));
    const GRAIN = d.bgGrain === 'on'; // the RGB halftone is coarse on pastel colors: sections use a fine CSS grain instead (styles.css)

    let canvas, gl, scene, quad, planeBuf, indexBuf, indexCount, quadBuf, fbo, fboTex, depthRb;
    let W = 0, H = 0, elapsed = START, last = 0, raf = 0, visible = false, ready = false, lost = false, started = false;

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

    // model: translate * Euler XYZ (three.js order). camera: orbit around the origin, looking at it (camera-controls)
    const [px, py, pz] = CFG.position;
    const model = mul(mul(mul([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, px, py, pz, 1], rotX(rad(CFG.rotation[0]))),
      rotY(rad(CFG.rotation[1]))), rotZ(rad(CFG.rotation[2])));
    const phi = Math.min(Math.max(rad(CFG.polar), 1e-6), Math.PI - 1e-6), theta = rad(CFG.azimuth);
    const eye = [CFG.distance * Math.sin(phi) * Math.sin(theta), CFG.distance * Math.cos(phi), CFG.distance * Math.sin(phi) * Math.cos(theta)];
    const zA = norm(eye), xA = norm(cross([0, 1, 0], zA)), yA = cross(zA, xA);
    const dotE = (a) => a[0] * eye[0] + a[1] * eye[1] + a[2] * eye[2];
    const view = [xA[0], yA[0], zA[0], 0, xA[1], yA[1], zA[1], 0, xA[2], yA[2], zA[2], 0, -dotE(xA), -dotE(yA), -dotE(zA), 1];
    const modelView = new Float32Array(mul(view, model));
    // "cover" framing against a 16:9 reference: wider sections keep the same horizontal view and crop vertically, so a short, wide
    // band does not leave the mesh's edges in view. Narrower ones keep the vertical fov (the sides are cropped).
    const REF = 16 / 9;
    const projection = (aspect) => {
      const f = 1 / (Math.tan(rad(CFG.fov) / 2) * (aspect > REF ? REF / aspect : 1)), near = 0.1, far = 1000;
      return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, (2 * far * near) / (near - far), 0]);
    };

    const setup = () => {
      scene = program(VS, FS);
      quad = program(QUAD_VS, GRAIN_FS);
      const geo = CFG.water ? buildPlane(192, 192) : buildPlane(1, 192);
      planeBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, planeBuf); gl.bufferData(gl.ARRAY_BUFFER, geo.pos, gl.STATIC_DRAW);
      indexBuf = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.idx, gl.STATIC_DRAW);
      indexCount = geo.idx.length;
      quadBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 3, 0, 2, -1, -1, 0, 0, 3, -1, 2, 0]), gl.STATIC_DRAW);
      fboTex = gl.createTexture(); depthRb = gl.createRenderbuffer(); fbo = gl.createFramebuffer();
      gl.useProgram(scene.p);
      gl.uniform3fv(scene.u.uC1, CFG.colors[0]); gl.uniform3fv(scene.u.uC2, CFG.colors[1]); gl.uniform3fv(scene.u.uC3, CFG.colors[2]);
      gl.uniform1f(scene.u.uGain, CFG.gain); gl.uniform1f(scene.u.uSpeed, CFG.speed);
      gl.uniform1f(scene.u.uNoiseDensity, CFG.density); gl.uniform1f(scene.u.uNoiseStrength, CFG.strength);
      gl.uniformMatrix4fv(scene.u.modelViewMatrix, false, modelView);
      gl.useProgram(quad.p);
      gl.uniform1i(quad.u.tDiffuse, 0); gl.uniform1i(quad.u.grain, GRAIN ? 1 : 0);
    };

    const resize = () => {
      const r = host.getBoundingClientRect();
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
      gl.useProgram(scene.p); gl.uniformMatrix4fv(scene.u.projectionMatrix, false, projection(w / h));
      gl.useProgram(quad.p); gl.uniform1f(quad.u.width, w / CFG.pixelDensity); gl.uniform1f(quad.u.height, h / CFG.pixelDensity);
      return true;
    };

    const draw = (time) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, W, H);
      gl.clearColor(bg[0], bg[1], bg[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); // the plane is double sided
      gl.useProgram(scene.p);
      gl.uniform1f(scene.u.uTime, time);
      gl.bindBuffer(gl.ARRAY_BUFFER, planeBuf);
      const ap = scene.a('position'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
      gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
      gl.disableVertexAttribArray(ap);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H); gl.disable(gl.DEPTH_TEST);
      gl.useProgram(quad.p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fboTex);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      const qp = quad.a('position'), qu = quad.a('uv');
      gl.enableVertexAttribArray(qp); gl.vertexAttribPointer(qp, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(qu); gl.vertexAttribPointer(qu, 2, gl.FLOAT, false, 16, 8);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disableVertexAttribArray(qp); gl.disableVertexAttribArray(qu);
    };

    const frame = (now) => {
      raf = 0;
      const minStep = coarse.matches ? 1000 / 30 - 2 : 0;
      if (last && now - last < minStep) { raf = requestAnimationFrame(frame); return; }
      if (last) elapsed += Math.min(now - last, 100) / 1000; // no jump after a stall
      last = now;
      resize(); draw(elapsed);
      raf = requestAnimationFrame(frame);
    };
    const running = () => ready && !lost && visible && !document.hidden && !reduceMotion.matches;
    const sync = () => {
      if (running()) { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    };
    const still = () => { if (ready && !lost) { resize(); draw(elapsed); } };

    const start = () => {
      if (started) return; started = true;
      canvas = document.createElement('canvas');
      canvas.className = 'bg-canvas'; canvas.setAttribute('aria-hidden', 'true');
      gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: true, stencil: false,
        premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'low-power' });
      if (!gl) return; // the poster stays as the background
      try { setup(); } catch (e) { return; }
      ready = true;
      resize(); draw(elapsed);
      host.insertBefore(canvas, host.firstChild);
      requestAnimationFrame(() => host.classList.add('is-shader-on'));
      if ('ResizeObserver' in window) new ResizeObserver(() => { if (!raf) still(); }).observe(host);
      document.addEventListener('visibilitychange', sync);
      reduceMotion.addEventListener?.('change', () => { sync(); still(); });
      canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; sync(); host.classList.remove('is-shader-on'); });
      canvas.addEventListener('webglcontextrestored', () => {
        W = H = 0; try { setup(); } catch (e) { return; }
        lost = false; still(); host.classList.add('is-shader-on'); sync();
      });
      sync();
    };

    // only spend a GL context (and frames) while the section is near the screen
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 120));
    const watch = () => {
      if (!('IntersectionObserver' in window)) { visible = true; idle(start, { timeout: 1500 }); return; }
      new IntersectionObserver((en) => {
        visible = en[0].isIntersecting;
        if (visible && !started) idle(start, { timeout: 1500 });
        sync();
      }, { rootMargin: '240px 0px' }).observe(host);
    };
    if (document.readyState === 'complete') watch(); else window.addEventListener('load', watch, { once: true });
  });
})();
