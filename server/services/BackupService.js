const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class BackupService {
    constructor() {
        this.backupDir = path.join(__dirname, '../backups');
        this.ensureBackupDirectory();
    }

    async ensureBackupDirectory() {
        try {
            await fs.mkdir(this.backupDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create backup directory:', error);
        }
    }

    async backupDatabase() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.gz`;
        const filepath = path.join(this.backupDir, filename);

        try {
            const mongoUri = process.env.MONGODB_URI;
            const command = `mongodump --uri="${mongoUri}" --archive="${filepath}" --gzip`;
            
            await execAsync(command);
            
            const stats = await fs.stat(filepath);
            
            return {
                success: true,
                filename,
                size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
                timestamp,
                path: filepath
            };
        } catch (error) {
            console.error('Backup failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async restoreDatabase(filename) {
        const filepath = path.join(this.backupDir, filename);

        try {
            await fs.access(filepath);
            
            const mongoUri = process.env.MONGODB_URI;
            const command = `mongorestore --uri="${mongoUri}" --archive="${filepath}" --gzip --drop`;
            
            await execAsync(command);
            
            return {
                success: true,
                message: 'Database restored successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async listBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backups = [];

            for (const file of files) {
                if (file.endsWith('.gz')) {
                    const filepath = path.join(this.backupDir, file);
                    const stats = await fs.stat(filepath);
                    
                    backups.push({
                        filename: file,
                        size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
                        created: stats.birthtime,
                        modified: stats.mtime
                    });
                }
            }

            return backups.sort((a, b) => b.created - a.created);
        } catch (error) {
            return [];
        }
    }

    async deleteOldBackups(daysToKeep = 30) {
        const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
        const backups = await this.listBackups();
        let deletedCount = 0;

        for (const backup of backups) {
            if (backup.created < cutoffDate) {
                try {
                    await fs.unlink(path.join(this.backupDir, backup.filename));
                    deletedCount++;
                } catch (error) {
                    console.error(`Failed to delete backup ${backup.filename}:`, error);
                }
            }
        }

        return {
            deleted: deletedCount,
            remaining: backups.length - deletedCount
        };
    }

    async exportData(format = 'json') {
        const Report = require('../models/Report');
        const User = require('../models/User');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `export-${timestamp}.${format}`;
        const filepath = path.join(this.backupDir, filename);

        try {
            const [reports, users] = await Promise.all([
                Report.find().lean(),
                User.find().select('-password').lean()
            ]);

            const data = {
                exportDate: new Date().toISOString(),
                reports,
                users,
                statistics: {
                    totalReports: reports.length,
                    totalUsers: users.length
                }
            };

            if (format === 'json') {
                await fs.writeFile(filepath, JSON.stringify(data, null, 2));
            }

            return {
                success: true,
                filename,
                path: filepath
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new BackupService();