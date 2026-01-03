const axios = require('axios');
const { Teacher, Schedule, Class, Subject, Student, Attendance, Grade } = require('../models');

// [HELPER] Broadcast ke Service Lain
const broadcastToServices = async (endpoint, action, data) => {
    const services = [
        'http://student-service:3003',
        'http://parent-service:3005',
        'http://admin-service:3002' 
    ];

    const syncPromises = services.map(serviceUrl => {
        return axios.post(`${serviceUrl}/api/sync/${endpoint}`, {
            action: action,
            data: data
        }).catch(err => {
            console.error(`Gagal sync ${endpoint} ke ${serviceUrl}:`, err.message);
        });
    });

    await Promise.all(syncPromises);
};

// --- Schedules (Jadwal) ---
exports.getMySchedules = async (req, res) => {
    try {
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

// --- Attendance (Absensi) ---
exports.recordAttendance = async (req, res) => {
    try {
        const { scheduleId, studentId, status, date } = req.body;
        const attendanceDate = date || new Date().toISOString().split('T')[0];

        const schedule = await Schedule.findByPk(scheduleId);
        if (!schedule) return res.status(404).json({ message: 'Jadwal tidak ditemukan' });

        if (schedule.teacherId !== req.user.id) {
            return res.status(403).json({ message: 'Anda tidak memiliki izin' });
        }

        const existingAttendance = await Attendance.findOne({
            where: { scheduleId, studentId, date: attendanceDate }
        });

        let attendance;
        let action;

        if (existingAttendance) {
            await existingAttendance.update({ status });
            attendance = existingAttendance;
            action = 'UPDATE';
            res.status(200).json(attendance);
        } else {
            attendance = await Attendance.create({
                scheduleId, studentId, status, date: attendanceDate
            });
            action = 'CREATE';
            res.status(201).json(attendance);
        }

        await broadcastToServices('attendance', action, attendance.toJSON());

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAttendanceByClass = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { date } = req.query;

        const schedule = await Schedule.findByPk(scheduleId);
        if (!schedule) return res.status(404).json({ message: 'Jadwal tidak ditemukan' });

        if (schedule.teacherId !== req.user.id) {
            return res.status(403).json({ message: 'Tidak diizinkan' });
        }

        const whereClause = { scheduleId };
        if (date) whereClause.date = date;

        const attendance = await Attendance.findAll({
            where: whereClause,
            include: [{ model: Student, attributes: ['name', 'nis'] }]
        });

        res.status(200).json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Grades (Nilai) ---

// [UPDATED] Ambil Nilai Siswa per Kelas
exports.getGradesByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const { subjectId, type } = req.query;

        console.log(`[GET GRADES] Class: ${classId}, Subject: ${subjectId}, Type: ${type}`);

        // Buat filter dinamis untuk Grades
        const gradeFilter = {};
        if (subjectId) gradeFilter.subjectId = subjectId;
        if (type) gradeFilter.type = type;

        const students = await Student.findAll({
            where: { classId, isActive: true },
            attributes: ['id', 'nis', 'name'],
            include: [
                {
                    model: Grade,
                    as: 'grades', // <--- PENTING: Harus match dengan models/index.js
                    required: false, // Left Join (Siswa tetap tampil meski belum ada nilai)
                    where: gradeFilter, // Filter diterapkan di sini
                    attributes: ['id', 'score', 'type', 'subjectId']
                }
            ],
            order: [['name', 'ASC']]
        });

        res.status(200).json(students);
    } catch (error) {
        console.error("Error Get Grades:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.inputGrade = async (req, res) => {
    try {
        const { studentId, subjectId, type, score } = req.body;

        const isTeachingSubject = await Schedule.findOne({
            where: { teacherId: req.user.id, subjectId }
        });

        if (!isTeachingSubject) {
            return res.status(403).json({ message: 'Anda tidak mengajar mata pelajaran ini' });
        }

        // Cek dulu apakah nilai sudah ada biar tidak duplikat (Upsert logic sederhana)
        const existingGrade = await Grade.findOne({
            where: { studentId, subjectId, type }
        });

        let grade;
        let action;

        if (existingGrade) {
            await existingGrade.update({ score });
            grade = existingGrade;
            action = 'UPDATE';
        } else {
            grade = await Grade.create({ studentId, subjectId, type, score });
            action = 'CREATE';
        }

        await broadcastToServices('grades', action, grade.toJSON());

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
        if (!grade) return res.status(404).json({ message: 'Nilai tidak ditemukan' });

        const isTeachingSubject = await Schedule.findOne({
            where: { teacherId: req.user.id, subjectId: grade.subjectId }
        });

        if (!isTeachingSubject) {
            return res.status(403).json({ message: 'Anda tidak mengajar mata pelajaran ini' });
        }

        await grade.update({ score });

        await broadcastToServices('grades', 'UPDATE', grade.toJSON());

        res.status(200).json({ message: 'Nilai berhasil diperbarui' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Profile ---
exports.getProfile = async (req, res) => {
    try {
        const teacher = await Teacher.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        res.status(200).json(teacher);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};