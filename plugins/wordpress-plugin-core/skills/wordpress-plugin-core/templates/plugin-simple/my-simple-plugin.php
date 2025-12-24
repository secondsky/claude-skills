<?php
/**
 * Plugin Name:       My Simple Plugin
 * Plugin URI:        https://example.com/my-simple-plugin/
 * Description:       A simple WordPress plugin demonstrating functional programming pattern with security best practices.
 * Version:           1.0.0
 * Requires at least: 5.9
 * Requires PHP:      7.4
 * Author:            Your Name
 * Author URI:        https://example.com/
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       my-simple-plugin
 * Domain Path:       /languages
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Define plugin constants
define( 'MYSP_VERSION', '1.0.0' );
define( 'MYSP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'MYSP_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'MYSP_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

/**
 * Initialize the plugin
 */
function mysp_init() {
	// Load text domain for translations
	load_plugin_textdomain( 'my-simple-plugin', false, dirname( MYSP_PLUGIN_BASENAME ) . '/languages' );

	// Register custom post type (example)
	mysp_register_book_post_type();
}
add_action( 'init', 'mysp_init' );

/**
 * Register a custom post type (example)
 */
function mysp_register_book_post_type() {
	$labels = array(
		'name'               => _x( 'Books', 'post type general name', 'my-simple-plugin' ),
		'singular_name'      => _x( 'Book', 'post type singular name', 'my-simple-plugin' ),
		'menu_name'          => _x( 'Books', 'admin menu', 'my-simple-plugin' ),
		'add_new'            => _x( 'Add New', 'book', 'my-simple-plugin' ),
		'add_new_item'       => __( 'Add New Book', 'my-simple-plugin' ),
		'edit_item'          => __( 'Edit Book', 'my-simple-plugin' ),
		'new_item'           => __( 'New Book', 'my-simple-plugin' ),
		'view_item'          => __( 'View Book', 'my-simple-plugin' ),
		'search_items'       => __( 'Search Books', 'my-simple-plugin' ),
		'not_found'          => __( 'No books found', 'my-simple-plugin' ),
		'not_found_in_trash' => __( 'No books found in Trash', 'my-simple-plugin' ),
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
		'show_in_rest'       => true, // Enable Gutenberg editor
		'supports'           => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
	);

	register_post_type( 'book', $args );
}

/**
 * Enqueue admin scripts and styles
 */
function mysp_admin_enqueue_scripts( $hook ) {
	// Only load on specific admin pages
	if ( 'edit.php' !== $hook && 'post.php' !== $hook && 'post-new.php' !== $hook ) {
		return;
	}

	$screen = get_current_screen();
	if ( $screen && 'book' === $screen->post_type ) {
		wp_enqueue_style(
			'mysp-admin-style',
			MYSP_PLUGIN_URL . 'assets/css/admin-style.css',
			array(),
			MYSP_VERSION
		);

		wp_enqueue_script(
			'mysp-admin-script',
			MYSP_PLUGIN_URL . 'assets/js/admin-script.js',
			array( 'jquery' ),
			MYSP_VERSION,
			true
		);

		// Localize script with nonce and AJAX URL
		wp_localize_script(
			'mysp-admin-script',
			'myspData',
			array(
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'nonce'    => wp_create_nonce( 'mysp_ajax_nonce' ),
			)
		);
	}
}
add_action( 'admin_enqueue_scripts', 'mysp_admin_enqueue_scripts' );

/**
 * Enqueue frontend scripts and styles
 */
function mysp_enqueue_scripts() {
	// Only load on single book pages
	if ( is_singular( 'book' ) ) {
		wp_enqueue_style(
			'mysp-style',
			MYSP_PLUGIN_URL . 'assets/css/style.css',
			array(),
			MYSP_VERSION
		);

		wp_enqueue_script(
			'mysp-script',
			MYSP_PLUGIN_URL . 'assets/js/script.js',
			array( 'jquery' ),
			MYSP_VERSION,
			true
		);
	}
}
add_action( 'wp_enqueue_scripts', 'mysp_enqueue_scripts' );

