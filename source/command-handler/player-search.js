const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player-search')
    .setDescription('description ...')
    .addStringOption(option => option.setName('username').setDescription('description').setRequired(true))
    .addStringOption(option => option.setName('search-algorithm').setDescription('description').setRequired(true)
      .addChoices(
        { name: 'Type: Filter-Search', value: 'filter' }, //! General match, any.
        { name: 'Type: Strict-Search', value: 'strict' }, //! Exact match, only.
      )),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const input = {
      username: interaction.options.getString('username'),
      search: interaction.options.getString('search-algorithm'),
      guild: interaction.guild.id,
    };

    let { username, guild, search } = input;
    username = username.includes('#') ? username.replace('#', '') : username;

    const reference = (await db.collection('configuration').doc(guild).get()).data();
    console.log(reference.tokens)

    const url = 'https://api.nitrado.net/services';
    const response = await axios.get(url, { headers: { 'Authorization': reference.tokens[0] } });
    const serverArray = [...response.data.data.services]; // Total servers, used for ban calc.

    let output = '';
    let playerFound = false;
    let failure, success = 0;
    const validPlayer = ({ id, name, online, last_online, server }) => {
      const unix = Math.floor(Date.parse(last_online) / 1000);
      playerFound = true;
      online
        ? output += `\`🟢\` \`Player Online\`\n\`🔗\` ${id}\n\`🔗\` ${server.details.name}\n\`🔗\` <t:${unix}:f>\n\`\`\`${name}\`\`\`\n\n`
        : output += `\`🟠\` \`Player Offline\`\n\`🔗\` ${id}\n\`🔗\` ${server.details.name}\n\`🔗\` <t:${unix}:f>\n\`\`\`${name}\`\`\`\n\n`
    }

    const filterPlayer = (players, server) => {
      search === 'filter'
        //! Chained operator, conditional from search-type. 
        ? players.forEach(player => player.name.includes(username) ? validPlayer({ ...player, server, success }) : null)
        : players.forEach(player => player.name === username ? validPlayer({ ...player, server, success }) : null)
    }

    try {
      const action = response.data.data.services.map(async server => {
        const url = `https://api.nitrado.net/services/${server.id}/gameservers/games/players`;
        const response = await axios.get(url, { headers: { 'Authorization': reference.tokens[0] } });
        response.status === 200 ? filterPlayer(response.data.data.players, server, success++) : failure++
      });

      await Promise.all(action)

      const successEmbed = async () => {
        const embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('`Obelisk Management`')
          .setDescription(`${output}The search command was successful.\nScanned \`${success}\` of \`${serverArray.length}\` servers.\nLimited \`25\` objects.`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })

        return await interaction.followUp({ embeds: [embed] });
      }

      const failureEmbed = async () => {
        const embed = new EmbedBuilder()
          .setColor('#e67e22')
          .setTitle('`Obelisk Management`')
          .setDescription(`\`🟠\` \`System Failure\`\nThe selected user cannot be located.\nEnsure correct algorithm selected.\n\n**Additional Information**\nNitrado has yet to register this player.`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })

        return await interaction.followUp({ embeds: [embed] });
      }

      playerFound ? successEmbed() : failureEmbed()

    } catch (error) { console.log(error) };
  }
};