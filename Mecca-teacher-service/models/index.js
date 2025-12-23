const sequelize = require('../config/database');

const Admin = require('./Admin');
const Student = require('./Student');
const Teacher = require('./Teacher');
const Class = require('./Class');
const Subject = require('./Subject');
const Schedule = require('./Schedule');
const Attendance = require('./Attendance');
const Grade = require('./Grade');
const Fee = require('./Fee');
const Bill = require('./Bill');
const LibraryBook = require('./LibraryBook');
const LibraryLoan = require('./LibraryLoan');

// Associations

// Class - Student (One-to-Many)
Class.hasMany(Student, { foreignKey: 'classId' });
Student.belongsTo(Class, { foreignKey: 'classId' });

// Class - Schedule (One-to-Many)
Class.hasMany(Schedule, { foreignKey: 'classId' });
Schedule.belongsTo(Class, { foreignKey: 'classId' });

// Subject - Schedule (One-to-Many)
Subject.hasMany(Schedule, { foreignKey: 'subjectId' });
Schedule.belongsTo(Subject, { foreignKey: 'subjectId' });

// Teacher - Schedule (One-to-Many)
Teacher.hasMany(Schedule, { foreignKey: 'teacherId' });
Schedule.belongsTo(Teacher, { foreignKey: 'teacherId' });

// Student - Attendance (One-to-Many)
Student.hasMany(Attendance, { foreignKey: 'studentId' });
Attendance.belongsTo(Student, { foreignKey: 'studentId' });

// Schedule - Attendance (One-to-Many) - To track attendance per class session
Schedule.hasMany(Attendance, { foreignKey: 'scheduleId' });
Attendance.belongsTo(Schedule, { foreignKey: 'scheduleId' });

// Student - Grade (One-to-Many)
Student.hasMany(Grade, { foreignKey: 'studentId' });
Grade.belongsTo(Student, { foreignKey: 'studentId' });

// Subject - Grade (One-to-Many)
Subject.hasMany(Grade, { foreignKey: 'subjectId' });
Grade.belongsTo(Subject, { foreignKey: 'subjectId' });

// Student - Bill (One-to-Many)
Student.hasMany(Bill, { foreignKey: 'studentId' });
Bill.belongsTo(Student, { foreignKey: 'studentId' });

// Fee - Bill (One-to-Many)
Fee.hasMany(Bill, { foreignKey: 'feeId' });
Bill.belongsTo(Fee, { foreignKey: 'feeId' });

// Student - LibraryLoan (One-to-Many)
Student.hasMany(LibraryLoan, { foreignKey: 'studentId' });
LibraryLoan.belongsTo(Student, { foreignKey: 'studentId' });

// LibraryBook - LibraryLoan (One-to-Many)
LibraryBook.hasMany(LibraryLoan, { foreignKey: 'bookId' });
LibraryLoan.belongsTo(LibraryBook, { foreignKey: 'bookId' });

module.exports = {
    sequelize,
    Admin,
    Student,
    Teacher,
    Class,
    Subject,
    Schedule,
    Attendance,
    Grade,
    Fee,
    Bill,
    LibraryBook,
    LibraryLoan
};
