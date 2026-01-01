const { Student } = require('../models');
const { Class } = require('../models');
const { Teacher } = require('../models');
const { Subject } = require('../models');
const { Schedule } = require('../models');

exports.syncStudentData = async (req, res) => {
    // Deklarasikan action di luar try agar bisa diakses di catch
    let action = 'UNKNOWN'; 
    
    try {
        // Ambil data dari body
        const body = req.body;
        if (body.action) action = body.action;
        const data = body.data;

        console.log(`[SYNC RECEIVED] Action: ${action} | Student ID: ${data?.id}`);

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
            // Password dummy biar gak error validasi
            password: data.password || 'managed-by-admin-auth-service'
        };

        if (action === 'CREATE') {
            const existing = await Student.findByPk(data.id);
            if (!existing) {
                await Student.create(studentPayload);
                console.log(`[SYNC SUCCESS] Created student ${data.id}`);
            } else {
                console.log(`[SYNC INFO] Student ${data.id} already exists, skipping create.`);
            }
        } else if (action === 'UPDATE') {
            const student = await Student.findByPk(data.id);
            if (student) {
                await student.update(studentPayload);
                console.log(`[SYNC SUCCESS] Updated student ${data.id}`);
            } else {
                // Self-healing: Create jika tidak ada
                await Student.create(studentPayload);
                console.log(`[SYNC SUCCESS] Created (via Update) student ${data.id}`);
            }
        } else if (action === 'DELETE') {
            const student = await Student.findByPk(data.id);
            if (student) {
                // Gunakan force: true jika menggunakan paranoid (soft delete) tapi admin hard delete
                // Tapi standard destroy sudah cukup jika settingan DB normal
                await student.destroy();
                console.log(`[SYNC SUCCESS] Deleted student ${data.id}`);
            } else {
                console.warn(`[SYNC WARN] Student ${data.id} not found, nothing to delete.`);
            }
        }

        res.status(200).json({ message: 'Sync processed successfully' });

    } catch (error) {
        // Sekarang variabel action bisa diakses di sini
        console.error(`[SYNC ERROR] Failed to process ${action}:`, error.message);
        // Kirim detail error ke Admin biar ketahuan kenapa gagal
        res.status(500).json({ 
            message: 'Sync failed on receiver', 
            error: error.message 
        });
    }
};

exports.syncClass = async (req, res) => {
    const { action, data } = req.body;
    
    // Debugging: Cek data apa saja yang masuk
    console.log(`[SYNC CLASS] Action: ${action} | ID: ${data.id} | Level: ${data.level}`);

    try {
        // Kita siapkan payload lengkap agar semua data masuk
        const classPayload = {
            id: data.id,
            name: data.name,
            level: data.level,
            capacity: data.capacity,
            // Opsional: Jika ingin tanggal pembuatan sama persis dengan Admin
            // createdAt: data.createdAt, 
            // updatedAt: data.updatedAt
        };

        switch (action) {
        case 'CREATE':
            // Cek dulu apakah data sudah ada (untuk menghindari error Duplicate Entry)
            const existingClass = await Class.findByPk(data.id);
            if (!existingClass) {
                await Class.create(classPayload);
                console.log(`[SYNC SUCCESS] Created Class ${data.name}`);
            } else {
                console.log(`[SYNC INFO] Class ID ${data.id} already exists. Skipping.`);
            }
            break;

        case 'UPDATE':
            // Update semua field
            await Class.update(classPayload, { where: { id: data.id } });
            console.log(`[SYNC SUCCESS] Updated Class ${data.name}`);
            break;

        case 'DELETE':
            await Class.destroy({ where: { id: data.id } });
            console.log(`[SYNC SUCCESS] Deleted Class ID ${data.id}`);
            break;        

        default:
            console.warn(`Unknown action: ${action}`);
        }

        res.status(200).json({ message: 'Sync Class Success' });
    } catch (error) {
        console.error('[SYNC CLASS ERROR]', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.syncTeacher = async (req, res) => {
    const { action, data } = req.body;
    
    console.log(`[SYNC TEACHER] Action: ${action} | NIP: ${data.nip}`);

    try {
        // Payload sesuai data dari Admin
        const teacherPayload = {
            id: data.id, // Kita paksa ID sama agar relasi antar service aman
            nip: data.nip,
            name: data.name,
            password: data.password, // Simpan password hash juga biar sinkron
            subjectSpecialization: data.subjectSpecialization,
            // Field lain jika ada (email, phone, dll) sesuaikan dengan model di service ini
        };

        switch (action) {
            case 'CREATE':
                const existing = await Teacher.findOne({ where: { nip: data.nip } });
                if (!existing) {
                    await Teacher.create(teacherPayload);
                    console.log(`[SYNC SUCCESS] Created Teacher ${data.name}`);
                } else {
                    console.log(`[SYNC INFO] Teacher NIP ${data.nip} already exists.`);
                }
                break;

            case 'UPDATE':
                await Teacher.update(teacherPayload, { where: { id: data.id } });
                console.log(`[SYNC SUCCESS] Updated Teacher ${data.name}`);
                break;

            case 'DELETE':
                await Teacher.destroy({ where: { id: data.id } });
                console.log(`[SYNC SUCCESS] Deleted Teacher ID ${data.id}`);
                break;

            default:
                console.warn(`Unknown action: ${action}`);
        }

        res.status(200).json({ message: 'Sync Teacher processed' });
    } catch (error) {
        console.error('[SYNC TEACHER ERROR]', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.syncSubject = async (req, res) => {
    const { action, data } = req.body;
    console.log(`[SYNC SUBJECT] Action: ${action} | Code: ${data.code}`);

    try {
        // Payload mencakup level
        const payload = {
            id: data.id,
            name: data.name,
            code: data.code,
            level: data.level
        };

        if (action === 'CREATE') {
            const exists = await Subject.findByPk(data.id);
            if (!exists) {
                await Subject.create(payload);
                console.log(`[SYNC SUCCESS] Created Subject ${data.name}`);
            }
        } else if (action === 'UPDATE') {
            await Subject.update(payload, { where: { id: data.id } });
            console.log(`[SYNC SUCCESS] Updated Subject ${data.name}`);
        } else if (action === 'DELETE') {
            await Subject.destroy({ where: { id: data.id } });
            console.log(`[SYNC SUCCESS] Deleted Subject ID ${data.id}`);
        }
        res.status(200).json({ message: 'Sync Subject OK' });
    } catch (error) {
        console.error('[SYNC SUBJECT ERROR]', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.syncSchedule = async (req, res) => {
    const { action, data } = req.body;
    console.log(`[SYNC SCHEDULE] Action: ${action} | ID: ${data.id}`);

    try {
        const payload = {
            id: data.id,
            day: data.day,
            startTime: data.startTime,
            endTime: data.endTime,
            classId: data.classId,
            subjectId: data.subjectId,
            teacherId: data.teacherId
        };

        if (action === 'CREATE') {
            const exists = await Schedule.findByPk(data.id);
            if (!exists) {
                await Schedule.create(payload);
            }
        } else if (action === 'UPDATE') {
            const exists = await Schedule.findByPk(data.id);
            if (exists) {
                await exists.update(payload);
            }
        } else if (action === 'DELETE') {
            await Schedule.destroy({ where: { id: data.id } });
        }

        res.status(200).json({ message: 'Sync Schedule OK' });
    } catch (error) {
        console.error('[SYNC SCHEDULE ERROR]', error.message);
        res.status(500).json({ error: error.message });
    }
};