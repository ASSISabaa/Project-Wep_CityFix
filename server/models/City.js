// models/City.js
const mongoose = require('mongoose');

const CitySchema = new mongoose.Schema({
  name: { type: String, unique: true, index: true },
  population: { type: Number, default: 0 },
  areaKm2: Number
});

module.exports = mongoose.model('City', CitySchema);
