const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Class = sequelize.define('Class', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING, // e.g., "7A", "8B"
        allowNull: false
        // unique: true // Removed to allow duplicate names as per user request
    },
    level: {
        type: DataTypes.INTEGER, // e.g., 7, 8, 9
        allowNull: false
    },
    capacity: {
        type: DataTypes.INTEGER,
        defaultValue: 30,
        allowNull: false
    }
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['name', 'level']
        }
    ]
});

module.exports = Class;
