import React, { useRef, useState, useEffect } from 'react';
import useStore from '../store/useStore';

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
    const stored = window.localStorage.getItem('convertCount');
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
          console.error('Invalid JSON');
        }
      };
      reader.readAsText(file);
      // reset value to allow re-import same file
      e.target.value = '';
    }
  };

  const handleConvertClick = () => {
    // only convert if shapes exist and under limit
    if (shapes.length > 0 && convertCount < MAX_CONVERTS) {
      const next = convertCount + 1;
      setConvertCount(next);
      window.localStorage.setItem('convertCount', String(next));
      convertToReact();
    }
  };

  const handleTogglePreview = () => {
    setShowCodePreview(!showCodePreview);
  };
  // Tailwind CSS toggle
  const useTailwind = useStore((state) => state.useTailwind);
  const setUseTailwind = useStore((state) => state.setUseTailwind);

  return (
    <div className="toolbar">
      <div>
        <button onClick={() => setTool('select')} className={tool === 'select' ? 'active' : ''}>
          Select
        </button>
        <button onClick={() => setTool('rectangle')} className={tool === 'rectangle' ? 'active' : ''}>
          Rectangle
        </button>
        <button onClick={() => setTool('circle')} className={tool === 'circle' ? 'active' : ''}>
          Circle
        </button>
        <button onClick={() => setTool('arrow')} className={tool === 'arrow' ? 'active' : ''}>
          Arrow
        </button>
        <button onClick={() => setTool('text')} className={tool === 'text' ? 'active' : ''}>
          Text
        </button>
      </div>
      <hr />
      <div>
        <button onClick={undo}>Undo</button>
        <button onClick={redo}>Redo</button>
      </div>
      <hr />
      <div>
        <button onClick={exportJSON}>Export JSON</button>
        <button onClick={handleImportClick}>Import JSON</button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      <hr />
      <div>
        <button
          onClick={handleConvertClick}
          disabled={shapes.length === 0 || isConverting || convertCount >= MAX_CONVERTS}
          className={isConverting ? 'loading' : ''}
        >
          {isConverting ? 'Converting...' : 'Convert to React'}
        </button>
        {showCodePreview && (
          <button onClick={handleTogglePreview}>
            {showCodePreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        )}
        {/* Tailwind CSS toggle */}
        <div style={{ marginTop: 4 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="checkbox"
              checked={useTailwind}
              onChange={(e) => setUseTailwind(e.target.checked)}
            />
            Use Tailwind CSS
          </label>
        </div>
        {/* show warning when conversion limit is reached */}
        {convertCount >= MAX_CONVERTS && (
          <div style={{ color: 'red', marginTop: 4, fontSize: 12 }}>
            Conversion limit of {MAX_CONVERTS} reached.
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar;