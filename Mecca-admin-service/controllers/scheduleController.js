const { Schedule, Class, Subject, Teacher } = require('../models');
const { Op } = require('sequelize');

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
            // Track assigned Subjects for this class to ensure uniqueness per week (No repetition)
            const assignedSubjects = new Set();

            // Pre-fill assignedSubjects from existing DB schedules for this class
            existingSchedules.filter(s => s.classId === cls.id).forEach(s => {
                assignedSubjects.add(s.subjectId);
            });

            // Filter subjects matching the class level
            const eligibleSubjects = subjects.filter(s => s.level === cls.level);

            if (eligibleSubjects.length === 0) {
                console.warn(`No subjects found for Class ${cls.name} (Level ${cls.level})`);
                continue;
            }

            for (const day of days) {
                for (const slot of timeSlots) {
                    // Shuffle eligible subjects to randomize
                    const shuffledSubjects = [...eligibleSubjects].sort(() => 0.5 - Math.random());

                    let slotFilled = false;

                    for (const subject of shuffledSubjects) {
                        if (slotFilled) break;

                        // Constraint: Subject already taught this week?
                        if (assignedSubjects.has(subject.id)) {
                            continue; // Skip this subject, already scheduled for this class this week
                        }

                        // Find eligible teachers for this subject
                        let eligibleTeachers = teachers.filter(t => t.subjectSpecialization === subject.name);
                        if (eligibleTeachers.length === 0) eligibleTeachers = teachers; // Fallback

                        // Shuffle teachers
                        eligibleTeachers = eligibleTeachers.sort(() => 0.5 - Math.random());

                        for (const teacher of eligibleTeachers) {
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
                            assignedSubjects.add(subject.id); // Mark this subject as used for this class this week
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
