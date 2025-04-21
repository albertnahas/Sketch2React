import { create } from "zustand";
import { generateMockResponse } from "../utils/mockResponse";

// Types for shapes
export type ShapeType = "rectangle" | "circle" | "arrow" | "text";

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
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
  bringToFront: (id: string) => void;
  // whether to use Tailwind CSS in generated code
  useTailwind: boolean;
  setUseTailwind: (use: boolean) => void;
  getMaxZIndex: () => number;
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
  // whether to use Tailwind CSS in generated React code
  useTailwind: true,
  setUseTailwind: (use) => set({ useTailwind: use }),

  setTool: (tool) => set({ tool, selectedId: null }),

  addShape: (shape) => {
    const { shapes, selectedId, past } = get();
    set({
      past: [...past, { shapes: shapes.slice(), selectedId }],
      shapes: [...shapes, { ...shape, zIndex: get().getMaxZIndex() + 1 }],
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

      let result;

      // Check if an API key is available
      const apiKey = import.meta.env?.VITE_OPENAI_API_KEY;

      if (apiKey) {
        // Use the real OpenAI API
        const sketchJSON = JSON.stringify(shapes);
        // Prepare system prompt, including Tailwind CSS instructions if enabled
        const useTailwind = get().useTailwind;
        let systemContent = `
You are a UI code assistant. Given a Konva-stage JSON of shapes and text, infer a meaningful user interface layout:

• Rectangles become containers or buttons.  
• Circles become avatars or icons.  
• Lines become dividers or progress bars.  
• Text elements become labels, headings, or input placeholders.  

Generate a React 18+TypeScript app that:
Matches the closest real life use case of the sketch.
Matches the provided layout as much as possible.

1. Uses semantic HTML elements (<button>, <img>, <input>, <header>, <section>, etc.).  
2. Assigns valid placeholder images where circles occur. From https://picsum.photos or https://avatar.iran.liara.run/public/ 
3. Lays out components to match the spatial arrangement of the shapes pixel perfect.`.trim();
        if (useTailwind) {
          systemContent += `

Additionally, incorporate Tailwind CSS utility classes for styling, include a Tailwind configuration file (tailwind.config.js), and import the generated Tailwind CSS in your project's entry point.`;
        }
        systemContent += `

Return EXACTLY this JSON schema (no extra keys, no commentary):
\`\`\`json
{
  "files": {
    "<filename>.tsx": "<string: file contents>",
    // …
  },
  "previewHTML": "<string: HTML to mount React app>"
}
\`\`\``;
        const messages = [
          { role: "system", content: systemContent.trim() },
          { role: "user", content: sketchJSON },
        ];

        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages,
              temperature: 0.3,
              max_tokens: 2500,
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "ConvertSketchResponse",
                  schema: {
                    type: "object",
                    properties: {
                      files: {
                        type: "object",
                        additionalProperties: { type: "string" },
                      },
                      previewHTML: { type: "string" },
                    },
                    required: ["files", "previewHTML"],
                    additionalProperties: false,
                  },
                },
              },
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(
            `Error: ${response.status} ${response.statusText} - ${errText}`
          );
        }

        const { choices } = await response.json();
        // content is guaranteed valid JSON matching the schema
        result = JSON.parse(choices[0].message.content);
      } else {
        // Use the mock response generator if no API key is available
        console.log(
          "No API key found, using mock response generator for demonstration"
        );
        result = await generateMockResponse(shapes);
      }

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
  bringToFront: (id) => {
    const { shapes } = get();
    const targetShape = shapes.find((shape) => shape.id === id);
    if (!targetShape) return;

    const maxZIndex = Math.max(...shapes.map((shape) => shape.zIndex));
    if (targetShape.zIndex === maxZIndex) return;

    set({
      shapes: shapes.map((shape) =>
        shape.id === id ? { ...shape, zIndex: maxZIndex + 1 } : shape
      ),
    });
  },
  getMaxZIndex: () => {
    const { shapes } = get();
    return shapes.length > 0
      ? Math.max(...shapes.map((shape) => shape.zIndex))
      : 0;
  },
}));

export default useStore;
