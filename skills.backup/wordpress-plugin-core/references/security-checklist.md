# WordPress Plugin Security Checklist

Complete security audit checklist for WordPress plugins. Use this when reviewing code for security vulnerabilities.

---

## 1. File Access Protection

### ABSPATH Check

**Required in EVERY PHP file**:

```php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
```

**Why**: Prevents direct file access via URL
**Vulnerability**: Remote code execution, information disclosure
**Source**: [WordPress Plugin Handbook](https://developer.wordpress.org/plugins/plugin-basics/best-practices/#file-organization)

✅ **Check**:
- [ ] All `.php` files have ABSPATH check
- [ ] Check is at the top of the file (line 2-4)
- [ ] Uses `exit` not `die` (WordPress standard)

---

## 2. Sanitization (Input Validation)

### Always Sanitize User Input

**Functions to use**:

| Input Type | Sanitization Function |
|------------|----------------------|
| Text field | `sanitize_text_field()` |
| Textarea | `sanitize_textarea_field()` |
| Email | `sanitize_email()` |
| URL | `esc_url_raw()` |
| File name | `sanitize_file_name()` |
| HTML content | `wp_kses_post()` or `wp_kses()` |
| Integer | `absint()` or `intval()` |
| Float | `floatval()` |
| Key/Slug | `sanitize_key()` |
| Title | `sanitize_title()` |

**Example**:

```php
// ❌ WRONG - No sanitization
$name = $_POST['name'];

// ✅ CORRECT - Sanitized
$name = sanitize_text_field( $_POST['name'] );
```

✅ **Check**:
- [ ] All `$_POST` values are sanitized
- [ ] All `$_GET` values are sanitized
- [ ] All `$_REQUEST` values are sanitized
- [ ] All `$_COOKIE` values are sanitized
- [ ] Correct sanitization function for data type

---

## 3. Escaping (Output Protection)

### Always Escape Output

**Functions to use**:

| Output Context | Escaping Function |
|----------------|-------------------|
| HTML content | `esc_html()` |
| HTML attribute | `esc_attr()` |
| URL | `esc_url()` |
| JavaScript | `esc_js()` |
| Textarea | `esc_textarea()` |
| HTML blocks | `wp_kses_post()` |
| Translation | `esc_html__()`, `esc_html_e()`, `esc_attr__()`, `esc_attr_e()` |

**Example**:

```php
// ❌ WRONG - No escaping
echo $user_input;
echo '<a href="' . $url . '">Link</a>';

// ✅ CORRECT - Escaped
echo esc_html( $user_input );
echo '<a href="' . esc_url( $url ) . '">Link</a>';
```

✅ **Check**:
- [ ] All variables in HTML are escaped
- [ ] All variables in attributes are escaped
- [ ] All URLs are escaped
- [ ] Correct escaping function for context

---

## 4. Nonces (CSRF Protection)

### Use Nonces for All Forms and AJAX

**Form example**:

```php
// Add nonce to form
wp_nonce_field( 'my_action', 'my_nonce_field' );

// Verify nonce when processing
if ( ! wp_verify_nonce( $_POST['my_nonce_field'], 'my_action' ) ) {
    wp_die( 'Security check failed' );
}
```

**AJAX example**:

```php
// Create nonce
wp_create_nonce( 'my_ajax_nonce' );

// Verify in AJAX handler
check_ajax_referer( 'my_ajax_nonce', 'nonce' );
```

**URL example**:

```php
// Add nonce to URL
$url = wp_nonce_url( admin_url( 'admin-post.php?action=my_action' ), 'my_action' );

// Verify nonce
if ( ! wp_verify_nonce( $_GET['_wpnonce'], 'my_action' ) ) {
    wp_die( 'Security check failed' );
}
```

✅ **Check**:
- [ ] All forms have nonce fields
- [ ] All form handlers verify nonces
- [ ] All AJAX handlers verify nonces
- [ ] All admin action URLs have nonces
- [ ] Nonce actions are unique and descriptive

---

## 5. Capability Checks (Authorization)

### Always Check User Permissions

**Never use `is_admin()`** - it only checks if you're on an admin page, not user permissions!

**Correct**:

```php
// ❌ WRONG - Only checks admin area
if ( is_admin() ) {
    // Anyone can access this!
}

// ✅ CORRECT - Checks user capability
if ( current_user_can( 'manage_options' ) ) {
    // Only admins can access
}
```

**Common capabilities**:

| Capability | Who Has It |
|------------|------------|
| `manage_options` | Administrator |
| `edit_posts` | Editor, Author, Contributor |
| `publish_posts` | Editor, Author |
| `edit_published_posts` | Editor, Author |
| `delete_posts` | Editor, Author |
| `upload_files` | Editor, Author |
| `read` | All logged-in users |

✅ **Check**:
- [ ] All admin pages check capabilities
- [ ] All AJAX handlers check capabilities
- [ ] All REST endpoints have permission callbacks
- [ ] All form handlers check capabilities
- [ ] Never rely on `is_admin()` alone

---

## 6. SQL Injection Prevention

### Always Use Prepared Statements

**Use `$wpdb->prepare()`**:

```php
global $wpdb;

// ❌ WRONG - SQL injection vulnerability
$results = $wpdb->get_results( "SELECT * FROM table WHERE id = {$id}" );

// ✅ CORRECT - Prepared statement
$results = $wpdb->get_results( $wpdb->prepare(
    "SELECT * FROM table WHERE id = %d",
    $id
) );
```

**Placeholders**:

| Type | Placeholder |
|------|-------------|
| Integer | `%d` |
| Float | `%f` |
| String | `%s` |

✅ **Check**:
- [ ] All `$wpdb` queries use `prepare()`
- [ ] Correct placeholder for data type
- [ ] Never concatenate variables into SQL
- [ ] User input is sanitized before `prepare()`

---

## 7. Unique Prefixing

### Prevent Naming Conflicts

**Use 4-5 character prefix for everything**:

```php
// Functions
function myplug_init() {}

// Classes
class MyPlug_Admin {}

// Constants
define( 'MYPLUG_VERSION', '1.0.0' );

// Options
get_option( 'myplug_settings' );

// Meta keys
update_post_meta( $id, '_myplug_data', $value );

// AJAX actions
add_action( 'wp_ajax_myplug_action', 'myplug_ajax_handler' );

// REST routes
register_rest_route( 'myplug/v1', '/endpoint', $args );
```

✅ **Check**:
- [ ] All functions have unique prefix
- [ ] All classes have unique prefix
- [ ] All constants have unique prefix
- [ ] All database options have unique prefix
- [ ] All meta keys have unique prefix (start with `_` for hidden)
- [ ] All AJAX actions have unique prefix
- [ ] All REST namespaces have unique prefix

---

## 8. Asset Loading

### Load Assets Conditionally

```php
// ❌ WRONG - Loads everywhere
function bad_enqueue() {
    wp_enqueue_script( 'my-script', $url );
}
add_action( 'wp_enqueue_scripts', 'bad_enqueue' );

// ✅ CORRECT - Loads only where needed
function good_enqueue() {
    if ( is_singular( 'book' ) ) {
        wp_enqueue_script( 'my-script', $url );
    }
}
add_action( 'wp_enqueue_scripts', 'good_enqueue' );
```

✅ **Check**:
- [ ] Scripts load only on needed pages
- [ ] Styles load only on needed pages
- [ ] Admin assets use `admin_enqueue_scripts` hook
- [ ] Admin assets check `$hook` parameter
- [ ] Dependencies are declared (`array( 'jquery' )`)
- [ ] Versions are set (for cache busting)

---

## 9. Data Validation

### Validate Before Saving

```php
// Example: Validate select field
$allowed_values = array( 'option1', 'option2', 'option3' );
$value = sanitize_text_field( $_POST['select_field'] );

if ( ! in_array( $value, $allowed_values, true ) ) {
    // Invalid value - reject or use default
    $value = 'option1';
}
```

✅ **Check**:
- [ ] Select/radio values validated against allowed values
- [ ] Number fields validated for min/max range
- [ ] Email fields validated with `is_email()`
- [ ] URLs validated with `esc_url_raw()`
- [ ] File uploads validated for type and size

---

## 10. File Upload Security

### Validate File Uploads

```php
// Check file type
$allowed_types = array( 'image/jpeg', 'image/png' );
if ( ! in_array( $_FILES['file']['type'], $allowed_types, true ) ) {
    wp_die( 'Invalid file type' );
}

// Check file size
$max_size = 5 * 1024 * 1024; // 5MB
if ( $_FILES['file']['size'] > $max_size ) {
    wp_die( 'File too large' );
}

// Use WordPress upload handler
$file = $_FILES['file'];
$upload = wp_handle_upload( $file, array( 'test_form' => false ) );
```

✅ **Check**:
- [ ] File type is validated
- [ ] File size is validated
- [ ] Uses `wp_handle_upload()` or `media_handle_upload()`
- [ ] File names are sanitized
- [ ] User has `upload_files` capability

---

## 11. Direct Object Reference

### Check Ownership Before Actions

```php
// ❌ WRONG - No ownership check
$post_id = absint( $_POST['post_id'] );
wp_delete_post( $post_id );

// ✅ CORRECT - Check ownership
$post_id = absint( $_POST['post_id'] );
$post = get_post( $post_id );

if ( ! $post || $post->post_author != get_current_user_id() ) {
    wp_die( 'Permission denied' );
}

wp_delete_post( $post_id );
```

✅ **Check**:
- [ ] Delete/edit actions verify ownership
- [ ] Or check appropriate capability
- [ ] REST endpoints verify ownership in permission callback

---

## 12. REST API Security

### Secure REST Endpoints

```php
register_rest_route( 'myplugin/v1', '/items', array(
    'methods'  => 'POST',
    'callback' => 'my_callback',

    // ✅ REQUIRED: Permission callback
    'permission_callback' => function() {
        return current_user_can( 'edit_posts' );
    },

    // ✅ REQUIRED: Argument validation
    'args' => array(
        'title' => array(
            'required'          => true,
            'validate_callback' => function( $param ) {
                return ! empty( $param );
            },
            'sanitize_callback' => 'sanitize_text_field',
        ),
    ),
) );
```

✅ **Check**:
- [ ] All endpoints have `permission_callback`
- [ ] Never use `'permission_callback' => '__return_true'` for write operations
- [ ] All parameters have validation
- [ ] All parameters have sanitization
- [ ] Return proper HTTP status codes (200, 400, 401, 404, 500)

---

## 13. Internationalization Security

### Escape Translated Strings

```php
// ❌ WRONG - Vulnerable to XSS
echo __( 'Hello', 'my-plugin' );

// ✅ CORRECT - Escaped
echo esc_html__( 'Hello', 'my-plugin' );
echo esc_html_e( 'Hello', 'my-plugin' );
echo esc_attr__( 'Hello', 'my-plugin' );
```

✅ **Check**:
- [ ] Use `esc_html__()` instead of `__()`
- [ ] Use `esc_html_e()` instead of `_e()`
- [ ] Use `esc_attr__()` for attributes
- [ ] Never output `__()` directly

---

## 14. Data Cleanup

### Remove Data on Uninstall (Not Deactivation)

```php
// uninstall.php
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

// Delete options
delete_option( 'myplug_settings' );

// Delete transients
delete_transient( 'myplug_cache' );

// Delete posts (optional - user data loss!)
// Only if absolutely necessary
```

✅ **Check**:
- [ ] Options deleted in `uninstall.php`
- [ ] Transients deleted in `uninstall.php`
- [ ] Never delete data in deactivation hook
- [ ] Consider asking user before deleting post data

---

## 15. Common Vulnerabilities to Avoid

### XSS (Cross-Site Scripting)

- [ ] Never `echo` user input without escaping
- [ ] Never use `innerHTML` with user data
- [ ] Always escape in HTML context

### SQL Injection

- [ ] Never concatenate variables into SQL
- [ ] Always use `$wpdb->prepare()`
- [ ] Sanitize before `prepare()`

### CSRF (Cross-Site Request Forgery)

- [ ] All forms have nonces
- [ ] All AJAX has nonces
- [ ] All admin actions have nonces

### Authorization Bypass

- [ ] Never use `is_admin()` alone
- [ ] Always check capabilities
- [ ] Verify ownership for user-specific data

### Path Traversal

- [ ] Validate file paths
- [ ] Use `realpath()` to resolve paths
- [ ] Never allow `../` in file operations

---

## Quick Security Scan

Run this checklist on every file:

1. [ ] ABSPATH check at top
2. [ ] Unique prefix on all names
3. [ ] All `$_POST`/`$_GET` sanitized
4. [ ] All output escaped
5. [ ] All forms/AJAX have nonces
6. [ ] All actions check capabilities
7. [ ] All `$wpdb` queries use `prepare()`
8. [ ] Assets load conditionally
9. [ ] No direct file access
10. [ ] No hardcoded credentials

---

## Resources

- **WordPress Security Whitepaper**: https://wordpress.org/about/security/
- **Plugin Security**: https://developer.wordpress.org/apis/security/
- **Patchstack Database**: https://patchstack.com/database/
- **Wordfence**: https://www.wordfence.com/blog/
- **WPScan**: https://wpscan.com/

---

**Last Updated**: 2025-11-06
**Status**: Production Ready
