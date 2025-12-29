# Page Layout Components Reference

Nuxt UI v4 provides 16 components for building landing pages and content layouts.

## Component Overview

| Component | Purpose |
|-----------|---------|
| Page | Grid layout with columns |
| PageHeader | Responsive header |
| PageHero | Hero section |
| PageSection | Content section |
| PageGrid | Responsive grid |
| PageColumns | Multi-column layout |
| PageFeature | Feature showcase |
| PageCTA | Call-to-action |
| PageCard | Styled card |
| PageList | Vertical list |
| PageLogos | Logo showcase |
| PageAnchors | Anchor links |
| PageAside | Sticky sidebar |
| PageBody | Main content |
| PageLinks | Link list |

## Basic Landing Page

```vue
<template>
  <UPage>
    <UPageHero
      title="Build faster with Nuxt UI"
      description="125+ accessible components for Vue & Nuxt"
      :links="[
        { label: 'Get Started', to: '/docs', color: 'primary' },
        { label: 'View on GitHub', to: 'https://github.com', variant: 'outline' }
      ]"
    />

    <UPageSection title="Features" description="Everything you need">
      <UPageGrid>
        <UPageFeature
          v-for="feature in features"
          :key="feature.title"
          v-bind="feature"
        />
      </UPageGrid>
    </UPageSection>

    <UPageCTA
      title="Ready to start?"
      description="Get started with Nuxt UI today"
      :links="[{ label: 'Get Started', to: '/docs' }]"
    />
  </UPage>
</template>
```

## Page

Root layout component with left/right column support.

### Props

```ts
interface PageProps {
  as?: string               // Render element (default: 'div')
}
```

### Slots

- `left` - Left sidebar
- `default` - Main content
- `right` - Right sidebar

### Usage

```vue
<UPage>
  <template #left>
    <UPageAside>
      <UContentNavigation :items="navigation" />
    </UPageAside>
  </template>

  <UPageBody>
    <slot />
  </UPageBody>

  <template #right>
    <UPageAside>
      <UContentToc :links="toc" />
    </UPageAside>
  </template>
</UPage>
```

## PageHero

Hero section with title, description, and call-to-action links.

### Props

```ts
interface PageHeroProps {
  title?: string
  description?: string
  headline?: string          // Small text above title
  links?: Link[]             // CTA buttons
  align?: 'left' | 'center' | 'right'
  orientation?: 'horizontal' | 'vertical'
}
```

### Slots

- `headline` - Above title
- `title` - Title area
- `description` - Description area
- `links` - CTA buttons
- `default` - Additional content
- `top` / `bottom` - Extra sections

### Usage

```vue
<UPageHero
  headline="Introducing v4"
  title="The Ultimate Vue UI Library"
  description="Build beautiful applications with 125+ components"
  align="center"
  :links="[
    { label: 'Get Started', to: '/start', color: 'primary', size: 'xl' },
    { label: 'Learn More', to: '/about', variant: 'ghost', size: 'xl' }
  ]"
>
  <template #top>
    <UBadge>New Release</UBadge>
  </template>

  <template #bottom>
    <img src="/hero-image.png" alt="Hero" />
  </template>
</UPageHero>
```

## PageSection

Content section container with title and description.

### Props

```ts
interface PageSectionProps {
  title?: string
  description?: string
  headline?: string
  align?: 'left' | 'center' | 'right'
  features?: Feature[]       // Auto-render features
  links?: Link[]            // Section links
}
```

### Usage

```vue
<UPageSection
  headline="Why Choose Us"
  title="Built for Developers"
  description="Everything you need to build modern applications"
  align="center"
>
  <UPageGrid :columns="3">
    <UPageCard
      title="TypeScript"
      description="Full type safety"
      icon="i-logos-typescript-icon"
    />
    <UPageCard
      title="Accessible"
      description="WCAG compliant"
      icon="i-heroicons-check-badge"
    />
    <UPageCard
      title="Themeable"
      description="Tailwind Variants"
      icon="i-heroicons-swatch"
    />
  </UPageGrid>
</UPageSection>
```

## PageGrid

Responsive grid layout.

### Props

```ts
interface PageGridProps {
  columns?: number | { sm?: number; md?: number; lg?: number; xl?: number }
  gap?: string
}
```

### Usage

```vue
<!-- Fixed columns -->
<UPageGrid :columns="3">
  <UPageCard v-for="item in items" v-bind="item" />
</UPageGrid>

<!-- Responsive columns -->
<UPageGrid :columns="{ sm: 1, md: 2, lg: 3, xl: 4 }">
  <UPageCard v-for="item in items" v-bind="item" />
</UPageGrid>
```

