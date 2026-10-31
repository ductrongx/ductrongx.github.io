import { vertexShader, simulationShader, glassShader, copyShader } from './fluid-cursor-shaders';

interface Point { x: number; y: number }
interface Target { texture: WebGLTexture; framebuffer: WebGLFramebuffer }
export interface FluidCursorRenderer {
  resize(): void;
  clear(): void;
  draw(dt: number, from: Point, to: Point, inject: boolean, fade: number): void;
  reduceQuality(): void;
  dispose(): void;
}

export function createFluidCursor(canvas: HTMLCanvasElement): FluidCursorRenderer | undefined {
  const gl = canvas.getContext('webgl', {
    alpha: true, premultipliedAlpha: true, antialias: false,
    depth: false, stencil: false, preserveDrawingBuffer: false,
  });
  if (!gl) return;
  const programs: WebGLProgram[] = [];
  const targets: Target[] = [];
  let buffer: WebGLBuffer | null = null;
  let width = 1, height = 1, simWidth = 1, simHeight = 1, quality = 1;
  let clock = 0;
  const trail: (Point & { time: number })[] = [];
  let read: Target;
  let write: Target;

  function dispose() {
    targets.forEach(target => { gl?.deleteTexture(target.texture); gl?.deleteFramebuffer(target.framebuffer); });
    targets.length = 0;
    programs.forEach(program => gl?.deleteProgram(program));
    if (buffer) gl?.deleteBuffer(buffer);
  }
  function compile(type: number, source: string) {
    if (!gl) throw new Error('No WebGL context');
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Unable to allocate shader');
    const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    gl.shaderSource(shader, precision?.precision ? source : source.replace('precision highp float;', 'precision mediump float;'));
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      throw new Error('Unable to compile liquid cursor shader');
    }
    return shader;
  }
  function makeProgram(fragment: string, names: string[]) {
    if (!gl) throw new Error('No WebGL context');
    const vertex = compile(gl.VERTEX_SHADER, vertexShader);
    let pixel: WebGLShader | undefined;
    try {
      pixel = compile(gl.FRAGMENT_SHADER, fragment);
      const program = gl.createProgram();
      if (!program) throw new Error('Unable to allocate program');
      programs.push(program);
      gl.attachShader(program, vertex);
      gl.attachShader(program, pixel);
      gl.bindAttribLocation(program, 0, 'aPosition');
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Unable to link liquid cursor shader');
      const uniforms = new Map(names.map(name => [name, gl.getUniformLocation(program, name)]));
      return { program, uniform: (name: string) => uniforms.get(name) ?? null };
    } finally {
      gl.deleteShader(vertex);
      if (pixel) gl.deleteShader(pixel);
    }
  }
  function allocateTarget(): Target {
    if (!gl) throw new Error('No WebGL context');
    const texture = gl.createTexture();
    const framebuffer = gl.createFramebuffer();
    if (!texture || !framebuffer) {
      gl.deleteTexture(texture); gl.deleteFramebuffer(framebuffer);
      throw new Error('Unable to allocate flowmap');
    }
    const target = { texture, framebuffer };
    targets.push(target);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, simWidth, simHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('Incomplete flowmap');
    return target;
  }
  function clear() {
    if (!gl || gl.isContextLost()) return;
    trail.length = 0;
    clock = 0;
    gl.disable(gl.SCISSOR_TEST);
    gl.clearColor(128 / 255, 128 / 255, 0, 0);
    targets.forEach(target => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.clear(gl.COLOR_BUFFER_BIT);
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  function resizeDisplay() {
    const scale = Math.min(window.devicePixelRatio || 1, 1.25, Math.sqrt(1_800_000 / (width * height))) * quality;
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
  }

  try {
    const simulation = makeProgram(simulationShader, ['uField', 'uTexel', 'uViewport', 'uFrom', 'uTo', 'uImpulse', 'uRadius', 'uDt']);
    const glass = makeProgram(glassShader, ['uField', 'uViewport', 'uFade']);
    const copy = makeProgram(copyShader, ['uField']);
    buffer = gl.createBuffer();
    if (!buffer) throw new Error('Unable to allocate fullscreen triangle');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.DITHER);
    gl.activeTexture(gl.TEXTURE0);

    function resizeFields(preserve: boolean) {
      if (!gl) return;
      const scale = Math.min(1, 640 * quality / Math.max(width, height));
      simWidth = Math.max(2, Math.round(width * scale));
      simHeight = Math.max(2, Math.round(height * scale));
      const source = preserve && targets.length ? read.texture : null;
      const oldTargets = targets.splice(0);
      try {
        read = allocateTarget();
        write = allocateTarget();
        if (source) {
          gl.useProgram(copy.program);
          gl.bindTexture(gl.TEXTURE_2D, source);
          gl.uniform1i(copy.uniform('uField'), 0);
          gl.viewport(0, 0, simWidth, simHeight);
          targets.forEach(target => {
            gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
          });
        }
      } finally {
        oldTargets.forEach(target => { gl.deleteTexture(target.texture); gl.deleteFramebuffer(target.framebuffer); });
      }
    }
    function resize() {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      resizeFields(false);
      resizeDisplay();
      clear();
    }
    resize();
    return {
      resize, clear, dispose,
      reduceQuality() {
        if (quality <= .55) return;
        quality = Math.max(.55, quality * .8);
        resizeFields(true);
        resizeDisplay();
      },
      draw(dt, from, to, inject, fade) {
        clock += dt;
        if (inject) trail.push({ ...from, time: clock }, { ...to, time: clock });
        while (trail[0] && clock - trail[0].time > 2.4) trail.shift();
        let left = width, right = 0, top = height, bottom = 0;
        trail.forEach(point => {
          left = Math.min(left, point.x); right = Math.max(right, point.x);
          top = Math.min(top, point.y); bottom = Math.max(bottom, point.y);
        });
        // Keep the canvas fullscreen, but only shade the region containing live ripples.
        left = Math.max(0, left - 96); right = Math.min(width, right + 96);
        top = Math.max(0, top - 96); bottom = Math.min(height, bottom + 96);
        const scissor = (targetWidth: number, targetHeight: number) => {
          const x = Math.floor(left / width * targetWidth);
          const y = Math.floor((height - bottom) / height * targetHeight);
          gl.scissor(x, y, Math.max(1, Math.ceil(right / width * targetWidth) - x), Math.max(1, Math.ceil((height - top) / height * targetHeight) - y));
          gl.enable(gl.SCISSOR_TEST);
        };
        gl.useProgram(simulation.program);
        gl.bindFramebuffer(gl.FRAMEBUFFER, write.framebuffer);
        gl.viewport(0, 0, simWidth, simHeight);
        gl.disable(gl.SCISSOR_TEST);
        gl.clearColor(128 / 255, 128 / 255, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        scissor(simWidth, simHeight);
        gl.bindTexture(gl.TEXTURE_2D, read.texture);
        gl.uniform1i(simulation.uniform('uField'), 0);
        gl.uniform2f(simulation.uniform('uTexel'), 1 / simWidth, 1 / simHeight);
        gl.uniform2f(simulation.uniform('uViewport'), width, height);
        gl.uniform2f(simulation.uniform('uFrom'), from.x, height - from.y);
        gl.uniform2f(simulation.uniform('uTo'), to.x, height - to.y);
        const distance = Math.hypot(to.x - from.x, to.y - from.y);
        gl.uniform1f(simulation.uniform('uImpulse'), inject ? .55 + Math.min(distance / 90, .45) : 0);
        gl.uniform1f(simulation.uniform('uRadius'), 22 + Math.min(distance * .1, 10));
        gl.uniform1f(simulation.uniform('uDt'), dt);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.disable(gl.SCISSOR_TEST);
        [read, write] = [write, read];

        gl.useProgram(glass.program);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        scissor(canvas.width, canvas.height);
        gl.bindTexture(gl.TEXTURE_2D, read.texture);
        gl.uniform1i(glass.uniform('uField'), 0);
        gl.uniform2f(glass.uniform('uViewport'), width, height);
        gl.uniform1f(glass.uniform('uFade'), fade);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.disable(gl.SCISSOR_TEST);
      },
    };
  } catch {
    dispose();
    return;
  }
}
