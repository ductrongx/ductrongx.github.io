import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import profile from "../data/profile.json";

const palette = {
  paper: "#e8e8df",
  white: "#ffffff",
  silver: "#bccbcc",
  ink: "#1a242a",
  teal: "#6f8a46",
  ice: "#dbefef",
  blue: "#3567b5",
  lilac: "#d5d6ee",
};

/** Architectural research studio; static geometry is batched for on-demand rendering. */
export function buildLabRoom(scene: THREE.Scene) {
  const meshes: THREE.Mesh[] = [];
  const materials = new Map<string, THREE.Material>();
  const textures: THREE.Texture[] = [];
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = grainCanvas.height = 128;
  const grainContext = grainCanvas.getContext("2d");
  if (grainContext) {
    const pixels = grainContext.createImageData(128, 128);
    let seed = 41;
    for (let i = 0; i < pixels.data.length; i += 4) {
      seed = (seed * 16807) % 2147483647;
      const value = 110 + (seed % 40);
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
      pixels.data[i + 3] = 255;
    }
    grainContext.putImageData(pixels, 0, 0);
  }
  const grain = new THREE.CanvasTexture(grainCanvas);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(12, 12);
  textures.push(grain);
  function material(color: string, metal = false) {
    const key = `${color}/${metal}`;
    let value = materials.get(key);
    if (!value) {
      value = new THREE.MeshStandardMaterial({
        color,
        roughness: metal ? 0.32 : 0.72,
        metalness: metal ? 0.65 : 0.02,
        bumpMap: metal ? null : grain,
        bumpScale: 0.006,
      });
      materials.set(key, value);
    }
    return value;
  }
  function mesh(
    geometry: THREE.BufferGeometry,
    surface: THREE.Material,
    position: [number, number, number],
    id?: string,
  ) {
    const object = new THREE.Mesh(geometry, surface);
    object.position.set(...position);
    object.castShadow = true;
    object.receiveShadow = true;
    if (id) object.userData.destination = id;
    meshes.push(object);
    scene.add(object);
    return object;
  }
  function box(
    size: [number, number, number],
    position: [number, number, number],
    color: string,
    id?: string,
    metal = false,
  ) {
    const radius = Math.min(0.018, ...size.map((n) => n / 5));
    return mesh(
      new RoundedBoxGeometry(...size, 2, radius),
      material(color, metal),
      position,
      id,
    );
  }
  function cylinder(
    radius: number,
    height: number,
    position: [number, number, number],
    color: string,
    id?: string,
  ) {
    return mesh(
      new THREE.CylinderGeometry(radius, radius, height, 24),
      material(color, true),
      position,
      id,
    );
  }
  function connect(
    a: THREE.Vector3,
    b: THREE.Vector3,
    radius: number,
    color: string,
    id?: string,
  ) {
    const center = a.clone().add(b).multiplyScalar(0.5);
    const link = cylinder(
      radius,
      a.distanceTo(b),
      [center.x, center.y, center.z],
      color,
      id,
    );
    link.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      b.clone().sub(a).normalize(),
    );
    return link;
  }
  function display(
    width: number,
    height: number,
    position: [number, number, number],
    kind: "network" | "notes" | "identity",
    id: string,
  ) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 640;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = kind === "network" ? "#142b3c" : "#f5f8f6";
    ctx.fillRect(0, 0, 1024, 640);
    ctx.fillStyle = kind === "network" ? "#8be4dd" : "#137079";
    ctx.font = "24px sans-serif";
    ctx.fillText(
      kind === "network"
        ? "NEURAL WORKSPACE"
        : kind === "identity"
          ? "PERSONAL RESEARCH STUDIO"
          : "RESEARCH / FIELD NOTES",
      50,
      64,
    );
    ctx.fillStyle = kind === "network" ? "#b9cdd8" : "#536975";
    ctx.font = "18px sans-serif";
    ctx.fillText("CONCEPT VISUALIZATION — NOT LIVE DATA", 50, 600);
    if (kind === "network") {
      ctx.strokeStyle = "#294452";
      ctx.lineWidth = 1;
      for (let x = 50; x < 1000; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 100);
        ctx.lineTo(x, 530);
        ctx.stroke();
      }
      for (let y = 100; y < 540; y += 40) {
        ctx.beginPath();
        ctx.moveTo(50, y);
        ctx.lineTo(970, y);
        ctx.stroke();
      }
      ctx.fillStyle = "#94aab9";
      ctx.font = "16px monospace";
      ctx.fillText("INPUT", 100, 125);
      ctx.fillText("REPRESENTATION", 380, 125);
      ctx.fillText("OUTPUT", 830, 125);
      ctx.fillStyle = "#233d4c";
      ctx.fillRect(50, 525, 280, 35);
      ctx.fillRect(350, 525, 290, 35);
      ctx.fillRect(660, 525, 310, 35);
      ctx.fillStyle = "#b6d9c0";
      ctx.fillText("01 / EMBEDDINGS", 65, 548);
      ctx.fillText("02 / REASONING", 365, 548);
      ctx.fillText("03 / EVALUATION", 675, 548);
      const layers = [3, 5, 5, 3];
      layers.forEach((count, l) => {
        for (let n = 0; n < count; n++) {
          const x = 140 + l * 245,
            y = 190 + n * 65 + (5 - count) * 32;
          if (l < 3) {
            const next = layers[l + 1] ?? 0;
            for (let k = 0; k < next; k++) {
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x + 245, 190 + k * 65 + (5 - next) * 32);
              ctx.strokeStyle = "rgba(121,187,210,.22)";
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.fillStyle = l === 2 ? "#b9aff0" : "#87dfd3";
          ctx.fill();
        }
      });
    } else if (kind === "identity") {
      ctx.fillStyle = "#dcebea";
      ctx.fillRect(50, 130, 260, 385);
      ctx.strokeStyle = "#90b1b3";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(180, 275, 68, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#263b46";
      ctx.font = "bold 52px sans-serif";
      ctx.fillText(profile.name, 355, 220, 610);
      ctx.font = "32px sans-serif";
      ctx.fillText(profile.role, 355, 285);
      ctx.font = "23px sans-serif";
      ctx.fillText("LLM / AGENTIC AI / ENGINEERING", 355, 360);
      ctx.fillText("Ideas. Experiments. Systems.", 355, 440);
    } else {
      [
        "01   QUESTION → EXPERIMENT",
        "02   MODEL → EVALUATE",
        "03   ITERATE → DOCUMENT",
      ].forEach((t, i) => {
        ctx.fillStyle = i === 1 ? "#e6e5f2" : "#e0eceb";
        ctx.fillRect(50, 130 + i * 135, 920, 100);
        ctx.fillStyle = "#263b46";
        ctx.font = "28px sans-serif";
        ctx.fillText(t, 80, 190 + i * 135);
      });
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.push(texture);
    const surface = new THREE.MeshBasicMaterial({
      map: texture,
      toneMapped: false,
    });
    materials.set(`display-${kind}-${textures.length}`, surface);
    const screen = mesh(
      new THREE.PlaneGeometry(width, height),
      surface,
      position,
      id,
    );
    screen.castShadow = false;
    return screen;
  }

  // Full-size architectural envelope extends beyond the camera, without a model plinth.
  box([28, 0.12, 28], [0, -0.08, 3], "#aab2ae");
  box([22, 6.4, 0.2], [0, 3.2, -3.65], palette.paper);
  box([0.2, 6.4, 20], [-7.5, 3.2, 3], "#cbd3cf");
  box([24, 0.15, 22], [0, 6.4, 3], "#d6dcd7");
  for (let x = -10; x < 11; x += 1.5) {
    box([0.018, 0.006, 24], [x, 0, 3], "#939d98");
    box([0.025, 6.3, 0.03], [x, 3.15, -3.53], "#b9c3ba");
  }
  for (let z = -3; z < 15; z += 1.5)
    box([23, 0.006, 0.018], [0, 0, z], "#939d98");
  box([22, 0.13, 0.1], [0, 0.15, -3.48], palette.ink, undefined, true);
  // Right-hand compute bay: dark acoustic slats contrast with mineral walls.
  box([5.4, 5.8, 0.12], [5.2, 2.9, -3.48], "#263039");
  for (let x = 2.6; x < 7.9; x += 0.16)
    box([0.035, 5.7, 0.08], [x, 2.9, -3.37], "#3e4b50", undefined, true);
  // Daylight glazing and structural mullions on the left.
  box([0.08, 4.4, 10], [-7.35, 3.5, 2], "#edf6ee");
  for (let z = -2; z < 8; z += 1.7)
    box([0.12, 5, 0.08], [-7.24, 3.3, z], palette.silver, undefined, true);
  for (const y of [1.1, 5.7])
    box([0.12, 0.1, 10], [-7.2, y, 2], palette.ink, undefined, true);
  // Suspended ceiling baffles and linear lights establish perspective and scale.
  for (let x = -6; x < 9; x += 1.4) {
    box([0.075, 0.25, 14], [x, 6.13, 2], "#bac4be", undefined, true);
    box([0.035, 0.025, 10], [x, 5.98, 2], "#f6ffe5");
  }
  // Suspended luminaire and low-profile research desk.
  box([5.8, 0.1, 0.22], [-0.4, 4.8, 0.1], palette.ink, undefined, true);
  box([5.5, 0.035, 0.18], [-0.4, 4.73, 0.1], "#d1ffff");
  for (const x of [-2.8, 2])
    box([0.025, 0.4, 0.025], [x, 5, 0.1], palette.silver, undefined, true);
  box([5.8, 0.17, 2.35], [-0.5, 1.55, 0.5], palette.white, "work");
  box([5.5, 0.07, 2.1], [-0.5, 1.43, 0.5], palette.silver, "work", true);
  for (const x of [-2.9, 1.9]) {
    box([0.16, 1.4, 1.8], [x, 0.76, 0.5], palette.silver, "work", true);
    box([0.55, 0.08, 2], [x, 0.11, 0.5], palette.ink, "work");
  }
  box([4.8, 0.025, 0.035], [-0.5, 1.47, 1.68], palette.teal, "work");
  // Ultrawide display with an explicitly illustrative network, plus a secondary console.
  box([2.65, 1.4, 0.13], [-0.75, 2.52, -0.05], palette.ink, "work", true);
  display(2.5, 1.25, [-0.75, 2.52, 0.025], "network", "work");
  box([0.13, 0.35, 0.14], [-0.75, 1.82, -0.05], palette.silver, "work", true);
  box([0.8, 0.06, 0.5], [-0.75, 1.68, 0], palette.ink, "work");
  box([1.55, 0.045, 0.5], [-0.75, 1.68, 0.9], palette.silver, "work", true);
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 12; col++)
      box(
        [0.09, 0.016, 0.075],
        [-1.39 + col * 0.116, 1.715, 0.75 + row * 0.12],
        palette.paper,
        "work",
      );
  box([0.22, 0.08, 0.34], [0.35, 1.72, 0.9], palette.white, "work");
  box([0.8, 0.04, 0.6], [1.55, 1.68, 1.05], palette.ice, "contact");
  box([0.55, 0.015, 0.06], [1.55, 1.71, 1.05], palette.teal, "contact");
  // Compute rack: framed enclosure, repeated accelerator trays, vents and quiet status lights.
  box([1.2, 2.8, 1.05], [3.65, 1.48, -2.65], palette.ink, "blog", true);
  box([1.08, 2.65, 0.035], [3.65, 1.48, -2.1], "#385768", "blog", true);
  for (let i = 0; i < 6; i++) {
    const y = 0.43 + i * 0.4;
    box([0.97, 0.31, 0.12], [3.65, y, -2.03], palette.silver, "blog", true);
    for (let v = 0; v < 7; v++)
      box(
        [0.045, 0.18, 0.025],
        [3.3 + v * 0.09, y, -1.955],
        palette.ink,
        "blog",
      );
    box(
      [0.045, 0.05, 0.025],
      [4.04, y, -1.95],
      i % 2 ? palette.teal : palette.blue,
      "blog",
    );
  }
  box([1.25, 0.09, 1.1], [3.65, 2.93, -2.65], palette.ice, "blog");
  // Wall identity and field-notes displays remain separate from the readable HTML poster.
  box([4.35, 2.65, 0.13], [0, 3.05, -3.35], palette.silver, "poster", true);
  display(4.18, 2.48, [0, 3.05, -3.27], "identity", "poster");
  box(
    [1.6, 1.85, 0.1],
    [-3.55, 2.95, -3.35],
    palette.silver,
    "experience",
    true,
  );
  display(1.48, 1.72, [-3.55, 2.95, -3.29], "notes", "experience");
  // A physical model of a neural graph on a research pedestal.
  cylinder(0.62, 0.14, [3.55, 0.16, 0.55], palette.silver, "blog");
  cylinder(0.47, 1, [3.55, 0.7, 0.55], palette.white, "blog");
  cylinder(0.67, 0.1, [3.55, 1.25, 0.55], palette.ink, "blog");
  const nodes: THREE.Vector3[] = [];
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4;
    const p = new THREE.Vector3(
      3.55 + Math.cos(a) * 0.46,
      1.6 + (i % 3) * 0.3,
      0.55 + Math.sin(a) * 0.46,
    );
    nodes.push(p);
    mesh(
      new THREE.SphereGeometry(0.065, 12, 8),
      material(i % 2 ? palette.blue : palette.teal),
      [p.x, p.y, p.z],
      "blog",
    );
  }
  nodes.forEach((p, i) => {
    const next = nodes[(i + 2) % nodes.length];
    if (next) connect(p, next, 0.009, palette.silver, "blog");
  });
  const ring = mesh(
    new THREE.TorusGeometry(0.66, 0.012, 6, 64),
    material(palette.blue, true),
    [3.55, 1.92, 0.55],
    "blog",
  );
  ring.rotation.x = 0.5;
  ring.rotation.y = 0.3;
  // Research notebooks and a small processor fixture give the foreground a human scale.
  for (let i = 0; i < 3; i++)
    box(
      [0.7, 0.065, 0.85],
      [-2.45, 1.69 + i * 0.07, 0.8],
      i % 2 ? palette.lilac : palette.ice,
      "blog",
    );
  box([0.65, 0.08, 0.65], [1.5, 1.7, 0.1], palette.ink, "work");
  box([0.35, 0.035, 0.35], [1.5, 1.76, 0.1], palette.silver, "work", true);
  for (let i = 0; i < 6; i++) {
    box([0.04, 0.02, 0.1], [1.25 + i * 0.1, 1.76, 0.43], palette.blue, "work");
  }
  // A second display, articulated mounts, cable tray and workstation peripherals.
  box([1.05, 1.45, 0.08], [1.22, 2.51, -0.18], palette.ink, "work", true);
  display(0.94, 1.33, [1.22, 2.51, -0.13], "notes", "work");
  connect(
    new THREE.Vector3(1.22, 2, -0.25),
    new THREE.Vector3(1.6, 1.68, -0.4),
    0.045,
    palette.silver,
    "work",
  );
  box([4.3, 0.2, 0.32], [-0.3, 1.25, -0.3], palette.ink, "work");
  for (let i = 0; i < 5; i++) {
    const cable = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.8 + i * 0.06, 2, -0.2),
      new THREE.Vector3(-0.6 + i * 0.06, 1.3, -0.45),
      new THREE.Vector3(1.6, 1.22, -0.4),
    ]);
    mesh(
      new THREE.TubeGeometry(cable, 16, 0.012, 5, false),
      material("#323c3d"),
      [0, 0, 0],
      "work",
    );
  }
  // Task chair with five-star base, casters, adjustable arms and a ribbed back.
  cylinder(0.045, 0.8, [-0.7, 0.55, 2.15], palette.silver, "work");
  box([0.95, 0.13, 0.8], [-0.7, 1, 2.15], "#354247", "work");
  box([0.9, 0.95, 0.12], [-0.7, 1.55, 2.52], "#354247", "work");
  for (let i = 0; i < 10; i++)
    box([0.78, 0.018, 0.025], [-0.7, 1.18 + i * 0.08, 2.59], "#607077", "work");
  for (const x of [-1.27, -0.13]) {
    box([0.07, 0.42, 0.06], [x, 1.16, 2.15], palette.silver, "work", true);
    box([0.12, 0.065, 0.55], [x, 1.38, 2.15], palette.ink, "work");
  }
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    const x = -0.7 + Math.cos(a) * 0.58,
      z = 2.15 + Math.sin(a) * 0.58;
    connect(
      new THREE.Vector3(-0.7, 0.2, 2.15),
      new THREE.Vector3(x, 0.13, z),
      0.035,
      palette.silver,
      "work",
    );
    const wheel = cylinder(0.075, 0.07, [x, 0.1, z], palette.ink, "work");
    wheel.rotation.z = Math.PI / 2;
  }
  // Two additional compute cabinets with rack rails, fan grilles and patch panels.
  for (const x of [5.05, 6.45]) {
    box([1.25, 3.45, 1.12], [x, 1.78, -2.7], "#182329", "blog", true);
    for (const dx of [-0.56, 0.56])
      box(
        [0.035, 3.3, 0.05],
        [x + dx, 1.78, -2.1],
        palette.silver,
        "blog",
        true,
      );
    for (let row = 0; row < 8; row++) {
      const y = 0.38 + row * 0.39;
      box([1.08, 0.32, 0.08], [x, y, -2.08], "#39474e", "blog", true);
      for (let col = 0; col < 3; col++) {
        const fan = mesh(
          new THREE.TorusGeometry(0.105, 0.012, 5, 16),
          material("#8a969a", true),
          [x - 0.31 + col * 0.29, y, -2.025],
          "blog",
        );
        fan.castShadow = false;
        for (let slit = 0; slit < 5; slit++)
          box(
            [0.15, 0.008, 0.012],
            [x - 0.31 + col * 0.29, y - 0.06 + slit * 0.03, -2.01],
            "#182329",
            "blog",
          );
      }
      box(
        [0.025, 0.045, 0.02],
        [x + 0.48, y, -2.02],
        row % 3 ? "#b3d579" : "#7c9dff",
        "blog",
      );
    }
    box([1.08, 0.1, 0.04], [x, 3.32, -2.1], "#71888f", "blog");
  }
  // Equipment labels are conceptual; they never claim live metrics or credentials.
  display(2.5, 0.5, [5.1, 4.35, -3.25], "network", "blog");
  // Wall storage, drawers and recessed handles.
  for (let i = 0; i < 3; i++) {
    box(
      [1.05, 1.3, 0.65],
      [-3.9 + i * 1.12, 0.72, -2.9],
      "#bfc8bf",
      "experience",
    );
    for (let j = 0; j < 3; j++) {
      box(
        [0.99, 0.38, 0.025],
        [-3.9 + i * 1.12, 0.3 + j * 0.4, -2.56],
        "#e1e5db",
        "experience",
      );
      box(
        [0.28, 0.025, 0.04],
        [-3.9 + i * 1.12, 0.4 + j * 0.4, -2.52],
        palette.ink,
        "experience",
      );
    }
  }
  // Batch static parts by material AND destination, preserving picking while reducing draw calls.
  const batches = new Map<string, THREE.Mesh[]>();
  meshes.forEach((object) => {
    const surface = object.material;
    const key = `${Array.isArray(surface) ? "multi" : surface.uuid}/${object.userData.destination ?? "decor"}`;
    const list = batches.get(key) ?? [];
    list.push(object);
    batches.set(key, list);
  });
  const optimized: THREE.Mesh[] = [];
  batches.forEach((objects) => {
    const first = objects[0];
    if (!first) return;
    if (objects.length === 1) {
      optimized.push(first);
      return;
    }
    const parts = objects.map((object) => {
      object.updateMatrix();
      const geometry = object.geometry.index
        ? object.geometry.toNonIndexed()
        : object.geometry.clone();
      return geometry.applyMatrix4(object.matrix);
    });
    const geometry = mergeGeometries(parts);
    parts.forEach((part) => part.dispose());
    if (!geometry) {
      optimized.push(...objects);
      return;
    }
    const merged = new THREE.Mesh(geometry, first.material);
    merged.userData = { ...first.userData };
    merged.castShadow = true;
    merged.receiveShadow = true;
    scene.add(merged);
    optimized.push(merged);
    objects.forEach((object) => {
      scene.remove(object);
      object.geometry.dispose();
    });
  });
  return {
    meshes: optimized,
    dispose() {
      new Set(optimized.map((m) => m.geometry)).forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
