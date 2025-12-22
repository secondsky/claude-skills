<?php
/**
 * Example: REST API endpoints
 *
 * This example shows how to:
 * - Register custom REST API routes
 * - Implement GET, POST, PUT, DELETE endpoints
 * - Use permission callbacks for authentication
 * - Validate and sanitize request parameters
 * - Return proper REST responses and errors
 *
 * @package YourPlugin
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register REST API routes
 */
function yourprefix_register_rest_routes() {
	// Namespace: yourplugin/v1
	$namespace = 'yourplugin/v1';

	// GET /wp-json/yourplugin/v1/items
	register_rest_route(
		$namespace,
		'/items',
		array(
			'methods'             => 'GET',
			'callback'            => 'yourprefix_get_items',
			'permission_callback' => '__return_true', // Public endpoint
		)
	);

	// GET /wp-json/yourplugin/v1/items/{id}
	register_rest_route(
		$namespace,
		'/items/(?P<id>\d+)',
		array(
			'methods'             => 'GET',
			'callback'            => 'yourprefix_get_item',
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

	// POST /wp-json/yourplugin/v1/items
	register_rest_route(
		$namespace,
		'/items',
		array(
			'methods'             => 'POST',
			'callback'            => 'yourprefix_create_item',
			'permission_callback' => 'yourprefix_check_permission',
			'args'                => yourprefix_get_item_args(),
		)
	);

	// PUT /wp-json/yourplugin/v1/items/{id}
	register_rest_route(
		$namespace,
		'/items/(?P<id>\d+)',
		array(
			'methods'             => 'PUT',
			'callback'            => 'yourprefix_update_item',
			'permission_callback' => 'yourprefix_check_permission',
			'args'                => array_merge(
				array(
					'id' => array(
						'required'          => true,
						'validate_callback' => function( $param ) {
							return is_numeric( $param );
						},
						'sanitize_callback' => 'absint',
					),
				),
				yourprefix_get_item_args()
			),
		)
	);

	// DELETE /wp-json/yourplugin/v1/items/{id}
	register_rest_route(
		$namespace,
		'/items/(?P<id>\d+)',
		array(
			'methods'             => 'DELETE',
			'callback'            => 'yourprefix_delete_item',
			'permission_callback' => 'yourprefix_check_permission',
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
add_action( 'rest_api_init', 'yourprefix_register_rest_routes' );

/**
 * Get all items
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
function yourprefix_get_items( $request ) {
	// Get query parameters
	$per_page = $request->get_param( 'per_page' );
	$page     = $request->get_param( 'page' );

	// Set defaults
	$per_page = $per_page ? absint( $per_page ) : 10;
	$page     = $page ? absint( $page ) : 1;

	// Query posts
	$args = array(
		'post_type'      => 'post',
		'posts_per_page' => $per_page,
		'paged'          => $page,
		'post_status'    => 'publish',
	);

	$query = new WP_Query( $args );

	$items = array();
	foreach ( $query->posts as $post ) {
		$items[] = array(
			'id'      => $post->ID,
			'title'   => $post->post_title,
			'content' => $post->post_content,
			'excerpt' => $post->post_excerpt,
			'date'    => $post->post_date,
			'author'  => get_the_author_meta( 'display_name', $post->post_author ),
		);
	}

	// Return response with pagination headers
	$response = rest_ensure_response( $items );
	$response->header( 'X-WP-Total', $query->found_posts );
	$response->header( 'X-WP-TotalPages', $query->max_num_pages );

	return $response;
}

/**
 * Get single item
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
function yourprefix_get_item( $request ) {
	$item_id = $request->get_param( 'id' );
	$post    = get_post( $item_id );

	if ( ! $post ) {
		return new WP_Error(
			'not_found',
			__( 'Item not found', 'your-plugin' ),
			array( 'status' => 404 )
		);
	}

	$data = array(
		'id'      => $post->ID,
		'title'   => $post->post_title,
		'content' => $post->post_content,
		'excerpt' => $post->post_excerpt,
		'date'    => $post->post_date,
		'author'  => get_the_author_meta( 'display_name', $post->post_author ),
	);

	return rest_ensure_response( $data );
}

/**
 * Create item
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
function yourprefix_create_item( $request ) {
	$title   = $request->get_param( 'title' );
	$content = $request->get_param( 'content' );
	$status  = $request->get_param( 'status' );

	// Create post
	$post_id = wp_insert_post( array(
		'post_title'   => $title,
		'post_content' => $content,
		'post_status'  => $status ? $status : 'draft',
		'post_type'    => 'post',
	) );

	if ( is_wp_error( $post_id ) ) {
		return $post_id;
	}

	$post = get_post( $post_id );

	$data = array(
		'id'      => $post->ID,
		'title'   => $post->post_title,
		'content' => $post->post_content,
		'status'  => $post->post_status,
		'date'    => $post->post_date,
	);

	return rest_ensure_response( $data );
}

/**
 * Update item
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
function yourprefix_update_item( $request ) {
	$item_id = $request->get_param( 'id' );
	$post    = get_post( $item_id );

	if ( ! $post ) {
		return new WP_Error(
			'not_found',
			__( 'Item not found', 'your-plugin' ),
			array( 'status' => 404 )
		);
	}

	// Update post
	$update_data = array(
		'ID' => $item_id,
	);

	if ( $request->has_param( 'title' ) ) {
		$update_data['post_title'] = $request->get_param( 'title' );
	}

	if ( $request->has_param( 'content' ) ) {
		$update_data['post_content'] = $request->get_param( 'content' );
	}

	if ( $request->has_param( 'status' ) ) {
		$update_data['post_status'] = $request->get_param( 'status' );
	}

	$result = wp_update_post( $update_data, true );

	if ( is_wp_error( $result ) ) {
		return $result;
	}

	$post = get_post( $item_id );

	$data = array(
		'id'      => $post->ID,
		'title'   => $post->post_title,
		'content' => $post->post_content,
		'status'  => $post->post_status,
		'date'    => $post->post_date,
	);

	return rest_ensure_response( $data );
}

/**
 * Delete item
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
function yourprefix_delete_item( $request ) {
	$item_id = $request->get_param( 'id' );
	$post    = get_post( $item_id );

	if ( ! $post ) {
		return new WP_Error(
			'not_found',
			__( 'Item not found', 'your-plugin' ),
			array( 'status' => 404 )
		);
	}

	// Delete post (move to trash)
	$result = wp_trash_post( $item_id );

	if ( ! $result ) {
		return new WP_Error(
			'cannot_delete',
			__( 'Could not delete item', 'your-plugin' ),
			array( 'status' => 500 )
		);
	}

	return rest_ensure_response( array(
		'deleted' => true,
		'id'      => $item_id,
	) );
}

/**
 * Check permission
 *
 * @return bool
 */
function yourprefix_check_permission() {
	return current_user_can( 'edit_posts' );
}

/**
 * Get item validation arguments
 *
 * @return array
 */
function yourprefix_get_item_args() {
	return array(
		'title'   => array(
			'required'          => true,
			'type'              => 'string',
			'description'       => __( 'Item title', 'your-plugin' ),
			'sanitize_callback' => 'sanitize_text_field',
		),
		'content' => array(
			'required'          => false,
			'type'              => 'string',
			'description'       => __( 'Item content', 'your-plugin' ),
			'sanitize_callback' => 'wp_kses_post',
		),
		'status'  => array(
			'required'          => false,
			'type'              => 'string',
			'description'       => __( 'Item status', 'your-plugin' ),
			'enum'              => array( 'publish', 'draft', 'pending', 'private' ),
			'sanitize_callback' => 'sanitize_text_field',
		),
	);
}

/**
 * Example AJAX endpoint (alternative to REST API for simpler use cases)
 */
function yourprefix_ajax_get_items() {
	// Verify nonce
	check_ajax_referer( 'yourprefix_nonce', 'nonce' );

	// Check permission
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_send_json_error( array( 'message' => __( 'Permission denied', 'your-plugin' ) ) );
	}

	// Get items
	$args = array(
		'post_type'      => 'post',
		'posts_per_page' => 10,
		'post_status'    => 'publish',
	);

	$query = new WP_Query( $args );

	$items = array();
	foreach ( $query->posts as $post ) {
		$items[] = array(
			'id'    => $post->ID,
			'title' => $post->post_title,
		);
	}

	wp_send_json_success( array( 'items' => $items ) );
}
add_action( 'wp_ajax_yourprefix_get_items', 'yourprefix_ajax_get_items' );
