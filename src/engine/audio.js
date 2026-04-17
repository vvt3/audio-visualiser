export async function createAudioEngine(file) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;

  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 1;

  let currentSource = null;
  let startTime = 0;
  let pauseTime = 0;
  let isPlaying = false;
  let isStopping = false; // for pausing

  const createSource = () => {
    const newSource = audioCtx.createBufferSource();
    newSource.buffer = audioBuffer;

    newSource.connect(analyser);
    analyser.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    return newSource;
  };

  const play = () => {
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    currentSource = createSource();

    const offset = pauseTime || 0; // if pause is NaN, etc

    // resume from pauseTime
    startTime = audioCtx.currentTime - offset;

    currentSource.start(0, offset);

    isPlaying = true;

    currentSource.onended = () => {
      isPlaying = false;
      if (!isStopping) {
        // only reset if track naturally ended
        pauseTime = 0;
      }
      isStopping = false;
    };
  };

  const pause = () => {
    if (!currentSource) return;

    isStopping = true;

    try {
      currentSource.stop();
    } catch {}

    // calculate how far we got
    const elapsed = audioCtx.currentTime - startTime;
    //pauseTime = Math.max(0, audioCtx.currentTime - startTime);
    pauseTime = Math.max(0, Math.min(elapsed, audioBuffer.duration));

    isPlaying = false;
    currentSource = null;
  };

  const getFrequencyData = () => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    return data;
  };

  const setVolume = (v) => {
    gainNode.gain.value = v;
  };

  const destroy = () => {
    if (currentSource) {
      try {
        currentSource.stop();
      } catch {}
    }

    // Reset Settings
    currentSource = null;
    pauseTime = 0;
    startTime = 0;
    isPlaying = false;

    try {
      audioCtx.close();
    } catch {}
  };

  const restart = () => {
    if (currentSource) {
      try {
        currentSource.stop();
      } catch {}
    }

    pauseTime = 0;
    startTime = 0;
    isPlaying = false;
    currentSource = null;

    //play(); // start fresh from 0
  };

  return {
    audioCtx,
    audioBuffer,
    analyser,
    gainNode,
    play,
    pause,
    getFrequencyData,
    setVolume,
    destroy,
    restart,
  };
}
