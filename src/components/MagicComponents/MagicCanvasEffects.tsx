import React, { useRef, useEffect } from "react";

interface ParticleSystem {
  particles: Particle[];
  lastTime: number;
  emit: (x: number, y: number, color: string, count: number) => void;
  update: (time: number) => void;
  render: (ctx: CanvasRenderingContext2D) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  life: number;
  maxLife: number;
}

interface MagicCanvasEffectsProps {
  width: number;
  height: number;
  shapes: any[]; // Use any to avoid type issues with the shape interface
  selectedId: string | null;
  tool: string;
  isDrawing: boolean;
  mousePosition: { x: number; y: number } | null;
  stageScale: number;
  stageX: number;
  stageY: number;
}

// Create a particle system for visual effects
const createParticleSystem = (): ParticleSystem => {
  const particles: Particle[] = [];
  const lastTime = performance.now();

  const emit = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        radius: Math.random() * 3 + 1,
        life: 1.0,
        maxLife: Math.random() * 1 + 0.5,
      });
    }
  };

  const update = (time: number) => {
    const delta = (time - lastTime) / 1000; // Convert to seconds

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // Gravity effect
      p.life -= delta / p.maxLife;

      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  };

  const render = (ctx: CanvasRenderingContext2D) => {
    for (const p of particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  return { particles, lastTime, emit, update, render };
};

// Generate glowing aura color based on tool/shape type
const getAuraColor = (tool: string): string => {
  switch (tool) {
    case "rectangle":
      return "rgba(99, 102, 241, 0.3)"; // Indigo
    case "circle":
      return "rgba(236, 72, 153, 0.3)"; // Pink
    case "arrow":
      return "rgba(34, 211, 238, 0.3)"; // Cyan
    case "text":
      return "rgba(250, 204, 21, 0.3)"; // Yellow
    default:
      return "rgba(255, 255, 255, 0.2)";
  }
};

// Component that renders canvas effects
const MagicCanvasEffects: React.FC<MagicCanvasEffectsProps> = ({
  width,
  height,
  shapes,
  selectedId,
  tool,
  isDrawing,
  mousePosition,
  stageScale,
  stageX,
  stageY,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const prevShapesCountRef = useRef(shapes.length);
  const glowLayerRef = useRef<HTMLCanvasElement>(null);

  // Initialize particle system
  useEffect(() => {
    if (!particleSystemRef.current) {
      particleSystemRef.current = createParticleSystem();
    }
  }, []);

  // Animation loop for particles and effects
  useEffect(() => {
    const canvas = canvasRef.current;
    const glowCanvas = glowLayerRef.current;
    if (!canvas || !glowCanvas || !particleSystemRef.current) return;

    const ctx = canvas.getContext("2d");
    const glowCtx = glowCanvas.getContext("2d");
    if (!ctx || !glowCtx) return;

    let animationFrameId: number;
    let lastEmitTime = 0;

    const animate = (time: number) => {
      // Clear both canvases
      ctx.clearRect(0, 0, width, height);
      glowCtx.clearRect(0, 0, width, height);

      // Update and render particles
      const particleSystem = particleSystemRef.current!;
      particleSystem.update(time);
      particleSystem.render(ctx);

      // Draw glow effect for selected shape
      if (selectedId) {
        const selectedShape = shapes.find((s) => s.id === selectedId);
        if (selectedShape) {
          // Apply stage transformations to position the glow correctly
          glowCtx.save();
          glowCtx.translate(stageX, stageY);
          glowCtx.scale(stageScale, stageScale);

          // Draw glow based on shape type
          glowCtx.shadowColor = getAuraColor(selectedShape.type);
          glowCtx.shadowBlur = 15;
          glowCtx.strokeStyle = "rgba(255,255,255,0.01)";
          glowCtx.lineWidth = 2;

          switch (selectedShape.type) {
            case "rectangle":
              glowCtx.strokeRect(
                selectedShape.x - 5,
                selectedShape.y - 5,
                selectedShape.width + 10,
                selectedShape.height + 10
              );
              break;
            case "circle":
              glowCtx.beginPath();
              glowCtx.arc(
                selectedShape.x + selectedShape.radius,
                selectedShape.y + selectedShape.radius,
                selectedShape.radius + 5,
                0,
                Math.PI * 2
              );
              glowCtx.stroke();
              break;
            case "text":
              glowCtx.strokeRect(
                selectedShape.x - 5,
                selectedShape.y - 5,
                selectedShape.width + 10,
                selectedShape.height + 10
              );
              break;
            case "arrow":
              // Simplified arrow glow
              glowCtx.beginPath();
              glowCtx.moveTo(selectedShape.points[0], selectedShape.points[1]);
              glowCtx.lineTo(selectedShape.points[2], selectedShape.points[3]);
              glowCtx.stroke();
              break;
          }

          glowCtx.restore();
        }
      }

      // Emit particles during drawing
      if (isDrawing && mousePosition) {
        // Limit emission rate to avoid too many particles
        if (time - lastEmitTime > 50) {
          // Apply stage transformations to position particles correctly
          const worldX = (mousePosition.x - stageX) / stageScale;
          const worldY = (mousePosition.y - stageY) / stageScale;

          particleSystem.emit(
            mousePosition.x,
            mousePosition.y,
            getAuraColor(tool),
            3
          );
          lastEmitTime = time;
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    width,
    height,
    shapes,
    selectedId,
    tool,
    isDrawing,
    mousePosition,
    stageScale,
    stageX,
    stageY,
  ]);

  // Emit particles when new shape is created
  useEffect(() => {
    if (
      shapes.length > prevShapesCountRef.current &&
      particleSystemRef.current &&
      shapes.length > 0
    ) {
      const newShape = shapes[shapes.length - 1];

      // Calculate position for particle emission based on shape
      let emitX, emitY;

      switch (newShape.type) {
        case "rectangle":
          emitX = (newShape.x + newShape.width / 2) * stageScale + stageX;
          emitY = (newShape.y + newShape.height / 2) * stageScale + stageY;
          break;
        case "circle":
          emitX = (newShape.x + newShape.radius) * stageScale + stageX;
          emitY = (newShape.y + newShape.radius) * stageScale + stageY;
          break;
        case "arrow":
          if (newShape.points && newShape.points.length >= 4) {
            emitX =
              ((newShape.points[0] + newShape.points[2]) / 2) * stageScale +
              stageX;
            emitY =
              ((newShape.points[1] + newShape.points[3]) / 2) * stageScale +
              stageY;
          } else {
            emitX = newShape.x * stageScale + stageX;
            emitY = newShape.y * stageScale + stageY;
          }
          break;
        case "text":
          emitX =
            (newShape.x + (newShape.width || 0) / 2) * stageScale + stageX;
          emitY =
            (newShape.y + (newShape.height || 0) / 2) * stageScale + stageY;
          break;
        default:
          emitX = 0;
          emitY = 0;
      }

      // Emit a burst of particles at the new shape's position
      particleSystemRef.current.emit(
        emitX,
        emitY,
        getAuraColor(newShape.type),
        20
      );
    }

    prevShapesCountRef.current = shapes.length;
  }, [shapes, stageScale, stageX, stageY]);

  return (
    <>
      <canvas
        ref={glowLayerRef}
        width={width}
        height={height}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
    </>
  );
};

export default MagicCanvasEffects;
