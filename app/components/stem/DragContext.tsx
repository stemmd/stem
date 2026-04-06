import { createContext, useContext, useState, useCallback, useRef, useMemo } from "react";
import { useFetcher } from "@remix-run/react";

interface DragState {
  dragItem: { id: string; type: "node" | "artifact" } | null;
  dragOverIndex: number | null;
  isDragging: boolean;
}

interface DragContextValue extends DragState {
  onDragStart: (item: { id: string; type: "node" | "artifact" }) => (e: React.DragEvent) => void;
  onDragOver: (index: number) => (e: React.DragEvent) => void;
  onDrop: (dropIndex: number) => (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

const Context = createContext<DragContextValue | null>(null);

export function useDragContext() {
  return useContext(Context);
}

export function DragProvider({
  stemId,
  items,
  isOwner,
  children,
}: {
  stemId: string;
  items: { id: string; type: "node" | "artifact" }[];
  isOwner: boolean;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<DragState>({
    dragItem: null,
    dragOverIndex: null,
    isDragging: false,
  });

  const reorderFetcher = useFetcher();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use refs to avoid stale closures in drag handlers
  const dragItemRef = useRef(state.dragItem);
  dragItemRef.current = state.dragItem;
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const onDragStart = useCallback(
    (item: { id: string; type: "node" | "artifact" }) =>
      (e: React.DragEvent) => {
        if (!isOwner) return;
        setState({ dragItem: item, dragOverIndex: null, isDragging: true });
        e.dataTransfer.effectAllowed = "move";
        if (e.currentTarget instanceof HTMLElement) {
          e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
        }
      },
    [isOwner]
  );

  const onDragOver = useCallback(
    (index: number) => (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setState((prev) =>
        prev.dragOverIndex === index ? prev : { ...prev, dragOverIndex: index }
      );
    },
    []
  );

  const onDrop = useCallback(
    (dropIndex: number) => (e: React.DragEvent) => {
      e.preventDefault();
      const dragItem = dragItemRef.current;
      const currentItems = itemsRef.current;
      if (!dragItem || !isOwner) {
        setState({ dragItem: null, dragOverIndex: null, isDragging: false });
        return;
      }

      const currentIndex = currentItems.findIndex(
        (i) => i.id === dragItem.id && i.type === dragItem.type
      );
      if (currentIndex === -1 || currentIndex === dropIndex) {
        setState({ dragItem: null, dragOverIndex: null, isDragging: false });
        return;
      }

      const reordered = [...currentItems];
      const [moved] = reordered.splice(currentIndex, 1);
      reordered.splice(dropIndex, 0, moved);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        reorderFetcher.submit(
          {
            intent: "reorder_stem_items",
            items: JSON.stringify(reordered.map((i) => ({ id: i.id, type: i.type }))),
          },
          { method: "post" }
        );
      }, 300);

      setState({ dragItem: null, dragOverIndex: null, isDragging: false });
    },
    [isOwner, reorderFetcher]
  );

  const onDragEnd = useCallback(() => {
    setState({ dragItem: null, dragOverIndex: null, isDragging: false });
  }, []);

  const value = useMemo<DragContextValue>(
    () => ({ ...state, onDragStart, onDragOver, onDrop, onDragEnd }),
    [state, onDragStart, onDragOver, onDrop, onDragEnd]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}
