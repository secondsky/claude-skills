# Editor Configuration for Nuxt Studio

Complete guide for configuring Monaco, TipTap, and Form editors in Nuxt Studio.

## Overview

Nuxt Studio provides three editor types that can be configured globally or per content type:

1. **Monaco Editor**: Code editor for markdown, YAML, JSON
2. **TipTap Editor**: Visual WYSIWYG editor with MDC component support (default)
3. **Form Editor**: Schema-driven form for YAML/JSON files

## Default Editor Configuration

### Set Global Default Editor

Configure in `nuxt.config.ts`:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxt/studio'],

  studio: {
    editor: {
      default: 'tiptap'  // 'tiptap' | 'monaco' | 'form'
    }
  }
})
```

### Editor Selection Priority

Studio determines which editor to use:

1. **User preference**: User's last selected editor (stored in browser)
2. **Content type**: File extension-based configuration
3. **Global default**: Configured default editor
4. **Fallback**: TipTap (built-in default)

---

## Monaco Editor

Monaco is the code editor from VS Code. Best for:
- Editing raw markdown with full syntax control
- Working with YAML frontmatter directly
- Editing JSON configuration files
- Developers comfortable with code editors

### Enable Monaco as Default

```typescript
export default defineNuxtConfig({
  studio: {
    editor: {
      default: 'monaco'
    }
  }
})
```

### Monaco Configuration Options

```typescript
export default defineNuxtConfig({
  studio: {
    editor: {
      monaco: {
        theme: 'vs-dark',  // 'vs-light' | 'vs-dark' | 'hc-black'
        fontSize: 14,
        wordWrap: 'on',  // 'off' | 'on' | 'wordWrapColumn' | 'bounded'
        lineNumbers: 'on',  // 'on' | 'off' | 'relative'
        minimap: {
          enabled: true
        },
        formatOnSave: true
      }
    }
  }
})
```

### Monaco for Specific File Types

Configure Monaco for certain file extensions:

```typescript
export default defineNuxtConfig({
  studio: {
    editor: {
      default: 'tiptap',  // Use TipTap by default
      overrides: {
        '.yaml': 'monaco',  // Use Monaco for YAML files
        '.json': 'monaco',  // Use Monaco for JSON files
        '.md': 'tiptap'     // Use TipTap for markdown
      }
    }
  }
})
```

### Monaco Features

**Syntax Highlighting**:
- Markdown
- YAML
- JSON
- HTML
- Vue components

**IntelliSense**:
- Auto-completion for YAML frontmatter
- Markdown syntax suggestions
- Vue component props (if configured)

**Keybindings**:
- Standard VS Code shortcuts
- `Cmd/Ctrl + S`: Save
- `Cmd/Ctrl + F`: Find
- `Cmd/Ctrl + H`: Replace

---

## TipTap Editor (Default)

TipTap is a visual WYSIWYG editor. Best for:
- Content writers and non-technical users
- Visual editing without markdown syntax
- MDC component insertion
- Rich text formatting

### Enable TipTap as Default

```typescript
export default defineNuxtConfig({
  studio: {
    editor: {
      default: 'tiptap'
    }
  }
})
```

### TipTap Configuration Options

```typescript
export default defineNuxtConfig({
  studio: {
    editor: {
      tiptap: {
        toolbar: {
          enabled: true,
          items: [
            'bold',
            'italic',
            'strike',
            'code',
            'heading',
            'bulletList',
            'orderedList',
            'blockquote',
            'codeBlock',
            'link',
            'image',
            'table'
          ]
        },
        extensions: {
          // Enable/disable specific extensions
          bold: true,
          italic: true,
          strike: true,
          code: true,
          heading: { levels: [1, 2, 3, 4, 5, 6] },
          link: true,
          image: true,
          codeBlock: { languages: ['javascript', 'typescript', 'vue', 'css'] }
        }
      }
    }
  }
})
```

### MDC Component Support

TipTap supports MDC (Markdown Components):

```markdown
::alert{type="info"}
This is an info alert using MDC syntax
::

