const Rcon = require('rcon-client').Rcon;
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rcon-terminal')
    .setDescription('Connects to your remote console, allows in-game commands.')
    .addStringOption(option => option.setName('command').setDescription('Required to execute function.').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });
    const input = { command: interaction.options.getString('command'), guild: interaction.guild.id };
    const reference = (await db.collection('configuration').doc(input.guild).get()).data();

    const valid = async ({ rcon_port, ip, settings: { config: { 'current-admin-password': password } } }) => {
      console.log(ip, rcon_port, password);
      const info = { host: ip, port: rcon_port, password: password };
      const rcon = await Rcon.connect(info);

      await rcon.send(input.command)
        .then(async () => { console.log('Command sent...'), await rcon.end() });
    }

    let services = [];
    let failure = 0, success = 0;
    const url = 'https://api.nitrado.net/services';
    const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });

    response.data.data.services.forEach(async server => {
      if (server.details.folder_short !== 'arksa') return;
      services.push(server.id) && success++;

      const url = `https://api.nitrado.net/services/${server.id}/gameservers`;
      const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
      response.status === 200 ? valid(response.data.data.gameserver) : invalid(failure++);
    })

    await interaction.followUp({ content: `${success}/${services.length}` });
  }
};
