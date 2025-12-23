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

// Students
/**
 * @swagger
 * /students:
 *   post:
 *     summary: Create a new student
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       201:
 *         description: Student created successfully
 *       500:
 *         description: Server error
 */
router.post('/students', studentController.createStudent);
/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get all students with pagination and search
 *     tags: [Students]
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
 *         description: Search by name or NIS
 *     responses:
 *       200:
 *         description: List of students
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
 *                 students:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Student'
 *       500:
 *         description: Server error
 */
router.get('/students', studentController.getAllStudents);
/**
 * @swagger
 * /students/{id}:
 *   put:
 *     summary: Update a student
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       200:
 *         description: Student updated successfully
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
router.put('/students/:id', studentController.updateStudent);
/**
 * @swagger
 * /students/{id}:
 *   delete:
 *     summary: Delete a student
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
router.delete('/students/:id', studentController.deleteStudent);
/**
 * @swagger
 * /students/{id}/approve:
 *   post:
 *     summary: Approve a student registration
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - classId
 *             properties:
 *               classId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Student approved
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
router.post('/students/:id/approve', studentController.approveStudent);

/**
 * @swagger
 * /students/{id}/promote:
 *   post:
 *     summary: Promote a student to the next grade
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student promoted
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
router.post('/students/:id/promote', studentController.promoteStudent);

// Teachers
/**
 * @swagger
 * /teachers:
 *   post:
 *     summary: Create a new teacher
 *     tags: [Teachers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Teacher'
 *     responses:
 *       201:
 *         description: Teacher created successfully
 *       500:
 *         description: Server error
 */
router.post('/teachers', teacherController.createTeacher);
/**
 * @swagger
 * /teachers:
 *   get:
 *     summary: Get all teachers with pagination and search
 *     tags: [Teachers]
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
 *         description: Search by name or NIP
 *     responses:
 *       200:
 *         description: List of teachers
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
 *                 teachers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Teacher'
 *       500:
 *         description: Server error
 */
router.get('/teachers', teacherController.getAllTeachers);
/**
 * @swagger
 * /teachers/{id}:
 *   put:
 *     summary: Update a teacher
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Teacher ID
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
 *       500:
 *         description: Server error
 */
router.put('/teachers/:id', teacherController.updateTeacher);

/**
 * @swagger
 * /teachers/{id}:
 *   delete:
 *     summary: Delete a teacher
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Teacher ID
 *     responses:
 *       200:
 *         description: Teacher deleted
 *       404:
 *         description: Teacher not found
 *       500:
 *         description: Server error
 */
router.delete('/teachers/:id', teacherController.deleteTeacher);

// Classes
/**
 * @swagger
 * /classes:
 *   post:
 *     summary: Create a new class
 *     tags: [Classes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - level
 *             properties:
 *               name:
 *                 type: string
 *               level:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Class created
 *       500:
 *         description: Server error
 */
router.post('/classes', classController.createClass);

/**
 * @swagger
 * /classes:
 *   get:
 *     summary: Get all classes
 *     tags: [Classes]
 *     responses:
 *       200:
 *         description: List of classes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Class'
 *       500:
 *         description: Server error
 */
router.get('/classes', classController.getAllClasses);

/**
 * @swagger
 * /classes/{id}:
 *   put:
 *     summary: Update a class
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               level:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Class updated
 *       500:
 *         description: Server error
 */
router.put('/classes/:id', classController.updateClass);

/**
 * @swagger
 * /classes/{id}:
 *   delete:
 *     summary: Delete a class
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class deleted
 *       500:
 *         description: Server error
 */
router.delete('/classes/:id', classController.deleteClass);

// Subjects
/**
 * @swagger
 * /subjects:
 *   post:
 *     summary: Create a new subject
 *     tags: [Subjects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subject created
 *       500:
 *         description: Server error
 */
router.post('/subjects', subjectController.createSubject);

/**
 * @swagger
 * /subjects:
 *   get:
 *     summary: Get all subjects
 *     tags: [Subjects]
 *     responses:
 *       200:
 *         description: List of subjects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subject'
 *       500:
 *         description: Server error
 */
router.get('/subjects', subjectController.getAllSubjects);

/**
 * @swagger
 * /subjects/{id}:
 *   put:
 *     summary: Update a subject
 *     tags: [Subjects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subject updated
 *       500:
 *         description: Server error
 */
router.put('/subjects/:id', subjectController.updateSubject);

/**
 * @swagger
 * /subjects/{id}:
 *   delete:
 *     summary: Delete a subject
 *     tags: [Subjects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject deleted
 *       500:
 *         description: Server error
 */
router.delete('/subjects/:id', subjectController.deleteSubject);

