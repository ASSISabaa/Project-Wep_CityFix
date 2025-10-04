const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class SocketManager {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map();
    }

    initialize(server) {
        this.io = socketIO(server, {
            cors: {
                origin: process.env.CLIENT_URL || '*',
                credentials: true
            }
        });

        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                const user = await User.findById(decoded._id)
                    .select('_id username email role tenant');
                
                if (!user) {
                    return next(new Error('Authentication failed'));
                }

                socket.userId = user._id.toString();
                socket.user = user;
                socket.tenantId = user.tenant?.toString();
                
                next();
            } catch (error) {
                next(new Error('Authentication failed'));
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`User ${socket.user.username} connected`);
            
            this.connectedUsers.set(socket.userId, socket.id);
            
            if (socket.tenantId) {
                socket.join(`tenant:${socket.tenantId}`);
            }
            
            socket.join(`user:${socket.userId}`);

            socket.on('join-report', (reportId) => {
                socket.join(`report:${reportId}`);
            });

            socket.on('leave-report', (reportId) => {
                socket.leave(`report:${reportId}`);
            });

            socket.on('disconnect', () => {
                console.log(`User ${socket.user.username} disconnected`);
                this.connectedUsers.delete(socket.userId);
            });
        });
    }

    notifyUser(userId, event, data) {
        this.io.to(`user:${userId}`).emit(event, data);
    }

    notifyTenant(tenantId, event, data) {
        this.io.to(`tenant:${tenantId}`).emit(event, data);
    }

    notifyReport(reportId, event, data) {
        this.io.to(`report:${reportId}`).emit(event, data);
    }

    broadcastToAll(event, data) {
        this.io.emit(event, data);
    }
}

module.exports = new SocketManager();