const { SlashCommandBuilder } = require('discord.js');
const { db } = require('../script.js')
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-token')
    .setDescription('description ...')
    .addStringOption(option => option.setName('token').setDescription('description').setRequired(true)),

  async execute(interaction) {
    const input = {
      token: interaction.options.getString('token'),
      guild: interaction.guild.id,
      admin: interaction.user.id,
    };

    const invalidToken = async ({ token }) => {
      console.log(`Invalid: ${token}`)
    }

    const validToken = async ({ token }) => {
      const reference = (await db.collection('configuration').doc(input.guild).get()).data();
      console.log(`Valid: ${token}`)
    }

    try {  // Try/Catch for Nitrado issues.
      const url = 'https://oauth.nitrado.net/token';
      const response = await axios.get(url, { headers: { 'Authorization': input.token } });
      response.status === 200 ? validToken(input) : invalidToken(input);

    } catch (error) { invalidToken(input) };

  }
};