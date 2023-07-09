const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js')
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player-search')
    .setDescription('description ...')
    .addStringOption(option => option.setName('username').setDescription('description').setRequired(true)),

  async execute(interaction) {
    const input = {
      username: interaction.options.getString('username'),
      guild: interaction.guild.id,
    };

    let { username, guild } = input;
    username = username.includes('#') ? username.replace('#', '') : username;

    const reference = (await db.collection('player-banned').doc(guild).get()).data();
    Object.keys(reference).forEach(doc => doc.includes(username) ? console.log('Found') : null)
  }
};

// Merge: /search, /history -> 
// Lookup player in-game, view if banned.