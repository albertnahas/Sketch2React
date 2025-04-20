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
import useStore, { Shape } from "../store/useStore";
import { nanoid } from "nanoid/non-secure";

const TOOLBAR_WIDTH = 200;

const Canvas = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [newAttrs, setNewAttrs] = useState<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [textareaStyle, setTextareaStyle] = useState<React.CSSProperties>({});

  const shapes = useStore((s) => s.shapes);
  const selectedId = useStore((s) => s.selectedId);
  const tool = useStore((s) => s.tool);
  const addShape = useStore((s) => s.addShape);
  const updateShape = useStore((s) => s.updateShape);
  const deleteShape = useStore((s) => s.deleteShape);
  const setSelectedId = useStore((s) => s.setSelectedId);
  const setTool = useStore((s) => s.setTool);

  // track stage size to make responsive
  const [stageSize, setStageSize] = useState({
    width: window.innerWidth - TOOLBAR_WIDTH,
    height: window.innerHeight,
  });
  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth - TOOLBAR_WIDTH,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // attach transformer to selected node
  useEffect(() => {
    const stage = stageRef.current;
    const transformer = transformerRef.current;
    if (!stage || !transformer) return;
    const layer = stage.findOne("Layer");
    if (selectedId) {
      const selectedNode = layer?.findOne("#" + selectedId);
      if (selectedNode) {
        transformer.nodes([selectedNode]);
        transformer.getLayer()?.batchDraw();
      }
    } else {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedId, shapes]);

  const getRelativePointerPosition = () => {
    const stage = stageRef.current;
    const pos = stage?.getPointerPosition();
    return pos || { x: 0, y: 0 };
  };

  const handleMouseDown = (e: any) => {
    if (tool === "select") return;
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
    <div className="canvas-container">
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
    </div>
  );
};

export default Canvas;
