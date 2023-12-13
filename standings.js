const mongoose = require('mongoose');

// Define the schema for a team
const teamSchema = new mongoose.Schema({
  rank: String,
  team: String,
  wins: String,
  losses: String,
  winPercentage: String,
  gamesBehind: String,
  conferenceRecord: String,
  divisionRecord: String,
  homeRecord: String,
  awayRecord: String,
  otRecord: String,
  lastTen: String,
  streak: String,
});

// Define the schema for a conference
const conferenceSchema = new mongoose.Schema({
  name: String,
  teams: [teamSchema], // Array of teams
});

// Define the schema for the entire document
const standingsSchema = new mongoose.Schema({
  easternConference: conferenceSchema,
  westernConference: conferenceSchema,
});

// Create a model for the schema
const Standings = mongoose.model('Standings', standingsSchema);

module.exports = Standings;
