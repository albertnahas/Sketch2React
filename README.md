# Sketch2React

A powerful whiteboard application built with React, TypeScript, Vite, and React-Konva that converts your sketches into functional React code.

# Live Demo

https://sketch2react.netlify.app

## Features

- Toolbox sidebar with drawing tools: select, rectangle, circle, arrow, text
- Click‑and‑drag to draw shapes
- Select and transform (move/resize/rotate) shapes
- Multi-selection with marquee/lasso tool
- Double‑click text to edit inline
- Delete selected shape with Delete/Backspace key
- Undo/Redo support
- Export canvas state to JSON and import from JSON
- **Convert to React**: Transform your sketches into React components
- Split-screen layout with code editor and live preview
- Vertical layout with sketch editor on top and code preview at bottom
- Sandpack code editor for syntax highlighting and live preview

## Getting Started

### Prerequisites

- Node.js >= 14
- npm

### Install Dependencies

```bash
npm install
```

### Run in Development Mode

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run serve
```

### Run Tests

```bash
npm test
```

## Project Structure

```
src/
  components/
    Toolbar.tsx      # Sidebar toolbox UI
    Canvas.tsx       # Konva canvas and drawing logic
    CodePreview.tsx  # Code editor and preview component
  store/
    useStore.ts      # Zustand global state with undo/redo and React conversion
    useStore.test.ts # Unit tests for store logic
  App.tsx           # Main layout
  main.tsx          # Entry point
  index.html
```

## How It Works

### Converting Sketches to React

1. Draw your UI design using the available shape tools
2. Click the "Convert to React" button in the toolbar
3. Your sketch is serialized to JSON and sent to the GPT4o-mini API
4. The API returns React component code and preview HTML
5. The code is displayed in a Monaco editor in the split-screen view
6. A live preview of the generated React app is shown in an iframe

### API Configuration

The "Convert to React" feature uses OpenAI's GPT4o-mini model to generate React code from your sketch:

1. For full functionality, set your OpenAI API key in an environment variable:
```
# Create a .env file in the project root
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

2. If no API key is provided, the application will use a built-in mock generator that creates basic React components from your shapes for demonstration purposes.

### Technical Notes

- Uses Framer Motion for smooth animations between sketch and code views
- Sandpack for interactive code editor and live preview
- Vertical split layout with whiteboard on top and code preview at the bottom
- The project uses Zustand for state management with actions for UI operations and API integration
- Konva for canvas operations, with refs and transformers for shape manipulation
- Split-screen layout dynamically resizes the sketch area and code preview
- API integration with error handling and loading states
