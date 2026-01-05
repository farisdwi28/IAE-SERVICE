const bcrypt = require("bcrypt");
const axios = require("axios");
const {Student, Class, Fee, Bill, sequelize} = require("../models");
const {Op} = require("sequelize");

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const generatePassword = (dob) => {
	if (dob) {
		return dob.split("-").reverse().join("");
	}
	return Math.random().toString(36).slice(-8);
};

// [HELPER] Broadcast Data ke Service Lain
const broadcastToServices = async (action, data) => {
	// Daftar base URL service tujuan
	const services = ["http://student-service:3003", "http://teacher-service:3004", "http://parent-service:3005"];

	console.log(`[BROADCAST] Sending ${action} for Student ID ${data.id} to all services...`);

	// Menggunakan map untuk membuat array promise
	const syncPromises = services.map((serviceUrl) => {
		return axios
			.post(`${serviceUrl}/api/sync/students`, {
				action: action,
				data: data
			})
			.catch((err) => {
				// Log error tapi jangan biarkan satu kegagalan menghentikan yang lain
				console.error(`[BROADCAST ERROR] Gagal sync ke ${serviceUrl}:`, err.message);
			});
	});

	// Tunggu semua request selesai (sukses atau gagal)
	await Promise.all(syncPromises);
};

// ==========================================
// CONTROLLER METHODS
// ==========================================

// 1. CREATE STUDENT (Auto NIS, Password, Bill, Auth Register, Sync)
exports.createStudent = async (req, res) => {
	const t = await sequelize.transaction();
	try {
		const {name, dob, parentName, parentContact, parentEmail, address, isCatering} = req.body;

		// A. Auto-generate NIS
		const year = new Date().getFullYear();
		const random = Math.floor(1000 + Math.random() * 9000);
		const nis = `${year}${random}`;

		// B. Generate Password
		const password = generatePassword(dob);
		const hashedPassword = bcrypt.hashSync(password, 8);

		// C. Simpan di Database Admin
		const student = await Student.create(
			{
				nis,
				name,
				password: hashedPassword,
				classId: null, // Awal daftar belum punya kelas
				parentName,
				parentContact,
				parentEmail,
				address,
				isCatering,
				isActive: false // Default tidak aktif sampai di-approve
			},
			{transaction: t}
		);

		// D. Generate Tagihan Awal (Uang Gedung & SPP)
		const currentMonth = new Date().getMonth() + 1;
		const currentYear = new Date().getFullYear();
		const dueDate = new Date();
		dueDate.setMonth(dueDate.getMonth() + 1);

		const fees = await Fee.findAll({where: {name: ["Uang Gedung", "SPP"]}, transaction: t});

		for (const fee of fees) {
			await Bill.create(
				{
					billNumber: `BILL-${student.nis}-${fee.name.substr(0, 3).toUpperCase()}-${Date.now()}`,
					amount: fee.amount,
					status: "Pending",
					dueDate: dueDate,
					studentId: student.id,
					feeId: fee.id,
					month: currentMonth,
					year: currentYear
				},
				{transaction: t}
			);
		}

		// E. Register Akun ke Auth Service (GraphQL)
		try {
			const authResponse = await axios.post("http://auth-service:3001/graphql", {
				query: `
                    mutation RegisterStudent($nis: String!, $password: String!, $name: String!) {
                        registerStudent(nis: $nis, password: $password, name: $name) {
                            id
                            nis
                        }
                    }
                `,
				variables: {
					nis: nis,
					password: password, // Kirim password mentah agar user bisa login pertama kali
					name: name
				}
			});

			if (authResponse.data.errors) {
				throw new Error("Auth Service Error: " + authResponse.data.errors[0].message);
			}

			if (parentEmail) {
				const parentPassword = "parent123"; // Default password untuk orang tua
				console.log(`[AUTH] Registering Parent account for: ${parentEmail}`);

				const parentAuth = await axios.post("http://auth-service:3001/graphql", {
					query: `
                        mutation RegisterParent($email: String!, $password: String!, $name: String!) {
                            registerParent(email: $email, password: $password, name: $name) {
                                id
                                email
                            }
                        }
                    `,
					variables: {
						email: parentEmail,
						password: parentPassword,
						name: parentName || "Orang Tua"
					}
				});

				// Kita HANYA Log Warning jika gagal (misal email sudah dipakai kakak kelas)
				// Jangan throw Error agar proses create student tidak batal hanya karena parent sudah punya akun
				if (parentAuth.data.errors) {
					console.warn("[AUTH WARN] Parent registration info:", parentAuth.data.errors[0].message);
				} else {
					console.log("[AUTH SUCCESS] Parent account registered/verified.");
				}
			}
		} catch (authError) {
			console.error("Auth Service Failed:", authError.message);
			throw new Error("Gagal mendaftarkan akun di Auth Service. Transaksi dibatalkan.");
		}

		// F. Broadcast 'CREATE' ke Service Lain
		// Kita kirim data JSON plain student
		await broadcastToServices("CREATE", student.toJSON());

		// B. [FIX] Broadcast Bills (endpoint 'bills')
        if (createdBills.length > 0) {
            await broadcastToServices('bills', 'BULK_CREATE', createdBills);
        }

		await t.commit();

		res.status(201).json({
			message: "Student created successfully. Account registered (Student & Parent), bills generated, and synced.",
			data: {
				...student.toJSON(),
				defaultPassword: password,
				parentDefaultPassword: parentEmail ? "parent123" : null
			}
		});
	} catch (error) {
		await t.rollback();
		res.status(500).json({message: error.message});
	}
};

