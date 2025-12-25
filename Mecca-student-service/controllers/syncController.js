const { Student } = require('../models');

exports.syncStudentData = async (req, res) => {
    try {
        const { action, data } = req.body;
        console.log(`[SYNC RECEIVED] Action: ${action} | Student: ${data.name}`);

        if (action === 'CREATE') {
            // Cek dulu apakah data sudah ada (idempotency)
            const existing = await Student.findByPk(data.id);
            if (!existing) {
                await Student.create({
                    id: data.id, // PENTING: Pakai ID dari Admin
                    nis: data.nis,
                    name: data.name,
                    classId: data.classId,
                    parentName: data.parentName,
                    isActive: data.isActive
                });
            }
        } else if (action === 'UPDATE') {
            const student = await Student.findByPk(data.id);
            if (student) {
                await student.update({
                    name: data.name,
                    classId: data.classId,
                    parentName: data.parentName,
                    isActive: data.isActive
                });
            } else {
                // Jika update data tapi di sini belum ada, buat baru saja
                await Student.create({
                    id: data.id,
                    nis: data.nis,
                    name: data.name,
                    classId: data.classId,
                    parentName: data.parentName,
                    isActive: data.isActive
                });
            }
        }

        res.status(200).json({ message: 'Synchronization successful' });
    } catch (error) {
        console.error('[SYNC ERROR]', error);
        res.status(500).json({ message: error.message });
    }
};