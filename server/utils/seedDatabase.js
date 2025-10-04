// server/utils/seedDatabase.js
const mongoose = require('mongoose');
const Report = require('../models/Report');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const sampleReports = [
    {
        title: 'Large pothole on Main Street',
        description: 'Dangerous pothole near the intersection causing damage to vehicles',
        issueType: 'pothole',
        status: 'pending',
        priority: 'high',
        location: {
            address: '123 Main Street, Downtown',
            district: 'downtown',
            coordinates: [34.7818, 32.0853] // Tel Aviv
        },
        images: [],
        upvotes: 15,
        downvotes: 2
    },
    {
        title: 'Street light not working',
        description: 'Multiple street lights out on North Avenue',
        issueType: 'lighting',
        status: 'in-progress',
        priority: 'medium',
        location: {
            address: '456 North Avenue, North District',
            district: 'north',
            coordinates: [34.7920, 32.0953]
        },
        images: [],
        upvotes: 8,
        downvotes: 1
    },
    {
        title: 'Blocked drainage causing flooding',
        description: 'Heavy rain causes street flooding due to blocked drains',
        issueType: 'drainage',
        status: 'resolved',
        priority: 'urgent',
        location: {
            address: '789 South Road, South District',
            district: 'south',
            coordinates: [34.7718, 32.0753]
        },
        images: [],
        upvotes: 25,
        downvotes: 0
    },
    {
        title: 'Traffic signal malfunction',
        description: 'Traffic lights not synchronized causing congestion',
        issueType: 'traffic',
        status: 'pending',
        priority: 'high',
        location: {
            address: '321 East Boulevard, East District',
            district: 'east',
            coordinates: [34.8018, 32.0853]
        },
        images: [],
        upvotes: 12,
        downvotes: 3
    },
    {
        title: 'Pothole near school entrance',
        description: 'Small but dangerous pothole right at the school gate',
        issueType: 'pothole',
        status: 'resolved',
        priority: 'urgent',
        location: {
            address: '555 School Street, Central District',
            district: 'central',
            coordinates: [34.7818, 32.0900]
        },
        images: [],
        upvotes: 30,
        downvotes: 0
    },
    {
        title: 'Park lighting issues',
        description: 'Several lights in the public park are not working',
        issueType: 'lighting',
        status: 'pending',
        priority: 'low',
        location: {
            address: '999 Park Lane, West District',
            district: 'west',
            coordinates: [34.7618, 32.0853]
        },
        images: [],
        upvotes: 5,
        downvotes: 1
    }
];

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cityfix', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await Report.deleteMany({});
        await User.deleteMany({});
        console.log('🗑️ Cleared existing data');

        // Create test user
        const hashedPassword = await bcrypt.hash('password123', 10);
        const testUser = await User.create({
            name: 'Test User',
            email: 'test@cityfix.com',
            password: hashedPassword,
            role: 'citizen',
            phoneNumber: '+1234567890'
        });

        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@cityfix.com',
            password: hashedPassword,
            role: 'admin',
            phoneNumber: '+0987654321'
        });

        console.log('👤 Created test users');

        // Create reports
        const reportsToCreate = sampleReports.map(report => ({
            ...report,
            userId: testUser._id,
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
            updatedAt: new Date()
        }));

        await Report.insertMany(reportsToCreate);
        console.log(`📝 Created ${reportsToCreate.length} sample reports`);

        // Display summary
        const stats = await Report.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('\n📊 Database Statistics:');
        console.log('------------------------');
        stats.forEach(stat => {
            console.log(`${stat._id}: ${stat.count} reports`);
        });
        console.log(`Total: ${reportsToCreate.length} reports`);
        console.log('\n✨ Database seeded successfully!');
        
        console.log('\n🔑 Test Credentials:');
        console.log('------------------------');
        console.log('User: test@cityfix.com / password123');
        console.log('Admin: admin@cityfix.com / password123');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Run the seed function
seedDatabase();