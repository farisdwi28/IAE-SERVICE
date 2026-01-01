const { Schedule, Class, Subject, Teacher } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');

// ==========================================
// HELPER: BROADCAST SYNC
// ==========================================
const broadcastSchedule = async (action, data) => {
    const services = [
        'http://student-service:3003/api/sync/schedules',
        'http://teacher-service:3004/api/sync/schedules',
        'http://parent-service:3005/api/sync/schedules'
    ];

    console.log(`[BROADCAST] Sending ${action} Schedule ID ${data.id || 'Batch'}...`);

    const requests = services.map(url => 
        axios.post(url, { action, data })
            .catch(err => console.error(`[BROADCAST FAIL] ${url}: ${err.message}`))
    );

    await Promise.all(requests);
};

// ==========================================
// CONTROLLER METHODS
// ==========================================

exports.createSchedule = async (req, res) => {
    try {
        const { day, startTime, endTime, classId, subjectId, teacherId } = req.body;

        // 1. Conflict Detection (Logic Kamu)
        const conflict = await Schedule.findOne({
            where: {
                day,
                [Op.or]: [
                    { startTime: { [Op.between]: [startTime, endTime] } },
                    { endTime: { [Op.between]: [startTime, endTime] } }
                ],
                [Op.or]: [
                    { classId },   // Kelas sibuk
                    { teacherId }  // Guru sibuk
                ]
            }
        });

        if (conflict) {
            return res.status(400).json({ message: 'Schedule conflict detected! Class or Teacher is busy.' });
        }

        // 2. Create Schedule
        const schedule = await Schedule.create({
            day, startTime, endTime, classId, subjectId, teacherId
        });

        // 3. Ambil data lengkap dengan relasi untuk Broadcast (Opsional, tapi bagus untuk UI client)
        // Agar penerima tau nama Subject/Class/Teacher langsung
        const fullSchedule = await Schedule.findByPk(schedule.id, {
            include: [Class, Subject, Teacher]
        });

        // 4. Broadcast
        await broadcastSchedule('CREATE', fullSchedule.toJSON());

        res.status(201).json(fullSchedule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllSchedules = async (req, res) => {
    try {
        const { classId, teacherId, day } = req.query;
        const whereClause = {};

        if (classId) whereClause.classId = classId;
        if (teacherId) whereClause.teacherId = teacherId;
        if (day) whereClause.day = day;

        const schedules = await Schedule.findAll({
            where: whereClause,
            include: [
                { model: Class, attributes: ['name'] },
                { model: Subject, attributes: ['name', 'code'] },
                { model: Teacher, attributes: ['name'] }
            ],
            order: [['day', 'ASC'], ['startTime', 'ASC']]
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

        // Update Lokal
        await schedule.update({ day, startTime, endTime, classId, subjectId, teacherId });
        
        // Broadcast Update
        await broadcastSchedule('UPDATE', schedule.toJSON());

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
        
        const scheduleData = schedule.toJSON();

        // Delete Lokal
        await schedule.destroy();

        // Broadcast Delete
        await broadcastSchedule('DELETE', scheduleData);

        res.status(200).json({ message: 'Schedule deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteAllSchedules = async (req, res) => {
    try {
        // Hapus semua data
        await Schedule.destroy({ where: {} });
        
        // Broadcast Delete All (Kita kirim special action atau looping delete - ini simplenya)
        // Di microservice pattern, delete all agak tricky.
        // Untuk sekarang kita asumsikan admin mereset manual di tiap service kalau hard reset.
        // Atau kita bisa kirim flag khusus.
        console.log('[WARNING] Delete All Schedules triggered locally only.');

        res.status(200).json({ message: 'All schedules deleted successfully (Local)' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- AUTO GENERATOR (Dengan Broadcast) ---
exports.autoGenerateSchedule = async (req, res) => {
    try {
        // 1. Fetch Data
        const classes = await Class.findAll();
        const subjects = await Subject.findAll();
        const teachers = await Teacher.findAll();

        if (classes.length === 0 || subjects.length === 0 || teachers.length === 0) {
            return res.status(400).json({ message: 'Ensure classes, subjects, and teachers exist.' });
        }

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const timeSlots = [
            { start: '08:00', end: '09:30' },
            { start: '10:00', end: '11:30' },
            { start: '13:00', end: '14:30' },
            { start: '15:00', end: '16:30' }
        ];

        let createdCount = 0;
        const existingSchedules = await Schedule.findAll();
        // Buffer untuk menyimpan jadwal baru lokal agar tidak bentrok dengan diri sendiri saat looping
        const newlyCreatedBuffer = []; 

        for (const cls of classes) {
            const assignedSubjects = new Set();
            
            // Cek existing DB
            existingSchedules.filter(s => s.classId === cls.id).forEach(s => assignedSubjects.add(s.subjectId));

            // Filter mapel sesuai level kelas
            const eligibleSubjects = subjects.filter(s => s.level === cls.level);
            if (eligibleSubjects.length === 0) continue;

            for (const day of days) {
                for (const slot of timeSlots) {
                    const shuffledSubjects = [...eligibleSubjects].sort(() => 0.5 - Math.random());
                    let slotFilled = false;

                    for (const subject of shuffledSubjects) {
                        if (slotFilled) break;
                        if (assignedSubjects.has(subject.id)) continue; // Mapel sudah ada minggu ini

                        // Cari guru yg cocok
                        let eligibleTeachers = teachers.filter(t => t.subjectSpecialization === subject.name);
                        if (eligibleTeachers.length === 0) eligibleTeachers = teachers; // Fallback
                        eligibleTeachers = eligibleTeachers.sort(() => 0.5 - Math.random());

                        for (const teacher of eligibleTeachers) {
                            // Cek Bentrok di DB
                            const teacherBusyDB = existingSchedules.find(s => s.teacherId === teacher.id && s.day === day && s.startTime === slot.start);
                            const classBusyDB = existingSchedules.find(s => s.classId === cls.id && s.day === day && s.startTime === slot.start);
                            
                            // Cek Bentrok di Buffer (Jadwal yg baru saja dibuat di loop ini)
                            const teacherBusyLocal = newlyCreatedBuffer.find(s => s.teacherId === teacher.id && s.day === day && s.startTime === slot.start);
                            
                            if (teacherBusyDB || classBusyDB || teacherBusyLocal) continue;

                            // Create Schedule
                            const scheduleData = {
                                day,
                                startTime: slot.start,
                                endTime: slot.end,
                                classId: cls.id,
                                subjectId: subject.id,
                                teacherId: teacher.id
                            };

                            const newSchedule = await Schedule.create(scheduleData);
                            
                            // Masukkan ke buffer
                            newlyCreatedBuffer.push(newSchedule.toJSON());
                            assignedSubjects.add(subject.id);
                            createdCount++;
                            slotFilled = true;

                            // [PENTING] Broadcast langsung!
                            // Note: Di production, ini sebaiknya pakai antrian (Queue) agar tidak spam HTTP request
                            // Tapi untuk prototype, ini oke.
                            await broadcastSchedule('CREATE', newSchedule.toJSON());

                            break; // Stop cari guru
                        }
                    }
                }
            }
        }

        res.status(201).json({ message: `Auto-generated ${createdCount} schedule entries and synced to services.` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};