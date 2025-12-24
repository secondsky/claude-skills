<?php
/**
 * Example: AJAX handlers
 *
 * This example shows how to:
 * - Register AJAX handlers for logged-in and non-logged-in users
 * - Verify nonces for CSRF protection
 * - Check user capabilities
 * - Sanitize input and return JSON responses
 * - Enqueue scripts with localized data
 *
 * @package YourPlugin
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Enqueue AJAX script
 */
function yourprefix_enqueue_ajax_script() {
	wp_enqueue_script(
		'yourprefix-ajax',
		plugins_url( 'js/ajax-example.js', __FILE__ ),
		array( 'jquery' ),
		'1.0.0',
		true
	);

	// Localize script with AJAX URL and nonce
	wp_localize_script(
		'yourprefix-ajax',
		'yourprefixAjax',
		array(
			'ajax_url' => admin_url( 'admin-ajax.php' ),
			'nonce'    => wp_create_nonce( 'yourprefix_ajax_nonce' ),
		)
	);
}
add_action( 'wp_enqueue_scripts', 'yourprefix_enqueue_ajax_script' );

/**
 * AJAX handler for logged-in users
 */
function yourprefix_ajax_save_data() {
	// Verify nonce
	check_ajax_referer( 'yourprefix_ajax_nonce', 'nonce' );

	// Check user capability
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_send_json_error( array(
			'message' => __( 'Permission denied', 'your-plugin' ),
		) );
	}

	// Get and sanitize input
	$name  = isset( $_POST['name'] ) ? sanitize_text_field( $_POST['name'] ) : '';
	$email = isset( $_POST['email'] ) ? sanitize_email( $_POST['email'] ) : '';
	$age   = isset( $_POST['age'] ) ? absint( $_POST['age'] ) : 0;

	// Validate input
	if ( empty( $name ) ) {
		wp_send_json_error( array(
			'message' => __( 'Name is required', 'your-plugin' ),
		) );
	}

	if ( ! is_email( $email ) ) {
		wp_send_json_error( array(
			'message' => __( 'Invalid email address', 'your-plugin' ),
		) );
	}

	// Process data (example: save to database)
	$result = yourprefix_save_user_data( $name, $email, $age );

	if ( is_wp_error( $result ) ) {
		wp_send_json_error( array(
			'message' => $result->get_error_message(),
		) );
	}

	// Return success response
	wp_send_json_success( array(
		'message' => __( 'Data saved successfully', 'your-plugin' ),
		'data'    => array(
			'name'  => $name,
			'email' => $email,
			'age'   => $age,
		),
	) );
}
add_action( 'wp_ajax_yourprefix_save_data', 'yourprefix_ajax_save_data' );

/**
 * AJAX handler for non-logged-in users
 */
function yourprefix_ajax_public_action() {
	// Verify nonce (still required for public AJAX)
	check_ajax_referer( 'yourprefix_ajax_nonce', 'nonce' );

	// Get and sanitize input
	$query = isset( $_POST['query'] ) ? sanitize_text_field( $_POST['query'] ) : '';

	if ( empty( $query ) ) {
		wp_send_json_error( array(
			'message' => __( 'Query is required', 'your-plugin' ),
		) );
	}

	// Process query (example: search posts)
	$results = yourprefix_search_posts( $query );

	wp_send_json_success( array(
		'message' => __( 'Search completed', 'your-plugin' ),
		'results' => $results,
	) );
}
add_action( 'wp_ajax_yourprefix_public_action', 'yourprefix_ajax_public_action' );
add_action( 'wp_ajax_nopriv_yourprefix_public_action', 'yourprefix_ajax_public_action' );

/**
 * AJAX handler for fetching posts
 */
function yourprefix_ajax_load_posts() {
	// Verify nonce
	check_ajax_referer( 'yourprefix_ajax_nonce', 'nonce' );

	// Get parameters
	$page     = isset( $_POST['page'] ) ? absint( $_POST['page'] ) : 1;
	$per_page = isset( $_POST['per_page'] ) ? absint( $_POST['per_page'] ) : 10;
	$category = isset( $_POST['category'] ) ? absint( $_POST['category'] ) : 0;

	// Query posts
	$args = array(
		'post_type'      => 'post',
		'posts_per_page' => $per_page,
		'paged'          => $page,
		'post_status'    => 'publish',
	);

	if ( $category > 0 ) {
		$args['cat'] = $category;
	}

	$query = new WP_Query( $args );

	$posts = array();
	if ( $query->have_posts() ) {
		while ( $query->have_posts() ) {
			$query->the_post();
			$posts[] = array(
				'id'      => get_the_ID(),
				'title'   => get_the_title(),
				'excerpt' => get_the_excerpt(),
				'url'     => get_permalink(),
				'date'    => get_the_date(),
			);
		}
		wp_reset_postdata();
	}

	wp_send_json_success( array(
		'posts'       => $posts,
		'total_pages' => $query->max_num_pages,
		'found_posts' => $query->found_posts,
	) );
}
add_action( 'wp_ajax_yourprefix_load_posts', 'yourprefix_ajax_load_posts' );
add_action( 'wp_ajax_nopriv_yourprefix_load_posts', 'yourprefix_ajax_load_posts' );

