<?php
/**
 * Uninstall script
 *
 * This file is called when the plugin is uninstalled via WordPress admin.
 */

// Exit if not called by WordPress
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Delete plugin options
delete_option( 'mypp_settings' );
delete_option( 'mypp_activated_time' );

// Delete transients
delete_transient( 'mypp_cache' );

// For multisite
if ( is_multisite() ) {
	global $wpdb;
	$blog_ids = $wpdb->get_col( "SELECT blog_id FROM $wpdb->blogs" );

	foreach ( $blog_ids as $blog_id ) {
		switch_to_blog( $blog_id );

		delete_option( 'mypp_settings' );
		delete_option( 'mypp_activated_time' );
		delete_transient( 'mypp_cache' );

		restore_current_blog();
	}
}

// Delete custom post type data (optional)
/*
$books = get_posts( array(
	'post_type'      => 'book',
	'posts_per_page' => -1,
	'post_status'    => 'any',
) );

foreach ( $books as $book ) {
	wp_delete_post( $book->ID, true );
}
*/
