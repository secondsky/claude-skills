#!/bin/bash

# WordPress Plugin Scaffolding Script
# Creates a new WordPress plugin from templates

set -e

echo "======================================"
echo "WordPress Plugin Scaffolding Tool"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -d "../../templates" ]; then
    echo "Error: This script must be run from the skills/wordpress-plugin-core/scripts/ directory"
    exit 1
fi

# Get plugin information
read -p "Plugin Name (e.g., My Awesome Plugin): " PLUGIN_NAME
read -p "Plugin Slug (e.g., my-awesome-plugin): " PLUGIN_SLUG
read -p "Plugin Prefix (4-5 chars, e.g., myap_): " PLUGIN_PREFIX
read -p "Plugin Author: " PLUGIN_AUTHOR
read -p "Plugin URI: " PLUGIN_URI
read -p "Author URI: " AUTHOR_URI
read -p "Description: " PLUGIN_DESC

# Choose architecture
echo ""
echo "Select plugin architecture:"
echo "1) Simple (functional programming)"
echo "2) OOP (object-oriented, singleton)"
echo "3) PSR-4 (modern, namespaced with Composer)"
read -p "Choice (1-3): " ARCH_CHOICE

# Set template directory
case $ARCH_CHOICE in
    1)
        TEMPLATE_DIR="../../templates/plugin-simple"
        ARCH_NAME="simple"
        ;;
    2)
        TEMPLATE_DIR="../../templates/plugin-oop"
        ARCH_NAME="oop"
        ;;
    3)
        TEMPLATE_DIR="../../templates/plugin-psr4"
        ARCH_NAME="psr4"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

# Set destination directory
DEST_DIR="$HOME/wp-content/plugins/$PLUGIN_SLUG"

# Check if destination exists
if [ -d "$DEST_DIR" ]; then
    echo "Error: Plugin directory already exists: $DEST_DIR"
    exit 1
fi

echo ""
echo "Creating plugin from $ARCH_NAME template..."

# Copy template
cp -r "$TEMPLATE_DIR" "$DEST_DIR"

# Function to replace placeholders in a file
replace_in_file() {
    local file="$1"

    # Skip vendor directory if it exists
    if [[ "$file" == *"/vendor/"* ]]; then
        return
    fi

    # Only process text files
    if file "$file" | grep -q text; then
        sed -i "s/My Simple Plugin/$PLUGIN_NAME/g" "$file"
        sed -i "s/My OOP Plugin/$PLUGIN_NAME/g" "$file"
        sed -i "s/My PSR-4 Plugin/$PLUGIN_NAME/g" "$file"
        sed -i "s/my-simple-plugin/$PLUGIN_SLUG/g" "$file"
        sed -i "s/my-oop-plugin/$PLUGIN_SLUG/g" "$file"
        sed -i "s/my-psr4-plugin/$PLUGIN_SLUG/g" "$file"
        sed -i "s/mysp_/${PLUGIN_PREFIX}/g" "$file"
        sed -i "s/MYSP_/${PLUGIN_PREFIX^^}/g" "$file"
        sed -i "s/myop_/${PLUGIN_PREFIX}/g" "$file"
        sed -i "s/MYOP_/${PLUGIN_PREFIX^^}/g" "$file"
        sed -i "s/mypp_/${PLUGIN_PREFIX}/g" "$file"
        sed -i "s/MYPP_/${PLUGIN_PREFIX^^}/g" "$file"
        sed -i "s/MyPSR4Plugin/${PLUGIN_PREFIX^}Plugin/g" "$file"
        sed -i "s/My_OOP_Plugin/${PLUGIN_PREFIX^}Plugin/g" "$file"
        sed -i "s/Your Name/$PLUGIN_AUTHOR/g" "$file"
        sed -i "s|https://example.com/my-simple-plugin/|$PLUGIN_URI|g" "$file"
        sed -i "s|https://example.com/my-oop-plugin/|$PLUGIN_URI|g" "$file"
        sed -i "s|https://example.com/my-psr4-plugin/|$PLUGIN_URI|g" "$file"
        sed -i "s|https://example.com/|$AUTHOR_URI|g" "$file"
        sed -i "s/A simple WordPress plugin demonstrating functional programming pattern with security best practices./$PLUGIN_DESC/g" "$file"
        sed -i "s/An object-oriented WordPress plugin using singleton pattern with security best practices./$PLUGIN_DESC/g" "$file"
        sed -i "s/A modern WordPress plugin using PSR-4 autoloading with Composer and namespaces./$PLUGIN_DESC/g" "$file"
    fi
}

# Replace placeholders in all files
echo "Replacing placeholders..."
find "$DEST_DIR" -type f | while read -r file; do
    replace_in_file "$file"
done

# Rename main plugin file
cd "$DEST_DIR"
if [ "$ARCH_NAME" = "simple" ]; then
    mv my-simple-plugin.php "$PLUGIN_SLUG.php"
elif [ "$ARCH_NAME" = "oop" ]; then
    mv my-oop-plugin.php "$PLUGIN_SLUG.php"
elif [ "$ARCH_NAME" = "psr4" ]; then
    mv my-psr4-plugin.php "$PLUGIN_SLUG.php"
fi

# Create asset directories
mkdir -p assets/css assets/js

# For PSR-4, run composer install if composer is available
if [ "$ARCH_NAME" = "psr4" ] && command -v composer &> /dev/null; then
    echo "Running composer install..."
    composer install
fi

echo ""
echo "✅ Plugin created successfully!"
echo ""
echo "Location: $DEST_DIR"
echo ""
echo "Next steps:"
echo "1. Activate plugin in WordPress admin"
echo "2. Create assets/css/ and assets/js/ files as needed"
if [ "$ARCH_NAME" = "psr4" ]; then
    echo "3. Run 'composer install' if not already done"
    echo "4. Add new classes to src/ directory"
fi
echo ""
echo "Security reminder:"
echo "- All files have ABSPATH checks ✅"
echo "- Unique prefix ($PLUGIN_PREFIX) applied ✅"
echo "- Remember to:"
echo "  - Sanitize all input"
echo "  - Escape all output"
echo "  - Use nonces for forms/AJAX"
echo "  - Check capabilities"
echo "  - Use prepared statements for database"
echo ""
