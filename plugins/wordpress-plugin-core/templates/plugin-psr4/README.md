# PSR-4 WordPress Plugin Template

This is a modern PSR-4 autoloading pattern for WordPress plugins using Composer. Best for large, complex plugins that need professional architecture with namespaces and autoloading.

## Features

✅ PSR-4 autoloading with Composer
✅ Namespace organization (MyPSR4Plugin\*)
✅ Singleton pattern
✅ Modular class structure by domain
✅ Custom post type with meta boxes
✅ Custom taxonomy
✅ Admin settings using Settings API
✅ REST API endpoints (GET, POST)
✅ Asset management (admin + frontend)
✅ Proper activation/deactivation hooks
✅ Uninstall script for cleanup
✅ Internationalization ready
✅ WordPress Coding Standards ready (PHPCS)
✅ Security best practices

## Installation

1. Copy this folder to `wp-content/plugins/`
2. Rename folder and files to match your plugin name
3. Find and replace the following:
   - `MyPSR4Plugin` → YourPluginNamespace
   - `My PSR-4 Plugin` → Your plugin name
   - `my-psr4-plugin` → your-plugin-slug
   - `mypp_` → yourprefix_
   - `MYPP_` → YOURPREFIX_
   - `yourname/my-psr4-plugin` → your-composer/package-name
   - `https://example.com` → Your website
   - `Your Name` → Your name
4. Run `composer install` in the plugin directory
5. Activate in WordPress admin

## Structure

```
my-psr4-plugin/
├── my-psr4-plugin.php        # Main plugin file (bootstrapper)
├── composer.json              # Composer dependencies and autoloading
├── uninstall.php              # Cleanup on uninstall
├── README.md                  # This file
├── src/                       # Source code (PSR-4 autoloaded)
│   ├── Plugin.php             # Main plugin class
│   ├── PostTypes/             # Custom post types
│   │   └── Book.php
│   ├── Taxonomies/            # Taxonomies
│   │   └── Genre.php
│   ├── Admin/                 # Admin functionality
│   │   └── Settings.php
│   ├── Frontend/              # Frontend functionality
│   │   └── Assets.php
│   └── API/                   # REST API endpoints
│       └── BookEndpoints.php
├── assets/                    # CSS/JS files (create as needed)
│   ├── css/
│   │   ├── admin-style.css
│   │   └── style.css
│   └── js/
│       ├── admin-script.js
│       └── script.js
├── languages/                 # Translation files (create as needed)
└── vendor/                    # Composer dependencies (auto-generated)
```

## Composer Setup

### Install Dependencies

```bash
cd wp-content/plugins/my-psr4-plugin
composer install
```

### Development Dependencies

The template includes WordPress Coding Standards (WPCS) for code quality:

```bash
# Check code standards
composer phpcs

# Fix code standards automatically
composer phpcbf
```

### Update Dependencies

```bash
composer update
```

## Namespaces

The plugin uses the following namespace structure:

- `MyPSR4Plugin\` - Root namespace
- `MyPSR4Plugin\PostTypes\` - Custom post types
- `MyPSR4Plugin\Taxonomies\` - Taxonomies
- `MyPSR4Plugin\Admin\` - Admin functionality
- `MyPSR4Plugin\Frontend\` - Frontend functionality
- `MyPSR4Plugin\API\` - REST API endpoints

## Included Examples

### Custom Post Type (src/PostTypes/Book.php)
- "Books" post type with Gutenberg support
- Meta boxes for ISBN, Author, Publication Year
- Nonce verification and sanitization

### Taxonomy (src/Taxonomies/Genre.php)
- "Genres" hierarchical taxonomy
- Linked to Books post type

### Admin Settings (src/Admin/Settings.php)
- Located in Settings → PSR-4 Plugin
- Uses WordPress Settings API
- Multiple field types with validation

### REST API (src/API/BookEndpoints.php)
- `GET /wp-json/mypp/v1/books` - List all books
- `GET /wp-json/mypp/v1/books/{id}` - Get single book
- `POST /wp-json/mypp/v1/books` - Create book
- Permission callbacks and validation

### Assets (src/Frontend/Assets.php)
- Conditional loading (admin + frontend)
- Localized script data

## Adding New Classes

### 1. Create Class File

Create `src/YourNamespace/YourClass.php`:

```php
<?php
namespace MyPSR4Plugin\YourNamespace;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class YourClass {
    private static $instance = null;

    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        // Initialize
    }
}
```

### 2. Initialize in Plugin.php

Add to `src/Plugin.php` in the `init()` method:

```php
YourNamespace\YourClass::get_instance();
```

### 3. Composer Will Auto-Load

No need to manually require files! Composer's PSR-4 autoloader handles it.

## Security Checklist

- [x] ABSPATH check in every file
- [x] Namespaces prevent naming conflicts
- [x] Private constructors (singletons)
- [x] Nonces for all forms
- [x] Capability checks (current_user_can)
- [x] Input sanitization (sanitize_text_field, absint)
- [x] Output escaping (esc_html, esc_attr)
- [x] REST API permission callbacks
- [x] REST API argument validation
- [x] Conditional asset loading
- [x] Composer autoloader check

## Advantages of PSR-4 Pattern

✅ **Professional** - Industry-standard autoloading
✅ **No manual requires** - Composer handles class loading
✅ **Organized** - Classes grouped by domain/functionality
✅ **Scalable** - Easy to add new features
✅ **Testable** - Each class is independently testable
✅ **Standards** - Compatible with modern PHP tooling
✅ **Namespaces** - Prevents naming conflicts
✅ **Version control** - Clean git diffs (no huge files)

## When to Use PSR-4

**Use PSR-4 when**:
- Plugin has 20+ classes
- Multiple developers
- Need professional architecture
- Plan to add many features over time
- Want to use Composer packages
- Need unit testing
- Building a commercial plugin

**Use OOP when**:
- Plugin has 10-20 classes
- Single developer
- Don't need Composer dependencies

**Use Simple when**:
- Plugin has <10 classes
- Quick, focused functionality

## Development Workflow

### 1. Create New Feature Class

```bash
# Example: Create a new AJAX handler
touch src/AJAX/BookActions.php
```

### 2. Write Class with Namespace

```php
<?php
namespace MyPSR4Plugin\AJAX;

