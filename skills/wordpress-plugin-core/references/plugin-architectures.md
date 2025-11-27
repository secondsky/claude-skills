# WordPress Plugin Architecture Patterns

**Purpose**: Complete architecture patterns for different plugin sizes and complexity levels.

**Last Updated**: 2025-11-27

**Use this reference when**: Choosing architecture for a new plugin, refactoring existing plugin structure, or deciding between Simple, OOP, or PSR-4 patterns.

---

## Pattern Selection Guide

### Decision Tree

**Small Plugin (<5 functions, simple logic)**
→ **Pattern 1: Simple Plugin** (Functions Only)
- Quick to write
- No classes needed
- Good for learning
- ❌ Hard to scale

**Medium Plugin (related functionality, organization needed)**
→ **Pattern 2: OOP Plugin**
- Better organization
- Reusable code
- Singleton pattern
- ✅ Good balance

**Large/Modern Plugin (team development, 2025+ standards)**
→ **Pattern 3: PSR-4 Plugin** (Recommended)
- Namespaced classes
- Composer autoloading
- Modern PHP standards
- ✅✅ Best practice 2025+

---

## Pattern 1: Simple Plugin (Functions Only)

### When to Use
- Small utility plugins (<5 functions)
- No complex state management
- Personal/learning projects
- Quick prototypes

### Advantages
- ✅ Fast to write
- ✅ Easy to understand
- ✅ No class overhead
- ✅ Good for beginners

### Disadvantages
- ❌ Hard to organize as it grows
- ❌ Global namespace pollution
- ❌ Difficult to test
- ❌ No encapsulation

### Complete Example

```php
<?php
/**
 * Plugin Name: Simple Plugin
 * Description: A simple plugin using functions only
 * Version: 1.0.0
 * Requires at least: 5.9
 * Requires PHP: 7.4
 * Author: Your Name
 * License: GPL v2 or later
 * Text Domain: simple-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Constants
define( 'SIMPL_VERSION', '1.0.0' );
define( 'SIMPL_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'SIMPL_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Initialize plugin
 */
function simpl_init() {
    // Register post types, taxonomies, etc.
    load_plugin_textdomain( 'simple-plugin', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
}
add_action( 'init', 'simpl_init' );

/**
 * Add admin menu
 */
function simpl_admin_menu() {
    add_options_page(
        __( 'Simple Plugin Settings', 'simple-plugin' ),
        __( 'Simple Plugin', 'simple-plugin' ),
        'manage_options',
        'simple-plugin',
        'simpl_settings_page'
    );
}
add_action( 'admin_menu', 'simpl_admin_menu' );

/**
 * Settings page HTML
 */
function simpl_settings_page() {
    if ( ! current_user_can( 'manage_options' ) ) {
        return;
    }
    ?>
    <div class="wrap">
        <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
        <form method="post" action="options.php">
            <?php
            settings_fields( 'simpl_options' );
            do_settings_sections( 'simple-plugin' );
            submit_button();
            ?>
        </form>
    </div>
    <?php
}

/**
 * Register settings
 */
function simpl_register_settings() {
    register_setting( 'simpl_options', 'simpl_api_key', array(
        'type'              => 'string',
        'sanitize_callback' => 'sanitize_text_field',
        'default'           => '',
    ) );

    add_settings_section(
        'simpl_section',
        __( 'API Settings', 'simple-plugin' ),
        'simpl_section_callback',
        'simple-plugin'
    );

    add_settings_field(
        'simpl_api_key',
        __( 'API Key', 'simple-plugin' ),
        'simpl_field_callback',
        'simple-plugin',
        'simpl_section'
    );
}
add_action( 'admin_init', 'simpl_register_settings' );

function simpl_section_callback() {
    echo '<p>' . esc_html__( 'Enter your API credentials.', 'simple-plugin' ) . '</p>';
}

function simpl_field_callback() {
    $value = get_option( 'simpl_api_key' );
    ?>
    <input type="text" name="simpl_api_key" value="<?php echo esc_attr( $value ); ?>" class="regular-text" />
    <?php
}

/**
 * Activation hook
 */
function simpl_activate() {
    // Set default options
    add_option( 'simpl_api_key', '' );
}
register_activation_hook( __FILE__, 'simpl_activate' );

/**
 * Deactivation hook
 */
function simpl_deactivate() {
    // Cleanup tasks (do NOT delete user data)
}
register_deactivation_hook( __FILE__, 'simpl_deactivate' );
```

