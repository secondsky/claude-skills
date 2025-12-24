# WordPress Plugin Common Patterns

**Purpose**: Production-ready implementation patterns for common WordPress plugin features.

**Last Updated**: 2025-11-27

**Use this reference when**: Implementing specific features like custom post types, taxonomies, meta boxes, Settings API, REST API, AJAX, custom database tables, or caching with transients.

---

## Pattern 1: Custom Post Types

```php
function mypl_register_cpt() {
    register_post_type( 'book', array(
        'labels' => array(
            'name'          => 'Books',
            'singular_name' => 'Book',
            'add_new_item'  => 'Add New Book',
        ),
        'public'       => true,
        'has_archive'  => true,
        'show_in_rest' => true,  // Gutenberg support
        'supports'     => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
        'rewrite'      => array( 'slug' => 'books' ),
        'menu_icon'    => 'dashicons-book',
    ) );
}
add_action( 'init', 'mypl_register_cpt' );

// CRITICAL: Flush rewrite rules on activation
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

**Key Points**:
- Always include `'show_in_rest' => true` for Gutenberg support
- MUST flush rewrite rules on activation/deactivation
- Use `dashicons-*` for menu icons
- Define `supports` array to enable specific features

---

## Pattern 2: Custom Taxonomies

```php
function mypl_register_taxonomy() {
    register_taxonomy( 'genre', 'book', array(
        'labels' => array(
            'name'          => 'Genres',
            'singular_name' => 'Genre',
        ),
        'hierarchical' => true,  // Like categories
        'show_in_rest' => true,
        'rewrite'      => array( 'slug' => 'genre' ),
    ) );
}
add_action( 'init', 'mypl_register_taxonomy' );
```

**Key Points**:
- `hierarchical => true` for category-like (parent/child)
- `hierarchical => false` for tag-like (flat)
- Second parameter associates with post type (e.g., 'book')
- Register taxonomies AFTER custom post types

---

## Pattern 3: Meta Boxes

```php
function mypl_add_meta_box() {
    add_meta_box(
        'book_details',
        'Book Details',
        'mypl_meta_box_html',
        'book',
        'normal',
        'high'
    );
}
add_action( 'add_meta_boxes', 'mypl_add_meta_box' );

function mypl_meta_box_html( $post ) {
    $isbn = get_post_meta( $post->ID, '_book_isbn', true );

    wp_nonce_field( 'mypl_save_meta', 'mypl_meta_nonce' );
    ?>
    <label for="book_isbn">ISBN:</label>
    <input type="text" id="book_isbn" name="book_isbn" value="<?php echo esc_attr( $isbn ); ?>" />
    <?php
}

function mypl_save_meta( $post_id ) {
    // Security checks
    if ( ! isset( $_POST['mypl_meta_nonce'] )
         || ! wp_verify_nonce( $_POST['mypl_meta_nonce'], 'mypl_save_meta' ) ) {
        return;
    }

    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
        return;
    }

    if ( ! current_user_can( 'edit_post', $post_id ) ) {
        return;
    }

    // Save data
    if ( isset( $_POST['book_isbn'] ) ) {
        update_post_meta(
            $post_id,
            '_book_isbn',
            sanitize_text_field( $_POST['book_isbn'] )
        );
    }
}
add_action( 'save_post_book', 'mypl_save_meta' );
```

**Security Requirements**:
1. ALWAYS include nonce verification
2. Check for autosave
3. Verify user capabilities
4. Sanitize ALL input before saving

**Key Points**:
- Use `save_post_{post_type}` for specific post types
- Prefix meta keys with `_` to hide from custom fields UI
- Use `get_post_meta()` third parameter `true` for single values

---

## Pattern 4: Settings API

```php
function mypl_add_menu() {
    add_options_page(
        'My Plugin Settings',
        'My Plugin',
        'manage_options',
        'my-plugin',
        'mypl_settings_page'
    );
}
add_action( 'admin_menu', 'mypl_add_menu' );

function mypl_register_settings() {
    register_setting( 'mypl_options', 'mypl_api_key', array(
        'type'              => 'string',
        'sanitize_callback' => 'sanitize_text_field',
        'default'           => '',
    ) );

    add_settings_section(
        'mypl_section',
        'API Settings',
        'mypl_section_callback',
        'my-plugin'
    );

    add_settings_field(
        'mypl_api_key',
        'API Key',
        'mypl_field_callback',
        'my-plugin',
        'mypl_section'
    );
}
add_action( 'admin_init', 'mypl_register_settings' );

