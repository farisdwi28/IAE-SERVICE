const bcrypt = require('bcrypt');
const axios = require('axios');
const { Teacher, sequelize } = require('../models');
const { Op } = require('sequelize');

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// [HELPER] Broadcast Data Guru ke Service Lain
const broadcastToServices = async (action, data) => {
    const services = [
        'http://student-service:3003/api/sync/teachers',
        'http://teacher-service:3004/api/sync/teachers', // Service Guru sendiri
        'http://parent-service:3005/api/sync/teachers'
    ];

    console.log(`[BROADCAST] Sending ${action} for Teacher NIP ${data.nip} to all services...`);

    const syncPromises = services.map(serviceUrl => {
        return axios.post(serviceUrl, {
            action: action, 
            data: data      
        }).catch(err => {
            console.error(`[BROADCAST ERROR] Gagal sync ke ${serviceUrl}:`, err.message);
        });
    });

    await Promise.all(syncPromises);
};

// ==========================================
// CONTROLLER METHODS
// ==========================================

// 1. CREATE TEACHER
exports.createTeacher = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // Sesuaikan dengan Model: hanya ambil nip, name, dan subjectSpecialization
        const { nip, name, subjectSpecialization } = req.body;

        // Validasi NIP
        if (!nip) {
            await t.rollback();
            return res.status(400).json({ message: 'NIP is required' });
        }

        // Cek duplikasi NIP lokal
        const existing = await Teacher.findOne({ where: { nip }, transaction: t });
        if (existing) {
            await t.rollback();
            return res.status(400).json({ message: 'NIP already exists' });
        }

        // 1. Set Password Hardcode
        const password = 'teacher123'; 
        const hashedPassword = bcrypt.hashSync(password, 8);

        // 2. Register Akun ke Auth Service (GraphQL)
        try {
            const authResponse = await axios.post('http://auth-service:3001/graphql', {
                query: `
                    mutation RegisterTeacher($nip: String!, $password: String!, $name: String!) {
                        registerTeacher(nip: $nip, password: $password, name: $name) {
                            id
                            nip
                        }
                    }
                `,
                variables: {
                    nip: nip,
                    password: password, // Kirim 'teacher123'
                    name: name
                }
            });

            if (authResponse.data.errors) {
                throw new Error('Auth Service Error: ' + authResponse.data.errors[0].message);
            }
        } catch (authError) {
            console.error("Auth Service Failed:", authError.message);
            throw new Error('Gagal mendaftarkan akun di Auth Service. Transaksi dibatalkan.');
        }

        // 3. Simpan di Database Admin (Lokal)
        const teacher = await Teacher.create({
            nip,
            name,
            password: hashedPassword,
            subjectSpecialization // Field spesialisasi
        }, { transaction: t });

        // 4. Broadcast 'CREATE' ke Service Lain
        await broadcastToServices('CREATE', teacher.toJSON());

        await t.commit();
        
        res.status(201).json({ 
            message: 'Teacher created successfully', 
            data: { 
                ...teacher.toJSON(), 
                defaultPassword: password 
            } 
        });

    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};

// 2. GET ALL TEACHERS
exports.getAllTeachers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;
        
        const whereClause = {};
        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { nip: { [Op.like]: `%${search}%` } },
                { subjectSpecialization: { [Op.like]: `%${search}%` } }
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

// 3. GET TEACHER BY ID
exports.getTeacherById = async (req, res) => {
    try {
        const teacher = await Teacher.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
        res.status(200).json(teacher);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. UPDATE TEACHER
exports.updateTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        // Hanya update field yang ada di model
        const { name, subjectSpecialization } = req.body;

        const teacher = await Teacher.findByPk(id);
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

        // Update Lokal
        await teacher.update({ 
            name, 
            subjectSpecialization 
        });
        
        // Ambil data terbaru
        const updatedTeacher = await Teacher.findByPk(id);

        // Broadcast 'UPDATE'
        await broadcastToServices('UPDATE', updatedTeacher.toJSON());

        res.status(200).json({ message: 'Teacher updated successfully', data: updatedTeacher });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. DELETE TEACHER
exports.deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const teacher = await Teacher.findByPk(id);
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

        const teacherData = teacher.toJSON();

        // A. Hapus Akun di Auth Service
        console.log(`[AUTH DEBUG] Attempting to delete teacher NIP: ${teacher.nip}`);
        try {
            await axios.post('http://auth-service:3001/graphql', {
                query: `mutation DeleteUser($username: String!) { deleteUser(username: $username) }`,
                variables: { username: teacher.nip }
            });
            console.log(`[AUTH] Deleted user ${teacher.nip} from Auth Service`);
        } catch (authErr) {
            console.warn(`[WARNING] Gagal menghapus akun Auth. Lanjut delete lokal.`);
        }

        // B. Hapus di Database Admin (Lokal)
        await teacher.destroy();

        // C. Broadcast 'DELETE' ke Service Lain
        await broadcastToServices('DELETE', teacherData);

        res.status(200).json({ message: 'Teacher deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};