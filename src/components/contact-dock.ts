// React Bits Dock's cosine magnification and spring, adapted for Astro links.
// Source and MIT + Commons Clause notice: /licenses/react-bits.txt.
const dock = document.querySelector<HTMLElement>('[data-contact-dock]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

if (dock) {
  const items = Array.from(dock.querySelectorAll<HTMLElement>('[data-dock-item]')).flatMap(element => {
    const icon = element.querySelector<HTMLElement>('[data-dock-icon]');
    return icon ? [{ element, icon, value: 0, velocity: 0, target: 0 }] : [];
  });
  let frame = 0;
  let lastTime = 0;

  function render(time: number) {
    frame = 0;
    const dt = Math.min(time - (lastTime || time - 16), 32) / 1000;
    lastTime = time;
    const steps = Math.max(1, Math.ceil(dt * 240));
    const step = dt / steps;
    const magnification = window.innerWidth < 768 ? .2 : .35;
    let moving = false;
    items.forEach(item => {
      for (let index = 0; index < steps; index++) {
        item.velocity += (1500 * (item.target - item.value) - 120 * item.velocity) * step;
        item.value += item.velocity * step;
      }
      if (Math.abs(item.target - item.value) < .001 && Math.abs(item.velocity) < .01) {
        item.value = item.target;
        item.velocity = 0;
      } else moving = true;
      item.icon.style.transform = item.value ? `translateY(${-24 * magnification * item.value}px) scale(${1 + magnification * item.value})` : '';
    });
    if (moving) frame = requestAnimationFrame(render);
    else lastTime = 0;
  }

  function targetAt(x?: number) {
    if (reduced.matches || document.hidden) return;
    items.forEach(item => {
      // The link stays still, so enlarged icons never shift the pointer's reference point.
      const rect = item.element.getBoundingClientRect();
      const reach = x === undefined ? 1 : Math.abs(x - rect.left - rect.width / 2) / 150;
      item.target = reach < 1 ? Math.cos(reach * Math.PI / 2) ** 2 : 0;
    });
    if (!frame) frame = requestAnimationFrame(render);
  }

  function reset() {
    cancelAnimationFrame(frame);
    frame = lastTime = 0;
    items.forEach(item => {
      item.value = item.velocity = item.target = 0;
      item.icon.style.removeProperty('transform');
    });
  }

  dock.addEventListener('pointermove', event => {
    if (!finePointer.matches || event.pointerType !== 'mouse') return;
    dock.removeAttribute('data-labels-dismissed');
    targetAt(event.clientX);
  }, { passive: true });
  dock.addEventListener('pointerleave', () => targetAt());
  dock.addEventListener('focusin', event => {
    dock.removeAttribute('data-labels-dismissed');
    if (!(event.target instanceof HTMLElement) || !event.target.matches(':focus-visible')) return;
    const rect = event.target.getBoundingClientRect();
    targetAt(rect.left + rect.width / 2);
  });
  dock.addEventListener('focusout', () => targetAt());
  dock.addEventListener('keydown', event => {
    if (event.key === 'Escape') { dock.setAttribute('data-labels-dismissed', ''); targetAt(); return; }
    const links = items.filter(item => item.element instanceof HTMLAnchorElement);
    const index = links.findIndex(item => item.element === event.target);
    if (index < 0) return;
    const next = event.key === 'ArrowRight' ? (index + 1) % links.length
      : event.key === 'ArrowLeft' ? (index - 1 + links.length) % links.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : undefined;
    if (next === undefined) return;
    event.preventDefault();
    links[next]?.element.focus();
  });
  window.addEventListener('blur', reset);
  window.addEventListener('resize', reset, { passive: true });
  window.addEventListener('scroll', reset, { passive: true });
  document.addEventListener('visibilitychange', reset);
  reduced.addEventListener('change', reset);
  finePointer.addEventListener('change', reset);
}
