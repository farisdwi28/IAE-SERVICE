const bcrypt = require('bcrypt');
const { Teacher } = require('../models');
const { Op } = require('sequelize');

exports.createTeacher = async (req, res) => {
    try {
        const { name, nip, subjectSpecialization } = req.body;

        // Default password
        const password = 'teacher123'; // Should be random or based on policy
        const hashedPassword = bcrypt.hashSync(password, 8);

        const teacher = await Teacher.create({
            nip,
            name,
            password: hashedPassword,
            subjectSpecialization
        });

        res.status(201).json({ message: 'Teacher created successfully', data: { ...teacher.toJSON(), defaultPassword: password } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllTeachers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { nip: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Teacher.findAndCountAll({
            where: whereClause,
            attributes: { exclude: ['password'] },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            teachers: rows
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, subjectSpecialization } = req.body;

        const teacher = await Teacher.findByPk(id);
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

        await teacher.update({ name, subjectSpecialization });
        res.status(200).json({ message: 'Teacher updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const teacher = await Teacher.findByPk(id);
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

        await teacher.destroy();
        res.status(200).json({ message: 'Teacher deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
