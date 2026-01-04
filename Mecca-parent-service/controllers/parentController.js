const { Student, Attendance, Schedule, Bill, Fee, Class, Subject, LibraryLoan, LibraryBook } = require('../models');

// Since Parent logs in with Student credentials, req.user.id is the Student ID.

exports.getStudentData = async (req, res) => {
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

exports.getSchedule = async (req, res) => {
    try {
        const student = await Student.findByPk(req.user.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const schedule = await Schedule.findAll({
            where: { classId: student.classId },
            include: [{ model: Subject, attributes: ['name'] }]
        });
        res.status(200).json(schedule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

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

exports.getLibraryLoans = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows } = await LibraryLoan.findAndCountAll({
            where: { studentId: req.user.id },
            include: [{ model: LibraryBook, attributes: ['title', 'author'] }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['loanDate', 'DESC']]
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

exports.uploadPaymentProof = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const proofUrl = `/uploads/${req.file.filename}`; // Relative path to be served statically

        const student = await Student.findByPk(req.user.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        await student.update({ paymentProof: proofUrl });
        res.status(200).json({ message: 'Payment proof uploaded successfully', proofUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.toggleCatering = async (req, res) => {
    try {
        const { isCatering } = req.body; // boolean

        const student = await Student.findByPk(req.user.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        await student.update({ isCatering });

        if (isCatering) {
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();

            const cateringFee = await Fee.findOne({ where: { name: 'Katering' } }); // Assuming name is 'Katering'

            if (cateringFee) {
                const existingBill = await Bill.findOne({
                    where: {
                        studentId: student.id,
                        feeId: cateringFee.id,
                        month: currentMonth,
                        year: currentYear
                    }
                });

                if (!existingBill) {
                    const dueDate = new Date();
                    dueDate.setMonth(dueDate.getMonth() + 1);

                    await Bill.create({
                        billNumber: `BILL-${student.nis}-CAT-${currentMonth}-${currentYear}`,
                        amount: cateringFee.amount,
                        status: 'Pending',
                        dueDate: dueDate,
                        studentId: student.id,
                        feeId: cateringFee.id,
                        month: currentMonth,
                        year: currentYear
                    });
                }
            }
        }

        res.status(200).json({ message: `Catering status updated to ${isCatering}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- [BARU] Grades (Nilai) ---
exports.getGrades = async (req, res) => {
    try {
        const grades = await Grade.findAll({
            where: { studentId: req.user.id }
        });

        if (!grades.length) return res.status(200).json([]);

        // Manual Fetch Subject Name
        const subjectIds = [...new Set(grades.map(g => g.subjectId))];
        const subjects = await Subject.findAll({ where: { id: subjectIds } });
        
        const subjectMap = {};
        subjects.forEach(s => { subjectMap[s.id] = s.name; });

        const result = grades.map(g => ({
            ...g.toJSON(),
            subjectName: subjectMap[g.subjectId] || 'Unknown Subject'
        }));

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
