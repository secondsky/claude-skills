<?php
/**
 * Example: Settings page using WordPress Settings API
 *
 * This example shows how to:
 * - Add a settings page to WordPress admin
 * - Register settings with Settings API
 * - Add settings sections and fields
 * - Sanitize and validate settings
 * - Use different field types
 *
 * @package YourPlugin
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Add settings page to admin menu
 */
function yourprefix_add_settings_page() {
	add_options_page(
		__( 'Your Plugin Settings', 'your-plugin' ),  // Page title
		__( 'Your Plugin', 'your-plugin' ),           // Menu title
		'manage_options',                             // Capability
		'your-plugin-settings',                       // Menu slug
		'yourprefix_render_settings_page'             // Callback function
	);
}
add_action( 'admin_menu', 'yourprefix_add_settings_page' );

/**
 * Register settings
 */
function yourprefix_register_settings() {
	// Register setting
	register_setting(
		'yourprefix_settings_group',   // Option group
		'yourprefix_settings',          // Option name
		'yourprefix_sanitize_settings'  // Sanitize callback
	);

	// Add settings section
	add_settings_section(
		'yourprefix_general_section',              // Section ID
		__( 'General Settings', 'your-plugin' ),   // Section title
		'yourprefix_general_section_callback',     // Callback
		'your-plugin-settings'                     // Page slug
	);

	// Add settings fields
	add_settings_field(
		'yourprefix_text_field',
		__( 'Text Field', 'your-plugin' ),
		'yourprefix_text_field_callback',
		'your-plugin-settings',
		'yourprefix_general_section'
	);

	add_settings_field(
		'yourprefix_number_field',
		__( 'Number Field', 'your-plugin' ),
		'yourprefix_number_field_callback',
		'your-plugin-settings',
		'yourprefix_general_section'
	);

	add_settings_field(
		'yourprefix_checkbox_field',
		__( 'Checkbox Field', 'your-plugin' ),
		'yourprefix_checkbox_field_callback',
		'your-plugin-settings',
		'yourprefix_general_section'
	);

	add_settings_field(
		'yourprefix_select_field',
		__( 'Select Field', 'your-plugin' ),
		'yourprefix_select_field_callback',
		'your-plugin-settings',
		'yourprefix_general_section'
	);

	add_settings_field(
		'yourprefix_textarea_field',
		__( 'Textarea Field', 'your-plugin' ),
		'yourprefix_textarea_field_callback',
		'your-plugin-settings',
		'yourprefix_general_section'
	);
}
add_action( 'admin_init', 'yourprefix_register_settings' );

/**
 * Render settings page
 */
function yourprefix_render_settings_page() {
	// Check user capabilities
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	// Show success message if settings were saved
	if ( isset( $_GET['settings-updated'] ) ) {
		add_settings_error(
			'yourprefix_messages',
			'yourprefix_message',
			__( 'Settings Saved', 'your-plugin' ),
			'updated'
		);
	}

	// Show error/update messages
	settings_errors( 'yourprefix_messages' );

	?>
	<div class="wrap">
		<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
		<form method="post" action="options.php">
			<?php
			settings_fields( 'yourprefix_settings_group' );
			do_settings_sections( 'your-plugin-settings' );
			submit_button( __( 'Save Settings', 'your-plugin' ) );
			?>
		</form>
	</div>
	<?php
}

/**
 * Section callback
 */
function yourprefix_general_section_callback() {
	echo '<p>' . esc_html__( 'Configure your plugin settings below.', 'your-plugin' ) . '</p>';
}

/**
 * Get settings with defaults
 *
 * @return array
 */
function yourprefix_get_settings() {
	$defaults = array(
		'text_field'     => '',
		'number_field'   => 0,
		'checkbox_field' => false,
		'select_field'   => '',
		'textarea_field' => '',
	);

	$settings = get_option( 'yourprefix_settings', $defaults );

	return wp_parse_args( $settings, $defaults );
}

/**
 * Text field callback
 */
function yourprefix_text_field_callback() {
	$settings = yourprefix_get_settings();
	$value    = $settings['text_field'];

	printf(
		'<input type="text" id="yourprefix_text_field" name="yourprefix_settings[text_field]" value="%s" class="regular-text" />',
		esc_attr( $value )
	);
	echo '<p class="description">' . esc_html__( 'Enter some text here', 'your-plugin' ) . '</p>';
}

