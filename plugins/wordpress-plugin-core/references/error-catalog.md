# WordPress Plugin Error Catalog (Issues #6-20)

**Purpose**: Extended error catalog covering additional common WordPress plugin issues beyond the Top 5.

**Last Updated**: 2025-11-27

**Use this reference when**: Debugging WordPress plugin issues that go beyond the critical Top 5 security vulnerabilities (SQL Injection, XSS, CSRF, Capability Checks, Direct Access).

**Note**: For the Top 5 most critical security issues, see the main SKILL.md file.

---

## Issue #6: Prefix Collision
**Error**: Functions/classes conflict with other plugins
**Source**: WordPress Coding Standards
**Why It Happens**: Generic names without unique prefix
**Prevention**: Use 4-5 character prefix on ALL global code

```php
// CAUSES CONFLICTS
function init() {}
class Settings {}
add_option( 'api_key', $value );

// SAFE
function mypl_init() {}
class MyPL_Settings {}
add_option( 'mypl_api_key', $value );
```

**Impact**: CRITICAL - Can cause fatal errors or unexpected behavior when combined with other plugins
**Frequency**: Common in beginner plugins
**Solution**: Always prefix functions, classes, constants, database tables, options

---

## Issue #7: Rewrite Rules Not Flushed
**Error**: Custom post types return 404 errors
**Source**: WordPress Plugin Handbook
**Why It Happens**: Forgot to flush rewrite rules after registering CPT
**Prevention**: Flush on activation, clear on deactivation

```php
function mypl_activate() {
    mypl_register_cpt();
    flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'mypl_activate' );

function mypl_deactivate() {
    flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'mypl_deactivate' );
```

**Impact**: HIGH - Custom post types/taxonomies completely broken (404 errors)
**Frequency**: Very common
**Solution**: ALWAYS flush rewrite rules on activation AND deactivation

**Common Mistake**: Flushing rewrite rules on `init` hook (huge performance hit)

---

## Issue #8: Transients Not Cleaned
**Error**: Database accumulates expired transients
**Source**: WordPress Transients API Documentation
**Why It Happens**: No cleanup on uninstall
**Prevention**: Delete transients in uninstall.php

```php
// uninstall.php
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

global $wpdb;
$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_mypl_%'" );
$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_mypl_%'" );
```

**Impact**: MEDIUM - Database bloat, slower queries over time
**Frequency**: Common
**Solution**: Clean up ALL plugin data in uninstall.php including transients

**Transient Naming**:
- Transient: `_transient_{name}`
- Timeout: `_transient_timeout_{name}`
- Site transient: `_site_transient_{name}`

---

## Issue #9: Scripts Loaded Everywhere
**Error**: Performance degraded by unnecessary asset loading
**Source**: WordPress Performance Best Practices
**Why It Happens**: Enqueuing scripts/styles without conditional checks
**Prevention**: Only load assets where needed

```php
// BAD - Loads on every page
add_action( 'wp_enqueue_scripts', function() {
    wp_enqueue_script( 'mypl-script', $url );
} );

// GOOD - Only loads on specific page
add_action( 'wp_enqueue_scripts', function() {
    if ( is_page( 'my-page' ) ) {
        wp_enqueue_script( 'mypl-script', $url, array( 'jquery' ), '1.0', true );
    }
} );
```

**Impact**: HIGH - Poor performance, slow page loads
**Frequency**: Very common
**Solution**: Use conditional enqueuing with `is_page()`, `is_singular()`, `is_admin()`, etc.

**Performance Tips**:
- Load scripts in footer (5th parameter `true`)
- Check if script is actually needed on current page
- Consider using `wp_script_is()` to prevent double-loading

---

## Issue #10: Missing Sanitization on Save
**Error**: Malicious data stored in database
**Source**: WordPress Data Validation
**Why It Happens**: Saving $_POST data without sanitization
**Prevention**: Always sanitize before saving

```php
// VULNERABLE
update_option( 'mypl_setting', $_POST['value'] );

// SECURE
update_option( 'mypl_setting', sanitize_text_field( $_POST['value'] ) );
```

**Impact**: CRITICAL - Stored XSS vulnerability
**Frequency**: Common
**Solution**: Use appropriate sanitization function:

