import React, { useRef, useState, useEffect } from "react";
import Konva from "konva";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Arrow,
  Text,
  Transformer,
} from "react-konva";
import { motion, AnimatePresence } from "framer-motion";
import useStore, { Shape } from "../store/useStore";
import { nanoid } from "nanoid/non-secure";
import CodePreview from "./CodePreview";

const TOOLBAR_WIDTH = 200;

const Canvas = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [newAttrs, setNewAttrs] = useState<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [textareaStyle, setTextareaStyle] = useState<React.CSSProperties>({});
  // local multi-selection and marquee (lasso) state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [marqueeAttrs, setMarqueeAttrs] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const shapes = useStore((s) => s.shapes);
  const selectedId = useStore((s) => s.selectedId);
  const tool = useStore((s) => s.tool);
  const addShape = useStore((s) => s.addShape);
  const updateShape = useStore((s) => s.updateShape);
  const deleteShape = useStore((s) => s.deleteShape);
  const setSelectedId = useStore((s) => s.setSelectedId);
  const setTool = useStore((s) => s.setTool);
  const showCodePreview = useStore((s) => s.showCodePreview);

  // track stage size to make responsive
  const [stageSize, setStageSize] = useState({
    width: window.innerWidth - TOOLBAR_WIDTH,
    height: window.innerHeight,
  });
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth - TOOLBAR_WIDTH;
      let height = window.innerHeight;
      
      if (showCodePreview) {
        // When in preview mode, reduce the height to 60% of the container
        height = height * 0.6;
      }
      
      setStageSize({
        width,
        height,
      });
    };
    
    handleResize(); // Call once to set initial size
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [showCodePreview]);

  // delete selected shape on Delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        deleteShape(selectedId);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, deleteShape]);

  // attach transformer to selected node(s) or hide during marquee
  useEffect(() => {
    const stage = stageRef.current;
    const transformer = transformerRef.current;
    if (!stage || !transformer) return;
    const layer = stage.findOne("Layer");
    let nodes: Konva.Node[] = [];
    // hide transformer while drawing marquee
    if (marqueeAttrs) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }
    // multi-selection
    if (selectedIds.length > 0) {
      nodes = selectedIds
        .map((id) => layer?.findOne('#' + id))
        .filter((n): n is Konva.Node => !!n);
    } else if (selectedId) {
      const node = layer?.findOne('#' + selectedId);
      if (node) nodes = [node];
    }
    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedId, selectedIds, marqueeAttrs, shapes]);

  const getRelativePointerPosition = () => {
    const stage = stageRef.current;
    const pos = stage?.getPointerPosition();
    return pos || { x: 0, y: 0 };
  };

  const handleMouseDown = (e: any) => {
    if (tool === "select") {
      // start marquee selection on empty canvas
      if (e.target === e.target.getStage()) {
        const pos = getRelativePointerPosition();
        setMarqueeAttrs({ x: pos.x, y: pos.y, width: 0, height: 0 });
        // clear any existing selection
        setSelectedIds([]);
        setSelectedId(null);
      }
      return;
    }
    // only start drawing on empty area
    if (e.target !== e.target.getStage()) return;
    const pos = getRelativePointerPosition();
    setIsDrawing(true);
    if (tool === "rectangle") {
      setNewAttrs({ x: pos.x, y: pos.y, width: 0, height: 0 });
    } else if (tool === "circle") {
      setNewAttrs({ x: pos.x, y: pos.y, radius: 0 });
    } else if (tool === "arrow") {
      setNewAttrs({ x: pos.x, y: pos.y, points: [0, 0, 0, 0] });
    } else if (tool === "text") {
      const id = nanoid();
      addShape({
        id,
        type: "text",
        x: pos.x,
        y: pos.y,
        rotation: 0,
        text: "Text",
        fontSize: 20,
        fill: "#000",
      });
      // immediately switch to select for further operations
      setTool("select");
    }
  };

  const handleMouseMove = (e: any) => {
    // update marquee rectangle while dragging in select mode
    if (marqueeAttrs) {
      const pos = getRelativePointerPosition();
      const startX = marqueeAttrs.x;
      const startY = marqueeAttrs.y;
      let newX = startX;
      let newY = startY;
      let newW = pos.x - startX;
      let newH = pos.y - startY;
      if (newW < 0) {
        newX = startX + newW;
        newW = Math.abs(newW);
      }
      if (newH < 0) {
        newY = startY + newH;
        newH = Math.abs(newH);
      }
      setMarqueeAttrs({ x: newX, y: newY, width: newW, height: newH });
      return;
    }
    if (!isDrawing || !newAttrs) return;
    const pos = getRelativePointerPosition();
    if (tool === "rectangle") {
      setNewAttrs((prev: any) => ({
        ...prev,
        width: pos.x - prev.x,
        height: pos.y - prev.y,
      }));
    } else if (tool === "circle") {
      const dx = pos.x - newAttrs.x;
      const dy = pos.y - newAttrs.y;
      setNewAttrs((prev: any) => ({
        ...prev,
        radius: Math.sqrt(dx * dx + dy * dy),
      }));
    } else if (tool === "arrow") {
      setNewAttrs((prev: any) => ({
        ...prev,
        points: [0, 0, pos.x - prev.x, pos.y - prev.y],
      }));
    }
  };

  const handleMouseUp = () => {
    // finalize marquee selection (lasso)
    if (marqueeAttrs) {
      const stage = stageRef.current;
      if (stage) {
        const layer = stage.findOne("Layer");
        const rectA = marqueeAttrs;
        const ids: string[] = [];
        shapes.forEach((shape) => {
          const node = layer?.findOne('#' + shape.id) as Konva.Shape;
          if (node) {
            const clientRect = node.getClientRect();
            if (
              clientRect.x < rectA.x + rectA.width &&
              clientRect.x + clientRect.width > rectA.x &&
              clientRect.y < rectA.y + rectA.height &&
              clientRect.y + clientRect.height > rectA.y
            ) {
              ids.push(shape.id);
            }
          }
        });
        setSelectedIds(ids);
        if (ids.length === 1) {
          setSelectedId(ids[0]);
        } else {
          setSelectedId(null);
        }
      }
      setMarqueeAttrs(null);
      return;
    }
    if (!isDrawing || !newAttrs) return;
    const id = nanoid();
    if (tool === "rectangle") {
      let { x, y, width, height } = newAttrs;
      if (width < 0) {
        x += width;
        width = Math.abs(width);
      }
      if (height < 0) {
        y += height;
        height = Math.abs(height);
      }
      addShape({
        id,
        type: "rectangle",
        x,
        y,
        width,
        height,
        rotation: 0,
        fill: "transparent",
        stroke: "#000",
        strokeWidth: 2,
      });
    } else if (tool === "circle") {
      addShape({
        id,
        type: "circle",
        x: newAttrs.x,
        y: newAttrs.y,
        radius: newAttrs.radius,
        rotation: 0,
        fill: "transparent",
        stroke: "#000",
        strokeWidth: 2,
      });
    } else if (tool === "arrow") {
      addShape({
        id,
        type: "arrow",
        x: newAttrs.x,
        y: newAttrs.y,
        points: newAttrs.points,
        rotation: 0,
        stroke: "#000",
        strokeWidth: 2,
      });
    }
    setIsDrawing(false);
    setNewAttrs(null);
  };

  // double-click to edit text
  const handleTextDblClick = (e: any, shape: Shape) => {
    const textNode = e.target;
    const absPos = textNode.getAbsolutePosition();
    const stageBox = stageRef.current?.container().getBoundingClientRect();
    if (!stageBox) return;
    setEditingId(shape.id);
    setEditingText(shape.text);
    // position textarea over text node
    setTextareaStyle({
      position: "absolute",
      top: stageBox.top + absPos.y + "px",
      left: stageBox.left + absPos.x + "px",
      fontSize: shape.fontSize + "px",
      padding: "0px",
      margin: "0px",
      border: "1px solid #666",
      background: "none",
      outline: "none",
      resize: "none",
    });
  };

  const finishEditing = () => {
    if (editingId !== null) {
      updateShape(editingId, { text: editingText });
    }
    setEditingId(null);
    setEditingText("");
  };

  return (
    <motion.div 
      className="canvas-container"
      layout
    >
      <motion.div
        className="canvas-content"
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          width: '100%', 
          height: '100%' 
        }}
      >
        <motion.div
          className="whiteboard-container"
          initial={{ height: '100%' }}
          animate={{ height: showCodePreview ? '60%' : '100%' }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{ width: '100%' }}
        >
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            ref={stageRef}
          >
            <Layer>
              {shapes.map((shape) => {
                const commonProps = {
                  key: shape.id,
                  id: shape.id,
                  x: shape.x,
                  y: shape.y,
                  rotation: shape.rotation,
                  draggable: tool === "select",
                  onClick: () => setSelectedId(shape.id),
                  onTap: () => setSelectedId(shape.id),
                  onDragEnd: (e: any) => {
                    updateShape(shape.id, { x: e.target.x(), y: e.target.y() });
                  },
                };
                if (shape.type === "rectangle") {
                  return (
                    <Rect
                      {...commonProps}
                      width={(shape as any).width}
                      height={(shape as any).height}
                      fill={(shape as any).fill}
                      stroke={(shape as any).stroke}
                      strokeWidth={(shape as any).strokeWidth}
                      onTransformEnd={(e) => {
                        const node = e.target;
                        const scaleX = node.scaleX();
                        const scaleY = node.scaleY();
                        const newWidth = (node.width() as number) * scaleX;
                        const newHeight = (node.height() as number) * scaleY;
                        node.scaleX(1);
                        node.scaleY(1);
                        updateShape(shape.id, {
                          x: node.x(),
                          y: node.y(),
                          rotation: node.rotation(),
                          width: newWidth,
                          height: newHeight,
                        });
                      }}
                    />
                  );
                } else if (shape.type === "circle") {
                  return (
                    <Circle
                      {...commonProps}
                      radius={(shape as any).radius}
                      fill={(shape as any).fill}
                      stroke={(shape as any).stroke}
                      strokeWidth={(shape as any).strokeWidth}
                      onTransformEnd={(e) => {
                        const node = e.target;
                        const scale = node.scaleX();
                        const newRadius = (node.radius() as number) * scale;
                        node.scaleX(1);
                        node.scaleY(1);
                        updateShape(shape.id, {
                          x: node.x(),
                          y: node.y(),
                          rotation: node.rotation(),
                          radius: newRadius,
                        });
                      }}
                    />
                  );
                } else if (shape.type === "arrow") {
                  return (
                    <Arrow
                      {...commonProps}
                      points={(shape as any).points}
                      stroke={(shape as any).stroke}
                      strokeWidth={(shape as any).strokeWidth}
                      onTransformEnd={(e) => {
                        const node = e.target;
                        const points = node.points() as number[];
                        node.scaleX(1);
                        node.scaleY(1);
                        updateShape(shape.id, {
                          x: node.x(),
                          y: node.y(),
                          rotation: node.rotation(),
                          points,
                        });
                      }}
                    />
                  );
                } else if (shape.type === "text") {
                  return (
                    <Text
                      {...commonProps}
                      text={(shape as any).text}
                      fontSize={(shape as any).fontSize}
                      fill={(shape as any).fill}
                      onDblClick={(e) => handleTextDblClick(e, shape)}
                    />
                  );
                }
                return null;
              })}
              {/* marquee (lasso) drawing */}
              {marqueeAttrs && (
                <Rect
                  x={marqueeAttrs.x}
                  y={marqueeAttrs.y}
                  width={marqueeAttrs.width}
                  height={marqueeAttrs.height}
                  fill="rgba(0,0,255,0.1)"
                  stroke="blue"
                  strokeWidth={1}
                  dash={[4, 4]}
                  listening={false}
                />
              )}
              {/* ghost preview for new shapes */}
              {isDrawing && newAttrs && tool === "rectangle" && (
                <Rect
                  x={newAttrs.x}
                  y={newAttrs.y}
                  width={newAttrs.width}
                  height={newAttrs.height}
                  fill="rgba(0,0,0,0.1)"
                  stroke="#000"
                  strokeWidth={1}
                  dash={[4, 4]}
                  listening={false}
                />
              )}
              {isDrawing && newAttrs && tool === "circle" && (
                <Circle
                  x={newAttrs.x}
                  y={newAttrs.y}
                  radius={newAttrs.radius}
                  fill="rgba(0,0,0,0.1)"
                  stroke="#000"
                  strokeWidth={1}
                  dash={[4, 4]}
                  listening={false}
                />
              )}
              {isDrawing && newAttrs && tool === "arrow" && (
                <Arrow
                  x={newAttrs.x}
                  y={newAttrs.y}
                  points={newAttrs.points}
                  stroke="#000"
                  strokeWidth={1}
                  dash={[4, 4]}
                  listening={false}
                />
              )}
              <Transformer ref={transformerRef} />
            </Layer>
          </Stage>
          {editingId && (
            <textarea
              style={textareaStyle}
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              onBlur={finishEditing}
              onKeyDown={(e) => e.key === "Enter" && finishEditing()}
              autoFocus
            />
          )}
        </motion.div>
        
        <AnimatePresence>
          {showCodePreview && (
            <motion.div
              className="code-preview-wrapper"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: '40%', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              style={{ width: '100%', borderTop: '1px solid #ddd' }}
            >
              <CodePreview width="100%" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default Canvas;
