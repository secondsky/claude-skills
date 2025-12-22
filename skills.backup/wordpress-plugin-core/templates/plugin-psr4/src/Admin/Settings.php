<?php
/**
 * Admin Settings
 *
 * @package MyPSR4Plugin\Admin
 */

namespace MyPSR4Plugin\Admin;

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Settings class
 */
class Settings {

	/**
	 * Single instance
	 *
	 * @var Settings
	 */
	private static $instance = null;

	/**
	 * Option name
	 *
	 * @var string
	 */
	const OPTION_NAME = 'mypp_settings';

	/**
	 * Get instance
	 *
	 * @return Settings
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
		add_action( 'admin_menu', array( $this, 'add_menu_page' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
	}

	/**
	 * Add menu page
	 */
	public function add_menu_page() {
		add_options_page(
			__( 'My PSR-4 Plugin Settings', 'my-psr4-plugin' ),
			__( 'PSR-4 Plugin', 'my-psr4-plugin' ),
			'manage_options',
			'my-psr4-plugin',
			array( $this, 'render_settings_page' )
		);
	}

	/**
	 * Register settings
	 */
	public function register_settings() {
		register_setting(
			'mypp_settings_group',
			self::OPTION_NAME,
			array( $this, 'sanitize_settings' )
		);

		add_settings_section(
			'mypp_general_section',
			__( 'General Settings', 'my-psr4-plugin' ),
			array( $this, 'render_section_description' ),
			'my-psr4-plugin'
		);

		add_settings_field(
			'mypp_option1',
			__( 'Text Option', 'my-psr4-plugin' ),
			array( $this, 'render_text_field' ),
			'my-psr4-plugin',
			'mypp_general_section',
			array( 'field_id' => 'option1' )
		);

		add_settings_field(
			'mypp_option2',
			__( 'Number Option', 'my-psr4-plugin' ),
			array( $this, 'render_number_field' ),
			'my-psr4-plugin',
			'mypp_general_section',
			array( 'field_id' => 'option2' )
		);

		add_settings_field(
			'mypp_option3',
			__( 'Checkbox Option', 'my-psr4-plugin' ),
			array( $this, 'render_checkbox_field' ),
			'my-psr4-plugin',
			'mypp_general_section',
			array( 'field_id' => 'option3' )
		);
	}

	/**
	 * Render settings page
	 */
	public function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<form method="post" action="options.php">
				<?php
				settings_fields( 'mypp_settings_group' );
				do_settings_sections( 'my-psr4-plugin' );
				submit_button( __( 'Save Settings', 'my-psr4-plugin' ) );
				?>
			</form>
		</div>
		<?php
	}

	/**
	 * Render section description
	 */
	public function render_section_description() {
		echo '<p>' . esc_html__( 'Configure your plugin settings below.', 'my-psr4-plugin' ) . '</p>';
	}

	/**
	 * Render text field
	 *
	 * @param array $args Field arguments.
	 */
	public function render_text_field( $args ) {
		$settings = $this->get_settings();
		$field_id = $args['field_id'];
		$value    = isset( $settings[ $field_id ] ) ? $settings[ $field_id ] : '';

		printf(
			'<input type="text" id="mypp_%1$s" name="%2$s[%1$s]" value="%3$s" class="regular-text" />',
			esc_attr( $field_id ),
			esc_attr( self::OPTION_NAME ),
			esc_attr( $value )
		);
	}

	/**
	 * Render number field
	 *
	 * @param array $args Field arguments.
	 */
	public function render_number_field( $args ) {
		$settings = $this->get_settings();
		$field_id = $args['field_id'];
		$value    = isset( $settings[ $field_id ] ) ? $settings[ $field_id ] : 0;

		printf(
			'<input type="number" id="mypp_%1$s" name="%2$s[%1$s]" value="%3$s" min="0" max="100" class="small-text" />',
			esc_attr( $field_id ),
			esc_attr( self::OPTION_NAME ),
			esc_attr( $value )
		);
	}

	/**
	 * Render checkbox field
	 *
	 * @param array $args Field arguments.
	 */
	public function render_checkbox_field( $args ) {
		$settings = $this->get_settings();
		$field_id = $args['field_id'];
		$value    = isset( $settings[ $field_id ] ) ? $settings[ $field_id ] : false;

		printf(
			'<input type="checkbox" id="mypp_%1$s" name="%2$s[%1$s]" value="1" %3$s />',
			esc_attr( $field_id ),
			esc_attr( self::OPTION_NAME ),
			checked( $value, true, false )
		);
	}

	/**
	 * Sanitize settings
	 *
	 * @param array $input Input array.
	 * @return array
	 */
	public function sanitize_settings( $input ) {
		$sanitized = array();

		if ( isset( $input['option1'] ) ) {
			$sanitized['option1'] = sanitize_text_field( $input['option1'] );
		}

		if ( isset( $input['option2'] ) ) {
			$sanitized['option2'] = absint( $input['option2'] );
		}

		if ( isset( $input['option3'] ) ) {
			$sanitized['option3'] = (bool) $input['option3'];
		}

		return $sanitized;
	}

	/**
	 * Get settings
	 *
	 * @return array
	 */
	public function get_settings() {
		$defaults = array(
			'option1' => '',
			'option2' => 0,
			'option3' => false,
		);

		$settings = get_option( self::OPTION_NAME, $defaults );

		return wp_parse_args( $settings, $defaults );
	}

	/**
	 * Set default settings on activation
	 */
	public function set_defaults() {
		if ( false === get_option( self::OPTION_NAME ) ) {
			add_option( self::OPTION_NAME, array(
				'option1' => '',
				'option2' => 0,
				'option3' => false,
			) );
		}
	}
}
