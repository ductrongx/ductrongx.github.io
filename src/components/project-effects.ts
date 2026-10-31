// Adapted from React Bits Tilted Card and Scroll Reveal. See /licenses/react-bits.txt.
interface Spring { value: number; velocity: number; target: number }
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const spring = (): Spring => ({ value: 0, velocity: 0, target: 0 });

function stepSpring(state: Spring, elapsed: number) {
  const steps = Math.max(1, Math.ceil(elapsed / (1000 / 240)));
  const dt = elapsed / steps / 1000;
  for (let index = 0; index < steps; index++) {
    state.velocity += (144 * (state.target - state.value) - 21.6 * state.velocity) * dt;
    state.value += state.velocity * dt;
  }
  const settled = Math.abs(state.target - state.value) < .001 && Math.abs(state.velocity) < .01;
  if (settled) { state.value = state.target; state.velocity = 0; }
  return !settled;
}

export function createProjectEffects(wake: () => void, reduced: MediaQueryList) {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-depth-card]')).flatMap(stage => {
    const body = stage.querySelector<HTMLElement>('[data-depth-body]');
    return body ? [{ stage, body, x: spring(), y: spring(), lift: spring(), dirty: false }] : [];
  });
  const releaseCards = () => {
    cards.forEach(card => { card.x.target = card.y.target = card.lift.target = 0; card.dirty = true; });
    wake();
  };
  cards.forEach(card => {
    card.stage.addEventListener('pointermove', event => {
      if (reduced.matches || !finePointer.matches || event.pointerType !== 'mouse') return;
      const rect = card.stage.getBoundingClientRect();
      card.x.target = -clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1) * 6;
      card.y.target = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1) * 6;
      card.lift.target = 1;
      card.dirty = true;
      wake();
    }, { passive: true });
    card.stage.addEventListener('pointerleave', () => {
      card.x.target = card.y.target = card.lift.target = 0;
      card.dirty = true;
      wake();
    });
  });
  window.addEventListener('blur', releaseCards);

  function render(elapsed: number) {
    if (reduced.matches) return false;
    let moving = false;
    if (finePointer.matches) cards.forEach(card => {
      if (!card.dirty) return;
      const xMoving = stepSpring(card.x, elapsed);
      const yMoving = stepSpring(card.y, elapsed);
      const liftMoving = stepSpring(card.lift, elapsed);
      card.dirty = xMoving || yMoving || liftMoving;
      moving = card.dirty || moving;
      card.body.style.transform = card.x.value || card.y.value || card.lift.value
        ? `rotateX(${card.x.value.toFixed(3)}deg) rotateY(${card.y.value.toFixed(3)}deg) scale(${(1 + card.lift.value * .025).toFixed(4)})` : '';
      card.body.style.setProperty('--tilt-lift', String(card.lift.value));
    });
    return moving;
  }

  function reset() {
    cards.forEach(card => {
      [card.x, card.y, card.lift].forEach(axis => { axis.value = axis.velocity = axis.target = 0; });
      card.dirty = false;
      card.body.style.removeProperty('transform');
      card.body.style.removeProperty('--tilt-lift');
    });
  }

  finePointer.addEventListener('change', () => { reset(); wake(); });
  document.addEventListener('focusin', releaseCards);
  window.addEventListener('scroll', releaseCards, { passive: true });
  return { render, reset };
}