### File Structure
```
simple-plugin/
├── simple-plugin.php   # All code in one file
├── languages/
│   └── simple-plugin.pot
└── readme.txt
```

---

## Pattern 2: OOP Plugin

### When to Use
- Medium-sized plugins (5-20 functions)
- Related functionality that belongs together
- Need better code organization
- Want reusable components

### Advantages
- ✅ Better organization
- ✅ Encapsulation (private methods)
- ✅ Singleton pattern (single instance)
- ✅ Easier to extend
- ✅ Better than functions-only

### Disadvantages
- ❌ More boilerplate code
- ❌ Still uses global namespace
- ❌ No autoloading
- ❌ Not PSR-4 compliant

### Complete Example

```php
<?php
/**
 * Plugin Name: OOP Plugin
 * Description: Object-oriented plugin structure
 * Version: 1.0.0
 * Requires at least: 5.9
 * Requires PHP: 7.4
 * Author: Your Name
 * License: GPL v2 or later
 * Text Domain: oop-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Main plugin class
 */
class OOP_Plugin {

    /**
     * Single instance of the class
     *
     * @var OOP_Plugin
     */
    private static $instance = null;

    /**
     * Plugin version
     *
     * @var string
     */
    private $version = '1.0.0';

    /**
     * Get single instance
     *
     * @return OOP_Plugin
     */
    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor (private for singleton)
     */
    private function __construct() {
        $this->define_constants();
        $this->init_hooks();
    }

    /**
     * Define plugin constants
     */
    private function define_constants() {
        define( 'OOP_VERSION', $this->version );
        define( 'OOP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
        define( 'OOP_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
        define( 'OOP_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );
    }

    /**
     * Initialize WordPress hooks
     */
    private function init_hooks() {
        register_activation_hook( __FILE__, array( $this, 'activate' ) );
        register_deactivation_hook( __FILE__, array( $this, 'deactivate' ) );

        add_action( 'plugins_loaded', array( $this, 'load_textdomain' ) );
        add_action( 'init', array( $this, 'init' ) );
        add_action( 'admin_menu', array( $this, 'admin_menu' ) );
        add_action( 'admin_init', array( $this, 'register_settings' ) );
    }

    /**
     * Plugin activation
     */
    public function activate() {
        // Set default options
        add_option( 'oop_api_key', '' );

        // Flush rewrite rules if needed
        flush_rewrite_rules();
    }

    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Load plugin textdomain
     */
    public function load_textdomain() {
        load_plugin_textdomain(
            'oop-plugin',
            false,
            dirname( OOP_PLUGIN_BASENAME ) . '/languages'
        );
    }

    /**
     * Initialize plugin
     */
    public function init() {
        // Register custom post types, taxonomies, etc.
    }

    /**
     * Add admin menu
     */
    public function admin_menu() {
        add_options_page(
            __( 'OOP Plugin Settings', 'oop-plugin' ),
            __( 'OOP Plugin', 'oop-plugin' ),
            'manage_options',
            'oop-plugin',
            array( $this, 'settings_page' )
        );
    }

    /**
     * Register settings
     */
    public function register_settings() {
        register_setting( 'oop_options', 'oop_api_key', array(
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default'           => '',
        ) );

        add_settings_section(
            'oop_section',
            __( 'API Settings', 'oop-plugin' ),
            array( $this, 'section_callback' ),
            'oop-plugin'
        );

        add_settings_field(
            'oop_api_key',
            __( 'API Key', 'oop-plugin' ),
            array( $this, 'field_callback' ),
            'oop-plugin',
            'oop_section'
        );
    }

    /**
     * Settings section callback
     */
    public function section_callback() {
        echo '<p>' . esc_html__( 'Enter your API credentials.', 'oop-plugin' ) . '</p>';
    }

    /**
     * Settings field callback
     */
    public function field_callback() {
        $value = get_option( 'oop_api_key' );
        ?>
        <input type="text" name="oop_api_key" value="<?php echo esc_attr( $value ); ?>" class="regular-text" />
        <?php
    }

    /**
     * Settings page HTML
     */
    public function settings_page() {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }
        ?>
        <div class="wrap">
            <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
            <form method="post" action="options.php">
                <?php
                settings_fields( 'oop_options' );
                do_settings_sections( 'oop-plugin' );
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }

    /**
     * Get plugin version
     *
     * @return string
     */
    public function get_version() {
        return $this->version;
    }
}

/**
 * Returns the main instance of OOP_Plugin
 *
 * @return OOP_Plugin
 */
function oop_plugin() {
    return OOP_Plugin::get_instance();
}

// Initialize plugin
oop_plugin();
```

