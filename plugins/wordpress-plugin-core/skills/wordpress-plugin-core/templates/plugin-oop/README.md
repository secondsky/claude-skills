# OOP WordPress Plugin Template

This is an object-oriented singleton pattern for WordPress plugins. Best for medium to large plugins that need organized, maintainable architecture.

## Features

✅ Singleton pattern (single instance)
✅ Complete plugin header
✅ ABSPATH security check
✅ Class-based organization
✅ Custom post type and taxonomy
✅ Admin settings page with separate view template
✅ AJAX handlers (logged-in and public)
✅ REST API endpoints
✅ Proper activation/deactivation hooks
✅ Uninstall script for cleanup
✅ Internationalization ready
✅ Conditional asset loading
✅ Security best practices

## Installation

1. Copy this folder to `wp-content/plugins/`
2. Rename folder and files to match your plugin name
3. Find and replace the following:
   - `My_OOP_Plugin` → Your_Plugin_Class_Name
   - `My OOP Plugin` → Your plugin name
   - `my-oop-plugin` → your-plugin-slug
   - `myop_` → yourprefix_
   - `MYOP_` → YOURPREFIX_
   - `https://example.com` → Your website
   - `Your Name` → Your name
4. Activate in WordPress admin

## Structure

```
my-oop-plugin/
├── my-oop-plugin.php        # Main plugin file with class
├── uninstall.php             # Cleanup on uninstall
├── README.md                 # This file
├── views/                    # Template files
│   └── admin-settings.php    # Settings page template
├── assets/                   # CSS/JS files (create as needed)
│   ├── css/
│   │   ├── admin-style.css
│   │   └── style.css
│   └── js/
│       ├── admin-script.js
│       └── script.js
└── languages/                # Translation files (create as needed)
```

## Class Structure

### Singleton Pattern
```php
My_OOP_Plugin::get_instance(); // Get single instance
```

### Key Methods

**Initialization**:
- `__construct()` - Private constructor, sets up plugin
- `define_constants()` - Define plugin constants
- `init_hooks()` - Register WordPress hooks
- `init()` - Initialize functionality on `init` hook

**Post Types & Taxonomies**:
- `register_post_types()` - Register custom post types
- `register_taxonomies()` - Register custom taxonomies

**Admin**:
- `add_admin_menu()` - Add admin menu pages
- `render_settings_page()` - Render settings page
- `save_settings()` - Handle form submission
- `get_settings()` - Get plugin settings

**Assets**:
- `admin_enqueue_scripts()` - Load admin assets
- `enqueue_scripts()` - Load frontend assets

**AJAX**:
- `ajax_handler()` - Handle logged-in AJAX requests
- `ajax_handler_nopriv()` - Handle public AJAX requests
- `process_ajax_data()` - Process AJAX data

**REST API**:
- `register_rest_routes()` - Register REST endpoints
- `rest_permission_check()` - Check permissions
- `rest_get_books()` - GET /wp-json/myop/v1/books
- `rest_get_book()` - GET /wp-json/myop/v1/books/{id}

**Lifecycle**:
- `activate()` - Run on plugin activation
- `deactivate()` - Run on plugin deactivation

## Included Examples

### Custom Post Type & Taxonomy
- "Books" post type with Gutenberg support
- "Genres" hierarchical taxonomy

### Settings Page
- Located in Settings → OOP Plugin
- Separate view template (views/admin-settings.php)
- Multiple field types (text, number, checkbox)
- Nonce verification and sanitization

### AJAX Handlers
- Logged-in: `wp_ajax_myop_action`
- Public: `wp_ajax_nopriv_myop_action`
- Nonce verification and capability checking

### REST API
- `GET /wp-json/myop/v1/books` - List all books
- `GET /wp-json/myop/v1/books/{id}` - Get single book
- Permission callbacks
- Validation and sanitization

## Extending the Plugin

### Add a New Method
```php
/**
 * Your custom method
 *
 * @param string $param Parameter description
 * @return mixed
 */
private function custom_method( $param ) {
    // Your code here
}
```

