const EmailService = require('./EmailService');
const User = require('../models/User');
const { USER_ROLES } = require('../config/constants');

class NotificationService {
    constructor() {
        this.emailService = new EmailService();
    }

    async notifyNewReport(report) {
        try {
            const admins = await User.find({
                tenant: report.tenant,
                role: { $in: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN] },
                'notifications.email': true
            });

            for (const admin of admins) {
                await this.emailService.sendEmail(
                    admin.email,
                    `New Report: ${report.title}`,
                    `
                        <h2>New Report Submitted</h2>
                        <p><strong>Report #:</strong> ${report.reportNumber}</p>
                        <p><strong>Title:</strong> ${report.title}</p>
                        <p><strong>Type:</strong> ${report.type}</p>
                        <p><strong>Priority:</strong> ${report.priority}</p>
                        <p><strong>Location:</strong> ${report.location.address}</p>
                        <a href="${process.env.CLIENT_URL}/admin/reports/${report._id}">View Report</a>
                    `
                );
            }
        } catch (error) {
            console.error('Failed to send new report notifications:', error);
        }
    }

    async notifyAssignment(report, assignedUser) {
        try {
            if (assignedUser.notifications.email) {
                await this.emailService.sendAssignmentNotification(
                    assignedUser.email,
                    report
                );
            }
        } catch (error) {
            console.error('Failed to send assignment notification:', error);
        }
    }

    async notifyStatusChange(report) {
        try {
            const reporter = await User.findById(report.reporter);
            
            if (reporter && reporter.notifications.email) {
                await this.emailService.sendReportStatusUpdate(
                    reporter.email,
                    report
                );
            }
        } catch (error) {
            console.error('Failed to send status update notification:', error);
        }
    }
}

module.exports = NotificationService;