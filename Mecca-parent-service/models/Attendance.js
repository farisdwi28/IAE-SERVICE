const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM('Present', 'Absent', 'Late', 'Excused'),
        allowNull: false
    }
}, {
    timestamps: true
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Attendance:
 *       type: object
 *       required:
 *         - date
 *         - status
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the attendance record
 *         date:
 *           type: string
 *           format: date
 *           description: The date of attendance
 *         status:
 *           type: string
 *           enum: [Present, Absent, Late, Excused]
 *           description: The attendance status
 *       example:
 *         id: 1
 *         date: "2023-11-28"
 *         status: "Present"
 */
module.exports = Attendance;
