#!/bin/bash

# Script to check the link status of the custom node with a local n8n server
# Uses the main check_node_server_link.sh script from the central scripts directory

# Get the current directory (custom-node-browser-tools)
CUSTOM_NODE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MAIN_SCRIPTS_DIR="/Users/tarun/workspace/home/custom-n8n-nodes/n8n-node-tools"
SERVERS_DIR="/Users/tarun/workspace/home/local-n8n-servers"

# Check if the main script exists
if [ ! -f "$MAIN_SCRIPTS_DIR/check_node_server_link.sh" ]; then
    echo "Error: Main check script not found at $MAIN_SCRIPTS_DIR/check_node_server_link.sh"
    exit 1
fi

# Handle interactive server selection if no argument is provided
if [ -z "$1" ]; then
    # Display available servers
    echo "Available servers:"
    server_count=0
    server_dirs=()
    
    while IFS= read -r dir; do
        if [ -d "$dir" ] && [ -f "$dir/n8n.sh" ]; then
            server_dirs[server_count]="$dir"
            server_name=$(basename "$dir")
            echo "  $((server_count+1)). $server_name"
            ((server_count++))
        fi
    done < <(find "$SERVERS_DIR" -maxdepth 1 -type d | sort)
    
    # Add ALL option
    echo "  $((server_count+1)). ALL SERVERS"
    
    if [ ${#server_dirs[@]} -eq 0 ]; then
        echo "Error: No n8n servers found in $SERVERS_DIR"
        exit 1
    fi
    
    # Prompt for selection
    selected=0
    while [[ $selected -lt 1 || $selected -gt $((server_count+1)) ]]; do
        read -p "Enter server number (1-$((server_count+1))): " selected
        if [[ ! "$selected" =~ ^[0-9]+$ ]]; then
            selected=0
        fi
    done
    
    # Check if "ALL" was selected
    if [ "$selected" -eq $((server_count+1)) ]; then
        # For ALL servers, execute the script for each server
        for dir in "${server_dirs[@]}"; do
            echo "Checking status with server: $(basename "$dir")"
            "$MAIN_SCRIPTS_DIR/check_node_server_link.sh" "$CUSTOM_NODE_DIR" "$dir"
            echo "---------------------------------------------"
        done
        exit 0
    else
        SERVER_PATH="${server_dirs[$((selected-1))]}"
    fi
else
    # Check if the provided path exists directly
    if [ -d "$1" ]; then
        SERVER_PATH="$1"
    # Check if it might be a server name in the servers directory
    elif [ -d "$SERVERS_DIR/$1" ]; then
        SERVER_PATH="$SERVERS_DIR/$1"
    else
        echo "Error: The specified path does not exist: $1"
        exit 1
    fi
fi

# Execute the main script with the node and server paths
"$MAIN_SCRIPTS_DIR/check_node_server_link.sh" "$CUSTOM_NODE_DIR" "$SERVER_PATH"