const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { Student, Bill, Fee, LibraryLoan, LibraryBook } = require('../models');
const { Op } = require('sequelize');

const { sendEmail } = require('../services/notificationService');

// Mock SMS Sender (Log to console)
const sendSMS = async (to, text) => {
    if (!to) return;
    console.log(`[SMS MOCK] To: ${to}, Message: ${text}`);
};

const checkOverdueFees = async () => {
    console.log('Running Fee Check Job...');
    try {
        const bills = await Bill.findAll({
            where: { status: 'Unpaid' },
            include: [
                { model: Student, attributes: ['parentEmail', 'parentContact', 'name', 'createdAt'] },
                { model: Fee, attributes: ['name', 'type'] }
            ]
        });

        const now = new Date();

        for (const bill of bills) {
            const dueDate = new Date(bill.dueDate);
            const diffTime = Math.abs(now - dueDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const diffMonths = diffDays / 30;

            // 1. Uang Gedung (Siswa baru, pembayaran maksimal 1 bulan)
            if (bill.Fee.type === 'Gedung') {
                // Check if student is "new" (e.g., created within last 2 months?) 
                // Or just rely on the bill due date.
                // Requirement: "Siswa baru, pembayaran maksimal 1 bulan lebih dari itu kirim notifikasi ke No Ortu"
                if (diffMonths >= 1) {
                    const message = `Urgent: Uang Gedung payment for ${bill.Student.name} is overdue by more than 1 month. Please pay immediately.`;

                    // Notify Parent Phone (SMS)
                    await sendSMS(bill.Student.parentContact, message);

                    // Also Email as per general requirement
                    await sendEmail(bill.Student.parentEmail, 'Overdue Uang Gedung Notification', message);
                }
            }
            // 2. Uang SPP (Jika tidak membayar 3 bulan)
            // 3. Tagihan Katering (Tidak membayar 3 bulan)
            else if (bill.Fee.type === 'SPP' || bill.Fee.type === 'Catering') {
                if (diffMonths >= 3) {
                    const message = `Urgent: ${bill.Fee.name} payment for ${bill.Student.name} is overdue by more than 3 months.`;

                    // Notify Email (Parent)
                    await sendEmail(bill.Student.parentEmail, `Overdue ${bill.Fee.name} Notification`, message);
                }
            }
        }
    } catch (error) {
        console.error('Error in Fee Check Job:', error);
    }
};

const checkOverdueLibrary = async () => {
    console.log('Running Library Check Job...');
    try {
        const loans = await LibraryLoan.findAll({
            where: { status: 'Borrowed' },
            include: [
                { model: Student, attributes: ['parentEmail', 'name'] },
                { model: LibraryBook, attributes: ['title'] }
            ]
        });

        const now = new Date();

        for (const loan of loans) {
            const dueDate = new Date(loan.dueDate);
            // 4. Library (Melebihi batas pengembalian lebih dari 1 minggu)
            // dueDate is the return deadline.
            // "Melebihi batas pengembalian lebih dari 1 minggu" -> now > dueDate + 7 days

            const overdueThreshold = new Date(dueDate);
            overdueThreshold.setDate(overdueThreshold.getDate() + 7);

            if (now > overdueThreshold) {
                const message = `Urgent: Book "${loan.LibraryBook.title}" borrowed by ${loan.Student.name} is overdue by more than 1 week. Please return it immediately.`;

                // Notify Email (Parent)
                await sendEmail(loan.Student.parentEmail, 'Overdue Library Book Notification', message);
            }
        }
    } catch (error) {
        console.error('Error in Library Check Job:', error);
    }
};

// Schedule Jobs
// Run every day at 8:00 AM
cron.schedule('0 8 * * *', () => {
    checkOverdueFees();
    checkOverdueLibrary();
});

module.exports = {
    checkOverdueFees,
    checkOverdueLibrary
};
