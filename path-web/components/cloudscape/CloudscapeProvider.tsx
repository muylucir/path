"use client";

import { useEffect } from "react";
import { applyMode, Mode } from "@cloudscape-design/global-styles";

export function CloudscapeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyMode(Mode.Light);
  }, []);

  return <>{children}</>;
}
