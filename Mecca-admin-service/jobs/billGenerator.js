const cron = require('node-cron');
const { Student, Bill, Fee, sequelize } = require('../models');
const { Op } = require('sequelize');

const generateMonthlyBills = async () => {
    console.log('Running Monthly Bill Generator...');
    const t = await sequelize.transaction();

    try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        // 1. Get Active Students
        const students = await Student.findAll({ where: { isActive: true }, transaction: t });

        // 2. Get Fees
        const sppFee = await Fee.findOne({ where: { name: 'SPP' }, transaction: t });
        const cateringFee = await Fee.findOne({ where: { name: 'Katering' }, transaction: t }); // Assuming name is 'Katering' or 'Catering'

        if (!sppFee) {
            console.error('SPP Fee not found. Skipping bill generation.');
            await t.rollback();
            return;
        }

        const billsToCreate = [];

        for (const student of students) {
            // Check if SPP bill already exists for this month
            const existingSPP = await Bill.findOne({
                where: {
                    studentId: student.id,
                    feeId: sppFee.id,
                    month: currentMonth,
                    year: currentYear
                },
                transaction: t
            });

            if (!existingSPP) {
                const dueDate = new Date();
                dueDate.setMonth(dueDate.getMonth() + 1);

                billsToCreate.push({
                    billNumber: `BILL-${student.nis}-SPP-${currentMonth}-${currentYear}`,
                    amount: sppFee.amount,
                    status: 'Pending',
                    dueDate: dueDate,
                    studentId: student.id,
                    feeId: sppFee.id,
                    month: currentMonth,
                    year: currentYear
                });
            }

            // Catering Bill
            if (student.isCatering && cateringFee) {
                const existingCatering = await Bill.findOne({
                    where: {
                        studentId: student.id,
                        feeId: cateringFee.id,
                        month: currentMonth,
                        year: currentYear
                    },
                    transaction: t
                });

                if (!existingCatering) {
                    const dueDate = new Date();
                    dueDate.setMonth(dueDate.getMonth() + 1);

                    billsToCreate.push({
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

        if (billsToCreate.length > 0) {
            await Bill.bulkCreate(billsToCreate, { transaction: t });
            console.log(`Generated ${billsToCreate.length} bills for ${currentMonth}/${currentYear}.`);
        } else {
            console.log('No new bills to generate.');
        }

        await t.commit();
    } catch (error) {
        console.error('Error generating monthly bills:', error);
        await t.rollback();
    }
};

// Schedule: Run at 00:01 on the 1st day of every month
cron.schedule('1 0 1 * *', generateMonthlyBills);

module.exports = { generateMonthlyBills };
