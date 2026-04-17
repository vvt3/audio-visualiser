import { useEffect, useRef } from "react";

export default function Canvas({ audioEngine, controls }) {
  const canvasRef = useRef(null);
  const smoothDataRef = useRef(null);
  const analyser = audioEngine?.analyser;
  const historyRef = useRef([]);

  // CONTROLS:
  const BASELINE_OFFSET = controls.baseline * 25;
  const MAX_POINTS = 200; // TODO expose VERY CAREFULLY

  // LOW (0.2–0.4) = exaggerates quiet sounds (music)
  // HIGH (1.0+) = more realistic
  const SHAPE_EXPONENT = controls.shape;

  // LOW (0.05) = slow, floaty hills
  // HIGH (0.5) = twitchy, jittery
  const SMOOTHING = controls.smoothing; // 0 - 1

  // LOW = flat track
  // HIGH = harsher peaks
  const AMPLITUDE = controls.amplitude;

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

      const avg = data.reduce((sum, v) => sum + v, 0) / data.length;

      const normalized = avg / 255;
      // shape curve
      const shaped = Math.pow(normalized, SHAPE_EXPONENT);
      // boost signal
      const heightValue = shaped * 1.5; // TODO ADD BOOST CONTROL LATER

      if (historyRef.current.length === 0) {
        historyRef.current = new Array(MAX_POINTS).fill(heightValue);
      }

      const history = historyRef.current;
      const centerIndex = Math.floor(MAX_POINTS / 2);

      // use CENTER as previous value
      const last = history[centerIndex] ?? heightValue;
      // smooth toward new audio value
      const blended = last * (1 - SMOOTHING) + heightValue * SMOOTHING;

      // shift LEFT side (past moves left)
      for (let i = 0; i < centerIndex; i++) {
        history[i] = history[i + 1];
      }

      // // shift RIGHT side (future moves right)
      // for (let i = MAX_POINTS - 1; i > centerIndex; i--) {
      //   history[i] = history[i - 1];
      // }

      // inject NEW data at center
      history[centerIndex] = blended;

      // read center
      const centerValue = history[centerIndex];

      const cartX = width / 2;

      const baseline = heightCanvas / 2 + BASELINE_OFFSET;
      const amplitude = centerValue * heightCanvas * AMPLITUDE;
      const cartY = baseline - amplitude;

      // draw line
      ctx.beginPath();

      history.forEach((v, i) => {
        const x =
          ((i - centerIndex) / (MAX_POINTS / 2)) * (width / 2) + width / 2;

        //const baseline = heightCanvas / 2;
        const amplitude = v * heightCanvas * AMPLITUDE;
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
  }, [audioEngine, controls]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}