/**
 * Number field callback
 */
function yourprefix_number_field_callback() {
	$settings = yourprefix_get_settings();
	$value    = $settings['number_field'];

	printf(
		'<input type="number" id="yourprefix_number_field" name="yourprefix_settings[number_field]" value="%s" min="0" max="100" class="small-text" />',
		esc_attr( $value )
	);
	echo '<p class="description">' . esc_html__( 'Enter a number between 0 and 100', 'your-plugin' ) . '</p>';
}

/**
 * Checkbox field callback
 */
function yourprefix_checkbox_field_callback() {
	$settings = yourprefix_get_settings();
	$value    = $settings['checkbox_field'];

	printf(
		'<input type="checkbox" id="yourprefix_checkbox_field" name="yourprefix_settings[checkbox_field]" value="1" %s />',
		checked( $value, true, false )
	);
	echo '<label for="yourprefix_checkbox_field">' . esc_html__( 'Enable this feature', 'your-plugin' ) . '</label>';
}

/**
 * Select field callback
 */
function yourprefix_select_field_callback() {
	$settings = yourprefix_get_settings();
	$value    = $settings['select_field'];

	?>
	<select id="yourprefix_select_field" name="yourprefix_settings[select_field]">
		<option value=""><?php esc_html_e( '-- Select --', 'your-plugin' ); ?></option>
		<option value="option1" <?php selected( $value, 'option1' ); ?>>
			<?php esc_html_e( 'Option 1', 'your-plugin' ); ?>
		</option>
		<option value="option2" <?php selected( $value, 'option2' ); ?>>
			<?php esc_html_e( 'Option 2', 'your-plugin' ); ?>
		</option>
		<option value="option3" <?php selected( $value, 'option3' ); ?>>
			<?php esc_html_e( 'Option 3', 'your-plugin' ); ?>
		</option>
	</select>
	<?php
}

/**
 * Textarea field callback
 */
function yourprefix_textarea_field_callback() {
	$settings = yourprefix_get_settings();
	$value    = $settings['textarea_field'];

	printf(
		'<textarea id="yourprefix_textarea_field" name="yourprefix_settings[textarea_field]" rows="5" cols="50" class="large-text">%s</textarea>',
		esc_textarea( $value )
	);
	echo '<p class="description">' . esc_html__( 'Enter some longer text here', 'your-plugin' ) . '</p>';
}

/**
 * Sanitize settings
 *
 * @param array $input Input array.
 * @return array Sanitized array.
 */
function yourprefix_sanitize_settings( $input ) {
	$sanitized = array();

	// Text field
	if ( isset( $input['text_field'] ) ) {
		$sanitized['text_field'] = sanitize_text_field( $input['text_field'] );
	}

	// Number field
	if ( isset( $input['number_field'] ) ) {
		$number = absint( $input['number_field'] );

		// Validate range
		if ( $number < 0 || $number > 100 ) {
			add_settings_error(
				'yourprefix_messages',
				'yourprefix_message',
				__( 'Number must be between 0 and 100', 'your-plugin' ),
				'error'
			);
			$sanitized['number_field'] = 0;
		} else {
			$sanitized['number_field'] = $number;
		}
	}

	// Checkbox field
	if ( isset( $input['checkbox_field'] ) ) {
		$sanitized['checkbox_field'] = true;
	} else {
		$sanitized['checkbox_field'] = false;
	}

	// Select field
	if ( isset( $input['select_field'] ) ) {
		$allowed_values = array( 'option1', 'option2', 'option3' );
		$select_value   = sanitize_text_field( $input['select_field'] );

		// Validate against allowed values
		if ( in_array( $select_value, $allowed_values, true ) ) {
			$sanitized['select_field'] = $select_value;
		} else {
			$sanitized['select_field'] = '';
		}
	}

	// Textarea field
	if ( isset( $input['textarea_field'] ) ) {
		$sanitized['textarea_field'] = sanitize_textarea_field( $input['textarea_field'] );
	}

	return $sanitized;
}

/**
 * Get a specific setting value
 *
 * @param string $key     Setting key.
 * @param mixed  $default Default value.
 * @return mixed Setting value or default.
 */
function yourprefix_get_setting( $key, $default = '' ) {
	$settings = yourprefix_get_settings();

	return isset( $settings[ $key ] ) ? $settings[ $key ] : $default;
}
