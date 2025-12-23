const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Admin, Student, Teacher } = require('../models');

const generateToken = (user, role) => {
    return jwt.sign({ id: user.id, role: role }, process.env.JWT_SECRET, {
        expiresIn: '24h'
    });
};

const resolvers = {
    Query: {
        hello: () => 'Mecca Auth Service with GraphQL!',

        me: async (_, __, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const { id, role } = context.user;

            if (role === 'admin') {
                return await Admin.findByPk(id);
            } else if (role === 'student' || role === 'parent') {
                return await Student.findByPk(id);
            } else if (role === 'teacher') {
                return await Teacher.findByPk(id);
            }

            return null;
        }
    },

    Mutation: {
        login: async (_, { username, password, role }) => {
            let user;

            if (role === 'admin') {
                user = await Admin.findOne({ where: { username } });
            } else if (role === 'student') {
                user = await Student.findOne({ where: { nis: username } });
            } else if (role === 'teacher') {
                user = await Teacher.findOne({ where: { nip: username } });
            } else if (role === 'parent') {
                user = await Student.findOne({ where: { nis: username } });
            } else {
                throw new Error('Invalid role selected');
            }

            if (!user) {
                throw new Error('User not found');
            }

            const passwordIsValid = bcrypt.compareSync(password, user.password);

            if (!passwordIsValid) {
                throw new Error('Invalid password');
            }

            const assignedRole = role === 'parent' ? 'parent' : role;
            const token = generateToken(user, assignedRole);

            return {
                token,
                user: {
                    id: user.id,
                    username: username,
                    name: user.name,
                    role: assignedRole
                }
            };
        },

        registerAdmin: async (_, { username, password, name }) => {
            const hashedPassword = bcrypt.hashSync(password, 8);

            const admin = await Admin.create({
                username,
                password: hashedPassword,
                name
            });

            return admin;
        }
    },

    User: {
        __resolveType(obj) {
            if (obj.username) {
                return 'Admin';
            }
            if (obj.nis) {
                return 'Student';
            }
            if (obj.nip) {
                return 'Teacher';
            }
            return null;
        }
    }
};

module.exports = resolvers;
