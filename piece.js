/* The gradient mesh behind the product panel: a few soft colour fields drifting
   slowly, generated on the GPU, different every visit, never busy. Falls back
   to a still CSS-like gradient without WebGL. Also wires the small-screen menu. */
(function () {
  // Booking link: paste the Calendly address between the quotes and the "Book 20 minutes" buttons appear.
  const BOOKING_URL = "";
  document.querySelectorAll("#book").forEach((a) => { if (BOOKING_URL) { a.href = BOOKING_URL; a.hidden = false; a.target = "_blank"; a.rel = "noopener"; } });
  const b = document.getElementById("burger"), n = document.getElementById("links");
  if (b && n) b.addEventListener("click", () => { const o = n.classList.toggle("open"); b.setAttribute("aria-expanded", o ? "true" : "false"); });

  const c = document.getElementById("mesh");
  if (!c) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gl = c.getContext("webgl", { alpha: false, antialias: false });
  if (!gl) { fallback(c); return; }
  const vs = `attribute vec2 a; void main(){ gl_Position = vec4(a,0.0,1.0); }`;
  const fs = `
precision highp float;
uniform vec2 u_res; uniform float u_t; uniform float u_seed;
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy/u_res; vec2 p = (gl_FragCoord.xy-0.5*u_res)/u_res.y;
  float t = u_t*0.06 + u_seed*10.0;
  // three drifting centres
  vec2 c1 = vec2(-0.55+0.25*sin(t*0.9), 0.15+0.2*cos(t*0.7));
  vec2 c2 = vec2( 0.55+0.25*cos(t*0.8),-0.10+0.2*sin(t*1.1));
  vec2 c3 = vec2( 0.05+0.35*sin(t*0.5), 0.35+0.15*cos(t*0.6));
  float n = fbm(p*1.6 + t*0.3)*0.35;
  float d1 = exp(-2.0*dot(p-c1,p-c1)), d2 = exp(-1.9*dot(p-c2,p-c2)), d3 = exp(-2.6*dot(p-c3,p-c3));
  vec3 bg = vec3(0.047,0.063,0.098);
  vec3 col = bg;
  col += vec3(0.36,0.49,1.00)*d1*(1.1+n);
  col += vec3(1.00,0.24,0.51)*d2*(1.0+n);
  col += vec3(1.00,0.54,0.24)*d3*(0.8+n);
  col += vec3(0.16,0.83,0.77)*exp(-3.5*dot(p-vec2(-0.1,-0.35),p-vec2(-0.1,-0.35)))*(0.6+n);
  // dim the lower half so the card reads
  col = mix(col, bg, smoothstep(0.5, 0.0, uv.y)*0.45);
  // very light grain so it is not plastic
  col += (hash(gl_FragCoord.xy + t)-0.5)*0.02;
  gl_FragColor = vec4(col,1.0);
}`;
  function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
  const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) { fallback(c); return; }
  const prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(prog, "a"); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, "u_res"), uT = gl.getUniformLocation(prog, "u_t"), uSeed = gl.getUniformLocation(prog, "u_seed");
  gl.uniform1f(uSeed, Math.random());
  function size() { const r = c.getBoundingClientRect(); const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    c.width = Math.max(2, Math.round(r.width * dpr)); c.height = Math.max(2, Math.round(r.height * dpr)); gl.viewport(0, 0, c.width, c.height); }
  const start = performance.now();
  function frame(now) { gl.uniform2f(uRes, c.width, c.height); gl.uniform1f(uT, (now - start) / 1000); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); if (!reduce) requestAnimationFrame(frame); }
  size(); window.addEventListener("resize", () => { size(); if (reduce) frame(performance.now()); });
  requestAnimationFrame(frame);
  function fallback(canvas) { canvas.style.background = "radial-gradient(40% 60% at 20% 30%, rgba(91,124,255,.5), transparent 70%), radial-gradient(40% 60% at 80% 40%, rgba(139,92,246,.45), transparent 70%), #0c1019"; }
})();
