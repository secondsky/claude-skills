<?php
/**
 * Example: Register custom post type and taxonomy
 *
 * This example shows how to:
 * - Register a custom post type
 * - Register a custom taxonomy
 * - Link taxonomy to post type
 * - Flush rewrite rules on activation
 * - Use proper labels and arguments
 *
 * @package YourPlugin
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register custom post type
 */
function yourprefix_register_book_post_type() {
	$labels = array(
		'name'                  => _x( 'Books', 'Post type general name', 'your-plugin' ),
		'singular_name'         => _x( 'Book', 'Post type singular name', 'your-plugin' ),
		'menu_name'             => _x( 'Books', 'Admin Menu text', 'your-plugin' ),
		'name_admin_bar'        => _x( 'Book', 'Add New on Toolbar', 'your-plugin' ),
		'add_new'               => __( 'Add New', 'your-plugin' ),
		'add_new_item'          => __( 'Add New Book', 'your-plugin' ),
		'new_item'              => __( 'New Book', 'your-plugin' ),
		'edit_item'             => __( 'Edit Book', 'your-plugin' ),
		'view_item'             => __( 'View Book', 'your-plugin' ),
		'all_items'             => __( 'All Books', 'your-plugin' ),
		'search_items'          => __( 'Search Books', 'your-plugin' ),
		'parent_item_colon'     => __( 'Parent Books:', 'your-plugin' ),
		'not_found'             => __( 'No books found.', 'your-plugin' ),
		'not_found_in_trash'    => __( 'No books found in Trash.', 'your-plugin' ),
		'featured_image'        => _x( 'Book Cover Image', 'Overrides the "Featured Image" phrase', 'your-plugin' ),
		'set_featured_image'    => _x( 'Set cover image', 'Overrides the "Set featured image" phrase', 'your-plugin' ),
		'remove_featured_image' => _x( 'Remove cover image', 'Overrides the "Remove featured image" phrase', 'your-plugin' ),
		'use_featured_image'    => _x( 'Use as cover image', 'Overrides the "Use as featured image" phrase', 'your-plugin' ),
		'archives'              => _x( 'Book archives', 'The post type archive label', 'your-plugin' ),
		'insert_into_item'      => _x( 'Insert into book', 'Overrides the "Insert into post"/"Insert into page" phrase', 'your-plugin' ),
		'uploaded_to_this_item' => _x( 'Uploaded to this book', 'Overrides the "Uploaded to this post"/"Uploaded to this page" phrase', 'your-plugin' ),
		'filter_items_list'     => _x( 'Filter books list', 'Screen reader text for the filter links', 'your-plugin' ),
		'items_list_navigation' => _x( 'Books list navigation', 'Screen reader text for the pagination', 'your-plugin' ),
		'items_list'            => _x( 'Books list', 'Screen reader text for the items list', 'your-plugin' ),
	);

	$args = array(
		'labels'             => $labels,
		'description'        => __( 'Books managed by your plugin', 'your-plugin' ),
		'public'             => true,
		'publicly_queryable' => true,
		'show_ui'            => true,
		'show_in_menu'       => true,
		'query_var'          => true,
		'rewrite'            => array( 'slug' => 'books' ),
		'capability_type'    => 'post',
		'has_archive'        => true,
		'hierarchical'       => false,
		'menu_position'      => 20,
		'menu_icon'          => 'dashicons-book',
		'show_in_rest'       => true, // Enable Gutenberg editor
		'rest_base'          => 'books',
		'rest_controller_class' => 'WP_REST_Posts_Controller',
		'supports'           => array(
			'title',
			'editor',
			'author',
			'thumbnail',
			'excerpt',
			'comments',
			'custom-fields',
			'revisions',
		),
	);

	register_post_type( 'book', $args );
}
add_action( 'init', 'yourprefix_register_book_post_type' );

/**
 * Register custom taxonomy (Hierarchical - like Categories)
 */
function yourprefix_register_genre_taxonomy() {
	$labels = array(
		'name'              => _x( 'Genres', 'taxonomy general name', 'your-plugin' ),
		'singular_name'     => _x( 'Genre', 'taxonomy singular name', 'your-plugin' ),
		'search_items'      => __( 'Search Genres', 'your-plugin' ),
		'all_items'         => __( 'All Genres', 'your-plugin' ),
		'parent_item'       => __( 'Parent Genre', 'your-plugin' ),
		'parent_item_colon' => __( 'Parent Genre:', 'your-plugin' ),
		'edit_item'         => __( 'Edit Genre', 'your-plugin' ),
		'update_item'       => __( 'Update Genre', 'your-plugin' ),
		'add_new_item'      => __( 'Add New Genre', 'your-plugin' ),
		'new_item_name'     => __( 'New Genre Name', 'your-plugin' ),
		'menu_name'         => __( 'Genre', 'your-plugin' ),
	);

	$args = array(
		'hierarchical'      => true, // true = like categories, false = like tags
		'labels'            => $labels,
		'show_ui'           => true,
		'show_admin_column' => true,
		'query_var'         => true,
		'rewrite'           => array( 'slug' => 'genre' ),
		'show_in_rest'      => true,
	);

	register_taxonomy( 'genre', array( 'book' ), $args );
}
add_action( 'init', 'yourprefix_register_genre_taxonomy' );

/**
 * Register non-hierarchical taxonomy (like Tags)
 */
