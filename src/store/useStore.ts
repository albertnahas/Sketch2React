import { create } from "zustand";

// Types for shapes
export type ShapeType = "rectangle" | "circle" | "arrow" | "text";

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  rotation: number;
}

export interface RectShape extends BaseShape {
  type: "rectangle";
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface CircleShape extends BaseShape {
  type: "circle";
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface ArrowShape extends BaseShape {
  type: "arrow";
  points: number[]; // [x1, y1, x2, y2] relative to x,y
  stroke: string;
  strokeWidth: number;
}

export interface TextShape extends BaseShape {
  type: "text";
  text: string;
  fontSize: number;
  fill: string;
}

export type Shape = RectShape | CircleShape | ArrowShape | TextShape;

export interface ConversionResult {
  files: Record<string, string>;
  previewHTML: string;
}

type Tool = ShapeType | "select";

interface State {
  shapes: Shape[];
  selectedId: string | null;
  tool: Tool;
  past: { shapes: Shape[]; selectedId: string | null }[];
  future: { shapes: Shape[]; selectedId: string | null }[];
  showCodePreview: boolean;
  isConverting: boolean;
  conversionResult: ConversionResult | null;
  conversionError: string | null;
  setTool: (tool: Tool) => void;
  addShape: (shape: Shape) => void;
  updateShape: (
    id: string,
    attrs: Partial<Omit<Shape, "id" | "type">> &
      Partial<Pick<Shape, "text" | "fontSize" | "fill">>
  ) => void;
  deleteShape: (id: string) => void;
  setSelectedId: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
  exportJSON: () => void;
  importJSON: (shapes: Shape[]) => void;
  convertToReact: () => Promise<void>;
  setShowCodePreview: (show: boolean) => void;
}

const useStore = create<State>((set, get) => ({
  shapes: [],
  selectedId: null,
  tool: "select",
  past: [],
  future: [],
  showCodePreview: false,
  isConverting: false,
  conversionResult: null,
  conversionError: null,

  setTool: (tool) => set({ tool, selectedId: null }),

  addShape: (shape) => {
    const { shapes, selectedId, past } = get();
    set({
      past: [...past, { shapes: shapes.slice(), selectedId }],
      shapes: [...shapes, shape],
      selectedId: shape.id,
      future: [],
    });
  },

  updateShape: (id, attrs) => {
    const { shapes, selectedId, past } = get();
    set({
      past: [...past, { shapes: shapes.slice(), selectedId }],
      shapes: shapes.map((s) => (s.id === id ? { ...s, ...attrs } : s)),
      future: [],
    });
  },

  deleteShape: (id) => {
    const { shapes, selectedId, past } = get();
    set({
      past: [...past, { shapes: shapes.slice(), selectedId }],
      shapes: shapes.filter((s) => s.id !== id),
      selectedId: selectedId === id ? null : selectedId,
      future: [],
    });
  },

  setSelectedId: (id) => set({ selectedId: id }),

  undo: () => {
    const { past, future, shapes, selectedId } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({
      shapes: previous.shapes,
      selectedId: previous.selectedId,
      past: past.slice(0, -1),
      future: [{ shapes: shapes.slice(), selectedId }, ...future],
    });
  },

  redo: () => {
    const { past, future, shapes, selectedId } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      shapes: next.shapes,
      selectedId: next.selectedId,
      past: [...past, { shapes: shapes.slice(), selectedId }],
      future: future.slice(1),
    });
  },

  exportJSON: () => {
    const { shapes } = get();
    const data = JSON.stringify(shapes, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "whiteboard.json";
    a.click();
    URL.revokeObjectURL(url);
  },

  importJSON: (shapes) => {
    set({ shapes, selectedId: null, past: [], future: [] });
  },

  setShowCodePreview: (show) => set({ showCodePreview: show }),

  convertToReact: async () => {
    const { shapes } = get();
    if (shapes.length === 0) return;

    try {
      set({ isConverting: true, conversionError: null });

      // 1) Prepare your sketch JSON
      const sketchJSON = JSON.stringify(shapes);

      // 2) Build the chat messages
      const messages = [
        {
          role: "system",
          content: `
You are a code assistant. 
Convert the following Konva-stage JSON into a fully runnable React+TypeScript app.
Return only valid JSON with this shape:
{
  "files": {
    "App.tsx": "...",
    "shapes.ts": "...",
    ...
  },
  "previewHTML": "<div id='root'>...</div>"
}`.trim(),
        },
        { role: "user", content: sketchJSON },
      ];

      // 3) Call OpenAI Chat Completion
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Make sure you've set VITE_OPENAI_API_KEY in your .env
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages,
            temperature: 0.2,
            max_tokens: 2000,
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI error ${response.status}: ${errText}`);
      }

      const { choices } = await response.json();
      const aiContent = choices[0].message?.content;
      if (!aiContent) throw new Error("No content returned from AI");

      // 4) Parse the AI’s JSON response
      let result: {
        files: Record<string, string>;
        previewHTML: string;
      };
      try {
        result = JSON.parse(aiContent);
      } catch (e) {
        throw new Error("Failed to parse AI response as JSON: " + aiContent);
      }

      // 5) Store & show
      set({
        conversionResult: result,
        isConverting: false,
        showCodePreview: true,
      });
    } catch (error) {
      console.error("Error converting to React:", error);
      set({
        isConverting: false,
        conversionError:
          error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
}));

export default useStore;
