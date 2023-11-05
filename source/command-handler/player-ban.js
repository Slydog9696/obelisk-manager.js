const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player-ban')
    .setDescription('Performs an in-game player action.')
    .addStringOption(option => option.setName('username').setDescription('Selected action will be performed on given tag.').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Required to submit ban action.').setRequired(true)
      .addChoices(
        { name: 'Breaking Rules', value: 'breaking rules' },
        { name: 'Cheating', value: 'cheating' },
        { name: 'Behavior', value: 'behavior' },
        { name: 'Meshing', value: 'meshing' },
        { name: 'Other', value: 'other reasons' }
      )),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });
    const unix = Math.floor(Date.now() / 1000);

    const input = {
      username: interaction.options.getString('username'),
      reason: interaction.options.getString('reason'),
      guild: interaction.guild.id,
      admin: interaction.user.id,
    };

    let { username, reason, guild, admin } = input;
    username = username.includes('#') ? username.replace('#', '') : username;

    const services = []; // Total servers, used for ban calc.
    const platforms = { arkxb: true, arkps: true, arkse: true }

    const error = async () => {
      console.log('Alert: Unknown back-end error.')

      //! Command failure issue, rare embed. 
    }

    const secondary = async () => {
      console.log('Alert: Attempting to ban via id.')
      //! Attempt to ban player via stored id.
    }

    const duplicate = async () => {
      console.log('Alert: Player is already banned.')
      //! Alert user that player is already banned.
    }

    const reference = (await db.collection('configuration').doc(guild).get()).data();
    const { nitrado } = reference;

    let failure = 0, success = 0;
    const url = 'https://api.nitrado.net/services';
    const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } });

    try {
      const action = response.data.data.services.map(async server => {
        if (platforms[server.details.portlist_short]) {
          const url = `https://api.nitrado.net/services/${server.id}/gameservers/games/banlist`;
          const response = await axios.post(url, { identifier: username }, { headers: { 'Authorization': nitrado.token } });
          response.status === 200 ? success++ : failure++;
          services.push(server.id)
        }
      });

      await Promise.all(action).then(async () => {
        await db.collection('player-banned').doc(guild).set({
          [username]: { admin: admin, reason: reason, unix: unix }
        }, { merge: true });
      });

    } catch (error) {
      if (error.response.data.message === "Can't add the user to the banlist.") return duplicate();
      if (error.response.data.message === "Can't lookup player name to ID.") return secondary();
    };

    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setDescription(`**Game Command Success**\nExecuted on \`${success}\` of \`${services.length}\` servers.\nGameserver action complete.\n<t:${unix}:f>\n\nRemoved for ${reason}.`)
      .setFooter({ text: 'Tip: Contact support if there are issues.' })
      .setThumbnail('https://i.imgur.com/CzGfRzv.png')

    await interaction.followUp({ embeds: [embed] });
  }
};