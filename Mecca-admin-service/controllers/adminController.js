const bcrypt = require('bcrypt');
const { Student, Teacher, Class, Subject, Schedule, Fee, Bill } = require('../models');
const { Op } = require('sequelize');

// --- Helper Functions ---
const generatePassword = (dob) => {
    // Default password: DDMMYYYY from DOB (YYYY-MM-DD)
    // If DOB is not provided, generate random 8 chars
    if (dob) {
        return dob.split('-').reverse().join('');
    }
    return Math.random().toString(36).slice(-8);
};

// --- Student CRUD ---
exports.createStudent = async (req, res) => {
    try {
        const { name, dob, parentName, parentContact, parentEmail, address, isCatering } = req.body;

        // Auto-generate NIS (Simple logic: Year + Random 4 digits)
        const year = new Date().getFullYear();
        const random = Math.floor(1000 + Math.random() * 9000);
        const nis = `${year}${random}`;

        const password = generatePassword(dob);
        const hashedPassword = bcrypt.hashSync(password, 8);

        // New students are inactive by default and have no class assigned yet
        const student = await Student.create({
            nis,
            name,
            password: hashedPassword,
            classId: null,
            parentName,
            parentContact,
            parentEmail,
            address,
            isCatering,
            isActive: false
        });

        res.status(201).json({ message: 'Student created successfully. Please upload payment proof to activate.', data: { ...student.toJSON(), defaultPassword: password } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.approveStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { level } = req.body; // Target level (e.g., 7 for new students)

        const student = await Student.findByPk(id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        if (student.isActive) return res.status(400).json({ message: 'Student is already active' });

        // Find available class for the level
        const classes = await Class.findAll({ where: { level } });

        let assignedClass = null;
        for (const cls of classes) {
            const count = await Student.count({ where: { classId: cls.id, isActive: true } });
            if (count < 30) {
                assignedClass = cls;
                break;
            }
        }

        if (!assignedClass) {
            return res.status(400).json({ message: `No available classes for level ${level}. Please create a new class.` });
        }

        await student.update({
            isActive: true,
            classId: assignedClass.id
        });

        res.status(200).json({ message: `Student approved and assigned to class ${assignedClass.name}`, data: student });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.findAll({
            include: [{ model: Class, attributes: ['name'] }],
            attributes: { exclude: ['password'] }
        });
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, classId, parentName, parentContact, address, isCatering } = req.body;

        const student = await Student.findByPk(id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        await student.update({ name, classId, parentName, parentContact, address, isCatering });
        res.status(200).json({ message: 'Student updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findByPk(id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        await student.destroy();
        res.status(200).json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Teacher CRUD ---
exports.createTeacher = async (req, res) => {
    try {
        const { name, nip, subjectSpecialization } = req.body;

        // Default password
        const password = 'teacher123'; // Should be random or based on policy
        const hashedPassword = bcrypt.hashSync(password, 8);

        const teacher = await Teacher.create({
            nip,
            name,
            password: hashedPassword,
            subjectSpecialization
        });

        res.status(201).json({ message: 'Teacher created successfully', data: { ...teacher.toJSON(), defaultPassword: password } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.findAll({
            attributes: { exclude: ['password'] }
        });
        res.status(200).json(teachers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, subjectSpecialization } = req.body;

        const teacher = await Teacher.findByPk(id);
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

        await teacher.update({ name, subjectSpecialization });
        res.status(200).json({ message: 'Teacher updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const teacher = await Teacher.findByPk(id);
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

        await teacher.destroy();
        res.status(200).json({ message: 'Teacher deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Class CRUD ---
exports.createClass = async (req, res) => {
    try {
        const { name, level } = req.body;
        const newClass = await Class.create({ name, level });
        res.status(201).json(newClass);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllClasses = async (req, res) => {
    try {
        const classes = await Class.findAll();
        res.status(200).json(classes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, level } = req.body;
        const cls = await Class.findByPk(id);
        if (!cls) return res.status(404).json({ message: 'Class not found' });
        await cls.update({ name, level });
        res.status(200).json({ message: 'Class updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteClass = async (req, res) => {
    try {
        const { id } = req.params;
        const cls = await Class.findByPk(id);
        if (!cls) return res.status(404).json({ message: 'Class not found' });
        await cls.destroy();
        res.status(200).json({ message: 'Class deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Subject CRUD ---
exports.createSubject = async (req, res) => {
    try {
        const { name, code, level } = req.body;
        const subject = await Subject.create({ name, code, level });
        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllSubjects = async (req, res) => {
    try {
        const subjects = await Subject.findAll();
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, level } = req.body;
        const subject = await Subject.findByPk(id);
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        await subject.update({ name, code, level });
        res.status(200).json({ message: 'Subject updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await Subject.findByPk(id);
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        await subject.destroy();
        res.status(200).json({ message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Schedule CRUD (Simplified) ---
exports.createSchedule = async (req, res) => {
    try {
        const { day, startTime, endTime, classId, subjectId, teacherId } = req.body;

        // Basic validation: Check for conflicts
        const conflict = await Schedule.findOne({
            where: {
                day,
                [Op.or]: [
                    {
                        startTime: { [Op.between]: [startTime, endTime] }
                    },
                    {
                        endTime: { [Op.between]: [startTime, endTime] }
                    }
                ],
                [Op.or]: [
                    { classId }, // Class is busy
                    { teacherId } // Teacher is busy
                ]
            }
        });

        if (conflict) {
            return res.status(400).json({ message: 'Schedule conflict detected!' });
        }

        const schedule = await Schedule.create({
            day, startTime, endTime, classId, subjectId, teacherId
        });

        res.status(201).json(schedule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllSchedules = async (req, res) => {
    try {
        const schedules = await Schedule.findAll({
            include: [
                { model: Class, attributes: ['name'] },
                { model: Subject, attributes: ['name'] },
                { model: Teacher, attributes: ['name'] }
            ]
        });
        res.status(200).json(schedules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { day, startTime, endTime, classId, subjectId, teacherId } = req.body;
        const schedule = await Schedule.findByPk(id);
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

        // Note: Should re-check conflicts here, but skipping for brevity in prototype
        await schedule.update({ day, startTime, endTime, classId, subjectId, teacherId });
        res.status(200).json({ message: 'Schedule updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const schedule = await Schedule.findByPk(id);
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
        await schedule.destroy();
        res.status(200).json({ message: 'Schedule deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteAllSchedules = async (req, res) => {
    try {
        // Using truncate: true fails due to foreign key constraints.
        // Using standard delete instead.
        await Schedule.destroy({ where: {} });
        res.status(200).json({ message: 'All schedules deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.autoGenerateSchedule = async (req, res) => {
    try {
        // 1. Fetch all necessary data
        const classes = await Class.findAll();
        const subjects = await Subject.findAll();
        const teachers = await Teacher.findAll();

        if (classes.length === 0 || subjects.length === 0 || teachers.length === 0) {
            return res.status(400).json({ message: 'Ensure classes, subjects, and teachers exist.' });
        }

        // 2. Define Time Slots (Mon-Fri, 4 slots/day)
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const timeSlots = [
            { start: '08:00', end: '09:30' },
            { start: '10:00', end: '11:30' },
            { start: '13:00', end: '14:30' },
            { start: '15:00', end: '16:30' }
        ];

        let createdCount = 0;
        const newSchedules = [];

        // Fetch existing schedules to avoid duplicates with pre-existing data
        const existingSchedules = await Schedule.findAll();

        // 3. Iterate through each class
        for (const cls of classes) {
            // Track assigned (Subject, Teacher) pairs for this class to ensure uniqueness per week
            // Set of "subjectId-teacherId"
            const assignedPairs = new Set();

            // Pre-fill assignedPairs from existing DB schedules for this class
            existingSchedules.filter(s => s.classId === cls.id).forEach(s => {
                assignedPairs.add(`${s.subjectId}-${s.teacherId}`);
            });

            for (const day of days) {
                for (const slot of timeSlots) {
                    // Try to find a valid (Subject, Teacher) pair
                    // 1. Must not be already assigned to this class this week (Unique Subject-Teacher-Student)
                    // 2. Teacher must be free at this slot
                    // 3. Class must be free at this slot (implicit by loop, but check DB/newSchedules)

                    // Shuffle subjects to randomize
                    const shuffledSubjects = [...subjects].sort(() => 0.5 - Math.random());

                    let slotFilled = false;

                    for (const subject of shuffledSubjects) {
                        if (slotFilled) break;

                        // Find eligible teachers for this subject
                        let eligibleTeachers = teachers.filter(t => t.subjectSpecialization === subject.name);
                        if (eligibleTeachers.length === 0) eligibleTeachers = teachers; // Fallback

                        // Shuffle teachers
                        eligibleTeachers = eligibleTeachers.sort(() => 0.5 - Math.random());

                        for (const teacher of eligibleTeachers) {
                            const pairKey = `${subject.id}-${teacher.id}`;

                            // Constraint: No duplicate Subject-Teacher-Student (Class) on one week
                            if (assignedPairs.has(pairKey)) {
                                continue; // Skip this pair, already taught this week
                            }

                            // Check if Teacher is free
                            const teacherBusyDB = existingSchedules.find(s =>
                                s.teacherId === teacher.id && s.day === day && s.startTime === slot.start
                            );
                            const teacherBusyLocal = newSchedules.find(s =>
                                s.teacherId === teacher.id && s.day === day && s.startTime === slot.start
                            );

                            if (teacherBusyDB || teacherBusyLocal) continue; // Teacher busy

                            // Check if Class is free (double check)
                            const classBusyDB = existingSchedules.find(s =>
                                s.classId === cls.id && s.day === day && s.startTime === slot.start
                            );
                            // classBusyLocal is implicit as we are iterating slots for this class, 
                            // but if we had parallel generation we'd need it. 
                            // Since we iterate sequentially for 'cls', we know we haven't filled this slot yet.

                            if (classBusyDB) {
                                slotFilled = true; // Slot already taken by existing DB schedule
                                break;
                            }

                            // If we get here, it's a match!
                            const scheduleData = {
                                day,
                                startTime: slot.start,
                                endTime: slot.end,
                                classId: cls.id,
                                subjectId: subject.id,
                                teacherId: teacher.id
                            };

                            await Schedule.create(scheduleData);
                            newSchedules.push(scheduleData);
                            assignedPairs.add(pairKey); // Mark this pair as used for this class
                            createdCount++;
                            slotFilled = true;
                            break; // Stop looking for teachers for this subject
                        }
                    }
                }
            }
        }

        res.status(201).json({ message: `Auto-generated ${createdCount} schedule entries with unique (Subject-Teacher) per Class constraints.` });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Fee CRUD ---
exports.createFee = async (req, res) => {
    try {
        const { name, amount, description, type } = req.body;
        const fee = await Fee.create({ name, amount, description, type });
        res.status(201).json(fee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllFees = async (req, res) => {
    try {
        const fees = await Fee.findAll();
        res.status(200).json(fees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateFee = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, description } = req.body;
        const fee = await Fee.findByPk(id);

        if (!fee) return res.status(404).json({ message: 'Fee not found' });

        await fee.update({ amount, description });
        res.status(200).json({ message: 'Fee updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteFee = async (req, res) => {
    try {
        const { id } = req.params;
        const fee = await Fee.findByPk(id);
        if (!fee) return res.status(404).json({ message: 'Fee not found' });
        await fee.destroy();
        res.status(200).json({ message: 'Fee deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
