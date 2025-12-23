const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Middleware
router.use(verifyToken, checkRole(['teacher']));

// Schedules
/**
 * @swagger
 * /schedules:
 *   get:
 *     summary: Get my schedules
 *     tags: [Schedules]
 *     responses:
 *       200:
 *         description: List of schedules
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Schedule'
 *       500:
 *         description: Server error
 */
router.get('/schedules', teacherController.getMySchedules);
/**
 * @swagger
 * /students/{classId}:
 *   get:
 *     summary: Get students by class ID
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     responses:
 *       200:
 *         description: List of students
 *       500:
 *         description: Server error
 */
router.get('/students/:classId', teacherController.getStudentsByClass);

// Attendance
/**
 * @swagger
 * /attendance:
 *   post:
 *     summary: Record attendance
 *     tags: [Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduleId
 *               - studentId
 *               - status
 *             properties:
 *               scheduleId:
 *                 type: integer
 *               studentId:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [Present, Absent, Late, Excused]
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Attendance recorded
 *       500:
 *         description: Server error
 */
router.post('/attendance', teacherController.recordAttendance);
/**
 * @swagger
 * /attendance/{scheduleId}:
 *   get:
 *     summary: Get attendance by schedule
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schedule ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date
 *     responses:
 *       200:
 *         description: List of attendance records
 *       500:
 *         description: Server error
 */
router.get('/attendance/:scheduleId', teacherController.getAttendanceByClass);

// Grades
/**
 * @swagger
 * /grades:
 *   post:
 *     summary: Input grade
 *     tags: [Grades]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Grade'
 *     responses:
 *       201:
 *         description: Grade created
 *       500:
 *         description: Server error
 */
router.post('/grades', teacherController.inputGrade);
/**
 * @swagger
 * /grades/{id}:
 *   put:
 *     summary: Update grade
 *     tags: [Grades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Grade ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: number
 *     responses:
 *       200:
 *         description: Grade updated
 *       500:
 *         description: Server error
 */
router.put('/grades/:id', teacherController.updateGrade);

module.exports = router;
