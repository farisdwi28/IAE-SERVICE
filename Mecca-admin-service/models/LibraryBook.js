const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LibraryBook = sequelize.define('LibraryBook', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    author: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isbn: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    },
    stock: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
}, {
    timestamps: true
});

module.exports = LibraryBook;
