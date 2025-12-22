// Base UI Select Component with Positioner Pattern
// @base-ui-components/react v1.0.0-beta.4

import * as React from "react";
import { Select } from "@base-ui-components/react/select";

/**
 * Example: Custom Select with Base UI
 *
 * Key Features:
 * - Positioner pattern for popup positioning (Floating UI)
 * - Render props for full styling control
 * - Accessible keyboard navigation
 * - Multi-select support
 */

interface Option {
  value: string;
  label: string;
}

const options: Option[] = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "angular", label: "Angular" },
  { value: "svelte", label: "Svelte" },
  { value: "solid", label: "Solid" },
];

export function SelectExample() {
  const [value, setValue] = React.useState<string>("react");

  return (
    <Select.Root value={value} onValueChange={setValue}>
      {/* Trigger Button */}
      <Select.Trigger
        render={(props) => (
          <button
            {...props}
            className="flex items-center justify-between w-64 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Select.Value
              render={(valueProps) => (
                <span {...valueProps} className="text-gray-900 dark:text-gray-100">
                  {options.find((opt) => opt.value === value)?.label || "Select..."}
                </span>
              )}
            />
            <Select.Icon
              render={(iconProps) => (
                <svg
                  {...iconProps}
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="text-gray-500"
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            />
          </button>
        )}
      />

      {/* Positioner: Handles popup positioning with Floating UI */}
      <Select.Positioner
        render={(props) => (
          <div {...props} className="z-50">
            {/* Portal for rendering outside DOM hierarchy */}
            <Select.Portal>
              {/* Popup: The actual dropdown */}
              <Select.Popup
                render={(popupProps) => (
                  <div
                    {...popupProps}
                    className="mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg overflow-hidden"
                  >
                    {options.map((option) => (
                      <Select.Option
                        key={option.value}
                        value={option.value}
                        render={(optionProps) => (
                          <div
                            {...optionProps}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 data-[highlighted]:bg-blue-50 dark:data-[highlighted]:bg-blue-900/20 data-[selected]:bg-blue-600 data-[selected]:text-white"
                          >
                            {option.label}
                          </div>
                        )}
                      />
                    ))}
                  </div>
                )}
              />
            </Select.Portal>
          </div>
        )}
      />
    </Select.Root>
  );
}

/**
 * Multi-Select Example
 */
export function MultiSelectExample() {
  const [values, setValues] = React.useState<string[]>(["react", "vue"]);

  return (
    <Select.Root
      value={values}
      onValueChange={setValues}
      multiple
    >
      <Select.Trigger
        render={(props) => (
          <button
            {...props}
            className="flex items-center justify-between w-64 px-4 py-2 bg-white border border-gray-300 rounded-md"
          >
            <Select.Value
              render={(valueProps) => (
                <span {...valueProps}>
                  {values.length > 0
                    ? `${values.length} selected`
                    : "Select multiple..."}
                </span>
              )}
            />
          </button>
        )}
      />

      <Select.Positioner>
        <Select.Portal>
          <Select.Popup
            render={(props) => (
              <div {...props} className="mt-1 bg-white border rounded-md shadow-lg">
                {options.map((option) => (
                  <Select.Option
                    key={option.value}
                    value={option.value}
                    render={(optionProps) => (
                      <div
                        {...optionProps}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100 data-[selected]:bg-blue-600 data-[selected]:text-white flex items-center gap-2"
                      >
                        {/* Checkbox indicator */}
                        <span className="w-4 h-4 border border-gray-300 rounded data-[selected]:bg-blue-600 data-[selected]:border-blue-600" />
                        {option.label}
                      </div>
                    )}
                  />
                ))}
              </div>
            )}
          />
        </Select.Portal>
      </Select.Positioner>
    </Select.Root>
  );
}

/**
 * Searchable Select Example
 */
export function SearchableSelectExample() {
  const [value, setValue] = React.useState<string>("");
  const [search, setSearch] = React.useState("");

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Select.Root value={value} onValueChange={setValue}>
      <Select.Trigger
        render={(props) => (
          <button
            {...props}
            className="flex items-center justify-between w-64 px-4 py-2 bg-white border rounded-md"
          >
            <Select.Value
              render={(valueProps) => (
                <span {...valueProps}>
                  {options.find((opt) => opt.value === value)?.label || "Search..."}
                </span>
              )}
            />
          </button>
        )}
      />

      <Select.Positioner>
        <Select.Portal>
          <Select.Popup
            render={(props) => (
              <div {...props} className="mt-1 bg-white border rounded-md shadow-lg">
                {/* Search input */}
                <div className="p-2 border-b">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Filtered options */}
                <div className="max-h-60 overflow-y-auto">
                  {filtered.length > 0 ? (
                    filtered.map((option) => (
                      <Select.Option
                        key={option.value}
                        value={option.value}
                        render={(optionProps) => (
                          <div
                            {...optionProps}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100 data-[selected]:bg-blue-600 data-[selected]:text-white"
                          >
                            {option.label}
                          </div>
                        )}
                      />
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500">No results found</div>
                  )}
                </div>
              </div>
            )}
          />
        </Select.Portal>
      </Select.Positioner>
    </Select.Root>
  );
}

/**
 * Common Pitfalls:
 *
 * ❌ Missing Positioner (popup won't position correctly)
 * <Select.Root>
 *   <Select.Trigger />
 *   <Select.Popup /> {/* Wrong! */}
 * </Select.Root>
 *
 * ✅ Wrap Popup in Positioner
 * <Select.Root>
 *   <Select.Trigger />
 *   <Select.Positioner>
 *     <Select.Portal>
 *       <Select.Popup />
 *     </Select.Portal>
 *   </Select.Positioner>
 * </Select.Root>
 *
 * ❌ Using empty string value (breaks accessibility)
 * <Select.Option value="">Any</Select.Option>
 *
 * ✅ Use sentinel value
 * <Select.Option value="__any__">Any</Select.Option>
 */
