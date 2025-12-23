const { Student, Attendance, LibraryBook, LibraryLoan, Bill, Fee, Class, Schedule, Subject, Teacher } = require('../models');
const { Op } = require('sequelize');

// --- Profile ---
exports.getProfile = async (req, res) => {
    try {
        const student = await Student.findByPk(req.user.id, {
            attributes: { exclude: ['password'] },
            include: [{ model: Class, attributes: ['name'] }]
        });
        res.status(200).json(student);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { photo, contact, address } = req.body;
        // Only allow updating specific fields
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

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            attendance: rows
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Grades ---
exports.getGrades = async (req, res) => {
    try {
        const grades = await Grade.findAll({
            where: { studentId: req.user.id },
            include: [{ model: Subject, attributes: ['name'] }]
        });
        res.status(200).json(grades);
    } catch (error) {
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
            include: [
                { model: Subject, attributes: ['name'] },
                { model: Teacher, attributes: ['name'] }
            ],
            order: [['day', 'ASC'], ['startTime', 'ASC']]
        });
        res.status(200).json(schedules);
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

        // Check if already borrowed
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

        // Create Loan
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7); // 1 week loan

        await LibraryLoan.create({
            studentId: req.user.id,
            bookId,
            dueDate: dueDate,
            status: 'Borrowed'
        });

        // Decrease stock
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

        // Increase stock
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
