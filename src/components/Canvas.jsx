import { useEffect, useRef } from "react";

export default function Canvas({ audioEngine, volume }) {
  const canvasRef = useRef(null);
  const smoothDataRef = useRef(null);
  const analyser = audioEngine?.analyser;
  const BAR_SCALE = 0.85;
  const historyRef = useRef([]);
  const MAX_POINTS = 200;

  useEffect(() => {
    let animationId;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function resize() {
      const dpr = window.devicePixelRatio || 1;

      const rect = canvas.getBoundingClientRect();

      const width = rect.width;
      const height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      canvas.style.width = width + "px";
      canvas.style.height = height + "px";

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    function loop() {
      const analyser = audioEngine?.analyser;

      if (!audioEngine || !analyser) {
        animationId = requestAnimationFrame(loop);
        return;
      }

      const data = audioEngine?.getFrequencyData?.();

      if (!data) {
        animationId = requestAnimationFrame(loop);
        return;
      }

      if (!smoothDataRef.current) {
        smoothDataRef.current = new Float32Array(data.length);
      }

      //------------ Rollercoaster DRAW

      const width = canvas.width / (window.devicePixelRatio || 1);
      const heightCanvas = canvas.height / (window.devicePixelRatio || 1);

      // clear
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, heightCanvas);

      // get data
      const avg = data.reduce((sum, v) => sum + v, 0) / data.length;

      // normalize + shape
      const normalized = avg / 255;
      const heightValue = Math.pow(normalized, 0.3);

      if (historyRef.current.length === 0) {
        historyRef.current = new Array(MAX_POINTS).fill(heightValue);
      }

      // push into history
      const history = historyRef.current;

      const last = history[history.length - 1] ?? heightValue;
      const blended = last * 0.7 + heightValue * 0.3;

      history.shift();
      history.push(blended);

      // cart calulation
      const centerIndex = Math.floor(history.length / 2);
      const centerValue = history[centerIndex];

      const cartX =
        ((centerIndex - centerIndex) / (MAX_POINTS / 2)) * (width / 2) +
        width / 2;

      const baseline = heightCanvas / 2;
      const amplitude = centerValue * heightCanvas * 0.3;
      const cartY = baseline - amplitude;

      // draw line
      ctx.beginPath();

      history.forEach((v, i) => {
        const x =
          ((i - centerIndex) / (MAX_POINTS / 2)) * (width / 2) + width / 2;

        const baseline = heightCanvas / 2;
        const amplitude = v * heightCanvas * 0.3; // control intensity
        const y = baseline - amplitude;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      // style
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Cart
      // 4. 🔴 DRAW CART AFTER LINE
      ctx.beginPath();
      ctx.arc(cartX, cartY, 8, 0, Math.PI * 2);
      ctx.fillStyle = "red";
      ctx.fill();

      animationId = requestAnimationFrame(loop);
    }

    loop();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [audioEngine]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}
