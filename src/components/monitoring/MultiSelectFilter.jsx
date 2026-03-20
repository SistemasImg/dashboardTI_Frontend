import { useState, useRef, useEffect } from 'react';
import Label from '@/widgets/forms/label';

export default function MultiSelectFilter({
  label,
  options = [],
  value = [],
  onChange,
  single = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleValue = (v) => {
    if (single) {
      onChange(v);
      setOpen(false);
      return;
    }

    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      onChange([...value, v]);
    }
  };

  const displayValues = single ? (value ? [value] : []) : value;

  return (
    <div
      ref={ref}
      className={`relative min-w-[220px] ${disabled ? 'pointer-events-none opacity-50' : ''}`}
    >
      <Label>{label}</Label>

      {/* INPUT VISUAL */}
      <div
        onClick={() => !disabled && setOpen(!open)}
        className={`flex min-h-[42px] ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} flex-wrap items-center gap-1 rounded-lg border-2 border-black bg-white px-3 py-1`}
      >
        {displayValues.length === 0 ? (
          <span className="text-sm text-gray-400">All</span>
        ) : (
          displayValues.map((v) => (
            <span
              key={v}
              className="flex items-center gap-1 rounded bg-gray-200 px-2 py-0.5 text-xs"
            >
              {v}
              {!single && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleValue(v);
                  }}
                  className="text-gray-600 hover:text-black"
                >
                  ✕
                </button>
              )}
            </span>
          ))
        )}
      </div>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-white shadow-lg">
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => toggleValue(opt)}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-100"
            >
              {!single && (
                <input type="checkbox" checked={value.includes(opt)} readOnly />
              )}
              <span className="text-sm">{opt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