## PageFeature

Feature showcase component.

### Props

```ts
interface PageFeatureProps {
  title?: string
  description?: string
  icon?: string
  to?: string               // Link destination
  target?: string
  orientation?: 'horizontal' | 'vertical'
  align?: 'left' | 'center' | 'right'
}
```

### Slots

- `icon` - Icon area
- `title` - Title area
- `description` - Description area
- `default` - Additional content

### Usage

```vue
<UPageFeature
  icon="i-heroicons-rocket-launch"
  title="Lightning Fast"
  description="Optimized for performance with Tailwind v4"
  to="/features/performance"
/>
```

## PageCTA

Call-to-action section.

### Props

```ts
interface PageCTAProps {
  title?: string
  description?: string
  links?: Link[]
  align?: 'left' | 'center' | 'right'
  card?: boolean            // Wrap in card
}
```

### Usage

```vue
<UPageCTA
  title="Ready to Get Started?"
  description="Join thousands of developers building with Nuxt UI"
  align="center"
  :card="true"
  :links="[
    { label: 'Start Building', to: '/docs', color: 'primary', size: 'lg' },
    { label: 'Contact Sales', to: '/contact', variant: 'outline', size: 'lg' }
  ]"
/>
```

## PageCard

Pre-styled card for grids.

### Props

```ts
interface PageCardProps {
  title?: string
  description?: string
  icon?: string
  to?: string
  target?: string
  highlight?: boolean       // Highlight border
  spotlight?: boolean       // Spotlight effect
}
```

### Usage

```vue
<UPageCard
  title="Documentation"
  description="Learn how to use Nuxt UI"
  icon="i-heroicons-book-open"
  to="/docs"
  highlight
/>
```

## PageLogos

Logo showcase with optional marquee.

### Props

```ts
interface PageLogosProps {
  title?: string
  logos?: Logo[]
  marquee?: boolean         // Scrolling logos
  align?: 'left' | 'center' | 'right'
}
```

### Usage

```vue
<UPageLogos
  title="Trusted by"
  :logos="[
    { src: '/logos/company1.svg', alt: 'Company 1' },
    { src: '/logos/company2.svg', alt: 'Company 2' }
  ]"
  marquee
/>
```

## PageColumns

Multi-column layout.

### Props

```ts
interface PageColumnsProps {
  columns?: number
  reverse?: boolean         // Reverse on mobile
}
```

### Slots

- `left` - Left column
- `right` - Right column

### Usage

```vue
<UPageColumns :columns="2">
  <template #left>
    <img src="/feature.png" />
  </template>

  <template #right>
    <h2>Feature Title</h2>
    <p>Feature description...</p>
  </template>
</UPageColumns>
```

## PageAside

Sticky sidebar for navigation.

### Props

```ts
interface PageAsideProps {
  sticky?: boolean          // Stick to top (default: true)
  top?: string              // Top offset
}
```

### Usage

```vue
<UPage>
  <template #left>
    <UPageAside>
      <UContentNavigation :items="navigation" />
    </UPageAside>
  </template>

  <UPageBody>
    <slot />
  </UPageBody>

  <template #right>
    <UPageAside>
      <UContentToc :links="toc" />
    </UPageAside>
  </template>
</UPage>
```

## Complete Example

```vue
<template>
  <div>
    <!-- Hero -->
    <UPageHero
      headline="Nuxt UI v4"
      title="Build Beautiful Vue Apps"
      description="125+ accessible, themeable components"
      align="center"
      :links="heroLinks"
    >
      <template #bottom>
        <UPageLogos :logos="logos" marquee />
      </template>
    </UPageHero>

    <!-- Features -->
    <UPageSection title="Features" align="center">
      <UPageGrid :columns="3">
        <UPageFeature
          v-for="feature in features"
          v-bind="feature"
        />
      </UPageGrid>
    </UPageSection>

    <!-- Split Section -->
    <UPageSection>
      <UPageColumns>
        <template #left>
          <img src="/demo.png" class="rounded-lg" />
        </template>
        <template #right>
          <h2>Why Nuxt UI?</h2>
          <UPageList :items="reasons" />
        </template>
      </UPageColumns>
    </UPageSection>

    <!-- Pricing -->
    <UPageSection title="Pricing" align="center">
      <UPricingPlans :plans="plans" />
    </UPageSection>

    <!-- CTA -->
    <UPageCTA
      title="Start Building Today"
      :links="ctaLinks"
      card
    />
  </div>
</template>
```
