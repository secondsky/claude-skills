<?php
/**
 * Example: GitHub Auto-Updates
 *
 * This example demonstrates how to implement automatic updates from GitHub
 * using the Plugin Update Checker library by YahnisElsts.
 *
 * Features:
 * - Automatic updates from GitHub releases, tags, or branches
 * - Support for public and private repositories
 * - License key integration (optional)
 * - Secure token storage
 * - Error handling and fallbacks
 *
 * @package YourPlugin
 * @see https://github.com/YahnisElsts/plugin-update-checker
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * ===================================================================
 * Example 1: Basic GitHub Updates (Public Repository)
 * ===================================================================
 *
 * Simplest implementation for public GitHub repositories.
 */

// Include Plugin Update Checker library
require plugin_dir_path( __FILE__ ) . 'plugin-update-checker/plugin-update-checker.php';
use YahnisElsts\PluginUpdateChecker\v5\PucFactory;

// Initialize update checker
$updateChecker = PucFactory::buildUpdateChecker(
	'https://github.com/yourusername/your-plugin/',
	__FILE__, // Full path to main plugin file
	'your-plugin' // Plugin slug
);

// Optional: Set branch (default: master/main)
$updateChecker->setBranch( 'main' );

/**
 * ===================================================================
 * Example 2: GitHub Releases (Recommended)
 * ===================================================================
 *
 * Use GitHub Releases for professional versioning with release notes.
 * This downloads pre-built ZIP from releases instead of source code.
 */

$updateChecker = PucFactory::buildUpdateChecker(
	'https://github.com/yourusername/your-plugin/',
	__FILE__,
	'your-plugin'
);

// Download from releases instead of source
$updateChecker->getVcsApi()->enableReleaseAssets();

/**
 * To create a release:
 * 1. Update version in plugin header
 * 2. Commit: git commit -m "Bump version to 1.0.1"
 * 3. Tag: git tag 1.0.1 && git push origin 1.0.1
 * 4. Create GitHub Release with pre-built ZIP (optional)
 */

/**
 * ===================================================================
 * Example 3: Private Repository with Authentication
 * ===================================================================
 *
 * For private repositories, use a Personal Access Token.
 */

$updateChecker = PucFactory::buildUpdateChecker(
	'https://github.com/yourusername/private-plugin/',
	__FILE__,
	'private-plugin'
);

// Set authentication token
$updateChecker->setAuthentication( 'ghp_YourGitHubPersonalAccessToken' );

/**
 * SECURITY: Never hardcode tokens!
 * Use wp-config.php constant instead:
 *
 * In wp-config.php:
 * define( 'MY_PLUGIN_GITHUB_TOKEN', 'ghp_xxx' );
 *
 * In plugin:
 * if ( defined( 'MY_PLUGIN_GITHUB_TOKEN' ) ) {
 *     $updateChecker->setAuthentication( MY_PLUGIN_GITHUB_TOKEN );
 * }
 */

/**
 * ===================================================================
 * Example 4: Complete Implementation with Best Practices
 * ===================================================================
 *
 * Production-ready implementation with error handling, caching,
 * and optional license integration.
 */

/**
 * Initialize GitHub auto-updates
 */
