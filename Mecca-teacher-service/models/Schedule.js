const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Schedule = sequelize.define('Schedule', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    day: {
        // Sesuaikan dengan kebutuhan, bisa ENUM atau STRING biasa
        type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
        allowNull: false
    },
    startTime: {
        type: DataTypes.TIME,
        allowNull: false
    },
    endTime: {
        type: DataTypes.TIME,
        allowNull: false
    },
    // Kita definisikan Foreign Key di sini juga agar jelas
    classId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    subjectId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    teacherId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: true
});

module.exports = Schedule;