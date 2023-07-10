const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js')
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player-ban')
    .setDescription('description ...')
    .addStringOption(option => option.setName('username').setDescription('description').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('description').setRequired(true)
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

    console.log(username)
    const invalidPlayer = async () => {
      const embed = new EmbedBuilder()
        .setColor('#e67e22')
        .setTitle('`Obelisk Management`')
        .setDescription(`\`🟠\` \`System Failure\`\nThe selected user cannot be located.\nEnsure correct spelling and caps.\n\n**Additional Information**\nNitrado has yet to register this player.`)
        .setFooter({ text: 'Tip: Contact support if there are issues.' })

      return await interaction.followUp({ embeds: [embed] });
    }

    const reference = (await db.collection('configuration').doc(guild).get()).data();
    console.log(reference.tokens)

    const url = 'https://api.nitrado.net/services';
    const response = await axios.get(url, { headers: { 'Authorization': reference.tokens[0] } });
    const serverArray = [...response.data.data.services]; // Total servers, used for ban calc.

    let failure = 0;
    let success = 0;

    try {
      const action = response.data.data.services.map(async server => {
        const url = `https://api.nitrado.net/services/${server.id}/gameservers/games/banlist`;
        const response = await axios.post(url, { identifier: username }, { headers: { 'Authorization': reference.tokens[0] } });
        console.log(response.status);

        response.status === 200 ? success++ : failure++;
      });

      await Promise.all(action).then(async () => {
        await db.collection('player-banned').doc(guild).set({
          [username]: { admin: admin, reason: reason, unix: unix }
        }, { merge: true });
      });

    } catch (error) { if (error.response.data.message === "Can't lookup player name to ID.") return invalidPlayer(); };

    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('`Obelisk Management`')
      .setDescription(`\`🟢\` \`System Success\`\nThe selected user has been banned.\nBanned from \`${success}\` of \`${serverArray.length}\` servers.\n<t:${unix}:F>\n\nRemoved for ${reason}.`)
      .setFooter({ text: 'Tip: Contact support if there are issues.' })

    await interaction.followUp({ embeds: [embed] });

    //! Confirm player, push to database ~
    const validPlayer = async ({ name, server, id, last_online }) => {
      const unix = Math.floor(Date.parse(last_online) / 1000);

      await db.collection('player-metadata').doc('metadata').set({
        [name]: { server_name: server.details.name, uuid: id, last_online: unix, reason: reason }
      }, { merge: true })
    };

    //! Filter player, ensure they exist ~
    const filterPlayer = async (players, server) => {
      players.forEach(player => player.name === username ? validPlayer({ ...player, server }) : null)
    };

    try {
      response.data.data.services.forEach(async server => {
        const url = `https://api.nitrado.net/services/${server.id}/gameservers/games/players`;
        const response = await axios.get(url, { headers: { 'Authorization': reference.tokens[0] } });
        response.status === 200 ? filterPlayer(response.data.data.players, server) : null
      });

    } catch (error) { console.log('Cannot locate in-game player.') };
  }
};