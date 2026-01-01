require('dotenv').config();
const bcrypt = require('bcrypt');
// Pastikan path ini benar mengarah ke folder models di service auth
const db = require('./models'); 

async function createAdmin() {
  try {
    console.log('🔄 Menghubungkan ke database...');

    // HACK: Pastikan koneksi menggunakan localhost jika dijalankan manual dari laptop
    // meskipun di .env mungkin sudah diset host.docker.internal untuk docker.
    if(db.sequelize.connectionManager.config.host === 'host.docker.internal') {
        db.sequelize.connectionManager.config.host = '127.0.0.1';
    }

    // Matikan SSL check (fix standar untuk local dev)
    if (db.sequelize.config && db.sequelize.config.dialectOptions) {
        delete db.sequelize.config.dialectOptions.ssl;
    }

    // 1. Siapkan Data
    const plainPassword = 'password123';
    // Di controller kamu pakai salt 8, tapi 10 lebih standar & aman. 
    // Kita pakai 10 saja tidak masalah.
    const saltRounds = 10; 
    
    console.log(`🔐 Hashing password...`);
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    // 2. Cek apakah Admin sudah ada (biar tidak duplikat)
    const existingAdmin = await db.Admin.findOne({ where: { username: 'admin' } });
    if (existingAdmin) {
        console.log('⚠️  User admin sudah ada di database!');
        process.exit(0);
    }

    // 3. Buat Admin Baru
    // Sesuai dengan exports.registerAdmin di controller kamu:
    // hanya butuh username, password, dan name.
    console.log('👤 Membuat user admin...');
    
    await db.Admin.create({
      username: 'admin',
      password: hashedPassword,
      name: 'Super Administrator'
    });

    console.log('=========================================');
    console.log('✅ SUKSES! Admin berhasil dibuat.');
    console.log('👤 Username : admin');
    console.log('📛 Name     : Super Administrator');
    console.log('🔑 Password : admin123');
    console.log('=========================================');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Gagal membuat admin:', error.message);
    process.exit(1);
  }
}

createAdmin();