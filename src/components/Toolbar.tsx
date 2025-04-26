import React, { useRef, useState, useEffect } from "react";
import useStore from "../store/useStore";
import { ShimmerButton, PulsatingButton, RainbowButton } from "./MagicComponents";
import AnimatedShinyText from "./MagicComponents/AnimatedShinyText";
import AuroraText from "./MagicComponents/AuroraText";
import "./MagicComponents/animations.css";

const Toolbar: React.FC = () => {
  const tool = useStore((state) => state.tool);
  const setTool = useStore((state) => state.setTool);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const exportJSON = useStore((state) => state.exportJSON);
  const importJSON = useStore((state) => state.importJSON);
  const convertToReact = useStore((state) => state.convertToReact);
  const shapes = useStore((state) => state.shapes);
  const isConverting = useStore((state) => state.isConverting);
  const showCodePreview = useStore((state) => state.showCodePreview);
  const setShowCodePreview = useStore((state) => state.setShowCodePreview);
  // limit convert-to-react usage to MAX_CONVERTS, persisted in localStorage
  const MAX_CONVERTS = 6;
  const [convertCount, setConvertCount] = useState<number>(0);
  useEffect(() => {
    // initialize count from localStorage
    const stored = window.localStorage.getItem("convertCount");
    if (stored) {
      const num = parseInt(stored, 10);
      if (!isNaN(num)) setConvertCount(num);
    }
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          importJSON(data);
        } catch {
          console.error("Invalid JSON");
        }
      };
      reader.readAsText(file);
      // reset value to allow re-import same file
      e.target.value = "";
    }
  };

  const handleConvertClick = () => {
    // only convert if shapes exist and under limit
    if (shapes.length > 0 && convertCount < MAX_CONVERTS) {
      const next = convertCount + 1;
      setConvertCount(next);
      window.localStorage.setItem("convertCount", String(next));
      convertToReact();
    }
  };

  const handleTogglePreview = () => {
    setShowCodePreview(!showCodePreview);
  };

  return (
    <div className="w-[200px] bg-gray-800 p-3 box-border border-r border-gray-700 z-10 flex flex-col text-white">
      <h3 className="font-bold mb-3 text-center text-lg">
        <span className="animate-shimmer-text bg-clip-text bg-[length:200px_100%] bg-gradient-to-r from-transparent via-purple-500 to-transparent">
          Sketch
        </span>
        <span className="text-blue-400">2</span>
        <span className="animate-shimmer-text bg-clip-text bg-[length:200px_100%] bg-gradient-to-r from-transparent via-orange-500 to-transparent">
          React
        </span>
      </h3>
      <div className="flex flex-col space-y-2">
        {["select", "rectangle", "circle", "arrow", "text"].map((t) => (
          <button
            key={t}
            onClick={() => setTool(t as "select" | "rectangle" | "circle" | "arrow" | "text")}
            className={`block w-full my-1 p-2 box-border rounded bg-gray-700 border border-gray-600 cursor-pointer hover:bg-gray-600 transition-colors ${
              tool === t ? "bg-blue-600 border-blue-500 text-white" : ""
            }`}
          >
            <span className="relative overflow-hidden inline-block">
              <span className={`animate-shimmer-text bg-clip-text bg-[length:100px_100%]
                ${tool === t ? "bg-gradient-to-r from-transparent via-white/80 to-transparent" : ""}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </span>
            </span>
          </button>
        ))}
      </div>
      
      <hr className="border-none border-t border-gray-700 my-3" />
      
      <div className="flex justify-between space-x-2">
        <RainbowButton
          onClick={undo}
          className="flex-1 h-10 py-0 text-sm"
        >
          Undo
        </RainbowButton>
        <RainbowButton
          onClick={redo} 
          className="flex-1 h-10 py-0 text-sm"
        >
          Redo
        </RainbowButton>
      </div>
      
      <hr className="border-none border-t border-gray-700 my-3" />
      
      <div className="flex flex-col space-y-2">
        <PulsatingButton
          onClick={exportJSON}
          className="w-full text-gray-800" 
          pulseColor="#4ade80"
        >
          Export JSON
        </PulsatingButton>
        <PulsatingButton
          onClick={handleImportClick}
          className="w-full text-gray-800"
          pulseColor="#60a5fa"
        >
          Import JSON
        </PulsatingButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
      
      <hr className="border-none border-t border-gray-700 my-3" />
      
      <div className="flex flex-col space-y-2">
        <ShimmerButton
          onClick={handleConvertClick}
          disabled={shapes.length === 0 || isConverting || convertCount >= MAX_CONVERTS}
          className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
          shimmerColor={isConverting ? "#60a5fa" : "#f97316"}
          background={shapes.length === 0 || convertCount >= MAX_CONVERTS ? "#4b5563" : "#18181b"}
        >
          {isConverting ? "Converting..." : "Convert to React"}
        </ShimmerButton>
        
        {showCodePreview && (
          <button
            onClick={handleTogglePreview}
            className="block w-full my-1 p-2 rounded bg-gray-700 border border-gray-600 cursor-pointer hover:bg-gray-600 transition-colors"
          >
            {showCodePreview ? "Hide Preview" : "Show Preview"}
          </button>
        )}
        
        {/* Show conversion count with animated text */}
        <div className="text-center mt-2 text-sm">
          {convertCount >= MAX_CONVERTS ? (
            <AuroraText colors={["#ef4444", "#f97316", "#ef4444", "#dc2626"]} speed={1.5} className="text-sm">
              Conversion limit reached
            </AuroraText>
          ) : (
            <AnimatedShinyText className="text-sm">
              {MAX_CONVERTS - convertCount} conversions left
            </AnimatedShinyText>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
