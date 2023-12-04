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




    // const { guild, identifier } = input;
    // const platforms = { arksa: true };
    // const services = [];

    // let failure = 0, success = 0;
    // const url = 'https://api.nitrado.net/services';
    // const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });

    // const action = response.data.data.services.map(async server => {
    //   const url = `https://api.nitrado.net/services/${server.id}/gameservers`;
    //   const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
    //   response.status === 200

    //   const { rcon_port, ip, settings: { config: { "current-admin-password": password } } } = response.data.data.gameserver;
    //   const info = { host: ip, port: rcon_port, password: password };
    //   const rcon = await Rcon.connect(info)

    //   const command = `GiveTekEngramsTo ${identifier} PrimalItemArmor_TekPants`;
    //   await rcon.send(command).then(async () => { console.log('Command sent...'), await rcon.end() });
    // })
  }
};

// // RCON server information
// const rconOptions = {
//   host: '217.114.196.71',
//   port: 11150,
//   password: 'FyWpkdC9',
// };

// // Function to send a command to the RCON server
// async function sendRconCommand(command) {
//   try {
//     const rcon = await Rcon.connect(rconOptions);

//     // Send the command
//     const response = await rcon.send(command);
//     console.log(`Command "${command}" sent successfully. Response: ${response}`);

//     // Close the RCON connection
//     await rcon.end();
//   } catch (err) {
//     console.error(`Error: ${err.message}`);
//   }
// }

// // Example: Sending a command to the server
// const commandToSend = 'DestroyWildDinos';
// sendRconCommand(commandToSend);