### File Structure
```
oop-plugin/
├── oop-plugin.php      # Main file with single class
├── languages/
│   └── oop-plugin.pot
└── readme.txt
```

### Multi-Class Structure (Optional)
For larger OOP plugins, you can split classes into files:

```
oop-plugin/
├── oop-plugin.php      # Main file
├── includes/
│   ├── class-admin.php
│   ├── class-frontend.php
│   └── class-settings.php
├── languages/
└── readme.txt
```

**oop-plugin.php**:
```php
require_once plugin_dir_path( __FILE__ ) . 'includes/class-admin.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/class-frontend.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/class-settings.php';
```

---

## Pattern 3: PSR-4 Plugin (Modern, Recommended)

### When to Use
- Large or complex plugins
- Team development
- Modern PHP standards (2025+)
- Professional/commercial plugins
- Any new plugin started in 2025+

### Advantages
- ✅✅ **Recommended 2025+**
- ✅ Namespaced (no global pollution)
- ✅ Composer autoloading
- ✅ PSR-4 compliant
- ✅ Easy to test
- ✅ Professional standard
- ✅ IDE autocompletion

### Disadvantages
- ❌ Requires Composer
- ❌ More setup initially
- ❌ Steeper learning curve

### Complete Example

**Directory Structure**:
```
psr4-plugin/
├── psr4-plugin.php     # Main plugin file
├── composer.json       # Composer configuration
├── vendor/             # Composer dependencies (git-ignored)
│   └── autoload.php
├── src/                # PSR-4 autoloaded classes
│   ├── Plugin.php      # Main plugin class
│   ├── Admin/
│   │   ├── Settings.php
│   │   └── Menu.php
│   ├── Frontend/
│   │   └── Display.php
│   └── Common/
│       └── Loader.php
├── languages/
│   └── psr4-plugin.pot
├── assets/
│   ├── css/
│   └── js/
└── readme.txt
```

**composer.json**:
```json
{
    "name": "your-vendor/psr4-plugin",
    "description": "A modern WordPress plugin with PSR-4 autoloading",
    "type": "wordpress-plugin",
    "license": "GPL-2.0-or-later",
    "autoload": {
        "psr-4": {
            "YourVendor\\PSR4Plugin\\": "src/"
        }
    },
    "require": {
        "php": ">=7.4"
    },
    "require-dev": {
        "phpunit/phpunit": "^9.0"
    }
}
```

**psr4-plugin.php** (Main File):
```php
<?php
/**
 * Plugin Name: PSR-4 Plugin
 * Description: Modern plugin with PSR-4 autoloading and namespaces
 * Version: 1.0.0
 * Requires at least: 5.9
 * Requires PHP: 7.4
 * Author: Your Name
 * License: GPL v2 or later
 * Text Domain: psr4-plugin
 * Domain Path: /languages
 */

namespace YourVendor\PSR4Plugin;

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Composer autoloader
require_once __DIR__ . '/vendor/autoload.php';

// Define plugin constants
define( 'PSR4_PLUGIN_VERSION', '1.0.0' );
define( 'PSR4_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'PSR4_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'PSR4_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

/**
 * Returns the main instance of Plugin
 *
 * @return Plugin
 */
function psr4_plugin() {
    return Plugin::get_instance();
}

// Initialize plugin
psr4_plugin();
```

