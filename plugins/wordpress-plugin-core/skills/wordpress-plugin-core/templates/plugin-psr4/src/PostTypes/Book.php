<?php
/**
 * Book Custom Post Type
 *
 * @package MyPSR4Plugin\PostTypes
 */

namespace MyPSR4Plugin\PostTypes;

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Book post type class
 */
class Book {

	/**
	 * Single instance
	 *
	 * @var Book
	 */
	private static $instance = null;

	/**
	 * Post type slug
	 *
	 * @var string
	 */
	const POST_TYPE = 'book';

	/**
	 * Get instance
	 *
	 * @return Book
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
		add_action( 'init', array( $this, 'register' ) );
		add_action( 'add_meta_boxes', array( $this, 'add_meta_boxes' ) );
		add_action( 'save_post_' . self::POST_TYPE, array( $this, 'save_meta' ), 10, 2 );
	}

	/**
	 * Register post type
	 */
	public function register() {
		$labels = array(
			'name'               => _x( 'Books', 'post type general name', 'my-psr4-plugin' ),
			'singular_name'      => _x( 'Book', 'post type singular name', 'my-psr4-plugin' ),
			'menu_name'          => _x( 'Books', 'admin menu', 'my-psr4-plugin' ),
			'add_new'            => _x( 'Add New', 'book', 'my-psr4-plugin' ),
			'add_new_item'       => __( 'Add New Book', 'my-psr4-plugin' ),
			'edit_item'          => __( 'Edit Book', 'my-psr4-plugin' ),
			'new_item'           => __( 'New Book', 'my-psr4-plugin' ),
			'view_item'          => __( 'View Book', 'my-psr4-plugin' ),
			'search_items'       => __( 'Search Books', 'my-psr4-plugin' ),
			'not_found'          => __( 'No books found', 'my-psr4-plugin' ),
			'not_found_in_trash' => __( 'No books found in Trash', 'my-psr4-plugin' ),
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

		register_post_type( self::POST_TYPE, $args );
	}

	/**
	 * Add meta boxes
	 */
	public function add_meta_boxes() {
		add_meta_box(
			'mypp_book_details',
			__( 'Book Details', 'my-psr4-plugin' ),
			array( $this, 'render_meta_box' ),
			self::POST_TYPE,
			'normal',
			'high'
		);
	}

	/**
	 * Render meta box
	 *
	 * @param \WP_Post $post Post object.
	 */
	public function render_meta_box( $post ) {
		// Add nonce for security
		wp_nonce_field( 'mypp_save_book_meta', 'mypp_book_meta_nonce' );

		// Get current values
		$isbn   = get_post_meta( $post->ID, '_mypp_isbn', true );
		$author = get_post_meta( $post->ID, '_mypp_author', true );
		$year   = get_post_meta( $post->ID, '_mypp_year', true );

		?>
		<table class="form-table">
			<tr>
				<th><label for="mypp_isbn"><?php esc_html_e( 'ISBN', 'my-psr4-plugin' ); ?></label></th>
				<td>
					<input
						type="text"
						id="mypp_isbn"
						name="mypp_isbn"
						value="<?php echo esc_attr( $isbn ); ?>"
						class="regular-text"
					/>
				</td>
			</tr>
			<tr>
				<th><label for="mypp_author"><?php esc_html_e( 'Author', 'my-psr4-plugin' ); ?></label></th>
				<td>
					<input
						type="text"
						id="mypp_author"
						name="mypp_author"
						value="<?php echo esc_attr( $author ); ?>"
						class="regular-text"
					/>
				</td>
			</tr>
			<tr>
				<th><label for="mypp_year"><?php esc_html_e( 'Publication Year', 'my-psr4-plugin' ); ?></label></th>
				<td>
					<input
						type="number"
						id="mypp_year"
						name="mypp_year"
						value="<?php echo esc_attr( $year ); ?>"
						min="1000"
						max="9999"
						class="small-text"
					/>
				</td>
			</tr>
		</table>
		<?php
	}

	/**
	 * Save meta box data
	 *
	 * @param int      $post_id Post ID.
	 * @param \WP_Post $post    Post object.
	 */
	public function save_meta( $post_id, $post ) {
		// Verify nonce
		if ( ! isset( $_POST['mypp_book_meta_nonce'] ) ||
		     ! wp_verify_nonce( $_POST['mypp_book_meta_nonce'], 'mypp_save_book_meta' ) ) {
			return;
		}

		// Check autosave
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		// Check permissions
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		// Save ISBN
		if ( isset( $_POST['mypp_isbn'] ) ) {
			update_post_meta(
				$post_id,
				'_mypp_isbn',
				sanitize_text_field( $_POST['mypp_isbn'] )
			);
		}

		// Save Author
		if ( isset( $_POST['mypp_author'] ) ) {
			update_post_meta(
				$post_id,
				'_mypp_author',
				sanitize_text_field( $_POST['mypp_author'] )
			);
		}

		// Save Year
		if ( isset( $_POST['mypp_year'] ) ) {
			update_post_meta(
				$post_id,
				'_mypp_year',
				absint( $_POST['mypp_year'] )
			);
		}
	}
}
