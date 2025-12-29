<template>
  <div>
    <!-- Hero Section -->
    <UPageHero
      headline="Introducing v4"
      title="Build Beautiful Vue Applications"
      description="A comprehensive UI library with 125+ accessible components, built on Tailwind CSS v4 and Reka UI."
      align="center"
      :links="[
        { label: 'Get Started', to: '/docs', color: 'primary', size: 'xl' },
        { label: 'View on GitHub', to: 'https://github.com', icon: 'i-simple-icons-github', variant: 'outline', size: 'xl' }
      ]"
    >
      <template #top>
        <UBadge color="primary" variant="subtle" class="mb-4">
          New Release
        </UBadge>
      </template>

      <template #bottom>
        <div class="mt-12">
          <UPageLogos
            title="Trusted by leading companies"
            :logos="logos"
            marquee
          />
        </div>
      </template>
    </UPageHero>

    <!-- Features Section -->
    <UPageSection
      headline="Features"
      title="Everything You Need"
      description="Build faster with production-ready components"
      align="center"
    >
      <UPageGrid :columns="3">
        <UPageFeature
          v-for="feature in features"
          :key="feature.title"
          v-bind="feature"
        />
      </UPageGrid>
    </UPageSection>

    <!-- Split Section -->
    <UPageSection>
      <UPageColumns>
        <template #left>
          <img
            src="/demo.png"
            alt="Demo"
            class="rounded-xl shadow-xl"
          />
        </template>

        <template #right>
          <UBadge color="primary" variant="subtle" class="mb-4">
            Developer Experience
          </UBadge>
          <h2 class="text-3xl font-bold mb-4">
            Built for Developers
          </h2>
          <p class="text-muted mb-6">
            Nuxt UI provides a seamless developer experience with TypeScript support,
            auto-imports, and intuitive APIs.
          </p>
          <UPageList :items="benefits" />
        </template>
      </UPageColumns>
    </UPageSection>

    <!-- Pricing Section -->
    <UPageSection
      headline="Pricing"
      title="Simple, Transparent Pricing"
      description="Choose the plan that works for you"
      align="center"
    >
      <UPricingPlans :plans="plans" />
    </UPageSection>

    <!-- Testimonials -->
    <UPageSection
      headline="Testimonials"
      title="Loved by Developers"
      align="center"
    >
      <UPageGrid :columns="3">
        <UCard v-for="testimonial in testimonials" :key="testimonial.name">
          <p class="text-muted mb-4">"{{ testimonial.quote }}"</p>
          <div class="flex items-center gap-3">
            <UAvatar :src="testimonial.avatar" :alt="testimonial.name" />
            <div>
              <div class="font-medium">{{ testimonial.name }}</div>
              <div class="text-sm text-muted">{{ testimonial.role }}</div>
            </div>
          </div>
        </UCard>
      </UPageGrid>
    </UPageSection>

    <!-- CTA Section -->
    <UPageCTA
      title="Ready to Get Started?"
      description="Join thousands of developers building with Nuxt UI"
      :card="true"
      :links="[
        { label: 'Start Building', to: '/docs', color: 'primary', size: 'lg' },
        { label: 'Contact Sales', to: '/contact', variant: 'outline', size: 'lg' }
      ]"
    />
  </div>
</template>

<script setup lang="ts">
const logos = [
  { src: '/logos/company1.svg', alt: 'Company 1' },
  { src: '/logos/company2.svg', alt: 'Company 2' },
  { src: '/logos/company3.svg', alt: 'Company 3' },
  { src: '/logos/company4.svg', alt: 'Company 4' },
  { src: '/logos/company5.svg', alt: 'Company 5' }
]

const features = [
  {
    icon: 'i-heroicons-cube',
    title: '125+ Components',
    description: 'Comprehensive library covering forms, navigation, overlays, and more.'
  },
  {
    icon: 'i-heroicons-swatch',
    title: 'Fully Themeable',
    description: 'Customize every aspect with Tailwind Variants and CSS variables.'
  },
  {
    icon: 'i-heroicons-check-badge',
    title: 'Accessible',
    description: 'Built on Reka UI with full WAI-ARIA compliance out of the box.'
  },
  {
    icon: 'i-heroicons-bolt',
    title: 'Blazing Fast',
    description: 'Tailwind CSS v4 delivers 5x faster build times.'
  },
  {
    icon: 'i-heroicons-code-bracket',
    title: 'TypeScript Ready',
    description: 'Full type safety with auto-generated types.'
  },
  {
    icon: 'i-heroicons-moon',
    title: 'Dark Mode',
    description: 'Built-in dark mode with system preference detection.'
  }
]

const benefits = [
  { label: 'Zero configuration required' },
  { label: 'Auto-imports for all components' },
  { label: 'Full TypeScript support' },
  { label: 'SSR compatible out of the box' }
]

const plans = [
  {
    title: 'Free',
    price: '$0',
    cycle: '/forever',
    description: 'Perfect for side projects',
    features: [
      { label: 'All 125+ components', included: true },
      { label: 'Community support', included: true },
      { label: 'MIT License', included: true }
    ],
    button: { label: 'Get Started', variant: 'outline' }
  },
  {
    title: 'Pro',
    price: '$199',
    cycle: '/year',
    highlight: true,
    badge: 'Popular',
    description: 'For professional teams',
    features: [
      { label: 'Everything in Free', included: true },
      { label: 'Premium templates', included: true },
      { label: 'Priority support', included: true },
      { label: 'Figma Kit', included: true }
    ],
    button: { label: 'Buy Now', color: 'primary' }
  }
]

const testimonials = [
  {
    name: 'John Doe',
    role: 'Senior Developer',
    avatar: '/avatars/john.jpg',
    quote: 'Nuxt UI has completely transformed how we build interfaces.'
  },
  {
    name: 'Jane Smith',
    role: 'Tech Lead',
    avatar: '/avatars/jane.jpg',
    quote: 'The component quality and accessibility are outstanding.'
  },
  {
    name: 'Bob Johnson',
    role: 'Founder',
    avatar: '/avatars/bob.jpg',
    quote: 'We shipped our MVP in half the time thanks to Nuxt UI.'
  }
]
</script>
