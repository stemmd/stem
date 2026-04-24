import { createContext, useCallback, useContext, useState } from "react";
import type { Artifact } from "./types";

interface ReaderContextValue {
  current: Artifact | null;
  open: (artifact: Artifact) => void;
  close: () => void;
}

const Ctx = createContext<ReaderContextValue | null>(null);

export function ReaderProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<Artifact | null>(null);

  const open = useCallback((artifact: Artifact) => {
    setCurrent(artifact);
  }, []);

  const close = useCallback(() => {
    setCurrent(null);
  }, []);

  return (
    <Ctx.Provider value={{ current, open, close }}>
      {children}
    </Ctx.Provider>
  );
}

/** Returns the reader context, or null if not within a ReaderProvider. */
export function useReader(): ReaderContextValue | null {
  return useContext(Ctx);
}
