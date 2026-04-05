import { useEffect, useRef } from "react";

export function AnimatedBackground(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let frame = 0;

    const points = Array.from({ length: 42 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0005,
      vy: (Math.random() - 0.5) * 0.0005,
    }));

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);

      for (const point of points) {
        point.x += point.vx;
        point.y += point.vy;
        if (point.x < 0 || point.x > 1) point.vx *= -1;
        if (point.y < 0 || point.y > 1) point.vy *= -1;
      }

      for (let i = 0; i < points.length; i += 1) {
        const a = points[i];
        const ax = a.x * width;
        const ay = a.y * height;

        context.beginPath();
        context.fillStyle = "rgba(255,255,255,0.7)";
        context.arc(ax, ay, 1.5, 0, Math.PI * 2);
        context.fill();

        for (let j = i + 1; j < points.length; j += 1) {
          const b = points[j];
          const bx = b.x * width;
          const by = b.y * height;
          const distance = Math.hypot(ax - bx, ay - by);
          if (distance < 170) {
            context.beginPath();
            context.strokeStyle = `rgba(149,122,255,${0.14 - distance / 1500})`;
            context.moveTo(ax, ay);
            context.lineTo(bx, by);
            context.stroke();
          }
        }
      }

      frame = requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(124,77,255,0.25),transparent_38%),radial-gradient(circle_at_left,rgba(29,78,216,0.16),transparent_30%),linear-gradient(180deg,#02030a_0%,#02040d_50%,#010207_100%)]" />
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 opacity-80" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(196,181,253,0.14),transparent_22%)]" />
    </>
  );
}
