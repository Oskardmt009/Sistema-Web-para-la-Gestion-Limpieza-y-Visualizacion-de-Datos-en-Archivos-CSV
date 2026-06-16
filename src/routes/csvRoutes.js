const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verificarToken } = require('../middlewares/authMiddleware');
const {
    subirArchivo,
    listarArchivos,
    obtenerDatos,
    limpiarArchivo,
    eliminarArchivo
} = require('../controllers/csvController');

// Configuración de multer: guardar archivos en /uploads con nombre único
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(process.cwd(), 'uploads'));
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
        cb(null, unique + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos CSV'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB máximo
});

// Todas las rutas requieren token JWT
router.post('/upload', verificarToken, upload.single('archivo'), subirArchivo);
router.get('/', verificarToken, listarArchivos);
router.get('/:id/datos', verificarToken, obtenerDatos);
router.post('/:id/limpiar', verificarToken, limpiarArchivo);
router.delete('/:id', verificarToken, eliminarArchivo);

module.exports = router;
