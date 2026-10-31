import { createFluidCursor, type FluidCursorRenderer } from './fluid-cursor-renderer';

const canvas = document.querySelector<HTMLCanvasElement>('[data-fluid-cursor]');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

if (canvas) {
  const surface = canvas;
  let renderer: FluidCursorRenderer | undefined;
  let frame = 0, previous = 0, nextFrame = 0, lastInput = 0;
  let averageFrame = 16.67, sampleCount = 0;
  let from = { x: 0, y: 0 }, to = { x: 0, y: 0 };
  let pending = false, hasPoint = false, unavailable = false, contextLost = false;
  let dialogOpen = Boolean(document.querySelector('dialog[open]'));

  function stop() {
    cancelAnimationFrame(frame);
    frame = previous = nextFrame = 0;
    pending = hasPoint = false;
    renderer?.clear();
    surface.hidden = true;
  }
  function enabled() { return fine.matches && !reduced.matches && !document.hidden && !dialogOpen && !contextLost; }
  function render(now: number) {
    frame = 0;
    if (!enabled() || !renderer) { stop(); return; }
    const idle = now - lastInput;
    if (idle > 2400) { stop(); return; }
    // Schedule about 60 draws/sec even on 120/144Hz displays.
    if (now + .2 < nextFrame) { frame = requestAnimationFrame(render); return; }
    const elapsed = previous ? now - previous : 1000 / 60;
    previous = now;
    nextFrame = Math.max(nextFrame + 1000 / 60, now);
    const fadeProgress = Math.min(1, Math.max(0, (idle - 900) / 1500));
    const fade = 1 - fadeProgress * fadeProgress * (3 - 2 * fadeProgress);
    averageFrame += (elapsed - averageFrame) * .08;
    try {
      if (++sampleCount >= 45) {
        if (averageFrame > 18.5) renderer.reduceQuality();
        sampleCount = 0;
      }
      renderer.draw(Math.min(elapsed / 1000, 1 / 30), from, to, pending, fade);
    } catch {
      renderer.dispose();
      renderer = undefined;
      unavailable = true;
      stop();
      return;
    }
    from = { ...to };
    pending = false;
    frame = requestAnimationFrame(render);
  }
  function configure() {
    stop();
    if (!fine.matches || reduced.matches) { renderer?.dispose(); renderer = undefined; }
  }
  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !enabled() || unavailable) return;
    if (!renderer) {
      renderer = createFluidCursor(surface);
      if (!renderer) { unavailable = true; return; }
    }
    const now = performance.now();
    to = { x: event.clientX, y: event.clientY };
    if (!hasPoint || now - lastInput > 200) from = { ...to };
    hasPoint = true;
    pending = true;
    lastInput = now;
    surface.hidden = false;
    if (!frame) frame = requestAnimationFrame(render);
  }, { passive: true });
  window.addEventListener('resize', () => {
    stop();
    try { renderer?.resize(); }
    catch { renderer?.dispose(); renderer = undefined; unavailable = true; }
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', stop);
  window.addEventListener('blur', stop);
  window.addEventListener('pagehide', event => {
    stop();
    if (!event.persisted) { renderer?.dispose(); renderer = undefined; }
  });
  document.addEventListener('visibilitychange', stop);
  document.addEventListener('assistant-visibility', () => {
    dialogOpen = Boolean(document.querySelector('dialog[open]'));
    stop();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Tab') stop(); });
  surface.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    contextLost = true;
    stop();
    renderer = undefined;
  });
  surface.addEventListener('webglcontextrestored', () => {
    contextLost = unavailable = false;
    stop();
  });
  fine.addEventListener('change', configure);
  reduced.addEventListener('change', configure);
  configure();
}
