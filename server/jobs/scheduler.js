const cron = require('node-cron');
const BackupService = require('../services/BackupService');
const MonitoringService = require('../services/MonitoringService');
const EmailService = require('../services/EmailService');
const Report = require('../models/Report');
const User = require('../models/User');

class Scheduler {
    constructor() {
        this.jobs = new Map();
    }

    start() {
        // Daily backup at 2 AM
        this.addJob('daily-backup', '0 2 * * *', async () => {
            console.log('Starting daily backup...');
            const result = await BackupService.backupDatabase();
            if (result.success) {
                console.log(`Backup completed: ${result.filename}`);
            } else {
                console.error('Backup failed:', result.error);
            }
        });

        // Clean old backups weekly
        this.addJob('cleanup-backups', '0 3 * * 0', async () => {
            console.log('Cleaning old backups...');
            const result = await BackupService.deleteOldBackups(30);
            console.log(`Deleted ${result.deleted} old backups`);
        });

        // Send daily summary email to admins
        this.addJob('daily-summary', '0 9 * * *', async () => {
            await this.sendDailySummary();
        });

        // Update statistics every hour
        this.addJob('update-stats', '0 * * * *', async () => {
            await this.updateStatistics();
        });

        // Check for stale reports every 6 hours
        this.addJob('check-stale', '0 */6 * * *', async () => {
            await this.checkStaleReports();
        });

        console.log('Scheduler started with', this.jobs.size, 'jobs');
    }

    addJob(name, schedule, task) {
        if (this.jobs.has(name)) {
            this.jobs.get(name).stop();
        }

        const job = cron.schedule(schedule, task, {
            scheduled: true,
            timezone: process.env.TIMEZONE || 'UTC'
        });

        this.jobs.set(name, job);
        return job;
    }

    async sendDailySummary() {
        try {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            
            const [newReports, resolvedReports, newUsers] = await Promise.all([
                Report.countDocuments({ createdAt: { $gte: yesterday } }),
                Report.countDocuments({ 
                    'resolution.resolvedAt': { $gte: yesterday }
                }),
                User.countDocuments({ createdAt: { $gte: yesterday } })
            ]);

            const admins = await User.find({
                role: { $in: ['superAdmin', 'admin'] },
                'notifications.email': true
            });

            const emailService = new EmailService();
            
            for (const admin of admins) {
                const html = `
                    <h2>Daily Summary - ${new Date().toDateString()}</h2>
                    <ul>
                        <li>New Reports: ${newReports}</li>
                        <li>Resolved Reports: ${resolvedReports}</li>
                        <li>New Users: ${newUsers}</li>
                    </ul>
                    <p>Login to view details: ${process.env.CLIENT_URL}/dashboard</p>
                `;

                await emailService.sendEmail(
                    admin.email,
                    'CityFix Daily Summary',
                    html
                );
            }

            console.log('Daily summary sent to', admins.length, 'admins');
        } catch (error) {
            console.error('Failed to send daily summary:', error);
        }
    }

    async updateStatistics() {
        try {
            const Tenant = require('../models/Tenant');
            const tenants = await Tenant.find({ isActive: true });

            for (const tenant of tenants) {
                const [totalReports, resolvedReports, activeUsers] = await Promise.all([
                    Report.countDocuments({ tenant: tenant._id }),
                    Report.countDocuments({ 
                        tenant: tenant._id,
                        status: 'resolved'
                    }),
                    User.countDocuments({
                        tenant: tenant._id,
                        isActive: true
                    })
                ]);

                tenant.statistics = {
                    totalReports,
                    resolvedReports,
                    activeUsers,
                    avgResolutionTime: await this.calculateAvgResolutionTime(tenant._id)
                };

                await tenant.save();
            }

            console.log('Statistics updated for', tenants.length, 'tenants');
        } catch (error) {
            console.error('Failed to update statistics:', error);
        }
    }

    async calculateAvgResolutionTime(tenantId) {
        const reports = await Report.find({
            tenant: tenantId,
            'resolution.resolutionTime': { $exists: true }
        }).select('resolution.resolutionTime');

        if (reports.length === 0) return 0;

        const total = reports.reduce((sum, report) => 
            sum + report.resolution.resolutionTime, 0
        );

        return Math.round(total / reports.length);
    }

    async checkStaleReports() {
        try {
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            
            const staleReports = await Report.find({
                status: 'new',
                createdAt: { $lte: threeDaysAgo }
            }).populate('reporter tenant');

            console.log(`Found ${staleReports.length} stale reports`);

            // Auto-assign to available employees
            for (const report of staleReports) {
                const employee = await User.findOne({
                    tenant: report.tenant,
                    role: 'employee',
                    isActive: true
                }).sort('statistics.reportsAssigned');

                if (employee) {
                    report.status = 'assigned';
                    report.assignedTo = employee._id;
                    report.timeline.push({
                        status: 'assigned',
                        comment: 'Auto-assigned due to age',
                        timestamp: new Date()
                    });
                    
                    await report.save();
                    
                    // Send notification
                    const emailService = new EmailService();
                    await emailService.sendAssignmentNotification(
                        employee.email,
                        report
                    );
                }
            }
        } catch (error) {
            console.error('Failed to check stale reports:', error);
        }
    }

    stop() {
        this.jobs.forEach((job, name) => {
            job.stop();
            console.log(`Stopped job: ${name}`);
        });
        this.jobs.clear();
    }
}

module.exports = new Scheduler();