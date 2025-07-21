const express = require('express');
const app = express();
const PORT = 3000;

const path = require('path');
app.use(express.static(path.join(__dirname, '../client')));

app.use(express.json()); 

app.post('/api/data', (req, res) => {
  console.log('Received data:', req.body);
  res.json({ message: 'Data received successfully!' });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
