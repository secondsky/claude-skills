# Aceternity UI Skill

Build stunning, animated React UI components for Next.js applications with Aceternity UI - a premium component library featuring 100+ production-ready components.

## What is Aceternity UI?

Aceternity UI is a comprehensive collection of beautifully animated React components designed specifically for Next.js applications. Unlike traditional npm packages, components are installed via the shadcn CLI and copied directly into your project, giving you full control and customization capabilities.

## Features

- **100+ Production-Ready Components** - Backgrounds, cards, text effects, animations, and more
- **Built for Next.js** - Optimized for Next.js 13+ with App Router support
- **Tailwind CSS Styling** - Fully customizable using Tailwind CSS v3+
- **Framer Motion Animations** - Smooth, performant animations
- **TypeScript Support** - Full type safety
- **Dark Mode Ready** - All components support dark mode
- **Copy-Paste Friendly** - Full source code access for customization
- **No Bundle Bloat** - Only install components you need

## When to Use This Skill

This skill helps you when:

- Building modern landing pages with animated backgrounds
- Creating portfolio websites with interactive elements
- Developing SaaS application interfaces
- Adding 3D card effects and hover animations
- Implementing parallax scrolling effects
- Designing hero sections with visual impact
- Building marketing websites with smooth transitions
- Creating animated text effects and typewriter animations
- Adding background effects like beams, gradients, or aurora
- Implementing floating navigation bars
- Creating animated modals and tooltips
- Building carousels and image sliders
- Adding interactive buttons with moving borders
- Creating timeline and comparison components

## Component Categories

### Backgrounds & Effects (28 components)
Animated backgrounds perfect for hero sections: beams, gradients, waves, aurora, sparkles, meteors, spotlight, vortex, and more.

### Card Components (15 components)
Interactive cards with 3D effects, hover animations, expandable cards, focus cards, glare effects, and direction-aware hover.

### Scroll & Parallax (5 components)
Engaging scroll-based animations including parallax scroll, sticky scroll reveal, and MacBook-style scroll interactions.

### Text Components (10 components)
Animated text effects: typewriter, text generation, flip words, hover effects, hero highlights, and encrypted text.

### Buttons (4 components)
Enhanced buttons with hover border gradients, moving borders, and stateful transitions.

### Navigation (5 components)
Modern navigation: floating navbar, full-featured menus, animated tabs, and sticky banners.

### Input & Forms (3 components)
Signup forms, animated input placeholders, and drag-and-drop file upload.

### Overlays & Popovers (3 components)
Animated modals, tooltips, and link preview popovers.

### Carousels & Sliders (4 components)
Image sliders, carousels, Apple-style card carousels, and testimonial sliders.

### Layout & Grid (3 components)
Layout grids, bento grids, and container covers.

### Data & Visualization (2 components)
Timelines and before/after comparison sliders.

### Cursor & Pointer (3 components)
Elements following cursor, pointer highlights, and magnifying lens effects.

### 3D Components (2 components)
3D pins and 3D rotating marquees.

### Loaders (2 components)
Multi-step loaders and loading spinners.

### Sections & Blocks (3 components)
Pre-built templates for features, cards, and hero sections.

## Quick Start

### 1. Setup New Next.js Project

```bash
# Using bun (preferred)
bunx create-next-app@latest my-app

# Or using npm
npx create-next-app@latest my-app

# Or using pnpm
pnpm create next-app@latest my-app

# Select: TypeScript, ESLint, Tailwind CSS, App Router
```

### 2. Initialize Aceternity UI

```bash
# Using bun (preferred)
bunx --bun shadcn@latest init

# Or using npm
npx shadcn@latest init

# Or using pnpm
pnpm dlx shadcn@latest init
```

### 3. Configure Registry

Add to `components.json`:

```json
{
  "registries": {
    "@aceternity": "https://ui.aceternity.com/registry/{name}.json"
  }
}
```

### 4. Install Components

