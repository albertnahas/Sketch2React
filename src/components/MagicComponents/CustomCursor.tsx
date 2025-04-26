import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "./CanvasEffects.css";

interface CustomCursorProps {
  tool: string;
  isDragging: boolean;
  isSpacePressed: boolean;
  isPanning: boolean;
}

const CustomCursor: React.FC<CustomCursorProps> = ({
  tool,
  isDragging,
  isSpacePressed,
  isPanning,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", updatePosition);
    document.body.addEventListener("mouseenter", handleMouseEnter);
    document.body.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", updatePosition);
      document.body.removeEventListener("mouseenter", handleMouseEnter);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Determine cursor type
  let cursorClass = tool;
  if (isPanning || (isSpacePressed && isDragging)) {
    cursorClass = "grabbing";
  } else if (isDragging) {
    cursorClass = "grabbing";
  }

  // Trail effect
  const trailCount = 5;
  const trailDelay = 0.02; // seconds

  return (
    <>
      {isVisible && (
        <>
          {/* Main cursor */}
          <motion.div
            className={`custom-cursor ${cursorClass}`}
            style={{
              left: position.x,
              top: position.y,
              opacity: isVisible ? 1 : 0,
            }}
            animate={{
              left: position.x,
              top: position.y,
              scale: isDragging ? 0.8 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 28,
              mass: 0.5,
            }}
          />

          {/* Cursor trails for drawing tools */}
          {(tool === "rectangle" || tool === "circle" || tool === "arrow" || tool === "text") &&
            Array.from({ length: trailCount }).map((_, i) => (
              <motion.div
                key={i}
                className="mouse-trail"
                style={{
                  backgroundColor: 
                    tool === "rectangle" ? "rgba(99, 102, 241, 0.3)" :
                    tool === "circle" ? "rgba(236, 72, 153, 0.3)" :
                    tool === "arrow" ? "rgba(34, 211, 238, 0.3)" :
                    tool === "text" ? "rgba(250, 204, 21, 0.3)" : 
                    "rgba(255, 255, 255, 0.3)",
                  opacity: 1 - (i / trailCount),
                }}
                animate={{
                  left: position.x,
                  top: position.y,
                  scale: 1 - (i * 0.15),
                }}
                transition={{
                  duration: 0.1,
                  delay: i * trailDelay,
                }}
              />
            ))}
        </>
      )}
    </>
  );
};

export default CustomCursor;
