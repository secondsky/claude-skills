<?php
/**
 * Uninstall script
 *
 * This file is called when the plugin is uninstalled via WordPress admin.
 * It should clean up all plugin data.
 */

// Exit if not called by WordPress
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Delete plugin options
delete_option( 'mysp_option' );
delete_option( 'mysp_activated_time' );

// Delete transients
delete_transient( 'mysp_cache' );

// For multisite, delete from all sites
if ( is_multisite() ) {
	global $wpdb;
	$blog_ids = $wpdb->get_col( "SELECT blog_id FROM $wpdb->blogs" );

	foreach ( $blog_ids as $blog_id ) {
		switch_to_blog( $blog_id );

		delete_option( 'mysp_option' );
		delete_option( 'mysp_activated_time' );
		delete_transient( 'mysp_cache' );

		restore_current_blog();
	}
}

// Delete custom post type data (optional - consider if users want to keep content)
// Uncomment the following if you want to delete all custom post type posts on uninstall
/*
$books = get_posts( array(
	'post_type'      => 'book',
	'posts_per_page' => -1,
	'post_status'    => 'any',
) );

foreach ( $books as $book ) {
	wp_delete_post( $book->ID, true ); // true = force delete (skip trash)
}
*/

// If you created custom database tables, drop them here
/*
global $wpdb;
$table_name = $wpdb->prefix . 'mysp_custom_table';
$wpdb->query( "DROP TABLE IF EXISTS $table_name" );
*/
