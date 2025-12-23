const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Grade = sequelize.define('Grade', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.STRING, // e.g., "Midterm", "Final", "Assignment 1"
        allowNull: false
    },
    score: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
}, {
    timestamps: true
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Grade:
 *       type: object
 *       required:
 *         - type
 *         - score
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the grade
 *         type:
 *           type: string
 *           enum: [Quiz, Assignment, Midterm, Final]
 *           description: The type of assessment
 *         score:
 *           type: number
 *           format: float
 *           description: The score obtained
 *         studentId:
 *           type: integer
 *           description: The ID of the student
 *         subjectId:
 *           type: integer
 *           description: The ID of the subject
 *       example:
 *         id: 1
 *         type: "Quiz"
 *         score: 85.5
 *         studentId: 1
 *         subjectId: 1
 */
module.exports = Grade;
