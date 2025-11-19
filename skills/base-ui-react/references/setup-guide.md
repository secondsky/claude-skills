# Base UI React Complete Setup

Quick setup for Base UI (@base-ui-components/react) - MUI's unstyled components.

---

## Installation

```bash
pnpm add @base-ui-components/react
```

**Beta status:** v1.0.0-beta.4 (stable v1.0 expected Q4 2025)

---

## Basic Usage

### Dialog Example

```typescript
import * as Dialog from '@base-ui-components/react/dialog';

export function MyDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>Open Dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <Dialog.Title>Dialog Title</Dialog.Title>
          <Dialog.Description>Dialog content here</Dialog.Description>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### Select Example

```typescript
import * as Select from '@base-ui-components/react/select';

export function MySelect() {
  return (
    <Select.Root>
      <Select.Trigger>
        <Select.Value placeholder="Select option" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup>
            <Select.Option value="1">Option 1</Select.Option>
            <Select.Option value="2">Option 2</Select.Option>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
```

---

## With Tailwind

```typescript
<Dialog.Popup className="rounded-lg bg-white p-6 shadow-xl">
  <Dialog.Title className="text-xl font-bold">Title</Dialog.Title>
  <Dialog.Description className="mt-2 text-gray-600">
    Content
  </Dialog.Description>
</Dialog.Popup>
```

---

## Available Components

- Dialog
- Select
- Popover
- Tooltip
- Accordion
- NumberField
- Checkbox
- Switch
- Tabs
- And 20+ more

---

## Official Documentation

- **Base UI Docs**: https://base-ui.mui.com/
- **Components**: https://base-ui.mui.com/components/
