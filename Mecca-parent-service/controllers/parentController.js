const axios = require("axios");
const {Student, Attendance, Schedule, Bill, Fee, Class, Subject, LibraryLoan, LibraryBook, Grade} = require("../models");
// const { Op } = require('sequelize');

const broadcastToServices = async (action, data) => {
	const services = [
		"http://admin-service:3002", // Agar Admin tahu status berubah jadi Verifying
		"http://student-service:3003" // Agar Siswa tahu orang tuanya sudah bayar
	];

	console.log(`[BROADCAST PARENT] Sending ${action} for Bill ${data.billNumber}...`);

	const syncPromises = services.map((serviceUrl) => {
		return axios
			.post(`${serviceUrl}/api/sync/bills`, {
				action: action,
				data: data
			})
			.catch((err) => {
				console.error(`Gagal sync dari Parent ke ${serviceUrl}:`, err.message);
			});
	});

	await Promise.all(syncPromises);
};
// Since Parent logs in with Student credentials, req.user.id is the Student ID.

exports.getStudentData = async (req, res) => {
	try {
		const student = await Student.findByPk(req.user.id, {
			attributes: {exclude: ["password"]},
			include: [{model: Class, attributes: ["name"]}]
		});
		res.status(200).json(student);
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

exports.getAttendance = async (req, res) => {
	try {
		const {page = 1, limit = 10} = req.query;
		const offset = (page - 1) * limit;

		const {count, rows} = await Attendance.findAndCountAll({
			where: {studentId: req.user.id},
			limit: parseInt(limit),
			offset: parseInt(offset),
			order: [["date", "DESC"]]
		});

		res.status(200).json({
			totalItems: count,
			totalPages: Math.ceil(count / limit),
			currentPage: parseInt(page),
			attendance: rows
		});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

exports.getSchedule = async (req, res) => {
	try {
		const student = await Student.findByPk(req.user.id);
		if (!student) return res.status(404).json({message: "Student not found"});

		const schedule = await Schedule.findAll({
			where: {classId: student.classId},
			include: [{model: Subject, attributes: ["name"]}]
		});
		res.status(200).json(schedule);
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

exports.getBills = async (req, res) => {
	try {
		const {page = 1, limit = 10} = req.query;
		const offset = (page - 1) * limit;

		const {count, rows} = await Bill.findAndCountAll({
			where: {studentId: req.user.id},
			include: [{model: Fee, attributes: ["name"]}],
			limit: parseInt(limit),
			offset: parseInt(offset),
			order: [["createdAt", "DESC"]]
		});

		res.status(200).json({
			totalItems: count,
			totalPages: Math.ceil(count / limit),
			currentPage: parseInt(page),
			bills: rows
		});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

exports.getLibraryLoans = async (req, res) => {
	try {
		const {page = 1, limit = 10} = req.query;
		const offset = (page - 1) * limit;

		const {count, rows} = await LibraryLoan.findAndCountAll({
			where: {studentId: req.user.id},
			include: [{model: LibraryBook, attributes: ["title", "author"]}],
			limit: parseInt(limit),
			offset: parseInt(offset),
			order: [["loanDate", "DESC"]]
		});

		res.status(200).json({
			totalItems: count,
			totalPages: Math.ceil(count / limit),
			currentPage: parseInt(page),
			loans: rows
		});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

exports.uploadPaymentProof = async (req, res) => {
    console.log("[DEBUG] Start uploadPaymentProof");
    try {
        // Cek apakah req.file ada
        if (!req.file) {
            console.error("[DEBUG ERROR] No file in req.file");
            return res.status(400).json({ message: 'No file uploaded' });
        }
        console.log("[DEBUG] File received:", req.file.path);

        const { billId } = req.body;
        console.log("[DEBUG] Bill ID form body:", billId);

        if (!billId) {
             console.error("[DEBUG ERROR] Bill ID is missing");
             return res.status(400).json({ message: 'Bill ID is missing' });
        }

        const bill = await Bill.findByPk(billId);
        if (!bill) {
            console.error("[DEBUG ERROR] Bill not found in DB");
            return res.status(404).json({ message: 'Bill not found' });
        }

        console.log("[DEBUG] Bill found, updating...");
        
        // Update DB
        await bill.update({
            status: 'Verifying',
            paymentProof: req.file.path
        });
        console.log("[DEBUG] DB Updated.");

        // Broadcast
        await broadcastToServices('UPDATE', bill.toJSON());
        console.log("[DEBUG] Broadcast done.");

        res.status(200).json({ message: 'Payment proof uploaded successfully' });
    } catch (error) {
        console.error("[DEBUG FATAL ERROR]", error); // <--- INI YG KITA CARI
        res.status(500).json({ message: error.message, stack: error.stack });
    }
};

exports.toggleCatering = async (req, res) => {
	try {
		const {isCatering} = req.body; // boolean

		const student = await Student.findByPk(req.user.id);
		if (!student) return res.status(404).json({message: "Student not found"});

		await student.update({isCatering});

		if (isCatering) {
			const currentMonth = new Date().getMonth() + 1;
			const currentYear = new Date().getFullYear();

			const cateringFee = await Fee.findOne({where: {name: "Katering"}}); // Assuming name is 'Katering'

			if (cateringFee) {
				const existingBill = await Bill.findOne({
					where: {
						studentId: student.id,
						feeId: cateringFee.id,
						month: currentMonth,
						year: currentYear
					}
				});

				if (!existingBill) {
					const dueDate = new Date();
					dueDate.setMonth(dueDate.getMonth() + 1);

					await Bill.create({
						billNumber: `BILL-${student.nis}-CAT-${currentMonth}-${currentYear}`,
						amount: cateringFee.amount,
						status: "Pending",
						dueDate: dueDate,
						studentId: student.id,
						feeId: cateringFee.id,
						month: currentMonth,
						year: currentYear
					});
				}
			}
		}

		res.status(200).json({message: `Catering status updated to ${isCatering}`});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// --- [BARU] Grades (Nilai) ---
exports.getGrades = async (req, res) => {
	try {
		const grades = await Grade.findAll({
			where: {studentId: req.user.id}
		});

		if (!grades.length) return res.status(200).json([]);

		// Manual Fetch Subject Name
		const subjectIds = [...new Set(grades.map((g) => g.subjectId))];
		const subjects = await Subject.findAll({where: {id: subjectIds}});

		const subjectMap = {};
		subjects.forEach((s) => {
			subjectMap[s.id] = s.name;
		});

		const result = grades.map((g) => ({
			...g.toJSON(),
			subjectName: subjectMap[g.subjectId] || "Unknown Subject"
		}));

		res.status(200).json(result);
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};
