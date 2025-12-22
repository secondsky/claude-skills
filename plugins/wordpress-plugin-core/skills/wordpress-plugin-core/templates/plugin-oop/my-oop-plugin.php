<?php
/**
 * Plugin Name:       My OOP Plugin
 * Plugin URI:        https://example.com/my-oop-plugin/
 * Description:       An object-oriented WordPress plugin using singleton pattern with security best practices.
 * Version:           1.0.0
 * Requires at least: 5.9
 * Requires PHP:      7.4
 * Author:            Your Name
 * Author URI:        https://example.com/
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       my-oop-plugin
 * Domain Path:       /languages
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Main plugin class using singleton pattern
 */
class My_OOP_Plugin {

	/**
	 * Single instance of the class
	 *
	 * @var My_OOP_Plugin
	 */
	private static $instance = null;

	/**
	 * Plugin version
	 *
	 * @var string
	 */
	const VERSION = '1.0.0';

	/**
	 * Plugin directory path
	 *
	 * @var string
	 */
	private $plugin_dir;

	/**
	 * Plugin directory URL
	 *
	 * @var string
	 */
	private $plugin_url;

	/**
	 * Get singleton instance
	 *
	 * @return My_OOP_Plugin
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor - Initialize plugin
	 */
	private function __construct() {
		$this->plugin_dir = plugin_dir_path( __FILE__ );
		$this->plugin_url = plugin_dir_url( __FILE__ );

		$this->define_constants();
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
		throw new Exception( 'Cannot unserialize singleton' );
	}

	/**
	 * Define plugin constants
	 */
	private function define_constants() {
		define( 'MYOP_VERSION', self::VERSION );
		define( 'MYOP_PLUGIN_DIR', $this->plugin_dir );
		define( 'MYOP_PLUGIN_URL', $this->plugin_url );
		define( 'MYOP_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );
	}

	/**
	 * Initialize WordPress hooks
	 */
	private function init_hooks() {
		// Core hooks
		add_action( 'init', array( $this, 'init' ) );
		add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

		// AJAX hooks
		add_action( 'wp_ajax_myop_action', array( $this, 'ajax_handler' ) );
		add_action( 'wp_ajax_nopriv_myop_action', array( $this, 'ajax_handler_nopriv' ) );

		// REST API hooks
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );

		// Activation/Deactivation
		register_activation_hook( __FILE__, array( $this, 'activate' ) );
		register_deactivation_hook( __FILE__, array( $this, 'deactivate' ) );
	}

	/**
	 * Initialize plugin functionality
	 */
	public function init() {
		// Load text domain
		load_plugin_textdomain(
			'my-oop-plugin',
			false,
			dirname( MYOP_PLUGIN_BASENAME ) . '/languages'
		);

		// Register custom post type
		$this->register_post_types();

		// Register taxonomies
		$this->register_taxonomies();
	}

	/**
	 * Register custom post types
	 */
	private function register_post_types() {
		$labels = array(
			'name'               => _x( 'Books', 'post type general name', 'my-oop-plugin' ),
			'singular_name'      => _x( 'Book', 'post type singular name', 'my-oop-plugin' ),
			'menu_name'          => _x( 'Books', 'admin menu', 'my-oop-plugin' ),
			'add_new'            => _x( 'Add New', 'book', 'my-oop-plugin' ),
			'add_new_item'       => __( 'Add New Book', 'my-oop-plugin' ),
			'edit_item'          => __( 'Edit Book', 'my-oop-plugin' ),
			'new_item'           => __( 'New Book', 'my-oop-plugin' ),
			'view_item'          => __( 'View Book', 'my-oop-plugin' ),
			'search_items'       => __( 'Search Books', 'my-oop-plugin' ),
			'not_found'          => __( 'No books found', 'my-oop-plugin' ),
			'not_found_in_trash' => __( 'No books found in Trash', 'my-oop-plugin' ),
		);

		$args = array(
			'labels'             => $labels,
			'public'             => true,
			'publicly_queryable' => true,
			'show_ui'            => true,
			'show_in_menu'       => true,
			'query_var'          => true,
			'rewrite'            => array( 'slug' => 'books' ),
			'capability_type'    => 'post',
			'has_archive'        => true,
			'hierarchical'       => false,
			'menu_position'      => 5,
			'menu_icon'          => 'dashicons-book',
			'show_in_rest'       => true,
			'supports'           => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
		);

		register_post_type( 'book', $args );
	}

