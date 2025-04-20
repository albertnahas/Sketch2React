import React, { useRef } from 'react';
import useStore from '../store/useStore';

const Toolbar: React.FC = () => {
  const tool = useStore((state) => state.tool);
  const setTool = useStore((state) => state.setTool);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const exportJSON = useStore((state) => state.exportJSON);
  const importJSON = useStore((state) => state.importJSON);

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
    </div>
  );
};

export default Toolbar;