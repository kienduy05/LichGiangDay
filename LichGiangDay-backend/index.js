const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

app.get('/', (req, res) => {
  res.send('LichGiangDay Backend is running!');
});

// Routes
app.use('/', require('./src/routes'));


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
