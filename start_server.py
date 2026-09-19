#!/usr/bin/env python3
"""
Portfolio Website Server
Simple HTTP server for your static portfolio site.
"""

import http.server
import socketserver
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Custom log handling
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Log to stderr with prefix
        print(f"[Portfolio Server] {args[0]}", file=sys.stderr)
    
    def do_GET(self):
        # Add custom 404 page
        if self.path == '/':
            self.path = '/index.html'
        return super().do_GET()
    
    def do_HEAD(self):
        if self.path == '/':
            self.path = '/index.html'
        return super().do_HEAD()

def main():
    PORT = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    
    with socketserver.TCPServer(("", PORT), QuietHandler) as httpd:
        address = (httpd.server_address[0], httpd.server_address[1])
        print(f"Serving portfolio at http://{address[0]}:{address[1]}")
        print(f"Directory: {os.path.abspath(DIRECTORY)}")
        print("\nPress Ctrl+C to stop")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.shutdown()

if __name__ == "__main__":
    main()
