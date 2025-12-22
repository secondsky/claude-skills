<?php
/**
 * Admin settings page template
 *
 * @var array $settings Current plugin settings
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>

<div class="wrap">
	<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

	<?php settings_errors( 'myop_messages' ); ?>

	<form method="post" action="">
		<?php wp_nonce_field( 'myop_settings_action', 'myop_settings_nonce' ); ?>

		<table class="form-table">
			<tr>
				<th scope="row">
					<label for="myop_option1"><?php esc_html_e( 'Text Option', 'my-oop-plugin' ); ?></label>
				</th>
				<td>
					<input
						type="text"
						id="myop_option1"
						name="myop_option1"
						value="<?php echo esc_attr( $settings['option1'] ); ?>"
						class="regular-text"
					/>
					<p class="description">
						<?php esc_html_e( 'Enter some text here', 'my-oop-plugin' ); ?>
					</p>
				</td>
			</tr>

			<tr>
				<th scope="row">
					<label for="myop_option2"><?php esc_html_e( 'Number Option', 'my-oop-plugin' ); ?></label>
				</th>
				<td>
					<input
						type="number"
						id="myop_option2"
						name="myop_option2"
						value="<?php echo esc_attr( $settings['option2'] ); ?>"
						min="0"
						max="100"
						class="small-text"
					/>
					<p class="description">
						<?php esc_html_e( 'Enter a number between 0 and 100', 'my-oop-plugin' ); ?>
					</p>
				</td>
			</tr>

			<tr>
				<th scope="row">
					<label for="myop_option3"><?php esc_html_e( 'Checkbox Option', 'my-oop-plugin' ); ?></label>
				</th>
				<td>
					<fieldset>
						<label>
							<input
								type="checkbox"
								id="myop_option3"
								name="myop_option3"
								value="1"
								<?php checked( $settings['option3'], true ); ?>
							/>
							<?php esc_html_e( 'Enable this feature', 'my-oop-plugin' ); ?>
						</label>
						<p class="description">
							<?php esc_html_e( 'Check to enable this feature', 'my-oop-plugin' ); ?>
						</p>
					</fieldset>
				</td>
			</tr>
		</table>

		<?php submit_button( __( 'Save Settings', 'my-oop-plugin' ), 'primary', 'myop_settings_submit' ); ?>
	</form>
</div>
