const express = require('express');
const cors = require('cors');
const dns = require('dns');
const app = express();

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {};
let counter = 1;

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
    const existing = Object.entries(urlDatabase).find(
      ([, val]) => val === originalUrl
    );
    if (existing) {
      return res.json({
        original_url: originalUrl,
        short_url: parseInt(existing[0])
      });
    }

    const shortUrl = counter++;
    urlDatabase[shortUrl] = originalUrl;

    console.log('Saved:', shortUrl, '->', originalUrl);
    console.log('Database:', urlDatabase);

    res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url);

  console.log('Looking for:', shortUrl);
  console.log('Database:', urlDatabase);

  const originalUrl = urlDatabase[shortUrl];

  if (!originalUrl) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  res.set('Access-Control-Allow-Origin', '*');
  res.redirect(302, originalUrl);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});