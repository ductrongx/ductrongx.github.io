import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export interface PrismScene {
    resize: () => void;
    render: (elapsed: number, progress: number, pointerX: number, pointerY: number, animate: boolean) => boolean;
    dispose: () => void;
}
export function createPrismScene(host: HTMLElement): PrismScene | undefined {
    const canvas = host.querySelector<HTMLCanvasElement>('[data-prism-canvas]');
    if (!canvas)
        return undefined;
    let renderer: THREE.WebGLRenderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
    }
    catch {
        return undefined;
    }
    renderer.setClearColor(0x030509);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.transmissionResolutionScale = .65;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, .1, 50);
    camera.position.set(0, 0, 9);
    const environment = new THREE.Scene();
    environment.background = new THREE.Color(0x14222e);
    const envGeometry = new THREE.PlaneGeometry(1, 1);
    const blueLight = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x147bff).multiplyScalar(7), side: THREE.DoubleSide });
    const goldLight = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffe5a0).multiplyScalar(5), side: THREE.DoubleSide });
    const whiteLight = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff).multiplyScalar(9), side: THREE.DoubleSide });
    for (const [x, y, z, sx, sy, material] of [
        [-4, 1, 2, 3, 7, blueLight], [4, 3, 0, 2, 7, goldLight], [0, 5, 0, 8, 1, whiteLight], [-1, -3, 4, 5, .25, whiteLight],
        [-2, 0, 5, .25, 7, whiteLight], [2, 0, 5, .15, 5, whiteLight],
    ] satisfies [
        number,
        number,
        number,
        number,
        number,
        THREE.Material
    ][]) {
        const panel = new THREE.Mesh(envGeometry, material);
        panel.position.set(x, y, z);
        panel.scale.set(sx, sy, 1);
        panel.lookAt(0, 0, 0);
        environment.add(panel);
    }
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environmentTarget = pmrem.fromScene(environment, .025);
    scene.environment = environmentTarget.texture;
    envGeometry.dispose();
    blueLight.dispose();
    goldLight.dispose();
    whiteLight.dispose();
    pmrem.dispose();
    const glass = new THREE.MeshPhysicalMaterial({
        color: 0xffffff, metalness: 0, roughness: .025, transmission: 1,
        thickness: 1.8, ior: 1.5, dispersion: .08, clearcoat: 1,
        clearcoatRoughness: .025, envMapIntensity: 1.8,
    });
    const silver = new THREE.MeshStandardMaterial({ color: 0xc5e8f4, metalness: .95, roughness: .08, envMapIntensity: 2 });
    const beamGeometry = new RoundedBoxGeometry(1, 1, 1, 3, .08);
    const sculpture = new THREE.Group();
    const inner = new THREE.Group();
    function frame(parent: THREE.Group, size: number, width: number, material: THREE.Material) {
        const half = size / 2;
        for (let axis = 0; axis < 3; axis++)
            for (const a of [-1, 1])
                for (const b of [-1, 1]) {
                    const beam = new THREE.Mesh(beamGeometry, material);
                    const position = [0, 0, 0];
                    position[(axis + 1) % 3] = a * half;
                    position[(axis + 2) % 3] = b * half;
                    beam.position.set(position[0] ?? 0, position[1] ?? 0, position[2] ?? 0);
                    beam.scale.set(width, width, width);
                    beam.scale.setComponent(axis, size + width);
                    parent.add(beam);
                }
    }
    frame(sculpture, 2.7, .25, glass);
    frame(sculpture, 2.76, .012, silver);
    frame(inner, 1.8, .085, silver);
    sculpture.add(inner);
    const lensGeometry = new RoundedBoxGeometry(2.55, 2.55, 2.55, 4, .045);
    const lens = new THREE.Mesh(lensGeometry, glass);
    sculpture.add(lens);
    const coreGeometry = new THREE.OctahedronGeometry(.12);
    const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xe8faff });
    sculpture.add(new THREE.Mesh(coreGeometry, coreMaterial));
    scene.add(sculpture);
    scene.add(new THREE.HemisphereLight(0xc0e8ff, 0x071426, 1.5));
    const key = new THREE.DirectionalLight(0xf0faff, 5);
    key.position.set(-3, 5, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x67caff, 3);
    rim.position.set(4, 1, -3);
    scene.add(rim);
    const backdropGeometry = new THREE.PlaneGeometry(24, 18);
    const backdropMaterial = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader: `
      varying vec2 vUv; uniform float uTime;
      float ray(vec2 p,vec2 direction,float width){
        float along=dot(p,direction); float across=abs(p.x*direction.y-p.y*direction.x);
        float spread=width*(.16+max(along,0.)*.25);
        return exp(-pow(across/max(spread,.001),2.))*smoothstep(-.03,.05,along)*exp(-max(along,0.)*.4);
      }
      void main(){
        vec2 p=(vUv-.5)*vec2(2.,1.5)-vec2(.13,.06);
        vec3 color=vec3(.001,.002,.004);
        color+=vec3(.015,.32,.7)*ray(p,normalize(vec2(-1.,.12)),.13);
        color+=vec3(.15,.55,.85)*ray(p,normalize(vec2(.5,1.)),.14);
        color+=vec3(1.,.65,.05)*ray(p,normalize(vec2(.58,1.)),.075);
        color+=vec3(.015,.16,.55)*ray(p,normalize(vec2(.28,-1.)),.12);
        color+=vec3(.1,.23,.35)*exp(-length(p)*5.)*.25;
        color*=.96+.04*sin(uTime*.4);
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
        depthWrite: false,
    });
    const backdrop = new THREE.Mesh(backdropGeometry, backdropMaterial);
    backdrop.position.z = -4;
    scene.add(backdrop);
    let width = 1;
    let height = 1;
    let clock = 0;
    let accumulated = 40;
    let previousProgress = -1;
    let previousX = 0;
    let previousY = 0;
    let lost = false;
    const lifetime = new AbortController();
    canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; host.removeAttribute('data-ready'); }, { signal: lifetime.signal });
    function resize() {
        width = host.clientWidth;
        height = host.clientHeight;
        if (!width || !height)
            return;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 768 ? 1 : 1.5));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        previousProgress = -1;
    }
    function render(elapsed: number, progress: number, pointerX: number, pointerY: number, animate: boolean) {
        if (lost || !width || !height)
            return false;
        accumulated += elapsed;
        const changed = progress !== previousProgress || pointerX !== previousX || pointerY !== previousY;
        if (!changed && accumulated < 1000 / 30)
            return animate;
        if (!animate && !changed) {
            accumulated = 0;
            return false;
        }
        if (animate)
            clock += accumulated / 1000;
        accumulated = 0;
        previousProgress = progress;
        previousX = pointerX;
        previousY = pointerY;
        sculpture.position.set(width < 768 ? .3 : .95, .65 + Math.sin(clock * .38) * .045, 0);
        sculpture.rotation.set(.3 + Math.sin(clock * .13) * .08 + pointerY * .08 + progress * .8, -.65 + Math.sin(clock * .16) * .18 + pointerX * .12 + progress * 1.6, -.12 + progress * .35);
        inner.rotation.set(.15, -.2 + Math.sin(clock * .2) * .12, .12);
        sculpture.scale.setScalar(1 + progress * .45);
        camera.position.z = 9 - progress * 1.4;
        backdropMaterial.uniforms.uTime.value = clock;
        renderer.render(scene, camera);
        host.setAttribute('data-ready', '');
        return animate;
    }
    function dispose() {
        lifetime.abort();
        beamGeometry.dispose();
        lensGeometry.dispose();
        coreGeometry.dispose();
        backdropGeometry.dispose();
        glass.dispose();
        silver.dispose();
        coreMaterial.dispose();
        backdropMaterial.dispose();
        environmentTarget.dispose();
        renderer.dispose();
        host.removeAttribute('data-ready');
    }
    resize();
    return { resize, render, dispose };
}
