const express = require('express');
const cors = require('cors');
const dns = require('dns');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simpan ke file agar tidak hilang saat restart
const DB_FILE = path.join(__dirname, 'urls.json');

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) {}
  return { urls: {}, counter: 1 };
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db));
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;
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

  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    const db = loadDB();

    // Cek apakah URL sudah ada
    const existing = Object.entries(db.urls).find(([, val]) => val === originalUrl);
    if (existing) {
      return res.json({
        original_url: originalUrl,
        short_url: parseInt(existing[0])
      });
    }

    // Simpan URL baru
    const shortUrl = db.counter;
    db.urls[shortUrl] = originalUrl;
    db.counter++;
    saveDB(db);

    res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url);
  const db = loadDB();
  const originalUrl = db.urls[shortUrl];

  if (!originalUrl) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  res.redirect(originalUrl);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});