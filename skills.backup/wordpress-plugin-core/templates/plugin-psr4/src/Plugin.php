<?php
/**
 * Main Plugin class
 *
 * @package MyPSR4Plugin
 */

namespace MyPSR4Plugin;

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Main Plugin class
 */
class Plugin {

	/**
	 * Single instance of the class
	 *
	 * @var Plugin
	 */
	private static $instance = null;

	/**
	 * Get singleton instance
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
	 * Constructor
	 */
	private function __construct() {
		$this->init_hooks();
	}

	/**
	 * Prevent cloning
	 */
	private function __clone() {}

	/**
	 * Prevent unserializing
	 */
	public function __wakeup() {
		throw new \Exception( 'Cannot unserialize singleton' );
	}

	/**
	 * Initialize WordPress hooks
	 */
	private function init_hooks() {
		add_action( 'init', array( $this, 'init' ) );
		add_action( 'admin_menu', array( $this, 'register_admin_pages' ) );
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
	}

	/**
	 * Initialize plugin
	 */
	public function init() {
		// Load text domain
		load_plugin_textdomain(
			'my-psr4-plugin',
			false,
			dirname( MYPP_PLUGIN_BASENAME ) . '/languages'
		);

		// Initialize submodules
		PostTypes\Book::get_instance();
		Taxonomies\Genre::get_instance();
		Admin\Settings::get_instance();
		Frontend\Assets::get_instance();
		API\BookEndpoints::get_instance();
	}

	/**
	 * Register admin pages
	 */
	public function register_admin_pages() {
		// Admin pages are handled by Admin\Settings class
	}

	/**
	 * Register REST routes
	 */
	public function register_rest_routes() {
		// REST routes are handled by API\BookEndpoints class
	}

	/**
	 * Plugin activation
	 */
	public function activate() {
		// Register post types and taxonomies
		PostTypes\Book::get_instance()->register();
		Taxonomies\Genre::get_instance()->register();

		// Flush rewrite rules
		flush_rewrite_rules();

		// Set default options
		Admin\Settings::get_instance()->set_defaults();

		// Set activation timestamp
		if ( false === get_option( 'mypp_activated_time' ) ) {
			add_option( 'mypp_activated_time', current_time( 'timestamp' ) );
		}
	}

	/**
	 * Plugin deactivation
	 */
	public function deactivate() {
		// Flush rewrite rules
		flush_rewrite_rules();

		// Clear scheduled events
		wp_clear_scheduled_hook( 'mypp_cron_event' );
	}
}
