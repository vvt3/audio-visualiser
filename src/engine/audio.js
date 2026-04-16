export async function createAudioEngine(file) {

    let sourceIdCounter = 0 // Delete later

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256

    const gainNode = audioCtx.createGain()
    gainNode.gain.value = 1

    let currentSource = null
    let startTime = 0
    let pauseTime = 0
    let isPlaying = false

    const createSource = () => {
        const newSource = audioCtx.createBufferSource()
        newSource.buffer = audioBuffer
        
        newSource._id = ++sourceIdCounter // delete

        newSource.connect(analyser)
        analyser.connect(gainNode)
        gainNode.connect(audioCtx.destination)

        console.log("Created source:", newSource._id)

        return newSource
    }

    const play = () => {
        if (audioCtx.state === "suspended") {
            audioCtx.resume()
        }
        if (currentSource) {
            try {
            currentSource.stop()
            } catch {}
        }

        console.log("PLAY Clicked")

        currentSource = createSource()

        console.log("Playing source:", currentSource._id, "at offset:", pauseTime)

        const offset = pauseTime || 0 // if pause is NaN, etc
        // resume from pauseTime
        startTime = audioCtx.currentTime - offset
        try {
            currentSource.start(0, offset)
        } catch (e) {
            console.log("Playing song failed: ", e)
            currentSource.start(0)
            startTime = audioCtx.currentTime
        }

        isPlaying = true
        console.log("AudioContext state:", audioCtx.state)
        currentSource.onended = () => {
            console.log("Source ended:", currentSource?._id)
            isPlaying = false
            pauseTime = 0
        }
    }

    const pause = () => {

        console.log("PAUSE clicked")

        if (!currentSource) return

        try {
            currentSource.stop()
        } catch {}

        console.log("Stopping source:", currentSource._id)

        // calculate how far we got
        //pauseTime = audioCtx.currentTime - startTime
        pauseTime = Math.max(0, audioCtx.currentTime - startTime)
        isPlaying = false
        currentSource = null
    }

    const getFrequencyData = () => {
        const data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)
        return data
    }

    const setVolume = (v) => {
        gainNode.gain.value = v
    }

    // Remove old engine
    const destroy = () => {
        if (currentSource) {
            try {
            currentSource.stop()
            } catch {}
        }

        // Reset Settings
        pauseTime = 0
        startTime = 0
        isPlaying = false
        currentSource = null

        try {
            audioCtx.close()
        } catch {}
    }

    // Restart button
    const restart = () => {
        if (currentSource) {
            try {
                currentSource.stop()
            } catch {}
        }

        pauseTime = 0
        isPlaying = false
        currentSource = null

        play() // start fresh from 0
    }

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
        restart
    }
}