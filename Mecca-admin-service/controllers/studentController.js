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

// [HELPER UPDATED] Broadcast Data ke Service Lain (Dynamic Endpoint)
const broadcastToServices = async (endpoint, action, data) => {
    const services = [
        'http://student-service:3003',
        'http://teacher-service:3004',
        'http://parent-service:3005'
    ];

    console.log(`[BROADCAST] Sending ${action} to /api/sync/${endpoint}...`);

    const syncPromises = services.map(serviceUrl => {
        return axios.post(`${serviceUrl}/api/sync/${endpoint}`, {
            action: action,
            data: data
        }).catch(err => {
            console.error(`Gagal sync ke ${serviceUrl}:`, err.message);
        });
    });

    await Promise.all(syncPromises);
};

// 1. CREATE STUDENT
exports.createStudent = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { name, dob, parentName, parentContact, parentEmail, address, isCatering } = req.body;

        // A. Auto-generate NIS
        const year = new Date().getFullYear();
        const random = Math.floor(1000 + Math.random() * 9000);
        const nis = `${year}${random}`;

        // B. Generate Password
        const password = generatePassword(dob);
        const hashedPassword = bcrypt.hashSync(password, 8);

        // C. Simpan di Database Admin
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

        // D. Generate Tagihan Awal (Uang Gedung & SPP)
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + 1);

        const fees = await Fee.findAll({ where: { name: ['Uang Gedung', 'SPP'] }, transaction: t });
        
        const createdBills = [];

        for (const fee of fees) {
            const newBill = await Bill.create({
                billNumber: `BILL-${student.nis}-${fee.name.substr(0,3).toUpperCase()}-${Date.now()}`,
                amount: fee.amount,
                status: 'Pending',
                dueDate: dueDate,
                studentId: student.id,
                feeId: fee.id,
                month: currentMonth,
                year: currentYear
            }, { transaction: t });

            createdBills.push(newBill.toJSON());
        }

        // E. Register Akun ke Auth Service (GraphQL)
        try {
            // 1. Register Siswa
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
                    password: password,
                    name: name
                }
            });

            if (authResponse.data.errors) {
                throw new Error('Auth Service Error (Student): ' + authResponse.data.errors[0].message);
            }

            // 2. Register Orang Tua (Jika ada email)
            if (parentEmail) {
                const parentPassword = 'parent123';
                console.log(`[AUTH] Registering Parent account for: ${parentEmail}`);

                const parentAuth = await axios.post('http://auth-service:3001/graphql', {
                    query: `
                        mutation RegisterParent($email: String!, $password: String!, $name: String!) {
                            registerParent(email: $email, password: $password, name: $name) {
                                id
                                email
                            }
                        }
                    `,
                    variables: {
                        email: parentEmail,
                        password: parentPassword,
                        name: parentName || 'Orang Tua'
                    }
                });

                if (parentAuth.data.errors) {
                    console.warn('[AUTH WARN] Parent registration info:', parentAuth.data.errors[0].message);
                } else {
                    console.log('[AUTH SUCCESS] Parent account registered/verified.');
                }
            }
        } catch (authError) {
            console.error("Auth Service Failed:", authError.message);
            // Batalkan transaksi jika gagal buat akun siswa (karena siswa ga bisa login nanti)
            throw new Error('Gagal mendaftarkan akun di Auth Service. Transaksi dibatalkan.');
        }

        // F. Broadcast Data (Setelah Auth sukses, sebelum commit)
        
        // Broadcast Student
        await broadcastToServices('students', 'CREATE', student.toJSON());

        // Broadcast Bills
        if (createdBills.length > 0) {
            await broadcastToServices('bills', 'BULK_CREATE', createdBills);
        }

        await t.commit();
        
        res.status(201).json({ 
            message: 'Student created successfully. Account registered, bills generated, and data synced.', 
            data: { 
                ...student.toJSON(), 
                defaultPassword: password,
                parentDefaultPassword: parentEmail ? 'parent123' : null
            } 
        });

    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};

