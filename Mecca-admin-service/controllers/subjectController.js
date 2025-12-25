const { Subject } = require('../models');
const axios = require('axios');
const { Op } = require('sequelize');

// ==========================================
// HELPER: BROADCAST SYNC
// ==========================================
// Fungsi ini bertugas mengirim data ke service lain
const broadcastSubject = async (action, data) => {
    const services = [
        'http://student-service:3003/api/sync/subjects',
        'http://teacher-service:3004/api/sync/subjects',
        'http://parent-service:3005/api/sync/subjects'
    ];

    console.log(`[BROADCAST] Sending ${action} for Subject ${data.name} (${data.code})...`);

    // Kirim request secara paralel
    const requests = services.map(url => 
        axios.post(url, { action, data })
            .catch(err => console.error(`[BROADCAST FAIL] ${url}: ${err.message}`))
    );

    await Promise.all(requests);
};

// ==========================================
// CONTROLLER METHODS
// ==========================================

exports.createSubject = async (req, res) => {
    try {
        const { name, code, level } = req.body;

        // 1. Validasi Input
        if (!name || !code || !level) {
            return res.status(400).json({ message: 'Name, Code, and Level are required' });
        }

        // 2. Cek apakah Kode Mapel sudah ada (untuk mencegah Error 500 Sequelize)
        const existing = await Subject.findOne({ where: { code } });
        if (existing) {
            return res.status(400).json({ message: 'Subject code must be unique' });
        }

        // 3. Simpan ke Database
        const subject = await Subject.create({ name, code, level });

        // 4. [PENTING] Broadcast ke Service Lain
        await broadcastSubject('CREATE', subject.toJSON());

        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllSubjects = async (req, res) => {
    try {
        // Fitur tambahan: Pagination & Search (opsional tapi sangat berguna)
        const { page = 1, limit = 10, search = '', level } = req.query;
        const offset = (page - 1) * limit;
        
        const whereClause = {};

        // Jika ada search param, cari berdasarkan nama atau kode
        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { code: { [Op.like]: `%${search}%` } }
            ];
        }

        // Jika ada filter level
        if (level) {
            whereClause.level = level;
        }

        const { count, rows } = await Subject.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['level', 'ASC'], ['name', 'ASC']]
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            subjects: rows
        });
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

        // Cek jika kode diubah, pastikan tidak bentrok dengan mapel lain
        if (code && code !== subject.code) {
            const existing = await Subject.findOne({ where: { code } });
            if (existing) return res.status(400).json({ message: 'Subject code already exists' });
        }

        // Update lokal
        await subject.update({ name, code, level });

        // [PENTING] Broadcast Update
        await broadcastSubject('UPDATE', subject.toJSON());

        res.status(200).json({ message: 'Subject updated successfully', data: subject });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await Subject.findByPk(id);
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        // Simpan data snapshot sebelum dihapus
        const subjectData = subject.toJSON();

        // Hapus lokal
        await subject.destroy();

        // [PENTING] Broadcast Delete
        await broadcastSubject('DELETE', subjectData);

        res.status(200).json({ message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};