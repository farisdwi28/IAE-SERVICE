const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bill = sequelize.define('Bill', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    billNumber: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Paid', 'Overdue'),
        defaultValue: 'Pending'
    },
    dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    paidDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    month: {
        type: DataTypes.INTEGER, // 1-12, for SPP/Catering
        allowNull: true
    },
    year: {
        type: DataTypes.INTEGER, // e.g., 2023
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = Bill;
