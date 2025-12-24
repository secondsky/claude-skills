<?php
/**
 * Plugin Name:       My PSR-4 Plugin
 * Plugin URI:        https://example.com/my-psr4-plugin/
 * Description:       A modern WordPress plugin using PSR-4 autoloading with Composer and namespaces.
 * Version:           1.0.0
 * Requires at least: 5.9
 * Requires PHP:      7.4
 * Author:            Your Name
 * Author URI:        https://example.com/
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       my-psr4-plugin
 * Domain Path:       /languages
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Define plugin constants
define( 'MYPP_VERSION', '1.0.0' );
define( 'MYPP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'MYPP_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'MYPP_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

// Require Composer autoloader
if ( file_exists( MYPP_PLUGIN_DIR . 'vendor/autoload.php' ) ) {
	require_once MYPP_PLUGIN_DIR . 'vendor/autoload.php';
} else {
	// Show admin notice if autoloader is missing
	add_action( 'admin_notices', function() {
		?>
		<div class="notice notice-error">
			<p>
				<?php
				printf(
					/* translators: %s: command to run */
					esc_html__( 'My PSR-4 Plugin requires Composer dependencies. Please run %s in the plugin directory.', 'my-psr4-plugin' ),
					'<code>composer install</code>'
				);
				?>
			</p>
		</div>
		<?php
	} );
	return;
}

// Initialize plugin
\MyPSR4Plugin\Plugin::get_instance();

// Activation hook
register_activation_hook( __FILE__, array( \MyPSR4Plugin\Plugin::get_instance(), 'activate' ) );

// Deactivation hook
register_deactivation_hook( __FILE__, array( \MyPSR4Plugin\Plugin::get_instance(), 'deactivate' ) );
