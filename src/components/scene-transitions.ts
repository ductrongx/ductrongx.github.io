import type { PrismScene } from './prism-scene';
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const ease = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
function layoutTop(element: HTMLElement) {
    let top = 0;
    let current: HTMLElement | null = element;
    while (current) {
        top += current.offsetTop;
        current = current.offsetParent instanceof HTMLElement ? current.offsetParent : null;
    }
    return top;
}
function hasKeyboardFocus(element: HTMLElement) {
    const focused = document.activeElement;
    return focused instanceof HTMLElement && focused !== element && element.contains(focused) && focused.matches(':focus-visible');
}
export function createSceneTransitions(requestFrame: () => void, reduced: MediaQueryList) {
    const hero = document.querySelector<HTMLElement>('[data-hero]');
    const copy = hero?.querySelector<HTMLElement>('[data-hero-copy]');
    const media = hero?.querySelector<HTMLElement>('[data-hero-media]');
    const host = hero?.querySelector<HTMLElement>('[data-prism-stage]');
    const pause = hero?.querySelector<HTMLButtonElement>('[data-prism-pause]');
    const header = document.querySelector<HTMLElement>('[data-site-header]');
    const scenes = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]:not([data-hero])')).map(element => ({ element, top: 0, height: 1 }));
    const lifetime = new AbortController();
    let prism: PrismScene | undefined;
    let loading = false;
    let failed = false;
    let disposed = false;
    let paused = false;
    let visible = true;
    let enabled = false;
    let heroTop = 0;
    let heroHeight = 1;
    let headerOffset = 0;
    let pointerX = 0;
    let pointerY = 0;
    const observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); if (visible)
        requestFrame(); });
    if (hero)
        observer.observe(hero);
    if (pause) {
        pause.hidden = false;
        pause.addEventListener('click', () => {
            paused = !paused;
            pause.setAttribute('aria-pressed', String(paused));
            pause.textContent = paused ? 'Resume motion ▷' : 'Pause motion Ⅱ';
            requestFrame();
        }, { signal: lifetime.signal });
    }
    function loadPrism() {
        if (!host || prism || loading || failed || reduced.matches)
            return;
        loading = true;
        void import('./prism-scene').then(({ createPrismScene }) => {
            loading = false;
            if (disposed || reduced.matches)
                return;
            prism = createPrismScene(host);
            failed = !prism;
            requestFrame();
        }).catch(() => { loading = false; failed = true; host.removeAttribute('data-ready'); });
    }
    function reset() {
        [hero, copy, media, ...scenes.map(scene => scene.element)].forEach(element => {
            for (const property of ['transform', 'will-change', 'border-radius'])
                element?.style.removeProperty(property);
        });
        pointerX = pointerY = 0;
    }
    function measure(active: boolean) {
        enabled = active;
        reset();
        heroTop = hero ? layoutTop(hero) : 0;
        heroHeight = hero?.offsetHeight ?? 1;
        headerOffset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 120;
        scenes.forEach(scene => { scene.top = layoutTop(scene.element); scene.height = scene.element.offsetHeight; });
        host?.toggleAttribute('data-static', reduced.matches);
        loadPrism();
        prism?.resize();
        updateHeader(window.scrollY);
    }
    function updateHeader(scroll: number) {
        if (!hero || !header)
            return;
        const line = scroll + headerOffset;
        let tone = 'dark';
        for (const scene of scenes)
            if (scene.top <= line)
                tone = scene.element.dataset.tone ?? 'light';
        if (header.dataset.tone !== tone)
            header.dataset.tone = tone;
    }
    function render(elapsed: number, scroll: number, height: number, pointer?: {
        x: number;
        y: number;
    }) {
        updateHeader(scroll);
        const exit = enabled ? ease((scroll - heroTop) / (heroHeight * .85)) : 0;
        if (hero && enabled) {
            const progress = hasKeyboardFocus(hero) ? 0 : exit;
            hero.style.transform = progress > 0 ? `perspective(1600px) translate3d(0,${progress * height * .24}px,${-progress * 180}px) scale(${1 - progress * .14}) rotateX(${progress * 7}deg)` : '';
            hero.style.borderRadius = `${progress * 64}px`;
            hero.style.willChange = exit > 0 && exit < 1 ? 'transform' : '';
            if (copy)
                copy.style.transform = `translate3d(0,${-progress * height * .16}px,0)`;
            if (media)
                media.style.transform = `scale(${1 + progress * .3})`;
        }
        if (enabled)
            scenes.forEach((scene, index) => {
                const start = scene.top - height;
                const end = scene.top - headerOffset - 24;
                const remaining = 1 - ease((scroll - start) / Math.max(1, end - start));
                const departure = ease((scroll - (scene.top + scene.height - height * .3)) / (height * .8));
                const focused = hasKeyboardFocus(scene.element);
                const direction = index % 2 === 0 ? 1 : -1;
                const y = remaining * height * .24 + departure * height * .12;
                const scale = 1 - remaining * .16 - departure * .1;
                scene.element.style.transform = !focused && (remaining > 0 || departure > 0)
                    ? `perspective(1800px) translate3d(${remaining * direction * 24}px,${y}px,0) scale(${scale}) rotateX(${remaining * 8}deg) rotateZ(${remaining * direction * -1.5}deg)` : '';
                scene.element.style.borderRadius = remaining > 0 || departure > 0 ? `${(remaining + departure) * 48}px` : '';
                scene.element.style.willChange = remaining > 0 && remaining < 1 || departure > 0 && departure < 1 ? 'transform' : '';
            });
        let moving = false;
        if (prism && visible && !document.hidden && !reduced.matches) {
            const x = pointer && enabled ? (pointer.x / window.innerWidth - .5) * 2 : 0;
            const y = pointer && enabled ? (pointer.y / height - .5) * 2 : 0;
            const blend = 1 - Math.exp(-elapsed / 180);
            pointerX += (x - pointerX) * blend;
            pointerY += (y - pointerY) * blend;
            moving = prism.render(elapsed, exit, pointerX, pointerY, !paused && enabled);
            moving = Math.abs(x - pointerX) + Math.abs(y - pointerY) > .005 || moving;
        }
        return moving;
    }
    function nearestStop(scroll: number) {
        if (!hero)
            return undefined;
        return [heroTop, ...scenes.map(scene => Math.max(0, scene.top - headerOffset))].find(top => Math.abs(top - scroll) > 2 && Math.abs(top - scroll) < 56);
    }
    function targetTop(target: HTMLElement) { return Math.max(0, layoutTop(target) - headerOffset); }
    function suspend() { pointerX = pointerY = 0; }
    function destroy() { disposed = true; observer.disconnect(); lifetime.abort(); prism?.dispose(); reset(); }
    return { measure, render, reset, nearestStop, targetTop, suspend, destroy, syncHeader: updateHeader };
}
