"use client";

import Box from "@cloudscape-design/components/box";

export interface TileItem {
  value: string;
  label: string;
  description?: string;
}

interface SelectableTilesProps {
  items: TileItem[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  selectionType: "single" | "multi";
  columns?: number;
}

export function SelectableTiles({
  items,
  selectedValues,
  onChange,
  selectionType,
  columns = 3,
}: SelectableTilesProps) {
  const handleClick = (value: string) => {
    if (selectionType === "single") {
      onChange(selectedValues.includes(value) ? [] : [value]);
    } else {
      onChange(
        selectedValues.includes(value)
          ? selectedValues.filter((v) => v !== value)
          : [...selectedValues, value]
      );
    }
  };

  return (
    <div
      className="selectable-tiles-grid"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {items.map((item) => {
        const selected = selectedValues.includes(item.value);
        return (
          <button
            key={item.value}
            type="button"
            className={`selectable-tile ${selected ? "selected" : ""}`}
            onClick={() => handleClick(item.value)}
          >
            <span className="selectable-tile-indicator">
              {selectionType === "multi" ? (
                <span className={`selectable-tile-checkbox ${selected ? "checked" : ""}`}>
                  {selected && (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M13.354 4.354l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 01.708-.708L6 10.293l6.646-6.647a.5.5 0 01.708.708z" />
                    </svg>
                  )}
                </span>
              ) : (
                <span className={`selectable-tile-radio ${selected ? "checked" : ""}`} />
              )}
            </span>
            <span className="selectable-tile-content">
              <span className="selectable-tile-label">{item.label}</span>
              {item.description && (
                <Box variant="small" color="text-body-secondary">
                  {item.description}
                </Box>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
