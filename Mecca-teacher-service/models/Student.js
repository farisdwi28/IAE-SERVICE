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

module.exports = Student;
