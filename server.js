const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain; charset=utf-8'
};

function startServer(port) {
    const server = http.createServer((req, res) => {
        try {
            const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            let pathname = decodeURIComponent(parsedUrl.pathname);

            // Website forms post here. They are not connected to any backend yet,
            // so no visitor data is stored or sent anywhere; reply with a friendly notice.
            if (pathname.startsWith('/forms/')) {
                req.resume();
                res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({
                    message: "Online applications aren't open yet. Please call us at +880 1644-099435 or visit our campus."
                }));
                return;
            }

            // Redirect root directly to main site
            if (pathname === '/') {
                res.writeHead(302, { 'Location': '/futurestackacademy/' });
                res.end();
                return;
            }

            // Prevent path traversal
            const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
            let filePath = path.join(ROOT_DIR, safePath);

            // Ensure filePath stays within ROOT_DIR
            if (!filePath.startsWith(ROOT_DIR)) {
                res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('403 Forbidden');
                return;
            }

            fs.stat(filePath, (err, stats) => {
                if (err) {
                    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('404 Not Found');
                    return;
                }

                if (stats.isDirectory()) {
                    // If directory without trailing slash, redirect to add trailing slash
                    if (!pathname.endsWith('/')) {
                        res.writeHead(301, { 'Location': pathname + '/' + (parsedUrl.search || '') });
                        res.end();
                        return;
                    }

                    filePath = path.join(filePath, 'index.html');
                    if (!fs.existsSync(filePath)) {
                        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                        res.end('404 Not Found (no index.html)');
                        return;
                    }
                }

                const ext = path.extname(filePath).toLowerCase();
                const contentType = MIME_TYPES[ext] || 'application/octet-stream';

                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*'
                });

                const stream = fs.createReadStream(filePath);
                stream.on('error', (streamErr) => {
                    if (!res.headersSent) {
                        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                    }
                    res.end('500 Internal Server Error');
                });
                stream.pipe(res);
            });
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('500 Server Error: ' + e.message);
        }
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is in use, trying ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });

    server.listen(port, () => {
        console.log(`Website is running at http://localhost:${port}/`);
    });
}

startServer(DEFAULT_PORT);
