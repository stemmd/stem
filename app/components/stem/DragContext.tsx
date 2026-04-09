import { createContext, useContext, useCallback, useRef, useMemo, useState } from "react";
import { useFetcher } from "@remix-run/react";

interface DragItem { id: string; type: "node" | "artifact" }

interface DragContextValue {
  dragIndex: number | null;
  targetIndex: number | null;
  handlePointerDown: (index: number, item: DragItem) => (e: React.PointerEvent) => void;
}

const Ctx = createContext<DragContextValue | null>(null);
export function useDragContext() { return useContext(Ctx); }

export function DragProvider({
  stemId,
  items,
  isOwner,
  children,
}: {
  stemId: string;
  items: DragItem[];
  isOwner: boolean;
  children: React.ReactNode;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);

  const fetcher = useFetcher();
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const startPos = useRef({ x: 0, y: 0 });
  const dragInfo = useRef<{
    index: number; item: DragItem; el: HTMLElement; startRect: DOMRect;
  } | null>(null);
  const overlay = useRef<HTMLElement | null>(null);
  const indicatorEl = useRef<HTMLElement | null>(null);
  const isActive = useRef(false);
  const currentTarget = useRef<number | null>(null);
  const mids = useRef<number[]>([]);
  const gridBox = useRef<DOMRect | null>(null);

  const cleanup = useCallback(() => {
    if (overlay.current) {
      const el = overlay.current;
      el.style.opacity = "0";
      el.style.transform = el.style.transform.replace("scale(1.02)", "scale(0.98)");
      setTimeout(() => el.remove(), 150);
      overlay.current = null;
    }
    if (indicatorEl.current) {
      const el = indicatorEl.current;
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 150);
      indicatorEl.current = null;
    }
    if (dragInfo.current?.el) {
      const el = dragInfo.current.el;
      el.style.transition = "opacity 0.2s ease";
      el.style.opacity = "";
    }
    dragInfo.current = null;
    isActive.current = false;
    currentTarget.current = null;
    setDragIndex(null);
    setTargetIndex(null);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  const onMove = useCallback((e: PointerEvent) => {
    const info = dragInfo.current;
    if (!info) return;

    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;

    // Threshold before entering drag mode
    if (!isActive.current) {
      if (Math.abs(dx) + Math.abs(dy) < 8) return;
      isActive.current = true;

      // Measure all item midpoints
      const els = document.querySelectorAll<HTMLElement>("[data-drag-idx]");
      const m: number[] = [];
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        m.push(r.top + r.height / 2);
      });
      mids.current = m;

      // Measure grid for indicator sizing
      const grid = info.el.closest("[data-stem-grid]");
      gridBox.current = grid?.getBoundingClientRect() ?? info.startRect;

      // Create floating clone
      const clone = info.el.cloneNode(true) as HTMLElement;
      clone.removeAttribute("data-drag-idx");
      Object.assign(clone.style, {
        position: "fixed",
        left: `${info.startRect.left}px`,
        top: `${info.startRect.top}px`,
        width: `${info.startRect.width}px`,
        zIndex: "10000",
        pointerEvents: "none",
        opacity: "0",
        transform: "scale(1)",
        borderRadius: "12px",
        transition: "opacity 0.15s ease, box-shadow 0.2s ease",
        willChange: "transform",
      });
      document.body.appendChild(clone);
      requestAnimationFrame(() => {
        clone.style.opacity = "0.95";
        clone.style.boxShadow = "0 12px 40px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)";
        clone.style.transform = `translate(${dx}px, ${dy}px) scale(1.02)`;
      });
      overlay.current = clone;

      // Create drop indicator line
      const line = document.createElement("div");
      Object.assign(line.style, {
        position: "fixed",
        height: "3px",
        background: "var(--forest, #2D5A3D)",
        borderRadius: "2px",
        zIndex: "9999",
        opacity: "0",
        pointerEvents: "none",
        transition: "top 0.15s ease, opacity 0.1s ease",
        boxShadow: "0 0 8px rgba(45, 90, 61, 0.3)",
      });
      document.body.appendChild(line);
      indicatorEl.current = line;

      // Fade original
      info.el.style.transition = "opacity 0.15s ease";
      info.el.style.opacity = "0.15";
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";

      setDragIndex(info.index);
    }

    // Move overlay (no transition for immediate cursor tracking)
    if (overlay.current) {
      overlay.current.style.transition = "box-shadow 0.2s ease";
      overlay.current.style.transform = `translate(${dx}px, ${dy}px) scale(1.02)`;
    }

    // Compute insertion index from cursor Y
    const m = mids.current;
    let target = 0;
    for (let i = 0; i < m.length; i++) {
      if (e.clientY > m[i]) target = i + 1;
    }
    target = Math.max(0, Math.min(target, m.length));

    if (target !== currentTarget.current) {
      currentTarget.current = target;
      setTargetIndex(target);

      const isNoOp = target === info.index || target === info.index + 1;

      if (indicatorEl.current) {
        if (isNoOp) {
          indicatorEl.current.style.opacity = "0";
        } else {
          const els = document.querySelectorAll<HTMLElement>("[data-drag-idx]");
          let y: number;
          if (target === 0 && els[0]) {
            y = els[0].getBoundingClientRect().top - 4;
          } else if (target >= els.length && els[els.length - 1]) {
            y = els[els.length - 1].getBoundingClientRect().bottom + 2;
          } else if (els[target] && els[target - 1]) {
            const above = els[target - 1].getBoundingClientRect().bottom;
            const below = els[target].getBoundingClientRect().top;
            y = (above + below) / 2;
          } else {
            y = 0;
          }
          const g = gridBox.current;
          indicatorEl.current.style.left = `${g ? g.left + 20 : 40}px`;
          indicatorEl.current.style.width = `${g ? g.width - 40 : 200}px`;
          indicatorEl.current.style.top = `${y}px`;
          indicatorEl.current.style.opacity = "1";
        }
      }
    }
  }, []);

  const onUp = useCallback(() => {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);

    const info = dragInfo.current;
    if (!isActive.current || !info) {
      cleanup();
      return;
    }

    const from = info.index;
    const to = currentTarget.current ?? from;
    const isNoOp = to === from || to === from + 1;

    if (!isNoOp) {
      const current = [...itemsRef.current];
      const [moved] = current.splice(from, 1);
      const adjusted = to > from ? to - 1 : to;
      current.splice(adjusted, 0, moved);

      fetcher.submit(
        {
          intent: "reorder_stem_items",
          items: JSON.stringify(current.map((i) => ({ id: i.id, type: i.type }))),
        },
        { method: "post" }
      );
    }

    // Prevent the subsequent click from triggering node focus etc.
    document.addEventListener(
      "click",
      (ev) => { ev.stopPropagation(); ev.preventDefault(); },
      { capture: true, once: true }
    );

    cleanup();
  }, [cleanup, onMove, fetcher]);

  const handlePointerDown = useCallback(
    (index: number, item: DragItem) => (e: React.PointerEvent) => {
      if (!isOwner || e.button !== 0) return;

      // Don't start drag from links, inputs, or form elements
      const target = e.target as HTMLElement;
      if (target.closest("a[href], input, textarea, form, iframe")) return;

      startPos.current = { x: e.clientX, y: e.clientY };
      dragInfo.current = {
        index,
        item,
        el: e.currentTarget as HTMLElement,
        startRect: e.currentTarget.getBoundingClientRect(),
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [isOwner, onMove, onUp]
  );

  const value = useMemo<DragContextValue>(
    () => ({ dragIndex, targetIndex, handlePointerDown }),
    [dragIndex, targetIndex, handlePointerDown]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
