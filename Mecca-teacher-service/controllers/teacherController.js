const { Teacher, Schedule, Class, Subject, Student, Attendance, Grade } = require('../models');

// --- Schedules ---
exports.getMySchedules = async (req, res) => {
    try {
        // req.user.id is Teacher ID (from authMiddleware)
        // But wait, authMiddleware for teacher uses 'nip' lookup? 
        // Let's check authController.login. It returns `id: user.id`.
        // So req.user.id is the Teacher's primary key ID.

        const schedules = await Schedule.findAll({
            where: { teacherId: req.user.id },
            include: [
                { model: Class, attributes: ['name'] },
                { model: Subject, attributes: ['name'] }
            ]
        });
        res.status(200).json(schedules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getStudentsByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const students = await Student.findAll({
            where: { classId },
            attributes: ['id', 'name', 'nis']
        });
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Attendance ---
exports.recordAttendance = async (req, res) => {
    try {
        const { scheduleId, studentId, status, date } = req.body;
        const attendanceDate = date || new Date().toISOString().split('T')[0];

        // Verify that the teacher is assigned to this schedule
        const schedule = await Schedule.findByPk(scheduleId);
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

        if (schedule.teacherId !== req.user.id) {
            return res.status(403).json({ message: 'You are not authorized to manage attendance for this class session' });
        }

        // Check if attendance already exists for this student, schedule, and date
        const existingAttendance = await Attendance.findOne({
            where: {
                scheduleId,
                studentId,
                date: attendanceDate
            }
        });

        if (existingAttendance) {
            await existingAttendance.update({ status });
            res.status(200).json(existingAttendance);
        } else {
            const attendance = await Attendance.create({
                scheduleId,
                studentId,
                status,
                date: attendanceDate
            });
            res.status(201).json(attendance);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAttendanceByClass = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { date } = req.query;

        const schedule = await Schedule.findByPk(scheduleId);
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

        if (schedule.teacherId !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const whereClause = { scheduleId };
        if (date) {
            whereClause.date = date;
        }

        const attendance = await Attendance.findAll({
            where: whereClause,
            include: [{ model: Student, attributes: ['name', 'nis'] }]
        });

        res.status(200).json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Grades ---
exports.inputGrade = async (req, res) => {
    try {
        const { studentId, subjectId, type, score } = req.body;

        // Verify teacher teaches this subject (Simplified check: Teacher model has subjectSpecialization, but ideally we check Schedule or a TeacherSubject table)
        // For strictness as per requirement: "Hanya boleh input/update nilai siswa untuk mata pelajaran yang dipegang"
        // We can check if there is ANY schedule where this teacher teaches this subject.
        const isTeachingSubject = await Schedule.findOne({
            where: {
                teacherId: req.user.id,
                subjectId
            }
        });

        if (!isTeachingSubject) {
            return res.status(403).json({ message: 'You do not teach this subject' });
        }

        const grade = await Grade.create({
            studentId,
            subjectId,
            type,
            score
        });

        res.status(201).json(grade);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateGrade = async (req, res) => {
    try {
        const { id } = req.params;
        const { score } = req.body;

        const grade = await Grade.findByPk(id);
        if (!grade) return res.status(404).json({ message: 'Grade not found' });

        // Verify ownership (Teacher teaches the subject of this grade)
        const isTeachingSubject = await Schedule.findOne({
            where: {
                teacherId: req.user.id,
                subjectId: grade.subjectId
            }
        });

        if (!isTeachingSubject) {
            return res.status(403).json({ message: 'You do not teach this subject' });
        }

        await grade.update({ score });
        res.status(200).json({ message: 'Grade updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
