const { Client, Events, Collection, GatewayIntentBits, ActivityType } = require('discord.js');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { token } = require('./other-config/config.json');
const path = require('path');
const fs = require('fs');

const serviceAccount = require('./other-config/firebase.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

module.exports = { db };

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const eventsPath = path.join(__dirname, './event-handler');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

eventFiles.forEach(file => {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  event.once
    ? client.once(event.name, (...args) => event.execute(...args))
    : client.on(event.name, (...args) => event.execute(...args));
});

const commandsPathPlayerManagement = path.join(__dirname, './command-handler');
const commandFiles = fs.readdirSync(commandsPathPlayerManagement).filter(file => file.endsWith('.js'));

commandFiles.forEach(file => {
  const filePath = path.join(commandsPathPlayerManagement, file);
  const command = require(filePath);

  if ('data' in command && 'execute' in command) client.commands.set(command.data.name, command);
  else console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) return console.error(`No command matching ${interaction.commandName} was found.`);

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

client.on('ready', (event) => {
  console.log(`${event.user.tag} is online.`);
  client.user.setActivity('/ commands', { type: ActivityType.Listening });
});

client.login(token);