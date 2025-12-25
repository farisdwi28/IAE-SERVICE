const bcrypt = require('bcrypt');
const axios = require('axios');
const { Student, Class, Fee, Bill, sequelize } = require('../models');
const { Op } = require('sequelize');

// --- Helper Functions ---
const generatePassword = (dob) => {
    if (dob) {
        return dob.split('-').reverse().join('');
    }
    return Math.random().toString(36).slice(-8);
};

// [HELPER] Broadcast Data ke Service Lain (Student, Teacher, Parent)
const broadcastToServices = async (action, data) => {
    const services = [
        'http://student-service:3003',
        'http://teacher-service:3004',
        'http://parent-service:3005'
    ];

    console.log(`[BROADCAST] Sending ${action} for Student ID ${data.id} to all services...`);

    const syncPromises = services.map(serviceUrl => {
        return axios.post(`${serviceUrl}/api/sync/students`, {
            action: action, // 'CREATE', 'UPDATE', atau 'DELETE'
            data: data      // Data lengkap siswa
        }).catch(err => {
            // Log error agar terlihat di terminal Docker jika ada service yang gagal
            console.error(`[BROADCAST ERROR] Gagal sync ke ${serviceUrl}:`, err.message);
        });
    });

    await Promise.all(syncPromises);
};

