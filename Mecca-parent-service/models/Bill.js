const {DataTypes} = require("sequelize");
const sequelize = require("../config/database");

const Bill = sequelize.define(
	"Bill",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		billNumber: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false
		},
		amount: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false
		},
		status: {
			type: DataTypes.ENUM("Pending", "Paid", "Overdue", "Verifying"),
			defaultValue: "Pending"
		},
		dueDate: {
			type: DataTypes.DATEONLY,
			allowNull: false
		},
		paymentProof: {
			type: DataTypes.STRING,
			allowNull: true // Boleh kosong kalau belum bayar
		},
		paidDate: {
			type: DataTypes.DATE,
			allowNull: true
		},
		month: {
			type: DataTypes.INTEGER, // 1-12, for SPP/Catering
			allowNull: true
		},
		year: {
			type: DataTypes.INTEGER, // e.g., 2023
			allowNull: true
		}
	},
	{
		timestamps: true
	}
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Bill:
 *       type: object
 *       required:
 *         - billNumber
 *         - amount
 *         - dueDate
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the bill
 *         billNumber:
 *           type: string
 *           description: The unique bill number
 *         amount:
 *           type: number
 *           format: float
 *           description: The amount of the bill
 *         status:
 *           type: string
 *           enum: [Pending, Paid, Overdue]
 *           description: The status of the bill
 *         dueDate:
 *           type: string
 *           format: date
 *           description: The due date of the bill
 *         paidDate:
 *           type: string
 *           format: date-time
 *           description: The date when the bill was paid
 *         month:
 *           type: integer
 *           description: The month for the bill (1-12)
 *         year:
 *           type: integer
 *           description: The year for the bill
 *       example:
 *         id: 1
 *         billNumber: "BILL-20231234-SPP-10-2023"
 *         amount: 500000
 *         status: "Pending"
 *         dueDate: "2023-11-10"
 *         month: 10
 *         year: 2023
 */
module.exports = Bill;
