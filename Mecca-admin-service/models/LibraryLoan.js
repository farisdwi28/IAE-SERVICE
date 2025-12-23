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

module.exports = LibraryLoan;
