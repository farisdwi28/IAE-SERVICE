const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Pastikan path ini benar mengarah ke instance Sequelize

// 1. Inisialisasi Model (Panggil Function-nya)
const Admin = require('./Admin')(sequelize, DataTypes);
const Student = require('./Student')(sequelize, DataTypes);
const Teacher = require('./Teacher')(sequelize, DataTypes);
const Class = require('./Class')(sequelize, DataTypes);
const Subject = require('./Subject')(sequelize, DataTypes);
const Schedule = require('./Schedule')(sequelize, DataTypes);
const Attendance = require('./Attendance')(sequelize, DataTypes);
const Grade = require('./Grade')(sequelize, DataTypes);
const Fee = require('./Fee')(sequelize, DataTypes);
const Bill = require('./Bill')(sequelize, DataTypes);
const LibraryBook = require('./LibraryBook')(sequelize, DataTypes);
const LibraryLoan = require('./LibraryLoan')(sequelize, DataTypes);

// 2. Definisi Relasi (Associations)

// Class - Student
Class.hasMany(Student, { foreignKey: 'classId' });
Student.belongsTo(Class, { foreignKey: 'classId' });

// Class - Schedule
Class.hasMany(Schedule, { foreignKey: 'classId' });
Schedule.belongsTo(Class, { foreignKey: 'classId' });

// Subject - Schedule
Subject.hasMany(Schedule, { foreignKey: 'subjectId' });
Schedule.belongsTo(Subject, { foreignKey: 'subjectId' });

// Teacher - Schedule
Teacher.hasMany(Schedule, { foreignKey: 'teacherId' });
Schedule.belongsTo(Teacher, { foreignKey: 'teacherId' });

// Student - Attendance
Student.hasMany(Attendance, { foreignKey: 'studentId' });
Attendance.belongsTo(Student, { foreignKey: 'studentId' });

// Schedule - Attendance
Schedule.hasMany(Attendance, { foreignKey: 'scheduleId' });
Attendance.belongsTo(Schedule, { foreignKey: 'scheduleId' });

// --- RELASI PENTING UNTUK NILAI ---
// Student - Grade
Student.hasMany(Grade, { foreignKey: 'studentId' });
Grade.belongsTo(Student, { foreignKey: 'studentId' });

// Subject - Grade
Subject.hasMany(Grade, { foreignKey: 'subjectId' });
Grade.belongsTo(Subject, { foreignKey: 'subjectId' });
// ----------------------------------

// Student - Bill
Student.hasMany(Bill, { foreignKey: 'studentId' });
Bill.belongsTo(Student, { foreignKey: 'studentId' });

// Fee - Bill
Fee.hasMany(Bill, { foreignKey: 'feeId' });
Bill.belongsTo(Fee, { foreignKey: 'feeId' });

// Student - LibraryLoan
Student.hasMany(LibraryLoan, { foreignKey: 'studentId' });
LibraryLoan.belongsTo(Student, { foreignKey: 'studentId' });

// LibraryBook - LibraryLoan
LibraryBook.hasMany(LibraryLoan, { foreignKey: 'bookId' });
LibraryLoan.belongsTo(LibraryBook, { foreignKey: 'bookId' });

// 3. Export Semua
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