class BookActions {
    // Your code
}
```

### 3. Initialize in Plugin.php

```php
AJAX\BookActions::get_instance();
```

### 4. Test

No need to run `composer dump-autoload` - PSR-4 discovers classes automatically!

## Code Quality

### Check Code Standards

```bash
composer phpcs
```

### Fix Code Standards

```bash
composer phpcbf
```

### Add Custom Rules

Edit `composer.json` scripts:

```json
"scripts": {
    "phpcs": "phpcs --standard=WordPress --extensions=php src/",
    "phpcbf": "phpcbf --standard=WordPress --extensions=php src/"
}
```

## Distribution & Auto-Updates

### Enabling GitHub Auto-Updates

You can provide automatic updates from GitHub without submitting to WordPress.org:

**1. Install Plugin Update Checker via Composer:**

```bash
composer require yahnis-elsts/plugin-update-checker
```

Or as git submodule:

```bash
git submodule add https://github.com/YahnisElsts/plugin-update-checker.git
```

**2. Create Updater class:**

Create `src/Updater.php`:

```php
<?php
namespace MyPSR4Plugin;

use YahnisElsts\PluginUpdateChecker\v5\PucFactory;

class Updater {
    private static $instance = null;
    private $updateChecker;

    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->init_updater();
    }

    private function init_updater() {
        $updater_path = plugin_dir_path( __DIR__ ) . 'vendor/yahnis-elsts/plugin-update-checker/plugin-update-checker.php';

        if ( ! file_exists( $updater_path ) ) {
            return;
        }

        require $updater_path;

        $this->updateChecker = PucFactory::buildUpdateChecker(
            'https://github.com/yourusername/your-plugin/',
            plugin_dir_path( __DIR__ ) . 'my-psr4-plugin.php',
            'your-plugin-slug'
        );

        $this->updateChecker->setBranch( 'main' );
        $this->updateChecker->getVcsApi()->enableReleaseAssets();

        // Private repo authentication
        if ( defined( 'MYPP_GITHUB_TOKEN' ) ) {
            $this->updateChecker->setAuthentication( MYPP_GITHUB_TOKEN );
        }
    }
}
```

**3. Initialize in Plugin.php:**

Add to `src/Plugin.php` `init()` method:

```php
Updater::get_instance();
```

**4. For private repos, add token to wp-config.php:**

```php
define( 'MYPP_GITHUB_TOKEN', 'ghp_xxxxxxxxxxxxx' );
```

**5. Create releases:**

```bash
# Update version in plugin header
git add my-psr4-plugin.php
git commit -m "Bump version to 1.0.1"
git tag 1.0.1
git push origin main
git push origin 1.0.1

# Create GitHub Release with pre-built ZIP
```

**6. Build release ZIP:**

```bash
#!/bin/bash
# build-release.sh

VERSION="1.0.1"
PLUGIN_SLUG="my-psr4-plugin"

# Install dependencies (no dev packages)
composer install --no-dev --optimize-autoloader

# Create ZIP
zip -r "${PLUGIN_SLUG}-${VERSION}.zip" \
    "${PLUGIN_SLUG}/" \
    -x "*.git*" "*.github/*" "tests/*" "node_modules/*"

echo "Built: ${PLUGIN_SLUG}-${VERSION}.zip"
```

### Resources

- **Complete Guide**: See `references/github-auto-updates.md`
- **Implementation Examples**: See `examples/github-updater.php`
- **Plugin Update Checker**: https://github.com/YahnisElsts/plugin-update-checker

## Resources

- [WordPress Plugin Handbook](https://developer.wordpress.org/plugins/)
- [PSR-4 Autoloading](https://www.php-fig.org/psr/psr-4/)
- [Composer Documentation](https://getcomposer.org/doc/)
- [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/)

## License

GPL v2 or later
