import React, { useRef, useState, useEffect } from "react";
import useStore from "../store/useStore";

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
    <div className="w-[200px] bg-gray-100 p-2.5 box-border border-r border-gray-300 z-10 flex flex-col">
      <div className="flex flex-col">
        {["select", "rectangle", "circle", "arrow", "text"].map((t) => (
          <button
            key={t}
            onClick={() => setTool(t)}
            className={`block w-full my-1 p-1.5 box-border bg-white border border-gray-300 cursor-pointer ${
              tool === t ? "bg-gray-200" : ""
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <hr className="border-none border-t border-gray-300 my-2" />
      <div className="flex flex-col">
        <button
          onClick={undo}
          className="block w-full my-1 p-1.5 box-border bg-white border border-gray-300 cursor-pointer"
        >
          Undo
        </button>
        <button
          onClick={redo}
          className="block w-full my-1 p-1.5 box-border bg-white border border-gray-300 cursor-pointer"
        >
          Redo
        </button>
      </div>
      <hr className="border-none border-t border-gray-300 my-2" />
      <div className="flex flex-col">
        <button
          onClick={exportJSON}
          className="block w-full my-1 p-1.5 box-border bg-white border border-gray-300 cursor-pointer"
        >
          Export JSON
        </button>
        <button
          onClick={handleImportClick}
          className="block w-full my-1 p-1.5 box-border bg-white border border-gray-300 cursor-pointer"
        >
          Import JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
      <hr className="border-none border-t border-gray-300 my-2" />
      <div className="flex flex-col">
        <button
          onClick={handleConvertClick}
          disabled={
            shapes.length === 0 || isConverting || convertCount >= MAX_CONVERTS
          }
          className={`block w-full my-1 p-1.5 box-border bg-white border border-gray-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
            ${isConverting ? "relative overflow-hidden bg-gray-100" : ""}`}
        >
          {isConverting ? "Converting..." : "Convert to React"}
        </button>
        {showCodePreview && (
          <button
            onClick={handleTogglePreview}
            className="block w-full my-1 p-1.5 box-border bg-white border border-gray-300 cursor-pointer"
          >
            {showCodePreview ? "Hide Preview" : "Show Preview"}
          </button>
        )}
        {/* show warning when conversion limit is reached */}
        {convertCount >= MAX_CONVERTS && (
          <div style={{ color: "red", marginTop: 4, fontSize: 12 }}>
            Conversion limit of {MAX_CONVERTS} reached.
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
