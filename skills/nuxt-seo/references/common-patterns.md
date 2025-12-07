# Nuxt SEO - Common Patterns

Real-world usage patterns and examples for Nuxt SEO modules.

---

## Table of Contents

1. [Blog Site Pattern](#blog-site-pattern)
2. [E-commerce Pattern](#e-commerce-pattern)
3. [Multi-Language Pattern](#multi-language-pattern)
4. [Corporate Website Pattern](#corporate-website-pattern)
5. [Environment-Based Configuration](#environment-based-configuration)
6. [Custom OG Image Component Pattern](#custom-og-image-component-pattern)
7. [Breadcrumbs with Schema.org Pattern](#breadcrumbs-with-schemaorg-pattern)
8. [FAQ Page Pattern](#faq-page-pattern)

---


## Blog Site Pattern

### Complete Setup

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL,
    name: 'My Blog',
    description: 'Thoughts and tutorials',
    defaultLocale: 'en'
  },

  robots: {
    disallow: ['/admin', '/drafts'],
    sitemap: `${process.env.NUXT_PUBLIC_SITE_URL}/sitemap.xml`
  },

  sitemap: {
    strictNuxtContentPaths: true,
    sitemaps: {
      pages: {
        includeAppSources: true
      },
      posts: {
        sources: ['/api/__sitemap__/posts']
      }
    },
    defaults: {
      changefreq: 'weekly',
      priority: 0.7
    }
  },

  ogImage: {
    renderer: 'satori',
    fonts: ['Inter:400', 'Inter:700']
  },

  schemaOrg: {
    identity: {
      type: 'Person',
      name: 'Your Name',
      url: process.env.NUXT_PUBLIC_SITE_URL
    }
  }
})
```

### Blog Post Page

```vue
<!-- pages/blog/[slug].vue -->
<script setup>
const route = useRoute()
const { data: post } = await useFetch(`/api/posts/${route.params.slug}`)

// Meta tags
useSeoMeta({
  title: post.value.title,
  description: post.value.excerpt,
  ogTitle: post.value.title,
  ogDescription: post.value.excerpt,
  ogImage: post.value.coverImage,
  ogType: 'article',
  twitterCard: 'summary_large_image'
})

// OG Image
defineOgImageComponent('BlogPost', {
  title: post.value.title,
  author: post.value.author.name,
  date: post.value.publishedAt,
  coverImage: post.value.coverImage
})

// Schema.org
useSchemaOrg([
  {
    '@type': 'BlogPosting',
    headline: post.value.title,
    image: post.value.coverImage,
    datePublished: post.value.publishedAt,
    dateModified: post.value.updatedAt,
    author: {
      '@type': 'Person',
      name: post.value.author.name,
      url: post.value.author.url
    },
    publisher: {
      '@type': 'Person',
      name: 'Your Name'
    },
    description: post.value.excerpt,
    articleBody: post.value.content
  }
])
</script>

<template>
  <article>
    <h1>{{ post.title }}</h1>
    <div v-html="post.content" />
  </article>
</template>
```

### Dynamic Blog Sitemap

```typescript
// server/api/__sitemap__/posts.ts
export default defineSitemapEventHandler(async () => {
  const posts = await $fetch('/api/posts')

  return posts.map(post => ({
    loc: `/blog/${post.slug}`,
    lastmod: post.updatedAt,
    changefreq: 'monthly',
    priority: 0.8
  }))
})
```

---

## E-commerce Pattern

### Complete Setup

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL,
    name: 'My Store',
    description: 'Quality products'
  },

  robots: {
    disallow: ['/admin', '/checkout', '/account']
  },

  sitemap: {
    sitemaps: {
      pages: {
        includeAppSources: true,
        exclude: ['/checkout/**', '/account/**']
      },
      products: {
        sources: ['/api/__sitemap__/products'],
        defaults: {
          changefreq: 'daily',
          priority: 0.9
        }
      },
      categories: {
        sources: ['/api/__sitemap__/categories'],
        defaults: {
          changefreq: 'weekly',
          priority: 0.7
        }
      }
    },
    chunksSize: 1000
  },

  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'My Store',
      url: process.env.NUXT_PUBLIC_SITE_URL,
      logo: `${process.env.NUXT_PUBLIC_SITE_URL}/logo.png`
    }
  }
})
```

### Product Page

```vue
<!-- pages/products/[id].vue -->
<script setup>
const route = useRoute()
const product = await $fetch(`/api/products/${route.params.id}`)

// Meta tags
useSeoMeta({
  title: `${product.name} - Buy Now`,
  description: product.description,
  ogImage: product.mainImage,
  ogType: 'product'
})

// OG Image
defineOgImage({
  title: product.name,
  description: product.tagline,
  image: product.mainImage,
  price: `$${product.price}`
})

// Schema.org Product
useSchemaOrg([
  {
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: product.description,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand
    },
    offers: {
      '@type': 'Offer',
      url: `${useSiteConfig().url}/products/${product.id}`,
      priceCurrency: 'USD',
      price: product.price,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'My Store'
      }
    },
    aggregateRating: product.rating && {
      '@type': 'AggregateRating',
      ratingValue: product.rating.average,
      reviewCount: product.rating.count,
      bestRating: 5,
      worstRating: 1
    }
  },
  {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: useSiteConfig().url
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: product.category.name,
        item: `${useSiteConfig().url}/categories/${product.category.slug}`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `${useSiteConfig().url}/products/${product.id}`
      }
    ]
  }
])
</script>

<template>
  <div>
    <h1>{{ product.name }}</h1>
    <p>{{ product.description }}</p>
    <div>Price: ${{ product.price }}</div>
  </div>
</template>
```

### Products Sitemap

```typescript
// server/api/__sitemap__/products.ts
export default defineSitemapEventHandler(async () => {
  const products = await $fetch('/api/products')

  return products.map(product => ({
    loc: `/products/${product.id}`,
    lastmod: product.updatedAt,
    changefreq: 'daily',
    priority: 0.9,
    images: product.images.map(img => ({
      loc: img.url,
      caption: img.alt,
      title: product.name
    }))
  }))
})
```

---

## Multi-Language Pattern

### Setup

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo', '@nuxtjs/i18n'],

  i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'fr', name: 'Français', file: 'fr.json' },
      { code: 'es', name: 'Español', file: 'es.json' }
    ],
    defaultLocale: 'en',
    strategy: 'prefix'
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL,
    name: 'My Site',
    defaultLocale: 'en'
  },

  ogImage: {
    fonts: [
      'Inter:400',
      'Inter:700',
      'Noto Sans SC:400', // Chinese
      'Noto Sans JP:400', // Japanese
      'Noto Sans KR:400'  // Korean
    ]
  }
})
```

### Localized Page

```vue
<script setup>
const { locale, t } = useI18n()
const localePath = useLocalePath()

