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

// CSS for cursor styles
const cursorStyles = {
  select: "default",
  selectHover: "pointer",
  selectGrab: "grab",
  selectGrabbing: "grabbing",
  selectClone: "copy", // Special cursor for Alt+drag cloning
  rectangle: "crosshair",
  circle: "crosshair",
  arrow: "crosshair",
  text: "crosshair",
};

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
  const [marqueeAttrs, setMarqueeAttrs] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  // Dynamic cursor state
  const [cursorType, setCursorType] = useState<string>("select");
  const [hoveredShapeId, setHoveredShapeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [clonedShapeId, setClonedShapeId] = useState<string | null>(null);

  const shapes = useStore((s) => s.shapes);
  const selectedId = useStore((s) => s.selectedId);
  const tool = useStore((s) => s.tool);
  const addShape = useStore((s) => s.addShape);
  const updateShape = useStore((s) => s.updateShape);
  const deleteShape = useStore((s) => s.deleteShape);
  const setSelectedId = useStore((s) => s.setSelectedId);
  const setTool = useStore((s) => s.setTool);
  const showCodePreview = useStore((s) => s.showCodePreview);
  const bringToFront = useStore((s) => s.bringToFront);

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

  // Effect for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete/Backspace for selected shapes
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        deleteShape(selectedId);
      }

      // Tool selection shortcuts
      if (e.key === "v") setTool("select");
      if (e.key === "r") setTool("rectangle");
      if (e.key === "c") setTool("circle");
      if (e.key === "a") setTool("arrow");
      if (e.key === "t") setTool("text");

      // Track Alt/Option key for cloning
      if (e.key === "Alt" || e.altKey) {
        setIsAltPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // When Alt/Option key is released
      if (e.key === "Alt") {
        setIsAltPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedId, deleteShape, setTool]);

  // Update cursor based on tool and context
  useEffect(() => {
    let cursor = cursorStyles.select;

    if (tool !== "select") {
      // Drawing tools use crosshair
      cursor = cursorStyles[tool];
    } else {
      // Select tool has different states
      if (isDragging) {
        // Show clone cursor when Alt is pressed while dragging
        cursor = isAltPressed
          ? cursorStyles.selectClone
          : cursorStyles.selectGrabbing;
      } else if (hoveredShapeId) {
        if (hoveredShapeId === selectedId) {
          // Show clone cursor when Alt is pressed over a selected shape
          cursor = isAltPressed
            ? cursorStyles.selectClone
            : cursorStyles.selectGrab;
        } else {
          cursor = cursorStyles.selectHover;
        }
      }
    }

    setCursorType(cursor);
  }, [tool, hoveredShapeId, selectedId, isDragging, isAltPressed]);

  // Helper function to clone a shape with new position
  const cloneShape = (shapeId: string, newX: number, newY: number) => {
    const originalShape = shapes.find((s) => s.id === shapeId);
    if (!originalShape) return null;

    // Create a new ID for the clone
    const id = nanoid();

    // Deep copy the shape and update its position
    const clonedShape = {
      ...JSON.parse(JSON.stringify(originalShape)),
      id,
      x: newX,
      y: newY,
    };

    // Add the cloned shape to the canvas
    addShape(clonedShape);
    return id;
  };

  // Find the topmost shape at a point for proper hit testing
  const getTopmostShapeAt = (pos: { x: number; y: number }): string | null => {
    const stage = stageRef.current;
    if (!stage) return null;

    // Get all shapes at this point
    const shapesAtPoint = stage.getAllIntersections(pos);

    if (shapesAtPoint.length === 0) return null;

    // Find the shape with highest z-index
    let topShapeId: string | null = null;
    let highestZIndex = -1;

    for (const shape of shapesAtPoint) {
      const id = shape.id();
      if (!id) continue;

      // Find the corresponding shape in our store
      const storeShape = shapes.find((s) => s.id === id);
      if (storeShape && storeShape.zIndex > highestZIndex) {
        highestZIndex = storeShape.zIndex;
        topShapeId = storeShape.id;
      }
    }

    return topShapeId;
  };

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
        .map((id) => layer?.findOne("#" + id))
        .filter((n): n is Konva.Node => !!n);
    } else if (selectedId) {
      const node = layer?.findOne("#" + selectedId);
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
    // Get native event to check modifiers
    const nativeEvent = e.evt;
    const isAltKey = nativeEvent.altKey;

    // Track dragging state for cursor changes
    if (e.target !== e.target.getStage()) {
      setIsDragging(true);

      // If Alt/Option key is pressed while clicking on a shape, prepare for cloning
      if (isAltKey && tool === "select") {
        const shapeId = e.target.id();
        if (shapeId) {
          setClonedShapeId(shapeId);

          // Prevent default behavior to avoid stage dragging
          nativeEvent.preventDefault();
        }
      }
    }

    if (tool === "select") {
      // If clicked on a shape, bring it to front
      if (e.target !== e.target.getStage()) {
        const shapeId = e.target.id();
        if (shapeId) {
          bringToFront(shapeId);
        }
      }

      // Start marquee selection on empty canvas
      if (e.target === e.target.getStage()) {
        const pos = getRelativePointerPosition();
        setMarqueeAttrs({ x: pos.x, y: pos.y, width: 0, height: 0 });
        // Clear any existing selection
        setSelectedIds([]);
        setSelectedId(null);
      }
      return;
    }

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
        zIndex: 0, // Will be automatically set to highest+1 by addShape
      });
      // Immediately switch to select for further operations
      setTool("select");
    }
  };

  const handleMouseMove = (e: any) => {
    const pos = getRelativePointerPosition();
    const nativeEvent = e.evt;
    const isAltKey = nativeEvent.altKey || isAltPressed;

    // Handle Alt+Drag clone operation
    if (clonedShapeId && isDragging && isAltKey) {
      const originalShape = shapes.find((s) => s.id === clonedShapeId);

      if (originalShape && !marqueeAttrs) {
        // Calculate the distance moved
        const deltaX = pos.x - originalShape.x;
        const deltaY = pos.y - originalShape.y;

        // If mouse has moved enough to create a clone (prevent accidental clones)
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          // Create the clone at the current mouse position
          const newShapeId = cloneShape(clonedShapeId, pos.x, pos.y);

          if (newShapeId) {
            // Update selection to the new shape
            setSelectedId(newShapeId);

            // Reset cloned shape ID to prevent multiple clones in one drag
            setClonedShapeId(null);
          }
        }
      }
    }

    // Handle hover state for cursor changes in select mode
    if (tool === "select" && !isDrawing && !isDragging) {
      const hoverShapeId = getTopmostShapeAt(pos);
      setHoveredShapeId(hoverShapeId);
    }

    // Update marquee rectangle while dragging in select mode
    if (marqueeAttrs) {
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
    // Reset dragging and cloning states
    setIsDragging(false);
    setClonedShapeId(null);

    // Finalize marquee selection (lasso)
    if (marqueeAttrs) {
      const stage = stageRef.current;
      if (stage) {
        // Find all shapes that intersect with the marquee
        const layer = stage.findOne("Layer");
        const rectA = marqueeAttrs;
        const ids: string[] = [];

        // Sort shapes by z-index to ensure proper selection order (top-most first)
        const sortedShapes = [...shapes].sort((a, b) => b.zIndex - a.zIndex);

        for (const shape of sortedShapes) {
          const node = layer?.findOne("#" + shape.id) as Konva.Shape;
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
        }

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
        zIndex: 0, // will be set properly in addShape
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
        zIndex: 0, // will be set properly in addShape
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
        zIndex: 0, // will be set properly in addShape
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
    <motion.div className="canvas-container" layout>
      <motion.div
        className="canvas-content"
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        <motion.div
          className="whiteboard-container"
          initial={{ height: "100%" }}
          animate={{ height: showCodePreview ? "60%" : "100%" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{ width: "100%" }}
        >
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            ref={stageRef}
            style={{ cursor: cursorType }}
          >
            <Layer>
              {/* Sort shapes by z-index for proper layering - lower z-index renders first */}
              {[...shapes]
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((shape) => {
                  const isSelected =
                    shape.id === selectedId || selectedIds.includes(shape.id);

                  const commonProps = {
                    key: shape.id,
                    id: shape.id,
                    x: shape.x,
                    y: shape.y,
                    rotation: shape.rotation,
                    draggable: tool === "select",
                    onClick: (e: any) => {
                      // Check if Alt key is pressed during click for instant clone
                      if (e.evt.altKey && tool === "select") {
                        const pos = getRelativePointerPosition();
                        // Clone the shape slightly offset from original
                        const newShapeId = cloneShape(
                          shape.id,
                          pos.x + 10,
                          pos.y + 10
                        );
                        if (newShapeId) {
                          setSelectedId(newShapeId);
                        }
                      } else {
                        setSelectedId(shape.id);
                      }
                    },
                    onTap: () => setSelectedId(shape.id),
                    onMouseDown: (e: any) => {
                      if (e.evt.altKey && tool === "select") {
                        // Prepare for drag-clone operation
                        setClonedShapeId(shape.id);
                      }
                    },
                    onDragStart: () => {
                      setIsDragging(true);
                      if (isAltPressed) {
                        setClonedShapeId(shape.id);
                      }
                    },
                    onDragEnd: (e: any) => {
                      setIsDragging(false);
                      updateShape(shape.id, {
                        x: e.target.x(),
                        y: e.target.y(),
                      });
                    },
                    onMouseEnter: () => setHoveredShapeId(shape.id),
                    onMouseLeave: () => setHoveredShapeId(null),
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
              animate={{ height: "40%", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              style={{ width: "100%", borderTop: "1px solid #ddd" }}
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
