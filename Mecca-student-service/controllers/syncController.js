const { Student, Teacher, Schedule, Attendance, Grade, Class, Subject, Bill, Fee } = require('../models');

// --- SYNC STUDENTS ---
exports.syncStudentData = async (req, res) => {
    let action = 'UNKNOWN';
    try {
        const body = req.body;
        if (body.action) action = body.action;
        const data = body.data;

        console.log(`[SYNC STUDENT] Action: ${action} | Student: ${data?.name}`);

        const studentPayload = {
            id: data.id,
            nis: data.nis,
            name: data.name,
            classId: data.classId,
            parentName: data.parentName,
            parentContact: data.parentContact,
            parentEmail: data.parentEmail,
            address: data.address,
            isCatering: data.isCatering,
            isActive: data.isActive,
            password: data.password || 'managed-by-auth-service'
        };

        if (action === 'CREATE') {
            const existing = await Student.findByPk(data.id);
            if (!existing) await Student.create(studentPayload);
        } else if (action === 'UPDATE') {
            const student = await Student.findByPk(data.id);
            if (student) await student.update(studentPayload);
            else await Student.create(studentPayload);
        } else if (action === 'DELETE') {
            await Student.destroy({ where: { id: data.id } });
        }

        res.status(200).json({ message: 'Student sync successful' });
    } catch (error) {
        console.error(`[SYNC STUDENT ERROR]`, error.message);
        res.status(500).json({ message: error.message });
    }
};

// --- SYNC TEACHERS ---
exports.syncTeacherData = async (req, res) => {
    let action = 'UNKNOWN';
    try {
        const body = req.body;
        if (body.action) action = body.action;
        const data = body.data;

        console.log(`[SYNC TEACHER] Action: ${action} | NIP: ${data?.nip}`);

        const teacherPayload = {
            id: data.id,
            nip: data.nip,
            name: data.name,
            subjectSpecialization: data.subjectSpecialization,
            password: data.password || 'managed-by-auth-service'
        };

        if (action === 'CREATE') {
            const existing = await Teacher.findByPk(data.id);
            if (!existing) await Teacher.create(teacherPayload);
        } else if (action === 'UPDATE') {
            const teacher = await Teacher.findByPk(data.id);
            if (teacher) await teacher.update(teacherPayload);
            else await Teacher.create(teacherPayload);
        } else if (action === 'DELETE') {
            await Teacher.destroy({ where: { id: data.id } });
        }

        res.status(200).json({ message: 'Teacher sync successful' });
    } catch (error) {
        console.error(`[SYNC TEACHER ERROR]`, error.message);
        res.status(500).json({ message: error.message });
    }
};

// --- SYNC CLASSES ---
exports.syncClassData = async (req, res) => {
    let action = 'UNKNOWN';
    try {
        const body = req.body;
        if (body.action) action = body.action;
        const data = body.data;

        console.log(`[SYNC CLASS] Action: ${action} | ID: ${data?.id}`);

        const classPayload = {
            id: data.id,
            name: data.name,
            level: data.level,
            capacity: data.capacity
        };

        if (action === 'CREATE') {
            const existing = await Class.findByPk(data.id);
            if (!existing) await Class.create(classPayload);
        } else if (action === 'UPDATE') {
            const existing = await Class.findByPk(data.id);
            if (existing) await existing.update(classPayload);
            else await Class.create(classPayload);
        } else if (action === 'DELETE') {
            await Class.destroy({ where: { id: data.id } });
        }

        res.status(200).json({ message: 'Class sync successful' });
    } catch (error) {
        console.error(`[SYNC CLASS ERROR]`, error.message);
        res.status(500).json({ message: error.message });
    }
};

// --- SYNC SUBJECTS ---
exports.syncSubjectData = async (req, res) => {
    let action = 'UNKNOWN';
    try {
        const body = req.body;
        if (body.action) action = body.action;
        const data = body.data;

        console.log(`[SYNC SUBJECT] Action: ${action} | Code: ${data?.code}`);

        const subjectPayload = {
            id: data.id,
            name: data.name,
            code: data.code,
            level: data.level
        };

        if (action === 'CREATE') {
            const existing = await Subject.findByPk(data.id);
            if (!existing) await Subject.create(subjectPayload);
        } else if (action === 'UPDATE') {
            const existing = await Subject.findByPk(data.id);
            if (existing) await existing.update(subjectPayload);
            else await Subject.create(subjectPayload);
        } else if (action === 'DELETE') {
            await Subject.destroy({ where: { id: data.id } });
        }

        res.status(200).json({ message: 'Subject sync successful' });
    } catch (error) {
        console.error(`[SYNC SUBJECT ERROR]`, error.message);
        res.status(500).json({ message: error.message });
    }
};

