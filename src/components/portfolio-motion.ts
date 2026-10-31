import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { createProjectEffects } from './project-effects';
import { createScrollScenes } from './scroll-scenes';
import { createTextReveals } from './text-reveals';
import { createSceneTransitions } from './scene-transitions';

// React Bits Magnet / Split Text adapted for static Astro HTML.
// Source links and MIT + Commons Clause notice: /licenses/react-bits.txt.
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktop = window.matchMedia('(min-width: 768px) and (min-height: 680px) and (pointer: fine)');
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

let lenis: Lenis | undefined;
let frameId = 0;
let viewportHeight = window.innerHeight;
let frameTime = 0;
let engineTime = 0;
let pointer: { x: number; y: number } | undefined;
let pointerDirty = false;

const sceneTransitions = createSceneTransitions(requestFrame, reduced);
const listenerLifetime = new AbortController();
const { signal } = listenerLifetime;
let settleTimer = 0;
let anchorScrolling = false;
let wheelGesture = false;
const magnets = Array.from(document.querySelectorAll<HTMLElement>('[data-magnet]')).map(element => ({
  element, x: 0, y: 0, velocityX: 0, velocityY: 0, targetX: 0, targetY: 0,
}));
const projectEffects = createProjectEffects(requestFrame, reduced);
const scrollScenes = createScrollScenes(reduced);

function updateMagnetTargets() {
  pointerDirty = false;
  let owner: (typeof magnets)[number] | undefined;
  let nearest = Infinity;
  let offsetX = 0;
  let offsetY = 0;
  for (const magnet of magnets) {
    magnet.targetX = magnet.targetY = 0;
    if (!pointer || !desktop.matches || reduced.matches || magnet.element.matches(':focus-visible, [aria-expanded="true"]')) continue;
    const rect = magnet.element.getBoundingClientRect();
    if (!rect.width || rect.bottom < 0 || rect.top > viewportHeight) continue;
    // Subtract our translation so the attraction field stays anchored to the layout.
    const dx = pointer.x - (rect.left - magnet.x + rect.width / 2);
    const dy = pointer.y - (rect.top - magnet.y + rect.height / 2);
    const outside = Math.hypot(Math.max(0, Math.abs(dx) - rect.width / 2), Math.max(0, Math.abs(dy) - rect.height / 2));
    const distance = Math.hypot(dx, dy);
    if (outside > 24 || distance >= nearest) continue;
    const falloff = clamp((outside - 12) / 12);
    const pull = 1 - falloff * falloff * (3 - 2 * falloff);
    const limit = Math.min(1, 8 / Math.max(distance / 8, .001));
    owner = magnet;
    nearest = distance;
    offsetX = dx / 8 * pull * limit;
    offsetY = dy / 8 * pull * limit;
  }
  if (owner) { owner.targetX = offsetX; owner.targetY = offsetY; }
}

function releasePointer() {
  pointer = undefined;
  pointerDirty = true;
  requestFrame();
}

createTextReveals(reduced);

function requestFrame() {
  if (!frameId && !document.hidden && !reduced.matches) frameId = requestAnimationFrame(renderFrame);
}

function renderFrame(time: number) {
  frameId = 0;
  if (document.hidden || reduced.matches) return;
  // Lenis expects a continuous clock. Exclude idle time when our on-demand loop wakes.
  const elapsed = Math.min(time - (frameTime || time - 16), 64);
  engineTime += elapsed;
  lenis?.raf(engineTime);
  const scroll = window.scrollY;
  frameTime = time;
  if (pointerDirty) updateMagnetTargets();
  let moving = lenis?.isScrolling === 'smooth';
  moving = sceneTransitions.render(elapsed, scroll, viewportHeight, pointer) || moving;
  moving = projectEffects.render(elapsed) || moving;
  moving = scrollScenes.render(elapsed, scroll, viewportHeight) || moving;

  // Small spring steps stay stable across refresh rates and occasional long frames.
  const steps = Math.ceil(elapsed / (1000 / 120));
  const dt = elapsed / steps / 1000;
  magnets.forEach(magnet => {
    if (!desktop.matches) return;
    const settled = Math.abs(magnet.targetX - magnet.x) + Math.abs(magnet.targetY - magnet.y)
      + Math.abs(magnet.velocityX) + Math.abs(magnet.velocityY) < .02;
    if (settled) {
      magnet.x = magnet.targetX;
      magnet.y = magnet.targetY;
      magnet.velocityX = magnet.velocityY = 0;
    } else {
      for (let step = 0; step < steps; step++) {
        magnet.velocityX += (170 * (magnet.targetX - magnet.x) - 22 * magnet.velocityX) * dt;
        magnet.velocityY += (170 * (magnet.targetY - magnet.y) - 22 * magnet.velocityY) * dt;
        magnet.x += magnet.velocityX * dt;
        magnet.y += magnet.velocityY * dt;
      }
      moving = true;
    }
    magnet.element.style.translate = magnet.x || magnet.y ? `${magnet.x}px ${magnet.y}px` : '';
  });
  if (moving) requestFrame();
  else frameTime = 0;
}