### Add a New Hook
Add to `init_hooks()`:
```php
add_action( 'hook_name', array( $this, 'method_name' ) );
```

### Add a New REST Endpoint
Add to `register_rest_routes()`:
```php
register_rest_route(
    'myop/v1',
    '/endpoint',
    array(
        'methods'             => 'GET',
        'callback'            => array( $this, 'rest_endpoint_handler' ),
        'permission_callback' => array( $this, 'rest_permission_check' ),
    )
);
```

## Security Checklist

- [x] ABSPATH check at top of file
- [x] Private constructor (singleton)
- [x] Prevent cloning and unserializing
- [x] Nonces for all forms
- [x] Capability checks (current_user_can)
- [x] Input sanitization (sanitize_text_field, absint)
- [x] Output escaping (esc_html, esc_attr)
- [x] AJAX nonce verification (check_ajax_referer)
- [x] REST API permission callbacks
- [x] REST API argument validation
- [x] Conditional asset loading

## Advantages of OOP Pattern

✅ **Organization** - Related code grouped in methods
✅ **Maintainability** - Easy to find and modify functionality
✅ **Encapsulation** - Private methods protect internal logic
✅ **Singleton** - Prevents multiple instances
✅ **Scalability** - Easy to extend with new methods
✅ **Testing** - Methods can be tested individually

## When to Use OOP vs Simple

**Use OOP when**:
- Plugin has 10+ functions
- Need organized, maintainable code
- Multiple developers working on plugin
- Plugin will grow over time
- Need private/protected methods

**Use Simple when**:
- Plugin has <10 functions
- Simple, focused functionality
- One-person project
- Unlikely to grow significantly

## Distribution & Auto-Updates

### Enabling GitHub Auto-Updates

You can provide automatic updates from GitHub without submitting to WordPress.org:

**1. Install Plugin Update Checker library:**

```bash
cd your-plugin/
git submodule add https://github.com/YahnisElsts/plugin-update-checker.git
```

**2. Add to `init_hooks()` method:**

```php
/**
 * Include and initialize update checker
 */
private function init_updater() {
    $updater_path = plugin_dir_path( __FILE__ ) . 'plugin-update-checker/plugin-update-checker.php';

    if ( ! file_exists( $updater_path ) ) {
        return;
    }

    require $updater_path;

    $updateChecker = YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
        'https://github.com/yourusername/your-plugin/',
        __FILE__,
        'your-plugin-slug'
    );

    $updateChecker->setBranch( 'main' );
    $updateChecker->getVcsApi()->enableReleaseAssets();
}
```

Then call it in `init_hooks()`:

```php
private function init_hooks() {
    // Existing hooks...

    // Initialize auto-updates
    $this->init_updater();
}
```

**3. For private repos, add token to wp-config.php:**

```php
define( 'YOUR_PLUGIN_GITHUB_TOKEN', 'ghp_xxxxxxxxxxxxx' );
```

Then update `init_updater()`:

```php
if ( defined( 'MYOP_GITHUB_TOKEN' ) ) {
    $updateChecker->setAuthentication( MYOP_GITHUB_TOKEN );
}
```

**4. Create releases:**

```bash
# Update version in plugin header
git add my-oop-plugin.php
git commit -m "Bump version to 1.0.1"
git tag 1.0.1
git push origin main
git push origin 1.0.1

# Create GitHub Release with pre-built ZIP
```

### Resources

- **Complete Guide**: See `references/github-auto-updates.md`
- **Implementation Examples**: See `examples/github-updater.php`
- **Plugin Update Checker**: https://github.com/YahnisElsts/plugin-update-checker

## Resources

- [WordPress Plugin Handbook](https://developer.wordpress.org/plugins/)
- [WordPress OOP Best Practices](https://developer.wordpress.org/plugins/plugin-basics/best-practices/)
- [Singleton Pattern](https://en.wikipedia.org/wiki/Singleton_pattern)

## License

GPL v2 or later
