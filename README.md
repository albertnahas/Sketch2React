# React Konva Whiteboard

This is a simple sketch‑UI whiteboard application built with React, TypeScript, Vite, and React-Konva.

## Features
- Toolbox sidebar with tools: select, rectangle, circle, arrow, text
- Click‑and‑drag to draw shapes
- Select and transform (move/resize/rotate) shapes
- Double‑click text to edit inline
- Delete selected shape with Delete/Backspace key
- Undo/Redo support
- Export canvas state to JSON and import from JSON
- Responsive layout (sidebar + fullscreen canvas)

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
  store/
    useStore.ts      # Zustand global state with undo/redo
    useStore.test.ts # Unit tests for store logic
  App.tsx           # Main layout
  main.tsx          # Entry point
  index.html
```

## Notes
- Non-obvious parts, such as Konva refs and transformer handling, are commented in code.
- The project uses Zustand for state management and a simple history stack for undo/redo.