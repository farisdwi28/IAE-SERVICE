const axios = require('axios');
const { Fee } = require('../models');

// [HELPER] Broadcast ke Service Lain (Student & Parent)
const broadcastToServices = async (action, data) => {
    const services = [
        'http://student-service:3003',
        'http://parent-service:3005'
    ];

    console.log(`[BROADCAST FEE] Sending ${action} for Fee: ${data.name}...`);

    const syncPromises = services.map(serviceUrl => {
        return axios.post(`${serviceUrl}/api/sync/fees`, {
            action: action,
            data: data
        }).catch(err => {
            console.error(`Gagal sync Fee ke ${serviceUrl}:`, err.message);
        });
    });

    await Promise.all(syncPromises);
};

exports.createFee = async (req, res) => {
    try {
        const { name, amount, description, type } = req.body;
        const fee = await Fee.create({ name, amount, description, type });
        
        // Broadcast CREATE
        await broadcastToServices('CREATE', fee.toJSON());

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
        
        // Broadcast UPDATE
        await broadcastToServices('UPDATE', fee.toJSON());

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

        // Simpan data sebelum dihapus untuk dikirim ke broadcast
        const data = fee.toJSON();

        await fee.destroy();
        
        // Broadcast DELETE
        await broadcastToServices('DELETE', data);

        res.status(200).json({ message: 'Fee deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};