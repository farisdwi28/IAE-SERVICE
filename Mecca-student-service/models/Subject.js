const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subject = sequelize.define('Subject', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    level: {
        type: DataTypes.INTEGER, // e.g., 7, 8, 9
        allowNull: false,
        defaultValue: 7 // Default to 7 if not specified during migration
    }
}, {
    timestamps: true
});

module.exports = Subject;
