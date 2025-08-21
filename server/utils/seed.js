// server/utils/seed.js
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Report = require('../models/Report');

async function initializeDatabase() {
    try {
        console.log('🌱 Initializing database...');
        
        // Fix index issues
        try {
            await Report.collection.dropIndex('trackingNumber_1');
        } catch (err) {
            // Index might not exist, that's ok
        }
        
        // Create proper index
        await Report.collection.createIndex(
            { trackingNumber: 1 },
            { unique: true, sparse: true, background: true }
        );
        
        // Check if admin exists
        const adminExists = await User.findOne({ role: 'admin' });
        
        if (!adminExists) {
            // Create default admin
            const hashedPassword = await bcrypt.hash('Admin@123456', 10);
            const admin = await User.create({
                username: 'admin',
                email: 'admin@cityfix.com',
                password: hashedPassword,
                role: 'admin',
                isVerified: true,
                isActive: true
            });
            console.log('✅ Default admin created (admin@cityfix.com / Admin@123456)');
            
            // Create test citizen user
            const citizenPassword = await bcrypt.hash('User@123456', 10);
            const citizen = await User.create({
                username: 'testuser',
                email: 'user@example.com',
                password: citizenPassword,
                role: 'citizen',
                isVerified: true,
                isActive: true
            });
            console.log('✅ Test citizen created (user@example.com / User@123456)');
            
            // Create sample reports
            const sampleReports = [
                {
                    trackingNumber: 'CF' + Date.now() + '001',
                    title: 'Large pothole on Main Street',
                    description: 'There is a dangerous pothole that needs immediate attention.',
                    issueType: 'pothole',
                    status: 'pending',
                    urgency: 'high',
                    district: 'downtown',
                    address: '123 Main Street',
                    location: {
                        type: 'Point',
                        coordinates: [-74.0060, 40.7128] // NYC coordinates
                    },
                    reportedBy: citizen._id
                },
                {
                    trackingNumber: 'CF' + Date.now() + '002',
                    title: 'Street light not working',
                    description: 'The street light has been out for a week.',
                    issueType: 'lighting',
                    status: 'in-progress',
                    urgency: 'medium',
                    district: 'north-side',
                    address: '456 Oak Avenue',
                    location: {
                        type: 'Point',
                        coordinates: [-74.0059, 40.7127]
                    },
                    reportedBy: citizen._id,
                    assignedTo: admin._id
                },
                {
                    trackingNumber: 'CF' + Date.now() + '003',
                    title: 'Drainage issue causing flooding',
                    description: 'Water accumulates here during rain.',
                    issueType: 'drainage',
                    status: 'resolved',
                    urgency: 'high',
                    district: 'south-side',
                    address: '789 Park Lane',
                    location: {
                        type: 'Point',
                        coordinates: [-74.0058, 40.7126]
                    },
                    reportedBy: citizen._id,
                    assignedTo: admin._id,
                    resolution: {
                        resolvedBy: admin._id,
                        resolvedAt: new Date(),
                        resolutionNotes: 'Drainage system has been cleared and repaired.'
                    }
                }
            ];
            
            await Report.insertMany(sampleReports);
            console.log('✅ Sample reports created');
        } else {
            console.log('ℹ️ Database already initialized');
        }
        
        // Display statistics
        const userCount = await User.countDocuments();
        const reportCount = await Report.countDocuments();
        console.log(`📊 Database stats: ${userCount} users, ${reportCount} reports`);
        
    } catch (error) {
        console.error('❌ Database initialization error:', error);
    }
}

module.exports = initializeDatabase;