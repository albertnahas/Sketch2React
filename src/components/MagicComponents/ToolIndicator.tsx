import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ToolIndicatorProps {
  tool: string;
  x: number;
  y: number;
  visible: boolean;
}

const ToolIndicator: React.FC<ToolIndicatorProps> = ({ 
  tool, 
  x, 
  y, 
  visible 
}) => {
  // Tool-specific icons
  const getToolIcon = () => {
    switch (tool) {
      case "select":
        return "👆";
      case "rectangle":
        return "▢";
      case "circle":
        return "○";
      case "arrow":
        return "→";
      case "text":
        return "T";
      default:
        return "";
    }
  };
  
  // Format tool name
  const getToolName = () => {
    return tool.charAt(0).toUpperCase() + tool.slice(1);
  };
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`tool-indicator ${visible ? 'show' : 'hide'}`}
          style={{
            left: x,
            top: y - 30, // Position above the cursor
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          {getToolIcon()} {getToolName()}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ToolIndicator;