**src/Plugin.php** (Main Plugin Class):
```php
<?php

namespace YourVendor\PSR4Plugin;

use YourVendor\PSR4Plugin\Admin\Settings;
use YourVendor\PSR4Plugin\Admin\Menu;
use YourVendor\PSR4Plugin\Frontend\Display;

/**
 * Main plugin class
 */
class Plugin {

    /**
     * Single instance of the class
     *
     * @var Plugin
     */
    private static $instance = null;

    /**
     * Plugin version
     *
     * @var string
     */
    private $version = '1.0.0';

    /**
     * Get single instance
     *
     * @return Plugin
     */
    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor (private for singleton)
     */
    private function __construct() {
        $this->init_hooks();
        $this->init_components();
    }

    /**
     * Initialize WordPress hooks
     */
    private function init_hooks() {
        register_activation_hook( PSR4_PLUGIN_DIR . 'psr4-plugin.php', array( $this, 'activate' ) );
        register_deactivation_hook( PSR4_PLUGIN_DIR . 'psr4-plugin.php', array( $this, 'deactivate' ) );

        add_action( 'plugins_loaded', array( $this, 'load_textdomain' ) );
        add_action( 'init', array( $this, 'init' ) );
    }

    /**
     * Initialize plugin components
     */
    private function init_components() {
        new Settings();
        new Menu();
        new Display();
    }

    /**
     * Plugin activation
     */
    public function activate() {
        // Activation tasks
        flush_rewrite_rules();
    }

    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Deactivation tasks
        flush_rewrite_rules();
    }

    /**
     * Load plugin textdomain
     */
    public function load_textdomain() {
        load_plugin_textdomain(
            'psr4-plugin',
            false,
            dirname( PSR4_PLUGIN_BASENAME ) . '/languages'
        );
    }

    /**
     * Initialize plugin
     */
    public function init() {
        // Initialization tasks
    }

    /**
     * Get plugin version
     *
     * @return string
     */
    public function get_version() {
        return $this->version;
    }
}
```

**src/Admin/Settings.php**:
```php
<?php

namespace YourVendor\PSR4Plugin\Admin;

/**
 * Settings class
 */
class Settings {

    /**
     * Constructor
     */
    public function __construct() {
        add_action( 'admin_init', array( $this, 'register_settings' ) );
    }

    /**
     * Register plugin settings
     */
    public function register_settings() {
        register_setting( 'psr4_options', 'psr4_api_key', array(
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default'           => '',
        ) );

        add_settings_section(
            'psr4_section',
            __( 'API Settings', 'psr4-plugin' ),
            array( $this, 'section_callback' ),
            'psr4-plugin'
        );

        add_settings_field(
            'psr4_api_key',
            __( 'API Key', 'psr4-plugin' ),
            array( $this, 'field_callback' ),
            'psr4-plugin',
            'psr4_section'
        );
    }

    /**
     * Settings section callback
     */
    public function section_callback() {
        echo '<p>' . esc_html__( 'Enter your API credentials.', 'psr4-plugin' ) . '</p>';
    }

    /**
     * Settings field callback
     */
    public function field_callback() {
        $value = get_option( 'psr4_api_key' );
        ?>
        <input type="text" name="psr4_api_key" value="<?php echo esc_attr( $value ); ?>" class="regular-text" />
        <?php
    }
}
```