::code-block{language="typescript"}
const hello = 'world'
::
```

**Configure MDC components**:

```typescript
export default defineNuxtConfig({
  content: {
    experimental: {
      clientDB: true  // Enable client-side component rendering
    }
  },
  studio: {
    editor: {
      tiptap: {
        mdc: {
          enabled: true,
          components: ['Alert', 'CodeBlock', 'Card', 'Badge']
        }
      }
    }
  }
})
```

### TipTap Toolbar Customization

Customize toolbar buttons:

```typescript
export default defineNuxtConfig({
  studio: {
    editor: {
      tiptap: {
        toolbar: {
          items: [
            'bold',
            'italic',
            'strike',
            '|',  // Separator
            'heading',
            '|',
            'bulletList',
            'orderedList',
            '|',
            'link',
            'image',
            '|',
            'codeBlock',
            'blockquote'
          ]
        }
      }
    }
  }
})
```

### TipTap Slash Commands

Enable slash commands for quick insertions:

```typescript
export default defineNuxtConfig({
  studio: {
    editor: {
      tiptap: {
        slashCommands: {
          enabled: true,
          commands: [
            { name: 'heading1', label: 'Heading 1', icon: 'h1' },
            { name: 'heading2', label: 'Heading 2', icon: 'h2' },
            { name: 'bulletList', label: 'Bullet List', icon: 'list-ul' },
            { name: 'codeBlock', label: 'Code Block', icon: 'code' },
            { name: 'image', label: 'Image', icon: 'image' }
          ]
        }
      }
    }
  }
})
```

Users can type `/` to show quick insertion menu.

---

## Form Editor

Form editor is schema-driven for structured content. Best for:
- YAML configuration files
- JSON data files
- Structured metadata editing
- Non-technical users editing settings

### Enable Form Editor

```typescript
export default defineNuxtConfig({
  studio: {
    editor: {
      default: 'form',
      // Or for specific file types
      overrides: {
        'config.yaml': 'form',
        'settings.json': 'form'
      }
    }
  }
})
```

### Define Form Schemas

Create schemas for form-based editing:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  studio: {
    editor: {
      form: {
        schemas: {
          // Schema for blog post frontmatter
          'content/blog/*.md': {
            fields: [
              {
                name: 'title',
                type: 'string',
                label: 'Title',
                required: true
              },
              {
                name: 'description',
                type: 'text',
                label: 'Description',
                required: true
              },
              {
                name: 'date',
                type: 'date',
                label: 'Publish Date',
                required: true
              },
              {
                name: 'tags',
                type: 'array',
                label: 'Tags',
                itemType: 'string'
              },
              {
                name: 'featured',
                type: 'boolean',
                label: 'Featured Post',
                default: false
              },
              {
                name: 'author',
                type: 'select',
                label: 'Author',
                options: ['John Doe', 'Jane Smith', 'Bob Johnson']
              },
              {
                name: 'category',
                type: 'select',
                label: 'Category',
                options: [
                  { label: 'Technology', value: 'tech' },
                  { label: 'Design', value: 'design' },
                  { label: 'Business', value: 'business' }
                ]
              }
            ]
          }
        }
      }
    }
  }
})
```

### Form Field Types

Supported field types:

- **string**: Single-line text input
- **text**: Multi-line textarea
- **number**: Numeric input
- **boolean**: Checkbox
- **date**: Date picker
- **datetime**: Date and time picker
- **select**: Dropdown selection
- **array**: List of items
- **object**: Nested object
- **image**: Image upload/selector
- **file**: File upload/selector

### Form Validation

Add validation rules:

```typescript
{
  name: 'email',
  type: 'string',
  label: 'Email',
  required: true,
  validation: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  }
}
```

### Conditional Fields

Show fields based on other field values:

```typescript
{
  name: 'postType',
  type: 'select',
  label: 'Post Type',
  options: ['article', 'video', 'podcast']
},
{
  name: 'videoUrl',
  type: 'string',
  label: 'Video URL',
  condition: {
    field: 'postType',
    value: 'video'
  }
}
```

---

## Per-Collection Configuration

Configure editors for specific content collections:

```typescript
export default defineNuxtConfig({
  studio: {
    collections: {
      blog: {
        editor: 'tiptap',  // Blog posts use TipTap
        tiptap: {
          toolbar: {
            items: ['bold', 'italic', 'link', 'heading', 'image']
          }
        }
      },
      docs: {
        editor: 'monaco',  // Docs use Monaco for precise editing
        monaco: {
          theme: 'vs-dark'
        }
      },
      config: {
        editor: 'form',  // Config files use Form editor
        form: {
          schema: {
            fields: [
              { name: 'siteName', type: 'string', required: true },
              { name: 'siteUrl', type: 'string', required: true },
              { name: 'analytics', type: 'boolean' }
            ]
          }
        }
      }
    }
  }
})
```

---

## Media Library Configuration

Configure media library for image/file uploads:

```typescript
export default defineNuxtConfig({
  studio: {
    media: {
      enabled: true,
      storage: 'cloudflare-r2',  // 'local' | 'cloudflare-r2' | 's3'
      formats: ['jpeg', 'png', 'gif', 'webp', 'avif', 'svg'],
      maxFileSize: 10 * 1024 * 1024,  // 10MB
      thumbnails: {
        enabled: true,
        sizes: [
          { width: 200, height: 200, name: 'thumb' },
          { width: 800, height: 600, name: 'medium' },
          { width: 1920, height: 1080, name: 'large' }
        ]
      }
    }
  }
})
```

### Cloudflare R2 for Media

