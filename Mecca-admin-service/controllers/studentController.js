const bcrypt = require('bcrypt');
const { Student, Class, Fee, Bill, sequelize } = require('../models');
const { Op } = require('sequelize');

// --- Helper Functions ---
const generatePassword = (dob) => {
    if (dob) {
        return dob.split('-').reverse().join('');
    }
    return Math.random().toString(36).slice(-8);
};

exports.createStudent = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { name, dob, parentName, parentContact, parentEmail, address, isCatering } = req.body;

        // Auto-generate NIS (Simple logic: Year + Random 4 digits)
        const year = new Date().getFullYear();
        const random = Math.floor(1000 + Math.random() * 9000);
        const nis = `${year}${random}`;

        const password = generatePassword(dob);
        const hashedPassword = bcrypt.hashSync(password, 8);

        // New students are inactive by default and have no class assigned yet
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

        // --- Generate Initial Bills ---
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        // 1. Uang Gedung (One-time)
        const buildingFee = await Fee.findOne({ where: { name: 'Uang Gedung' }, transaction: t });
        if (buildingFee) {
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + 1);

            await Bill.create({
                billNumber: `BILL-${student.nis}-BLD-${Date.now()}`,
                amount: buildingFee.amount,
                status: 'Pending',
                dueDate: dueDate,
                studentId: student.id,
                feeId: buildingFee.id,
                month: currentMonth,
                year: currentYear
            }, { transaction: t });
        }

        // 4. Create Initial SPP Bill (Pending)
        const sppFee = await Fee.findOne({ where: { name: 'SPP' }, transaction: t });
        if (sppFee) {
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + 1);

            await Bill.create({
                billNumber: `BILL-${student.nis}-SPP-${currentMonth}-${currentYear}`,
                amount: sppFee.amount,
                status: 'Pending',
                dueDate: dueDate,
                studentId: student.id,
                feeId: sppFee.id,
                month: currentMonth,
                year: currentYear
            }, { transaction: t });
        }

        await t.commit();
        res.status(201).json({ message: 'Student created successfully. Initial bills generated. Please upload payment proof to activate.', data: { ...student.toJSON(), defaultPassword: password } });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};

exports.approveStudent = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { level } = req.body; // Target level (e.g., 7 for new students)

        const student = await Student.findByPk(id, { transaction: t });
        if (!student) {
            await t.rollback();
            return res.status(404).json({ message: 'Student not found' });
        }
        if (student.isActive) {
            await t.rollback();
            return res.status(400).json({ message: 'Student is already active' });
        }

        // Find available class for the level with locking
        const classes = await Class.findAll({
            where: { level },
            transaction: t,
            lock: true
        });

        let assignedClass = null;
        for (const cls of classes) {
            const count = await Student.count({
                where: { classId: cls.id, isActive: true },
                transaction: t
            });
            console.log(`Checking Class ${cls.name}: Capacity ${cls.capacity}, Current Count ${count}`);

            // Use dynamic capacity from model
            if (count < cls.capacity) {
                assignedClass = cls;
                break;
            }
        }

        if (!assignedClass) {
            await t.rollback();
            return res.status(400).json({ message: `No available classes for level ${level}. Please create a new class.` });
        }

        await student.update({
            isActive: true,
            classId: assignedClass.id
        }, { transaction: t });

        // Mark pending bills (Initial Uang Gedung & SPP) as Paid
        await Bill.update(
            { status: 'Paid', paidDate: new Date() },
            {
                where: {
                    studentId: student.id,
                    status: 'Pending'
                },
                transaction: t
            }
        );

        await t.commit();
        res.status(200).json({ message: `Student approved and assigned to class ${assignedClass.name}`, data: student });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};

exports.getAllStudents = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { nis: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Student.findAndCountAll({
            where: whereClause,
            include: [{ model: Class, attributes: ['name'] }],
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

exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, classId, parentName, parentContact, parentEmail, address, isCatering } = req.body;

        const student = await Student.findByPk(id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        await student.update({ name, classId, parentName, parentContact, parentEmail, address, isCatering });
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

        // Find available class for the next level
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
            if (count < cls.capacity) {
                assignedClass = cls;
                break;
            }
        }

        if (!assignedClass) {
            await t.rollback();
            return res.status(400).json({ message: `No available classes for level ${nextLevel}. Please create a new class.` });
        }

        await student.update({ classId: assignedClass.id }, { transaction: t });
        await t.commit();

        res.status(200).json({ message: `Student promoted to class ${assignedClass.name}` });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};
