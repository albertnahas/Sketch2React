import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ZoomIndicatorProps {
  scale: number;
  visible: boolean;
}

const ZoomIndicator: React.FC<ZoomIndicatorProps> = ({ scale, visible }) => {
  const [showScale, setShowScale] = useState(false);
  
  // Show scale indicator briefly when scale changes
  useEffect(() => {
    if (scale !== 1) {
      setShowScale(true);
      const timer = setTimeout(() => {
        setShowScale(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [scale]);
  
  return (
    <AnimatePresence>
      {(visible || showScale) && (
        <motion.div
          className={`canvas-zoom-indicator ${showScale ? 'show' : 'hide'}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          {Math.round(scale * 100)}%
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ZoomIndicator;
