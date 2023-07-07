const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { FieldValue } = require('@google-cloud/firestore')
const { db } = require('../script.js');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('user-ban')
    .setDescription('description ...')
    .addStringOption(option => option.setName('username').setDescription('description').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('description').setRequired(true)),

  async execute(interaction) {
    const slashInteraction = {
      username: interaction.options.getString('username'),
      reason: interaction.options.getString('reason'),
      guild: parseInt(interaction.guild.id),
      admin: parseInt(interaction.user.id),
    };

    console.log(username, reason, guild, admin)
  }
};
