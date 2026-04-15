export async function createAudioAnalyser(file) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

  const arrayBuffer = await file.arrayBuffer()
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

  const source = audioCtx.createBufferSource()
  source.buffer = audioBuffer

  const analyser = audioCtx.createAnalyser()
  analyser.fftSize = 256

  source.connect(analyser)
  analyser.connect(audioCtx.destination)

  source.start()

  const dataArray = new Uint8Array(analyser.frequencyBinCount)

  return {
    analyser,
    dataArray,
    getFrequencyData: () => {
      analyser.getByteFrequencyData(dataArray)
      return dataArray
    }
  }
}