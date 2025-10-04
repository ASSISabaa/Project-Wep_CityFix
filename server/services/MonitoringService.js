const os = require('os');
const mongoose = require('mongoose');
const { getRedisClient } = require('../config/redis');

class MonitoringService {
    constructor() {
        this.startTime = Date.now();
        this.requestCount = 0;
        this.errorCount = 0;
        this.responseTimeSum = 0;
    }

    trackRequest(responseTime) {
        this.requestCount++;
        this.responseTimeSum += responseTime;
    }

    trackError() {
        this.errorCount++;
    }

    async getSystemHealth() {
        const uptime = Date.now() - this.startTime;
        const memoryUsage = process.memoryUsage();
        const cpuUsage = os.loadavg();

        return {
            status: 'healthy',
            uptime: Math.floor(uptime / 1000),
            timestamp: new Date().toISOString(),
            system: {
                platform: os.platform(),
                nodeVersion: process.version,
                memory: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    used: memoryUsage.heapUsed,
                    percentage: Math.round((memoryUsage.heapUsed / os.totalmem()) * 100)
                },
                cpu: {
                    cores: os.cpus().length,
                    loadAverage: cpuUsage,
                    model: os.cpus()[0].model
                }
            },
            services: {
                database: await this.checkDatabase(),
                redis: await this.checkRedis(),
                storage: await this.checkStorage()
            },
            metrics: {
                requests: this.requestCount,
                errors: this.errorCount,
                errorRate: this.requestCount > 0 
                    ? (this.errorCount / this.requestCount * 100).toFixed(2) + '%'
                    : '0%',
                avgResponseTime: this.requestCount > 0
                    ? Math.round(this.responseTimeSum / this.requestCount) + 'ms'
                    : '0ms'
            }
        };
    }

    async checkDatabase() {
        try {
            const state = mongoose.connection.readyState;
            const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
            
            if (state === 1) {
                const adminDb = mongoose.connection.db.admin();
                const info = await adminDb.ping();
                return {
                    status: 'connected',
                    responseTime: info.ok ? 'fast' : 'slow',
                    collections: mongoose.connection.db.collections.length
                };
            }
            
            return {
                status: states[state] || 'unknown',
                error: 'Not connected'
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    async checkRedis() {
        try {
            const redisClient = getRedisClient();
            
            if (!redisClient) {
                return {
                    status: 'disabled',
                    message: 'Redis not configured'
                };
            }

            if (redisClient.isOpen) {
                await redisClient.ping();
                return {
                    status: 'connected',
                    responseTime: 'fast'
                };
            }

            return {
                status: 'disconnected'
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    async checkStorage() {
        const stats = await require('fs').promises.statfs('./uploads').catch(() => null);
        
        if (stats) {
            const totalSpace = stats.blocks * stats.bsize;
            const freeSpace = stats.bavail * stats.bsize;
            const usedPercentage = ((totalSpace - freeSpace) / totalSpace * 100).toFixed(2);

            return {
                status: 'available',
                totalSpace: `${(totalSpace / (1024 ** 3)).toFixed(2)} GB`,
                freeSpace: `${(freeSpace / (1024 ** 3)).toFixed(2)} GB`,
                usedPercentage: usedPercentage + '%'
            };
        }

        return {
            status: 'unknown'
        };
    }

    async getDetailedMetrics() {
        const Report = require('../models/Report');
        const User = require('../models/User');
        const Tenant = require('../models/Tenant');

        const [totalReports, totalUsers, totalTenants] = await Promise.all([
            Report.countDocuments(),
            User.countDocuments(),
            Tenant.countDocuments()
        ]);

        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const [reportsLast24h, newUsersLast24h] = await Promise.all([
            Report.countDocuments({ createdAt: { $gte: last24Hours } }),
            User.countDocuments({ createdAt: { $gte: last24Hours } })
        ]);

        return {
            database: {
                reports: {
                    total: totalReports,
                    last24Hours: reportsLast24h
                },
                users: {
                    total: totalUsers,
                    last24Hours: newUsersLast24h
                },
                tenants: totalTenants
            },
            performance: {
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage()
            }
        };
    }
}

module.exports = new MonitoringService();