function yourprefix_init_github_updates() {
	// Path to update checker library
	$updater_path = plugin_dir_path( __FILE__ ) . 'plugin-update-checker/plugin-update-checker.php';

	// Check if library exists
	if ( ! file_exists( $updater_path ) ) {
		add_action( 'admin_notices', 'yourprefix_update_checker_missing_notice' );
		return;
	}

	require $updater_path;

	// Initialize update checker
	$updateChecker = YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
		'https://github.com/yourusername/your-plugin/',
		__FILE__,
		'your-plugin'
	);

	// Set branch
	$updateChecker->setBranch( 'main' );

	// Use GitHub Releases
	$updateChecker->getVcsApi()->enableReleaseAssets();

	// Private repo authentication (from wp-config.php)
	if ( defined( 'YOURPREFIX_GITHUB_TOKEN' ) ) {
		$updateChecker->setAuthentication( YOURPREFIX_GITHUB_TOKEN );
	}

	// Optional: License-based updates
	$license_key = get_option( 'yourprefix_license_key' );
	if ( ! empty( $license_key ) && yourprefix_validate_license( $license_key ) ) {
		// Use license key as authentication token
		$updateChecker->setAuthentication( $license_key );
	}

	// Optional: Custom update checks
	add_filter( 'puc_request_info_result-your-plugin', 'yourprefix_filter_update_checks', 10, 2 );
}
add_action( 'plugins_loaded', 'yourprefix_init_github_updates' );

/**
 * Admin notice if update checker library is missing
 */
function yourprefix_update_checker_missing_notice() {
	?>
	<div class="notice notice-error">
		<p>
			<strong><?php esc_html_e( 'Your Plugin:', 'your-plugin' ); ?></strong>
			<?php esc_html_e( 'Update checker library not found. Automatic updates are disabled.', 'your-plugin' ); ?>
		</p>
	</div>
	<?php
}

/**
 * Validate license key (example implementation)
 *
 * @param string $license_key License key to validate.
 * @return bool True if valid, false otherwise.
 */
function yourprefix_validate_license( $license_key ) {
	// Check cached validation result
	$cached = get_transient( 'yourprefix_license_valid_' . md5( $license_key ) );
	if ( false !== $cached ) {
		return (bool) $cached;
	}

	// Validate with your license server
	$response = wp_remote_post(
		'https://example.com/api/validate-license',
		array(
			'body' => array(
				'license' => sanitize_text_field( $license_key ),
				'domain'  => home_url(),
				'product' => 'your-plugin',
			),
		)
	);

	if ( is_wp_error( $response ) ) {
		return false;
	}

	$body = json_decode( wp_remote_retrieve_body( $response ) );

	if ( ! $body || ! isset( $body->valid ) ) {
		return false;
	}

	$is_valid = (bool) $body->valid;

	// Cache for 24 hours
	set_transient( 'yourprefix_license_valid_' . md5( $license_key ), $is_valid, DAY_IN_SECONDS );

	return $is_valid;
}

/**
 * Filter update checks (optional)
 *
 * Allows custom logic before updates are offered.
 *
 * @param object $info Update information from GitHub.
 * @param object $result Response from GitHub API.
 * @return object Modified update information.
 */
function yourprefix_filter_update_checks( $info, $result ) {
	// Example: Block updates if license is invalid
	$license_key = get_option( 'yourprefix_license_key' );
	if ( empty( $license_key ) || ! yourprefix_validate_license( $license_key ) ) {
		return null; // Don't show update
	}

	// Example: Add custom data
	if ( $info ) {
		$info->tested = '6.4'; // Override "Tested up to" version
	}

	return $info;
}

/**
 * ===================================================================
 * Example 5: Multiple Update Channels (Stable + Beta)
 * ===================================================================
 *
 * Offer beta updates to users who opt in.
 */

function yourprefix_init_multi_channel_updates() {
	$updater_path = plugin_dir_path( __FILE__ ) . 'plugin-update-checker/plugin-update-checker.php';

	if ( ! file_exists( $updater_path ) ) {
		return;
	}

	require $updater_path;

	$updateChecker = YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
		'https://github.com/yourusername/your-plugin/',
		__FILE__,
		'your-plugin'
	);

	// Check if user opted into beta updates
	$beta_enabled = get_option( 'yourprefix_enable_beta_updates', false );

	if ( $beta_enabled ) {
		// Use beta branch
		$updateChecker->setBranch( 'beta' );
	} else {
		// Use stable releases
		$updateChecker->setBranch( 'main' );
		$updateChecker->getVcsApi()->enableReleaseAssets();
	}
}
add_action( 'plugins_loaded', 'yourprefix_init_multi_channel_updates' );

