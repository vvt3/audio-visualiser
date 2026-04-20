import { useEffect, useRef } from "react";

export default function Canvas({ audioEngine, controls, onCartUpdate }) {
  const canvasRef = useRef(null);

  const historyRef = useRef([]);
  const tiltRef = useRef(0);
  const speedRef = useRef(0);
  const smoothSpeedRef = useRef(0);
  const wheelRotationRef = useRef(0);
  const particlesRef = useRef([]);

  // CONTROLS
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

    // ---------------- RESIZE ----------------
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    // ---------------- HELPER FUNCTIONS -------

    function getDimensions() {
      const dpr = window.devicePixelRatio || 1;
      return {
        width: canvas.width / dpr,
        height: canvas.height / dpr,
      };
    }

    function processAudio(data) {
      const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
      const normalized = avg / 255;

      const shaped = Math.pow(normalized, SHAPE_EXPONENT);
      const heightValue = shaped * 1.5;

      return { normalized, heightValue };
    }

    function updateMotion(normalized) {
      const targetSpeed = MIN_SPEED + normalized * (MAX_SPEED - MIN_SPEED);

      smoothSpeedRef.current =
        smoothSpeedRef.current * (1 - SPEED_SMOOTHING) +
        targetSpeed * SPEED_SMOOTHING;

      const speed = smoothSpeedRef.current;

      speedRef.current += speed;

      return { speed };
    }

    function updateTrack(heightValue) {
      if (historyRef.current.length === 0) {
        historyRef.current = new Array(MAX_POINTS).fill(heightValue);
      }

      const history = historyRef.current;
      const centerIndex = Math.floor(MAX_POINTS / 2);

      const last = history[centerIndex] ?? heightValue;
      const blended = last * (1 - SMOOTHING) + heightValue * SMOOTHING;

      // movement
      while (speedRef.current >= 1) {
        // LEFT
        for (let i = 0; i < centerIndex; i++) {
          history[i] = history[i + 1];
        }

        // RIGHT
        for (let i = MAX_POINTS - 1; i > centerIndex; i--) {
          history[i] = history[i + 1];
        }

        speedRef.current -= 1;
      }

      // inject at center
      history[centerIndex] = blended;

      return { history, centerIndex, blended };
    }

    function computeCart(track, dims) {
      const { history, centerIndex } = track;
      const { width, height } = dims;

      const centerValue = history[centerIndex];

      const left = history[centerIndex - 1] ?? centerValue;
      const right = history[centerIndex + 1] ?? centerValue;

      const dy = right - left;
      const dx = 2;

      const targetAngle = -Math.atan2(dy, dx) * 0.6;

      const SMOOTH_TILT = 0.1;
      const TILT_MULTIPLIER = 1.2;

      tiltRef.current =
        tiltRef.current * (1 - SMOOTH_TILT) +
        targetAngle * SMOOTH_TILT * TILT_MULTIPLIER;

      const baseline = height / 2 + BASELINE_OFFSET;
      const amplitude = centerValue * height * AMPLITUDE;

      const slopeFactor = Math.abs(right - left);
      wheelRotationRef.current +=
        smoothSpeedRef.current * (1 + slopeFactor * 2) * 10;

      onCartUpdate?.({
        x: width / 2,
        y: baseline - amplitude,
        angle: tiltRef.current,
        wheelRotation: wheelRotationRef.current,
      });

      return {
        x: width / 2,
        y: baseline - amplitude,
        angle: tiltRef.current,
        value: centerValue,
      };
    }

    function drawBackground(ctx, dims) {
      const { width, height } = dims;

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);
    }

    function drawTrack(ctx, track, dims, normalized) {
      const { history, centerIndex } = track;
      const { width, height } = dims;

      const baseline = height / 2 + BASELINE_OFFSET;

      ctx.beginPath();

      history.forEach((v, i) => {
        const x =
          ((i - centerIndex) / (MAX_POINTS / 2)) * (width / 2) + width / 2;

        const amplitude = v * height * AMPLITUDE;
        const y = baseline - amplitude;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      const hue = 200 + normalized * 120;
      const brightness = 50 + normalized * 30;

      ctx.strokeStyle = `hsl(${hue}, 100%, ${brightness}%)`;
      ctx.lineWidth = 5 * normalized;

      ctx.shadowBlur = 10 + normalized * 30;
      ctx.shadowColor = ctx.strokeStyle;

      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    function drawCart(ctx, cart, normalized) {
      const { x, y, angle } = cart;

      const pulse = 1 + normalized * 0.3;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.moveTo(10 * pulse, 0);
      ctx.lineTo(-8 * pulse, -6 * pulse);
      ctx.lineTo(-8 * pulse, 6 * pulse);
      ctx.closePath();

      ctx.fillStyle = "red";
      ctx.fill();

      ctx.restore();
    }

    function nextFrame() {
      animationId = requestAnimationFrame(loop);
    }

    function spawnParticles(cart, speed, normalized) {
      const particles = particlesRef.current;

      const count = Math.floor(speed * 2);

      for (let i = 0; i < count; i++) {
        particles.push({
          x: cart.x,
          y: cart.y,
          vx: -Math.random() * 2 - 1,
          vy: (Math.random() - 0.5) * 2,
          //vy: (Math.random() - 0.5) * 2 - slope * 3,
          life: 1,
          size: 2 + Math.random() * 0.5,
        });
      }
    }

    function updateParticles() {
      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        p.life -= 0.02;
      }

      // remove dead
      particlesRef.current = particles.filter((p) => p.life > 0);
    }

    function drawParticles(ctx) {
      const particles = particlesRef.current;

      particles.forEach((p) => {
        ctx.globalAlpha = p.life;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        //ctx.lineTo(p.x, p.y)
        ctx.fillStyle = "white";
        ctx.fill();
      });

      ctx.globalAlpha = 1;
    }

    // ---------------- LOOP ----------------

    function loop() {
      const analyser = audioEngine?.analyser;

      if (!audioEngine || !analyser) {
        return nextFrame();
      }

      const data = audioEngine.getFrequencyData();
      if (!data) {
        return nextFrame();
      }

      const dims = getDimensions();

      const audio = processAudio(data);
      const motion = updateMotion(audio.normalized);
      const track = updateTrack(audio.heightValue);
      const cart = computeCart(track, dims);

      spawnParticles(cart, smoothSpeedRef.current, audio.normalized);

      drawBackground(ctx, dims);
      drawTrack(ctx, track, dims, audio.normalized);
      drawCart(ctx, cart, audio.normalized);

      updateParticles();
      drawParticles(ctx);

      nextFrame();
    }

    loop();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [audioEngine, controls]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}
