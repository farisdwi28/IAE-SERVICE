const { checkOverdueFees, checkOverdueLibrary } = require('../jobs/notificationScheduler');

exports.triggerFeeChecks = async (req, res) => {
    try {
        await checkOverdueFees();
        res.status(200).json({ message: 'Fee check triggered successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.triggerLibraryChecks = async (req, res) => {
    try {
        await checkOverdueLibrary();
        res.status(200).json({ message: 'Library check triggered successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.sendTestEmail = async (req, res) => {
    try {
        const { to } = req.body;
        if (!to) return res.status(400).json({ message: 'Recipient email is required' });

        const notificationService = require('../services/notificationService');
        await notificationService.sendEmail(to, 'Test Email from School Admin', 'This is a test email to verify MailerSend configuration.');

        res.status(200).json({ message: `Test email sent to ${to}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
