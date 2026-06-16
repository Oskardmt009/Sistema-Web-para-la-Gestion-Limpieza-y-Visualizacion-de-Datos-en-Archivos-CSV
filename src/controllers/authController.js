const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { nombre, correo, password } = req.body;

        if (!nombre || !correo || !password) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
        }

        const existeUsuario = await Usuario.findOne({ correo });
        if (existeUsuario) {
            return res.status(400).json({ mensaje: 'El correo ya está registrado' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const usuario = new Usuario({ nombre, correo, password: passwordHash });
        await usuario.save();

        res.status(201).json({ mensaje: 'Usuario registrado correctamente' });

    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { correo, password } = req.body;

        if (!correo || !password) {
            return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios' });
        }

        const usuario = await Usuario.findOne({ correo });
        if (!usuario) {
            return res.status(400).json({ mensaje: 'Credenciales incorrectas' });
        }

        const passwordValido = await bcrypt.compare(password, usuario.password);
        if (!passwordValido) {
            return res.status(400).json({ mensaje: 'Credenciales incorrectas' });
        }

        // Generar JWT
        const token = jwt.sign(
            { id: usuario._id, nombre: usuario.nombre, correo: usuario.correo },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            mensaje: 'Login exitoso',
            token,
            nombre: usuario.nombre
        });

    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

module.exports = { register, login };
