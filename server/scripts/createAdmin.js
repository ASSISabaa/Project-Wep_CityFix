// server/scripts/createAdmin.js
// Script to create a new admin user

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

async function createAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cityfix');
        console.log('✅ Connected to MongoDB');

        // Admin credentials
        const adminData = {
            username: 'admin',
            email: 'admin@cityfix.com',
            password: 'Admin123!',  // The password you want
            role: 'admin',
            isVerified: true,
            isActive: true
        };

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminData.email });
        
        if (existingAdmin) {
            console.log('⚠️ Admin already exists. Updating password...');
            
            // Update password
            const hashedPassword = await bcrypt.hash(adminData.password, 10);
            existingAdmin.password = hashedPassword;
            existingAdmin.role = 'admin';
            existingAdmin.isVerified = true;
            existingAdmin.isActive = true;
            await existingAdmin.save();
            
            console.log('✅ Admin password updated successfully!');
        } else {
            // Create new admin
            const hashedPassword = await bcrypt.hash(adminData.password, 10);
            
            const newAdmin = new User({
                ...adminData,
                password: hashedPassword
            });
            
            await newAdmin.save();
            console.log('✅ New admin created successfully!');
        }

        console.log('\n📝 Admin Login Credentials:');
        console.log('Email:', adminData.email);
        console.log('Password:', adminData.password);
        console.log('\n✅ You can now login with these credentials!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createAdmin();