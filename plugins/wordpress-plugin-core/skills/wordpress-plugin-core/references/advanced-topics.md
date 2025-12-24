# WordPress Plugin Advanced Topics

**Purpose**: Advanced plugin development topics for internationalization, WP-CLI, scheduled events, and dependency management.

**Last Updated**: 2025-11-27

**Use this reference when**: Adding translations to plugins, creating WP-CLI commands, scheduling background tasks, or checking for plugin dependencies.

---

## Table of Contents

1. [Internationalization (i18n)](#internationalization-i18n)
2. [WP-CLI Commands](#wp-cli-commands)
3. [Scheduled Events (Cron)](#scheduled-events-cron)
4. [Plugin Dependencies Check](#plugin-dependencies-check)

---

## Internationalization (i18n)

### Overview

Internationalization (i18n) makes your plugin translation-ready. This allows users to translate your plugin into any language.

**Why It Matters**:
- WordPress is used in 190+ countries
- Professional plugins MUST be translatable
- Improves user experience globally
- Required for WordPress.org submission

### Basic Setup

**Note**: Since WordPress 4.6 (with enhanced JIT loading in 6.8+), plugins with proper header fields (Text Domain and Domain Path) generally do not need to call `load_plugin_textdomain()` manually. Automatic JIT loading handles standard translation files in the `wp-content/languages/plugins/` directory. Only use manual loading for:
- Custom translation directories
- Non-standard initialization timing  
- WordPress versions < 4.6 compatibility

```php
/**
 * Load plugin text domain
 * 
 * Only needed for custom paths or old WP versions
 */
function mypl_load_textdomain() {
    load_plugin_textdomain(
        'my-plugin',  // Text domain (must match plugin slug)
        false,        // Deprecated parameter (always false)
        dirname( plugin_basename( __FILE__ ) ) . '/languages'  // Path to .mo files
    );
}
add_action( 'plugins_loaded', 'mypl_load_textdomain' );
```

### Translation Functions

```php
// Basic translation
__( 'Hello World', 'my-plugin' );  // Returns translated string
_e( 'Hello World', 'my-plugin' );  // Echoes translated string

// Plural forms
_n( 'One item', '%d items', $count, 'my-plugin' );
// Usage: sprintf( _n( 'One item', '%d items', $count, 'my-plugin' ), $count );

// Translation with context (disambiguate same words)
_x( 'Post', 'noun', 'my-plugin' );  // "Post" as in blog post
_x( 'Post', 'verb', 'my-plugin' );  // "Post" as in submit

// Translate and escape (combined functions)
esc_html__( 'Text', 'my-plugin' );      // Translate + escape HTML
esc_html_e( 'Text', 'my-plugin' );      // Translate + escape HTML + echo
esc_attr__( 'Text', 'my-plugin' );      // Translate + escape attribute
esc_attr_e( 'Text', 'my-plugin' );      // Translate + escape attribute + echo

// Translate with printf
printf(
    /* translators: %s: user name */
    esc_html__( 'Hello, %s!', 'my-plugin' ),
    esc_html( $user_name )
);
```

### Directory Structure

```
my-plugin/
├── my-plugin.php
├── languages/
│   ├── my-plugin.pot          # Template file (generated)
│   ├── my-plugin-es_ES.po     # Spanish translation (editable)
│   ├── my-plugin-es_ES.mo     # Spanish translation (compiled)
│   ├── my-plugin-fr_FR.po     # French translation (editable)
│   └── my-plugin-fr_FR.mo     # French translation (compiled)
```

### Generating .POT File

**Using WP-CLI**:
```bash
wp i18n make-pot /path/to/my-plugin /path/to/my-plugin/languages/my-plugin.pot
```

**Using Poedit**:
1. Download Poedit: https://poedit.net/
2. File → New catalog from code
3. Select plugin directory
4. Configure translation properties
5. Extract strings

### Translation Workflow

1. **Development**: Use English strings with translation functions
2. **Extract**: Generate `.pot` file with all translatable strings
3. **Translate**: Create `.po` files for each language
4. **Compile**: Generate `.mo` files (binary, used by WordPress)
5. **Deploy**: Include `.mo` files in plugin

### Common Mistakes

❌ **Wrong**:
```php
echo 'Hello World';  // NOT translatable
echo __( 'Text' );   // Missing text domain
echo __( 'Text', 'wrong-domain' );  // Wrong text domain
```

✅ **Correct**:
```php
echo esc_html__( 'Hello World', 'my-plugin' );
```

### Best Practices

1. **Always use text domain**: Match plugin slug exactly
2. **Add translator comments** for context:
   ```php
   /* translators: %s: item name */
   __( 'Delete %s?', 'my-plugin' );
   ```
3. **Don't translate variables**:
   ```php
   // ❌ Wrong
   $text = __( 'Hello ' . $name, 'my-plugin' );

   // ✅ Correct
   $text = sprintf( __( 'Hello %s', 'my-plugin' ), $name );
   ```
4. **Load text domain early**: Use `plugins_loaded` hook

---

## WP-CLI Commands

### Overview

WP-CLI allows you to create custom command-line tools for your plugin.

**Use Cases**:
- Bulk data processing
- Database migrations
- Import/export tools
- Maintenance tasks
- Automated testing

### Basic Command

```php
if ( defined( 'WP_CLI' ) && WP_CLI ) {

    /**
     * Custom WP-CLI command for MyPlugin
     */
    class MyPL_CLI_Command {

        /**
         * Process data
         *
         * ## OPTIONS
         *
         * [--limit=<number>]
         * : Number of items to process
         * ---
         * default: 10
         * ---
         *
         * ## EXAMPLES
         *
         *     # Process 100 items
         *     wp mypl process --limit=100
         *
         *     # Process default 10 items
         *     wp mypl process
         *
         * @param array $args        Positional arguments
         * @param array $assoc_args  Named arguments (--flag=value)
         */
        public function process( $args, $assoc_args ) {
            $limit = isset( $assoc_args['limit'] ) ? absint( $assoc_args['limit'] ) : 10;

            WP_CLI::line( "Processing $limit items..." );

            for ( $i = 0; $i < $limit; $i++ ) {
                // Process item
                WP_CLI::log( "Processing item #$i" );
            }

            WP_CLI::success( "Processing complete! $limit items processed." );
        }

        /**
         * Import data from file
         *
         * ## OPTIONS
         *
         * <file>
         * : Path to file
         *
         * [--format=<format>]
         * : File format (json, csv)
         * ---
         * default: json
         * ---
         *
         * ## EXAMPLES
         *
         *     wp mypl import data.json
         *     wp mypl import data.csv --format=csv
         *
         * @param array $args
         * @param array $assoc_args
         */
        public function import( $args, $assoc_args ) {
            $file   = $args[0];
            $format = isset( $assoc_args['format'] ) ? $assoc_args['format'] : 'json';

            if ( ! file_exists( $file ) ) {
                WP_CLI::error( "File not found: $file" );
            }

            WP_CLI::line( "Importing from $file ($format)..." );

            // Import logic

            WP_CLI::success( 'Import complete!' );
        }
    }

    // Register command
    WP_CLI::add_command( 'mypl', 'MyPL_CLI_Command' );
}
```

### WP-CLI Output Functions

```php
WP_CLI::line( 'Normal output' );          // Standard output
WP_CLI::log( 'Log message' );             // Log message
WP_CLI::success( 'Success message' );     // Green success
WP_CLI::warning( 'Warning message' );     // Yellow warning
WP_CLI::error( 'Error message' );         // Red error (exits)
WP_CLI::debug( 'Debug info' );            // Only with --debug flag
```

### Progress Bar

```php
public function bulk_process( $args, $assoc_args ) {
    $items = get_items();  // Get items to process
    $count = count( $items );

    $progress = WP_CLI\Utils\make_progress_bar( 'Processing items', $count );

    foreach ( $items as $item ) {
        // Process item
        $progress->tick();
    }

    $progress->finish();
    WP_CLI::success( "$count items processed!" );
}
```

### Usage Examples

```bash
# List available commands
wp help mypl

# Run specific command
wp mypl process --limit=50

# With environment
wp mypl import data.json --url=example.com

# Quiet mode (only errors)
wp mypl process --quiet

# Debug mode
wp mypl process --debug
```

---

## Scheduled Events (Cron)

### Overview

WordPress Cron allows you to schedule recurring tasks (not real Unix cron).

**Use Cases**:
- Daily cleanup tasks
- Scheduled email sending
- Data synchronization
- Cache clearing
- Report generation

### Basic Scheduled Event

```php
/**
 * Schedule event on plugin activation
 */
function mypl_activate() {
    // Check if event already scheduled
    if ( ! wp_next_scheduled( 'mypl_daily_task' ) ) {
        // Schedule daily event starting now
        wp_schedule_event( time(), 'daily', 'mypl_daily_task' );
    }
}
register_activation_hook( __FILE__, 'mypl_activate' );

/**
 * Clear scheduled event on deactivation
 */
function mypl_deactivate() {
    // Remove ALL instances of this event
    wp_clear_scheduled_hook( 'mypl_daily_task' );
}
register_deactivation_hook( __FILE__, 'mypl_deactivate' );

/**
 * The actual task to run
 */
function mypl_do_daily_task() {
    // Perform task (cleanup, sync, email, etc.)
    error_log( 'Daily task executed at ' . current_time( 'mysql' ) );

    // Example: Clean up old transients
    global $wpdb;
    $wpdb->query(
        "DELETE FROM {$wpdb->options}
         WHERE option_name LIKE '_transient_timeout_%'
         AND option_value < UNIX_TIMESTAMP()"
    );
}
add_action( 'mypl_daily_task', 'mypl_do_daily_task' );
```

### Built-in Schedules

```php
// Available schedules:
'hourly'       // Once per hour
'twicedaily'   // Twice per day
'daily'        // Once per day
'weekly'       // Once per week (WordPress 5.4+)
```

### Custom Schedules

```php
/**
 * Add custom cron schedule
 */
function mypl_custom_cron_schedules( $schedules ) {
    // Every 5 minutes
    $schedules['every_five_minutes'] = array(
        'interval' => 300,  // 5 minutes in seconds
        'display'  => __( 'Every 5 Minutes', 'my-plugin' ),
    );

    // Every 15 minutes
    $schedules['every_fifteen_minutes'] = array(
        'interval' => 900,
        'display'  => __( 'Every 15 Minutes', 'my-plugin' ),
    );

    // Weekly
    $schedules['weekly'] = array(
        'interval' => 604800,  // 7 days in seconds
        'display'  => __( 'Once Weekly', 'my-plugin' ),
    );

    return $schedules;
}
add_filter( 'cron_schedules', 'mypl_custom_cron_schedules' );

// Use custom schedule
wp_schedule_event( time(), 'every_five_minutes', 'mypl_frequent_task' );
```

### One-Time Event

```php
// Schedule single event 1 hour from now
wp_schedule_single_event( time() + HOUR_IN_SECONDS, 'mypl_one_time_task' );
```

### Checking Scheduled Events

```php
// Check if event is scheduled
$timestamp = wp_next_scheduled( 'mypl_daily_task' );

if ( $timestamp ) {
    echo 'Next run: ' . date( 'Y-m-d H:i:s', $timestamp );
} else {
    echo 'Not scheduled';
}

// Get all scheduled events for hook
$events = _get_cron_array();
foreach ( $events as $timestamp => $cron ) {
    if ( isset( $cron['mypl_daily_task'] ) ) {
        echo 'Scheduled for: ' . date( 'Y-m-d H:i:s', $timestamp );
    }
}
```

### Unscheduling Events

```php
// Unschedule specific event occurrence
$timestamp = wp_next_scheduled( 'mypl_daily_task' );
if ( $timestamp ) {
    wp_unschedule_event( $timestamp, 'mypl_daily_task' );
}

// Unschedule ALL occurrences of event
wp_clear_scheduled_hook( 'mypl_daily_task' );
```

### Important Notes

**WordPress Cron Limitations**:
1. **Not real cron**: Only runs when someone visits your site
2. **May be delayed**: Depends on site traffic
3. **Can be disabled**: Some hosts disable WP-Cron
4. **Not precise**: Can run minutes late

**For mission-critical tasks**, use real Unix cron:
```bash
# In server crontab
*/15 * * * * wget -q -O - https://yoursite.com/wp-cron.php?doing_wp_cron >/dev/null 2>&1
```

Then disable WP-Cron in `wp-config.php`:
```php
define( 'DISABLE_WP_CRON', true );
```

---

## Plugin Dependencies Check

### Overview

Check if required plugins are active before initialization to prevent fatal errors.

### Basic Dependency Check

```php
/**
 * Check for required plugins
 */
add_action( 'admin_init', function() {
    // Check for WooCommerce
    if ( ! class_exists( 'WooCommerce' ) ) {
        // Deactivate this plugin
        deactivate_plugins( plugin_basename( __FILE__ ) );

        // Show admin notice
        add_action( 'admin_notices', function() {
            ?>
            <div class="error">
                <p>
                    <strong>My Plugin</strong> requires WooCommerce to be installed and active.
                </p>
            </div>
            <?php
        } );

        // Prevent "Plugin activated" message
        if ( isset( $_GET['activate'] ) ) {
            unset( $_GET['activate'] );
        }
    }
} );
```

### Multiple Dependencies

```php
/**
 * Check multiple dependencies
 */
function mypl_check_dependencies() {
    $dependencies = array();

    // Check for WooCommerce
    if ( ! class_exists( 'WooCommerce' ) ) {
        $dependencies[] = '<a href="https://wordpress.org/plugins/woocommerce/">WooCommerce</a>';
    }

    // Check for Advanced Custom Fields
    if ( ! class_exists( 'ACF' ) ) {
        $dependencies[] = '<a href="https://wordpress.org/plugins/advanced-custom-fields/">Advanced Custom Fields</a>';
    }

    // If missing dependencies, show notice and deactivate
    if ( ! empty( $dependencies ) ) {
        add_action( 'admin_notices', function() use ( $dependencies ) {
            ?>
            <div class="error">
                <p>
                    <strong>My Plugin</strong> requires the following plugins:
                </p>
                <ul>
                    <?php foreach ( $dependencies as $plugin ) : ?>
                        <li><?php echo wp_kses_post( $plugin ); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
            <?php
        } );

        deactivate_plugins( plugin_basename( __FILE__ ) );

        if ( isset( $_GET['activate'] ) ) {
            unset( $_GET['activate'] );
        }

        return false;
    }

    return true;
}
add_action( 'admin_init', 'mypl_check_dependencies' );
```

### Checking Specific Versions

```php
/**
 * Check for minimum WooCommerce version
 */
function mypl_check_woocommerce_version() {
    if ( ! defined( 'WC_VERSION' ) ) {
        return false;
    }

    $required_version = '5.0.0';

    if ( version_compare( WC_VERSION, $required_version, '<' ) ) {
        add_action( 'admin_notices', function() use ( $required_version ) {
            ?>
            <div class="error">
                <p>
                    <strong>My Plugin</strong> requires WooCommerce <?php echo esc_html( $required_version ); ?> or higher.
                    You are using <?php echo esc_html( WC_VERSION ); ?>.
                </p>
            </div>
            <?php
        } );

        return false;
    }

    return true;
}
```

### Common Dependency Checks

```php
// Check for specific class
if ( ! class_exists( 'WooCommerce' ) ) { ... }

// Check for specific function
if ( ! function_exists( 'acf_add_local_field_group' ) ) { ... }

// Check if plugin is active (requires loading plugin.php)
require_once ABSPATH . 'wp-admin/includes/plugin.php';
if ( ! is_plugin_active( 'woocommerce/woocommerce.php' ) ) { ... }

// Check for specific constant
if ( ! defined( 'WC_VERSION' ) ) { ... }
```

### Soft Dependencies

For optional (not required) plugins:

```php
/**
 * Initialize with optional WooCommerce integration
 */
add_action( 'plugins_loaded', function() {
    if ( class_exists( 'WooCommerce' ) ) {
        // Enable WooCommerce integration
        require_once plugin_dir_path( __FILE__ ) . 'includes/woocommerce-integration.php';
    }

    // Plugin works without WooCommerce, just has fewer features
} );
```

---

## Best Practices Summary

### Internationalization
1. Load text domain on `plugins_loaded`
2. Use correct translation functions
3. Always include text domain
4. Add translator comments
5. Generate `.pot` file before release

### WP-CLI
1. Check `WP_CLI` constant before defining commands
2. Document commands with PHPDoc
3. Use progress bars for long operations
4. Provide helpful examples
5. Use appropriate output functions

### Cron
1. Schedule on activation, clear on deactivation
2. Check if already scheduled before scheduling
3. Use `wp_clear_scheduled_hook()` to remove all instances
4. Consider using real Unix cron for critical tasks
5. Handle missed runs gracefully

### Dependencies
1. Check dependencies before initialization
2. Deactivate gracefully if missing
3. Show helpful error messages with links
4. Check versions, not just existence
5. Support soft dependencies when possible

---

**Reference Updated**: 2025-11-27
**Related**: See main SKILL.md for core patterns, `common-patterns.md` for implementation examples
