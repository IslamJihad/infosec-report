# MCP Setup Notes

## Set the GITHUB_TOKEN environment variable

PowerShell (current session):

```powershell
$env:GITHUB_TOKEN = "your_personal_access_token"
```

PowerShell (persist for current user):

```powershell
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "your_personal_access_token", "User")
```

Restart VS Code after setting a persistent environment variable.

## Add a new MCP server

1. Open [mcp.json](mcp.json).
2. Add a new entry under `servers` using a unique server key.
3. Define `type`, `command`, `args`, and optional `env` fields.
4. Keep all credentials in environment variables.

## Disable a server temporarily

Add `"disabled": true` to the server definition in [mcp.json](mcp.json).

Example:

```json
{
  "servers": {
    "github": {
      "disabled": true,
      "type": "stdio",
      "command": "docker",
      "args": ["run", "-i", "--rm", "ghcr.io/github/github-mcp-server"]
    }
  }
}
```
