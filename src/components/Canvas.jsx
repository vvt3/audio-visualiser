import { useEffect, useRef } from "react"

export default function VisualizerCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    let animationId
    let t = 0

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resize()
    window.addEventListener("resize", resize)

    function loop() {
      t += 0.02

      // clear
      ctx.fillStyle = "black"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // placeholder for the actual track
      ctx.beginPath()
      ctx.strokeStyle = "white"

      for (let x = 0; x < canvas.width; x++) {
        const y =
          canvas.height / 2 +
          // Audio frequencies
          Math.sin(x * 0.01 + t) * 50

        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }

      ctx.stroke()

      // moving "cart"
      const cartX = (t * 100) % canvas.width
      const cartY =
        canvas.height / 2 +
        // Audio frequencies
        Math.sin(cartX * 0.01 + t) * 50

      ctx.beginPath()
      ctx.arc(cartX, cartY, 6, 0, Math.PI * 2)
      ctx.fillStyle = "red"
      ctx.fill()

      animationId = requestAnimationFrame(loop)
    }

    loop()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return <canvas ref={canvasRef} />
}