<?php
/**
 * Genre Taxonomy
 *
 * @package MyPSR4Plugin\Taxonomies
 */

namespace MyPSR4Plugin\Taxonomies;

use MyPSR4Plugin\PostTypes\Book;

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Genre taxonomy class
 */
class Genre {

	/**
	 * Single instance
	 *
	 * @var Genre
	 */
	private static $instance = null;

	/**
	 * Taxonomy slug
	 *
	 * @var string
	 */
	const TAXONOMY = 'genre';

	/**
	 * Get instance
	 *
	 * @return Genre
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
	}

	/**
	 * Register taxonomy
	 */
	public function register() {
		$labels = array(
			'name'              => _x( 'Genres', 'taxonomy general name', 'my-psr4-plugin' ),
			'singular_name'     => _x( 'Genre', 'taxonomy singular name', 'my-psr4-plugin' ),
			'search_items'      => __( 'Search Genres', 'my-psr4-plugin' ),
			'all_items'         => __( 'All Genres', 'my-psr4-plugin' ),
			'parent_item'       => __( 'Parent Genre', 'my-psr4-plugin' ),
			'parent_item_colon' => __( 'Parent Genre:', 'my-psr4-plugin' ),
			'edit_item'         => __( 'Edit Genre', 'my-psr4-plugin' ),
			'update_item'       => __( 'Update Genre', 'my-psr4-plugin' ),
			'add_new_item'      => __( 'Add New Genre', 'my-psr4-plugin' ),
			'new_item_name'     => __( 'New Genre Name', 'my-psr4-plugin' ),
			'menu_name'         => __( 'Genres', 'my-psr4-plugin' ),
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

		register_taxonomy( self::TAXONOMY, array( Book::POST_TYPE ), $args );
	}
}