// --- SYNC SCHEDULES ---
exports.syncScheduleData = async (req, res) => {
    let action = 'UNKNOWN';
    try {
        const body = req.body;
        if (body.action) action = body.action;
        const data = body.data;

        console.log(`[SYNC SCHEDULE] Action: ${action}`);

        if (action === 'BULK_CREATE') {
            await Schedule.bulkCreate(data, { 
                updateOnDuplicate: ['day', 'startTime', 'endTime', 'classId', 'subjectId', 'teacherId'] 
            });
        } else if (action === 'CREATE' || action === 'UPDATE') {
            const payload = {
                id: data.id,
                day: data.day,
                startTime: data.startTime,
                endTime: data.endTime,
                classId: data.classId,
                subjectId: data.subjectId,
                teacherId: data.teacherId
            };
            const existing = await Schedule.findByPk(data.id);
            if (existing) await existing.update(payload);
            else await Schedule.create(payload);
        } else if (action === 'DELETE') {
            await Schedule.destroy({ where: { id: data.id } });
        } else if (action === 'DELETE_ALL') {
            await Schedule.destroy({ where: {} });
        }

        res.status(200).json({ message: 'Schedule sync successful' });
    } catch (error) {
        console.error(`[SYNC SCHEDULE ERROR]`, error.message);
        res.status(500).json({ message: error.message });
    }
};

// --- SYNC ATTENDANCE (ABSENSI) ---
exports.syncAttendanceData = async (req, res) => {
    let action = 'UNKNOWN';
    try {
        const body = req.body;
        if (body.action) action = body.action;
        const data = body.data;

        console.log(`[SYNC ATTENDANCE] Action: ${action} | Student: ${data.studentId}`);

        if (action === 'CREATE' || action === 'UPDATE') {
            const payload = {
                id: data.id,
                studentId: data.studentId,
                scheduleId: data.scheduleId,
                date: data.date,
                status: data.status
                // notes dihapus (Simple Model)
            };
            
            const existing = await Attendance.findByPk(data.id);
            if (existing) {
                await existing.update(payload);
            } else {
                await Attendance.create(payload);
            }
        } else if (action === 'DELETE') {
            await Attendance.destroy({ where: { id: data.id } });
        }

        res.status(200).json({ message: 'Attendance sync successful' });
    } catch (error) {
        console.error(`[SYNC ATTENDANCE ERROR]`, error.message);
        res.status(500).json({ message: error.message });
    }
};

// --- SYNC GRADES (NILAI) ---
exports.syncGradeData = async (req, res) => {
    let action = 'UNKNOWN';
    try {
        const body = req.body;
        if (body.action) action = body.action;
        const data = body.data;

        console.log(`[SYNC GRADE] Action: ${action} | Student: ${data.studentId} | Score: ${data.score}`);

        if (action === 'CREATE' || action === 'UPDATE') {
            const payload = {
                id: data.id,
                studentId: data.studentId,
                subjectId: data.subjectId,
                type: data.type,
                score: data.score
                // semester & description dihapus (Simple Model)
            };
            
            const existing = await Grade.findByPk(data.id);
            if (existing) {
                await existing.update(payload);
            } else {
                await Grade.create(payload);
            }
        } else if (action === 'DELETE') {
            await Grade.destroy({ where: { id: data.id } });
        }

        res.status(200).json({ message: 'Grade sync successful' });
    } catch (error) {
        console.error(`[SYNC GRADE ERROR]`, error.message);
        res.status(500).json({ message: error.message });
    }
};

// --- SYNC FEES (JENIS TAGIHAN) ---
exports.syncFeeData = async (req, res) => {
    let action = 'UNKNOWN';
    try {
        const body = req.body;
        if (body.action) action = body.action;
        const data = body.data;

        console.log(`[SYNC FEE] Action: ${action} | Fee: ${data?.name}`);

        const payload = {
            id: data.id,
            name: data.name,
            amount: data.amount,
            type: data.type,
            description: data.description
        };

        if (action === 'CREATE') {
            const existing = await Fee.findByPk(data.id);
            if (!existing) await Fee.create(payload);
        } else if (action === 'UPDATE') {
            const existing = await Fee.findByPk(data.id);
            if (existing) await existing.update(payload);
            else await Fee.create(payload);
        } else if (action === 'DELETE') {
            await Fee.destroy({ where: { id: data.id } });
        }

        res.status(200).json({ message: 'Fee sync successful' });
    } catch (error) {
        console.error(`[SYNC FEE ERROR]`, error.message);
        res.status(500).json({ message: error.message });
    }
};

// --- SYNC BILLS (TAGIHAN) ---
exports.syncBillData = async (req, res) => {
    let action = 'UNKNOWN';
    try {
        const body = req.body;
        if (body.action) action = body.action;
        const data = body.data;

        console.log(`[SYNC BILL] Action: ${action}`);

        if (action === 'BULK_CREATE') {
            await Bill.bulkCreate(data, { 
                updateOnDuplicate: ['status', 'paymentProof', 'paidDate', 'updatedAt'] 
            });
        } else if (action === 'CREATE' || action === 'UPDATE') {
            const payload = {
                id: data.id,
                billNumber: data.billNumber,
                amount: data.amount,
                status: data.status,
                dueDate: data.dueDate,
                studentId: data.studentId,
                feeId: data.feeId,
                month: data.month,
                year: data.year,
                paymentProof: data.paymentProof,
                paidDate: data.paidDate
            };
            
            const existing = await Bill.findByPk(data.id);
            if (existing) {
                await existing.update(payload);
            } else {
                await Bill.create(payload);
            }
        } else if (action === 'DELETE') {
            await Bill.destroy({ where: { id: data.id } });
        }

        res.status(200).json({ message: 'Bill sync successful' });
    } catch (error) {
        console.error(`[SYNC BILL ERROR]`, error.message);
        res.status(500).json({ message: error.message });
    }
};