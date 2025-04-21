import { Shape } from "../store/useStore";

/**
 * Generates a mock response for the ConvertToReact feature
 * Use this in case the API key is not available or for testing
 * 
 * @param shapes The shapes from the canvas
 * @returns A mock response with React code and preview HTML
 */
export const generateMockResponse = async (shapes: Shape[]) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    files: {
      "App.tsx": `import React from 'react';
import './App.css';
import { shapes } from './shapes';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <div className="canvas">
        {shapes.map((shape) => {
          if (shape.type === 'rectangle') {
            return (
              <div
                key={shape.id}
                className="shape rectangle"
                style={{
                  position: 'absolute',
                  left: \`\${shape.x}px\`,
                  top: \`\${shape.y}px\`,
                  width: \`\${shape.width}px\`,
                  height: \`\${shape.height}px\`,
                  transform: \`rotate(\${shape.rotation}deg)\`,
                  border: \`\${shape.strokeWidth}px solid \${shape.stroke}\`,
                  backgroundColor: shape.fill !== 'transparent' ? shape.fill : 'transparent',
                }}
              />
            );
          } else if (shape.type === 'circle') {
            return (
              <div
                key={shape.id}
                className="shape circle"
                style={{
                  position: 'absolute',
                  left: \`\${shape.x - shape.radius}px\`,
                  top: \`\${shape.y - shape.radius}px\`,
                  width: \`\${shape.radius * 2}px\`,
                  height: \`\${shape.radius * 2}px\`,
                  borderRadius: '50%',
                  transform: \`rotate(\${shape.rotation}deg)\`,
                  border: \`\${shape.strokeWidth}px solid \${shape.stroke}\`,
                  backgroundColor: shape.fill !== 'transparent' ? shape.fill : 'transparent',
                }}
              />
            );
          } else if (shape.type === 'text') {
            return (
              <div
                key={shape.id}
                className="shape text"
                style={{
                  position: 'absolute',
                  left: \`\${shape.x}px\`,
                  top: \`\${shape.y}px\`,
                  transform: \`rotate(\${shape.rotation}deg)\`,
                  color: shape.fill,
                  fontSize: \`\${shape.fontSize}px\`,
                }}
              >
                {shape.text}
              </div>
            );
          } else if (shape.type === 'arrow') {
            return (
              <div
                key={shape.id}
                className="shape arrow"
                style={{
                  position: 'absolute',
                  left: \`\${shape.x}px\`,
                  top: \`\${shape.y}px\`,
                  width: '0',
                  height: '0',
                  transform: \`rotate(\${shape.rotation}deg)\`,
                }}
              >
                <div className="arrow-line" style={{
                  position: 'absolute',
                  width: \`\${Math.sqrt(Math.pow(shape.points[2], 2) + Math.pow(shape.points[3], 2))}px\`,
                  height: \`\${shape.strokeWidth}px\`,
                  backgroundColor: shape.stroke,
                  transformOrigin: 'left center',
                  transform: \`rotate(\${Math.atan2(shape.points[3], shape.points[2]) * 180 / Math.PI}deg)\`
                }} />
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default App;`,
      "shapes.ts": `// Generated shape data
export const shapes = ${JSON.stringify(shapes, null, 2)};`,
      "App.css": `.app-container {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: #ffffff;
}

.canvas {
  width: 100%;
  height: 100%;
  position: relative;
}

.shape {
  position: absolute;
}

.rectangle {
  border-radius: 0;
}

.circle {
  border-radius: 50%;
}

.text {
  white-space: pre;
  font-family: Arial, sans-serif;
}

.arrow-line {
  position: absolute;
}`
    },
    previewHTML: `<div id="root">
  <div class="app-container">
    <div class="canvas">
      ${shapes.map(shape => {
        if (shape.type === 'rectangle') {
          return `<div class="shape rectangle" style="position: absolute; left: ${shape.x}px; top: ${shape.y}px; width: ${shape.width}px; height: ${shape.height}px; transform: rotate(${shape.rotation}deg); border: ${shape.strokeWidth}px solid ${shape.stroke}; background-color: ${shape.fill !== 'transparent' ? shape.fill : 'transparent'};"></div>`;
        } else if (shape.type === 'circle') {
          return `<div class="shape circle" style="position: absolute; left: ${shape.x - shape.radius}px; top: ${shape.y - shape.radius}px; width: ${shape.radius * 2}px; height: ${shape.radius * 2}px; border-radius: 50%; transform: rotate(${shape.rotation}deg); border: ${shape.strokeWidth}px solid ${shape.stroke}; background-color: ${shape.fill !== 'transparent' ? shape.fill : 'transparent'};"></div>`;
        } else if (shape.type === 'text') {
          return `<div class="shape text" style="position: absolute; left: ${shape.x}px; top: ${shape.y}px; transform: rotate(${shape.rotation}deg); color: ${shape.fill}; font-size: ${shape.fontSize}px;">${shape.text}</div>`;
        } else if (shape.type === 'arrow') {
          const length = Math.sqrt(Math.pow(shape.points[2], 2) + Math.pow(shape.points[3], 2));
          const angle = Math.atan2(shape.points[3], shape.points[2]) * 180 / Math.PI;
          return `<div class="shape arrow" style="position: absolute; left: ${shape.x}px; top: ${shape.y}px; width: 0; height: 0; transform: rotate(${shape.rotation}deg);">
            <div class="arrow-line" style="position: absolute; width: ${length}px; height: ${shape.strokeWidth}px; background-color: ${shape.stroke}; transform-origin: left center; transform: rotate(${angle}deg);"></div>
          </div>`;
        }
        return '';
      }).join('\n      ')}
    </div>
  </div>
</div>`
  };
};