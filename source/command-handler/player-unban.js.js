const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { FieldValue } = require('@google-cloud/firestore');
const { db } = require('../script.js');
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player-unban')
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

    const secondaryUnbanFailure = async () => {
      const embed = new EmbedBuilder()
        .setColor('#e67e22')
        .setTitle('`Obelisk Management`')
        .setDescription(`\`🟠\` \`System Failure\`\nThe selected user cannot be located.\nEnsure correct spelling and caps.\n\n**Additional Information**\nNitrado has yet to register this player.`)
        .setFooter({ text: 'Tip: Contact support if there are issues.' })

      return await interaction.followUp({ embeds: [embed] });
    }

    const secondaryUnbanSuccess = async ({ uuid }) => {
      try {
        const action = serverArray.map(async server => {
          const url = `https://api.nitrado.net/services/${server.id}/gameservers/games/banlist`;
          const response = await axios.delete(url, { headers: { 'Authorization': reference.tokens[0] } }, { identifier: username },);
          console.log(`Secondary unban: ${response.status}`)
          response.status === 200 ? success++ : failure++;
        })

        await Promise.all(action).then(async () => {
          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('`Obelisk Management`')
            .setDescription(`\`🟢\` \`System Success\`\nThe selected user has been banned.\nBanned from \`${success}\` of \`${serverArray.length}\` servers.\n<t:${unix}:f>\n\nRemoved for ${reason}.`)
            .setFooter({ text: 'Tip: Contact support if there are issues.' })

          await interaction.followUp({ embeds: [embed] });
        })

      } catch (error) { if (error.response.data.message === "Can't lookup player name to ID.") return secondaryUnbanFailure(); };
    }

    const secondaryUnban = async () => {
      const metadata = (await db.collection('player-metadata').doc('metadata').get()).data()
      metadata[username] ? secondaryUnbanSuccess(metadata[username]) : secondaryUnbanFailure();
    }

    const reference = (await db.collection('configuration').doc(guild).get()).data();
    console.log(reference.tokens)

    let failure, success = 0;
    const url = 'https://api.nitrado.net/services';
    const response = await axios.get(url, { headers: { 'Authorization': reference.tokens[0] } });
    const serverArray = [...response.data.data.services]; // Total servers, used for calc.

    try {
      const action = response.data.data.services.map(async server => {
        const url = `https://api.nitrado.net/services/${server.id}/gameservers/games/banlist`;
        const response = await axios.delete(url, { headers: { 'Authorization': reference.tokens[0] } }, { identifier: username },);
        console.log(response.status);

        response.status === 200 ? success++ : failure++;
      });

      await Promise.all(action).then(async () => {
        await db.collection('player-banned').doc(guild).set({
          [username]: FieldValue.delete()
        }, { merge: true });
      });

    } catch (error) { if (error.response.data.message === "Can't lookup player name to ID.") return secondaryUnban(); };

    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('`Obelisk Management`')
      .setDescription(`\`🟢\` \`System Success\`\nThe selected user has been unbanned.\nUnbanned from \`${success}\` of \`${serverArray.length}\` servers.\n<t:${unix}:f>`)
      .setFooter({ text: 'Tip: Contact support if there are issues.' })

    await interaction.followUp({ embeds: [embed] });
  }
};