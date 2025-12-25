const { Student } = require('../models');

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