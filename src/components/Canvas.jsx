import { useEffect, useRef } from "react"
import { createAudioAnalyser } from "../engine/audio.js"

export default function Canvas({audioFile}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!audioFile) return
    console.log("Canvas received file:", audioFile)

    let animationId
    let analyserObj

    async function init() {
      analyserObj = await createAudioAnalyser(audioFile)
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
      if (!analyserObj) return

      const data = analyserObj.getFrequencyData()

      // clear bg
      ctx.fillStyle = "black"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // bars simple
      const barWidth = canvas.width / data.length

      data.forEach((value, i) => {
        const height = value
        ctx.fillStyle = "white"
        ctx.fillRect(i * barWidth, canvas.height - height, barWidth, height)
      })

      animationId = requestAnimationFrame(loop)
    }

    init()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", resize)
    }
  }, [audioFile])

  return <canvas ref={canvasRef} className="w-full h-full block" />
}