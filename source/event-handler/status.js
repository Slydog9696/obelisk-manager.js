const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {

    async function loop() {

      const reference = await db.collection('configuration').get()

      // const channels = reference.forEach(doc => console.log(doc._fieldsProto['channels'].mapValue.fields))
      // const logging = reference.forEach(doc => console.log(doc._fieldsProto['logging'].mapValue.fields))
      // const tokens = reference.forEach(doc => console.log(doc._fieldsProto['tokens'].arrayValue.values))
      setTimeout(loop, 10000);
    }
    // loop();
  },
};