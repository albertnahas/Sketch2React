import React from "react";
import useStore from "../store/useStore";
import { Sandpack } from "@codesandbox/sandpack-react";
import CodeContainer from "./MagicComponents/CodeContainer";
import CodePreviewLoader from "./MagicComponents/CodePreviewLoader";
import EmptyState from "./MagicComponents/EmptyState";
import ErrorState from "./MagicComponents/ErrorState";
import "./CodePreview.css";
import "./MagicComponents/animations.css";

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
        <div className="h-full flex items-center justify-center">
          <CodePreviewLoader />
        </div>
      </div>
    );
  }

  if (conversionError) {
    return (
      <div className="code-preview-container" style={{ width }}>
        <ErrorState 
          title="Conversion Error"
          error={conversionError} 
          suggestion="Try simplifying your sketch or try again."
        />
      </div>
    );
  }

  if (!conversionResult) {
    return (
      <div className="code-preview-container" style={{ width }}>
        <EmptyState
          title="No Code Generated Yet"
          description="Click 'Convert to React' to transform your sketch into React code."
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
              />
            </svg>
          }
        />
      </div>
    );
  }

  const { files } = conversionResult;

  return (
    <div className="code-preview-container" style={{ width }}>
      <CodeContainer title="React Code & Live Preview" glowColor="rgb(99 102 241)">
        <div className="vertical-sandpack">
          <Sandpack
            template="react-ts"
            files={files}
            options={{
              showLineNumbers: true,
              showTabs: true,
              autorun: true,
            }}
            theme="dark"
            // customSetup={{
            //   entry: "App.tsx",
            // }}
          />
        </div>
      </CodeContainer>
    </div>
  );
};

export default CodePreview;
