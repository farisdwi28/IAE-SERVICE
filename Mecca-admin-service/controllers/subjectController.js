const { Subject } = require('../models');

exports.createSubject = async (req, res) => {
    try {
        const { name, code, level } = req.body;
        const subject = await Subject.create({ name, code, level });
        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllSubjects = async (req, res) => {
    try {
        const subjects = await Subject.findAll();
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, level } = req.body;
        const subject = await Subject.findByPk(id);
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        await subject.update({ name, code, level });
        res.status(200).json({ message: 'Subject updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await Subject.findByPk(id);
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        await subject.destroy();
        res.status(200).json({ message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