function measure() {
  viewportHeight = window.innerHeight;
  sceneTransitions.measure(desktop.matches && !reduced.matches);
  scrollScenes.measure();
  scrollScenes.render(0, window.scrollY, viewportHeight);
  lenis?.resize();
  requestFrame();
}

function configureMotion() {
  clearTimeout(settleTimer);
  anchorScrolling = wheelGesture = false;
  lenis?.destroy();
  lenis = undefined;
  engineTime = 0;
  frameTime = 0;
  if (!reduced.matches && desktop.matches) {
    lenis = new Lenis({
      lerp: .1, autoRaf: false, smoothWheel: true, syncTouch: false, anchors: false,
    });
    lenis.on('virtual-scroll', requestFrame);
    lenis.on('scroll', requestFrame);
  }
  if (reduced.matches || !desktop.matches) {
    sceneTransitions.reset();
    magnets.forEach(magnet => {
      magnet.x = magnet.y = magnet.velocityX = magnet.velocityY = magnet.targetX = magnet.targetY = 0;
      magnet.element.style.removeProperty('translate');
    });
    pointer = undefined;

  }
  if (reduced.matches) {
    projectEffects.reset();
    cancelAnimationFrame(frameId);
    frameId = 0;
  }
  measure();
}

window.addEventListener('pointermove', event => {
  if (!desktop.matches || reduced.matches || event.pointerType !== 'mouse') return;
  pointer = { x: event.clientX, y: event.clientY };
  pointerDirty = true;
  requestFrame();
}, { passive: true, signal });
window.addEventListener('blur', releasePointer, { signal });
document.documentElement.addEventListener('pointerleave', releasePointer, { signal });
document.addEventListener('pointerdown', releasePointer, { passive: true, signal });

document.addEventListener('click', event => {
  if (!(event.target instanceof Element) || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest<HTMLAnchorElement>('a[href]');
  if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
  let id: string;
  try { id = decodeURIComponent(url.hash.slice(1)); } catch { return; }
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  clearTimeout(settleTimer);
  wheelGesture = false;
  anchorScrolling = true;
  history.pushState(null, '', url.hash);
  const finish = () => {
    anchorScrolling = false;
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  };
  if (lenis && !reduced.matches) {
    lenis.scrollTo(sceneTransitions.targetTop(target), { duration: .85, lerp: 0, onComplete: finish });
    requestFrame();
  } else {
    target.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
    finish();
  }
}, { signal });

// Settle only inside a small landing zone after wheel inertia has ended.
// Long sections, keyboard navigation and touch scrolling remain unrestricted.
function settleSection() {
  if (!wheelGesture || !lenis || reduced.matches || anchorScrolling || document.hidden
    || document.querySelector('dialog[open]') || document.activeElement?.matches('input,textarea,select,[contenteditable="true"]')) return;
  if (lenis.isScrolling || Math.abs(lenis.velocity) > .1) {
    settleTimer = window.setTimeout(settleSection, 100);
    return;
  }
  wheelGesture = false;
  const stop = sceneTransitions.nearestStop(window.scrollY);
  if (stop === undefined) return;
  lenis.scrollTo(stop, { duration: .45, lerp: 0 });
  requestFrame();
}
window.addEventListener('wheel', () => {
  anchorScrolling = false;
  wheelGesture = true;
  clearTimeout(settleTimer);
  settleTimer = window.setTimeout(settleSection, 240);
}, { passive: true, signal });
window.addEventListener('keydown', () => { wheelGesture = false; clearTimeout(settleTimer); }, { signal });
window.addEventListener('pointerdown', () => { wheelGesture = false; clearTimeout(settleTimer); }, { passive: true, signal });

document.addEventListener('focusin', releasePointer, { signal });
window.addEventListener('scroll', () => {
  sceneTransitions.syncHeader(window.scrollY);
  releasePointer();
}, { passive: true, signal });
window.addEventListener('resize', measure, { passive: true, signal });
window.addEventListener('pageshow', measure, { signal });
document.addEventListener('assistant-visibility', () => {
  if (document.querySelector('#portfolio-chat[open]')) lenis?.stop();
  else lenis?.start();
  releasePointer();
}, { signal });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(frameId); frameId = 0; frameTime = 0; sceneTransitions.suspend(); clearTimeout(settleTimer); }
  else measure();
}, { signal });
reduced.addEventListener('change', configureMotion, { signal });
desktop.addEventListener('change', configureMotion, { signal });
window.addEventListener('pagehide', event => {
  clearTimeout(settleTimer);
  cancelAnimationFrame(frameId);
  frameId = 0;
  if (event.persisted) return;
  lenis?.destroy();
  sceneTransitions.destroy();
  listenerLifetime.abort();
}, { signal });
configureMotion();
void document.fonts.ready.then(measure);