useSeoMeta({
  title: t('home.title'),
  description: t('home.description'),
  ogLocale: locale.value
})

useSchemaOrg([
  {
    '@type': 'WebPage',
    name: t('home.title'),
    description: t('home.description'),
    inLanguage: locale.value
  }
])
</script>
```

---

## Corporate Website Pattern

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    'nuxt-site-config',
    'nuxt-robots',
    'nuxt-sitemap',
    'nuxt-og-image',
    'nuxt-schema-org'
  ],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL,
    name: 'My Company',
    description: 'Leading provider of...'
  },

  robots: {
    disallow: ['/admin', '/internal']
  },

  sitemap: {
    defaults: {
      changefreq: 'monthly',
      priority: 0.7
    }
  },

  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'My Company',
      url: process.env.NUXT_PUBLIC_SITE_URL,
      logo: `${process.env.NUXT_PUBLIC_SITE_URL}/logo.png`,
      sameAs: [
        'https://twitter.com/mycompany',
        'https://facebook.com/mycompany',
        'https://linkedin.com/company/mycompany'
      ],
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+1-555-123-4567',
          contactType: 'customer service',
          email: 'support@example.com',
          availableLanguage: ['en', 'es']
        }
      ]
    }
  },

  routeRules: {
    '/': { sitemap: { changefreq: 'weekly', priority: 1.0 } },
    '/about': { sitemap: { changefreq: 'monthly', priority: 0.8 } },
    '/contact': { sitemap: { changefreq: 'monthly', priority: 0.8 } }
  }
})
```

