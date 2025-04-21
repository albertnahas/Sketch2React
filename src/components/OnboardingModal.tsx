import React, { useState, useEffect } from "react";
import { Stage, Layer, Rect, Circle, Arrow, Text, Group } from "react-konva";
import { motion, AnimatePresence } from "framer-motion";

interface OnboardingModalProps {
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [stageSize, setStageSize] = useState({
    width: Math.min(650, window.innerWidth - 60),
    height: 300,
  });

  // Animation progress for each step
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    // Reset animation progress when step changes
    setAnimationProgress(0);

    // Progress animation for current step
    const interval = setInterval(() => {
      setAnimationProgress((prev) => {
        if (prev >= 1) {
          clearInterval(interval);
          // Auto transition to next step when animation completes
          setTimeout(() => {
            if (currentStep < totalSteps) {
              setCurrentStep(currentStep + 1);
            }
          }, 500);
          return 1;
        }
        return prev + 0.01;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentStep, totalSteps]);

  // Handle window resize for responsive modal
  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: Math.min(650, window.innerWidth - 60),
        height: 300,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem("onboardingCompleted", "true");
    onClose();
  };

  // Dynamic cursor position based on animation progress
  const getCursorPosition = () => {
    const progress = animationProgress;

    if (currentStep === 1) {
      // Drawing a rectangle and circle
      if (progress < 0.3) {
        // Move to start position
        return { x: 150, y: 100 };
      } else if (progress < 0.6) {
        // Draw rectangle
        const t = (progress - 0.3) / 0.3;
        return {
          x: 150 + t * 100,
          y: 100 + t * 100,
        };
      } else {
        // Draw circle
        const t = (progress - 0.6) / 0.4;
        return {
          x: 300 + Math.sin(t * Math.PI * 2) * 10,
          y: 150 + Math.cos(t * Math.PI * 2) * 10,
        };
      }
    } else if (currentStep === 2) {
      // Using toolbar
      if (progress < 0.3) {
        // Move to toolbar
        return { x: 80, y: 175 };
      } else if (progress < 0.7) {
        // Move to canvas
        const t = (progress - 0.3) / 0.4;
        return {
          x: 80 + t * 270,
          y: 175 - t * 25,
        };
      } else {
        // Interact with canvas
        const t = (progress - 0.7) / 0.3;
        return {
          x: 350 + Math.sin(t * Math.PI) * 20,
          y: 150 + Math.cos(t * Math.PI) * 20,
        };
      }
    } else if (currentStep === 3) {
      // Converting to code
      if (progress < 0.4) {
        // Move to convert button
        const t = progress / 0.4;
        return {
          x: 300 - 50 + t * 50,
          y: 270 - t * 80,
        };
      } else if (progress < 0.7) {
        // Click convert button
        return { x: 300, y: 190 };
      } else {
        // Complete
        return { x: 300, y: 190 };
      }
    }

    return { x: 0, y: 0 };
  };

  const cursorPos = getCursorPosition();

  // Step 1 animations based on progress
  const getDrawingState = () => {
    const progress = animationProgress;

    if (currentStep === 1) {
      return {
        rectWidth:
          progress < 0.3
            ? 0
            : progress < 0.6
            ? ((progress - 0.3) / 0.3) * 100
            : 100,
        rectHeight:
          progress < 0.3
            ? 0
            : progress < 0.6
            ? ((progress - 0.3) / 0.3) * 100
            : 100,
        circleRadius: progress < 0.6 ? 0 : ((progress - 0.6) / 0.4) * 30,
      };
    }

    return {
      rectWidth: 100,
      rectHeight: 100,
      circleRadius: 50,
    };
  };

  const drawingState = getDrawingState();

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <motion.div
        className="modal-content"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "20px",
          width: `${stageSize.width + 40}px`,
          maxWidth: "90%",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
          position: "relative",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "15px",
            right: "15px",
            cursor: "pointer",
            fontSize: "24px",
          }}
          onClick={onClose}
        >
          &times;
        </div>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "5px" }}>
            Welcome to Sketch2React
          </h2>
          <p style={{ color: "#777", fontSize: "16px" }}>
            Learn how to turn your sketches into React code in seconds
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            overflow: "hidden",
            marginBottom: "20px",
          }}
        >
          <Stage width={stageSize.width} height={stageSize.height}>
            <Layer>
              {/* Step 1: Drawing */}
              {currentStep === 1 && (
                <>
                  <Rect
                    x={50}
                    y={50}
                    width={stageSize.width - 100}
                    height={200}
                    fill="white"
                    stroke="#ddd"
                    strokeWidth={2}
                  />
                  <Rect
                    x={150}
                    y={100}
                    width={drawingState.rectWidth}
                    height={drawingState.rectHeight}
                    fill="transparent"
                    stroke="#333"
                    strokeWidth={2}
                  />
                  <Circle
                    x={300}
                    y={150}
                    radius={drawingState.circleRadius}
                    fill="transparent"
                    stroke="#333"
                    strokeWidth={2}
                  />
                </>
              )}

              {/* Step 2: Using toolbar */}
              {currentStep === 2 && (
                <>
                  <Rect
                    x={50}
                    y={50}
                    width={100}
                    height={200}
                    fill="#f5f5f5"
                    stroke="#ddd"
                    strokeWidth={2}
                  />
                  <Rect
                    x={150}
                    y={50}
                    width={stageSize.width - 200}
                    height={200}
                    fill="white"
                    stroke="#ddd"
                    strokeWidth={2}
                  />

                  <Rect
                    x={60}
                    y={70}
                    width={80}
                    height={25}
                    cornerRadius={3}
                    fill="#e0e0e0"
                  />
                  <Rect
                    x={60}
                    y={105}
                    width={80}
                    height={25}
                    cornerRadius={3}
                    fill="#e0e0e0"
                  />
                  <Rect
                    x={60}
                    y={140}
                    width={80}
                    height={25}
                    cornerRadius={3}
                    fill="#e0e0e0"
                  />
                  <Rect
                    x={60}
                    y={175}
                    width={80}
                    height={25}
                    cornerRadius={3}
                    fill={animationProgress < 0.3 ? "#ff5252" : "#e0e0e0"}
                  />

                  <Circle
                    x={320}
                    y={150}
                    radius={30}
                    fill="transparent"
                    stroke="#333"
                    strokeWidth={2}
                  />
                  <Rect
                    x={170}
                    y={100}
                    width={100}
                    height={100}
                    fill="transparent"
                    stroke="#333"
                    strokeWidth={2}
                  />
                </>
              )}

              {/* Step 3: Converting to code */}
              {currentStep === 3 && (
                <>
                  <Rect
                    x={50}
                    y={50}
                    width={stageSize.width - 100}
                    height={100}
                    fill="white"
                    stroke="#ddd"
                    strokeWidth={2}
                  />
                  <Rect
                    x={50}
                    y={150}
                    width={stageSize.width - 100}
                    height={120}
                    fill="#f8f8f8"
                    stroke="#ddd"
                    strokeWidth={2}
                  />

                  <Circle
                    x={250}
                    y={100}
                    radius={22}
                    fill="transparent"
                    stroke="#333"
                    strokeWidth={2}
                  />
                  <Rect
                    x={150}
                    y={70}
                    width={60}
                    height={60}
                    fill="transparent"
                    stroke="#333"
                    strokeWidth={2}
                  />

                  <Text
                    text="<div className='container'>"
                    x={100}
                    y={180}
                    fontFamily="monospace"
                    fontSize={12}
                    fill="#777"
                  />
                  <Text
                    text="  <button> Book Now </button>"
                    x={120}
                    y={200}
                    fontFamily="monospace"
                    fontSize={12}
                    fill="#777"
                    visible={animationProgress > 0.7}
                  />
                  <Text
                    text={
                      '  <img className="avatar" src="..." alt="Avatar" />'
                    }
                    x={120}
                    y={220}
                    fontFamily="monospace"
                    fontSize={12}
                    fill="#777"
                    visible={animationProgress > 0.8}
                  />
                  <Text
                    text="</div>"
                    x={100}
                    y={240}
                    fontFamily="monospace"
                    fontSize={12}
                    fill="#777"
                    visible={animationProgress > 0.9}
                  />

                  <Group>
                    <Rect
                      x={350}
                      y={175}
                      width={100}
                      height={30}
                      cornerRadius={4}
                      fill={
                        animationProgress > 0.4 && animationProgress < 0.7
                          ? "#3e8e41"
                          : "#4CAF50"
                      }
                    />
                    <Text
                      text="Preview"
                      x={370}
                      y={185}
                      fontFamily="sans-serif"
                      fontSize={14}
                      fill="white"
                    />
                  </Group>
                </>
              )}

              {/* Cursor */}
              <Circle
                x={cursorPos.x}
                y={cursorPos.y}
                radius={5}
                fill="#4a90e2"
              />
            </Layer>
          </Stage>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "20px",
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor:
                    index + 1 === currentStep ? "#4a90e2" : "#ddd",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  transform:
                    index + 1 === currentStep ? "scale(1.2)" : "scale(1)",
                }}
                onClick={() => setCurrentStep(index + 1)}
              />
            ))}
          </div>

          <button
            style={{
              backgroundColor: "#4a90e2",
              color: "white",
              border: "none",
              borderRadius: "4px",
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
              transition: "background-color 0.3s",
            }}
            onClick={nextStep}
          >
            {currentStep === totalSteps ? "Get Started" : "Next"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OnboardingModal;
