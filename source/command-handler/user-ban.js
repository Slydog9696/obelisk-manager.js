const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { FieldValue } = require('@google-cloud/firestore')
const { db } = require('../script.js')
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('user-ban')
    .setDescription('description ...')
    .addStringOption(option => option.setName('username').setDescription('description').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('description').setRequired(true)),

  async execute(interaction) {
    const input = {
      username: interaction.options.getString('username'),
      reason: interaction.options.getString('reason'),
      guild: interaction.guild.id,
      admin: interaction.user.id,
    };

    const reference = (await db.collection('configuration').doc(input.guild).get()).data();
    console.log(reference.tokens)

    const url = 'https://api.nitrado.net/services'
    const response = await axios.get(url, { headers: { 'Authorization': reference.tokens[0] } })

    let failure = 0;
    let success = 0;
    const action = response.data.data.services.map(async server => {
      const url = `https://api.nitrado.net/services/${server.id}/gameservers/games/banlist`;
      const response = await axios.post(url, { identifier: input.username }, { headers: { 'Authorization': reference.tokens[0] } });
      console.log(response.status);

      response.status === 200 ? success++ : failure++
    });

    await Promise.all(action);
    console.log(success, failure)

  }
};