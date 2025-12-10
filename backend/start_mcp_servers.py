"""
Start All MCP Servers Script

Runs all MCP servers in separate threads for local development.

Usage:
    python start_mcp_servers.py

Servers:
    - Filesystem: http://localhost:9000
    - Calendar: http://localhost:9001  
    - Drive: http://localhost:9002
"""

import threading
import subprocess
import sys
import time
import signal

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
    # Register cleanup handler
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)
    
    print("=" * 50)
    print("   MCP Servers Manager")
    print("=" * 50)
    print()
    
    servers = [
        ("Filesystem", "app.mcp.servers.filesystem_server", 9000),
        ("Calendar", "app.mcp.servers.calendar_server", 9001),
        ("Drive", "app.mcp.servers.drive_server", 9002),
    ]
    
    threads = []
    for name, module, port in servers:
        thread = threading.Thread(target=run_server, args=(name, module, port), daemon=True)
        thread.start()
        threads.append(thread)
        time.sleep(1)  # Stagger startup
    
    print()
    print("=" * 50)
    print("   All MCP Servers Running!")
    print("=" * 50)
    print()
    print("   Filesystem: http://localhost:9000")
    print("   Calendar:   http://localhost:9001")
    print("   Drive:      http://localhost:9002")
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
