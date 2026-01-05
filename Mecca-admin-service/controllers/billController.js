const { Bill, Student, Fee, Class, sequelize } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');

// [HELPER] Broadcast
const broadcastToServices = async (action, data) => {
    const services = [
        'http://student-service:3003',
        'http://parent-service:3005'
    ];

    const syncPromises = services.map(serviceUrl => {
        return axios.post(`${serviceUrl}/api/sync/bills`, {
            action: action,
            data: data
        }).catch(err => {
            console.error(`Gagal sync Bill ke ${serviceUrl}:`, err.message);
        });
    });

    await Promise.all(syncPromises);
};

// [BARU] Create Manual Bill
exports.createBill = async (req, res) => {
    try {
        const { studentId, feeId, dueDate, month, year, customAmount } = req.body;

        const student = await Student.findByPk(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const fee = await Fee.findByPk(feeId);
        if (!fee) return res.status(404).json({ message: 'Fee type not found' });

        // Generate Bill Number
        const feeNameCode = fee.name.replace(/\s+/g, '').substr(0, 3).toUpperCase();
        const billNumber = `BILL-${student.nis}-${feeNameCode}-${Date.now()}`;

        const bill = await Bill.create({
            billNumber,
            amount: customAmount || fee.amount, // Bisa override jumlah
            status: 'Pending',
            dueDate,
            studentId,
            feeId,
            month,
            year
        });

        // Broadcast ke Service Lain
        await broadcastToServices('CREATE', bill.toJSON());

        res.status(201).json({ message: 'Bill created successfully', bill });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

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
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;

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
        // Logika Aktivasi Siswa jika bayar Gedung
        if (bill.Fee?.name === 'Uang Gedung' && bill.Student && !bill.Student.isActive) {
            const student = bill.Student;
            const level = 7; // Default level

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

                // Also mark SPP as paid if it exists for the same month
                await Bill.update(
                    { status: 'Paid', paidDate: new Date() },
                    {
                        where: {
                            studentId: student.id,
                            status: 'Pending',
                            // Add logic to match month/year if needed
                        },
                        transaction: t
                    }
                );
            } else {
                console.warn(`No class available for student ${student.nis} after payment.`);
            }
        }

        // [BARU] Broadcast Update Bill ke Student & Parent Service
        await broadcastToServices('UPDATE', bill.toJSON());

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
        // Import service notifikasi jika ada
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

        const subject = `Payment Reminder: ${bill.Fee.name}`;
        const message = `
Dear ${bill.Student.name} & Parents,

This is a friendly reminder that the payment for ${bill.Fee.name} is currently pending.

Bill Details:
- Bill Number: ${bill.billNumber}
- Amount: Rp ${parseInt(bill.amount).toLocaleString()}
- Due Date: ${new Date(bill.dueDate).toLocaleDateString()}

Please make the payment at your earliest convenience.

Thank you,
School Administration
        `.trim();

        if (parentEmail) {
            // Uncomment jika service email sudah siap
            await sendEmail(parentEmail, subject, message);
            
            // Simulasi sukses
            console.log(`[EMAIL MOCK] To: ${parentEmail} | Subject: ${subject}`);
            return res.status(200).json({ message: `Reminder sent to parent (${parentEmail})` });
        } else {
            return res.status(400).json({ message: 'No parent email found for this student' });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};