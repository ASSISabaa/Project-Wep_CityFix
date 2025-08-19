// server/models/SystemMeta.js
const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  type: { type: String, default: 'info' },
  message: { type: String, required: true },
  at: { type: Date, default: Date.now }
}, { _id: false });

const SystemMetaSchema = new mongoose.Schema({
  key: { type: String, unique: true, index: true },
  lastExport: Date,
  lastBackupAt: Date,
  nextAutoBackupHours: { type: Number, default: 6 },
  cacheSizeMB: { type: Number, default: 247 },
  uptimePct: { type: Number, default: 98 },
  sectionsConfigured: { type: Number, default: 4 },
  activity: { type: [ActivitySchema], default: [] }
}, { timestamps: true });

SystemMetaSchema.statics.getOrCreate = async function (key = 'default') {
  let doc = await this.findOne({ key });
  if (!doc) {
    doc = await this.create({ key });
  }
  return doc;
};

module.exports = mongoose.model('SystemMeta', SystemMetaSchema);
