/* eslint-disable @typescript-eslint/no-require-imports */
const http = require('http')
const fs = require('fs')
const path = require('path')

const port = process.env.PORT || 3000
const root = path.join(__dirname, '..', 'out')

function contentType(file) {
  const ext = path.extname(file).toLowerCase()
  switch (ext) {
    case '.html': return 'text/html'
    case '.js': return 'application/javascript'
    case '.css': return 'text/css'
    case '.json': return 'application/json'
    case '.png': return 'image/png'
    case '.jpg': case '.jpeg': return 'image/jpeg'
    case '.svg': return 'image/svg+xml'
    default: return 'application/octet-stream'
  }
}

const server = http.createServer((req, res) => {
  let filePath = path.join(root, req.url.split('?')[0])
  if (filePath.endsWith(path.sep)) filePath = path.join(filePath, 'index.html')
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html')
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        // fallback to index.html for SPA routing
        fs.readFile(path.join(root, 'index.html'), (e, d) => {
          if (e) {
            res.writeHead(404)
            res.end('Not found')
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.end(d)
          }
        })
      } else {
        res.writeHead(200, { 'Content-Type': contentType(filePath) })
        res.end(data)
      }
    })
  })
})

server.listen(port, () => console.log(`Static server serving ${root} on http://localhost:${port}`))
