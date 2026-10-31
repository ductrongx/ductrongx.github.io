const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function createScrollScenes(reduced: MediaQueryList) {
  const projects = Array.from(document.querySelectorAll<HTMLElement>('[data-project-card]')).flatMap((element, index) => {
    const stage = element.querySelector<HTMLElement>('[data-tilted-card]');
    return stage ? [{ element, stage, side: index % 2 ? 1 : -1, top: 0, height: 0, started: false, elapsed: 0, direction: 1 }] : [];
  });
  const timelines = Array.from(document.querySelectorAll<HTMLElement>('[data-timeline]')).map(element => ({
    element, top: 0, height: 1, glass: element.querySelector<HTMLElement>('[data-timeline-glass]'),
    items: Array.from(element.querySelectorAll<HTMLElement>('[data-timeline-item]')).map(item => ({
      item, top: 0, revealed: false, animation: undefined as Animation | undefined,
      copy: item.querySelector<HTMLElement>('.timeline-copy'), node: item.querySelector<HTMLElement>('.timeline-node'),
    })),
  }));
  let previousScroll = window.scrollY;
  let scrollFlow = 0;
  let wide = window.innerWidth >= 768;
  let travel = 0;

  function measure() {
    wide = window.innerWidth >= 768;
    travel = Math.min(window.innerWidth * .045, 76);
    previousScroll = window.scrollY;
    scrollFlow = 0;
    projects.forEach(project => {
      // Measure the untransformed layout; scroll entry and pointer tilt have separate layers.
      project.top = project.element.getBoundingClientRect().top + scrollY;
      project.height = project.stage.offsetHeight;
    });
    timelines.forEach(timeline => {
      const track = timeline.element.querySelector<HTMLElement>('.timeline-list') ?? timeline.element;
      const trackTop = track.getBoundingClientRect().top + scrollY;
      timeline.items.forEach(row => {
        const rect = (row.node ?? row.item).getBoundingClientRect();
        row.top = rect.top + scrollY + (row.node ? rect.height / 2 : 0);
      });
      timeline.top = timeline.items[0]?.top ?? trackTop;
      timeline.height = Math.max(1, (timeline.items.at(-1)?.top ?? timeline.top) - timeline.top);
      timeline.element.style.setProperty('--timeline-start', `${timeline.top - trackTop}px`);
      timeline.element.style.setProperty('--timeline-length', `${timeline.height}px`);
    });
  }

  function render(elapsed: number, scroll: number, height: number) {
    const velocity = elapsed > 0 ? (scroll - previousScroll) / elapsed : 0;
    const targetFlow = Math.max(-1, Math.min(1, velocity / 1.8));
    scrollFlow += (targetFlow - scrollFlow) * (1 - Math.exp(-elapsed / 130));
    if (Math.abs(scrollFlow) < .001 && targetFlow === 0) scrollFlow = 0;
    previousScroll = scroll;
    let moving = false;
    let visibleProjects = 0;

    projects.forEach(project => {
      const focused = project.element.contains(document.activeElement);
      const duration = wide ? 1700 : 1150;
      const top = project.top - scroll;
      const bottom = top + project.height;

      if (reduced.matches || focused) {
        project.started = true;
        project.elapsed = duration;
        project.stage.style.removeProperty('transform');
        project.stage.style.removeProperty('will-change');
        return;
      }
      if (top >= height * .98 || bottom <= 0) {
        // Re-arm only after the whole image has left the screen, avoiding threshold flicker.
        if (top > height + 120 || bottom < -120) {
          project.started = false;
          project.elapsed = 0;
          project.stage.style.removeProperty('transform');
        }
        project.stage.style.removeProperty('will-change');
        return;
      }

      visibleProjects++;
      if (!project.started) {
        project.started = true;
        project.elapsed = wide && project.side > 0 ? -100 : 0;
        project.direction = top > 0 ? 1 : -1;
      }
      project.elapsed = Math.min(duration, project.elapsed + elapsed);
      // A timed, long-tail entrance continues settling after scrolling stops.
      const remaining = Math.pow(1 - clamp(project.elapsed / duration), 5);
      const flow = scrollFlow * (wide ? 1 : .35);
      const active = remaining > 0 || flow !== 0;
      if (active) {
        const x = project.side * travel * remaining;
        const y = project.direction * (wide ? 64 : 36) * remaining + flow * 7;
        const z = -(wide ? 220 : 110) * remaining;
        const rotateX = project.direction * 5 * remaining - flow * .8;
        const rotateZ = project.side * (2.4 * remaining + flow * .2);
        project.stage.style.transform = `perspective(1400px) translate3d(${x}px,${y}px,${z}px) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg)`;
        project.stage.style.willChange = 'transform';
        moving = true;
      } else {
        project.stage.style.removeProperty('transform');
        project.stage.style.removeProperty('will-change');
      }
    });
    if (!visibleProjects) scrollFlow = 0;
    timelines.forEach(timeline => {
      const readingLine = scroll + height * .7;
      timeline.element.style.setProperty('--timeline-progress', String(reduced.matches ? 1 : clamp((readingLine - timeline.top) / timeline.height)));
      if (timeline.glass) {
        const travel = (clamp((scroll + height - timeline.top) / (timeline.height + height)) - .5) * (wide ? 140 : 48);
        timeline.glass.style.transform = reduced.matches ? '' : `translate3d(0,${travel}px,0)`;
      }
      timeline.items.forEach(row => {
        const reached = reduced.matches || readingLine >= row.top;
        row.item.toggleAttribute('data-reached', reached);
        if (reduced.matches || row.item.contains(document.activeElement)) row.animation?.cancel();
        if (!reached || row.revealed) return;
        row.revealed = true;
        if (reduced.matches || !row.copy || row.top < scroll || row.item.contains(document.activeElement)) return;
        row.animation = row.copy.animate([
          { transform: 'translate3d(24px,0,0)' }, { transform: 'translate3d(0,0,0)' },
        ], { duration: 800, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
      });
    });
    return moving;
  }
  return { measure, render };
}
