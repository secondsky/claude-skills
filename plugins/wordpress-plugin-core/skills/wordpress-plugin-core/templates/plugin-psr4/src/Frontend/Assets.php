<?php
/**
 * Frontend Assets
 *
 * @package MyPSR4Plugin\Frontend
 */

namespace MyPSR4Plugin\Frontend;

use MyPSR4Plugin\PostTypes\Book;

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Assets class
 */
class Assets {

	/**
	 * Single instance
	 *
	 * @var Assets
	 */
	private static $instance = null;

	/**
	 * Get instance
	 *
	 * @return Assets
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
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
	}

	/**
	 * Enqueue frontend scripts and styles
	 */
	public function enqueue_scripts() {
		// Only load on single book pages
		if ( is_singular( Book::POST_TYPE ) ) {
			wp_enqueue_style(
				'mypp-style',
				MYPP_PLUGIN_URL . 'assets/css/style.css',
				array(),
				MYPP_VERSION
			);

			wp_enqueue_script(
				'mypp-script',
				MYPP_PLUGIN_URL . 'assets/js/script.js',
				array( 'jquery' ),
				MYPP_VERSION,
				true
			);
		}
	}

	/**
	 * Enqueue admin scripts and styles
	 *
	 * @param string $hook Current admin page hook.
	 */
	public function enqueue_admin_scripts( $hook ) {
		// Only load on book edit pages
		if ( 'post.php' !== $hook && 'post-new.php' !== $hook && 'edit.php' !== $hook ) {
			return;
		}

		$screen = get_current_screen();
		if ( $screen && Book::POST_TYPE === $screen->post_type ) {
			wp_enqueue_style(
				'mypp-admin-style',
				MYPP_PLUGIN_URL . 'assets/css/admin-style.css',
				array(),
				MYPP_VERSION
			);

			wp_enqueue_script(
				'mypp-admin-script',
				MYPP_PLUGIN_URL . 'assets/js/admin-script.js',
				array( 'jquery' ),
				MYPP_VERSION,
				true
			);

			// Localize script
			wp_localize_script(
				'mypp-admin-script',
				'myppData',
				array(
					'ajax_url' => admin_url( 'admin-ajax.php' ),
					'nonce'    => wp_create_nonce( 'mypp_ajax_nonce' ),
				)
			);
		}
	}
}
