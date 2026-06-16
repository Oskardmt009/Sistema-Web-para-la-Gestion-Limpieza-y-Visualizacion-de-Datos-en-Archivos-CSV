const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const csvRoutes = require('./routes/csvRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/csv', csvRoutes);

// Manejo de errores de multer
app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ mensaje: 'El archivo supera el tamaño máximo de 5 MB.' });
    }
    res.status(500).json({ mensaje: err.message });
});

module.exports = app;
