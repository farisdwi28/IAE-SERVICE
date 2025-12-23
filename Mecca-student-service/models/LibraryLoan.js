const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LibraryLoan = sequelize.define('LibraryLoan', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    loanDate: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    },
    dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    returnDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('Borrowed', 'Returned', 'Overdue'),
        defaultValue: 'Borrowed'
    }
}, {
    timestamps: true
});

/**
 * @swagger
 * components:
 *   schemas:
 *     LibraryLoan:
 *       type: object
 *       required:
 *         - dueDate
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the loan
 *         loanDate:
 *           type: string
 *           format: date
 *           description: The date when the book was borrowed
 *         dueDate:
 *           type: string
 *           format: date
 *           description: The due date for returning the book
 *         returnDate:
 *           type: string
 *           format: date
 *           description: The date when the book was returned
 *         status:
 *           type: string
 *           enum: [Borrowed, Returned, Overdue]
 *           description: The status of the loan
 *       example:
 *         id: 1
 *         loanDate: "2023-11-01"
 *         dueDate: "2023-11-08"
 *         status: "Borrowed"
 */
module.exports = LibraryLoan;
