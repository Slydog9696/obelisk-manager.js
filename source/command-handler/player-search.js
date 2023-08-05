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
    username = username.toLowerCase().includes('#') ? username.replace('#', '') : username.toLowerCase();

    const reference = (await db.collection('configuration').doc(guild).get()).data();
    console.log(reference.tokens)

    const url = 'https://api.nitrado.net/services';
    const response = await axios.get(url, { headers: { 'Authorization': reference.tokens[0] } });
    const serverArray = [...response.data.data.services]; // Total servers, used for ban calc.

    let output = '';
    let playerFound = false;
    let failure = 0, success = 0, counter = 0;
    const validPlayer = ({ id, name, online, last_online, server }) => {
      const unix = Math.floor(Date.parse(last_online) / 1000);
      playerFound = true;
      if (counter < 5) {
        online
          ? output += `\`🟢\` \`Player Online\`\n\`🔗\` ${id.slice(0, 25)}...\n\`🔗\` ${server.details.name.slice(0, 30)}\n\`🔗\` <t:${unix}:f>\n\`🔗\` ${name}\n\n`
          : output += `\`🟠\` \`Player Offline\`\n\`🔗\` ${id.slice(0, 25)}...\n\`🔗\` ${server.details.name.slice(0, 30)}\n\`🔗\` <t:${unix}:f>\n\`🔗\` ${name}\n\n`
        counter++
      }
    }

    const filterPlayer = (players, server) => {
      search === 'filter'
        //! Chained operator, conditional from search-type. 
        ? players.forEach(player => player.name.toLowerCase().includes(username) ? validPlayer({ ...player, server }) : null)
        : players.forEach(player => player.name.toLowerCase() === username ? validPlayer({ ...player, server }) : null)
    }

    try {
      const action = response.data.data.services.map(async server => {
        const url = `https://api.nitrado.net/services/${server.id}/gameservers/games/players`;
        const response = await axios.get(url, { headers: { 'Authorization': reference.tokens[0] } });
        response.status === 200 ? (success++, filterPlayer(response.data.data.players, server)) : failure++;
      });

      await Promise.all(action)

      const successEmbed = async () => {
        const embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setDescription(`${output}Scanned \`${success}\` of \`${serverArray.length}\` servers.\nLimited \`5\` player objects.`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })

        return await interaction.followUp({ embeds: [embed] });
      }

      const failureEmbed = async () => {
        const embed = new EmbedBuilder()
          .setColor('#e67e22')
          .setDescription(`**Game Command Failure**\nSelected player not located.\nPlease try again in an hour.\n\n**Additional Information**\nAwaiting player registration.`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })
          .setThumbnail('https://i.imgur.com/PCD2pG4.png')

        return await interaction.followUp({ embeds: [embed] });
      }

      playerFound ? successEmbed() : failureEmbed()

    } catch (error) { console.log(error) };
  }
};