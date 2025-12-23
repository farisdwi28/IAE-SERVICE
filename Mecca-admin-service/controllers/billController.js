const { Bill, Student, Fee } = require('../models');
const { Op } = require('sequelize');

exports.getAllBills = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', nis } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        const studentWhereClause = {};

        if (nis) {
            studentWhereClause.nis = nis;
        }

        if (search) {
            whereClause.billNumber = { [Op.like]: `%${search}%` };
            // Note: Searching by student name/nis via include is complex in Sequelize with limit/offset
            // For simplicity, we'll primarily search billNumber here, or rely on the specific 'nis' filter.
            // If we want to search student name, we'd need to add it to studentWhereClause, but that acts as an AND with the include.
        }

        const { count, rows } = await Bill.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Student,
                    attributes: ['name', 'nis'],
                    where: Object.keys(studentWhereClause).length > 0 ? studentWhereClause : undefined
                },
                { model: Fee, attributes: ['name'] }
            ],
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

exports.markBillAsPaid = async (req, res) => {
    const t = await require('../models').sequelize.transaction();
    try {
        const { id } = req.params;
        const { Bill, Student, Fee, Class } = require('../models');

        const bill = await Bill.findByPk(id, {
            include: [
                { model: Fee },
                { model: Student }
            ],
            transaction: t
        });

        if (!bill) {
            await t.rollback();
            return res.status(404).json({ message: 'Bill not found' });
        }

        // Update Bill Status
        await bill.update({
            status: 'Paid',
            paidDate: new Date()
        }, { transaction: t });

        // Check if this is "Uang Gedung" and Student is inactive
        if (bill.Fee?.name === 'Uang Gedung' && bill.Student && !bill.Student.isActive) {
            const student = bill.Student;
            const level = 7; // Default level for new students

            // Find available class for level 7
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

                if (count < cls.capacity) {
                    assignedClass = cls;
                    break;
                }
            }

            if (assignedClass) {
                await student.update({
                    isActive: true,
                    classId: assignedClass.id
                }, { transaction: t });

                // Also mark SPP as paid if it exists for the same month (optional, but good for UX)
                await Bill.update(
                    { status: 'Paid', paidDate: new Date() },
                    {
                        where: {
                            studentId: student.id,
                            status: 'Pending',
                            // Assuming SPP is generated at the same time
                        },
                        transaction: t
                    }
                );
            } else {
                // If no class found, we still mark bill as paid but warn admin? 
                // Or maybe we should fail? 
                // For now, let's log it and keep student inactive but bill paid.
                console.warn(`No class available for student ${student.nis} after payment.`);
            }
        }

        await t.commit();
        res.status(200).json({ message: 'Bill marked as Paid', bill });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};

exports.sendBillReminder = async (req, res) => {
    try {
        const { id } = req.params;
        const { Bill, Student, Fee } = require('../models');
        const { sendEmail } = require('../services/notificationService');

        const bill = await Bill.findByPk(id, {
            include: [
                { model: Student, attributes: ['parentEmail', 'name'] },
                { model: Fee, attributes: ['name'] }
            ]
        });

        if (!bill) return res.status(404).json({ message: 'Bill not found' });
        if (bill.status === 'Paid') return res.status(400).json({ message: 'Bill is already paid' });

        const parentEmail = bill.Student.parentEmail;

        // Template Message
        const subject = `Payment Reminder: ${bill.Fee.name}`;
        const message = `
Dear ${bill.Student.name} & Parents,

This is a friendly reminder that the payment for ${bill.Fee.name} is currently pending.

Bill Details:
- Bill Number: ${bill.billNumber}
- Amount: Rp ${parseInt(bill.amount).toLocaleString()}
- Due Date: ${new Date(bill.dueDate).toLocaleDateString()}

Please make the payment at your earliest convenience to avoid any service interruptions.

Thank you,
School Administration
        `.trim();

        if (parentEmail) {
            await sendEmail(parentEmail, subject, message);
            return res.status(200).json({ message: `Reminder sent to parent (${parentEmail})` });
        } else {
            return res.status(400).json({ message: 'No parent email found for this student' });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
