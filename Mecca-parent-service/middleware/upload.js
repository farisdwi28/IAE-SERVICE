const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Pastikan folder uploads ada
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDir); // Simpan di folder 'uploads' di root project
	},
	filename: (req, file, cb) => {
		// Format nama file: BILLID-TIMESTAMP.ext
		// Contoh: BILL-102-170988212.jpg
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		const ext = path.extname(file.originalname);
		cb(null, file.fieldname + "-" + uniqueSuffix + ext);
	}
});

const fileFilter = (req, file, cb) => {
	if (file.mimetype.startsWith("image/")) {
		cb(null, true);
	} else {
		cb(new Error("Only images are allowed!"), false);
	}
};

const upload = multer({
	storage: storage,
	limits: {fileSize: 5 * 1024 * 1024}, // Limit 5MB
	fileFilter: fileFilter
});

module.exports = upload;
