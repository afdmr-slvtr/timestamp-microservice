const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.static('public'));

// Route utama
app.get('/api/:date?', (req, res) => {
  const dateParam = req.params.date;

  // Jika parameter kosong → kembalikan waktu sekarang
  if (!dateParam) {
    const now = new Date();
    return res.json({
      unix: now.getTime(),
      utc: now.toUTCString()
    });
  }

  // Cek apakah parameter adalah Unix timestamp (angka semua)
  const isUnix = /^\d+$/.test(dateParam);
  const date = isUnix ? new Date(parseInt(dateParam)) : new Date(dateParam);

  // Jika tanggal tidak valid
  if (isNaN(date.getTime())) {
    return res.json({ error: "Invalid Date" });
  }

  // Kembalikan unix dan utc
  res.json({
    unix: date.getTime(),
    utc: date.toUTCString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});