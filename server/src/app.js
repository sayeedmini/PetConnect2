const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const vetRoutes = require('./routes/vetRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('PetConnect API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/vets', vetRoutes);

module.exports = app;