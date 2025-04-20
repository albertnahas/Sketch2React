import React from "react";
import Editor from "@monaco-editor/react";
import useStore, { ConversionResult } from "../store/useStore";

interface CodePreviewProps {
  width: string;
}

const CodePreview: React.FC<CodePreviewProps> = ({ width }) => {
  const conversionResult = useStore((state) => state.conversionResult);
  const isConverting = useStore((state) => state.isConverting);
  const conversionError = useStore((state) => state.conversionError);
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);

  React.useEffect(() => {
    // When we get new results, default to the first file
    if (conversionResult && conversionResult.files) {
      const fileNames = Object.keys(conversionResult.files);
      if (fileNames.length > 0) {
        setSelectedFile(fileNames[0]);
      }
    }
  }, [conversionResult]);

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

  const { files, previewHTML } = conversionResult;
  const fileNames = Object.keys(files);

  return (
    <div className="code-preview-container" style={{ width }}>
      <div className="code-preview-tabs">
        {fileNames.map((fileName) => (
          <button
            key={fileName}
            className={selectedFile === fileName ? "active" : ""}
            onClick={() => setSelectedFile(fileName)}
          >
            {fileName}
          </button>
        ))}
      </div>
      <div className="code-preview-editor">
        {selectedFile && (
          <Editor
            defaultLanguage="typescript"
            value={files[selectedFile]}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
            }}
          />
        )}
      </div>
      {/* <div className="code-preview-live">
        <h3>Live Preview</h3>
        <div
          className="preview-container"
          dangerouslySetInnerHTML={{ __html: previewHTML }}
        />
      </div> */}
    </div>
  );
};

export default CodePreview;