	/**
	 * Register taxonomies
	 */
	private function register_taxonomies() {
		$labels = array(
			'name'              => _x( 'Genres', 'taxonomy general name', 'my-oop-plugin' ),
			'singular_name'     => _x( 'Genre', 'taxonomy singular name', 'my-oop-plugin' ),
			'search_items'      => __( 'Search Genres', 'my-oop-plugin' ),
			'all_items'         => __( 'All Genres', 'my-oop-plugin' ),
			'parent_item'       => __( 'Parent Genre', 'my-oop-plugin' ),
			'parent_item_colon' => __( 'Parent Genre:', 'my-oop-plugin' ),
			'edit_item'         => __( 'Edit Genre', 'my-oop-plugin' ),
			'update_item'       => __( 'Update Genre', 'my-oop-plugin' ),
			'add_new_item'      => __( 'Add New Genre', 'my-oop-plugin' ),
			'new_item_name'     => __( 'New Genre Name', 'my-oop-plugin' ),
			'menu_name'         => __( 'Genres', 'my-oop-plugin' ),
		);

		$args = array(
			'hierarchical'      => true,
			'labels'            => $labels,
			'show_ui'           => true,
			'show_admin_column' => true,
			'query_var'         => true,
			'rewrite'           => array( 'slug' => 'genre' ),
			'show_in_rest'      => true,
		);

		register_taxonomy( 'genre', array( 'book' ), $args );
	}

	/**
	 * Add admin menu pages
	 */
	public function add_admin_menu() {
		add_options_page(
			__( 'My OOP Plugin Settings', 'my-oop-plugin' ),
			__( 'OOP Plugin', 'my-oop-plugin' ),
			'manage_options',
			'my-oop-plugin',
			array( $this, 'render_settings_page' )
		);
	}

	/**
	 * Render settings page
	 */
	public function render_settings_page() {
		// Check user capabilities
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		// Handle form submission
		if ( isset( $_POST['myop_settings_submit'] ) ) {
			$this->save_settings();
		}

		// Get current settings
		$settings = $this->get_settings();

		// Render page
		include $this->plugin_dir . 'views/admin-settings.php';
	}

	/**
	 * Save plugin settings
	 */
	private function save_settings() {
		// Verify nonce
		if ( ! isset( $_POST['myop_settings_nonce'] ) ||
		     ! wp_verify_nonce( $_POST['myop_settings_nonce'], 'myop_settings_action' ) ) {
			wp_die( __( 'Security check failed', 'my-oop-plugin' ) );
		}

		// Sanitize and save settings
		$settings = array(
			'option1' => isset( $_POST['myop_option1'] ) ? sanitize_text_field( $_POST['myop_option1'] ) : '',
			'option2' => isset( $_POST['myop_option2'] ) ? absint( $_POST['myop_option2'] ) : 0,
			'option3' => isset( $_POST['myop_option3'] ) ? (bool) $_POST['myop_option3'] : false,
		);

		update_option( 'myop_settings', $settings );

		add_settings_error(
			'myop_messages',
			'myop_message',
			__( 'Settings Saved', 'my-oop-plugin' ),
			'updated'
		);
	}

	/**
	 * Get plugin settings
	 *
	 * @return array
	 */
	private function get_settings() {
		$defaults = array(
			'option1' => '',
			'option2' => 0,
			'option3' => false,
		);

		$settings = get_option( 'myop_settings', $defaults );

		return wp_parse_args( $settings, $defaults );
	}

	/**
	 * Enqueue admin scripts and styles
	 *
	 * @param string $hook Current admin page hook
	 */
	public function admin_enqueue_scripts( $hook ) {
		// Only load on specific pages
		if ( 'edit.php' !== $hook && 'post.php' !== $hook && 'post-new.php' !== $hook ) {
			return;
		}

		$screen = get_current_screen();
		if ( $screen && 'book' === $screen->post_type ) {
			wp_enqueue_style(
				'myop-admin-style',
				$this->plugin_url . 'assets/css/admin-style.css',
				array(),
				self::VERSION
			);

			wp_enqueue_script(
				'myop-admin-script',
				$this->plugin_url . 'assets/js/admin-script.js',
				array( 'jquery' ),
				self::VERSION,
				true
			);

			wp_localize_script(
				'myop-admin-script',
				'myopData',
				array(
					'ajax_url' => admin_url( 'admin-ajax.php' ),
					'nonce'    => wp_create_nonce( 'myop_ajax_nonce' ),
				)
			);
		}
	}