**Sanitization Functions**:
- `sanitize_text_field()` - Text fields
- `sanitize_textarea_field()` - Textareas
- `sanitize_email()` - Email addresses
- `sanitize_url()` / `esc_url_raw()` - URLs
- `absint()` - Positive integers
- `intval()` - Integers
- `sanitize_key()` - Alphanumeric keys
- `wp_kses_post()` - HTML with allowed tags

---

## Issue #11: Incorrect LIKE Queries
**Error**: SQL syntax errors or injection vulnerabilities
**Source**: WordPress $wpdb Documentation
**Why It Happens**: LIKE wildcards not escaped properly
**Prevention**: Use `$wpdb->esc_like()`

```php
// WRONG
$search = '%' . $term . '%';

// CORRECT
$search = '%' . $wpdb->esc_like( $term ) . '%';
$results = $wpdb->get_results( $wpdb->prepare( "... WHERE title LIKE %s", $search ) );
```

**Impact**: HIGH - SQL injection vulnerability, unexpected query results
**Frequency**: Moderate
**Solution**: Always use `$wpdb->esc_like()` before adding wildcards

**Why This Matters**: Characters like `%` and `_` are wildcards in SQL LIKE queries. User input might contain these, breaking queries or enabling injection.

---

## Issue #12: Using extract()
**Error**: Variable collision and security vulnerabilities
**Source**: WordPress Coding Standards
**Why It Happens**: extract() creates variables from array keys
**Prevention**: Never use extract(), access array elements directly

```php
// DANGEROUS
extract( $_POST );
// Now $any_array_key becomes a variable

// SAFE
$name = isset( $_POST['name'] ) ? sanitize_text_field( $_POST['name'] ) : '';
```

**Impact**: CRITICAL - Variable collision, security vulnerabilities
**Frequency**: Rare (but serious when found)
**Solution**: NEVER use `extract()`. Access array elements directly.

**Why extract() is Dangerous**:
1. Creates variables from user-controllable input
2. Can overwrite existing variables
3. Hard to track where variables come from
4. WordPress Coding Standards explicitly forbid it

---

## Issue #13: Missing Permission Callback in REST API
**Error**: Endpoints accessible to everyone
**Source**: WordPress REST API Handbook
**Why It Happens**: No `permission_callback` specified
**Prevention**: Always add permission_callback

```php
// VULNERABLE
register_rest_route( 'myplugin/v1', '/data', array(
    'callback' => 'my_callback',
) );

// SECURE
register_rest_route( 'myplugin/v1', '/data', array(
    'callback'            => 'my_callback',
    'permission_callback' => function() {
        return current_user_can( 'edit_posts' );
    },
) );
```

**Impact**: CRITICAL - Unauthorized access to endpoints
**Frequency**: Very common
**Solution**: ALWAYS include `permission_callback`, even for public endpoints

**For Public Endpoints**:
```php
'permission_callback' => '__return_true',
```

**Common Permission Checks**:
- `current_user_can( 'manage_options' )` - Administrators only
- `current_user_can( 'edit_posts' )` - Editors and above
- `is_user_logged_in()` - Any logged-in user
- `__return_true` - Public (explicitly allow everyone)

---

## Issue #14: Uninstall Hook Registered Repeatedly
**Error**: Option written on every page load
**Source**: WordPress Plugin Handbook
**Why It Happens**: register_uninstall_hook() called in main flow
**Prevention**: Use uninstall.php file instead

```php
// BAD - Runs on every page load
register_uninstall_hook( __FILE__, 'mypl_uninstall' );

// GOOD - Use uninstall.php file (preferred method)
// Create uninstall.php in plugin root
```

**Impact**: MEDIUM - Performance degradation, unnecessary database writes
**Frequency**: Moderate
**Solution**: Use `uninstall.php` file instead of `register_uninstall_hook()`

**uninstall.php Example**:
```php
<?php
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

// Delete options
delete_option( 'mypl_api_key' );

// Delete transients
global $wpdb;
$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_mypl_%'" );

// Drop custom tables
$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}mypl_data" );
```

---

## Issue #15: Data Deleted on Deactivation
**Error**: Users lose data when temporarily disabling plugin
**Source**: WordPress Plugin Development Best Practices
**Why It Happens**: Confusion about deactivation vs uninstall
**Prevention**: Only delete data in uninstall.php, never on deactivation

