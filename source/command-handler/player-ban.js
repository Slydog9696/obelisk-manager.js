const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js');
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

    const commandFailure = async () => {
      const embed = new EmbedBuilder()
        .setColor('#e67e22')
        .setDescription(`**Game Command Failure**\nSelected player not located.\nPlease try again in an hour.\n\n**Additional Information**\nAwaiting player registration.`)
        .setFooter({ text: 'Tip: Contact support if there are issues.' })
        .setThumbnail('https://i.imgur.com/PCD2pG4.png')

      return await interaction.followUp({ embeds: [embed] });
    }

    const databaseBackup = async () => {
      const metadata = (await db.collection('player-metadata').doc('metadata').get()).data()
      if (metadata[username]) {
        try {
          const action = serverArray.map(async server => {
            const url = `https://api.nitrado.net/services/${server.id}/gameservers/games/banlist`;
            const response = await axios.post(url, { identifier: metadata[username].uuid }, { headers: { 'Authorization': nitrado.token } });
            console.log(`Secondary ban: ${response.status}`)
            response.status === 200 ? success++ : failure++;
          })

          await Promise.all(action).then(async () => {
            const embed = new EmbedBuilder()
              .setColor('#2ecc71')
              .setDescription(`**Game Command Success**\nExecuted on \`${success}\` of \`${serverArray.length}\` servers.\nGameserver action complete.\n<t:${unix}:f>\n\nRemoved for ${reason}.`)
              .setFooter({ text: 'Tip: Contact support if there are issues.' })
              .setThumbnail('https://i.imgur.com/CzGfRzv.png')

            await interaction.followUp({ embeds: [embed] });
          })

        } catch (error) {
          if (error.response.data.message === "Can't add the user to the banlist.") return duplicateListing();
          if (error.response.data.message === "Can't lookup player name to ID.") return commandFailure();
        };

      } else { commandFailure() }
    }

    const duplicateListing = async () => {
      await db.collection('player-banned').doc(guild).set({
        [username]: { admin: admin, reason: reason, unix: unix }
      }, { merge: true });

      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setDescription(`**Game Command Success**\nExecuted on \`${serverArray.length}\` of \`${serverArray.length}\` servers.\nGameserver action complete.\n<t:${unix}:f>\n\nRemoved for ${reason}.`)
        .setFooter({ text: 'Tip: Contact support if there are issues.' })
        .setThumbnail('https://i.imgur.com/CzGfRzv.png')

      await interaction.followUp({ embeds: [embed] });
    }

    const reference = (await db.collection('configuration').doc(guild).get()).data();
    let { nitrado } = reference;

    let failure = 0, success = 0;
    const url = 'https://api.nitrado.net/services';
    const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } });
    const serverArray = [...response.data.data.services]; // Total servers, used for ban calc.

    try {
      const action = response.data.data.services.map(async server => {
        const url = `https://api.nitrado.net/services/${server.id}/gameservers/games/banlist`;
        const response = await axios.post(url, { identifier: username }, { headers: { 'Authorization': nitrado.token } });
        response.status === 200 ? success++ : failure++;
      });

      await Promise.all(action).then(async () => {
        await db.collection('player-banned').doc(guild).set({
          [username]: { admin: admin, reason: reason, unix: unix }
        }, { merge: true });
      });

    } catch (error) {
      if (error.response.data.message === "Can't add the user to the banlist.") return duplicateListing();
      if (error.response.data.message === "Can't lookup player name to ID.") return databaseBackup();
    };

    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setDescription(`**Game Command Success**\nExecuted on \`${success}\` of \`${serverArray.length}\` servers.\nGameserver action complete.\n<t:${unix}:f>\n\nRemoved for ${reason}.`)
      .setFooter({ text: 'Tip: Contact support if there are issues.' })
      .setThumbnail('https://i.imgur.com/CzGfRzv.png')

    await interaction.followUp({ embeds: [embed] });
  }
};