/**
 * Settings field for beta opt-in
 */
function yourprefix_add_beta_settings() {
	add_settings_field(
		'yourprefix_enable_beta',
		__( 'Enable Beta Updates', 'your-plugin' ),
		'yourprefix_render_beta_field',
		'your-plugin-settings',
		'yourprefix_general_section'
	);
}
add_action( 'admin_init', 'yourprefix_add_beta_settings' );

/**
 * Render beta updates checkbox
 */
function yourprefix_render_beta_field() {
	$enabled = get_option( 'yourprefix_enable_beta_updates', false );
	?>
	<label>
		<input type="checkbox" name="yourprefix_enable_beta_updates" value="1" <?php checked( $enabled, true ); ?>>
		<?php esc_html_e( 'Receive beta updates (may be unstable)', 'your-plugin' ); ?>
	</label>
	<p class="description">
		<?php esc_html_e( 'Enable this to test new features before stable release.', 'your-plugin' ); ?>
	</p>
	<?php
}

/**
 * ===================================================================
 * Example 6: GitLab Support
 * ===================================================================
 *
 * Plugin Update Checker also supports GitLab and Bitbucket.
 */

$updateChecker = PucFactory::buildUpdateChecker(
	'https://gitlab.com/yourusername/your-plugin',
	__FILE__,
	'your-plugin'
);

// GitLab authentication
$updateChecker->setAuthentication( 'your-gitlab-private-token' );

/**
 * ===================================================================
 * Example 7: Custom JSON Update Server
 * ===================================================================
 *
 * Use a custom update server with JSON endpoint.
 */

$updateChecker = PucFactory::buildUpdateChecker(
	'https://example.com/updates/your-plugin.json',
	__FILE__,
	'your-plugin'
);

/**
 * JSON format:
 * {
 *   "version": "1.0.1",
 *   "download_url": "https://example.com/downloads/your-plugin-1.0.1.zip",
 *   "sections": {
 *     "description": "Plugin description",
 *     "changelog": "<h4>1.0.1</h4><ul><li>Bug fixes</li></ul>"
 *   },
 *   "tested": "6.4",
 *   "requires": "5.9",
 *   "requires_php": "7.4"
 * }
 */

/**
 * ===================================================================
 * Example 8: Logging and Debugging
 * ===================================================================
 *
 * Enable logging for troubleshooting update issues.
 */

function yourprefix_init_updates_with_logging() {
	$updater_path = plugin_dir_path( __FILE__ ) . 'plugin-update-checker/plugin-update-checker.php';

	if ( ! file_exists( $updater_path ) ) {
		return;
	}

	require $updater_path;

	$updateChecker = YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
		'https://github.com/yourusername/your-plugin/',
		__FILE__,
		'your-plugin'
	);

	// Enable debug mode (logs to error_log)
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		// Log all API requests
		add_action(
			'puc_api_request_start',
			function ( $url, $args ) {
				error_log( sprintf( '[Plugin Updates] Checking: %s', $url ) );
			},
			10,
			2
		);

		// Log API responses
		add_action(
			'puc_api_request_end',
			function ( $response, $url ) {
				if ( is_wp_error( $response ) ) {
					error_log( sprintf( '[Plugin Updates] Error: %s', $response->get_error_message() ) );
				} else {
					error_log( sprintf( '[Plugin Updates] Success: %d bytes received', strlen( wp_remote_retrieve_body( $response ) ) ) );
				}
			},
			10,
			2
		);
	}
}
add_action( 'plugins_loaded', 'yourprefix_init_updates_with_logging' );

/**
 * ===================================================================
 * Example 9: Rate Limiting Update Checks
 * ===================================================================
 *
 * Prevent excessive API calls to GitHub.
 */

