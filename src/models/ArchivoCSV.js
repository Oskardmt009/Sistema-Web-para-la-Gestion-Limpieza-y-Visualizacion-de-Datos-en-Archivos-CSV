const mongoose = require('mongoose');

const archivoCSVSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    nombreOriginal: {
        type: String,
        required: true
    },
    rutaArchivo: {
        type: String,
        required: true
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    totalFilas: {
        type: Number,
        default: 0
    },
    columnas: {
        type: [String],
        default: []
    },
    filasEliminadasDuplicadas: {
        type: Number,
        default: 0
    },
    filasEliminadasVacias: {
        type: Number,
        default: 0
    },
    yaLimpiado: {
        type: Boolean,
        default: false
    },
    fechaSubida: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ArchivoCSV', archivoCSVSchema);
