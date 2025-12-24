# Common WordPress Hooks Reference

Quick reference for the most commonly used WordPress hooks in plugin development.

---

## Action Hooks

### Plugin Lifecycle

| Hook | When It Fires | Use For |
|------|--------------|---------|
| `plugins_loaded` | After all plugins loaded | Init plugin functionality |
| `init` | WordPress initialization | Register post types, taxonomies |
| `admin_init` | Admin initialization | Register settings |
| `wp_loaded` | WordPress fully loaded | Late initialization |

### Admin Hooks

| Hook | When It Fires | Use For |
|------|--------------|---------|
| `admin_menu` | Admin menu creation | Add admin pages |
| `admin_enqueue_scripts` | Admin assets loading | Enqueue admin CSS/JS |
| `admin_notices` | Admin notices display | Show admin messages |
| `save_post` | After post saved | Save custom data |
| `add_meta_boxes` | Meta boxes registration | Add meta boxes |

### Frontend Hooks

| Hook | When It Fires | Use For |
|------|--------------|---------|
| `wp_enqueue_scripts` | Frontend assets loading | Enqueue CSS/JS |
| `wp_head` | In `<head>` section | Add meta tags, styles |
| `wp_footer` | Before `</body>` | Add scripts, analytics |
| `template_redirect` | Before template loaded | Redirects, custom templates |
| `the_content` (filter) | Post content display | Modify post content |

### AJAX Hooks

| Hook | Use For |
|------|---------|
| `wp_ajax_{action}` | Logged-in AJAX |
| `wp_ajax_nopriv_{action}` | Public AJAX |

### REST API

| Hook | When It Fires | Use For |
|------|--------------|---------|
| `rest_api_init` | REST API init | Register REST routes |

---

## Filter Hooks

### Content Filters

| Hook | What It Filters | Common Use |
|------|----------------|------------|
| `the_content` | Post content | Add/modify content |
| `the_title` | Post title | Modify titles |
| `the_excerpt` | Post excerpt | Customize excerpts |
| `comment_text` | Comment text | Modify comments |

### Query Filters

| Hook | What It Filters | Common Use |
|------|----------------|------------|
| `pre_get_posts` | Query before execution | Modify queries |
| `posts_where` | SQL WHERE clause | Custom WHERE |
| `posts_orderby` | SQL ORDER BY | Custom sorting |

### Admin Filters

| Hook | What It Filters | Common Use |
|------|----------------|------------|
| `manage_{post_type}_posts_columns` | Admin columns | Add columns |
| `admin_footer_text` | Admin footer text | Custom footer |

---

##  Hook Priority

Default priority is `10`. Lower numbers run first.

```php
// Runs early (priority 5)
add_action( 'init', 'my_function', 5 );

// Runs late (priority 20)
add_action( 'init', 'my_other_function', 20 );
```

---

## Resources

- **Hook Reference**: https://developer.wordpress.org/reference/hooks/
- **Plugin API**: https://codex.wordpress.org/Plugin_API
