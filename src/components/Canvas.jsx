import { useEffect, useRef } from "react"
import { createAudioAnalyser } from "../engine/audio.js"

export default function Canvas({ audioFile, volume }) {
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const audioRef = useRef(null)

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
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
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

      // clear bg
      ctx.fillStyle = "black"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // bars
      ctx.fillStyle = "white"
      const gap = 1
      const barWidth = (canvas.width - data.length * gap) / data.length

      data.forEach((value, i) => {
        const x = i * (barWidth + gap)
        const height = value

        ctx.fillRect(x, canvas.height - height, barWidth, height)
      })

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