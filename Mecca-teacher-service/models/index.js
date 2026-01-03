const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// --- Helper untuk load model yang formatnya campur-campur ---
const loadModel = (modelName) => {
    const modelDef = require(`./${modelName}`);
    
    // Coba panggil sebagai fungsi (Factory Pattern)
    try {
        return modelDef(sequelize, DataTypes);
    } catch (error) {
        // Jika error "Class constructor", berarti dia Model Class (Legacy) -> Pakai langsung
        if (error.message.includes("Class constructor") || typeof modelDef !== 'function') {
            return modelDef;
        }
        throw error;
    }
};

// 1. Load Semua Model dengan Helper
const Admin = loadModel('Admin');
const Student = loadModel('Student');
const Teacher = loadModel('Teacher');
const Class = loadModel('Class');
const Subject = loadModel('Subject');
const Schedule = loadModel('Schedule');
const Attendance = loadModel('Attendance');
const Grade = loadModel('Grade');
const Fee = loadModel('Fee');
const Bill = loadModel('Bill');
const LibraryBook = loadModel('LibraryBook');
const LibraryLoan = loadModel('LibraryLoan');

// 2. Definisi Relasi (Associations)

// Class & Student
if (Class && Student) {
    Class.hasMany(Student, { foreignKey: 'classId' });
    Student.belongsTo(Class, { foreignKey: 'classId' });
}

// Class & Schedule
if (Class && Schedule) {
    Class.hasMany(Schedule, { foreignKey: 'classId' });
    Schedule.belongsTo(Class, { foreignKey: 'classId' });
}

// Subject & Schedule
if (Subject && Schedule) {
    Subject.hasMany(Schedule, { foreignKey: 'subjectId' });
    Schedule.belongsTo(Subject, { foreignKey: 'subjectId' });
}

// Teacher & Schedule
if (Teacher && Schedule) {
    Teacher.hasMany(Schedule, { foreignKey: 'teacherId' });
    Schedule.belongsTo(Teacher, { foreignKey: 'teacherId' });
}

// Student & Attendance
if (Student && Attendance) {
    Student.hasMany(Attendance, { foreignKey: 'studentId' });
    Attendance.belongsTo(Student, { foreignKey: 'studentId' });
}

// Schedule & Attendance
if (Schedule && Attendance) {
    Schedule.hasMany(Attendance, { foreignKey: 'scheduleId' });
    Attendance.belongsTo(Schedule, { foreignKey: 'scheduleId' });
}

// --- RELASI PENTING UNTUK NILAI ---
if (Student && Grade) {
        Student.hasMany(Grade, { foreignKey: 'studentId', as: 'grades' });
        Grade.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
        console.log("✅ Relasi Student <-> Grade berhasil di-set.");
    } else {
        console.error("❌ Gagal set relasi Student <-> Grade. Salah satu model null.");
    }

if (Subject && Grade) {
    Subject.hasMany(Grade, { foreignKey: 'subjectId' });
    Grade.belongsTo(Subject, { foreignKey: 'subjectId' });
}
// ----------------------------------

// Bills & Fees
if (Student && Bill) {
    Student.hasMany(Bill, { foreignKey: 'studentId' });
    Bill.belongsTo(Student, { foreignKey: 'studentId' });
}
if (Fee && Bill) {
    Fee.hasMany(Bill, { foreignKey: 'feeId' });
    Bill.belongsTo(Fee, { foreignKey: 'feeId' });
}

// Library
if (Student && LibraryLoan) {
    Student.hasMany(LibraryLoan, { foreignKey: 'studentId' });
    LibraryLoan.belongsTo(Student, { foreignKey: 'studentId' });
}
if (LibraryBook && LibraryLoan) {
    LibraryBook.hasMany(LibraryLoan, { foreignKey: 'bookId' });
    LibraryLoan.belongsTo(LibraryBook, { foreignKey: 'bookId' });
}

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