```php
// WRONG - Deletes user data on deactivation
register_deactivation_hook( __FILE__, function() {
    delete_option( 'mypl_user_settings' );
} );

// CORRECT - Only clear temporary data on deactivation
register_deactivation_hook( __FILE__, function() {
    delete_transient( 'mypl_cache' );
} );

// CORRECT - Delete all data in uninstall.php
```

**Impact**: CRITICAL - Data loss, angry users
**Frequency**: Common beginner mistake
**Solution**: Understand the difference:

**Deactivation** (temporary):
- Clear caches/transients
- Remove cron jobs
- Flush rewrite rules
- **DO NOT** delete user data

**Uninstall** (permanent):
- Delete ALL plugin data
- Drop custom tables
- Remove options
- Clean up everything

---

## Issue #16: Using Deprecated Functions
**Error**: Plugin breaks on WordPress updates
**Source**: WordPress Deprecated Functions List
**Why It Happens**: Using functions removed in newer WordPress versions
**Prevention**: Enable WP_DEBUG during development

```php
// In wp-config.php (development only)
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );
```

**Impact**: HIGH - Plugin breaks on WordPress updates
**Frequency**: Moderate
**Solution**: Enable WP_DEBUG during development, check debug.log regularly

**Common Deprecated Functions**:
- `wp_get_http()` → Use `wp_remote_get()`
- `get_settings()` → Use `get_option()`
- `user_can()` → Use `current_user_can()`
- `get_currentuserinfo()` → Use `wp_get_current_user()`

**Checking for Deprecated Functions**:
```bash
# Search your code for common deprecated functions
grep -r "get_currentuserinfo" wp-content/plugins/your-plugin/
```

---

## Issue #17: Text Domain Mismatch
**Error**: Translations don't load
**Source**: WordPress Internationalization
**Why It Happens**: Text domain doesn't match plugin slug
**Prevention**: Use exact plugin slug everywhere

```php
// Plugin header
// Text Domain: my-plugin

// In code - MUST MATCH EXACTLY
__( 'Text', 'my-plugin' );
_e( 'Text', 'my-plugin' );
```

**Impact**: MEDIUM - Translations broken
**Frequency**: Common
**Solution**: Ensure text domain matches plugin slug EXACTLY (case-sensitive)

**Text Domain Rules**:
1. Must match plugin slug (directory name)
2. Use lowercase with hyphens
3. Use in ALL translation functions
4. Declare in plugin header

**Translation Functions**:
- `__( 'Text', 'text-domain' )` - Returns translated string
- `_e( 'Text', 'text-domain' )` - Echoes translated string
- `_n( 'Singular', 'Plural', $count, 'text-domain' )` - Plural forms
- `_x( 'Post', 'noun', 'text-domain' )` - With context
- `esc_html__( 'Text', 'text-domain' )` - Translate and escape
- `esc_html_e( 'Text', 'text-domain' )` - Translate, escape, and echo

---

## Issue #18: Missing Plugin Dependencies
**Error**: Fatal error when required plugin is inactive
**Source**: WordPress Plugin Dependencies
**Why It Happens**: No check for required plugins
**Prevention**: Check for dependencies on plugins_loaded

```php
add_action( 'plugins_loaded', function() {
    if ( ! class_exists( 'WooCommerce' ) ) {
        add_action( 'admin_notices', function() {
            echo '<div class="error"><p>My Plugin requires WooCommerce.</p></div>';
        } );
        return;
    }
    // Initialize plugin
} );
```

**Impact**: CRITICAL - Fatal errors, white screen of death
**Frequency**: Common for extensions
**Solution**: Check for dependencies before initialization

**Common Dependency Checks**:
```php
// Check for specific plugin class
if ( ! class_exists( 'WooCommerce' ) ) { ... }

// Check for specific function
if ( ! function_exists( 'some_function' ) ) { ... }

// Check if plugin is active
if ( ! is_plugin_active( 'plugin-folder/plugin-file.php' ) ) { ... }
```

