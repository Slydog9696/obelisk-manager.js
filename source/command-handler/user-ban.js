const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
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
    await interaction.deferReply({ ephemeral: false });

    const input = {
      username: interaction.options.getString('username'),
      reason: interaction.options.getString('reason'),
      guild: interaction.guild.id,
      admin: interaction.user.id,
    };

    const responseFailure = async ({ username, reason, guild }) => {
      console.log('Ban failed: ... ... ...')
    };

    const responseSuccess = async ({ username, reason, guild, admin }) => {
      const unix = Math.floor(Date.now() / 1000);

      // Collector, for player searching.
      await db.collection('player-banned').doc(guild).set({
        [username]: { reason: reason, unix: unix, admin: admin }
      }, { merge: true })

      // Collector, for button reaction.
      await db.collection('player-metadata').doc(interaction.id).set({
        [username]: { reason: reason, unix: unix, admin: admin }
      }, { merge: true })
    };

    const reference = (await db.collection('configuration').doc(input.guild).get()).data();
    console.log(reference.tokens);

    const url = 'https://api.nitrado.net/services';
    const response = await axios.get(url, { headers: { 'Authorization': reference.tokens[0] } });
    const serverArray = [...response.data.data.services]; // Total servers, used for ban calc.


    try {
      let failure = 0;
      let success = 0;
      const action = response.data.data.services.map(async server => {
        const url = `https://api.nitrado.net/services/${server.id}/gameservers/games/banlist`;
        const response = await axios.post(url, { identifier: input.username }, { headers: { 'Authorization': reference.tokens[0] } });
        console.log(response.status);

        response.status === 200 ? responseSuccess(input, success++) : responseFailure(input, failure++)
      });

      await Promise.all(action);
      const metadata = new ButtonBuilder()
        .setCustomId('metadata')
        .setLabel('Return Metadata')
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder()
        .addComponents(metadata);

      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('`Obelisk Management`')
        .setDescription(`\`🟢\` \`System Success\`\nThe selected user has been banned.\nBanned from \`${success}\` of \`${serverArray.length}\` servers.`)
        .setFooter({ text: 'Tip: Contact support if there are issues.' })

      await interaction.followUp({ embeds: [embed], components: [row] })

    } catch (error) { responseFailure(input) }

  }
};