import { strandsVertex, strandsFragment } from './strands-shader';

// React Bits Strands, hosted natively with a small, 30fps render surface.
export function mountStrandsOrb(container: HTMLElement) {
  const surface = container.querySelector<HTMLCanvasElement>('[data-strands-orb]');
  const context = surface?.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
  if (!surface || !context) return;
  const canvas = surface;
  const gl = context;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let uniforms = new Map<string, WebGLUniformLocation | null>();
  let frame = 0;
  let last = 0;
  let clock = 0;
  let visible = true;
  let lost = false;
  let hover = 0;
  let targetX = 0;
  let targetY = 0;
  let leanX = 0;
  let leanY = 0;
  const palette = new Float32Array(['#7967ef', '#846df4', '#83baff', '#fff0de', '#93f1ff', '#3569fa', '#193d9b', '#193d9b'].flatMap(hex => {
    const value = parseInt(hex.slice(1), 16);
    return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
  }));
  const uniform = (name: string) => {
    if (!program) return null;
    if (!uniforms.has(name)) uniforms.set(name, gl.getUniformLocation(program, name));
    return uniforms.get(name) ?? null;
  };

  function setup() {
    const next = gl.createProgram();
    if (!next) return false;
    for (const [type, source] of [[gl.VERTEX_SHADER, strandsVertex], [gl.FRAGMENT_SHADER, strandsFragment]] as const) {
      const shader = gl.createShader(type);
      if (!shader) { gl.deleteProgram(next); return false; }
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); gl.deleteProgram(next); return false; }
      gl.attachShader(next, shader);
      gl.deleteShader(shader);
    }
    gl.bindAttribLocation(next, 0, 'position');
    gl.linkProgram(next);
    if (!gl.getProgramParameter(next, gl.LINK_STATUS)) { gl.deleteProgram(next); return false; }
    program = next;
    uniforms = new Map();
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);
    gl.uniform3fv(uniform('uColors'), palette);
    gl.uniform1i(uniform('uCount'), 3);
    const settings = { uAmplitude: 1, uWaviness: 1, uThickness: 1, uGlow: 1, uTaper: 1, uSpread: 1, uHueShift: 0, uIntensity: 1.15, uSaturation: 1, uScale: 1, uGlass: 1, uRadius: .46, uRefraction: 1, uDispersion: 1, uRim: 1.2, uIntro: 1, uPulse: 0, uLight: 1, uOpacity: 1 };
    Object.entries(settings).forEach(([name, value]) => gl.uniform1f(uniform(name), value));
    container.setAttribute('data-orb-ready', '');
    return true;
  }

  function draw() {
    if (lost || !program) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uniform('uResolution'), canvas.width, canvas.height);
    gl.uniform3f(uniform('uMotion'), .26 * Math.sin(.53 * clock) + .1 * Math.sin(1.19 * clock + 1.3), 1 + .06 * Math.sin(.71 * clock), .06 * Math.sin(.41 * clock + 2));
    gl.uniform1f(uniform('uLevel'), .65 + hover * .18);
    gl.uniform2f(uniform('uLean'), leanX, leanY);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function tick(now: number) {
    frame = 0;
    if (lost || !visible || document.hidden || container.getAttribute('aria-expanded') === 'true') { last = 0; return; }
    const elapsed = last ? now - last : 34;
    if (elapsed >= 32) {
      const dt = Math.min(elapsed, 60) / 1000;
      last = now;
      clock += dt * .85;
      leanX += (targetX - leanX) * (1 - Math.exp(-dt / .3));
      leanY += (targetY - leanY) * (1 - Math.exp(-dt / .3));
      draw();
    }
    if (!reduced.matches) frame = requestAnimationFrame(tick);
  }
  function wake() {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    if (reduced.matches) { leanX = leanY = hover = 0; draw(); }
    else if (visible && !document.hidden && !lost && container.getAttribute('aria-expanded') !== 'true') frame = requestAnimationFrame(tick);
  }
  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(container.clientWidth * ratio));
    canvas.height = Math.max(1, Math.round(container.clientHeight * ratio));
    draw();
  }
  if (!setup()) return;
  resize();
  const observer = new ResizeObserver(resize); observer.observe(container);
  const intersection = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); wake(); }); intersection.observe(container);
  container.addEventListener('pointermove', event => {
    if (reduced.matches) return;
    const rect = container.getBoundingClientRect();
    hover = 1; targetX = ((event.clientX - rect.left) / rect.width - .5) * .8; targetY = -((event.clientY - rect.top) / rect.height - .5) * .8;
  });
  container.addEventListener('pointerleave', () => { hover = targetX = targetY = 0; });
  document.addEventListener('visibilitychange', wake);
  document.addEventListener('assistant-visibility', wake);
  reduced.addEventListener('change', wake);
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; container.removeAttribute('data-orb-ready'); cancelAnimationFrame(frame); });
  canvas.addEventListener('webglcontextrestored', () => { lost = false; if (setup()) { resize(); wake(); } });
  window.addEventListener('pagehide', event => {
    cancelAnimationFrame(frame); frame = 0;
    if (!event.persisted) { observer.disconnect(); intersection.disconnect(); gl.deleteBuffer(buffer); gl.deleteProgram(program); }
  });
  window.addEventListener('pageshow', wake);
  wake();
}
