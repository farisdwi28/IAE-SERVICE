const { sequelize, Student, LibraryBook, LibraryLoan } = require('../models');
const studentController = require('../controllers/studentController');

// Mock Request/Response
const mockReq = (user, body, params) => ({ user, body, params });
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

const runTest = async () => {
    console.log('Starting Integration Test: Student Library Features');

    try {
        await sequelize.authenticate();

        // 1. Setup: Create Student and Book
        // Cleanup first
        await LibraryLoan.destroy({ where: {} });
        await LibraryBook.destroy({ where: { title: 'Test Book' } });
        await Student.destroy({ where: { nis: 'TEST_LIB_STUDENT' } });

        const student = await Student.create({
            nis: 'TEST_LIB_STUDENT',
            name: 'Library Student',
            password: 'pass',
            isActive: true
        });

        const book = await LibraryBook.create({
            title: 'Test Book',
            author: 'Test Author',
            stock: 1,
            isbn: '1234567890'
        });

        console.log('Created Student and Book');

        // 2. Borrow Book
        console.log('Borrowing Book...');
        const reqBorrow = mockReq({ id: student.id }, { bookId: book.id });
        const resBorrow = mockRes();
        await studentController.borrowBook(reqBorrow, resBorrow);

        if (resBorrow.statusCode === 201) {
            console.log('✅ Book Borrowed Successfully');
        } else {
            console.error('❌ Borrow Failed:', resBorrow.data);
        }

        // 3. Get My Loans
        console.log('Fetching My Loans...');
        const reqLoans = mockReq({ id: student.id });
        const resLoans = mockRes();
        await studentController.getMyLoans(reqLoans, resLoans);

        if (resLoans.statusCode === 200 && resLoans.data.length === 1 && resLoans.data[0].bookId === book.id) {
            console.log('✅ My Loans Fetched Correctly');
        } else {
            console.error('❌ Get My Loans Failed:', resLoans.data);
        }

        // 4. Return Book
        console.log('Returning Book...');
        const loanId = resLoans.data[0].id;
        const reqReturn = mockReq({ id: student.id }, { loanId });
        const resReturn = mockRes();
        await studentController.returnBook(reqReturn, resReturn);

        if (resReturn.statusCode === 200) {
            console.log('✅ Book Returned Successfully');
        } else {
            console.error('❌ Return Failed:', resReturn.data);
        }

        // 5. Verify Stock Restored
        const updatedBook = await LibraryBook.findByPk(book.id);
        if (updatedBook.stock === 1) {
            console.log('✅ Book Stock Restored');
        } else {
            console.error('❌ Stock Mismatch:', updatedBook.stock);
        }

        // Cleanup
        await LibraryLoan.destroy({ where: {} });
        await student.destroy();
        await book.destroy();
        console.log('Cleanup Complete');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await sequelize.close();
    }
};

runTest();
