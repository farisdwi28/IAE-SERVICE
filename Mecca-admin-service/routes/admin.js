const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const teacherController = require('../controllers/teacherController');
const classController = require('../controllers/classController');
const subjectController = require('../controllers/subjectController');
const scheduleController = require('../controllers/scheduleController');
const feeController = require('../controllers/feeController');
const billController = require('../controllers/billController');
const notificationController = require('../controllers/notificationController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Middleware to protect all admin routes
router.use(verifyToken, checkRole(['admin']));

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     Student:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         dob:
 *           type: string
 *           format: date
 *         parentName:
 *           type: string
 *         parentContact:
 *           type: string
 *         parentEmail:
 *           type: string
 *         address:
 *           type: string
 *         isCatering:
 *           type: boolean
 *
 *     StudentCreate:
 *       type: object
 *       required: [name, parentName, parentContact]
 *       properties:
 *         name:
 *           type: string
 *         dob:
 *           type: string
 *           format: date
 *         parentName:
 *           type: string
 *         parentContact:
 *           type: string
 *         parentEmail:
 *           type: string
 *         address:
 *           type: string
 *         isCatering:
 *           type: boolean
 *
 *     Teacher:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         nip:
 *           type: string
 *         email:
 *           type: string
 *
 *     Class:
 *       type: object
 *       required: [name, level]
 *       properties:
 *         name:
 *           type: string
 *         level:
 *           type: integer
 *
 *     Subject:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:
 *           type: string
 *
 *     Schedule:
 *       type: object
 *       properties:
 *         classId:
 *           type: integer
 *         subjectId:
 *           type: integer
 *         teacherId:
 *           type: integer
 *         day:
 *           type: string
 *         startTime:
 *           type: string
 *           example: "08:00"
 *         endTime:
 *           type: string
 *           example: "09:30"
 *
 *     Fee:
 *       type: object
 *       required: [name, amount]
 *       properties:
 *         name:
 *           type: string
 *         amount:
 *           type: number
 */


// Students
/**
 * @swagger
 * /students:
 *   get:
 *     tags: [Students]
 *     summary: Get all students
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         description: Search by name or NIS
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of students
 */
router.get('/students', studentController.getAllStudents);

/**
 * @swagger
 * /students:
 *   post:
 *     tags: [Students]
 *     summary: Create new student
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentCreate'
 *     responses:
 *       201:
 *         description: Student created
 */
router.post('/students', studentController.createStudent);

/**
 * @swagger
 * /students/{id}:
 *   put:
 *     tags: [Students]
 *     summary: Update student
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       200:
 *         description: Student updated
 *       404:
 *         description: Student not found
 */
router.put('/students/:id', studentController.updateStudent);

/**
 * @swagger
 * /students/{id}:
 *   delete:
 *     tags: [Students]
 *     summary: Delete student
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Student deleted
 *       404:
 *         description: Student not found
 */
router.delete('/students/:id', studentController.deleteStudent);

/**
 * @swagger
 * /students/{id}/approve:
 *   post:
 *     tags: [Students]
 *     summary: Approve student and assign class
 *     description: Approve student registration and automatically assign class based on level
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [level]
 *             properties:
 *               level:
 *                 type: integer
 *                 example: 7
 *     responses:
 *       200:
 *         description: Student approved
 *       404:
 *         description: Student not found
 */
router.post('/students/:id/approve', studentController.approveStudent);

/**
 * @swagger
 * /students/{id}/promote:
 *   post:
 *     tags: [Students]
 *     summary: Promote student to next grade
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Student promoted
 *       404:
 *         description: Student not found
 */
router.post('/students/:id/promote', studentController.promoteStudent);

// Teachers
/**
 * @swagger
 * /teachers:
 *   get:
 *     tags: [Teachers]
 *     summary: Get all teachers
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of teachers
 */
router.get('/teachers', teacherController.getAllTeachers);

/**
 * @swagger
 * /teachers:
 *   post:
 *     tags: [Teachers]
 *     summary: Create teacher
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Teacher'
 *     responses:
 *       201:
 *         description: Teacher created
 */
router.post('/teachers', teacherController.createTeacher);

/**
 * @swagger
 * /teachers/{id}:
 *   put:
 *     tags: [Teachers]
 *     summary: Update teacher
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Teacher'
 *     responses:
 *       200:
 *         description: Teacher updated
 *       404:
 *         description: Teacher not found
 */
router.put('/teachers/:id', teacherController.updateTeacher);

/**
 * @swagger
 * /teachers/{id}:
 *   delete:
 *     tags: [Teachers]
 *     summary: Delete teacher
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Teacher deleted
 *       404:
 *         description: Teacher not found
 */
router.delete('/teachers/:id', teacherController.deleteTeacher);

// Classes
/**
 * @swagger
 * /classes:
 *   get:
 *     tags: [Classes]
 *     summary: Get all classes
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of classes
 */
router.get('/classes', classController.getAllClasses);

/**
 * @swagger
 * /classes:
 *   post:
 *     tags: [Classes]
 *     summary: Create class
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Class'
 *     responses:
 *       201:
 *         description: Class created
 */
router.post('/classes', classController.createClass);

/**
 * @swagger
 * /classes/{id}:
 *   put:
 *     tags: [Classes]
 *     summary: Update class
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Class'
 *     responses:
 *       200:
 *         description: Class updated
 */
router.put('/classes/:id', classController.updateClass);

/**
 * @swagger
 * /classes/{id}:
 *   delete:
 *     tags: [Classes]
 *     summary: Delete class
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Class deleted
 */
router.delete('/classes/:id', classController.deleteClass);

// Subjects
/**
 * @swagger
 * /subjects:
 *   get:
 *     tags: [Subjects]
 *     summary: Get all subjects
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of subjects
 */
router.get('/subjects', subjectController.getAllSubjects);

/**
 * @swagger
 * /subjects:
 *   post:
 *     tags: [Subjects]
 *     summary: Create subject
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Subject'
 *     responses:
 *       201:
 *         description: Subject created
 */
router.post('/subjects', subjectController.createSubject);

/**
 * @swagger
 * /subjects/{id}:
 *   put:
 *     tags: [Subjects]
 *     summary: Update subject
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Subject'
 *     responses:
 *       200:
 *         description: Subject updated
 */
router.put('/subjects/:id', subjectController.updateSubject);

/**
 * @swagger
 * /subjects/{id}:
 *   delete:
 *     tags: [Subjects]
 *     summary: Delete subject
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Subject deleted
 */
router.delete('/subjects/:id', subjectController.deleteSubject);

// Schedule
/**
 * @swagger
 * /schedules:
 *   get:
 *     tags: [Schedules]
 *     summary: Get schedules
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema: { type: integer }
 *       - in: query
 *         name: teacherId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of schedules
 */
router.get('/schedules', scheduleController.getAllSchedules);

/**
 * @swagger
 * /schedules:
 *   post:
 *     tags: [Schedules]
 *     summary: Create schedule
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Schedule'
 *     responses:
 *       201:
 *         description: Schedule created
 */
router.post('/schedules', scheduleController.createSchedule);

/**
 * @swagger
 * /schedules/{id}:
 *   put:
 *     tags: [Schedules]
 *     summary: Update schedule
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Schedule'
 *     responses:
 *       200:
 *         description: Schedule updated
 */
router.put('/schedules/:id', scheduleController.updateSchedule);

/**
 * @swagger
 * /schedules/{id}:
 *   delete:
 *     tags: [Schedules]
 *     summary: Delete schedule
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Schedule deleted
 */
router.delete('/schedules/:id', scheduleController.deleteSchedule);

/**
 * @swagger
 * /schedules:
 *   delete:
 *     tags: [Schedules]
 *     summary: Delete all schedules
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All schedules deleted
 */
router.delete('/schedules', scheduleController.deleteAllSchedules);

/**
 * @swagger
 * /schedules/auto-generate:
 *   post:
 *     tags: [Schedules]
 *     summary: Auto generate schedules
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Schedules generated
 */
router.post('/schedules/auto-generate', scheduleController.autoGenerateSchedule);

// Fees
/**
 * @swagger
 * /fees:
 *   get:
 *     tags: [Fees]
 *     summary: Get all fees
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of fees
 */
router.get('/fees', feeController.getAllFees);

/**
 * @swagger
 * /fees:
 *   post:
 *     tags: [Fees]
 *     summary: Create fee
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Fee'
 *     responses:
 *       201:
 *         description: Fee created
 */
router.post('/fees', feeController.createFee);

/**
 * @swagger
 * /fees/{id}:
 *   put:
 *     tags: [Fees]
 *     summary: Update fee
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Fee'
 *     responses:
 *       200:
 *         description: Fee updated
 */
router.put('/fees/:id', feeController.updateFee);

/**
 * @swagger
 * /fees/{id}:
 *   delete:
 *     tags: [Fees]
 *     summary: Delete fee
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Fee deleted
 */
router.delete('/fees/:id', feeController.deleteFee);

// Bills
/**
 * @swagger
 * /bills:
 *   get:
 *     tags: [Bills]
 *     summary: Get all bills
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: nis
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of bills
 */
router.get('/bills', billController.getAllBills);

/**
 * @swagger
 * /bills/{id}/pay:
 *   put:
 *     tags: [Bills]
 *     summary: Mark bill as paid
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Bill marked as paid
 *       404:
 *         description: Bill not found
 */
router.put('/bills/:id/pay', billController.markBillAsPaid);

/**
 * @swagger
 * /bills/{id}/remind:
 *   post:
 *     tags: [Bills]
 *     summary: Send bill payment reminder
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Reminder sent
 *       404:
 *         description: Bill not found
 */
router.post('/bills/:id/remind', billController.sendBillReminder);

// Notifications (Manual Trigger)
/**
 * @swagger
 * /notifications/check-fees:
 *   post:
 *     tags: [Notifications]
 *     summary: Trigger fee check notifications
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Fee notifications triggered
 */
router.post('/notifications/check-fees', notificationController.triggerFeeChecks);

/**
 * @swagger
 * /notifications/check-library:
 *   post:
 *     tags: [Notifications]
 *     summary: Trigger library overdue notifications
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Library notifications triggered
 */
router.post('/notifications/check-library', notificationController.triggerLibraryChecks);

/**
 * @swagger
 * /notifications/test-email:
 *   post:
 *     tags: [Notifications]
 *     summary: Send test email
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [to]
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Test email sent
 */
router.post('/notifications/test-email', notificationController.sendTestEmail);

module.exports = router;
