---
title: "Configuration"
weight: 2
---

# Configuration

Learn how to configure your Hugo Book documentation site.

## Basic Configuration

The main configuration file is `hugo.yaml`:

```yaml
baseURL: "https://example.org/"
title: "Documentation Site"
theme: "hugo-book"
languageCode: "en-us"
```

## Hugo Book Parameters

### Search

Enable search functionality:

```yaml
params:
  BookSearch: true

outputs:
  home:
    - HTML
    - RSS
    - JSON  # Required for search
```

### Table of Contents

Configure TOC behavior:

```yaml
params:
  # Enable TOC
  BookToC: true

  # Maximum levels in section TOC
  BookSectionMaxTOC: 4
```

### Repository Integration

Link to your Git repository:

```yaml
params:
  # Repository URL for "Edit this page" links
  BookRepo: "https://github.com/yourusername/yourrepo"

  # Enable git info (last modified dates)
  BookGitInfo: true

  # Date format
  BookDateFormat: "January 2, 2006"

# Enable Git info globally
enableGitInfo: true
```

## Markdown Configuration

Configure Goldmark (Hugo's markdown processor):

```yaml
markup:
  goldmark:
    renderer:
      unsafe: true  # Allow HTML in markdown
  highlight:
    codeFences: true
    style: monokai
    lineNumbersInTable: true
  tableOfContents:
    endLevel: 6
    startLevel: 2
```

## Menu Configuration

Hugo Book auto-generates menus from content structure, but you can customize:

```yaml
menu:
  before:
    - name: "External Link"
      url: "https://example.com"
      weight: 10
```

## Next Steps

Learn about [Customization](/docs/advanced/customization) options.
