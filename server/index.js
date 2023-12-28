// Pada file index.js atau server Anda
const express = require('express');
const app = express();
const port = 5050; // Ganti sesuai kebutuhan

app.get('/products', async (req, res) => {
    try {
      const products = await db.collection('products').find().toArray();
      console.log(products); // Tambahkan baris ini
      res.json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  app.get('/products', async (req, res) => {
    try {
      const products = await db.collection('products').find().toArray();
      console.log(products); // Tambahkan log ini
      res.json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message }); // Ubah pesan error menjadi lebih spesifik
    }
  });
  


// Server mendengarkan pada port yang telah ditentukan
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