// 2. GET ALL STUDENTS
exports.getAllStudents = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = search ? { 
            [Op.or]: [
                { name: { [Op.like]: `%${search}%` } },
                { nis: { [Op.like]: `%${search}%` } }
            ] 
        } : {};

        const { count, rows } = await Student.findAndCountAll({
            where: whereClause,
            include: [{ model: Class, attributes: ['name', 'level'] }],
            attributes: { exclude: ['password'] },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({ 
            totalItems: count, 
            totalPages: Math.ceil(count / limit), 
            currentPage: parseInt(page), 
            students: rows 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. GET STUDENT BY ID
exports.getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findByPk(id, {
            include: [{ model: Class, attributes: ['name', 'level'] }],
            attributes: { exclude: ['password'] }
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.status(200).json(student);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. APPROVE STUDENT
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

        await student.update({ isActive: true, classId: assignedClass.id }, { transaction: t });

        // Update tagihan jadi Paid saat approve (Opsional, sesuai kebutuhan)
        await Bill.update(
            { status: 'Paid', paidDate: new Date() },
            { where: { studentId: student.id, status: 'Pending' }, transaction: t }
        );

        // Ambil data terbaru untuk disync (termasuk Class ID baru)
        const updatedStudent = await Student.findByPk(id, { transaction: t });

        // Broadcast UPDATE
        await broadcastToServices('students', 'UPDATE', updatedStudent.toJSON());

        await t.commit();
        res.status(200).json({ message: `Student approved into ${assignedClass.name}`, data: updatedStudent });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};

// 5. UPDATE STUDENT
exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, classId, parentName, parentContact, parentEmail, address, isCatering } = req.body;

        const student = await Student.findByPk(id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        await student.update({ name, classId, parentName, parentContact, parentEmail, address, isCatering });
        
        // Ambil data fresh
        const updatedStudent = await Student.findByPk(id);
        
        await broadcastToServices('students', 'UPDATE', updatedStudent.toJSON());

        res.status(200).json({ message: 'Student updated successfully', data: updatedStudent });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 6. DELETE STUDENT
exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findByPk(id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const studentData = student.toJSON();

        // 1. Hapus Akun di Auth Service
        try {
            // Hapus Akun Siswa (Berdasarkan NIS)
            await axios.post('http://auth-service:3001/graphql', {
                query: `mutation DeleteUser($username: String!) { deleteUser(username: $username) }`,
                variables: { username: student.nis }
            });

            // [BARU] Hapus Akun Orang Tua (Hanya jika tidak ada anak lain yg pakai email ini)
            if (student.parentEmail) {
                // Hitung apakah ada siswa lain dengan email parent yg sama
                const siblingsCount = await Student.count({ 
                    where: { 
                        parentEmail: student.parentEmail,
                        id: { [Op.ne]: id } // Kecuali siswa yang sedang dihapus
                    } 
                });

                if (siblingsCount === 0) {
                    console.log(`[AUTH] Deleting parent account ${student.parentEmail} as no other students are linked.`);
                    await axios.post('http://auth-service:3001/graphql', {
                        query: `mutation DeleteUser($username: String!) { deleteUser(username: $username) }`,
                        variables: { username: student.parentEmail }
                    });
                } else {
                    console.log(`[AUTH] Parent account ${student.parentEmail} preserved (linked to ${siblingsCount} other students).`);
                }
            }

        } catch (authErr) {
            console.warn(`[WARNING] Gagal menghapus akun Auth:`, authErr.message);
        }

        // 2. Hapus di Database Admin
        await student.destroy();
        
        // 3. Broadcast DELETE
        await broadcastToServices('students', 'DELETE', studentData);

        res.status(200).json({ message: 'Student deleted successfully and synced to all services.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 7. PROMOTE STUDENT
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
            const capacity = cls.capacity || 30;
            if (count < capacity) { assignedClass = cls; break; }
        }

        if (!assignedClass) { await t.rollback(); return res.status(400).json({ message: `No classes for level ${nextLevel}` }); }

        await student.update({ classId: assignedClass.id }, { transaction: t });
        
        // Ambil data fresh
        const promotedStudent = await Student.findByPk(id, { transaction: t });

        await broadcastToServices('students', 'UPDATE', promotedStudent.toJSON());

        await t.commit();
        res.status(200).json({ message: `Promoted to ${assignedClass.name}`, data: promotedStudent });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};