	/**
	 * Enqueue frontend scripts and styles
	 */
	public function enqueue_scripts() {
		if ( is_singular( 'book' ) ) {
			wp_enqueue_style(
				'myop-style',
				$this->plugin_url . 'assets/css/style.css',
				array(),
				self::VERSION
			);

			wp_enqueue_script(
				'myop-script',
				$this->plugin_url . 'assets/js/script.js',
				array( 'jquery' ),
				self::VERSION,
				true
			);
		}
	}

	/**
	 * AJAX handler (for logged-in users)
	 */
	public function ajax_handler() {
		// Verify nonce
		check_ajax_referer( 'myop_ajax_nonce', 'nonce' );

		// Check capability
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied', 'my-oop-plugin' ) ) );
		}

		// Get and sanitize input
		$input = isset( $_POST['data'] ) ? sanitize_text_field( $_POST['data'] ) : '';

		// Process data
		$result = $this->process_ajax_data( $input );

		// Return response
		wp_send_json_success( array(
			'message' => __( 'Success!', 'my-oop-plugin' ),
			'data'    => $result,
		) );
	}

	/**
	 * AJAX handler (for non-logged-in users)
	 */
	public function ajax_handler_nopriv() {
		// For public AJAX requests
		wp_send_json_error( array( 'message' => __( 'Login required', 'my-oop-plugin' ) ) );
	}

	/**
	 * Process AJAX data
	 *
	 * @param string $data Input data
	 * @return mixed
	 */
	private function process_ajax_data( $data ) {
		// Process your data here
		return $data;
	}

	/**
	 * Register REST API routes
	 */
	public function register_rest_routes() {
		register_rest_route(
			'myop/v1',
			'/books',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'rest_get_books' ),
				'permission_callback' => array( $this, 'rest_permission_check' ),
			)
		);

		register_rest_route(
			'myop/v1',
			'/books/(?P<id>\d+)',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'rest_get_book' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'id' => array(
						'required'          => true,
						'validate_callback' => function( $param ) {
							return is_numeric( $param );
						},
						'sanitize_callback' => 'absint',
					),
				),
			)
		);
	}

	/**
	 * REST API permission check
	 *
	 * @return bool
	 */
	public function rest_permission_check() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * REST API endpoint: Get books
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response|WP_Error
	 */
	public function rest_get_books( $request ) {
		$args = array(
			'post_type'      => 'book',
			'posts_per_page' => 10,
			'post_status'    => 'publish',
		);

		$books = get_posts( $args );

		$data = array();
		foreach ( $books as $book ) {
			$data[] = array(
				'id'      => $book->ID,
				'title'   => $book->post_title,
				'content' => $book->post_content,
				'excerpt' => $book->post_excerpt,
			);
		}

		return rest_ensure_response( $data );
	}

	/**
	 * REST API endpoint: Get single book
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response|WP_Error
	 */
	public function rest_get_book( $request ) {
		$book_id = $request->get_param( 'id' );
		$book    = get_post( $book_id );

		if ( ! $book || 'book' !== $book->post_type ) {
			return new WP_Error( 'not_found', __( 'Book not found', 'my-oop-plugin' ), array( 'status' => 404 ) );
		}

		$data = array(
			'id'      => $book->ID,
			'title'   => $book->post_title,
			'content' => $book->post_content,
			'excerpt' => $book->post_excerpt,
		);

		return rest_ensure_response( $data );
	}

	/**
	 * Plugin activation
	 */
	public function activate() {
		// Register post types and taxonomies
		$this->register_post_types();
		$this->register_taxonomies();

		// Flush rewrite rules
		flush_rewrite_rules();

		// Set default settings
		if ( false === get_option( 'myop_settings' ) ) {
			add_option( 'myop_settings', array(
				'option1' => '',
				'option2' => 0,
				'option3' => false,
			) );
		}

		// Set activation timestamp
		if ( false === get_option( 'myop_activated_time' ) ) {
			add_option( 'myop_activated_time', current_time( 'timestamp' ) );
		}
	}

	/**
	 * Plugin deactivation
	 */
	public function deactivate() {
		// Flush rewrite rules
		flush_rewrite_rules();

		// Clear scheduled events
		wp_clear_scheduled_hook( 'myop_cron_event' );
	}
}

// Initialize plugin
My_OOP_Plugin::get_instance();
