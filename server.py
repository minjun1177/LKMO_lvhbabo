import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from datetime import datetime

PORT = 3000
DB_FILE = 'leaderboard.json'

def get_leaderboard():
    if not os.path.exists(DB_FILE):
        return []
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def save_leaderboard(data):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

class LeaderboardHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/leaderboard':
            records = get_leaderboard()
            # Sort by accuracy (descending), then date (newest)
            records.sort(key=lambda x: (-x.get('acc', 0), x.get('date', '')))
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(records[:100]).encode('utf-8'))
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/leaderboard':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                name = data.get('name', 'Anonymous')
                mode = data.get('mode', 'Unknown')
                acc = data.get('acc', 0)
                
                records = get_leaderboard()
                records.append({
                    'name': name[:20],
                    'mode': mode,
                    'acc': acc,
                    'date': datetime.utcnow().isoformat() + 'Z'
                })
                save_leaderboard(records)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()
            
    def do_DELETE(self):
        if self.path == '/api/leaderboard':
            save_leaderboard([])
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, LeaderboardHandler)
    print(f"Starting Python server on http://localhost:{PORT}")
    print("This server will also host your HTML/CSS/JS files.")
    httpd.serve_forever()