---

## Environment-Based Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  },

  robots: {
    // Block all in development/staging
    disallow: ['development', 'staging'].includes(process.env.NUXT_PUBLIC_ENV || '')
      ? ['/']
      : ['/admin'],

    // Only include sitemap in production
    sitemap: process.env.NUXT_PUBLIC_ENV === 'production'
      ? `${process.env.NUXT_PUBLIC_SITE_URL}/sitemap.xml`
      : undefined
  },

  sitemap: {
    // Disable in non-production
    enabled: process.env.NUXT_PUBLIC_ENV === 'production'
  },

  linkChecker: {
    // Enable only in development
    enabled: process.env.NODE_ENV === 'development',
    showLiveInspections: true,
    failOnError: false
  }
})
```

---

## Custom OG Image Component Pattern

### Component

```vue
<!-- components/OgImage.vue -->
<template>
  <div class="w-[1200px] h-[630px] flex flex-col justify-between p-16 bg-gradient-to-br from-blue-600 to-purple-700">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <img v-if="logo" :src="logo" class="h-20" />
      <div class="text-2xl text-white/80">{{ siteName }}</div>
    </div>

    <!-- Content -->
    <div class="flex-1 flex items-center">
      <div>
        <h1 class="text-7xl font-bold text-white mb-6 leading-tight">
          {{ title }}
        </h1>
        <p v-if="description" class="text-3xl text-white/90">
          {{ description }}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between text-white/70 text-xl">
      <div v-if="author">
        By {{ author }}
      </div>
      <div v-if="date">
        {{ formatDate(date) }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  description: String,
  siteName: String,
  logo: String,
  author: String,
  date: String
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>
```

### Usage

```vue
<script setup>
defineOgImageComponent('OgImage', {
  title: 'My Page Title',
  description: 'Page description',
  siteName: 'My Site',
  logo: 'https://example.com/logo.png',
  author: 'John Doe',
  date: '2025-01-10'
})
</script>
```

---

## Breadcrumbs with Schema.org Pattern

```vue
<script setup>
const breadcrumbs = useBreadcrumbItems()

// Add breadcrumb schema
useSchemaOrg([
  {
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `${useSiteConfig().url}${item.to}`
    }))
  }
])
</script>

<template>
  <nav aria-label="Breadcrumb" class="mb-4">
    <ol class="flex items-center space-x-2 text-sm text-gray-600">
      <li v-for="(item, index) in breadcrumbs" :key="index" class="flex items-center">
        <NuxtLink :to="item.to" class="hover:text-gray-900">
          {{ item.label }}
        </NuxtLink>
        <span v-if="index < breadcrumbs.length - 1" class="mx-2">/</span>
      </li>
    </ol>
  </nav>
</template>
```

---

## FAQ Page Pattern

```vue
<script setup>
const faqs = [
  {
    question: 'What is Nuxt?',
    answer: 'Nuxt is a Vue.js framework for building web applications.'
  },
  {
    question: 'How do I install Nuxt?',
    answer: 'Run: npx nuxi@latest init my-app'
  }
]

// FAQ Schema
useSchemaOrg([
  {
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
])
</script>

<template>
  <div>
    <h1>Frequently Asked Questions</h1>
    <div v-for="(faq, index) in faqs" :key="index">
      <h2>{{ faq.question }}</h2>
      <p>{{ faq.answer }}</p>
    </div>
  </div>
</template>
```

---

**Last Updated**: 2025-11-10
**Usage**: Copy and adapt these patterns for your specific needs
