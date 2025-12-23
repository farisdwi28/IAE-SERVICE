const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Admin, Student, Teacher } = require('../models');
require('dotenv').config();

const generateToken = (user, role) => {
    return jwt.sign({ id: user.id, role: role }, process.env.JWT_SECRET, {
        expiresIn: '24h'
    });
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, student, teacher, parent]
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 */
exports.login = async (req, res) => {
    const { username, password, role } = req.body;

    try {
        let user;
        let token;

        if (role === 'admin') {
            user = await Admin.findOne({ where: { username } });
        } else if (role === 'student') {
            user = await Student.findOne({ where: { nis: username } });
        } else if (role === 'teacher') {
            user = await Teacher.findOne({ where: { nip: username } });
        } else if (role === 'parent') {
            user = await Student.findOne({ where: { nis: username } });
        } else {
            return res.status(400).json({ message: 'Invalid role selected.' });
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);

        if (!passwordIsValid) {
            return res.status(401).json({ accessToken: null, message: 'Invalid Password!' });
        }

        const assignedRole = role === 'parent' ? 'parent' : role;
        token = generateToken(user, assignedRole);

        res.status(200).json({
            user: {
                id: user.id,
                username: username,
                name: user.name,
                role: assignedRole
            },
            token: token
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @swagger
 * /api/auth/register-admin:
 *   post:
 *     summary: Register new admin
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - name
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin registered successfully
 */
exports.registerAdmin = async (req, res) => {
    try {
        const { username, password, name } = req.body;
        const hashedPassword = bcrypt.hashSync(password, 8);

        const admin = await Admin.create({
            username,
            password: hashedPassword,
            name
        });

        res.status(201).json({ message: 'Admin registered successfully!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
