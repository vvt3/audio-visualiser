import { useEffect, useRef } from "react";

export default function Canvas({ audioEngine, controls }) {
  const canvasRef = useRef(null);
  const smoothDataRef = useRef(null);
  const analyser = audioEngine?.analyser;
  const historyRef = useRef([]);
  const tiltRef = useRef(0);
  const speedRef = useRef(0);
  const smoothSpeedRef = useRef(0);

  // CONTROLS:
  const BASELINE_OFFSET = controls.baseline * 25;
  const MAX_POINTS = 200;
  const SHAPE_EXPONENT = controls.shape;
  const SMOOTHING = controls.smoothing;
  const AMPLITUDE = controls.amplitude;

  const MIN_SPEED = 0.5;
  const MAX_SPEED = 3;
  const SPEED_SMOOTHING = 0.2;

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
      const targetSpeed = MIN_SPEED + normalized * (MAX_SPEED - MIN_SPEED);
      smoothSpeedRef.current =
        smoothSpeedRef.current * (1 - SPEED_SMOOTHING) +
        targetSpeed * SPEED_SMOOTHING;

      const speed = smoothSpeedRef.current;
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

      // Track movement by speed
      speedRef.current += speed;

      while (speedRef.current >= 1) {
        // LEFT side moves left
        for (let i = 0; i < centerIndex; i++) {
          history[i] = history[i + 1];
        }

        // // RIGHT side moves right
        // for (let i = MAX_POINTS - 1; i > centerIndex; i--) {
        //   history[i] = history[i - 1];
        // }

        speedRef.current -= 1;
      }
      // // shift LEFT side
      // for (let i = 0; i < centerIndex; i++) {
      //   history[i] = history[i + 1];
      // }

      // // // shift RIGHT side (future moves right)
      // // for (let i = MAX_POINTS - 1; i > centerIndex; i--) {
      // //   history[i] = history[i - 1];
      // // }

      // inject NEW data at center
      history[centerIndex] = blended;

      // read center
      const centerValue = history[centerIndex];

      // Cart angling
      const left = history[centerIndex - 1] ?? centerValue;
      const right = history[centerIndex + 1] ?? centerValue;
      const slope = right - left;

      const dx = 2;
      const dy = right - left;

      const targetAngle = -Math.atan2(dy, dx) * 0.6;
      const SMOOTH_TILT = 0.1; // tweak this
      const TILT_MULTIPLIER = 1.2;

      tiltRef.current =
        tiltRef.current * (1 - SMOOTH_TILT) +
        targetAngle * SMOOTH_TILT * TILT_MULTIPLIER;

      const angle = tiltRef.current;

      const baseline = heightCanvas / 2 + BASELINE_OFFSET;
      const amplitude = centerValue * heightCanvas * AMPLITUDE;

      const cartX = width / 2;
      const cartY = baseline - amplitude;

      // ------------------Draw line

      ctx.beginPath();

      // Point - Point Transformation
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

      // Bezier Curve Transformation

      // style the line
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // -------------- Draw Cart
      // ctx.beginPath();
      // ctx.arc(cartX, cartY, 8, 0, Math.PI * 2);
      // ctx.fillStyle = "red";
      // ctx.fill();
      ctx.save();

      ctx.translate(cartX, cartY);
      ctx.rotate(angle);
      // triangle pointing right
      ctx.beginPath();
      ctx.moveTo(10, 0); // front
      ctx.lineTo(-8, -6); // back top
      ctx.lineTo(-8, 6); // back bottom

      ctx.closePath();

      ctx.fillStyle = "red";
      ctx.fill();

      ctx.restore();

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
