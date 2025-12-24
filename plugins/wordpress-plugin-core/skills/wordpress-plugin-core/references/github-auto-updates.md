# GitHub Auto-Updates for WordPress Plugins

Complete guide for implementing automatic updates for WordPress plugins hosted outside the WordPress.org repository.

---

## Table of Contents

1. [Overview](#overview)
2. [How WordPress Updates Work](#how-wordpress-updates-work)
3. [Solution 1: Plugin Update Checker (Recommended)](#solution-1-plugin-update-checker-recommended)
4. [Solution 2: Git Updater](#solution-2-git-updater)
5. [Solution 3: Custom Update Server](#solution-3-custom-update-server)
6. [Commercial Solutions](#commercial-solutions)
7. [Security Best Practices](#security-best-practices)
8. [Comparison Matrix](#comparison-matrix)
9. [Common Pitfalls](#common-pitfalls)
10. [Resources](#resources)

---

## Overview

WordPress plugins don't need to be hosted on WordPress.org to provide automatic updates. Several well-established solutions enable auto-updates from GitHub, GitLab, BitBucket, or custom servers.

### Why Auto-Updates Matter

- **Security**: Users get critical security patches automatically
- **Features**: Seamless delivery of new features and improvements
- **Support**: Reduces support burden from outdated installations
- **Professional**: Provides polished user experience

### Solutions Available

| Solution | Best For | Complexity | Cost |
|----------|----------|------------|------|
| Plugin Update Checker | Most use cases | Low | Free |
| Git Updater | Multi-platform Git hosting | Low | Free |
| Custom Update Server | Enterprise/custom licensing | High | Hosting costs |
| Freemius | Commercial plugins | Low | 15% or $99-599/yr |

---

## How WordPress Updates Work

### Core Update Mechanism

WordPress uses a **transient-based system** to check for plugin updates:

```
1. WordPress checks transients (every 12 hours)
2. Queries WordPress.org API for available updates
3. Stores results in `update_plugins` transient
4. Displays "Update available" notifications
5. Downloads and installs when user clicks "Update"
```

### Key Hooks for Custom Updates

```php
// Intercept BEFORE WordPress checks (saves to transient)
add_filter('pre_set_site_transient_update_plugins', 'my_check_for_updates');

// Filter update data (returns without saving)
add_filter('site_transient_update_plugins', 'my_push_update');

// Modify plugin information for "View details" modal
add_filter('plugins_api', 'my_plugin_info', 20, 3);

// Post-installation cleanup
add_action('upgrader_post_install', 'my_post_install', 10, 3);
```

### Update Flow for Custom Plugins

```
1. WordPress checks transients
   ↓
2. Your filter hook intercepts
   ↓
3. You query GitHub/custom server
   ↓
4. Inject update data into transient
   ↓
5. WordPress shows "Update available"
   ↓
6. User clicks update
   ↓
7. WordPress downloads from your URL
   ↓
8. Installs and activates
```

---

## Solution 1: Plugin Update Checker (Recommended)

**GitHub**: https://github.com/YahnisElsts/plugin-update-checker
**Stars**: 2.2k+ | **License**: MIT | **Status**: Actively maintained (v5.x)

### What It Does

Lightweight library that enables automatic updates from GitHub, GitLab, BitBucket, or custom JSON servers. No WordPress.org submission required.

### Pros

- ✅ **Minimal setup**: ~5 lines of code
- ✅ **Multiple platforms**: GitHub, GitLab, BitBucket, custom JSON
- ✅ **Active development**: Regular updates since 2011
- ✅ **Private repos**: Supports authentication tokens
- ✅ **Well documented**: Extensive examples and guides
- ✅ **No dependencies**: Self-contained library
- ✅ **Flexible versioning**: Supports releases, tags, or branches
- ✅ **Standards compliant**: Uses WordPress.org `readme.txt` format

### Cons

- ❌ No built-in license management (requires custom implementation)
- ❌ No package signing (relies on HTTPS/token security)
- ❌ Requires bundling library with plugin (~100KB)

### Installation

**Option A: Git Submodule** (Recommended)

```bash
cd your-plugin/
git submodule add https://github.com/YahnisElsts/plugin-update-checker.git
```

**Option B: Composer**

```bash
composer require yahnis-elsts/plugin-update-checker
```

**Option C: Manual**

```bash
cd your-plugin/
git clone https://github.com/YahnisElsts/plugin-update-checker.git
# Or download and extract ZIP
```

### Basic Implementation

```php
<?php
/**
 * Plugin Name: My Awesome Plugin
 * Version: 1.0.0
 * GitHub Plugin URI: https://github.com/yourusername/your-plugin
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Include the library
require 'plugin-update-checker/plugin-update-checker.php';
use YahnisElsts\PluginUpdateChecker\v5\PucFactory;

// Initialize update checker
$myUpdateChecker = PucFactory::buildUpdateChecker(
    'https://github.com/yourusername/your-plugin/',
    __FILE__,
    'my-awesome-plugin' // Plugin slug
);

// Optional: Set branch (default: master/main)
$myUpdateChecker->setBranch('main');
```

### Private Repository Support

```php
// For private GitHub repos, add authentication
$myUpdateChecker->setAuthentication('ghp_YourGitHubPersonalAccessToken');

// Better: Use WordPress constant (define in wp-config.php)
if (defined('MY_PLUGIN_GITHUB_TOKEN')) {
    $myUpdateChecker->setAuthentication(MY_PLUGIN_GITHUB_TOKEN);
}
```

### Release Strategies

#### Strategy 1: GitHub Releases (Recommended)

**Best for**: Production plugins with formal releases

```bash
# 1. Update version in plugin header
# my-plugin.php: Version: 1.0.1

# 2. Commit and tag
git add my-plugin.php
git commit -m "Bump version to 1.0.1"
git tag 1.0.1
git push origin main
git push origin 1.0.1

# 3. Create GitHub Release
# - Go to GitHub → Releases → Create Release
# - Select tag: 1.0.1
# - Upload pre-built plugin ZIP (optional but recommended)
```

**Enable release assets**:

```php
// Download ZIP from releases instead of source code
$myUpdateChecker->getVcsApi()->enableReleaseAssets();
```

**Benefits**:
- ✅ Professional release notes
- ✅ Pre-built ZIP (can include compiled assets)
- ✅ Changelog visible to users
- ✅ Can exclude dev files (.git, tests, etc.)

#### Strategy 2: Git Tags

**Best for**: Simple plugins, rapid iteration

```bash
# Just tag the commit
git tag 1.0.1
git push origin 1.0.1
```

**No additional code needed** - library auto-detects highest version tag.

**Benefits**:
- ✅ Simple workflow
- ✅ No manual release creation

**Drawbacks**:
- ❌ Downloads entire repo (includes .git, tests, etc.)
- ❌ No release notes visible to users

#### Strategy 3: Branch-Based

**Best for**: Beta testing, staging environments

```php
// Point to specific branch
$myUpdateChecker->setBranch('stable');

// Or beta branch
$myUpdateChecker->setBranch('beta');
```

**Update version in plugin header on that branch**:

```php
/**
 * Version: 1.1.0-beta
 */
```

**Benefits**:
- ✅ Easy beta testing
- ✅ Separate stable/development channels

**Drawbacks**:
- ❌ No version history
- ❌ Downloads full repo

### Complete Example with Best Practices

```php
<?php
/**
 * Plugin Name: My Plugin
 * Plugin URI: https://example.com/my-plugin
 * Description: Example plugin with GitHub updates
 * Version: 1.0.0
 * Author: Your Name
 * Author URI: https://example.com
 * License: GPL-2.0+
 * Text Domain: my-plugin
 * GitHub Plugin URI: https://github.com/yourusername/my-plugin
 */

if (!defined('ABSPATH')) {
    exit;
}

// Define constants
define('MY_PLUGIN_VERSION', '1.0.0');
define('MY_PLUGIN_FILE', __FILE__);
define('MY_PLUGIN_DIR', plugin_dir_path(__FILE__));

// Initialize update checker
add_action('plugins_loaded', 'my_plugin_init_updater');
function my_plugin_init_updater() {
    // Only load if library exists
    $updater_path = MY_PLUGIN_DIR . 'plugin-update-checker/plugin-update-checker.php';

    if (!file_exists($updater_path)) {
        // Warn admin if library is missing
        add_action('admin_notices', function() {
            echo '<div class="notice notice-error"><p>';
            echo '<strong>My Plugin:</strong> Update checker library not found. ';
            echo 'Automatic updates disabled.';
            echo '</p></div>';
        });
        return;
    }

    require $updater_path;

    $updateChecker = YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
        'https://github.com/yourusername/my-plugin/',
        MY_PLUGIN_FILE,
        'my-plugin'
    );

    // Set branch
    $updateChecker->setBranch('main');

    // Use GitHub Releases
    $updateChecker->getVcsApi()->enableReleaseAssets();

    // Private repo authentication (optional)
    if (defined('MY_PLUGIN_GITHUB_TOKEN')) {
        $updateChecker->setAuthentication(MY_PLUGIN_GITHUB_TOKEN);
    }

    // Add custom authentication from settings (optional)
    $license_key = get_option('my_plugin_license_key');
    if (!empty($license_key)) {
        // Use license key as token or validate separately
        $updateChecker->setAuthentication($license_key);
    }
}

// Rest of plugin code...
```

### Creating Update-Ready ZIP Files

**Important**: ZIP must contain plugin folder inside it!

```
my-plugin-1.0.1.zip
└── my-plugin/          ← Plugin folder MUST be inside
    ├── my-plugin.php
    ├── readme.txt
    ├── plugin-update-checker/
    └── ...
```

**Build script example**:

```bash
#!/bin/bash
# build-release.sh

VERSION="1.0.1"
PLUGIN_SLUG="my-plugin"

# Create temp directory
mkdir -p build

# Export git repository (excludes .git, .gitignore, etc.)
git archive HEAD --prefix="${PLUGIN_SLUG}/" --format=zip -o "build/${PLUGIN_SLUG}-${VERSION}.zip"

echo "Built: build/${PLUGIN_SLUG}-${VERSION}.zip"
```

**With exclusions**:

```bash
# .gitattributes
.git export-ignore
.gitignore export-ignore
.gitattributes export-ignore
tests/ export-ignore
node_modules/ export-ignore
src/ export-ignore
.github/ export-ignore
```

### readme.txt Format

Plugin Update Checker reads `readme.txt` for changelog and upgrade notices:

```
=== My Plugin ===
Contributors: yourusername
Tags: feature, awesome
Requires at least: 5.9
Tested up to: 6.4
Stable tag: 1.0.1
License: GPLv2 or later

Short description here.

== Description ==

Long description here.

== Changelog ==

= 1.0.1 =
* Fixed bug with user permissions
* Added new feature X

= 1.0.0 =
* Initial release

== Upgrade Notice ==

= 1.0.1 =
Critical security fix. Update immediately.
```

---

## Solution 2: Git Updater

**GitHub**: https://github.com/afragen/git-updater
**Stars**: 3.3k+ | **License**: MIT | **Status**: Actively maintained

### What It Does

A **WordPress plugin** (not library) that enables updates for **all** GitHub/GitLab/Bitbucket/Gitea-hosted plugins and themes on a site.

### Pros

- ✅ **User-installable**: Site owners install once, works for all compatible plugins
- ✅ **Multi-platform**: GitHub, GitLab, Bitbucket, Gitea
- ✅ **No coding required**: Just add headers to plugin
- ✅ **Language pack support**: Automatic translations
- ✅ **REST API**: Programmatic control

### Cons

- ❌ **Dependency**: Users must install Git Updater plugin first
- ❌ **Less control**: Developer doesn't control update logic
- ❌ **PHP 8.0+ required**: May limit compatibility

### Implementation

**Step 1: Add headers to your plugin**

```php
<?php
/**
 * Plugin Name: My Plugin
 * Plugin URI: https://example.com
 * Description: My awesome plugin
 * Version: 1.0.0
 * Author: Your Name
 * GitHub Plugin URI: yourusername/your-plugin
 * Primary Branch: main
 * Requires at least: 5.9
 * Requires PHP: 8.0
 */
```

**Alternative formats**:

```php
// Full URL
GitHub Plugin URI: https://github.com/yourusername/your-plugin

// GitLab
GitLab Plugin URI: yourusername/your-plugin

// Bitbucket
Bitbucket Plugin URI: yourusername/your-plugin

// Gitea
Gitea Plugin URI: https://gitea.example.com/yourusername/your-plugin
```

**Step 2: Users install Git Updater**

Users download Git Updater from WordPress.org:

```
Plugins → Add New → Search "Git Updater" → Install & Activate
```

**Step 3: Install your plugin**

Users can install via:
- Upload ZIP
- Git Updater → Install Plugin → Enter GitHub URL

**Step 4: Updates appear automatically**

Git Updater checks for updates alongside WordPress.org plugins.

### For Private Repos

**GitHub** (Settings → Git Updater → GitHub → Personal Access Token):

```
Token: ghp_xxxxxxxxxxxxx
```

**Or in wp-config.php**:

```php
define('GITHUB_ACCESS_TOKEN', 'ghp_xxxxxxxxxxxxx');
```

### When to Use

- ✅ Building plugins for clients who already use Git Updater
- ✅ Want to offload update logic to third-party
- ✅ Need language pack support
- ✅ Multi-platform Git hosting
- ❌ Don't want user dependencies

---

## Solution 3: Custom Update Server

**GitHub**: https://github.com/YahnisElsts/wp-update-server (companion library)
**Tutorial**: https://rudrastyh.com/wordpress/self-hosted-plugin-update.html

### What It Does

Roll your own update API using WordPress filters and custom JSON/API endpoint.

### Pros

- ✅ **Full control**: Complete customization of update logic
- ✅ **No dependencies**: No external libraries
- ✅ **Scalable**: Host on CDN/S3
- ✅ **Integration-friendly**: Easy to add license checks, analytics

### Cons

- ❌ **More code**: Requires implementing API and plugin-side logic
- ❌ **Maintenance**: You're responsible for security, uptime
- ❌ **Hosting costs**: Need server/CDN

### Implementation

#### Server Setup

**Create `info.json` endpoint**:

```json
{
  "name": "My Plugin",
  "slug": "my-plugin",
  "version": "1.0.1",
  "author": "Your Name",
  "homepage": "https://example.com",
  "download_url": "https://example.com/downloads/my-plugin-1.0.1.zip",
  "requires": "5.0",
  "tested": "6.4",
  "requires_php": "7.4",
  "last_updated": "2025-01-15 12:00:00",
  "sections": {
    "description": "Plugin description here",
    "installation": "<h4>Installation</h4><ol><li>Upload plugin</li></ol>",
    "changelog": "<h4>1.0.1</h4><ul><li>Bug fixes</li></ul>"
  },
  "banners": {
    "low": "https://example.com/banner-772x250.png",
    "high": "https://example.com/banner-1544x500.png"
  },
  "icons": {
    "1x": "https://example.com/icon-128x128.png",
    "2x": "https://example.com/icon-256x256.png"
  }
}
```

#### Plugin Code

```php
<?php
/**
 * Plugin Name: My Plugin
 * Version: 1.0.0
 * Update URI: https://example.com/updates/my-plugin.json
 */

if (!defined('ABSPATH')) {
    exit;
}

define('MY_PLUGIN_VERSION', '1.0.0');
define('MY_PLUGIN_UPDATE_URL', 'https://example.com/updates/my-plugin.json');

/**
 * Check for plugin updates
 */
add_filter('site_transient_update_plugins', 'my_plugin_check_for_updates');
function my_plugin_check_for_updates($transient) {
    if (empty($transient->checked)) {
        return $transient;
    }

    $plugin_slug = plugin_basename(__FILE__);

    // Check cache first (12 hours)
    $remote_data = get_transient('my_plugin_update_cache');

    if (false === $remote_data) {
        $remote = wp_remote_get(MY_PLUGIN_UPDATE_URL, [
            'timeout' => 10,
            'headers' => [
                'Accept' => 'application/json'
            ]
        ]);

        if (is_wp_error($remote) || 200 !== wp_remote_retrieve_response_code($remote)) {
            return $transient;
        }

        $remote_data = json_decode(wp_remote_retrieve_body($remote));

        if (!$remote_data || !isset($remote_data->version)) {
            return $transient;
        }

        // Cache for 12 hours
        set_transient('my_plugin_update_cache', $remote_data, 12 * HOUR_IN_SECONDS);
    }

    // Compare versions
    if (version_compare(MY_PLUGIN_VERSION, $remote_data->version, '<')) {
        $obj = new stdClass();
        $obj->slug = $remote_data->slug;
        $obj->plugin = $plugin_slug;
        $obj->new_version = $remote_data->version;
        $obj->url = $remote_data->homepage;
        $obj->package = $remote_data->download_url;
        $obj->tested = $remote_data->tested;
        $obj->requires = $remote_data->requires;
        $obj->requires_php = $remote_data->requires_php;

        $transient->response[$plugin_slug] = $obj;
    } else {
        // Mark as up-to-date
        $obj = new stdClass();
        $obj->slug = $remote_data->slug;
        $obj->plugin = $plugin_slug;
        $obj->new_version = $remote_data->version;
        $transient->no_update[$plugin_slug] = $obj;
    }

    return $transient;
}

/**
 * Plugin information for "View details" modal
 */
add_filter('plugins_api', 'my_plugin_info', 20, 3);
function my_plugin_info($res, $action, $args) {
    // Do nothing if not getting plugin information
    if ('plugin_information' !== $action) {
        return $res;
    }

    // Do nothing if it's not our plugin
    if (plugin_basename(__DIR__) !== $args->slug) {
        return $res;
    }

    // Try to get cached data
    $remote_data = get_transient('my_plugin_update_cache');

    if (false === $remote_data) {
        $remote = wp_remote_get(MY_PLUGIN_UPDATE_URL, [
            'timeout' => 10,
            'headers' => ['Accept' => 'application/json']
        ]);

        if (is_wp_error($remote) || 200 !== wp_remote_retrieve_response_code($remote)) {
            return $res;
        }

        $remote_data = json_decode(wp_remote_retrieve_body($remote));

        if (!$remote_data) {
            return $res;
        }
    }

    $res = new stdClass();
    $res->name = $remote_data->name;
    $res->slug = $remote_data->slug;
    $res->version = $remote_data->version;
    $res->tested = $remote_data->tested;
    $res->requires = $remote_data->requires;
    $res->requires_php = $remote_data->requires_php;
    $res->author = $remote_data->author;
    $res->homepage = $remote_data->homepage;
    $res->download_link = $remote_data->download_url;
    $res->sections = (array)$remote_data->sections;

    if (isset($remote_data->banners)) {
        $res->banners = (array)$remote_data->banners;
    }

    if (isset($remote_data->icons)) {
        $res->icons = (array)$remote_data->icons;
    }

    if (isset($remote_data->last_updated)) {
        $res->last_updated = $remote_data->last_updated;
    }

    return $res;
}

/**
 * Clear cache when plugin is updated
 */
add_action('upgrader_process_complete', 'my_plugin_clear_update_cache', 10, 2);
function my_plugin_clear_update_cache($upgrader_object, $options) {
    if ('update' === $options['action'] && 'plugin' === $options['type']) {
        delete_transient('my_plugin_update_cache');
    }
}
```

### With License Validation

```php
// Add license key field in settings
function my_plugin_check_for_updates($transient) {
    $license_key = get_option('my_plugin_license_key');

    if (empty($license_key)) {
        return $transient; // No license = no updates
    }

    $remote = wp_remote_post(MY_PLUGIN_UPDATE_URL, [
        'body' => [
            'license' => $license_key,
            'domain' => home_url()
        ]
    ]);

    // Verify license is valid before offering update
    $remote_data = json_decode(wp_remote_retrieve_body($remote));

    if (!isset($remote_data->license_valid) || !$remote_data->license_valid) {
        return $transient; // Invalid license = no updates
    }

    // Proceed with update check...
}
```

### When to Use

- ✅ Need full control over update logic
- ✅ Want to integrate license verification
- ✅ Building commercial plugin with custom licensing
- ✅ Need analytics/tracking on updates
- ✅ Want to host on own infrastructure

---

## Commercial Solutions

### Freemius

**Website**: https://freemius.com
**Pricing**: Free (15% revenue share) or $99-599/year

#### Features

- ✅ Complete platform: Licensing, payments, updates, analytics
- ✅ WordPress SDK: Drop-in library
- ✅ Automatic updates with license integration
- ✅ In-dashboard checkout: ~12% conversion boost
- ✅ Secure repository: Amazon S3-backed
- ✅ Staged rollouts: Beta testing, gradual releases

#### Implementation

```php
// Include Freemius SDK
require_once dirname(__FILE__) . '/freemius/start.php';

$my_plugin_fs = fs_dynamic_init([
    'id'                  => '123',
    'slug'                => 'my-plugin',
    'public_key'          => 'pk_xxx',
    'is_premium'          => true,
    'has_paid_plans'      => true,
    'menu'                => [
        'slug'           => 'my-plugin',
    ],
]);
```

Updates are fully automatic - Freemius handles everything.

#### When to Use

- ✅ Selling premium plugins commercially
- ✅ Want all-in-one solution (licensing + updates + payments)
- ✅ Need subscription management
- ✅ Okay with revenue share

---

### Easy Digital Downloads + Software Licensing

**Website**: https://easydigitaldownloads.com
**Pricing**: $328/year (Recurring Payments + Software Licensing extensions)

#### Features

- ✅ Self-hosted: Run on your own WordPress site
- ✅ Full control: Own the data
- ✅ No revenue share: Fixed annual cost
- ✅ Mature ecosystem: 10+ years

#### Limitations

- ❌ More setup: Requires custom development for update integration
- ❌ No in-dashboard checkout
- ❌ Extension costs add up

#### When to Use

- ✅ Already using WordPress for sales
- ✅ Want complete control over infrastructure
- ✅ Have development resources
- ❌ Don't want to build update logic (use Freemius instead)

---

## Security Best Practices

### 1. Always Use HTTPS

```php
// ✅ Good
$remote = wp_remote_get('https://example.com/updates.json', [
    'sslverify' => true  // Explicitly verify SSL
]);

// ❌ Bad
$remote = wp_remote_get('http://example.com/updates.json');
```

**Why**: HTTPS prevents man-in-the-middle attacks.

### 2. Implement Token Authentication

**For private repos**:

```php
$updateChecker->setAuthentication(defined('MY_PLUGIN_TOKEN') ? MY_PLUGIN_TOKEN : '');
```

**For custom servers**:

```php
$remote = wp_remote_get($update_url, [
    'headers' => [
        'Authorization' => 'Bearer ' . get_option('my_plugin_license_key')
    ]
]);
```

**Never hardcode tokens** - use constants or encrypted options.

### 3. Validate License Keys

```php
function my_plugin_check_for_updates($transient) {
    $license = get_option('my_plugin_license');

    // Validate license before offering updates
    $validation = wp_remote_post('https://example.com/api/validate', [
        'body' => [
            'license' => $license,
            'domain' => home_url()
        ]
    ]);

    $license_data = json_decode(wp_remote_retrieve_body($validation));

    if (!$license_data->valid) {
        return $transient; // No updates for invalid licenses
    }

    // Proceed...
}
```

### 4. Use Checksums

**Server** (info.json):

```json
{
    "download_url": "https://example.com/plugin.zip",
    "checksum": "sha256:abc123def456...",
    "checksum_algorithm": "sha256"
}
```

**Plugin**:

```php
add_filter('upgrader_pre_install', 'my_plugin_verify_checksum', 10, 2);
function my_plugin_verify_checksum($true, $hook_extra) {
    $package = $hook_extra['package'];

    // Get expected checksum
    $expected = get_transient('my_plugin_expected_checksum');

    if (!$expected) {
        return $true; // Allow if no checksum available
    }

    // Download and verify
    $downloaded = download_url($package);

    if (is_wp_error($downloaded)) {
        return $downloaded;
    }

    $actual = hash_file('sha256', $downloaded);

    if (!hash_equals($expected, $actual)) {
        @unlink($downloaded);
        return new WP_Error('checksum_mismatch', 'Update file corrupted or tampered');
    }

    return $true;
}
```

### 5. Implement Package Signing (Advanced)

**Server-side** (sign ZIP):

```php
$zip_contents = file_get_contents('plugin.zip');
$private_key = openssl_pkey_get_private(file_get_contents('private.pem'));
openssl_sign($zip_contents, $signature, $private_key, OPENSSL_ALGO_SHA256);

$info = [
    'download_url' => 'https://example.com/plugin.zip',
    'signature' => base64_encode($signature)
];

file_put_contents('info.json', json_encode($info));
```

**Plugin-side** (verify):

```php
$remote_data = json_decode(wp_remote_retrieve_body($remote));
$zip = file_get_contents($remote_data->download_url);
$signature = base64_decode($remote_data->signature);

// Embed public key in plugin
$public_key = <<<EOD
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----
EOD;

$public_key = openssl_pkey_get_public($public_key);
$verified = openssl_verify($zip, $signature, $public_key, OPENSSL_ALGO_SHA256);

if ($verified !== 1) {
    return new WP_Error('signature_invalid', 'Update signature verification failed');
}
```

### 6. Rate Limiting

```php
add_filter('site_transient_update_plugins', 'my_plugin_check_updates_rate_limit');
function my_plugin_check_updates_rate_limit($transient) {
    $last_check = get_transient('my_plugin_last_check');

    if ($last_check && (time() - $last_check) < HOUR_IN_SECONDS) {
        return $transient; // Don't check more than once per hour
    }

    set_transient('my_plugin_last_check', time(), HOUR_IN_SECONDS);

    // Proceed with check...
}
```

### 7. Error Logging

```php
function my_plugin_check_for_updates($transient) {
    $remote = wp_remote_get($update_url);

    if (is_wp_error($remote)) {
        error_log(sprintf(
            '[My Plugin] Update check failed: %s',
            $remote->get_error_message()
        ));
        return $transient;
    }

    // Continue...
}
```

### 8. Secure Token Storage

```php
// ❌ Bad: Hardcoded
$token = 'ghp_abc123';

// ✅ Good: WordPress constant (wp-config.php)
define('MY_PLUGIN_GITHUB_TOKEN', 'ghp_xxx');
$token = MY_PLUGIN_GITHUB_TOKEN;

// ✅ Better: Encrypted option
function my_plugin_get_token() {
    $encrypted = get_option('my_plugin_token_encrypted');
    return openssl_decrypt($encrypted, 'AES-256-CBC', wp_salt('auth'));
}
```

---

## Comparison Matrix

| Feature | Plugin Update Checker | Git Updater | Custom Server | Freemius |
|---------|----------------------|-------------|---------------|----------|
| **Setup Complexity** | ⭐⭐⭐⭐⭐ Low | ⭐⭐⭐⭐ Low | ⭐⭐ High | ⭐⭐⭐⭐⭐ Low |
| **Cost** | Free | Free | Hosting costs | 15% or $99-599/yr |
| **GitHub Support** | ✅ Yes | ✅ Yes | ✅ (DIY) | ❌ No |
| **Private Repos** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **License Management** | ❌ DIY | ❌ No | ✅ DIY | ✅ Built-in |
| **Package Signing** | ❌ No | ❌ No | ✅ DIY | ✅ Built-in |
| **HTTPS Required** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Dependencies** | Library (bundled) | Plugin (separate) | None | SDK (bundled) |
| **Control Level** | Medium | Low | High | Medium |
| **Maintenance** | Low | Low | High | None |
| **Scalability** | High (GitHub CDN) | High | Varies | High (S3) |
| **In-Dashboard Checkout** | ❌ No | ❌ No | ✅ DIY | ✅ Yes |
| **Analytics** | ❌ No | ❌ No | ✅ DIY | ✅ Built-in |
| **Best For** | Open source, freemium | Multi-platform | Custom licensing | Commercial SaaS |

---

## Common Pitfalls

### 1. Incorrect ZIP Structure

❌ **Wrong**:
```
plugin.zip
├── plugin.php
├── readme.txt
└── assets/
```

✅ **Correct**:
```
plugin.zip
└── my-plugin/       ← Plugin folder MUST be inside
    ├── plugin.php
    ├── readme.txt
    └── assets/
```

**Fix**: Always include plugin folder in ZIP.

### 2. Missing HTTPS

```php
// ❌ Bad
$url = 'http://example.com/updates.json';

// ✅ Good
$url = 'https://example.com/updates.json';
```

**Fix**: Always use HTTPS for update URLs.

### 3. Not Caching Requests

```php
// ❌ Bad: Checks every page load
$remote = wp_remote_get($update_url);

// ✅ Good: Cache for 12 hours
$cached = get_transient('my_plugin_update_data');
if (false === $cached) {
    $remote = wp_remote_get($update_url);
    $cached = wp_remote_retrieve_body($remote);
    set_transient('my_plugin_update_data', $cached, 12 * HOUR_IN_SECONDS);
}
```

**Fix**: Always cache remote requests.

### 4. Hardcoded Tokens

```php
// ❌ Bad
$updateChecker->setAuthentication('ghp_abc123');

// ✅ Good
if (defined('MY_PLUGIN_TOKEN')) {
    $updateChecker->setAuthentication(MY_PLUGIN_TOKEN);
}
```

**Fix**: Use constants or encrypted options.

### 5. No Error Handling

```php
// ❌ Bad
$remote = wp_remote_get($url);
$data = json_decode(wp_remote_retrieve_body($remote));

// ✅ Good
$remote = wp_remote_get($url);

if (is_wp_error($remote)) {
    error_log('Update check failed: ' . $remote->get_error_message());
    return $transient;
}

if (200 !== wp_remote_retrieve_response_code($remote)) {
    error_log('Update check returned: ' . wp_remote_retrieve_response_code($remote));
    return $transient;
}

$data = json_decode(wp_remote_retrieve_body($remote));

if (!$data || !isset($data->version)) {
    error_log('Invalid update data received');
    return $transient;
}
```

**Fix**: Always validate responses.

### 6. Version Comparison Issues

```php
// ❌ Bad: String comparison
if (MY_PLUGIN_VERSION < $remote_data->version) {
    // Fails: "1.10.0" < "1.2.0" = false (string comparison)
}

// ✅ Good: Semantic version comparison
if (version_compare(MY_PLUGIN_VERSION, $remote_data->version, '<')) {
    // Correctly: "1.10.0" < "1.2.0" = false (semantic comparison)
}
```

**Fix**: Use `version_compare()`.

### 7. Forgetting to Flush Cache

```php
// After updating plugin, clear cached update data
add_action('upgrader_process_complete', 'my_plugin_clear_cache');
function my_plugin_clear_cache() {
    delete_transient('my_plugin_update_cache');
}
```

**Fix**: Clear transients after updates.

---

## Resources

### Official Documentation

- **Plugin Update Checker**: https://github.com/YahnisElsts/plugin-update-checker
- **Git Updater**: https://github.com/afragen/git-updater/wiki
- **WordPress Plugin API**: https://developer.wordpress.org/plugins/
- **Transients API**: https://developer.wordpress.org/apis/transients/

### Tutorials

- **Self-Hosted Updates**: https://rudrastyh.com/wordpress/self-hosted-plugin-update.html
- **GitHub Updates**: https://code.tutsplus.com/tutorials/distributing-your-plugins-in-github-with-automatic-updates--wp-34817
- **Serverless Update Server**: https://macarthur.me/posts/serverless-wordpress-plugin-update-server/

### Security

- **WordPress Security**: https://developer.wordpress.org/plugins/wordpress-org/plugin-security/
- **Checksum Verification**: https://developer.wordpress.org/cli/commands/plugin/verify-checksums/
- **Package Signing Proposal**: https://core.trac.wordpress.org/ticket/39309

### Commercial Platforms

- **Freemius**: https://freemius.com
- **EDD Software Licensing**: https://easydigitaldownloads.com/downloads/software-licensing/

---

**Recommended**: For most developers, use **Plugin Update Checker** with GitHub. It provides the best balance of simplicity, features, and security.

**Next Steps**:
1. Choose your update strategy
2. See `examples/github-updater.php` for complete working example
3. Implement in your plugin
4. Test thoroughly before releasing

---

**Last Updated**: 2025-11-06
**Version**: 1.0.0
