const cron = require('node-cron');
const { Student, Bill, Fee } = require('../models');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

const checkOverduePayments = async () => {
    console.log('Running Payment Reminder Job...');
    try {
        const today = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(today.getMonth() - 3);

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);

        // 1. SPP & Catering (3 months overdue)
        // Find unpaid bills created more than 3 months ago
        const overdueBills = await Bill.findAll({
            where: {
                status: 'unpaid',
                createdAt: { [Op.lt]: threeMonthsAgo }
            },
            include: [
                { model: Student, attributes: ['name', 'parentEmail', 'parentName'] },
                { model: Fee, attributes: ['name', 'type'] }
            ]
        });

        for (const bill of overdueBills) {
            if (bill.Student && bill.Student.parentEmail) {
                const message = `Dear ${bill.Student.parentName},\n\nThis is a reminder that the payment for ${bill.Fee.name} (${bill.Fee.type}) for student ${bill.Student.name} is overdue by more than 3 months. Please make the payment immediately.\n\nThank you.`;
                await notificationService.sendEmail(bill.Student.parentEmail, 'Overdue Payment Reminder', message);
            }
        }

        // 2. Building Fee (Uang Gedung) - New Students (1 month limit)
        // Find students who joined > 1 month ago, active, but haven't paid Building Fee
        // Assuming Building Fee is a specific Fee type or ID. 
        // For simplicity, let's assume we check for unpaid 'Building' type bills created > 1 month ago.

        const overdueBuildingBills = await Bill.findAll({
            where: {
                status: 'unpaid',
                createdAt: { [Op.lt]: oneMonthAgo }
            },
            include: [
                {
                    model: Fee,
                    where: { type: 'Building' }, // Assuming 'Building' is the type
                    attributes: ['name', 'type']
                },
                { model: Student, attributes: ['name', 'parentEmail', 'parentName'] }
            ]
        });

        for (const bill of overdueBuildingBills) {
            if (bill.Student && bill.Student.parentEmail) {
                const message = `Dear ${bill.Student.parentName},\n\nThis is a reminder that the Building Fee for student ${bill.Student.name} is overdue (1 month limit). Please make the payment.\n\nThank you.`;
                await notificationService.sendEmail(bill.Student.parentEmail, 'Building Fee Payment Reminder', message);
            }
        }

    } catch (error) {
        console.error('Error in Payment Reminder Job:', error);
    }
};

// Schedule: Run every day at 8:00 AM
const init = () => {
    cron.schedule('0 8 * * *', checkOverduePayments);
};

module.exports = { init, checkOverduePayments };
