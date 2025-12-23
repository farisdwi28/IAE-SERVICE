const cron = require('node-cron');
const { Student, LibraryLoan, LibraryBook } = require('../models');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

const checkOverdueBooks = async () => {
    console.log('Running Library Reminder Job...');
    try {
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);

        // Find loans that are 'borrowed' and dueDate was more than 1 week ago? 
        // Requirement: "terlambat > 1 minggu" => overdue by > 1 week.
        // If dueDate is stored, check dueDate < (today - 7 days).
        // If only borrowDate is stored and loan period is fixed, calculate accordingly.
        // Assuming LibraryLoan has 'dueDate'.

        const overdueLoans = await LibraryLoan.findAll({
            where: {
                status: 'borrowed',
                dueDate: { [Op.lt]: oneWeekAgo } // Due date was more than 7 days ago
            },
            include: [
                { model: Student, attributes: ['name', 'parentEmail', 'parentName', 'email'] }, // Assuming Student has email too
                { model: LibraryBook, attributes: ['title'] }
            ]
        });

        for (const loan of overdueLoans) {
            const student = loan.Student;
            const book = loan.LibraryBook;

            if (student) {
                const message = `Dear ${student.name} / Parent,\n\nThe book "${book.title}" is overdue by more than a week. Please return it to the library.\n\nThank you.`;

                // Send to Parent
                if (student.parentEmail) {
                    await notificationService.sendEmail(student.parentEmail, 'Library Book Overdue', message);
                }
                // Send to Student (if email exists)
                // if (student.email) {
                //     await notificationService.sendEmail(student.email, 'Library Book Overdue', message);
                // }
            }
        }

    } catch (error) {
        console.error('Error in Library Reminder Job:', error);
    }
};

// Schedule: Run every day at 9:00 AM
const init = () => {
    cron.schedule('0 9 * * *', checkOverdueBooks);
};

module.exports = { init, checkOverdueBooks };