/**
 * AJAX handler for deleting item
 */
function yourprefix_ajax_delete_item() {
	// Verify nonce
	check_ajax_referer( 'yourprefix_ajax_nonce', 'nonce' );

	// Check user capability
	if ( ! current_user_can( 'delete_posts' ) ) {
		wp_send_json_error( array(
			'message' => __( 'Permission denied', 'your-plugin' ),
		) );
	}

	// Get item ID
	$item_id = isset( $_POST['item_id'] ) ? absint( $_POST['item_id'] ) : 0;

	if ( $item_id === 0 ) {
		wp_send_json_error( array(
			'message' => __( 'Invalid item ID', 'your-plugin' ),
		) );
	}

	// Check if item exists
	$post = get_post( $item_id );
	if ( ! $post ) {
		wp_send_json_error( array(
			'message' => __( 'Item not found', 'your-plugin' ),
		) );
	}

	// Delete item
	$result = wp_trash_post( $item_id );

	if ( ! $result ) {
		wp_send_json_error( array(
			'message' => __( 'Failed to delete item', 'your-plugin' ),
		) );
	}

	wp_send_json_success( array(
		'message' => __( 'Item deleted successfully', 'your-plugin' ),
		'item_id' => $item_id,
	) );
}
add_action( 'wp_ajax_yourprefix_delete_item', 'yourprefix_ajax_delete_item' );

/**
 * AJAX handler for uploading file
 */
function yourprefix_ajax_upload_file() {
	// Verify nonce
	check_ajax_referer( 'yourprefix_ajax_nonce', 'nonce' );

	// Check user capability
	if ( ! current_user_can( 'upload_files' ) ) {
		wp_send_json_error( array(
			'message' => __( 'Permission denied', 'your-plugin' ),
		) );
	}

	// Check if file was uploaded
	if ( empty( $_FILES['file'] ) ) {
		wp_send_json_error( array(
			'message' => __( 'No file uploaded', 'your-plugin' ),
		) );
	}

	// Handle file upload
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';

	$file = $_FILES['file'];

	// Validate file type
	$allowed_types = array( 'image/jpeg', 'image/png', 'image/gif' );
	if ( ! in_array( $file['type'], $allowed_types, true ) ) {
		wp_send_json_error( array(
			'message' => __( 'Invalid file type. Only JPG, PNG, and GIF are allowed.', 'your-plugin' ),
		) );
	}

	// Upload file
	$attachment_id = media_handle_upload( 'file', 0 );

	if ( is_wp_error( $attachment_id ) ) {
		wp_send_json_error( array(
			'message' => $attachment_id->get_error_message(),
		) );
	}

	// Get attachment data
	$attachment_url = wp_get_attachment_url( $attachment_id );

	wp_send_json_success( array(
		'message'        => __( 'File uploaded successfully', 'your-plugin' ),
		'attachment_id'  => $attachment_id,
		'attachment_url' => $attachment_url,
	) );
}
add_action( 'wp_ajax_yourprefix_upload_file', 'yourprefix_ajax_upload_file' );

/**
 * Helper function: Save user data
 *
 * @param string $name  User name.
 * @param string $email User email.
 * @param int    $age   User age.
 * @return bool|WP_Error
 */
function yourprefix_save_user_data( $name, $email, $age ) {
	global $wpdb;

	$table_name = $wpdb->prefix . 'yourprefix_users';

	$result = $wpdb->insert(
		$table_name,
		array(
			'name'  => $name,
			'email' => $email,
			'age'   => $age,
		),
		array( '%s', '%s', '%d' )
	);

	if ( false === $result ) {
		return new WP_Error( 'db_error', __( 'Database error', 'your-plugin' ) );
	}

	return true;
}

/**
 * Helper function: Search posts
 *
 * @param string $query Search query.
 * @return array
 */
function yourprefix_search_posts( $query ) {
	$args = array(
		'post_type'      => 'post',
		's'              => $query,
		'posts_per_page' => 10,
		'post_status'    => 'publish',
	);

	$search_query = new WP_Query( $args );

	$results = array();
	if ( $search_query->have_posts() ) {
		while ( $search_query->have_posts() ) {
			$search_query->the_post();
			$results[] = array(
				'id'    => get_the_ID(),
				'title' => get_the_title(),
				'url'   => get_permalink(),
			);
		}
		wp_reset_postdata();
	}

	return $results;
}
