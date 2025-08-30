import React, { useState } from "react";

export default function ImagePreview({ files, onRemove }) {
  const [showAll, setShowAll] = useState(false);
  const MAX_VISIBLE = 50;              // how many filenames to show before “Show all”

  const list = showAll ? files : files.slice(0, MAX_VISIBLE);

  return (
    <div className="mt-3 border rounded p-3 bg-gray-50">
      <header className="flex justify-between items-center mb-2">
        <span className="font-semibold text-sm">
          Selected files: {files.length}
        </span>

        {files.length > MAX_VISIBLE && (
          <button
            type="button"
            className="text-cyan-600 text-xs underline"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Collapse" : `Show all (${files.length})`}
          </button>
        )}
      </header>

      <ul className="max-h-64 overflow-y-auto text-sm space-y-1 pr-2">
        {list.map((f, i) => (
          <li key={i} className="flex justify-between">
            <span className="truncate">{f.name}</span>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="ml-2 text-red-500 hover:text-red-700 shrink-0"
            >
              Remove
            </button>
          </li>
        ))}
        {!showAll && files.length > MAX_VISIBLE && (
          <li className="text-center text-xs text-gray-500">
            …and {files.length - MAX_VISIBLE} more
          </li>
        )}
      </ul>
    </div>
  );
}
