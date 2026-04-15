import { useEffect, useRef } from "react"
import { createAudioAnalyser } from "../engine/audio.js"

export default function Canvas({ audioFile, volume }) {
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const audioRef = useRef(null)
  const smoothDataRef = useRef(null)


  const BAR_SCALE = 0.85

  useEffect(() => {
    if (!audioFile) return

    let animationId
    let analyserObj

    async function init() {

      if (audioRef.current) {
        try { audioRef.current.source.stop() } catch {}
        try { audioRef.current.audioCtx.close() } catch {}
      }

      analyserObj = await createAudioAnalyser(audioFile)
      analyserRef.current = analyserObj
      audioRef.current = analyserObj

      await analyserObj.audioCtx.resume()

      loop()
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    function resize() {
      const dpr = window.devicePixelRatio || 1

      const width = window.innerWidth
      const height = window.innerHeight

      canvas.width = width * dpr
      canvas.height = height * dpr

      canvas.style.width = width + "px"
      canvas.style.height = height + "px"

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener("resize", resize)

    function loop() {
      const analyser = analyserRef.current
      if (!analyser) {
        animationId = requestAnimationFrame(loop)
        return
      }
      const data = analyser.getFrequencyData()
      if (!smoothDataRef.current) {
        smoothDataRef.current = new Float32Array(data.length)
      }

      //------------ Drawing BLOCK

      const width = canvas.clientWidth
      const heightCanvas = canvas.clientHeight

      // clear bg
      ctx.fillStyle = "black"
      ctx.fillRect(0, 0, width, heightCanvas)

      // bars
      ctx.fillStyle = "white"

      const gap = 1
      const barWidth = (width - data.length * gap) / data.length


       if (!smoothDataRef.current) {
        smoothDataRef.current = new Float32Array(data.length)
      }

      const smoothData = smoothDataRef.current
      
      data.forEach((value, i) => {
        const x = i * (barWidth + gap)
        //const height = value * BAR_SCALE
        //const height = (value / 255) * heightCanvas * BAR_SCALE
        // smoothing (lerp)
        smoothData[i] = smoothData[i] * 0.8 + value * 0.2
        const avg = (data[i] + data[i-1] + data[i+1]) / 3
        //const normalized = value / 255
        const normalized = smoothData[i] / 255
        const height = Math.pow(normalized, 0.5) * heightCanvas * BAR_SCALE
        const y = heightCanvas - height

        ctx.fillRect(x, y, barWidth, height)
      })

      //------------ END Draw BLOCK

      animationId = requestAnimationFrame(loop)
    }

    init()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", resize)
    }
  }, [audioFile])

  // Volume adjust
  useEffect(() => {
    if (analyserRef.current?.gainNode) {
      analyserRef.current.gainNode.gain.value = volume
    }
  }, [volume])

  return <canvas ref={canvasRef} className="w-full h-full block" />
}