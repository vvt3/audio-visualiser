export async function createAudioAnalyser(file) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

    const source = audioCtx.createBufferSource()
    source.buffer = audioBuffer

    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256

    const gainNode = audioCtx.createGain()
    gainNode.gain.value = 1

    source.connect(analyser)
    analyser.connect(gainNode)
    gainNode.connect(audioCtx.destination)


    await audioCtx.resume()
    source.start(0)

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    return {
        analyser,
        dataArray,
        gainNode,
        source,
        audioCtx,
        getFrequencyData: () => {
            analyser.getByteFrequencyData(dataArray)
            return dataArray
        }
    }
}   