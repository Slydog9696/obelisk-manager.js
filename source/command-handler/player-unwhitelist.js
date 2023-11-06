const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player-unwhitelist')
    .setDescription('Performs an in-game player action.')
    .addStringOption(option => option.setName('username').setDescription('Selected action will be performed on given tag.').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });
    const unix = Math.floor(Date.now() / 1000);

    const input = {
      username: interaction.options.getString('username'),
      guild: interaction.guild.id,
      admin: interaction.user.id,
    };

    let { username, guild } = input;
    username = username.includes('#') ? username.replace('#', '') : username;

    const reference = (await db.collection('configuration').doc(guild).get()).data();
    const platforms = { arkxb: true, arkps: true, arkse: true };
    const services = [];

    const error = async () => {
      const embed = new EmbedBuilder()
        .setColor('#e67e22')
        .setDescription(`**Game Command Failure**\nSelected player not located.\nPlease try again in an hour.\n\n**Additional Information**\nAwaiting player registration.`)
        .setFooter({ text: 'Tip: Contact support if there are issues.' })
        .setThumbnail('https://i.imgur.com/PCD2pG4.png')

      return await interaction.followUp({ embeds: [embed] });
      //! Command failure issue, rare embed. 
    }

    let failure = 0, success = 0;
    const url = 'https://api.nitrado.net/services';
    const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });

    try {
      const action = response.data.data.services.map(async server => {
        if (platforms[server.details.portlist_short]) {
          services.push(server.id)
          const url = `https://api.nitrado.net/services/${server.id}/gameservers/games/whitelist`;
          const response = await axios.delete(url, { headers: { 'Authorization': reference.nitrado.token }, data: { identifier: username } });
          response.status === 200 ? success++ : failure++;
        };
      });

      await Promise.all(action)

    } catch (err) {
      if (err.response.data.message === "Can't remove the user from the whitelist.") console.log('Duplicate listing detected, automated success'), success++;
      if (err.response.data.message === "Can't lookup player name to ID.") return error();
    };

    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setDescription(`**Game Command Success**\nExecuted on \`${success}\` of \`${services.length}\` servers.\nThe player was unwhitelisted.\n<t:${unix}:f>`)
      .setFooter({ text: 'Tip: Contact support if there are issues.' })
      .setThumbnail('https://i.imgur.com/CzGfRzv.png')

    await interaction.followUp({ embeds: [embed] });
  }
};