const { Class } = require('../models');

exports.createClass = async (req, res) => {
    try {
        const { name, level, capacity } = req.body;
        const newClass = await Class.create({
            name,
            level,
            capacity: capacity || 30
        });
        res.status(201).json(newClass);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllClasses = async (req, res) => {
    try {
        const classes = await Class.findAll();
        res.status(200).json(classes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, level, capacity } = req.body;
        const cls = await Class.findByPk(id);
        if (!cls) return res.status(404).json({ message: 'Class not found' });

        await cls.update({ name, level, capacity });
        res.status(200).json({ message: 'Class updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteClass = async (req, res) => {
    try {
        const { id } = req.params;
        const cls = await Class.findByPk(id);
        if (!cls) return res.status(404).json({ message: 'Class not found' });
        await cls.destroy();
        res.status(200).json({ message: 'Class deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