**Better User Experience**:
```php
function mypl_check_dependencies() {
    $dependencies = array(
        'WooCommerce' => array(
            'class' => 'WooCommerce',
            'name'  => 'WooCommerce',
            'url'   => 'https://wordpress.org/plugins/woocommerce/',
        ),
    );

    $missing = array();

    foreach ( $dependencies as $dependency ) {
        if ( ! class_exists( $dependency['class'] ) ) {
            $missing[] = sprintf(
                '<a href="%s">%s</a>',
                $dependency['url'],
                $dependency['name']
            );
        }
    }

    if ( ! empty( $missing ) ) {
        add_action( 'admin_notices', function() use ( $missing ) {
            printf(
                '<div class="error"><p>My Plugin requires: %s</p></div>',
                implode( ', ', $missing )
            );
        } );
        return false;
    }

    return true;
}
```

---

## Issue #19: Autosave Triggering Meta Save
**Error**: Meta saved multiple times, performance issues
**Source**: WordPress Post Meta
**Why It Happens**: No autosave check in save_post hook
**Prevention**: Check for DOING_AUTOSAVE constant

```php
add_action( 'save_post', function( $post_id ) {
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
        return;
    }

    // Safe to save meta
} );
```

**Impact**: MEDIUM - Performance degradation, duplicate saves
**Frequency**: Common
**Solution**: Always check DOING_AUTOSAVE in save_post hooks

**Complete Save Post Checks**:
```php
add_action( 'save_post_book', function( $post_id ) {
    // Check autosave
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
        return;
    }

    // Check nonce
    if ( ! isset( $_POST['mypl_nonce'] ) || ! wp_verify_nonce( $_POST['mypl_nonce'], 'mypl_save' ) ) {
        return;
    }

    // Check capabilities
    if ( ! current_user_can( 'edit_post', $post_id ) ) {
        return;
    }

    // Check post revision
    if ( wp_is_post_revision( $post_id ) ) {
        return;
    }

    // Now safe to save
    update_post_meta( $post_id, '_mypl_data', sanitize_text_field( $_POST['mypl_data'] ) );
} );
```

---

## Issue #20: admin-ajax.php Performance
**Error**: Slow AJAX responses
**Source**: https://deliciousbrains.com/comparing-wordpress-rest-api-performance-admin-ajax-php/
**Why It Happens**: admin-ajax.php loads entire WordPress core
**Prevention**: Use REST API for new projects (10x faster)

```php
// OLD: admin-ajax.php (still works but slower)
add_action( 'wp_ajax_mypl_action', 'mypl_ajax_handler' );

// NEW: REST API (10x faster, recommended)
add_action( 'rest_api_init', function() {
    register_rest_route( 'myplugin/v1', '/endpoint', array(
        'methods'             => 'POST',
        'callback'            => 'mypl_rest_handler',
        'permission_callback' => function() {
            return current_user_can( 'edit_posts' );
        },
    ) );
} );
```

**Impact**: HIGH - Poor performance, slow user experience
**Frequency**: Common in legacy code
**Solution**: Use REST API for all new AJAX functionality

**Performance Comparison**:
- admin-ajax.php: ~200-500ms per request
- REST API: ~20-50ms per request
- **10x faster** with REST API

**When to Use Each**:
- **admin-ajax.php**: Legacy code, backward compatibility
- **REST API**: All new code (2025+ recommended)

**REST API Advantages**:
1. 10x faster (doesn't load entire admin)
2. Better for mobile/SPAs
3. Standardized responses
4. Built-in authentication
5. Better caching support
6. Discoverable endpoints

---

## Summary

**Issues #6-20 Coverage**:
- **Security**: #10, #12, #13 (Sanitization, extract(), REST permissions)
- **Performance**: #8, #9, #20 (Transients, Scripts, admin-ajax)
- **Functionality**: #6, #7, #15, #16, #17, #18, #19 (Prefixes, Rewrites, Data loss, Deprecated, Translations, Dependencies, Autosave)
- **Data Integrity**: #14, #15 (Uninstall, Deactivation)

**Prevention Strategies**:
1. Enable WP_DEBUG during development
2. Use WordPress coding standards linter
3. Test with Plugin Check plugin
4. Review security checklist before release
5. Test activation/deactivation/uninstall
6. Check translation loading
7. Profile AJAX performance
8. Test with minimal plugins active

---

**Reference Updated**: 2025-11-27
**Related**: See main SKILL.md for Top 5 critical security issues, `security-checklist.md` for complete audit
