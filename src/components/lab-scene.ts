import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { buildLabRoom } from "./lab-room";

// Preset views keep navigation predictable and avoid game-like controls.
const views: Record<string, { position: number[]; target: number[] }> = {
  poster: { position: [8.2, 3.7, 10.5], target: [-1, 2.3, -1] },
  overview: { position: [6.8, 3.2, 9.2], target: [0.4, 2.25, -1.4] },
  work: { position: [2, 4, 6], target: [-0.8, 1.8, 0] },
  experience: { position: [-3, 3, 5], target: [-3, 2.5, -2] },
  blog: { position: [7.2, 2.8, 4.8], target: [4.5, 2.1, -2.5] },
  contact: { position: [1, 3.8, 4], target: [1.3, 1.4, 0.8] },
};
export function createLabScene(
  host: HTMLElement,
  onSelect: (id: string) => void,
) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(
    Math.min(
      devicePixelRatio,
      matchMedia("(max-width:767px)").matches ? 1.5 : 2,
    ),
  );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#eeeae1");
  const camera = new THREE.PerspectiveCamera(49, 1, 0.1, 100);
  const target = new THREE.Vector3(-1, 2.3, -1);
  camera.position.set(8.2, 3.7, 10.5);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  scene.background = new THREE.Color("#edf2f2");
  const pmrem = new THREE.PMREMGenerator(renderer);
  const studio = new RoomEnvironment();
  const environment = pmrem.fromScene(studio, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.4;
  studio.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight("#f5f8ed", "#576769", 0.65));
  const sun = new THREE.DirectionalLight("#fff7df", 3.2);
  sun.position.set(-6, 6, 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 });
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.0002;
  scene.add(sun);
  RectAreaLightUniformsLib.init();
  const ceiling = new THREE.RectAreaLight("#c5edff", 3, 5, 2);
  ceiling.position.set(0, 4.65, 0.1);
  ceiling.lookAt(0, 0, 0.1);
  scene.add(ceiling);
  const fill = new THREE.RectAreaLight("#ddd8ff", 2, 3, 3);
  fill.position.set(5, 3, 2);
  fill.lookAt(0, 2, 0);
  scene.add(fill);
  const room = buildLabRoom(scene);
  const meshes = room.meshes;
  // Contact shading is desktop-only; the mobile path stays a single render pass.
  const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    samples: 4,
  });
  const composer = new EffectComposer(renderer, renderTarget);
  composer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const contactShadows = new SSAOPass(scene, camera, 512, 512, 16);
  contactShadows.kernelRadius = 5;
  contactShadows.minDistance = 0.002;
  contactShadows.maxDistance = 0.06;
  const beauty = new RenderPass(scene, camera);
  composer.addPass(beauty);
  composer.addPass(contactShadows);
  const output = new OutputPass();
  composer.addPass(output);
  let useContactShadows = host.clientWidth >= 768;
  const labels = [
    { id: "poster", name: "Giới thiệu", point: new THREE.Vector3(0, 4.3, -3) },
    { id: "work", name: "Dự án", point: new THREE.Vector3(-0.9, 2.9, 0.1) },
    {
      id: "experience",
      name: "Kinh nghiệm",
      point: new THREE.Vector3(-3.5, 3.6, -3),
    },
    { id: "blog", name: "Bài viết", point: new THREE.Vector3(3.65, 3.2, -2.1) },
    {
      id: "contact",
      name: "Liên hệ",
      point: new THREE.Vector3(1.55, 1.85, 1.05),
    },
  ].map((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "lab-hotspot";
    button.textContent = item.name + " ↗";
    button.tabIndex = -1;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      onSelect(item.id);
    });
    host.append(button);
    return { ...item, button };
  });
  let active = "poster";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let visible = true;
  let transition:
    | {
        start: number;
        from: THREE.Vector3;
        targetFrom: THREE.Vector3;
        to: THREE.Vector3;
        look: THREE.Vector3;
      }
    | undefined;
  function draw(now: number) {
    frame = 0;
    if (!visible || document.hidden) return;
    if (transition) {
      const p = reduced.matches
        ? 1
        : Math.min((now - transition.start) / 900, 1);
      const eased = p * p * (3 - 2 * p);
      camera.position.lerpVectors(transition.from, transition.to, eased);
      target.lerpVectors(transition.targetFrom, transition.look, eased);
      if (p === 1) transition = undefined;
    }
    camera.lookAt(target);
    if (useContactShadows) composer.render();
    else renderer.render(scene, camera);
    labels.forEach(({ point, button }) => {
      const projected = point.clone().project(camera);
      button.hidden =
        active !== "overview" ||
        Math.abs(projected.x) > 0.9 ||
        Math.abs(projected.y) > 0.9 ||
        projected.z > 1;
      button.style.left = `${(projected.x + 1) * 50}%`;
      button.style.top = `${(1 - projected.y) * 50}%`;
    });
    if (transition) frame = requestAnimationFrame(draw);
  }
  function render() {
    if (!frame) frame = requestAnimationFrame(draw);
  }
  function settle() {
    if (transition) {
      camera.position.copy(transition.to);
      target.copy(transition.look);
      transition = undefined;
    }
    cancelAnimationFrame(frame);
    frame = 0;
  }
  function go(id: string) {
    active = id;
    const view = views[id] ?? views.overview;
    if (!view) return;
    transition = {
      start: performance.now(),
      from: camera.position.clone(),
      targetFrom: target.clone(),
      to: new THREE.Vector3(...view.position),
      look: new THREE.Vector3(...view.target),
    };
    render();
  }
  const resize = new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height, false);
    useContactShadows = width >= 768;
    composer.setSize(width, height);
    camera.aspect = width / Math.max(height, 1);
    camera.zoom = Math.min(1, Math.max(0.5, camera.aspect / 1.35));
    camera.updateProjectionMatrix();
    render();
  });
  resize.observe(host);
  const observer = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (!visible) settle();
    else render();
  });
  observer.observe(host);
  const visibility = () => {
    if (document.hidden) settle();
    else render();
  };
  document.addEventListener("visibilitychange", visibility);
  const motion = () => {
    settle();
    render();
  };
  reduced.addEventListener("change", motion);
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const click = (event: MouseEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(meshes)[0];
    const id: unknown = hit?.object.userData.destination;
    if (typeof id === "string") onSelect(id);
  };
  renderer.domElement.addEventListener("click", click);
  render();
  return {
    go,
    dispose() {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", motion);
      renderer.domElement.removeEventListener("click", click);
      labels.forEach((item) => item.button.remove());
      room.dispose();
      environment.dispose();
      sun.shadow.dispose();
      beauty.dispose();
      contactShadows.dispose();
      output.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
