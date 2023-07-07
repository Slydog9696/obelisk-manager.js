const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js')
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
    };

    const responseFailure = async ({ }) => {

    };

    const responseSuccess = async ({ username, guild }) => {

    };

    const reference = (await db.collection('configuration').doc(input.guild).get()).data();
    console.log(reference.tokens)

    const url = 'https://api.nitrado.net/services';
    const response = await axios.get(url, { headers: { 'Authorization': reference.tokens[0] } });
    const serverArray = [...response.data.data.services]; // Total servers, used for ban calc.

    let failure = 0;
    let success = 0;

    try {
      const action = response.data.data.services.map(async server => {
        const url = `https://api.nitrado.net/services/${server.id}/gameservers/games/banlist`;
        const response = await axios.delete(url, { headers: { 'Authorization': reference.tokens[0] } }, { identifier: input.username });
        console.log(response.status);

        response.status === 200 ? responseSuccess(input, success++) : responseFailure(input, failure++);
      });

      await Promise.all(action);
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('`Obelisk Management`')
        .setDescription(`\`🟢\` \`System Success\`\nThe selected user has been unbanned.\nUnbanned from \`${success}\` of \`${serverArray.length}\` servers.\n<t:${unix}:F>`)
        .setFooter({ text: 'Tip: Contact support if there are issues.' })

      await interaction.followUp({ embeds: [embed] });

    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('`Obelisk Management`')
        .setDescription(`\`🟢\` \`System Success\`\nThe selected user has been unbanned.\nUnbanned from \`${success}\` of \`${serverArray.length}\` servers.\n<t:${unix}:F>`)
        .setFooter({ text: 'Tip: Contact support if there are issues.' })

      await interaction.followUp({ embeds: [embed] });
    }
  }
};