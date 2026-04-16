import { useEffect, useRef } from "react"

export default function Canvas({ audioEngine, volume }) {

  const canvasRef = useRef(null)
  const smoothDataRef = useRef(null)
  const analyser = audioEngine?.analyser
  const BAR_SCALE = 0.85

  useEffect(() => {
    let animationId

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
      const analyser = audioEngine?.analyser

      if (!audioEngine || !analyser) {
        animationId = requestAnimationFrame(loop)
        return
      }

      const data = audioEngine?.getFrequencyData?.()

      if (!data) {
        animationId = requestAnimationFrame(loop)
        return
      }

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
      const smoothData = smoothDataRef.current
      
      data.forEach((value, i) => {
        smoothData[i] = smoothData[i] * 0.8 + value * 0.2

        const normalized = smoothData[i] / 255
        const height = Math.pow(normalized, 0.5) * heightCanvas * BAR_SCALE
        const x = i * (barWidth + gap)
        const y = heightCanvas - height

        ctx.fillRect(x, y, barWidth, height)
      })

      //------------ END Draw BLOCK

      animationId = requestAnimationFrame(loop)
    }

    loop()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", resize)
    }
  }, [audioEngine])

  // Volume handling (TEMP)
  useEffect(() => {
    if (audioEngine?.gainNode) {
      audioEngine.gainNode.gain.value = volume
    }
  }, [volume, audioEngine])

  return <canvas ref={canvasRef} className="w-full h-full block" />
}