exports.createStudent = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { name, dob, parentName, parentContact, parentEmail, address, isCatering } = req.body;

        // 1. Auto-generate NIS
        const year = new Date().getFullYear();
        const random = Math.floor(1000 + Math.random() * 9000);
        const nis = `${year}${random}`;

        // 2. Generate Password
        const password = generatePassword(dob);
        const hashedPassword = bcrypt.hashSync(password, 8);

        // 3. Simpan di Database Admin
        const student = await Student.create({
            nis,
            name,
            password: hashedPassword,
            classId: null,
            parentName,
            parentContact,
            parentEmail,
            address,
            isCatering,
            isActive: false
        }, { transaction: t });

        // 4. Generate Tagihan Awal (Uang Gedung & SPP)
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + 1);

        const fees = await Fee.findAll({ where: { name: ['Uang Gedung', 'SPP'] }, transaction: t });
        
        for (const fee of fees) {
            await Bill.create({
                billNumber: `BILL-${student.nis}-${fee.name.substr(0,3).toUpperCase()}-${Date.now()}`,
                amount: fee.amount,
                status: 'Pending',
                dueDate: dueDate,
                studentId: student.id,
                feeId: fee.id,
                month: currentMonth,
                year: currentYear
            }, { transaction: t });
        }

        // 5. [INTEGRASI] Register Akun ke Auth Service
        try {
            const authResponse = await axios.post('http://auth-service:3001/graphql', {
                query: `
                    mutation RegisterStudent($nis: String!, $password: String!, $name: String!) {
                        registerStudent(nis: $nis, password: $password, name: $name) {
                            id
                            nis
                        }
                    }
                `,
                variables: {
                    nis: nis,
                    password: password, // Kirim password mentah
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

        // 6. [BARU] Broadcast 'CREATE' ke Service Lain
        await broadcastToServices('CREATE', student.toJSON());

        await t.commit();
        
        res.status(201).json({ 
            message: 'Student created successfully. Account registered, bills generated, and synced.', 
            data: { 
                ...student.toJSON(), 
                defaultPassword: password 
            } 
        });

    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};

exports.approveStudent = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { level } = req.body;

        const student = await Student.findByPk(id, { transaction: t });
        if (!student) {
            await t.rollback();
            return res.status(404).json({ message: 'Student not found' });
        }
        if (student.isActive) {
            await t.rollback();
            return res.status(400).json({ message: 'Student is already active' });
        }

        // Cari Kelas yang tersedia
        const classes = await Class.findAll({ where: { level }, transaction: t, lock: true });
        let assignedClass = null;
        
        for (const cls of classes) {
            const count = await Student.count({ where: { classId: cls.id, isActive: true }, transaction: t });
            const capacity = cls.capacity || 30;
            if (count < capacity) {
                assignedClass = cls;
                break;
            }
        }

        if (!assignedClass) {
            await t.rollback();
            return res.status(400).json({ message: `No available classes for level ${level}.` });
        }

        // Update status siswa
        await student.update({
            isActive: true,
            classId: assignedClass.id
        }, { transaction: t });

        // Update tagihan awal jadi Paid
        await Bill.update(
            { status: 'Paid', paidDate: new Date() },
            { where: { studentId: student.id, status: 'Pending' }, transaction: t }
        );

        // [BARU] Broadcast 'UPDATE' ke Service Lain (agar mereka tau siswa sudah aktif & punya kelas)
        await broadcastToServices('UPDATE', student.toJSON());

        await t.commit();
        res.status(200).json({ message: `Student approved into ${assignedClass.name}`, data: student });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, classId, parentName, parentContact, parentEmail, address, isCatering } = req.body;

        const student = await Student.findByPk(id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        await student.update({ name, classId, parentName, parentContact, parentEmail, address, isCatering });
        
        // [BARU] Broadcast 'UPDATE' data diri
        await broadcastToServices('UPDATE', student.toJSON());

        res.status(200).json({ message: 'Student updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findByPk(id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Simpan data ID sebelum dihapus untuk dikirim ke broadcast
        const studentData = student.toJSON();

        // 1. [BARU] Hapus Akun di Auth Service
        // Note: Pastikan Auth Service memiliki mutation 'deleteUser' atau 'deleteStudent'
        try {
            await axios.post('http://auth-service:3001/graphql', {
                query: `
                    mutation DeleteUser($username: String!) {
                        deleteUser(username: $username)
                    }
                `,
                variables: { username: student.nis }
            });
        } catch (authErr) {
            // Kita log error tapi tetap lanjut menghapus data di Admin agar tidak stuck
            console.warn(`[WARNING] Gagal menghapus akun Auth untuk NIS ${student.nis}. Lanjut delete lokal.`);
        }

        // 2. Hapus di Database Admin
        await student.destroy();
        
        // 3. Broadcast 'DELETE' ke service lain
        // Ini yang akan menghapus data di database Student, Teacher, dan Parent
        await broadcastToServices('DELETE', studentData);

        res.status(200).json({ message: 'Student deleted successfully and synced to all services.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.promoteStudent = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const student = await Student.findByPk(id, { include: [Class], transaction: t });

        if (!student) { await t.rollback(); return res.status(404).json({ message: 'Student not found' }); }
        if (!student.Class) { await t.rollback(); return res.status(400).json({ message: 'No class assigned' }); }

        const nextLevel = student.Class.level + 1;
        const classes = await Class.findAll({ where: { level: nextLevel }, transaction: t, lock: true });
        
        let assignedClass = null;
        for (const cls of classes) {
            const count = await Student.count({ where: { classId: cls.id, isActive: true }, transaction: t });
            if (count < (cls.capacity || 30)) { assignedClass = cls; break; }
        }

        if (!assignedClass) { await t.rollback(); return res.status(400).json({ message: `No classes for level ${nextLevel}` }); }

        await student.update({ classId: assignedClass.id }, { transaction: t });
        
        // [BARU] Broadcast 'UPDATE' kenaikan kelas
        await broadcastToServices('UPDATE', student.toJSON());

        await t.commit();
        res.status(200).json({ message: `Promoted to ${assignedClass.name}` });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};

exports.getAllStudents = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;
        const whereClause = search ? { [Op.or]: [{ name: { [Op.like]: `%${search}%` } }, { nis: { [Op.like]: `%${search}%` } }] } : {};

        const { count, rows } = await Student.findAndCountAll({
            where: whereClause,
            include: [{ model: Class, attributes: ['name'] }],
            attributes: { exclude: ['password'] },
            limit: parseInt(limit), offset: parseInt(offset), order: [['createdAt', 'DESC']]
        });

        res.status(200).json({ totalItems: count, totalPages: Math.ceil(count / limit), currentPage: parseInt(page), students: rows });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, classId, parentName, parentContact, parentEmail, address, isCatering } = req.body;

        const student = await Student.findByPk(id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        await student.update({ name, classId, parentName, parentContact, parentEmail, address, isCatering });
        
        // [OPSIONAL] Broadcast Update (Jika ingin nama/data diri terupdate real-time di service lain)
        // await broadcastToServices('UPDATE', student.toJSON());

        res.status(200).json({ message: 'Student updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findByPk(id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        await student.destroy();
        // [OPSIONAL] Broadcast DELETE jika perlu
        
        res.status(200).json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.promoteStudent = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const student = await Student.findByPk(id, { include: [Class], transaction: t });

        if (!student) {
            await t.rollback();
            return res.status(404).json({ message: 'Student not found' });
        }
        if (!student.Class) {
            await t.rollback();
            return res.status(400).json({ message: 'Student is not assigned to any class' });
        }

        const currentLevel = student.Class.level;
        const nextLevel = currentLevel + 1;

        const classes = await Class.findAll({
            where: { level: nextLevel },
            transaction: t,
            lock: true
        });

        let assignedClass = null;
        for (const cls of classes) {
            const count = await Student.count({
                where: { classId: cls.id, isActive: true },
                transaction: t
            });
            
            const capacity = cls.capacity || 30;

            if (count < capacity) {
                assignedClass = cls;
                break;
            }
        }

        if (!assignedClass) {
            await t.rollback();
            return res.status(400).json({ message: `No available classes for level ${nextLevel}. Please create a new class.` });
        }

        await student.update({ classId: assignedClass.id }, { transaction: t });
        
        // [BARU] Broadcast Update kenaikan kelas
        await broadcastToServices('UPDATE', student.toJSON());

        await t.commit();

        res.status(200).json({ message: `Student promoted to class ${assignedClass.name}` });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};