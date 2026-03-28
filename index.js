const express = require('express');
const cors = require('cors');
const dns = require('dns');
const Datastore = require('nedb');
const app = express();

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database tersimpan ke file db.json secara otomatis
const db = new Datastore({ filename: 'db.json', autoload: true });

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

    // Cek apakah URL sudah ada
    db.findOne({ original_url: originalUrl }, (err, doc) => {
      if (doc) {
        return res.json({
          original_url: doc.original_url,
          short_url: doc.short_url
        });
      }

      // Hitung jumlah dokumen untuk counter
      db.count({}, (err, count) => {
        const shortUrl = count + 1;

        db.insert({ original_url: originalUrl, short_url: shortUrl }, (err, newDoc) => {
          res.json({
            original_url: newDoc.original_url,
            short_url: newDoc.short_url
          });
        });
      });
    });
  });
});

app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url);

  db.findOne({ short_url: shortUrl }, (err, doc) => {
    if (!doc) {
      return res.json({ error: 'No short URL found for the given input' });
    }
    res.redirect(doc.original_url);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});