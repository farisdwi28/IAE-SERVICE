const { Student, Attendance, LibraryBook, LibraryLoan, Bill, Fee, Class, Schedule, Subject, Teacher, Grade } = require('../models');
const { Op } = require('sequelize');

// --- Profile ---
exports.getProfile = async (req, res) => {
    try {
        const student = await Student.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Manual fetch Class Name
        if (student.classId) {
            const cls = await Class.findByPk(student.classId);
            if (cls) student.setDataValue('ClassName', cls.name);
        }

        res.status(200).json(student);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { photo, contact, address } = req.body;
        await Student.update(
            { photo, contact, address },
            { where: { id: req.user.id } }
        );
        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Attendance ---
exports.getAttendance = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows } = await Attendance.findAndCountAll({
            where: { studentId: req.user.id },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['date', 'DESC']]
        });

        // [BARU] Manual Fetch Nama Mapel via Schedule
        // 1. Ambil semua Schedule ID dari data absen
        const scheduleIds = [...new Set(rows.map(r => r.scheduleId))];
        const schedules = await Schedule.findAll({ where: { id: scheduleIds } });

        // 2. Ambil semua Subject ID dari schedule tadi
        const subjectIds = [...new Set(schedules.map(s => s.subjectId))];
        const subjects = await Subject.findAll({ where: { id: subjectIds } });

        // 3. Buat Peta (Map)
        const subjectMap = {}; // ID -> Nama Mapel
        subjects.forEach(s => subjectMap[s.id] = s.name);

        const scheduleMap = {}; // ScheduleID -> Nama Mapel
        schedules.forEach(s => {
            scheduleMap[s.id] = subjectMap[s.subjectId] || 'Unknown Subject';
        });

        // 4. Masukkan nama mapel ke data attendance
        const enrichedRows = rows.map(r => ({
            ...r.toJSON(),
            subjectName: scheduleMap[r.scheduleId] || 'Kegiatan Lain'
        }));

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            attendance: enrichedRows
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Grades (SUDAH DIPERBAIKI) ---
exports.getGrades = async (req, res) => {
    try {
        // [FIX] Gunakan 'Grade' (Singular, sesuai import di atas)
        const grades = await Grade.findAll({
            where: { studentId: req.user.id }
        });

        if (!grades.length) return res.status(200).json([]);

        // Ambil nama mata pelajaran secara manual (Safe Fetch)
        const subjectIds = [...new Set(grades.map(g => g.subjectId))];
        const subjects = await Subject.findAll({
            where: { id: subjectIds }
        });

        const subjectMap = {};
        subjects.forEach(s => { subjectMap[s.id] = s.name; });

        // Gabungkan data nilai dengan nama mapel
        const result = grades.map(g => ({
            ...g.toJSON(),
            subjectName: subjectMap[g.subjectId] || 'Unknown Subject'
        }));

        res.status(200).json(result);
    } catch (error) {
        console.error("Get Grades Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// --- Schedule ---
exports.getSchedule = async (req, res) => {
    try {
        const student = await Student.findByPk(req.user.id);
        if (!student || !student.classId) {
            return res.status(404).json({ message: 'Class not found for student' });
        }

        const schedules = await Schedule.findAll({
            where: { classId: student.classId },
            order: [['day', 'ASC'], ['startTime', 'ASC']]
        });
        
        // 1. Fetch Data Mapel (Nama & Kode)
        const subjectIds = [...new Set(schedules.map(s => s.subjectId))];
        const subjects = await Subject.findAll({ where: { id: subjectIds } });
        
        const subMap = {}; 
        subjects.forEach(s => {
            subMap[s.id] = { 
                name: s.name, 
                code: s.code // Simpan kode juga
            };
        });

        // 2. Fetch Data Guru
        const teacherIds = [...new Set(schedules.map(s => s.teacherId))];
        const teachers = await Teacher.findAll({ where: { id: teacherIds } });
        const teacherMap = {}; 
        teachers.forEach(t => teacherMap[t.id] = t.name);

        // 3. Gabungkan ke Result
        const result = schedules.map(s => ({
            ...s.toJSON(),
            subjectName: subMap[s.subjectId]?.name || 'Subject',
            subjectCode: subMap[s.subjectId]?.code || '-', // Kirim subjectCode
            teacherName: teacherMap[s.teacherId] || 'Guru Pengampu'
        }));

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Library ---
exports.getMyLoans = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows } = await LibraryLoan.findAndCountAll({
            where: {
                studentId: req.user.id,
                status: 'Borrowed'
            },
            include: [{ model: LibraryBook }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['dueDate', 'ASC']]
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            loans: rows
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllBooks = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { author: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await LibraryBook.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['title', 'ASC']]
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            books: rows
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.borrowBook = async (req, res) => {
    try {
        const { bookId } = req.body;
        const book = await LibraryBook.findByPk(bookId);

        if (!book || book.stock < 1) {
            return res.status(400).json({ message: 'Book not available' });
        }

        const existingLoan = await LibraryLoan.findOne({
            where: {
                studentId: req.user.id,
                bookId,
                status: 'Borrowed'
            }
        });

        if (existingLoan) {
            return res.status(400).json({ message: 'You have already borrowed this book' });
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        await LibraryLoan.create({
            studentId: req.user.id,
            bookId,
            dueDate: dueDate,
            status: 'Borrowed'
        });

        await book.decrement('stock');

        res.status(201).json({ message: 'Book borrowed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.returnBook = async (req, res) => {
    try {
        const { loanId } = req.body;
        const loan = await LibraryLoan.findOne({
            where: {
                id: loanId,
                studentId: req.user.id,
                status: { [Op.ne]: 'Returned' }
            }
        });

        if (!loan) {
            return res.status(404).json({ message: 'Loan record not found or already returned' });
        }

        await loan.update({
            returnDate: new Date(),
            status: 'Returned'
        });

        const book = await LibraryBook.findByPk(loan.bookId);
        await book.increment('stock');

        res.status(200).json({ message: 'Book returned successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Bills ---
exports.getBills = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows } = await Bill.findAndCountAll({
            where: { studentId: req.user.id },
            include: [{ model: Fee, attributes: ['name'] }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            bills: rows
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};