function yourprefix_init_rate_limited_updates() {
	$updater_path = plugin_dir_path( __FILE__ ) . 'plugin-update-checker/plugin-update-checker.php';

	if ( ! file_exists( $updater_path ) ) {
		return;
	}

	require $updater_path;

	$updateChecker = YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
		'https://github.com/yourusername/your-plugin/',
		__FILE__,
		'your-plugin'
	);

	// Set custom check period (in hours)
	$updateChecker->setCheckPeriod( 12 ); // Check every 12 hours instead of default
}
add_action( 'plugins_loaded', 'yourprefix_init_rate_limited_updates' );

/**
 * ===================================================================
 * Example 10: Cleanup on Uninstall
 * ===================================================================
 *
 * Remove update checker transients when plugin is uninstalled.
 */

// In uninstall.php
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Delete update checker transients
global $wpdb;

// Delete all transients for this plugin
$wpdb->query(
	$wpdb->prepare(
		"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
		'%puc_update_cache_your-plugin%'
	)
);

$wpdb->query(
	$wpdb->prepare(
		"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
		'%puc_cron_check_your-plugin%'
	)
);

/**
 * ===================================================================
 * Security Notes
 * ===================================================================
 *
 * 1. ALWAYS use HTTPS for repository URLs
 * 2. NEVER hardcode authentication tokens in plugin code
 * 3. Store tokens in wp-config.php or encrypt them
 * 4. Implement license validation before offering updates
 * 5. Use checksums to verify downloaded files (see references/github-auto-updates.md)
 * 6. Rate limit update checks to avoid API throttling
 * 7. Log errors for debugging but don't expose sensitive data
 * 8. Clear cached update data after installation
 */

/**
 * ===================================================================
 * Installation Checklist
 * ===================================================================
 *
 * 1. Install Plugin Update Checker library:
 *    cd your-plugin/
 *    git submodule add https://github.com/YahnisElsts/plugin-update-checker.git
 *
 * 2. Add initialization code (see examples above)
 *
 * 3. For private repos, add token to wp-config.php:
 *    define( 'YOUR_PLUGIN_GITHUB_TOKEN', 'ghp_xxx' );
 *
 * 4. Test by creating a new tag on GitHub:
 *    git tag 1.0.1
 *    git push origin 1.0.1
 *
 * 5. Check for updates in WordPress admin:
 *    Dashboard → Updates → Should show your plugin
 *
 * 6. (Optional) Create GitHub Release for better UX:
 *    - Go to GitHub → Releases → Create Release
 *    - Upload pre-built ZIP (without .git, tests, etc.)
 *    - Add release notes
 */

/**
 * ===================================================================
 * Troubleshooting
 * ===================================================================
 *
 * Updates not showing?
 * 1. Check plugin version in header matches current version
 * 2. Verify GitHub repository URL is correct
 * 3. Ensure authentication token is valid (for private repos)
 * 4. Check WordPress debug log for errors
 * 5. Manually clear transients: delete_site_transient( 'update_plugins' )
 * 6. Verify GitHub has releases or tags
 *
 * Wrong version downloaded?
 * 1. Ensure you're using git tags or GitHub Releases
 * 2. Check branch setting matches your repository
 * 3. Verify version numbers use semantic versioning (1.0.0, not v1.0.0)
 *
 * Installation fails?
 * 1. Verify ZIP structure includes plugin folder inside ZIP
 * 2. Check file permissions on server
 * 3. Ensure no syntax errors in updated files
 * 4. Check WordPress debug log for specific error messages
 */

/**
 * ===================================================================
 * Additional Resources
 * ===================================================================
 *
 * - Plugin Update Checker Documentation:
 *   https://github.com/YahnisElsts/plugin-update-checker
 *
 * - Complete guide with security best practices:
 *   See references/github-auto-updates.md
 *
 * - WordPress Plugin API:
 *   https://developer.wordpress.org/plugins/
 *
 * - GitHub Personal Access Tokens:
 *   https://github.com/settings/tokens
 */
