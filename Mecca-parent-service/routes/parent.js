const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Middleware
router.use(verifyToken, checkRole(['parent']));

/**
 * @swagger
 * /student:
 *   get:
 *     summary: Get logged-in student profile
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Student profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       500:
 *         description: Server error
 */
router.get('/student', parentController.getStudentData);
/**
 * @swagger
 * /attendance:
 *   get:
 *     summary: Get attendance records
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of attendance records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalItems:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 attendance:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Attendance'
 *       500:
 *         description: Server error
 */
router.get('/attendance', parentController.getAttendance);
/**
 * @swagger
 * /schedule:
 *   get:
 *     summary: Get student's class schedule
 *     tags: [Schedule]
 *     responses:
 *       200:
 *         description: Weekly schedule
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Schedule'
 *       500:
 *         description: Server error
 */
router.get('/schedule', parentController.getSchedule);
/**
 * @swagger
 * /bills:
 *   get:
 *     summary: Get bills
 *     tags: [Bills]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of bills
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalItems:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 bills:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Bill'
 *       500:
 *         description: Server error
 */
router.get('/bills', parentController.getBills);
/**
 * @swagger
 * /library:
 *   get:
 *     summary: Get student's library loans
 *     tags: [Library]
 *     responses:
 *       200:
 *         description: List of loans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LibraryLoan'
 *       500:
 *         description: Server error
 */
router.get('/library', parentController.getLibraryLoans);
const upload = require('../middleware/upload');

/**
 * @swagger
 * /payment-proof:
 *   post:
 *     summary: Upload payment proof
 *     tags: [Bills]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               proof:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Proof uploaded
 *       500:
 *         description: Server error
 */
router.post('/payment-proof', upload.single('proof'), parentController.uploadPaymentProof);
/**
 * @swagger
 * /catering:
 *   put:
 *     summary: Toggle catering subscription
 *     tags: [Catering]
 *     responses:
 *       200:
 *         description: Catering status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isCatering:
 *                   type: boolean
 *       500:
 *         description: Server error
 */
router.put('/catering', parentController.toggleCatering);

router.get('/grades', parentController.getGrades);

module.exports = router;
