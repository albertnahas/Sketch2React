import React from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import './App.css';

const App: React.FC = () => (
  <div className="app-container">
    <Toolbar />
    <Canvas />
  </div>
);

export default App;