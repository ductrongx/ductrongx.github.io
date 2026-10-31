function initBrandLogo(link: HTMLAnchorElement) {
  const cube = link.querySelector<HTMLElement>('[data-brand-cube]');
  const floating = link.querySelector<HTMLElement>('[data-brand-float]');
  const suffix = link.querySelector<HTMLElement>('[data-brand-ai]');
  if (!cube || !floating || !suffix) return () => {};

  const events = new AbortController();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const options = { signal: events.signal };
  let frame = 0;
  let lastTime = 0;
  let time = 0;
  let hovered = false;
  let focused = false;
  let engaged = false;
  let suspended = false;
  let yaw = -35;
  let pitch = -24;
  let pitchVelocity = 0;
  let yawVelocity = 0;
  let lockYaw = 135;
  let speed = 16;
  let speedVelocity = 0;
  let scrollEnergy = 0;
  let scrollY = window.scrollY;
  let scrollTime = performance.now();
  let pointerX = 0;
  let pointerY = 0;
  let pointerTilt = 0;
  let tiltVelocity = 0;
  let bob = 0;
  let scrambleStart: number | undefined;
  let lastScrambleStep = -1;
  const glyphs = '01<>/{}xai';

  function restoreText() {
    if (suffix) suffix.textContent = 'ai';
    scrambleStart = undefined;
    lastScrambleStep = -1;
  }

  function schedule() {
    link.toggleAttribute('data-motion-paused', document.hidden || suspended || reduced.matches);
    if (!frame && !document.hidden && !suspended && !reduced.matches) frame = requestAnimationFrame(render);
  }

  function stop() {
    link.setAttribute('data-motion-paused', '');
    cancelAnimationFrame(frame); frame = 0; lastTime = 0;
    scrollEnergy = 0; speed = 16; speedVelocity = 0;
    restoreText();
  }

  function setEngaged() {
    const next = hovered || focused;
    if (next === engaged) return;
    engaged = next;
    link.toggleAttribute('data-engaged', engaged);
    if (engaged) {
      // Advance a quarter turn, then settle on the nearest isometric orientation.
      lockYaw = Math.round((yaw - 45) / 90) * 90 + 135;
      yawVelocity = 0;
      if (!reduced.matches) { scrambleStart = performance.now(); lastScrambleStep = -1; }
    } else {
      yawVelocity = 0;
      speed = 16; speedVelocity = 0;
    }
    schedule();
  }

  function render(now: number) {
    frame = 0;
    if (document.hidden || suspended || reduced.matches || !cube || !floating || !suffix) return;
    const elapsed = Math.min((now - (lastTime || now - 16.67)) / 1000, 0.05);
    lastTime = now; time += elapsed;
    scrollEnergy *= Math.exp(-elapsed * 5);
    const steps = Math.max(1, Math.ceil(elapsed * 120));
    const dt = elapsed / steps;
    for (let i = 0; i < steps; i++) {
      speedVelocity += (90 * (16 + scrollEnergy - speed) - 19 * speedVelocity) * dt;
      speed += speedVelocity * dt;
      if (engaged) {
        yawVelocity += (210 * (lockYaw - yaw) - 27 * yawVelocity) * dt;
        yaw += yawVelocity * dt;
      } else yaw += Math.max(0, speed) * dt;
      const targetPitch = engaged ? -35.264 : -24 + pointerY;
      pitchVelocity += (110 * (targetPitch - pitch) - 20 * pitchVelocity) * dt;
      pitch += pitchVelocity * dt;
      tiltVelocity += (110 * ((engaged ? 0 : pointerX) - pointerTilt) - 20 * tiltVelocity) * dt;
      pointerTilt += tiltVelocity * dt;
    }
    const targetBob = engaged ? 0 : Math.sin(time * 1.35) * 1.15;
    bob += (targetBob - bob) * (1 - Math.exp(-elapsed * 8));
    cube.style.transform = `rotateX(${pitch.toFixed(3)}deg) rotateY(${(yaw + pointerTilt).toFixed(3)}deg)`;
    floating.style.transform = `translateY(${bob.toFixed(3)}px)`;

    if (scrambleStart !== undefined) {
      const progress = (now - scrambleStart) / 400;
      if (progress >= 1) restoreText();
      else {
        const step = Math.floor((now - scrambleStart) / 40);
        if (step !== lastScrambleStep) {
          suffix.textContent = (progress >= 0.5 ? 'a' : glyphs[Math.floor(Math.random() * glyphs.length)]) + glyphs[Math.floor(Math.random() * glyphs.length)];
          lastScrambleStep = step;
        }
      }
    }
    // At rest on hover there is no reason to keep rendering the locked cube.
    const settled = engaged && Math.abs(lockYaw - yaw) + Math.abs(yawVelocity) + Math.abs(pitch + 35.264) + Math.abs(pitchVelocity) + Math.abs(pointerTilt) + Math.abs(tiltVelocity) + Math.abs(bob) < 0.01;
    if (!settled || scrambleStart !== undefined) schedule();
    else lastTime = 0;
  }

  function resetPointer() { pointerX = pointerY = 0; }
  function resetMotion() {
    stop(); resetPointer(); scrollY = window.scrollY; scrollTime = performance.now();
    if (reduced.matches) {
      yaw = -35; lockYaw = 45; pitch = -24; pitchVelocity = yawVelocity = pointerTilt = tiltVelocity = bob = 0;
      cube?.style.removeProperty('transform'); floating?.style.removeProperty('transform');
    } else schedule();
  }

  link.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse' && finePointer.matches) { hovered = true; setEngaged(); } }, options);
  link.addEventListener('pointerleave', () => { hovered = false; setEngaged(); }, options);
  link.addEventListener('focus', () => { focused = link.matches(':focus-visible'); setEngaged(); }, options);
  link.addEventListener('blur', () => { focused = false; setEngaged(); }, options);
  window.addEventListener('pointermove', event => {
    if (reduced.matches || !finePointer.matches || event.pointerType !== 'mouse') return;
    pointerX = (event.clientX / innerWidth * 2 - 1) * 9;
    pointerY = -(event.clientY / innerHeight * 2 - 1) * 7;
  }, { ...options, passive: true });
  window.addEventListener('scroll', () => {
    const now = performance.now(); const nextY = window.scrollY;
    const velocity = Math.abs(nextY - scrollY) / Math.max(16, now - scrollTime) * 1000;
    scrollY = nextY; scrollTime = now;
    if (!reduced.matches && !document.hidden) scrollEnergy = Math.min(240, velocity * 0.07);
    schedule();
  }, { ...options, passive: true });
  window.addEventListener('blur', () => { hovered = focused = false; setEngaged(); resetPointer(); stop(); suspended = true; }, options);
  window.addEventListener('focus', () => { suspended = false; resetMotion(); }, options);
  document.documentElement.addEventListener('pointerleave', resetPointer, options);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else resetMotion(); }, options);
  window.addEventListener('pagehide', () => { suspended = true; stop(); }, options);
  window.addEventListener('pageshow', () => { suspended = false; resetMotion(); }, options);
  reduced.addEventListener('change', resetMotion, options);
  finePointer.addEventListener('change', () => { hovered = false; resetPointer(); setEngaged(); }, options);
  schedule();
  return () => { stop(); events.abort(); };
}

const cleanups = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-brand-logo]')).map(initBrandLogo);
if (import.meta.hot) import.meta.hot.dispose(() => cleanups.forEach(cleanup => cleanup()));
