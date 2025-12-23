const sequelize = require('../config/database');
const Admin = require('./Admin');
const Student = require('./Student');
const Teacher = require('./Teacher');

// No associations needed for auth service - just authentication data

module.exports = {
    sequelize,
    Admin,
    Student,
    Teacher
};