```bash
# Install specific component
bunx shadcn@latest add @aceternity/background-beams

# Or with npm
npx shadcn@latest add @aceternity/background-beams

# Or with pnpm
pnpm dlx shadcn@latest add @aceternity/background-beams
```

## Usage Examples

### Animated Background Hero

```tsx
"use client";
import { BackgroundBeams } from "@/components/ui/background-beams";

export default function Hero() {
  return (
    <div className="h-screen w-full relative bg-neutral-950">
      <div className="max-w-4xl mx-auto p-8 z-10 relative">
        <h1 className="text-6xl font-bold text-white">
          Welcome to Our Platform
        </h1>
        <p className="text-xl text-neutral-400 mt-4">
          Build amazing things with beautiful animations
        </p>
      </div>
      <BackgroundBeams />
    </div>
  );
}
```

### 3D Interactive Card

```tsx
"use client";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";

export function ProductCard() {
  return (
    <CardContainer className="inter-var">
      <CardBody className="bg-gray-50 dark:bg-black rounded-xl p-6">
        <CardItem translateZ="50" className="text-2xl font-bold">
          Amazing Product
        </CardItem>
        <CardItem translateZ="60" as="p" className="text-sm mt-2">
          Hover over this card to see the 3D effect
        </CardItem>
        <CardItem translateZ="100" className="w-full mt-4">
          <img
            src="/product.jpg"
            className="rounded-xl h-60 w-full object-cover"
            alt="Product"
          />
        </CardItem>
      </CardBody>
    </CardContainer>
  );
}
```

### Typewriter Effect

```tsx
"use client";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";

export function HeroText() {
  const words = [
    { text: "Build" },
    { text: "beautiful" },
    { text: "websites" },
    { text: "with", className: "text-blue-500" },
    { text: "Aceternity.", className: "text-blue-500" }
  ];

  return <TypewriterEffect words={words} className="text-4xl" />;
}
```

### Animated Modal

```tsx
"use client";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger
} from "@/components/ui/animated-modal";

export function BookingForm() {
  return (
    <Modal>
      <ModalTrigger className="bg-black text-white px-6 py-3 rounded-lg">
        Book Now
      </ModalTrigger>
      <ModalBody>
        <ModalContent>
          <h2 className="text-2xl font-bold">Complete Your Booking</h2>
          <p className="mt-4">Fill out the form below...</p>
          {/* Form fields */}
        </ModalContent>
        <ModalFooter>
          <button className="px-4 py-2 bg-gray-200 rounded-md">
            Cancel
          </button>
          <button className="px-4 py-2 bg-black text-white rounded-md">
            Confirm
          </button>
        </ModalFooter>
      </ModalBody>
    </Modal>
  );
}
```

## Package Manager Support

### Bun (Preferred)

```bash
# Create project
bunx create-next-app@latest

# Initialize Aceternity
bunx --bun shadcn@latest init

# Install dependencies
bun add motion clsx tailwind-merge

# Add component
bunx shadcn@latest add @aceternity/component-name
```

### npm

```bash
# Create project
npx create-next-app@latest

# Initialize Aceternity
npx shadcn@latest init

# Install dependencies
npm install motion clsx tailwind-merge

# Add component
npx shadcn@latest add @aceternity/component-name
```

### pnpm

```bash
# Create project
pnpm create next-app@latest

# Initialize Aceternity
pnpm dlx shadcn@latest init

# Install dependencies
pnpm add motion clsx tailwind-merge

# Add component
pnpm dlx shadcn@latest add @aceternity/component-name
```

## Common Use Cases

### Landing Page Hero Section

Combine `background-beams`, `typewriter-effect`, and `moving-border` button:

