const express = require('express');
const cors = require('cors');
const dns = require('dns');
const url = require('url');
const app = express();

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simpan URL di memory (tidak perlu database)
const urlDatabase = {};
let counter = 1;

// Halaman utama
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// POST - shortener URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // Validasi format URL harus diawali http/https
  let hostname;
  try {
    const parsed = new URL(originalUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return res.json({ error: 'invalid url' });
    }
    hostname = parsed.hostname;
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  // Verifikasi domain dengan dns.lookup
  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Cek apakah URL sudah ada di database
    const existing = Object.entries(urlDatabase).find(
      ([, val]) => val === originalUrl
    );
    if (existing) {
      return res.json({
        original_url: originalUrl,
        short_url: parseInt(existing[0])
      });
    }

    // Simpan URL baru
    const shortUrl = counter++;
    urlDatabase[shortUrl] = originalUrl;

    res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

// GET - redirect ke URL asli
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = req.params.short_url;
  const originalUrl = urlDatabase[shortUrl];

  if (!originalUrl) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  res.redirect(originalUrl);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});