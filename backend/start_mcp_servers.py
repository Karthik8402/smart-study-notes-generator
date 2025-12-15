"""
Start All MCP Servers Script

Runs all MCP servers in separate threads for local development.
Supports both local simulated servers and real Google API servers.

Usage:
    python start_mcp_servers.py           # Start all servers (local only)
    python start_mcp_servers.py --google  # Start all servers including Google API servers

Servers:
    Local (Simulated):
        - Filesystem: http://localhost:9000
        - Calendar: http://localhost:9001  
        - Drive: http://localhost:9002
    
    Google API (Real):
        - Google Calendar: http://localhost:9010
        - Google Drive: http://localhost:9011
"""

import threading
import subprocess
import sys
import time
import signal
import argparse

processes = []

def run_server(name: str, module: str, port: int):
    """Run an MCP server as a subprocess."""
    print(f"[*] Starting {name} MCP Server on port {port}...")
    
    process = subprocess.Popen(
        [sys.executable, "-m", module],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )
    processes.append((name, process))
    
    # Stream output
    for line in iter(process.stdout.readline, ''):
        print(f"[{name}] {line.strip()}")


def cleanup(signum=None, frame=None):
    """Clean up all processes on exit."""
    print("\n[!] Shutting down MCP servers...")
    for name, process in processes:
        process.terminate()
        print(f"   [x] {name} stopped")
    sys.exit(0)


def main():
    # Parse arguments
    parser = argparse.ArgumentParser(description="Start MCP servers")
    parser.add_argument('--google', action='store_true', help="Include Google API servers")
    parser.add_argument('--google-only', action='store_true', help="Start only Google API servers")
    args = parser.parse_args()
    
    # Register cleanup handler
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)
    
    print("=" * 60)
    print("   MCP Servers Manager")
    print("=" * 60)
    print()
    
    # Define servers
    local_servers = [
        ("Filesystem", "app.mcp.servers.filesystem_server", 9000),
        ("Calendar", "app.mcp.servers.calendar_server", 9001),
        ("Drive", "app.mcp.servers.drive_server", 9002),
    ]
    
    google_servers = [
        ("Google Calendar", "app.mcp.servers.google_calendar_server", 9010),
        ("Google Drive", "app.mcp.servers.google_drive_server", 9011),
    ]
    
    # Determine which servers to start
    servers = []
    if args.google_only:
        servers = google_servers
        print("   Mode: Google API Servers Only")
    elif args.google:
        servers = local_servers + google_servers
        print("   Mode: All Servers (Local + Google API)")
    else:
        servers = local_servers
        print("   Mode: Local Servers Only")
    
    print()
    
    threads = []
    for name, module, port in servers:
        thread = threading.Thread(target=run_server, args=(name, module, port), daemon=True)
        thread.start()
        threads.append(thread)
        time.sleep(1)  # Stagger startup
    
    print()
    print("=" * 60)
    print("   All MCP Servers Running!")
    print("=" * 60)
    print()
    
    if not args.google_only:
        print("   Local (Simulated):")
        print("   - Filesystem: http://localhost:9000")
        print("   - Calendar:   http://localhost:9001")
        print("   - Drive:      http://localhost:9002")
        print()
    
    if args.google or args.google_only:
        print("   Google API (Real):")
        print("   - Google Calendar: http://localhost:9010")
        print("   - Google Drive:    http://localhost:9011")
        print()
        print("   NOTE: Google servers require credentials.json from Google Cloud Console")
        print("         Place it at: backend/app/mcp/servers/credentials.json")
        print()
    
    print("   Press Ctrl+C to stop all servers")
    print()
    
    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        cleanup()


if __name__ == "__main__":
    main()
