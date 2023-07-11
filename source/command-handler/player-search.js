const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js')
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player-search')
    .setDescription('description ...')
    .addStringOption(option => option.setName('username').setDescription('description').setRequired(true))
    .addStringOption(option => option.setName('search-type').setDescription('description').setRequired(true)
      .addChoices(
        { name: 'Strict', value: 'strict' }, //! Exact match, only.
        { name: 'Filter', value: 'filter' }, //! General match, any.
      )),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });
    const unix = Math.floor(Date.now() / 1000);

    const input = {
      username: interaction.options.getString('username'),
      search: interaction.options.getString('search-type'),
      guild: interaction.guild.id,
    };

    let { username, guild, search, admin } = input;
    username = username.includes('#') ? username.replace('#', '') : username;

    console.log(search)
    const reference = (await db.collection('configuration').doc(guild).get()).data();
    console.log(reference.tokens)

    const url = 'https://api.nitrado.net/services';
    const response = await axios.get(url, { headers: { 'Authorization': reference.tokens[0] } });
    const serverArray = [...response.data.data.services]; // Total servers, used for ban calc.

    let failure = 0;
    let success = 0;

    const validPlayer = ({ id, name, online, last_online }) => {

    }

    const filterPlayer = (players, server) => {
      search === 'filter'
        //! Chained operator, conditional from search-type. 
        ? players.forEach(player => player.name.includes(username) ? validPlayer(player, server) : null)
        : players.forEach(player => player.name === username ? validPlayer(player, server) : null)

    }
    try {
      response.data.data.services.forEach(async server => {
        const url = `https://api.nitrado.net/services/${server.id}/gameservers/games/players`;
        const response = await axios.get(url, { headers: { 'Authorization': reference.tokens[0] } });
        response.status === 200 ? (filterPlayer(response.data.data.players), server, success++) : failure++
        // response.status === 200 ? filterPlayer(response.data.data.players, server) : null
      });

    } catch (error) { console.log('Cannot locate in-game player.') };
  }
};