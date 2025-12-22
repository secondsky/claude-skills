<?php
/**
 * Book REST API Endpoints
 *
 * @package MyPSR4Plugin\API
 */

namespace MyPSR4Plugin\API;

use MyPSR4Plugin\PostTypes\Book;

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Book REST API endpoints class
 */
class BookEndpoints {

	/**
	 * Single instance
	 *
	 * @var BookEndpoints
	 */
	private static $instance = null;

	/**
	 * Namespace
	 *
	 * @var string
	 */
	const NAMESPACE = 'mypp/v1';

	/**
	 * Get instance
	 *
	 * @return BookEndpoints
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
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST routes
	 */
	public function register_routes() {
		// Get all books
		register_rest_route(
			self::NAMESPACE,
			'/books',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_books' ),
				'permission_callback' => '__return_true',
			)
		);

		// Get single book
		register_rest_route(
			self::NAMESPACE,
			'/books/(?P<id>\d+)',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_book' ),
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

		// Create book
		register_rest_route(
			self::NAMESPACE,
			'/books',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'create_book' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => $this->get_book_args(),
			)
		);
	}

	/**
	 * Get books
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_books( $request ) {
		$args = array(
			'post_type'      => Book::POST_TYPE,
			'posts_per_page' => 10,
			'post_status'    => 'publish',
		);

		$books = get_posts( $args );

		$data = array();
		foreach ( $books as $book ) {
			$data[] = $this->prepare_book_data( $book );
		}

		return rest_ensure_response( $data );
	}

	/**
	 * Get single book
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_book( $request ) {
		$book_id = $request->get_param( 'id' );
		$book    = get_post( $book_id );

		if ( ! $book || Book::POST_TYPE !== $book->post_type ) {
			return new \WP_Error(
				'not_found',
				__( 'Book not found', 'my-psr4-plugin' ),
				array( 'status' => 404 )
			);
		}

		$data = $this->prepare_book_data( $book );

		return rest_ensure_response( $data );
	}

	/**
	 * Create book
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function create_book( $request ) {
		$title   = $request->get_param( 'title' );
		$content = $request->get_param( 'content' );
		$isbn    = $request->get_param( 'isbn' );
		$author  = $request->get_param( 'author' );
		$year    = $request->get_param( 'year' );

		$post_id = wp_insert_post( array(
			'post_title'   => $title,
			'post_content' => $content,
			'post_type'    => Book::POST_TYPE,
			'post_status'  => 'draft',
		) );

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		// Save meta data
		if ( $isbn ) {
			update_post_meta( $post_id, '_mypp_isbn', $isbn );
		}
		if ( $author ) {
			update_post_meta( $post_id, '_mypp_author', $author );
		}
		if ( $year ) {
			update_post_meta( $post_id, '_mypp_year', $year );
		}

		$book = get_post( $post_id );
		$data = $this->prepare_book_data( $book );

		return rest_ensure_response( $data );
	}

	/**
	 * Prepare book data for response
	 *
	 * @param \WP_Post $book Post object.
	 * @return array
	 */
	private function prepare_book_data( $book ) {
		return array(
			'id'      => $book->ID,
			'title'   => $book->post_title,
			'content' => $book->post_content,
			'excerpt' => $book->post_excerpt,
			'isbn'    => get_post_meta( $book->ID, '_mypp_isbn', true ),
			'author'  => get_post_meta( $book->ID, '_mypp_author', true ),
			'year'    => (int) get_post_meta( $book->ID, '_mypp_year', true ),
		);
	}

	/**
	 * Check permission
	 *
	 * @return bool
	 */
	public function check_permission() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Get book arguments for validation
	 *
	 * @return array
	 */
	private function get_book_args() {
		return array(
			'title'   => array(
				'required'          => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'content' => array(
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'wp_kses_post',
			),
			'isbn'    => array(
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'author'  => array(
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'year'    => array(
				'required'          => false,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
		);
	}
}
