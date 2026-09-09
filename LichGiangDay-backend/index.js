const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('LichGiangDay Backend is running!');
});

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  try {
    const connection = await db.getConnection();
    console.log('✅ Successfully connected to the Aiven MySQL database!');
    connection.release();
  } catch (error) {
    console.error('❌ Failed to connect to the database:', error.message);
  }
});
