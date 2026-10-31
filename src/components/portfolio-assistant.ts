export {};
const dialog = document.querySelector<HTMLDialogElement>('#portfolio-chat');
const launcher = document.querySelector<HTMLButtonElement>('[data-assistant-launcher]');
const openers = document.querySelectorAll<HTMLButtonElement>('[data-chat-open]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

if (dialog && launcher) {
  let previousFocus: Element | null = null;
  let transition: Animation | undefined;
  let closing = false;
  openers.forEach(button => { button.hidden = false; });

  const close = async () => {
    if (closing || !dialog.open) return;
    closing = true;
    transition?.cancel();
    if (!reduced.matches) {
      transition = dialog.animate([{ opacity: 1, transform: 'translateY(0) scale(1)' }, { opacity: 0, transform: 'translateY(18px) scale(.97)' }], { duration: 220, easing: 'ease-in', fill: 'forwards' });
      await transition.finished.catch(() => {});
    }
    dialog.close();
    transition?.cancel();
    launcher.setAttribute('aria-expanded', 'false');
    document.dispatchEvent(new Event('assistant-visibility'));
    if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
    closing = false;
  };

  openers.forEach(button => button.addEventListener('click', () => {
    if (dialog.open) return;
    previousFocus = document.activeElement;
    dialog.showModal();
    launcher.setAttribute('aria-expanded', 'true');
    document.dispatchEvent(new Event('assistant-visibility'));
    dialog.querySelector<HTMLButtonElement>('[data-chat-close]')?.focus({ preventScroll: true });
    if (!reduced.matches) {
      transition = dialog.animate([{ opacity: 0, transform: 'translateY(32px) scale(.94)', transformOrigin: '100% 100%' }, { opacity: 1, transform: 'translateY(0) scale(1)', transformOrigin: '100% 100%' }], { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
  }));
  dialog.querySelector('[data-chat-close]')?.addEventListener('click', () => { void close(); });
  dialog.addEventListener('cancel', event => { event.preventDefault(); void close(); });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), textarea, input:not(:disabled), a[href]'));
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first && last) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last && first) { event.preventDefault(); first.focus(); }
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) void close(); } });
  dialog.querySelectorAll<HTMLButtonElement>('[data-chat-prompt]').forEach(button => button.addEventListener('click', () => {
    const input = dialog.querySelector<HTMLTextAreaElement>('textarea');
    if (input) { input.value = button.dataset.chatPrompt ?? ''; input.focus(); }
  }));
  reduced.addEventListener('change', () => transition?.finish());
  // Shader loads after the functional HTML controls, and has a static CSS fallback.
  void import('./strands-orb').then(({ mountStrandsOrb }) => mountStrandsOrb(launcher)).catch(() => {});
}
