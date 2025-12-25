// admin-service/controllers/classController.js
const { Class } = require('../models');
const axios = require('axios');

// --- KONFIGURASI BROADCAST ---
// Daftar service tujuan yang membutuhkan data Kelas
const TARGET_SERVICES = [
    'http://student-service:3003/api/sync/classes',
    'http://teacher-service:3004/api/sync/classes',
    'http://parent-service:3005/api/sync/classes'
];

// Helper: Fungsi untuk mengirim data ke semua service
const broadcastClass = async (action, data) => {
    console.log(`[BROADCAST CLASS] Sending ${action} for Class ID ${data.id}...`);
    
    // Kita gunakan Promise.allSettled agar jika satu gagal, yang lain tetap jalan
    const requests = TARGET_SERVICES.map(url => 
        axios.post(url, { action, data })
            .catch(err => console.error(`[BROADCAST FAIL] ${url}: ${err.message}`))
    );

    await Promise.allSettled(requests);
};

// --- CONTROLLER METHODS ---

exports.createClass = async (req, res) => {
    try {
        const { name, level, capacity } = req.body;
        const newClass = await Class.create({
            name,
            level,
            capacity: capacity || 30
        });

        // Broadcast CREATE ke service lain
        broadcastClass('CREATE', newClass);

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

        // Update data lokal
        await cls.update({ name, level, capacity });

        // Broadcast UPDATE ke service lain (kirim data terbaru)
        broadcastClass('UPDATE', cls);

        res.status(200).json({ message: 'Class updated successfully', data: cls });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteClass = async (req, res) => {
    try {
        const { id } = req.params;
        const cls = await Class.findByPk(id);
        
        if (!cls) return res.status(404).json({ message: 'Class not found' });
        
        // Simpan ID sebelum dihapus untuk broadcast
        const deletedId = cls.id;

        // Hapus lokal
        await cls.destroy();

        // Broadcast DELETE ke service lain
        broadcastClass('DELETE', { id: deletedId });

        res.status(200).json({ message: 'Class deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};