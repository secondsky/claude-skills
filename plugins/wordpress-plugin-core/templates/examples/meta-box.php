<?php
/**
 * Example: Add a meta box to post editor
 *
 * This example shows how to:
 * - Register a meta box
 * - Render meta box fields
 * - Save meta box data securely
 * - Use nonces for CSRF protection
 * - Sanitize input and escape output
 *
 * @package YourPlugin
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Add meta box
 */
function yourprefix_add_meta_box() {
	add_meta_box(
		'yourprefix_details',              // Meta box ID
		__( 'Additional Details', 'your-plugin' ),  // Title
		'yourprefix_render_meta_box',      // Callback function
		'post',                            // Post type (or array of post types)
		'normal',                          // Context (normal, side, advanced)
		'high'                             // Priority
	);
}
add_action( 'add_meta_boxes', 'yourprefix_add_meta_box' );

/**
 * Render meta box content
 *
 * @param WP_Post $post Post object.
 */
function yourprefix_render_meta_box( $post ) {
	// Add nonce for security
	wp_nonce_field( 'yourprefix_save_meta', 'yourprefix_meta_nonce' );

	// Get current values
	$text_value   = get_post_meta( $post->ID, '_yourprefix_text', true );
	$number_value = get_post_meta( $post->ID, '_yourprefix_number', true );
	$select_value = get_post_meta( $post->ID, '_yourprefix_select', true );
	$checkbox     = get_post_meta( $post->ID, '_yourprefix_checkbox', true );

	?>
	<table class="form-table">
		<tr>
			<th>
				<label for="yourprefix_text">
					<?php esc_html_e( 'Text Field', 'your-plugin' ); ?>
				</label>
			</th>
			<td>
				<input
					type="text"
					id="yourprefix_text"
					name="yourprefix_text"
					value="<?php echo esc_attr( $text_value ); ?>"
					class="regular-text"
				/>
				<p class="description">
					<?php esc_html_e( 'Enter some text here', 'your-plugin' ); ?>
				</p>
			</td>
		</tr>

		<tr>
			<th>
				<label for="yourprefix_number">
					<?php esc_html_e( 'Number Field', 'your-plugin' ); ?>
				</label>
			</th>
			<td>
				<input
					type="number"
					id="yourprefix_number"
					name="yourprefix_number"
					value="<?php echo esc_attr( $number_value ); ?>"
					min="0"
					max="100"
					class="small-text"
				/>
			</td>
		</tr>

		<tr>
			<th>
				<label for="yourprefix_select">
					<?php esc_html_e( 'Select Field', 'your-plugin' ); ?>
				</label>
			</th>
			<td>
				<select id="yourprefix_select" name="yourprefix_select">
					<option value=""><?php esc_html_e( '-- Select --', 'your-plugin' ); ?></option>
					<option value="option1" <?php selected( $select_value, 'option1' ); ?>>
						<?php esc_html_e( 'Option 1', 'your-plugin' ); ?>
					</option>
					<option value="option2" <?php selected( $select_value, 'option2' ); ?>>
						<?php esc_html_e( 'Option 2', 'your-plugin' ); ?>
					</option>
					<option value="option3" <?php selected( $select_value, 'option3' ); ?>>
						<?php esc_html_e( 'Option 3', 'your-plugin' ); ?>
					</option>
				</select>
			</td>
		</tr>

		<tr>
			<th>
				<?php esc_html_e( 'Checkbox', 'your-plugin' ); ?>
			</th>
			<td>
				<label>
					<input
						type="checkbox"
						id="yourprefix_checkbox"
						name="yourprefix_checkbox"
						value="1"
						<?php checked( $checkbox, '1' ); ?>
					/>
					<?php esc_html_e( 'Enable this option', 'your-plugin' ); ?>
				</label>
			</td>
		</tr>
	</table>
	<?php
}

/**
 * Save meta box data
 *
 * @param int     $post_id Post ID.
 * @param WP_Post $post    Post object.
 */
function yourprefix_save_meta( $post_id, $post ) {
	// Verify nonce
	if ( ! isset( $_POST['yourprefix_meta_nonce'] ) ||
	     ! wp_verify_nonce( $_POST['yourprefix_meta_nonce'], 'yourprefix_save_meta' ) ) {
		return;
	}

	// Check autosave
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	// Check user permissions
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	// Save text field
	if ( isset( $_POST['yourprefix_text'] ) ) {
		update_post_meta(
			$post_id,
			'_yourprefix_text',
			sanitize_text_field( $_POST['yourprefix_text'] )
		);
	}

	// Save number field
	if ( isset( $_POST['yourprefix_number'] ) ) {
		update_post_meta(
			$post_id,
			'_yourprefix_number',
			absint( $_POST['yourprefix_number'] )
		);
	}

	// Save select field
	if ( isset( $_POST['yourprefix_select'] ) ) {
		$allowed_values = array( 'option1', 'option2', 'option3' );
		$select_value   = sanitize_text_field( $_POST['yourprefix_select'] );

		// Validate against allowed values
		if ( in_array( $select_value, $allowed_values, true ) ) {
			update_post_meta( $post_id, '_yourprefix_select', $select_value );
		} else {
			delete_post_meta( $post_id, '_yourprefix_select' );
		}
	}

	// Save checkbox
	if ( isset( $_POST['yourprefix_checkbox'] ) ) {
		update_post_meta( $post_id, '_yourprefix_checkbox', '1' );
	} else {
		delete_post_meta( $post_id, '_yourprefix_checkbox' );
	}
}
add_action( 'save_post', 'yourprefix_save_meta', 10, 2 );

/**
 * Display meta box data on frontend
 *
 * Add this to your theme's single.php or use a filter
 */
function yourprefix_display_meta_data( $content ) {
	if ( ! is_singular( 'post' ) ) {
		return $content;
	}

	global $post;

	$text_value   = get_post_meta( $post->ID, '_yourprefix_text', true );
	$number_value = get_post_meta( $post->ID, '_yourprefix_number', true );
	$select_value = get_post_meta( $post->ID, '_yourprefix_select', true );
	$checkbox     = get_post_meta( $post->ID, '_yourprefix_checkbox', true );

	if ( $text_value || $number_value || $select_value || $checkbox ) {
		$meta_html = '<div class="custom-meta-data">';
		$meta_html .= '<h3>' . esc_html__( 'Additional Details', 'your-plugin' ) . '</h3>';
		$meta_html .= '<ul>';

		if ( $text_value ) {
			$meta_html .= '<li><strong>' . esc_html__( 'Text:', 'your-plugin' ) . '</strong> ' . esc_html( $text_value ) . '</li>';
		}

		if ( $number_value ) {
			$meta_html .= '<li><strong>' . esc_html__( 'Number:', 'your-plugin' ) . '</strong> ' . esc_html( $number_value ) . '</li>';
		}

		if ( $select_value ) {
			$meta_html .= '<li><strong>' . esc_html__( 'Selection:', 'your-plugin' ) . '</strong> ' . esc_html( $select_value ) . '</li>';
		}

		if ( $checkbox ) {
			$meta_html .= '<li><strong>' . esc_html__( 'Option enabled', 'your-plugin' ) . '</strong></li>';
		}

		$meta_html .= '</ul>';
		$meta_html .= '</div>';

		$content .= $meta_html;
	}

	return $content;
}
add_filter( 'the_content', 'yourprefix_display_meta_data' );
