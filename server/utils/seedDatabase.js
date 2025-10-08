const mongoose = require('mongoose');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Report = require('../models/Report');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cityfix');
    console.log('✅ MongoDB Connected');

    await Report.deleteMany({});
    await User.deleteMany({});
    await Tenant.deleteMany({});
    console.log('🗑️ Cleared data');

    const tenant = await Tenant.create({ 
      name: 'Tel Aviv Municipality', 
      code: 'TLVMUN', 
      city: 'Tel Aviv', 
      country: 'Israel',
      language: 'he',
      timezone: 'Asia/Jerusalem'
    });
    console.log('🏛️ Tenant created');

    const pwd = await bcrypt.hash('password123', 10);

    await User.create({ 
      username: 'Super Admin', 
      email: 'superadmin@cityfix.com', 
      password: pwd, 
      role: 'SUPER_SUPER_ADMIN', 
      profile: { firstName: 'Super', lastName: 'Admin', language: 'en' } 
    });
    
    await User.create({ 
      username: 'Municipality Admin', 
      email: 'admin@tlv.com', 
      password: pwd, 
      role: 'MUNICIPALITY_ADMIN', 
      tenant: tenant._id, 
      profile: { firstName: 'Admin', lastName: 'User', language: 'he' } 
    });
    
    const employee = await User.create({ 
      username: 'Field Employee', 
      email: 'employee@tlv.com', 
      password: pwd, 
      role: 'EMPLOYEE', 
      tenant: tenant._id, 
      department: 'infrastructure', 
      profile: { firstName: 'John', lastName: 'Doe', language: 'en' } 
    });
    
    const citizen = await User.create({ 
      username: 'Test Citizen', 
      email: 'citizen@example.com', 
      password: pwd, 
      role: 'CITIZEN', 
      tenant: tenant._id, 
      profile: { firstName: 'Test', lastName: 'User', language: 'en' } 
    });
    
    console.log('👤 Users created');

    // NO GeoLocation - Just coordinates!
    await Report.create({
      title: 'Pothole on Main Street',
      description: 'Large dangerous pothole',
      type: 'pothole',
      status: 'new',
      priority: 'high',
      tenant: tenant._id,
      reporter: citizen._id,
      department: 'infrastructure',
      location: {
        address: '123 Main St, Downtown',
        district: 'downtown',
        coordinates: { 
          lat: 32.0853, 
          lng: 34.7818 
        }
      }
    });
    
    console.log('📝 Reports created');

    console.log('\n✨ Success!\n');
    console.log('🔑 Login Credentials:');
    console.log('Super Admin: superadmin@cityfix.com / password123');
    console.log('Admin: admin@tlv.com / password123');
    console.log('Employee: employee@tlv.com / password123');
    console.log('Citizen: citizen@example.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedDatabase();