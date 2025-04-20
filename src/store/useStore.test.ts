import useStore from './useStore';

describe('useStore shape operations and history', () => {
  beforeEach(() => {
    // reset store state
    useStore.setState({
      shapes: [],
      selectedId: null,
      past: [],
      future: [],
    });
  });

  it('adds a shape and selects it', () => {
    const id = 'test1';
    useStore.getState().addShape({ id, type: 'rectangle', x: 0, y: 0, width: 10, height: 10, rotation: 0, fill: '', stroke: '', strokeWidth: 1 });
    const state = useStore.getState();
    expect(state.shapes.length).toBe(1);
    expect(state.shapes[0].id).toBe(id);
    expect(state.selectedId).toBe(id);
  });

  it('updates a shape attributes', () => {
    const id = 'test2';
    useStore.getState().addShape({ id, type: 'circle', x: 1, y: 2, radius: 5, rotation: 0, fill: '', stroke: '', strokeWidth: 1 });
    useStore.getState().updateShape(id, { x: 3, y: 4 });
    const shape = useStore.getState().shapes.find((s) => s.id === id);
    expect(shape).toBeDefined();
    expect(shape!.x).toBe(3);
    expect(shape!.y).toBe(4);
  });

  it('deletes a shape', () => {
    const id = 'test3';
    useStore.getState().addShape({ id, type: 'text', x: 0, y: 0, rotation: 0, text: 'hi', fontSize: 12, fill: '' });
    expect(useStore.getState().shapes.length).toBe(1);
    useStore.getState().deleteShape(id);
    expect(useStore.getState().shapes.length).toBe(0);
  });

  it('handles undo and redo', () => {
    const id1 = 'a';
    const id2 = 'b';
    useStore.getState().addShape({ id: id1, type: 'rectangle', x: 0, y: 0, width: 1, height: 1, rotation: 0, fill: '', stroke: '', strokeWidth: 1 });
    useStore.getState().addShape({ id: id2, type: 'circle', x: 0, y: 0, radius: 1, rotation: 0, fill: '', stroke: '', strokeWidth: 1 });
    expect(useStore.getState().shapes.map((s) => s.id)).toEqual([id1, id2]);
    useStore.getState().undo();
    expect(useStore.getState().shapes.map((s) => s.id)).toEqual([id1]);
    useStore.getState().redo();
    expect(useStore.getState().shapes.map((s) => s.id)).toEqual([id1, id2]);
  });
});