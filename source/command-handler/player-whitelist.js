const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { FieldValue } = require('@google-cloud/firestore');
const { db } = require('../script.js');
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player-unwhitelist')
    .setDescription('description ...')
    .addStringOption(option => option.setName('username').setDescription('description').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });
    const unix = Math.floor(Date.now() / 1000);

    const input = {
      username: interaction.options.getString('username'),
      guild: interaction.guild.id,
      admin: interaction.user.id,
    };

    let { username, guild, admin } = input;
    username = username.includes('#') ? username.replace('#', '') : username;

    console.log(username)
    const inputFailure = async () => {
      const embed = new EmbedBuilder()
        .setColor('#e67e22')
        .setDescription(`**Game Command Failure**\nSelected player not located.\nPlease try again in an hour.\n\n**Additional Information**\nAwaiting player registration.`)
        .setFooter({ text: 'Tip: Contact support if there are issues.' })
        .setThumbnail('https://i.imgur.com/PCD2pG4.png')

      return await interaction.followUp({ embeds: [embed] });
    }

    const reference = (await db.collection('configuration').doc(guild).get()).data();
    console.log(reference.tokens)

    let failure, success = 0;
    const url = 'https://api.nitrado.net/services';
    const response = await axios.get(url, { headers: { 'Authorization': reference.tokens[0] } });
    const serverArray = [...response.data.data.services]; // Total servers, used for calc.

    try {
      const action = response.data.data.services.map(async server => {
        const url = `https://api.nitrado.net/services/${server.id}/gameservers/games/whitelist`;
        const response = await axios.delete(url, { headers: { 'Authorization': reference.tokens[0] } }, { identifier: username });
        console.log(response.status);

        response.status === 200 ? success++ : failure++;
      });

      await Promise.all(action)

    } catch (error) { if (error.response.data.message === "Can't lookup player name to ID.") return inputFailure(); };

    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setDescription(`**Game Command Success**\nExecuted on \`${success}\` of \`${serverArray.length}\` servers.\nThe player was whitelisted.\n<t:${unix}:f>`)
      .setFooter({ text: 'Tip: Contact support if there are issues.' })
      .setThumbnail('https://i.imgur.com/CzGfRzv.png')

    await interaction.followUp({ embeds: [embed] });
  }
};