/**
 * Add settings page to admin menu
 */
function mysp_add_settings_page() {
	add_options_page(
		__( 'My Simple Plugin Settings', 'my-simple-plugin' ),
		__( 'Simple Plugin', 'my-simple-plugin' ),
		'manage_options',
		'my-simple-plugin',
		'mysp_render_settings_page'
	);
}
add_action( 'admin_menu', 'mysp_add_settings_page' );

/**
 * Render settings page
 */
function mysp_render_settings_page() {
	// Check user capabilities
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	// Handle form submission
	if ( isset( $_POST['mysp_settings_submit'] ) ) {
		// Verify nonce
		if ( ! isset( $_POST['mysp_settings_nonce'] ) || ! wp_verify_nonce( $_POST['mysp_settings_nonce'], 'mysp_settings_action' ) ) {
			wp_die( __( 'Security check failed', 'my-simple-plugin' ) );
		}

		// Sanitize and save option
		$option_value = isset( $_POST['mysp_option'] ) ? sanitize_text_field( $_POST['mysp_option'] ) : '';
		update_option( 'mysp_option', $option_value );

		// Show success message
		add_settings_error(
			'mysp_messages',
			'mysp_message',
			__( 'Settings Saved', 'my-simple-plugin' ),
			'updated'
		);
	}

	// Get current option value
	$option_value = get_option( 'mysp_option', '' );

	// Display settings page
	?>
	<div class="wrap">
		<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
		<?php settings_errors( 'mysp_messages' ); ?>
		<form method="post" action="">
			<?php wp_nonce_field( 'mysp_settings_action', 'mysp_settings_nonce' ); ?>
			<table class="form-table">
				<tr>
					<th scope="row">
						<label for="mysp_option"><?php esc_html_e( 'Example Option', 'my-simple-plugin' ); ?></label>
					</th>
					<td>
						<input
							type="text"
							id="mysp_option"
							name="mysp_option"
							value="<?php echo esc_attr( $option_value ); ?>"
							class="regular-text"
						/>
						<p class="description"><?php esc_html_e( 'Enter some text here', 'my-simple-plugin' ); ?></p>
					</td>
				</tr>
			</table>
			<?php submit_button( __( 'Save Settings', 'my-simple-plugin' ), 'primary', 'mysp_settings_submit' ); ?>
		</form>
	</div>
	<?php
}

/**
 * Example AJAX handler
 */
function mysp_ajax_handler() {
	// Verify nonce
	check_ajax_referer( 'mysp_ajax_nonce', 'nonce' );

	// Check user capability
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_send_json_error( array( 'message' => __( 'Permission denied', 'my-simple-plugin' ) ) );
	}

	// Get and sanitize input
	$input = isset( $_POST['data'] ) ? sanitize_text_field( $_POST['data'] ) : '';

	// Process and return response
	wp_send_json_success( array(
		'message' => __( 'Success!', 'my-simple-plugin' ),
		'data'    => $input,
	) );
}
add_action( 'wp_ajax_mysp_action', 'mysp_ajax_handler' );

/**
 * Activation hook
 */
function mysp_activate() {
	// Register post type before flushing rewrite rules
	mysp_register_book_post_type();

	// Flush rewrite rules
	flush_rewrite_rules();

	// Set default options
	if ( false === get_option( 'mysp_option' ) ) {
		add_option( 'mysp_option', '' );
	}

	// Set activation timestamp
	if ( false === get_option( 'mysp_activated_time' ) ) {
		add_option( 'mysp_activated_time', current_time( 'timestamp' ) );
	}
}
register_activation_hook( __FILE__, 'mysp_activate' );

/**
 * Deactivation hook
 */
function mysp_deactivate() {
	// Flush rewrite rules
	flush_rewrite_rules();

	// Clear any scheduled events
	wp_clear_scheduled_hook( 'mysp_cron_event' );
}
register_deactivation_hook( __FILE__, 'mysp_deactivate' );