**src/Admin/Menu.php**:
```php
<?php

namespace YourVendor\PSR4Plugin\Admin;

/**
 * Admin menu class
 */
class Menu {

    /**
     * Constructor
     */
    public function __construct() {
        add_action( 'admin_menu', array( $this, 'add_menu' ) );
    }

    /**
     * Add admin menu
     */
    public function add_menu() {
        add_options_page(
            __( 'PSR-4 Plugin Settings', 'psr4-plugin' ),
            __( 'PSR-4 Plugin', 'psr4-plugin' ),
            'manage_options',
            'psr4-plugin',
            array( $this, 'settings_page' )
        );
    }

    /**
     * Settings page HTML
     */
    public function settings_page() {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }
        ?>
        <div class="wrap">
            <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
            <form method="post" action="options.php">
                <?php
                settings_fields( 'psr4_options' );
                do_settings_sections( 'psr4-plugin' );
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }
}
```

**src/Frontend/Display.php**:
```php
<?php

namespace YourVendor\PSR4Plugin\Frontend;

/**
 * Frontend display class
 */
class Display {

    /**
     * Constructor
     */
    public function __construct() {
        add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
    }

    /**
     * Enqueue frontend scripts and styles
     */
    public function enqueue_scripts() {
        wp_enqueue_style(
            'psr4-plugin',
            PSR4_PLUGIN_URL . 'assets/css/frontend.css',
            array(),
            PSR4_PLUGIN_VERSION
        );

        wp_enqueue_script(
            'psr4-plugin',
            PSR4_PLUGIN_URL . 'assets/js/frontend.js',
            array( 'jquery' ),
            PSR4_PLUGIN_VERSION,
            true
        );
    }
}
```

### Setup Instructions

**1. Install Composer** (if not already installed):
```bash
# Download and install Composer globally
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
```

**2. Initialize Plugin**:
```bash
cd wp-content/plugins/psr4-plugin/
composer install
```

This creates the `vendor/` directory with autoloader.

**3. Add to `.gitignore`**:
```
vendor/
composer.lock
```

**4. Development Workflow**:
```bash
# Add new dependency
composer require vendor/package

# Update dependencies
composer update

# Generate optimized autoloader for production
composer install --no-dev --optimize-autoloader
```

---

## Comparison Table

| Feature | Simple | OOP | PSR-4 |
|---------|---------|-----|-------|
| **Ease of Start** | ✅✅✅ Very Easy | ✅✅ Easy | ✅ Moderate |
| **Scalability** | ❌ Poor | ✅ Good | ✅✅ Excellent |
| **Code Organization** | ❌ Minimal | ✅ Good | ✅✅ Excellent |
| **Namespace Support** | ❌ No | ❌ No | ✅✅ Yes |
| **Autoloading** | ❌ Manual require | ❌ Manual require | ✅✅ Composer |
| **IDE Support** | ✅ Basic | ✅✅ Good | ✅✅✅ Excellent |
| **Testability** | ❌ Difficult | ✅ Moderate | ✅✅ Easy |
| **Team Development** | ❌ Difficult | ✅ Moderate | ✅✅ Easy |
| **2025+ Standard** | ❌ No | ❌ No | ✅✅ Yes |
| **Best For** | Tiny plugins | Medium plugins | All new plugins |

---

## Migration Paths

### Simple → OOP
1. Wrap all functions in a class
2. Convert function calls to `$this->method()`
3. Make helper functions private methods
4. Use singleton pattern

### OOP → PSR-4
1. Install Composer
2. Create namespace structure
3. Move classes to `src/` directory
4. Update file requires to autoloader
5. Add namespace declarations

### Simple → PSR-4
Not recommended. Migrate to OOP first, then to PSR-4.

---

## Best Practices (All Patterns)

### Security
- Always check `ABSPATH` at top of every PHP file
- Verify nonces for form submissions
- Check user capabilities before privileged operations
- Sanitize input, escape output

### Performance
- Use singleton pattern (one instance only)
- Lazy-load components (initialize only when needed)
- Cache expensive operations
- Enqueue scripts/styles only where needed

### WordPress Standards
- Follow WordPress Coding Standards
- Use WordPress functions (don't reinvent the wheel)
- Hook into WordPress lifecycle properly
- Support internationalization (i18n)

---

**Reference Updated**: 2025-11-27
**Related**: See `common-patterns.md` for implementation patterns, `security-checklist.md` for security audit
