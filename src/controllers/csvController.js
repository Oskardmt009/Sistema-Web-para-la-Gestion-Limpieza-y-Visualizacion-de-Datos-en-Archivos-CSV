const path = require('path');
const fs = require('fs');
const Papa = require('papaparse');
const ArchivoCSV = require('../models/ArchivoCSV');

// POST /api/csv/upload
const subirArchivo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ mensaje: 'No se recibió ningún archivo.' });
        }

        // Leer y parsear el CSV para extraer metadatos
        const contenido = fs.readFileSync(req.file.path, 'utf8');
        const resultado = Papa.parse(contenido, { header: true, skipEmptyLines: true });

        if (resultado.errors.length > 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ mensaje: 'El archivo CSV tiene errores de formato.' });
        }

        const columnas = resultado.meta.fields || [];
        const totalFilas = resultado.data.length;

        const archivo = new ArchivoCSV({
            nombre: req.file.originalname.replace('.csv', ''),
            nombreOriginal: req.file.originalname,
            rutaArchivo: req.file.path,
            usuario: req.usuario.id,
            totalFilas,
            columnas
        });

        await archivo.save();

        res.status(201).json({
            mensaje: 'Archivo subido correctamente',
            archivo: {
                id: archivo._id,
                nombre: archivo.nombre,
                totalFilas,
                columnas,
                fechaSubida: archivo.fechaSubida
            }
        });

    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

// GET /api/csv
const listarArchivos = async (req, res) => {
    try {
        const archivos = await ArchivoCSV.find({ usuario: req.usuario.id })
            .select('nombre nombreOriginal totalFilas columnas yaLimpiado fechaSubida')
            .sort({ fechaSubida: -1 });

        res.json({ archivos });

    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

// GET /api/csv/:id/datos
const obtenerDatos = async (req, res) => {
    try {
        const archivo = await ArchivoCSV.findOne({ _id: req.params.id, usuario: req.usuario.id });

        if (!archivo) {
            return res.status(404).json({ mensaje: 'Archivo no encontrado.' });
        }

        if (!fs.existsSync(archivo.rutaArchivo)) {
            return res.status(404).json({ mensaje: 'El archivo físico no existe en el servidor.' });
        }

        const contenido = fs.readFileSync(archivo.rutaArchivo, 'utf8');
        const resultado = Papa.parse(contenido, { header: true, skipEmptyLines: true });

        res.json({
            nombre: archivo.nombre,
            columnas: resultado.meta.fields,
            datos: resultado.data,
            totalFilas: resultado.data.length,
            yaLimpiado: archivo.yaLimpiado
        });

    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

// POST /api/csv/:id/limpiar
const limpiarArchivo = async (req, res) => {
    try {
        const archivo = await ArchivoCSV.findOne({ _id: req.params.id, usuario: req.usuario.id });

        if (!archivo) {
            return res.status(404).json({ mensaje: 'Archivo no encontrado.' });
        }

        if (!fs.existsSync(archivo.rutaArchivo)) {
            return res.status(404).json({ mensaje: 'El archivo físico no existe en el servidor.' });
        }

        const contenido = fs.readFileSync(archivo.rutaArchivo, 'utf8');
        const resultado = Papa.parse(contenido, { header: true, skipEmptyLines: false });

        const filasTotalesAntes = resultado.data.length;

        // 1. Eliminar filas completamente vacías
        const sinVacias = resultado.data.filter(fila => {
            return Object.values(fila).some(v => v !== null && v !== undefined && v.toString().trim() !== '');
        });
        const filasEliminadasVacias = filasTotalesAntes - sinVacias.length;

        // 2. Eliminar duplicados (comparación por JSON para detectar filas idénticas)
        const vistos = new Set();
        const sinDuplicados = sinVacias.filter(fila => {
            const clave = JSON.stringify(fila);
            if (vistos.has(clave)) return false;
            vistos.add(clave);
            return true;
        });
        const filasEliminadasDuplicadas = sinVacias.length - sinDuplicados.length;

        // 3. Guardar el CSV limpio sobreescribiendo el archivo
        const csvLimpio = Papa.unparse(sinDuplicados);
        fs.writeFileSync(archivo.rutaArchivo, csvLimpio, 'utf8');

        // 4. Actualizar metadatos en MongoDB
        archivo.totalFilas = sinDuplicados.length;
        archivo.filasEliminadasDuplicadas = filasEliminadasDuplicadas;
        archivo.filasEliminadasVacias = filasEliminadasVacias;
        archivo.yaLimpiado = true;
        await archivo.save();

        res.json({
            mensaje: 'Limpieza completada',
            resumen: {
                filasAntes: filasTotalesAntes,
                filasEliminadasVacias,
                filasEliminadasDuplicadas,
                filasDespues: sinDuplicados.length
            }
        });

    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

// DELETE /api/csv/:id
const eliminarArchivo = async (req, res) => {
    try {
        const archivo = await ArchivoCSV.findOne({ _id: req.params.id, usuario: req.usuario.id });

        if (!archivo) {
            return res.status(404).json({ mensaje: 'Archivo no encontrado.' });
        }

        // Eliminar el archivo físico si existe
        if (fs.existsSync(archivo.rutaArchivo)) {
            fs.unlinkSync(archivo.rutaArchivo);
        }

        await ArchivoCSV.deleteOne({ _id: req.params.id });

        res.json({ mensaje: 'Archivo eliminado correctamente' });

    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

module.exports = { subirArchivo, listarArchivos, obtenerDatos, limpiarArchivo, eliminarArchivo };