function mypl_section_callback() {
    echo '<p>Configure your API settings.</p>';
}

function mypl_field_callback() {
    $value = get_option( 'mypl_api_key' );
    ?>
    <input type="text" name="mypl_api_key" value="<?php echo esc_attr( $value ); ?>" />
    <?php
}

function mypl_settings_page() {
    if ( ! current_user_can( 'manage_options' ) ) {
        return;
    }
    ?>
    <div class="wrap">
        <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
        <form method="post" action="options.php">
            <?php
            settings_fields( 'mypl_options' );
            do_settings_sections( 'my-plugin' );
            submit_button();
            ?>
        </form>
    </div>
    <?php
}
```

**Settings API Hierarchy**:
1. `register_setting()` - Register the option
2. `add_settings_section()` - Create a section
3. `add_settings_field()` - Add fields to sections
4. `settings_fields()` + `do_settings_sections()` - Display in page

**Key Points**:
- ALWAYS use `sanitize_callback` in `register_setting()`
- Check `manage_options` capability
- Use `settings_fields()` for nonce/referer protection
- Use `esc_attr()` when outputting values

---

## Pattern 5: REST API Endpoints

```php
add_action( 'rest_api_init', function() {
    register_rest_route( 'myplugin/v1', '/data', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'mypl_rest_callback',
        'permission_callback' => function() {
            return current_user_can( 'edit_posts' );
        },
        'args'                => array(
            'id' => array(
                'required'          => true,
                'validate_callback' => function( $param ) {
                    return is_numeric( $param );
                },
                'sanitize_callback' => 'absint',
            ),
        ),
    ) );
} );

function mypl_rest_callback( $request ) {
    $id = $request->get_param( 'id' );

    // Process...

    return new WP_REST_Response( array(
        'success' => true,
        'data'    => $data,
    ), 200 );
}
```

**Security Requirements**:
1. ALWAYS include `permission_callback` (even if public: `__return_true`)
2. Validate ALL parameters with `validate_callback`
3. Sanitize ALL parameters with `sanitize_callback`

**Key Points**:
- Use `WP_REST_Server::READABLE` (GET), `CREATABLE` (POST), `EDITABLE` (PUT/PATCH), `DELETABLE` (DELETE)
- Return `WP_REST_Response` object with HTTP status code
- Use `$request->get_param()` to retrieve parameters
- Version your API namespace (e.g., `/myplugin/v1/`)

---

## Pattern 6: AJAX Handlers (Legacy)

```php
// Enqueue script with localized data
function mypl_enqueue_ajax_script() {
    wp_enqueue_script( 'mypl-ajax', plugins_url( 'js/ajax.js', __FILE__ ), array( 'jquery' ), '1.0', true );

    wp_localize_script( 'mypl-ajax', 'mypl_ajax_object', array(
        'ajaxurl' => admin_url( 'admin-ajax.php' ),
        'nonce'   => wp_create_nonce( 'mypl-ajax-nonce' ),
    ) );
}
add_action( 'wp_enqueue_scripts', 'mypl_enqueue_ajax_script' );

// AJAX handler (logged-in users)
function mypl_ajax_handler() {
    check_ajax_referer( 'mypl-ajax-nonce', 'nonce' );

    $data = sanitize_text_field( $_POST['data'] );

    // Process...

    wp_send_json_success( array( 'message' => 'Success' ) );
}
add_action( 'wp_ajax_mypl_action', 'mypl_ajax_handler' );

// AJAX handler (logged-out users)
add_action( 'wp_ajax_nopriv_mypl_action', 'mypl_ajax_handler' );
```

**JavaScript (js/ajax.js)**:
```javascript
jQuery(document).ready(function($) {
    $('#my-button').on('click', function() {
        $.ajax({
            url: mypl_ajax_object.ajaxurl,
            type: 'POST',
            data: {
                action: 'mypl_action',
                nonce: mypl_ajax_object.nonce,
                data: 'value'
            },
            success: function(response) {
                console.log(response.data.message);
            }
        });
    });
});
```

**Security Requirements**:
1. ALWAYS use `check_ajax_referer()` in PHP handler
2. Create nonce with `wp_create_nonce()` and pass via `wp_localize_script()`
3. Sanitize ALL input data

**Key Points**:
- Use `wp_ajax_{action}` for logged-in users
- Use `wp_ajax_nopriv_{action}` for logged-out users
- Use `wp_send_json_success()` / `wp_send_json_error()` for responses
- For modern apps, prefer REST API (Pattern 5) over AJAX

---

## Pattern 7: Custom Database Tables

```php
function mypl_create_tables() {
    global $wpdb;

    $table_name = $wpdb->prefix . 'mypl_data';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) NOT NULL,
        data text NOT NULL,
        created datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY  (id),
        KEY user_id (user_id)
    ) $charset_collate;";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql );

    add_option( 'mypl_db_version', '1.0' );
}

