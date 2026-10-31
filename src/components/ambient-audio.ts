// Original ambient score, with React Bits Dew for button feedback.
// Dew is rendered ahead of time from the official Sound Lab recipe and engine.
// Source and license: /licenses/react-bits.txt.
const soundControl = document.querySelector<HTMLElement>('[data-sound-control]');
const soundButton = document.querySelector<HTMLButtonElement>('[data-sound-toggle]');
const soundState = document.querySelector<HTMLElement>('[data-sound-state]');
const soundStatus = document.querySelector<HTMLElement>('[data-sound-status]');

if (soundControl && soundButton && soundState && soundStatus && typeof AudioContext !== 'undefined') {
  soundControl.hidden = false;
  let context: AudioContext | undefined;
  let master: GainNode | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  let playing = false;
  let busy = false;
  const oscillators = new Set<OscillatorNode>();
  const taps = new Set<AudioBufferSourceNode>();
  let dewBuffer: AudioBuffer | undefined;
  let dewLoading: Promise<AudioBuffer> | undefined;
  let lastTap = -Infinity;
  const chords = [
    [130.81, 196, 246.94, 293.66],
    [110, 164.81, 246.94, 261.63],
    [87.31, 174.61, 220, 261.63],
    [98, 196, 220, 293.66],
  ];

  function updateState() {
    soundButton?.setAttribute('aria-pressed', String(playing));
    soundButton?.setAttribute('aria-label', playing ? 'Mute sound' : 'Enable sound');
    soundButton?.setAttribute('title', `${playing ? 'Mute' : 'Enable'} sound · Dew & ambient`);
    if (soundState) soundState.textContent = playing ? 'ON' : 'OFF';
  }

  async function playDew(audio: AudioContext) {
    if (performance.now() - lastTap < 70) return;
    lastTap = performance.now();
    const requestedAt = lastTap;
    if (!dewBuffer) {
      dewLoading ??= fetch('/audio/dew.wav').then(response => {
        if (!response.ok) throw new Error('Dew audio unavailable');
        return response.arrayBuffer();
      }).then(bytes => audio.decodeAudioData(bytes)).finally(() => { dewLoading = undefined; });
      dewBuffer = await dewLoading;
    }
    // A pending download must not play after mute, a hidden tab or a newer click.
    if (!playing || context !== audio || audio.state !== 'running' || document.hidden || requestedAt !== lastTap) return;
    if (taps.size >= 4) taps.values().next().value?.stop();
    const source = audio.createBufferSource();
    const level = audio.createGain();
    source.buffer = dewBuffer;
    level.gain.value = .6;
    source.connect(level);
    level.connect(audio.destination);
    taps.add(source);
    source.onended = () => { source.disconnect(); level.disconnect(); taps.delete(source); };
    source.start();
  }

  function scheduleNote(audio: AudioContext, destination: AudioNode, frequency: number, start: number, duration: number, volume: number, attack: number) {
    const oscillator = audio.createOscillator();
    const envelope = audio.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(volume, start + attack);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(destination);
    oscillators.add(oscillator);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); oscillators.delete(oscillator); };
    oscillator.start(start);
    oscillator.stop(start + duration + .05);
  }

  async function start() {
    const audio = new AudioContext();
    context = audio;
    await audio.resume();
    const gain = audio.createGain();
    master = gain;
    gain.gain.setValueAtTime(0, audio.currentTime);
    gain.gain.linearRampToValueAtTime(.6, audio.currentTime + 2);
    gain.connect(audio.destination);
    const delay = audio.createDelay(1);
    delay.delayTime.value = .6;
    const feedback = audio.createGain();
    feedback.gain.value = .24;
    const wet = audio.createGain();
    wet.gain.value = .22;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(gain);
    const bus = audio.createGain();
    bus.connect(gain);
    bus.connect(delay);
    let nextChord = audio.currentTime + .05;
    let nextBell = audio.currentTime + 2;
    let chordIndex = 0;
    let bellIndex = 0;
    const melody = [523.25, 587.33, 783.99, 659.25, 587.33, 493.88, 440, 587.33];
    const schedule = () => {
      if (audio.state !== 'running') return;
      if (nextChord < audio.currentTime + .5) {
        chords[chordIndex % chords.length].forEach((frequency, index) => scheduleNote(audio, bus, frequency, nextChord + index * .12, 12, .035, 2.8));
        nextChord += 8;
        chordIndex += 1;
      }
      if (nextBell < audio.currentTime + .5) {
        scheduleNote(audio, bus, melody[bellIndex % melody.length], nextBell, 4.5, .012, .035);
        nextBell += 2.7;
        bellIndex += 1;
      }
    };
    schedule();
    timer = setInterval(schedule, 250);
    playing = true;
    updateState();
    void playDew(audio).catch(() => {});
  }

  async function stop(immediate = false) {
    if (timer) clearInterval(timer);
    const audio = context;
    const gain = master;
    playing = false;
    updateState();
    taps.forEach(source => source.stop());
    taps.clear();
    if (!audio) return;
    if (!immediate && gain && audio.state === 'running') {
      gain.gain.cancelScheduledValues(audio.currentTime);
      gain.gain.setTargetAtTime(0, audio.currentTime, .12);
      await new Promise(resolve => setTimeout(resolve, 450));
    }
    oscillators.forEach(oscillator => { try { oscillator.stop(); } catch { /* A scheduled note may have just ended. */ } });
    oscillators.clear();
    if (audio.state !== 'closed') await audio.close();
    context = undefined;
    master = undefined;
  }

  soundButton.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    try {
      if (playing) await stop();
      else await start();
      soundStatus.textContent = '';
    } catch {
      await stop(true);
      soundStatus.textContent = 'Sound could not start. Please try again.';
    } finally { busy = false; }
  });
  document.addEventListener('click', event => {
    if (!playing || !context || busy || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    if (!(event.target instanceof Element)) return;
    const control = event.target.closest('a[href], button:not(:disabled)');
    if (!control || control === soundButton || control.getAttribute('aria-disabled') === 'true') return;
    void playDew(context).catch(() => {});
  }, { capture: true });
  document.addEventListener('visibilitychange', () => {
    if (!context || !playing) return;
    if (document.hidden) void context.suspend().catch(() => {});
    else void context.resume().catch(() => { void stop(true); });
  });
  window.addEventListener('pagehide', () => { void stop(true); });
}
