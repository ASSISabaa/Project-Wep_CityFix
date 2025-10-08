// server/utils/dropIndexes.js
// Run this ONCE to fix the database

const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cityfix');
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Drop all indexes on reports collection
    await db.collection('reports').dropIndexes();
    console.log('🗑️ Dropped all report indexes');

    // Drop the entire collection to start fresh
    await db.collection('reports').drop().catch(() => console.log('Reports collection already empty'));
    console.log('🗑️ Dropped reports collection');

    console.log('✅ Database cleaned! Now run: npm run seed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

dropIndexes();