// Schedule
/**
 * @swagger
 * /schedules:
 *   post:
 *     summary: Create a new schedule
 *     tags: [Schedules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Schedule'
 *     responses:
 *       201:
 *         description: Schedule created
 *       500:
 *         description: Server error
 */
router.post('/schedules', scheduleController.createSchedule);

/**
 * @swagger
 * /schedules:
 *   get:
 *     summary: Get all schedules
 *     tags: [Schedules]
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: integer
 *         description: Filter by class ID
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: integer
 *         description: Filter by teacher ID
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
router.get('/schedules', scheduleController.getAllSchedules);

/**
 * @swagger
 * /schedules/{id}:
 *   put:
 *     summary: Update a schedule
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schedule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Schedule'
 *     responses:
 *       200:
 *         description: Schedule updated
 *       500:
 *         description: Server error
 */
router.put('/schedules/:id', scheduleController.updateSchedule);

/**
 * @swagger
 * /schedules/{id}:
 *   delete:
 *     summary: Delete a schedule
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schedule ID
 *     responses:
 *       200:
 *         description: Schedule deleted
 *       500:
 *         description: Server error
 */
router.delete('/schedules/:id', scheduleController.deleteSchedule);

/**
 * @swagger
 * /schedules:
 *   delete:
 *     summary: Delete all schedules
 *     tags: [Schedules]
 *     responses:
 *       200:
 *         description: All schedules deleted
 *       500:
 *         description: Server error
 */
router.delete('/schedules', scheduleController.deleteAllSchedules);

/**
 * @swagger
 * /schedules/auto-generate:
 *   post:
 *     summary: Auto-generate schedules
 *     tags: [Schedules]
 *     responses:
 *       200:
 *         description: Schedules generated
 *       500:
 *         description: Server error
 */
router.post('/schedules/auto-generate', scheduleController.autoGenerateSchedule);

// Fees
/**
 * @swagger
 * /fees:
 *   post:
 *     summary: Create a new fee type
 *     tags: [Fees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - amount
 *             properties:
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Fee created
 *       500:
 *         description: Server error
 */
router.post('/fees', feeController.createFee);

/**
 * @swagger
 * /fees:
 *   get:
 *     summary: Get all fees
 *     tags: [Fees]
 *     responses:
 *       200:
 *         description: List of fees
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Fee'
 *       500:
 *         description: Server error
 */
router.get('/fees', feeController.getAllFees);

/**
 * @swagger
 * /fees/{id}:
 *   put:
 *     summary: Update a fee
 *     tags: [Fees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Fee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Fee updated
 *       500:
 *         description: Server error
 */
router.put('/fees/:id', feeController.updateFee);

/**
 * @swagger
 * /fees/{id}:
 *   delete:
 *     summary: Delete a fee
 *     tags: [Fees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Fee ID
 *     responses:
 *       200:
 *         description: Fee deleted
 *       500:
 *         description: Server error
 */
router.delete('/fees/:id', feeController.deleteFee);

// Bills
/**
 * @swagger
 * /bills:
 *   get:
 *     summary: Get all bills with pagination and search
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by bill number
 *       - in: query
 *         name: nis
 *         schema:
 *           type: string
 *         description: Filter by Student NIS
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
router.get('/bills', billController.getAllBills);
/**
 * @swagger
 * /bills/{id}/pay:
 *   put:
 *     summary: Mark a bill as paid
 *     tags: [Bills]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Bill ID
 *     responses:
 *       200:
 *         description: Bill marked as paid
 *       404:
 *         description: Bill not found
 *       500:
 *         description: Server error
 */
router.put('/bills/:id/pay', billController.markBillAsPaid);

/**
 * @swagger
 * /bills/{id}/remind:
 *   post:
 *     summary: Send payment reminder email
 *     tags: [Bills]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Bill ID
 *     responses:
 *       200:
 *         description: Reminder sent
 *       404:
 *         description: Bill not found
 *       500:
 *         description: Server error
 */
router.post('/bills/:id/remind', billController.sendBillReminder);

// Notifications (Manual Trigger)
/**
 * @swagger
 * /notifications/check-fees:
 *   post:
 *     summary: Manually trigger fee check notifications
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Fee checks triggered
 *       500:
 *         description: Server error
 */
router.post('/notifications/check-fees', notificationController.triggerFeeChecks);

/**
 * @swagger
 * /notifications/check-library:
 *   post:
 *     summary: Manually trigger library overdue notifications
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Library checks triggered
 *       500:
 *         description: Server error
 */
router.post('/notifications/check-library', notificationController.triggerLibraryChecks);

/**
 * @swagger
 * /notifications/test-email:
 *   post:
 *     summary: Send a test email
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Test email sent
 *       500:
 *         description: Server error
 */
router.post('/notifications/test-email', notificationController.sendTestEmail);

module.exports = router;
