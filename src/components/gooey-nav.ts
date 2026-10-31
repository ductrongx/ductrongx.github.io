// Adapted from React Bits Gooey Nav's DOM/particle edition (c83b5e7).
// SVG alpha filtering keeps the indigo palette without a WebGL canvas.
// License and upstream links: /licenses/react-bits.txt.
const nav = document.querySelector<HTMLElement>('[data-gooey-nav]');
const header = document.querySelector<HTMLElement>('[data-site-header]');

if (nav) {
  const pill = nav.querySelector<HTMLElement>('.gooey-pill');
  const particles = nav.querySelector<HTMLElement>('.gooey-particles');
  const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('.gooey-link'));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = links.find(link => link.dataset.section === nav.dataset.activeSection) ?? links[0];
  let highlighted: HTMLAnchorElement | undefined;
  let pillAnimation: Animation | undefined;
  let particleAnimations: Animation[] = [];
  let scrollFrame = 0;
  let lockUntil = 0;
  let sectionPoints: { link: HTMLAnchorElement; top: number }[] = [];

  function clearParticles() {
    particleAnimations.forEach(animation => animation.cancel());
    particleAnimations = [];
    particles?.replaceChildren();
  }

  function burst(x: number, y: number, width: number, height: number) {
    if (!particles || reduced.matches) return;
    clearParticles();
    for (let index = 0; index < 10; index++) {
      const angle = (Math.PI * 2 * index) / 10;
      const dx = Math.cos(angle) * Math.min(width * .45, 40);
      const dy = Math.sin(angle) * (height * .5 + 8);
      const dot = document.createElement('span');
      dot.className = 'gooey-particle';
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      particles.append(dot);
      const animation = dot.animate([
        { transform: 'translate(0,0) scale(0)', opacity: 0 },
        { transform: `translate(${dx}px,${dy}px) scale(1)`, opacity: 1, offset: .38 },
        { transform: `translate(${dx * .2}px,${dy * .2}px) scale(.65)`, opacity: 1, offset: .78 },
        { transform: 'translate(0,0) scale(0)', opacity: 0 },
      ], { duration: 650 + index % 3 * 60, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
      particleAnimations.push(animation);
      void animation.finished.then(() => { dot.remove(); }, () => {});
    }
  }

  function moveTo(link: HTMLAnchorElement | undefined, animate = true, force = false) {
    if (!link || !nav || !pill || (!force && highlighted === link)) return;
    const previous = pill.getBoundingClientRect();
    const parent = nav.getBoundingClientRect();
    const target = link.getBoundingClientRect();
    pillAnimation?.cancel();
    links.forEach(item => item.toggleAttribute('data-highlighted', item === link));
    highlighted = link;
    Object.assign(pill.style, {
      left: `${target.left - parent.left}px`, top: `${target.top - parent.top}px`,
      width: `${target.width}px`, height: `${target.height}px`,
    });
    nav.setAttribute('data-ready', '');
    if (reduced.matches || !animate) { clearParticles(); return; }
    if (previous.width > 0) {
      pillAnimation = pill.animate([
        { transform: `translate(${previous.left - target.left}px,${previous.top - target.top}px) scale(${previous.width / target.width},${previous.height / target.height})` },
        { transform: 'translate(0,0) scale(1)' },
      ], { duration: 550, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
    burst(target.left - parent.left + target.width / 2, target.top - parent.top + target.height / 2, target.width, target.height);
  }

  function select(link: HTMLAnchorElement, animate = false) {
    active = link;
    links.forEach(item => {
      if (item === link) item.setAttribute('aria-current', location.pathname === '/' ? 'location' : 'page');
      else item.removeAttribute('aria-current');
    });
    if (!nav?.matches(':hover') && !nav?.contains(document.activeElement)) moveTo(active, animate);
  }

  function syncSection() {
    scrollFrame = 0;
    header?.toggleAttribute('data-scrolled', window.scrollY > 24);
    if (location.pathname !== '/' || performance.now() < lockUntil) return;
    const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 120;
    const position = window.scrollY + offset + window.innerHeight * .12;
    let current = sectionPoints[0];
    for (const point of sectionPoints) if (point.top <= position) current = point;
    if (current && current.link !== active) select(current.link);
  }

  function measure() {
    if (location.pathname === '/') sectionPoints = links.flatMap(link => {
      const section = document.getElementById(link.dataset.section ?? '');
      return section ? [{ link, top: section.getBoundingClientRect().top + window.scrollY }] : [];
    });
    moveTo(highlighted ?? active, false, true);
    syncSection();
  }

  links.forEach((link, index) => {
    link.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') moveTo(link); });
    link.addEventListener('focus', () => moveTo(link));
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      lockUntil = performance.now() + 1500;
      select(link, true);
      moveTo(link);
    });
    link.addEventListener('keydown', event => {
      let next: number;
      if (event.key === 'ArrowRight') next = (index + 1) % links.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + links.length) % links.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = links.length - 1;
      else return;
      event.preventDefault();
      links[next]?.focus();
    });
  });
  nav.addEventListener('pointerleave', () => {
    const focused = links.find(link => link.matches(':focus-visible'));
    moveTo(focused ?? active);
  });
  nav.addEventListener('focusout', () => queueMicrotask(() => {
    if (!nav.contains(document.activeElement)) moveTo(active);
  }));
  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(syncSection);
  }, { passive: true });
  window.addEventListener('wheel', () => { lockUntil = 0; }, { passive: true });
  window.addEventListener('touchstart', () => { lockUntil = 0; }, { passive: true });
  window.addEventListener('hashchange', () => { lockUntil = 0; syncSection(); });
  window.addEventListener('pageshow', measure);
  new ResizeObserver(measure).observe(nav);
  window.addEventListener('resize', measure, { passive: true });
  reduced.addEventListener('change', () => {
    pillAnimation?.cancel();
    clearParticles();
    moveTo(active, false, true);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pillAnimation?.cancel(); clearParticles(); }
  });
  measure();
  void document.fonts.ready.then(measure);
}
