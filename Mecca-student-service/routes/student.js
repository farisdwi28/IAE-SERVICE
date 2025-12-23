const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Middleware
router.use(verifyToken, checkRole(['student']));

// Profile
/**
 * @swagger
 * /profile:
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
router.get('/profile', studentController.getProfile);
/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Update student profile
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       500:
 *         description: Server error
 */
router.put('/profile', studentController.updateProfile);

// Attendance
// Attendance
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
router.get('/attendance', studentController.getAttendance);

// Grades
/**
 * @swagger
 * /grades:
 *   get:
 *     summary: Get my grades
 *     tags: [Grades]
 *     responses:
 *       200:
 *         description: List of grades
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Grade'
 *       500:
 *         description: Server error
 */
router.get('/grades', studentController.getGrades);

// Schedule
/**
 * @swagger
 * /schedule:
 *   get:
 *     summary: Get my class schedule
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
router.get('/schedule', studentController.getSchedule);

// Library
/**
 * @swagger
 * /library/loans:
 *   get:
 *     summary: Get my library loans
 *     tags: [Library]
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
 *         description: List of loans
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
 *                 loans:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LibraryLoan'
 *       500:
 *         description: Server error
 */
router.get('/library/loans', studentController.getMyLoans);
/**
 * @swagger
 * /library/books:
 *   get:
 *     summary: Get all library books
 *     tags: [Library]
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or author
 *     responses:
 *       200:
 *         description: List of books
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
 *                 books:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LibraryBook'
 *       500:
 *         description: Server error
 */
router.get('/library/books', studentController.getAllBooks);
/**
 * @swagger
 * /library/borrow:
 *   post:
 *     summary: Borrow a book
 *     tags: [Library]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookId
 *             properties:
 *               bookId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Book borrowed
 *       400:
 *         description: Book not available or limit reached
 *       500:
 *         description: Server error
 */
router.post('/library/borrow', studentController.borrowBook);

/**
 * @swagger
 * /library/return:
 *   post:
 *     summary: Return a book
 *     tags: [Library]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - loanId
 *             properties:
 *               loanId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Book returned
 *       500:
 *         description: Server error
 */
router.post('/library/return', studentController.returnBook);

// Bills
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
router.get('/bills', studentController.getBills);

module.exports = router;
