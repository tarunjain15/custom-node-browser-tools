#!/bin/bash

# Wrapper script to publish the custom node as a private npm package
# Uses the main publish_npm_package.sh script from the n8n-node-tools directory

# Get the current directory (custom-node-browser-tools)
CUSTOM_NODE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOOLS_DIR="/Users/tarun/workspace/home/custom-n8n-nodes/n8n-node-tools"

# Check if version type is provided
VERSION_TYPE="$1"
if [ -z "$VERSION_TYPE" ]; then
    echo "Error: Version type not provided."
    echo "Usage: ./scripts/publish.sh [version_type]"
    echo "  version_type: patch, minor, or major"
    exit 1
fi

# Check if the main script exists
if [ ! -f "$TOOLS_DIR/publish_npm_package.sh" ]; then
    echo "Error: Main publish script not found at $TOOLS_DIR/publish_npm_package.sh"
    exit 1
fi

# Make the main script executable if it isn't already
chmod +x "$TOOLS_DIR/publish_npm_package.sh"

# Execute the main script with the node directory and version type
"$TOOLS_DIR/publish_npm_package.sh" "$CUSTOM_NODE_DIR" "$VERSION_TYPE"