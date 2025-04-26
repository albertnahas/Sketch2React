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

  const { files } = conversionResult;

  return (
    <div className="code-preview-container" style={{ width }}>
      <div className="code-editor-preview-container">
        <div className="code-preview-header">
          <h3>React Code & Live Preview</h3>
        </div>
        <div className="vertical-sandpack">
          <Sandpack
            template="react-ts"
            files={files}
            options={{
              showLineNumbers: true,
              showTabs: true,
              autorun: true,
            }}
            theme="light"
            // customSetup={{
            //   entry: "App.tsx",
            // }}
          />
        </div>
      </div>
    </div>
  );
};

export default CodePreview;
