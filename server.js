const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');
const http = require('http');

const app = express();
const PROTOCOL = (process.env.PROTOCOL || 'http').toLowerCase();
const PORT = PROTOCOL === 'https' ? 3091 : 3090;

// Ensure files directory exists
const filesDir = path.join(__dirname, 'files');
if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir, { recursive: true });
}

// Generate unique filename
function generateUniqueFilename(originalName) {
  const ext = path.extname(originalName);
  const uniqueId = crypto.randomUUID();
  return `${uniqueId}${ext}`;
}

// Get filename from URL
function getFilenameFromUrl(url) {
  const urlPath = new URL(url).pathname;
  const filename = path.basename(urlPath);
  return filename || 'downloaded_file';
}

// Download file from URL
function downloadFromUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Handle redirects
        return downloadFromUrl(response.headers.location).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download: ${response.statusCode}`));
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, filesDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = generateUniqueFilename(file.originalname);
    req.savedFilename = uniqueFilename;
    req.originalFilename = file.originalname;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ storage });

// Parse JSON body
app.use(express.json());

// POST /upload - Upload a file (binary or URL)
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // Handle URL upload
    if (req.body && req.body.url) {
      const url = req.body.url;
      const originalFilename = getFilenameFromUrl(url);
      const savedFilename = generateUniqueFilename(originalFilename);
      const filepath = path.join(filesDir, savedFilename);

      const fileBuffer = await downloadFromUrl(url);
      fs.writeFileSync(filepath, fileBuffer);

      const stats = fs.statSync(filepath);

      return res.json({
        success: true,
        message: 'File uploaded successfully',
        originalFilename: originalFilename,
        savedFilename: savedFilename,
        size: stats.size,
        downloadUrl: `${PROTOCOL}://hongyver.iptime.org:${PORT}/files/${savedFilename}`,
        viewUrl: `${PROTOCOL}://hongyver.iptime.org:${PORT}/view/${savedFilename}`
      });
    }

    // Handle binary file upload
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file or URL provided' });
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      originalFilename: req.originalFilename,
      savedFilename: req.savedFilename,
      size: req.file.size,
      downloadUrl: `${PROTOCOL}://hongyver.iptime.org:${PORT}/files/${req.savedFilename}`,
      viewUrl: `${PROTOCOL}://hongyver.iptime.org:${PORT}/view/${req.savedFilename}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /files/:filename - Download a file
app.get('/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(filesDir, filename);

  // Prevent directory traversal
  if (!filepath.startsWith(filesDir)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.download(filepath);
});

// GET /view/:filename - View a file inline (no download)
app.get('/view/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(filesDir, filename);

  // Prevent directory traversal
  if (!filepath.startsWith(filesDir)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.sendFile(filepath);
});

app.listen(PORT, () => {
  console.log(`File server running on port ${PORT}`);
});
