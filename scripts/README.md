# Custom Node Scripts

These scripts help you manage the linking and unlinking of this custom node with local n8n servers. They leverage the more comprehensive scripts in the parent directory.

## Available Scripts

### `link-to-local-server.sh`

Links this custom node to a local n8n server of your choice.

```bash
# Interactive server selection
./link-to-local-server.sh

# Or specify a server directly
./link-to-local-server.sh /path/to/local-n8n-server

# Or by server name
./link-to-local-server.sh local-n8n-server
```

### `unlink-from-local-server.sh`

Unlinks this custom node from a local n8n server.

```bash
# Interactive server selection
./unlink-from-local-server.sh

# Or specify a server directly
./unlink-from-local-server.sh /path/to/local-n8n-server

# Or by server name
./unlink-from-local-server.sh local-n8n-server
```

### `check-link-status.sh`

Checks the current link status between this custom node and a local n8n server.

```bash
# Interactive server selection
./check-link-status.sh

# Or specify a server directly
./check-link-status.sh /path/to/local-n8n-server

# Or by server name
./check-link-status.sh local-n8n-server
```

## How It Works

These scripts are wrapper scripts that call the main scripts located in the parent scripts directory at:

```
/Users/tarun/workspace/home/custom-n8n-nodes/scripts/
```

They automatically pass the path to this custom node as the first argument and allow you to interactively select which server to link to/unlink from.