// 2. GET ALL STUDENTS (Pagination & Search)
exports.getAllStudents = async (req, res) => {
	try {
		const {page = 1, limit = 10, search = ""} = req.query;
		const offset = (page - 1) * limit;

		const whereClause = search
			? {
					[Op.or]: [{name: {[Op.like]: `%${search}%`}}, {nis: {[Op.like]: `%${search}%`}}]
			  }
			: {};

		const {count, rows} = await Student.findAndCountAll({
			where: whereClause,
			include: [{model: Class, attributes: ["name", "level"]}],
			attributes: {exclude: ["password"]},
			limit: parseInt(limit),
			offset: parseInt(offset),
			order: [["createdAt", "DESC"]]
		});

		res.status(200).json({
			totalItems: count,
			totalPages: Math.ceil(count / limit),
			currentPage: parseInt(page),
			students: rows
		});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// 3. GET STUDENT BY ID
exports.getStudentById = async (req, res) => {
	try {
		const student = await Student.findByPk(req.params.id, {
			include: [{model: Class, attributes: ["name", "level"]}],
			attributes: {exclude: ["password"]}
		});
		if (!student) return res.status(404).json({message: "Student not found"});
		res.status(200).json(student);
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// 4. APPROVE STUDENT (Assign Class + Activate + Sync)
exports.approveStudent = async (req, res) => {
	const t = await sequelize.transaction();
	try {
		const {id} = req.params;
		const {level} = req.body; // Level kelas yang diinginkan (misal: 7, 8, 9)

		const student = await Student.findByPk(id, {transaction: t});
		if (!student) {
			await t.rollback();
			return res.status(404).json({message: "Student not found"});
		}
		if (student.isActive) {
			await t.rollback();
			return res.status(400).json({message: "Student is already active"});
		}

		// Cari Kelas yang tersedia berdasarkan level & kapasitas
		const classes = await Class.findAll({where: {level}, transaction: t, lock: true});
		let assignedClass = null;

		for (const cls of classes) {
			const count = await Student.count({where: {classId: cls.id, isActive: true}, transaction: t});
			const capacity = cls.capacity || 30;
			if (count < capacity) {
				assignedClass = cls;
				break;
			}
		}

		if (!assignedClass) {
			await t.rollback();
			return res.status(400).json({message: `No available classes for level ${level}.`});
		}

		// Update status siswa
		await student.update(
			{
				isActive: true,
				classId: assignedClass.id
			},
			{transaction: t}
		);

		// Update tagihan awal jadi Paid (Opsional: Tergantung kebijakan sekolah)
		// Di sini diasumsikan saat diapprove, admin manual verifikasi pembayaran
		await Bill.update({status: "Paid", paidDate: new Date()}, {where: {studentId: student.id, status: "Pending"}, transaction: t});

		// Ambil data terbaru lengkap
		const updatedStudent = await Student.findByPk(id, {transaction: t});

		// Broadcast 'UPDATE' ke Service Lain (agar mereka tau siswa sudah aktif & punya kelas)
		await broadcastToServices("UPDATE", updatedStudent.toJSON());

		await t.commit();
		res.status(200).json({message: `Student approved into ${assignedClass.name}`, data: updatedStudent});
	} catch (error) {
		await t.rollback();
		res.status(500).json({message: error.message});
	}
};

// 5. UPDATE STUDENT (Data Diri + Sync)
exports.updateStudent = async (req, res) => {
	try {
		const {id} = req.params;
		const {name, classId, parentName, parentContact, parentEmail, address, isCatering} = req.body;

		const student = await Student.findByPk(id);
		if (!student) return res.status(404).json({message: "Student not found"});

		// Update data lokal
		await student.update({name, classId, parentName, parentContact, parentEmail, address, isCatering});

		// Ambil data fresh
		const updatedStudent = await Student.findByPk(id);

		// Broadcast 'UPDATE' data diri
		await broadcastToServices("UPDATE", updatedStudent.toJSON());

		res.status(200).json({message: "Student updated successfully", data: updatedStudent});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// 6. DELETE STUDENT (Auth Delete + Local Delete + Sync)
exports.deleteStudent = async (req, res) => {
	try {
		const {id} = req.params;
		const student = await Student.findByPk(id);
		if (!student) return res.status(404).json({message: "Student not found"});

		// Simpan data ID sebelum dihapus untuk dikirim ke broadcast
		const studentData = student.toJSON();

		console.log(`[AUTH DEBUG] Attempting to delete user with NIS: ${student.nis}`);

		try {
			const authResponse = await axios.post("http://auth-service:3001/graphql", {
				query: `
                    mutation DeleteUser($username: String!) {
                        deleteUser(username: $username)
                    }
                `,
				variables: {username: student.nis}
			});

			// Cek apakah GraphQL mengembalikan error logic (misal: User not found)
			if (authResponse.data.errors) {
				console.error("[AUTH ERROR LOGIC]", JSON.stringify(authResponse.data.errors, null, 2));
				// Opsional: throw error jika ingin membatalkan delete lokal jika auth gagal
				// throw new Error(authResponse.data.errors[0].message);
			} else {
				console.log("[AUTH SUCCESS] User deleted from Auth Service:", authResponse.data.data);
			}
		} catch (authErr) {
			// Cek apakah error dari network (koneksi putus/timeout)
			if (authErr.response) {
				console.error("[AUTH ERROR RESPONSE]", authErr.response.data);
			} else {
				console.error("[AUTH ERROR NETWORK]", authErr.message);
			}
		}

		// B. Hapus di Database Admin
		await student.destroy();

		// C. Broadcast 'DELETE' ke service lain
		await broadcastToServices("DELETE", studentData);

		res.status(200).json({message: "Student deleted successfully and synced to all services."});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// 7. PROMOTE STUDENT (Kenaikan Kelas + Sync)
exports.promoteStudent = async (req, res) => {
	const t = await sequelize.transaction();
	try {
		const {id} = req.params;
		const student = await Student.findByPk(id, {include: [Class], transaction: t});

		if (!student) {
			await t.rollback();
			return res.status(404).json({message: "Student not found"});
		}
		if (!student.Class) {
			await t.rollback();
			return res.status(400).json({message: "Student is not assigned to any class"});
		}

		const currentLevel = student.Class.level;
		const nextLevel = currentLevel + 1; // Naik ke level selanjutnya

		// Cari kelas di level selanjutnya
		const classes = await Class.findAll({
			where: {level: nextLevel},
			transaction: t,
			lock: true
		});

		let assignedClass = null;
		for (const cls of classes) {
			const count = await Student.count({
				where: {classId: cls.id, isActive: true},
				transaction: t
			});

			const capacity = cls.capacity || 30;

			if (count < capacity) {
				assignedClass = cls;
				break;
			}
		}

		if (!assignedClass) {
			await t.rollback();
			return res.status(400).json({message: `No available classes for level ${nextLevel}. Please create a new class.`});
		}

		// Update Kelas Siswa
		await student.update({classId: assignedClass.id}, {transaction: t});

		// Ambil data update untuk sync
		const promotedStudent = await Student.findByPk(id, {transaction: t});

		// Broadcast Update kenaikan kelas
		await broadcastToServices("UPDATE", promotedStudent.toJSON());

		await t.commit();

		res.status(200).json({message: `Student promoted to class ${assignedClass.name}`, data: promotedStudent});
	} catch (error) {
		await t.rollback();
		res.status(500).json({message: error.message});
	}
};
