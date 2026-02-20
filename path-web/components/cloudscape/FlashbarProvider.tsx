"use client";

import { createContext, useContext, useState, useCallback } from "react";
import Flashbar, { type FlashbarProps } from "@cloudscape-design/components/flashbar";

interface FlashbarContextType {
  addFlash: (type: FlashbarProps.Type, content: string) => void;
}

const FlashbarContext = createContext<FlashbarContextType>({
  addFlash: () => {},
});

export function useFlash() {
  return useContext(FlashbarContext);
}

let flashIdCounter = 0;

export function FlashbarProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FlashbarProps.MessageDefinition[]>([]);

  const addFlash = useCallback((type: FlashbarProps.Type, content: string) => {
    const id = String(++flashIdCounter);
    const newItem: FlashbarProps.MessageDefinition = {
      type,
      content,
      id,
      dismissible: true,
      onDismiss: () => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      },
    };
    setItems((prev) => [...prev, newItem]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 5000);
  }, []);

  return (
    <FlashbarContext.Provider value={{ addFlash }}>
      {children}
      <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 1000, maxWidth: 400 }}>
        <Flashbar items={items} />
      </div>
    </FlashbarContext.Provider>
  );
}