```tsx
"use client";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";
import { MovingBorder } from "@/components/ui/moving-border";

export default function LandingHero() {
  const words = [
    { text: "Transform" },
    { text: "your" },
    { text: "business" },
    { text: "with", className: "text-blue-500" },
    { text: "AI.", className: "text-blue-500" }
  ];

  return (
    <div className="h-screen relative bg-black">
      <div className="flex flex-col items-center justify-center h-full z-10 relative">
        <TypewriterEffect words={words} />
        <p className="text-neutral-400 text-xl mt-4 max-w-2xl text-center">
          Harness the power of artificial intelligence to automate and scale
        </p>
        <MovingBorder duration={2000} className="mt-8">
          <button className="px-8 py-4 text-lg">Get Started Free</button>
        </MovingBorder>
      </div>
      <BackgroundBeams />
    </div>
  );
}
```

### Feature Showcase with Cards

Use `card-hover-effect` for feature grid:

```tsx
"use client";
import { HoverEffect } from "@/components/ui/card-hover-effect";

export function Features() {
  const items = [
    {
      title: "Fast Performance",
      description: "Optimized for speed and efficiency",
      link: "/features/performance"
    },
    {
      title: "Easy Integration",
      description: "Seamlessly integrate with your stack",
      link: "/features/integration"
    },
    {
      title: "Secure by Default",
      description: "Enterprise-grade security built-in",
      link: "/features/security"
    }
  ];

  return <HoverEffect items={items} />;
}
```

### Portfolio with Parallax

Use `parallax-scroll` for image gallery:

```tsx
import { ParallaxScroll } from "@/components/ui/parallax-scroll";

export function Portfolio() {
  const images = [
    "/project1.jpg",
    "/project2.jpg",
    "/project3.jpg",
    // More images...
  ];

  return (
    <div className="py-20">
      <h2 className="text-4xl font-bold text-center mb-12">Our Work</h2>
      <ParallaxScroll images={images} />
    </div>
  );
}
```

## Troubleshooting

### Module Not Found: motion

```bash
bun add motion
# or: npm install motion
# or: pnpm add motion
```

### cn is not defined

Add `lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Components Not Animating

Add "use client" directive at the top of your file:

```tsx
"use client";
import { Component } from "@/components/ui/component";
```

### Tailwind Classes Not Working

Ensure `app/globals.css` has:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Resources

- **Official Documentation**: https://ui.aceternity.com/docs
- **Component Gallery**: https://ui.aceternity.com/components
- **Installation Guide**: https://ui.aceternity.com/docs/install-nextjs
- **CLI Documentation**: https://ui.aceternity.com/docs/cli
- **Shadcn UI**: https://ui.shadcn.com
- **Framer Motion**: https://www.framer.com/motion
- **Next.js**: https://nextjs.org
- **Tailwind CSS**: https://tailwindcss.com

## Benefits of This Skill

### Time Savings
- **Component Selection**: Save ~30 minutes browsing and testing components
- **Installation Setup**: Save ~20 minutes configuring shadcn CLI and registry
- **Troubleshooting**: Save ~15 minutes debugging common issues
- **Implementation**: Save ~25 minutes with ready-to-use examples

**Total: ~90 minutes saved per project**

### Error Prevention
1. Missing Framer Motion dependency
2. Incorrect shadcn CLI initialization
3. Missing `cn` utility function
4. Forgetting "use client" directive
5. Wrong registry configuration
6. Pages Router vs App Router confusion

## Related Skills

Combine with these skills for full-stack development:

- **nextjs** - Next.js framework fundamentals
- **tailwind-v4-shadcn** - Advanced Tailwind CSS configuration
- **react-hook-form-zod** - Form handling and validation
- **clerk-auth** - User authentication
- **cloudflare-nextjs** - Deploy to Cloudflare Pages

## Contributing

To improve this skill:

1. Add new component examples
2. Document additional use cases
3. Update troubleshooting section
4. Add performance optimization tips
5. Include accessibility best practices

## License

MIT License - See LICENSE file for details

Aceternity UI components have their own licensing. Check https://ui.aceternity.com for component-specific licenses.

---

**Skill Version**: 1.1.0
**Last Updated**: 2025-12-08
**Maintained By**: Claude Skills Maintainers
**Repository**: https://github.com/secondsky/claude-skills
