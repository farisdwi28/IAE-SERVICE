const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Schedule = sequelize.define('Schedule', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    day: {
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
    }
}, {
    timestamps: true
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Schedule:
 *       type: object
 *       required:
 *         - day
 *         - startTime
 *         - endTime
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the schedule
 *         day:
 *           type: string
 *           enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday]
 *           description: The day of the week
 *         startTime:
 *           type: string
 *           format: time
 *           description: Start time of the class
 *         endTime:
 *           type: string
 *           format: time
 *           description: End time of the class
 *         classId:
 *           type: integer
 *           description: The ID of the class
 *         subjectId:
 *           type: integer
 *           description: The ID of the subject
 *         teacherId:
 *           type: integer
 *           description: The ID of the teacher
 *       example:
 *         id: 1
 *         day: "Monday"
 *         startTime: "08:00:00"
 *         endTime: "09:30:00"
 *         classId: 1
 *         subjectId: 1
 *         teacherId: 1
 */
module.exports = Schedule;
