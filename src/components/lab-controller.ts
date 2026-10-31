type Scene = { go: (id: string) => void; dispose: () => void };
export function initLab(root: HTMLElement) {
  const status = root.querySelector<HTMLElement>("[data-lab-status]");
  const panel = root.querySelector<HTMLElement>("[data-panel]");
  const explore = root.querySelector<HTMLButtonElement>("[data-explore]");
  const overview = root.querySelector<HTMLButtonElement>("[data-overview]");
  const hint = root.querySelector<HTMLElement>("[data-scene-hint]");
  const host = root.querySelector<HTMLElement>(".lab-canvas");
  if (!panel || !explore || !overview || !status || !host) return;
  const ui = { panel, explore, overview, status, host };
  root
    .querySelector<HTMLElement>("[data-lab-navigation]")
    ?.removeAttribute("hidden");
  let scene: Scene | undefined;
  let opener: HTMLElement | undefined;
  let loading: Promise<void> | undefined;
  let current = "poster";
  function select(id: string, focus = true) {
    current = id;
    root.dataset.view = scene ? id : "poster";
    scene?.go(id);
    ui.panel.hidden = id === "poster" || id === "overview";
    ui.overview.hidden = id === "poster";
    if (hint) hint.hidden = !scene || id !== "overview";
    root
      .querySelectorAll<HTMLElement>("[data-content]")
      .forEach((el) => (el.hidden = el.dataset.content !== id));
    root
      .querySelectorAll<HTMLButtonElement>("[data-destination]")
      .forEach((el) =>
        el.setAttribute("aria-pressed", String(el.dataset.destination === id)),
      );
    if (!ui.panel.hidden && focus)
      ui.panel
        .querySelector<HTMLElement>(`[data-content="${id}"] h2`)
        ?.focus();
  }
  async function load() {
    ui.status.textContent =
      "Đang chuẩn bị lab… Bạn vẫn có thể xem nội dung bên dưới.";
    try {
      const { createLabScene } = await import("./lab-scene");
      scene = createLabScene(ui.host, (id) => {
        opener =
          root.querySelector<HTMLElement>(`[data-destination="${id}"]`) ??
          undefined;
        select(id);
      });
      ui.host.querySelector("canvas")?.addEventListener(
        "webglcontextlost",
        () => {
          scene?.dispose();
          scene = undefined;
          root.dataset.view = "poster";
          ui.status.textContent =
            "Đang dùng hình lab tĩnh · Mọi nội dung vẫn truy cập được bên dưới";
        },
        { once: true },
      );
      ui.status.textContent =
        "Lab sẵn sàng · Chọn đồ vật hoặc dùng các mục bên dưới";
      ui.explore.hidden = false;
      select(current, false);
    } catch {
      ui.explore.hidden = true;
      ui.status.textContent =
        "Đang dùng hình lab tĩnh · Mọi nội dung vẫn truy cập được bên dưới";
    }
  }
  ui.explore.hidden = false;
  ui.explore.addEventListener("click", async () => {
    opener = ui.explore;
    loading ??= load();
    await loading;
    if (scene && root.getBoundingClientRect().bottom > 0) select("overview");
  });
  root
    .querySelectorAll<HTMLButtonElement>("[data-destination]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        opener = button;
        select(button.dataset.destination ?? "poster");
      }),
    );
  const close = () => {
    select(scene ? "overview" : "poster", false);
    opener?.focus({ preventScroll: true });
  };
  ui.overview.addEventListener("click", close);
  root.querySelector("[data-close]")?.addEventListener("click", close);
  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
    }
  });
  document
    .querySelectorAll<HTMLAnchorElement>('a[href*="#"]')
    .forEach((link) =>
      link.addEventListener("click", () => select("poster", false)),
    );
  if (matchMedia("(min-width: 768px)").matches) {
    loading = load();
  }
  window.addEventListener("pagehide", (event) => { if (!event.persisted) scene?.dispose(); });
}
