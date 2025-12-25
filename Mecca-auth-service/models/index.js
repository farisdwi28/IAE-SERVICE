const sequelize = require('../config/database');
const Admin = require('./Admin');
const Student = require('./Student');
const Teacher = require('./Teacher');
const Parent = require('./Parent');

// No associations needed for auth service - just authentication data

module.exports = {
    sequelize,
    Admin,
    Student,
    Teacher,
    Parent
};
