const { Fee } = require('../models');

exports.createFee = async (req, res) => {
    try {
        const { name, amount, description, type } = req.body;
        const fee = await Fee.create({ name, amount, description, type });
        res.status(201).json(fee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllFees = async (req, res) => {
    try {
        const fees = await Fee.findAll();
        res.status(200).json(fees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateFee = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, description } = req.body;
        const fee = await Fee.findByPk(id);

        if (!fee) return res.status(404).json({ message: 'Fee not found' });

        await fee.update({ amount, description });
        res.status(200).json({ message: 'Fee updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteFee = async (req, res) => {
    try {
        const { id } = req.params;
        const fee = await Fee.findByPk(id);
        if (!fee) return res.status(404).json({ message: 'Fee not found' });
        await fee.destroy();
        res.status(200).json({ message: 'Fee deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
