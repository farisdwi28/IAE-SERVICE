const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Teacher = sequelize.define('Teacher', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nip: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subjectSpecialization: {
        type: DataTypes.STRING, // Could be JSON or just a string description
        allowNull: true
    }
}, {
    timestamps: true
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Teacher:
 *       type: object
 *       required:
 *         - nip
 *         - name
 *         - password
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the teacher
 *         nip:
 *           type: string
 *           description: The unique teacher identification number
 *         name:
 *           type: string
 *           description: The name of the teacher
 *         subjectSpecialization:
 *           type: string
 *           description: The subject specialization of the teacher
 *       example:
 *         id: 1
 *         nip: "198001012005011001"
 *         name: "Mr. Smith"
 *         subjectSpecialization: "Mathematics"
 */
module.exports = Teacher;