Configure R2 bucket for Studio media:

```typescript
export default defineNuxtConfig({
  studio: {
    media: {
      storage: 'cloudflare-r2',
      r2: {
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
        bucketName: 'studio-media',
        publicUrl: 'https://media.yourdomain.com'
      }
    }
  }
})
```

---

## Editor Switching

Allow users to switch between editors:

```typescript
export default defineNuxtConfig({
  studio: {
    editor: {
      allowSwitching: true,  // Show editor switcher in UI
      default: 'tiptap',
      available: ['tiptap', 'monaco']  // Available editors for user
    }
  }
})
```

Users see a dropdown to switch between available editors.

---

## Custom Editor Themes

### Monaco Themes

```typescript
export default defineNuxtConfig({
  studio: {
    editor: {
      monaco: {
        theme: 'vs-dark',  // Built-in: 'vs-light', 'vs-dark', 'hc-black'
        // Or define custom theme
        customTheme: {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: 'comment', foreground: '6A9955' },
            { token: 'keyword', foreground: '569CD6' }
          ],
          colors: {
            'editor.background': '#1E1E1E',
            'editor.foreground': '#D4D4D4'
          }
        }
      }
    }
  }
})
```

### TipTap Themes

```typescript
export default defineNuxtConfig({
  studio: {
    editor: {
      tiptap: {
        theme: {
          backgroundColor: '#ffffff',
          textColor: '#1a202c',
          accentColor: '#3b82f6',
          borderColor: '#e5e7eb'
        }
      }
    }
  }
})
```

---

## Accessibility Configuration

Configure accessibility features:

```typescript
export default defineNuxtConfig({
  studio: {
    editor: {
      accessibility: {
        highContrast: true,
        keyboardNavigation: true,
        screenReaderSupport: true,
        fontSize: {
          min: 12,
          max: 24,
          default: 14
        }
      }
    }
  }
})
```

---

## Editor Performance

### Monaco Performance

```typescript
export default defineNuxtConfig({
  studio: {
    editor: {
      monaco: {
        // Disable features for better performance
        minimap: { enabled: false },
        lineNumbers: 'off',
        folding: false,
        renderWhitespace: 'none'
      }
    }
  }
})
```

### TipTap Performance

```typescript
export default defineNuxtConfig({
  studio: {
    editor: {
      tiptap: {
        // Lazy load extensions
        lazyExtensions: true,
        // Debounce save
        saveDebounce: 500,  // ms
        // Limit history
        history: {
          depth: 100  // Undo/redo depth
        }
      }
    }
  }
})
```

---

## Best Practices

### Editor Selection by Use Case

**Choose Monaco when**:
- Users are developers or technical writers
- Precise control over markdown syntax needed
- Working with YAML/JSON configuration files
- Users prefer code editors

**Choose TipTap when**:
- Users are content writers or non-technical
- Visual formatting is important
- MDC components are heavily used
- Rich text editing needed

**Choose Form when**:
- Content has strict structure
- Users are non-technical
- Validation and constraints required
- Editing configuration files

### Progressive Enhancement

Start with TipTap (visual) and allow switching to Monaco:

```typescript
export default defineNuxtConfig({
  studio: {
    editor: {
      default: 'tiptap',
      allowSwitching: true,
      available: ['tiptap', 'monaco']
    }
  }
})
```

### Testing Editors

Test all configured editors:

1. Create test content file
2. Open in Studio
3. Test each editor type
4. Verify formatting preserved
5. Check MDC component rendering
6. Test save and Git commit

---

## Troubleshooting

### Editor Not Loading

**Issue**: Editor UI blank or shows error

**Solutions**:
1. Check browser console for JavaScript errors
2. Verify Studio module installed correctly
3. Clear browser cache
4. Check Nuxt Content module is loaded first
5. Verify content directory exists

### Monaco Theme Not Applying

**Issue**: Custom Monaco theme not visible

**Solutions**:
1. Verify theme configuration in `nuxt.config.ts`
2. Check theme JSON syntax
3. Reload Studio page
4. Try built-in themes first ('vs-dark', 'vs-light')

### TipTap Toolbar Missing

**Issue**: Toolbar not showing in TipTap editor

**Solutions**:
1. Check `toolbar.enabled: true` in config
2. Verify toolbar items are valid
3. Check for CSS conflicts
4. Inspect element in browser DevTools

### Form Editor Schema Not Working

**Issue**: Form fields not appearing

**Solutions**:
1. Verify schema syntax in `nuxt.config.ts`
2. Check field types are valid
3. Match schema path pattern to content file
4. Test with simple schema first

---

## Next Steps

After configuring editors:

1. **Test all editor types** with sample content
2. **Train users** on editor features and shortcuts
3. **Document editor choice** for different content types
4. **Monitor performance** and adjust settings
5. **Collect feedback** from content editors
