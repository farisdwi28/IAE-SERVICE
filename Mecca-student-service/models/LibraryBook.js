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

/**
 * @swagger
 * components:
 *   schemas:
 *     LibraryBook:
 *       type: object
 *       required:
 *         - title
 *         - author
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the book
 *         title:
 *           type: string
 *           description: The title of the book
 *         author:
 *           type: string
 *           description: The author of the book
 *         isbn:
 *           type: string
 *           description: The ISBN of the book
 *         stock:
 *           type: integer
 *           description: The number of copies available
 *       example:
 *         id: 1
 *         title: "The Great Gatsby"
 *         author: "F. Scott Fitzgerald"
 *         isbn: "9780743273565"
 *         stock: 5
 */
module.exports = LibraryBook;
