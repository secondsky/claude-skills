---
title: "Getting Started"
weight: 1
---

# Getting Started

Learn how to set up and use this documentation site.

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/yourrepo.git
cd yourrepo
```

2. Initialize Git submodules (for the theme):
```bash
git submodule update --init --recursive
```

3. Run the development server:
```bash
hugo server
```

4. Open your browser to `http://localhost:1313`

## Project Structure

```
your-docs-site/
├── hugo.yaml          # Site configuration
├── content/           # Markdown documentation files
│   ├── _index.md      # Homepage
│   └── docs/          # Documentation pages
├── static/            # Static assets (images, etc.)
├── themes/            # Hugo Book theme
└── public/            # Generated site (after build)
```

## Creating Content

Create a new documentation page:

```bash
hugo new content docs/my-page.md
```

This creates a file in `content/docs/my-page.md` with frontmatter already set up.

## Next Steps

- Check out the [Configuration](/docs/configuration) guide
- Learn about [Customization](/docs/advanced/customization)
