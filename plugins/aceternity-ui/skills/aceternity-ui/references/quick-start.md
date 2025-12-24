# Aceternity UI Quick Start Guide

Fast-track guide to get started with Aceternity UI in your Next.js project.

## Prerequisites

- Node.js 18+ installed
- Package manager: bun (preferred), npm, or pnpm
- Basic knowledge of React and Next.js
- Basic knowledge of Tailwind CSS

## 5-Minute Setup

### Step 1: Create Next.js Project (2 minutes)

**Using bun (fastest):**
```bash
bunx create-next-app@latest my-aceternity-app
cd my-aceternity-app
```

**Using npm:**
```bash
npx create-next-app@latest my-aceternity-app
cd my-aceternity-app
```

**Using pnpm:**
```bash
pnpm create next-app@latest my-aceternity-app
cd my-aceternity-app
```

**Configuration prompts - select:**
- ✅ TypeScript: Yes
- ✅ ESLint: Yes
- ✅ Tailwind CSS: Yes
- ⚪ src/ directory: Your preference (optional)
- ✅ App Router: Yes (recommended)
- ✅ Import alias: @/* (default)

### Step 2: Initialize shadcn (1 minute)

**Using bun:**
```bash
bunx --bun shadcn@latest init
```

**Using npm:**
```bash
npx shadcn@latest init
```

**Using pnpm:**
```bash
pnpm dlx shadcn@latest init
```

**Configuration prompts - select:**
- Style: New York (recommended)
- Color: Zinc (or your preference)
- CSS variables: Yes (recommended)

### Step 3: Configure Aceternity Registry (1 minute)

Open `components.json` and add the Aceternity registry:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  },
  "registries": {
    "@aceternity": "https://ui.aceternity.com/registry/{name}.json"
  }
}
```

### Step 4: Install First Component (1 minute)

```bash
# Using bun
bunx shadcn@latest add @aceternity/background-beams

# Using npm
npx shadcn@latest add @aceternity/background-beams

# Using pnpm
pnpm dlx shadcn@latest add @aceternity/background-beams
```

### Step 5: Create Your First Page

Replace `app/page.tsx`:

```tsx
"use client";
import { BackgroundBeams } from "@/components/ui/background-beams";

export default function Home() {
  return (
    <div className="h-screen w-full bg-neutral-950 relative flex flex-col items-center justify-center antialiased">
      <div className="max-w-2xl mx-auto p-4 z-10">
        <h1 className="relative text-lg md:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 text-center font-sans font-bold">
          Welcome to Aceternity UI
        </h1>
        <p className="text-neutral-500 max-w-lg mx-auto my-2 text-sm text-center">
          Build beautiful, animated interfaces with ease
        </p>
      </div>
      <BackgroundBeams />
    </div>
  );
}
```

### Step 6: Run Development Server

```bash
# Using bun
bun dev

# Using npm
npm run dev

# Using pnpm
pnpm dev
```

Visit http://localhost:3000 - you should see your animated background!

## Common First Components

After background-beams, try these popular components:

### 3D Card Effect

```bash
bunx shadcn@latest add @aceternity/3d-card
```

```tsx
"use client";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";

export function MyCard() {
  return (
    <CardContainer>
      <CardBody className="bg-gray-50 dark:bg-black p-6 rounded-xl">
        <CardItem translateZ="50" className="text-2xl font-bold">
          Hover Me!
        </CardItem>
      </CardBody>
    </CardContainer>
  );
}
```

### Typewriter Effect

```bash
bunx shadcn@latest add @aceternity/typewriter-effect
```

```tsx
"use client";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";

const words = [
  { text: "Build" },
  { text: "amazing" },
  { text: "things" }
];

export function MyTypewriter() {
  return <TypewriterEffect words={words} />;
}
```

### Animated Modal

```bash
bunx shadcn@latest add @aceternity/animated-modal
```

```tsx
"use client";
import { Modal, ModalBody, ModalContent, ModalTrigger } from "@/components/ui/animated-modal";

export function MyModal() {
  return (
    <Modal>
      <ModalTrigger className="bg-black text-white px-4 py-2 rounded-md">
        Open Modal
      </ModalTrigger>
      <ModalBody>
        <ModalContent>
          <h2>Modal Content</h2>
        </ModalContent>
      </ModalBody>
    </Modal>
  );
}
```

## Manual Installation (Alternative)

If the registry approach doesn't work:

### 1. Install Dependencies

```bash
# Using bun
bun add motion clsx tailwind-merge

# Using npm
npm install motion clsx tailwind-merge

# Using pnpm
pnpm add motion clsx tailwind-merge
```

### 2. Add Utility Function

Create `lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 3. Copy Component Code

Visit https://ui.aceternity.com/components/[component-name] and copy the code to your project.

## Project Structure

After setup, your project should look like:

```
my-aceternity-app/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/
│       ├── background-beams.tsx
│       ├── 3d-card.tsx
│       └── ... (other components)
├── lib/
│   └── utils.ts
├── components.json
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Troubleshooting

### "Module not found: motion"

```bash
bun add motion
# or: npm install motion
# or: pnpm add motion
```

### "cn is not defined"

Make sure `lib/utils.ts` exists with the cn helper function (see Manual Installation step 2).

### Components not animating

Add "use client" directive at the top of your component file:

```tsx
"use client";
import { Component } from "@/components/ui/component";
```

### Tailwind classes not applying

Check that `app/globals.css` includes:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Dark mode not working

Update `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // Add this line
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // ... rest of config
};
export default config;
```

## Next Steps

1. **Explore Components**: Browse https://ui.aceternity.com/components
2. **Combine Components**: Mix backgrounds, cards, and text effects
3. **Customize**: Edit component source code directly in your project
4. **Build Pages**: Create hero sections, feature pages, portfolios
5. **Deploy**: Deploy to Vercel, Netlify, or Cloudflare Pages

## Best Practices

### Performance

**Lazy load heavy components:**

```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(
  () => import('@/components/ui/heavy-component'),
  { ssr: false }
);
```

### Accessibility

**Always add ARIA labels:**

```tsx
<button aria-label="Open menu" className="...">
  <MenuIcon />
</button>
```

### Responsive Design

**Use Tailwind responsive prefixes:**

```tsx
<h1 className="text-2xl md:text-4xl lg:text-6xl">
  Responsive Heading
</h1>
```

### Dark Mode

**Use dark: prefix:**

```tsx
<div className="bg-white dark:bg-black text-black dark:text-white">
  Content
</div>
```

## Common Patterns

### Hero Section with Multiple Components

```tsx
"use client";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";
import { MovingBorder } from "@/components/ui/moving-border";

export default function Hero() {
  const words = [
    { text: "Build" },
    { text: "your" },
    { text: "dream", className: "text-blue-500" },
    { text: "product", className: "text-blue-500" }
  ];

  return (
    <div className="h-screen relative bg-black">
      <div className="flex flex-col items-center justify-center h-full z-10 relative">
        <TypewriterEffect words={words} />
        <p className="text-neutral-400 text-xl mt-4 max-w-2xl text-center">
          Transform your ideas into reality with our platform
        </p>
        <MovingBorder duration={2000} className="mt-8">
          <button className="px-8 py-4 text-lg">Get Started</button>
        </MovingBorder>
      </div>
      <BackgroundBeams />
    </div>
  );
}
```

### Feature Grid with Cards

```tsx
"use client";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";

const features = [
  { title: "Fast", description: "Lightning quick performance" },
  { title: "Secure", description: "Enterprise-grade security" },
  { title: "Scalable", description: "Grows with your business" }
];

export function Features() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
      {features.map((feature, idx) => (
        <CardContainer key={idx}>
          <CardBody className="bg-gray-50 dark:bg-black p-6 rounded-xl">
            <CardItem translateZ="50" className="text-2xl font-bold">
              {feature.title}
            </CardItem>
            <CardItem translateZ="60" as="p" className="text-sm mt-2">
              {feature.description}
            </CardItem>
          </CardBody>
        </CardContainer>
      ))}
    </div>
  );
}
```

## Resources

- **Documentation**: https://ui.aceternity.com/docs
- **Components**: https://ui.aceternity.com/components
- **Examples**: https://ui.aceternity.com/examples
- **Shadcn**: https://ui.shadcn.com
- **Next.js**: https://nextjs.org
- **Tailwind**: https://tailwindcss.com

## Getting Help

- Check the [official documentation](https://ui.aceternity.com/docs)
- Review component source code in your project
- Search GitHub issues
- Join the community Discord

---

**Happy Building!** 🚀
