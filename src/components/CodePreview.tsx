import React from "react";
import useStore from "../store/useStore";
import { Sandpack } from "@codesandbox/sandpack-react";
import "./CodePreview.css";

interface CodePreviewProps {
  width: string;
}

const CodePreview: React.FC<CodePreviewProps> = ({ width }) => {
  const conversionResult = useStore((state) => state.conversionResult);
  const isConverting = useStore((state) => state.isConverting);
  const conversionError = useStore((state) => state.conversionError);
  const useTailwind = useStore((state) => state.useTailwind);

  if (isConverting) {
    return (
      <div className="code-preview-container" style={{ width }}>
        <div className="code-preview-loading">
          <div className="spinner"></div>
          <p>Converting to React...</p>
        </div>
      </div>
    );
  }

  if (conversionError) {
    return (
      <div className="code-preview-container" style={{ width }}>
        <div className="code-preview-error">
          <h3>Error</h3>
          <p>{conversionError}</p>
        </div>
      </div>
    );
  }

  if (!conversionResult) {
    return (
      <div className="code-preview-container" style={{ width }}>
        <div className="code-preview-empty">
          <p>
            Click "Convert to React" to generate React code from your sketch.
          </p>
        </div>
      </div>
    );
  }

  const { files: baseFiles } = conversionResult;
  // Prepare Sandpack files and setup based on Tailwind toggle
  let sandpackFiles: Record<string, string | { code: string }> = {
    ...baseFiles,
  };
  const customSetup: any = {};
  if (useTailwind) {
    // Add Tailwind config and CSS files
    sandpackFiles = {
      // Preserve generated files
      "/App.css": {
        code: `/* Base styles for the application */`,
      },
      ...baseFiles,
      "/tailwind.config.js": {
        code: `module.exports = { content: ['./**/*.{js,jsx,ts,tsx}'], theme: { extend: {} }, plugins: [], };`,
      },
      "/postcss.config.js": {
        code: `module.exports = { plugins: [require('tailwindcss'), require('autoprefixer')], };`,
      },
      "/index.css": {
        code: `@tailwind base;\n@tailwind components;\n@tailwind utilities;`,
      },
    };
    // Inject dependencies for Tailwind
    customSetup.dependencies = {
      tailwindcss: "^3.2.7",
      autoprefixer: "^10.4.0",
      postcss: "^8.4.16",
      "react-scripts": "^5.0.0",
    };
  }
  return (
    <div className="code-preview-container" style={{ width }}>
      <div className="code-editor-preview-container">
        <div className="code-preview-header">
          <h3>React Code & Live Preview</h3>
        </div>
        <Sandpack
          template="react-ts"
          files={sandpackFiles}
          customSetup={useTailwind ? customSetup : undefined}
          options={{
            showLineNumbers: true,
            showTabs: true,
            autorun: true,
          }}
          theme="light"
          className="vertical-sandpack"
        />
      </div>
    </div>
  );
};

export default CodePreview;
