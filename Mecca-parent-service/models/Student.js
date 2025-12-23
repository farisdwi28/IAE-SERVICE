const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nis: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    classId: {
        type: DataTypes.INTEGER,
        allowNull: true // Nullable until approved/assigned
    },
    parentName: {
        type: DataTypes.STRING
    },
    parentContact: {
        type: DataTypes.STRING
    },
    parentEmail: {
        type: DataTypes.STRING
    },
    address: {
        type: DataTypes.TEXT
    },
    photo: {
        type: DataTypes.STRING // URL to photo
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    paymentProof: {
        type: DataTypes.STRING // URL to proof
    },
    isCatering: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Student:
 *       type: object
 *       required:
 *         - name
 *         - password
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the student
 *         nis:
 *           type: string
 *           description: The unique student identification number
 *         name:
 *           type: string
 *           description: The name of the student
 *         classId:
 *           type: integer
 *           description: The ID of the class the student belongs to
 *         parentName:
 *           type: string
 *           description: Name of the parent
 *         parentContact:
 *           type: string
 *           description: Contact number of the parent
 *         address:
 *           type: string
 *           description: Address of the student
 *         isActive:
 *           type: boolean
 *           description: Whether the student is active
 *         isCatering:
 *           type: boolean
 *           description: Whether the student is subscribed to catering
 *       example:
 *         id: 1
 *         nis: "20231234"
 *         name: "John Doe"
 *         classId: 5
 *         parentName: "Jane Doe"
 *         isActive: true
 */
module.exports = Student;
