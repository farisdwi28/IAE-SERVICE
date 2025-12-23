const { sequelize, Teacher, Student, Schedule, Grade, Attendance, Subject, Class } = require('../models');
const teacherController = require('../controllers/teacherController');

// Mock Request/Response
const mockReq = (user, body, params, query) => ({ user, body, params, query });
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

const runTest = async () => {
    console.log('Starting Integration Test: Teacher Features');

    try {
        await sequelize.authenticate();

        // Cleanup
        await Grade.destroy({ where: {} });
        await Attendance.destroy({ where: {} });
        await Schedule.destroy({ where: {} });
        await Teacher.destroy({ where: { nip: 'TEST_TEACHER' } });
        await Student.destroy({ where: { nis: 'TEST_STUDENT' } });
        await Subject.destroy({ where: { code: 'TEST_SUB' } });
        await Class.destroy({ where: { name: 'Test Class' } });

        // 1. Setup Data
        const teacher = await Teacher.create({ nip: 'TEST_TEACHER', name: 'Test Teacher', password: 'pass' });
        const cls = await Class.create({ name: 'Test Class', level: 10, capacity: 30 });
        const subject = await Subject.create({ name: 'Test Subject', code: 'TEST_SUB', level: 10 });
        const student = await Student.create({ nis: 'TEST_STUDENT', name: 'Test Student', password: 'pass', classId: cls.id, isActive: true });

        const schedule = await Schedule.create({
            day: 'Monday',
            startTime: '08:00',
            endTime: '09:00',
            classId: cls.id,
            subjectId: subject.id,
            teacherId: teacher.id
        });

        console.log('Setup Complete');

        // 2. Input Grade
        console.log('Inputting Grade...');
        const reqGrade = mockReq({ id: teacher.id }, { studentId: student.id, subjectId: subject.id, type: 'Quiz', score: 85 });
        const resGrade = mockRes();
        await teacherController.inputGrade(reqGrade, resGrade);

        if (resGrade.statusCode === 201) {
            console.log('✅ Grade Input Successful');
        } else {
            console.error('❌ Grade Input Failed:', resGrade.data);
        }

        // 3. Record Attendance
        console.log('Recording Attendance...');
        const reqAtt = mockReq({ id: teacher.id }, { scheduleId: schedule.id, studentId: student.id, status: 'Present', date: '2023-10-27' });
        const resAtt = mockRes();
        await teacherController.recordAttendance(reqAtt, resAtt);

        if (resAtt.statusCode === 201) {
            console.log('✅ Attendance Recorded');
        } else {
            console.error('❌ Attendance Failed:', resAtt.data);
        }

        // 4. Get My Schedules
        console.log('Fetching Schedules...');
        const reqSch = mockReq({ id: teacher.id });
        const resSch = mockRes();
        await teacherController.getMySchedules(reqSch, resSch);

        if (resSch.statusCode === 200 && resSch.data.length > 0) {
            console.log('✅ Schedules Fetched');
        } else {
            console.error('❌ Fetch Schedules Failed:', resSch.data);
        }

        // Cleanup
        await Grade.destroy({ where: {} });
        await Attendance.destroy({ where: {} });
        await Schedule.destroy({ where: {} });
        await Teacher.destroy({ where: { nip: 'TEST_TEACHER' } });
        await Student.destroy({ where: { nis: 'TEST_STUDENT' } });
        await Subject.destroy({ where: { code: 'TEST_SUB' } });
        await Class.destroy({ where: { name: 'Test Class' } });
        console.log('Cleanup Complete');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await sequelize.close();
    }
};

runTest();