// Create tables on activation
register_activation_hook( __FILE__, 'mypl_create_tables' );
```

**Critical Requirements**:
1. ALWAYS use `dbDelta()` (not direct SQL) for table creation
2. Use `$wpdb->prefix` for multisite compatibility
3. Include `$charset_collate` for proper character encoding
4. Version your database schema with options

**Key Points**:
- Two spaces after PRIMARY KEY (dbDelta requirement)
- Include indexes for frequently queried columns
- Use `bigint(20)` for IDs to match WordPress core
- Create tables on plugin activation, not on every load

---

## Pattern 8: Transients for Caching

```php
function mypl_get_expensive_data() {
    // Try to get cached data
    $data = get_transient( 'mypl_expensive_data' );

    if ( false === $data ) {
        // Not cached - regenerate
        $data = perform_expensive_operation();

        // Cache for 12 hours
        set_transient( 'mypl_expensive_data', $data, 12 * HOUR_IN_SECONDS );
    }

    return $data;
}

// Clear cache when data changes
function mypl_clear_cache() {
    delete_transient( 'mypl_expensive_data' );
}
add_action( 'save_post', 'mypl_clear_cache' );
```

**When to Use Transients**:
- External API calls (cache for minutes/hours)
- Complex database queries (cache for hours/days)
- Heavy computations (cache for days/weeks)
- Non-user-specific data only (use user meta for per-user caching)

**Key Points**:
- Transients can expire or be cleared at any time (not guaranteed)
- Use `HOUR_IN_SECONDS`, `DAY_IN_SECONDS`, `WEEK_IN_SECONDS` constants
- Always include cache invalidation logic
- Maximum transient name length: 172 characters (WordPress limit)

**Transient vs. Options**:
- Transients: Temporary, can expire, can be cleared
- Options: Permanent, never expire unless explicitly deleted
- Use transients for cache, options for settings

---

## Best Practices Summary

### Naming Conventions
- Prefix ALL functions, classes, constants, database tables with unique prefix
- Use lowercase with underscores for function names: `mypl_function_name()`
- Use uppercase with underscores for constants: `MYPL_CONSTANT_NAME`
- Start private meta keys with underscore: `_mypl_meta_key`

### Security
- Always verify nonces for form submissions
- Always check user capabilities
- Always sanitize input, escape output
- Always use prepared statements for database queries

### Performance
- Cache expensive operations with transients
- Enqueue scripts/styles only where needed
- Use `wp_enqueue_script()` in footer (5th parameter `true`)
- Minimize database queries (use `get_posts()` vs multiple `get_post()` calls)

### WordPress Coding Standards
- Use tabs for indentation (not spaces)
- Follow WordPress PHP coding standards
- Use Yoda conditions: `if ( 5 === $value )` not `if ( $value === 5 )`
- Always use braces for control structures, even single-line

---

## Common Mistakes to Avoid

1. **Not flushing rewrite rules** after registering custom post types/taxonomies
2. **Flushing rewrite rules on every page load** (huge performance hit)
3. **Direct database queries without `$wpdb->prepare()`** (SQL injection)
4. **Not checking nonces** in form/AJAX handlers (CSRF vulnerability)
5. **Not sanitizing input** or escaping output (XSS vulnerability)
6. **Hardcoding table prefixes** instead of using `$wpdb->prefix`
7. **Using `$_GET`/`$_POST` directly** without sanitization
8. **Not checking user capabilities** before privileged operations
9. **Enqueueing scripts everywhere** instead of specific pages
10. **Creating tables on every page load** instead of activation hook

---

**Reference Updated**: 2025-11-27
**Related**: See `error-catalog.md` for detailed error solutions, `security-checklist.md` for security audit
