// Text stays in the document; motion never changes its color or accessible wording.
export function createTextReveals(reduced: MediaQueryList) {
  const animations = new Map<Animation, HTMLElement>();
  const scrambles = new Map<HTMLElement, () => void>();
  const labels = new Set<HTMLElement>();
  document.querySelectorAll<HTMLElement>('main .section-index, footer .section-index, main [data-scramble], main .project-tags').forEach(element => {
    const paragraphs = element.querySelectorAll<HTMLElement>('p');
    if (paragraphs.length) paragraphs.forEach(p => labels.add(p));
    else labels.add(element);
  });
  const candidates = new Set(document.querySelectorAll<HTMLElement>('main h1, main h2, main h3, main h4, main h5, main h6, main p, footer h2, footer p'));
  labels.forEach(label => candidates.add(label));
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  function scramble(element: HTMLElement) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node instanceof Text && /[a-z0-9]/i.test(node.data) && !node.parentElement?.closest('.sr-only')) nodes.push(node);
    }
    const originals: { marker: HTMLElement; node: Text }[] = [];
    const words: { overlay: HTMLElement; text: string }[] = [];
    nodes.forEach(node => {
      const marker = document.createElement('span');
      marker.style.display = 'contents';
      const accessible = document.createElement('span');
      accessible.className = 'sr-only';
      accessible.textContent = node.data;
      marker.append(accessible);
      for (const token of node.data.split(/(\s+)/)) {
        if (!token.trim()) { marker.append(document.createTextNode(token)); continue; }
        const slot = document.createElement('span');
        slot.className = 'scramble-slot';
        slot.setAttribute('aria-hidden', 'true');
        const reserve = document.createElement('span');
        reserve.className = 'scramble-reserve';
        reserve.textContent = token;
        const overlay = document.createElement('span');
        overlay.className = 'scramble-overlay';
        overlay.textContent = token;
        slot.append(reserve, overlay);
        marker.append(slot);
        words.push({ overlay, text: token });
      }
      node.replaceWith(marker);
      originals.push({ marker, node });
    });
    let frame = 0;
    let previousTick = -1;
    const start = performance.now();
    const finish = () => {
      cancelAnimationFrame(frame);
      originals.forEach(({ marker, node }) => marker.replaceWith(node));
      scrambles.delete(element);
    };
    scrambles.set(element, finish);
    function render(time: number) {
      const progress = Math.min(1, (time - start) / 600);
      if (progress === 1) { finish(); return; }
      const tick = Math.floor((time - start) / 40);
      if (tick !== previousTick) {
        previousTick = tick;
        words.forEach(({ overlay, text }) => {
          overlay.textContent = Array.from(text, (char, index) =>
            !/[a-z0-9]/i.test(char) || index < progress * text.length
              ? char : alphabet[Math.floor(Math.random() * alphabet.length)] ?? char
          ).join('');
        });
      }
      frame = requestAnimationFrame(render);
    }
    frame = requestAnimationFrame(render);
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue;
      const element = entry.target;
      observer.unobserve(element);
      if (reduced.matches || element.closest('a')?.matches(':focus-visible')) continue;
      const lines = Array.from(element.querySelectorAll<HTMLElement>('.line-content'));
      const visualText = element.matches('[data-scroll-reveal]') ? element.querySelector<HTMLElement>(':scope > [aria-hidden="true"]') : null;
      const pieces = lines.length ? lines : [visualText ?? element];
      pieces.forEach((piece, index) => {
        const animation = piece.animate([
          { opacity: .1, transform: 'translate3d(0,22px,0)', filter: 'blur(3px)' },
          { opacity: 1, transform: 'translate3d(0,0,0)', filter: 'blur(0px)' },
        ], { duration: labels.has(element) ? 600 : 950, delay: index * 90, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
        animations.set(animation, element);
        void animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
      });
      if (labels.has(element)) scramble(element);
    }
  }, { threshold: .1 });
  candidates.forEach(element => {
    if (!element.closest('[aria-hidden="true"], .sr-only, dialog, pre, code')) observer.observe(element);
  });

  function finishAll() {
    animations.forEach((_, animation) => animation.cancel());
    animations.clear();
    scrambles.forEach(finish => finish());
  }
  document.addEventListener('focusin', event => {
    if (!(event.target instanceof Element)) return;
    const owner = event.target;
    animations.forEach((element, animation) => { if (owner.contains(element)) animation.finish(); });
    scrambles.forEach((finish, element) => { if (owner.contains(element)) finish(); });
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finishAll(); });
  reduced.addEventListener('change', () => { if (reduced.matches) finishAll(); });
}
