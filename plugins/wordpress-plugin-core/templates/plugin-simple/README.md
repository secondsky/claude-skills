# Simple WordPress Plugin Template

This is a functional programming pattern for WordPress plugins. Best for small to medium plugins that don't require complex object-oriented architecture.

## Features

✅ Complete plugin header with all fields
✅ ABSPATH security check
✅ Unique function prefix (mysp_)
✅ Custom post type registration (Books)
✅ Admin settings page with nonce verification
✅ AJAX handler with security checks
✅ Proper activation/deactivation hooks
✅ Uninstall script for cleanup
✅ Internationalization ready
✅ Conditional asset loading
✅ Security best practices (sanitization, escaping, capability checks)

## Installation

1. Copy this folder to `wp-content/plugins/`
2. Rename folder and files to match your plugin name
3. Find and replace the following:
   - `My Simple Plugin` → Your plugin name
   - `my-simple-plugin` → your-plugin-slug
   - `mysp_` → yourprefix_
   - `MYSP_` → YOURPREFIX_
   - `https://example.com` → Your website
   - `Your Name` → Your name
4. Activate in WordPress admin

## Structure

```
my-simple-plugin/
├── my-simple-plugin.php    # Main plugin file
├── uninstall.php            # Cleanup on uninstall
├── README.md                # This file
├── assets/                  # CSS/JS files (create as needed)
│   ├── css/
│   │   ├── admin-style.css
│   │   └── style.css
│   └── js/
│       ├── admin-script.js
│       └── script.js
└── languages/               # Translation files (create as needed)
```

## Included Examples

### Custom Post Type
- Registers "Books" post type
- Gutenberg-enabled
- Archive page support
- Custom rewrite slug

### Settings Page
- Located in Settings → Simple Plugin
- Nonce verification
- Sanitization and validation
- Settings error handling

### AJAX Handler
- Action: `wp_ajax_mysp_action`
- Nonce verification
- Capability checking
- JSON response

### Activation/Deactivation
- Flushes rewrite rules
- Sets default options
- Cleans up scheduled events

### Uninstall
- Deletes all plugin options
- Clears transients
- Multisite support
- Optional: Delete custom post type data

## Security Checklist

- [x] ABSPATH check at top of file
- [x] Unique function prefix (mysp_)
- [x] Nonces for all forms
- [x] Capability checks (current_user_can)
- [x] Input sanitization (sanitize_text_field)
- [x] Output escaping (esc_html, esc_attr)
- [x] AJAX nonce verification (check_ajax_referer)
- [x] Conditional asset loading (don't load everywhere)
- [x] Proper uninstall cleanup

## Next Steps

1. Create the `assets/` directory structure
2. Add your CSS and JavaScript files
3. Extend with additional features:
   - Meta boxes
   - Shortcodes
   - Widgets
   - REST API endpoints
   - Custom taxonomies
   - WP-CLI commands

## Distribution & Auto-Updates

### Enabling GitHub Auto-Updates

You can provide automatic updates from GitHub without submitting to WordPress.org:

**1. Install Plugin Update Checker library:**

```bash
cd your-plugin/
git submodule add https://github.com/YahnisElsts/plugin-update-checker.git
```

**2. Add to your main plugin file:**

```php
// Include Plugin Update Checker
require plugin_dir_path( __FILE__ ) . 'plugin-update-checker/plugin-update-checker.php';
use YahnisElsts\PluginUpdateChecker\v5\PucFactory;

// Initialize update checker
$updateChecker = PucFactory::buildUpdateChecker(
    'https://github.com/yourusername/your-plugin/',
    __FILE__,
    'your-plugin-slug'
);

// Set branch (default: main)
$updateChecker->setBranch( 'main' );

// Use GitHub Releases (recommended)
$updateChecker->getVcsApi()->enableReleaseAssets();
```

**3. For private repos, add token to wp-config.php:**

```php
define( 'YOUR_PLUGIN_GITHUB_TOKEN', 'ghp_xxxxxxxxxxxxx' );
```

Then in your plugin:

```php
if ( defined( 'YOUR_PLUGIN_GITHUB_TOKEN' ) ) {
    $updateChecker->setAuthentication( YOUR_PLUGIN_GITHUB_TOKEN );
}
```

**4. Create releases:**

```bash
# Update version in plugin header
git add my-simple-plugin.php
git commit -m "Bump version to 1.0.1"
git tag 1.0.1
git push origin main
git push origin 1.0.1

# Create GitHub Release (optional but recommended)
# - Upload pre-built ZIP file
# - Add release notes
```

### Resources

- **Complete Guide**: See `references/github-auto-updates.md`
- **Implementation Examples**: See `examples/github-updater.php`
- **Plugin Update Checker**: https://github.com/YahnisElsts/plugin-update-checker

## Resources

- [WordPress Plugin Handbook](https://developer.wordpress.org/plugins/)
- [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/)
- [Plugin Security](https://developer.wordpress.org/apis/security/)

## License

GPL v2 or later