function yourprefix_register_book_tag_taxonomy() {
	$labels = array(
		'name'                       => _x( 'Book Tags', 'taxonomy general name', 'your-plugin' ),
		'singular_name'              => _x( 'Book Tag', 'taxonomy singular name', 'your-plugin' ),
		'search_items'               => __( 'Search Book Tags', 'your-plugin' ),
		'popular_items'              => __( 'Popular Book Tags', 'your-plugin' ),
		'all_items'                  => __( 'All Book Tags', 'your-plugin' ),
		'edit_item'                  => __( 'Edit Book Tag', 'your-plugin' ),
		'update_item'                => __( 'Update Book Tag', 'your-plugin' ),
		'add_new_item'               => __( 'Add New Book Tag', 'your-plugin' ),
		'new_item_name'              => __( 'New Book Tag Name', 'your-plugin' ),
		'separate_items_with_commas' => __( 'Separate book tags with commas', 'your-plugin' ),
		'add_or_remove_items'        => __( 'Add or remove book tags', 'your-plugin' ),
		'choose_from_most_used'      => __( 'Choose from the most used book tags', 'your-plugin' ),
		'not_found'                  => __( 'No book tags found.', 'your-plugin' ),
		'menu_name'                  => __( 'Book Tags', 'your-plugin' ),
	);

	$args = array(
		'hierarchical'      => false, // Non-hierarchical (like tags)
		'labels'            => $labels,
		'show_ui'           => true,
		'show_admin_column' => true,
		'query_var'         => true,
		'rewrite'           => array( 'slug' => 'book-tag' ),
		'show_in_rest'      => true,
	);

	register_taxonomy( 'book_tag', array( 'book' ), $args );
}
add_action( 'init', 'yourprefix_register_book_tag_taxonomy' );

/**
 * Customize archive page query for books
 */
function yourprefix_modify_book_archive_query( $query ) {
	// Only modify main query on frontend for book archives
	if ( ! is_admin() && $query->is_main_query() && is_post_type_archive( 'book' ) ) {
		// Show 12 books per page
		$query->set( 'posts_per_page', 12 );

		// Order by title
		$query->set( 'orderby', 'title' );
		$query->set( 'order', 'ASC' );
	}
}
add_action( 'pre_get_posts', 'yourprefix_modify_book_archive_query' );

/**
 * Add custom columns to book admin list
 */
function yourprefix_add_book_columns( $columns ) {
	$new_columns = array();

	foreach ( $columns as $key => $value ) {
		$new_columns[ $key ] = $value;

		// Add genre column after title
		if ( 'title' === $key ) {
			$new_columns['genre'] = __( 'Genres', 'your-plugin' );
			$new_columns['book_tags'] = __( 'Tags', 'your-plugin' );
		}
	}

	return $new_columns;
}
add_filter( 'manage_book_posts_columns', 'yourprefix_add_book_columns' );

/**
 * Populate custom columns
 */
function yourprefix_populate_book_columns( $column, $post_id ) {
	if ( 'genre' === $column ) {
		$genres = get_the_terms( $post_id, 'genre' );
		if ( $genres && ! is_wp_error( $genres ) ) {
			$genre_list = array();
			foreach ( $genres as $genre ) {
				$genre_list[] = sprintf(
					'<a href="%s">%s</a>',
					esc_url( add_query_arg( array( 'genre' => $genre->slug ), admin_url( 'edit.php?post_type=book' ) ) ),
					esc_html( $genre->name )
				);
			}
			echo implode( ', ', $genre_list );
		} else {
			echo '—';
		}
	}

	if ( 'book_tags' === $column ) {
		$tags = get_the_terms( $post_id, 'book_tag' );
		if ( $tags && ! is_wp_error( $tags ) ) {
			$tag_list = array();
			foreach ( $tags as $tag ) {
				$tag_list[] = esc_html( $tag->name );
			}
			echo implode( ', ', $tag_list );
		} else {
			echo '—';
		}
	}
}
add_action( 'manage_book_posts_custom_column', 'yourprefix_populate_book_columns', 10, 2 );

/**
 * Make columns sortable
 */
function yourprefix_sortable_book_columns( $columns ) {
	$columns['genre'] = 'genre';
	return $columns;
}
add_filter( 'manage_edit-book_sortable_columns', 'yourprefix_sortable_book_columns' );

/**
 * Flush rewrite rules on plugin activation
 */
function yourprefix_activate() {
	// Register post types and taxonomies
	yourprefix_register_book_post_type();
	yourprefix_register_genre_taxonomy();
	yourprefix_register_book_tag_taxonomy();

	// CRITICAL: Flush rewrite rules to prevent 404 errors
	flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'yourprefix_activate' );

/**
 * Flush rewrite rules on plugin deactivation
 */
function yourprefix_deactivate() {
	// Flush rewrite rules
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'yourprefix_deactivate' );

/**
 * Query books by genre
 *
 * Example usage in theme templates
 */
function yourprefix_get_books_by_genre( $genre_slug, $posts_per_page = 10 ) {
	$args = array(
		'post_type'      => 'book',
		'posts_per_page' => $posts_per_page,
		'tax_query'      => array(
			array(
				'taxonomy' => 'genre',
				'field'    => 'slug',
				'terms'    => $genre_slug,
			),
		),
	);

	return new WP_Query( $args );
}
