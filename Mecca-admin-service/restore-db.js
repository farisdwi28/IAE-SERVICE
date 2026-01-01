// require('dotenv').config();
// const db = require('./models'); 

// async function restoreDatabase() {
//   try {
//     console.log('🔄 Mencoba koneksi ke database...');
    
//     // --- TAMBAHAN: PAKSA MATIKAN SSL ---
//     // Kita manipulasi config instance sequelize yang sudah di-load
//     if (db.sequelize.config && db.sequelize.config.dialectOptions) {
//         delete db.sequelize.config.dialectOptions.ssl;
//     }
//     // Update options di level connection manager library
//     db.sequelize.options.dialectOptions = {
//         ssl: false
//     };
//     // ------------------------------------

//     // Test koneksi
//     await db.sequelize.authenticate();
//     console.log('✅ Koneksi berhasil.');

//     console.log('⏳ Sedang membuat tabel berdasarkan Model...');

//     // force: true akan menghapus tabel lama dan buat baru
//     await db.sequelize.sync({ force: true });

//     console.log('🎉 SUKSES! Semua tabel berhasil dibuat ulang.');
//     process.exit(0);

//   } catch (error) {
//     console.error('❌ Gagal melakukan restore:', error);
//     // Tampilkan error lebih detail jika masih gagal
//     if(error.original) console.error('Detail Error:', error.original); 
//     process.exit(1);
//   }
// }

// restoreDatabase();