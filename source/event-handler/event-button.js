const { ActionRowBuilder, Events, ModalBuilder, ChannelType, TextInputBuilder, TextInputStyle, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    client.on(Events.InteractionCreate, async interaction => {

      try {
        const reference = (await db.collection('configuration').doc(interaction.guild.id).get()).data();

        if (interaction.customId === 'setup-token') {
          const modal = new ModalBuilder()
            .setCustomId('token-modal')
            .setTitle('Nitrado Token Verification');

          const row = new ActionRowBuilder()
            .addComponents(
              new TextInputBuilder()
                .setCustomId('token-option').setLabel('Required Nitrado Token').setMinLength(50).setMaxLength(150)
                .setPlaceholder('...oAg66TcQYUnYXBQn17A161-N86cN5jWDp7')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            );

          modal.addComponents(row);
          await interaction.showModal(modal);
        }

        if (interaction.customId === 'token-modal') {

          const invalidToken = async () => {
            const button = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setURL('https://discord.gg/jee3ukfvVr')
                  .setLabel('Support Server')
                  .setStyle(ButtonStyle.Link),
              );

            const embed = new EmbedBuilder()
              .setColor('#e67e22')
              .setDescription(`**Error Function: Invalid Token**\nUh, oh! Seems the token you provided is not valid or is missing permissions. Review the section above, and ensure you follow the preview video.\n\n**[Partnership & Information](https://www.nitrado-aff.com/2M731JR/D42TT/ \"Nitrado Partner Link\")**\nConsider using our partnership link to purchase your personal servers to help fund our services!`)
              .setFooter({ text: 'Tip: Contact support if there are issues.' })
              .setImage('https://i.imgur.com/2ZIHUgx.png')

            await interaction.reply({ embeds: [embed], components: [button], ephemeral: true });
          }

          const invalidCommunity = async () => {
            const button = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setURL('https://discord.gg/jee3ukfvVr')
                  .setLabel('Support Server')
                  .setStyle(ButtonStyle.Link),
              );

            const embed = new EmbedBuilder()
              .setColor('#e67e22')
              .setDescription(`**Error Function: Invalid Community**\nUh, oh! Seems __this__ guild is not set as a community which does not allow forums to be created for our logging. Read [here](https://support.discord.com/hc/en-us/articles/360047132851-Enabling-Your-Community-Server \"helpdesk-discord\") to enable!\n\n**[Partnership & Information](https://www.nitrado-aff.com/2M731JR/D42TT/ \"Nitrado Partner Link\")**\nConsider using our partnership link to purchase your personal servers to help fund our services!`)
              .setFooter({ text: 'Tip: Contact support if there are issues.' })
              .setImage('https://i.imgur.com/2ZIHUgx.png')

            await interaction.reply({ embeds: [embed], components: [button], ephemeral: true });
          }

          const validToken = async ({ token }) => {
            const button = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setLabel('Base Version')
                  .setCustomId('base-version')
                  .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                  .setLabel('Upgraded Version')
                  .setCustomId('upgraded-version')
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(true),
              );

            const embed = new EmbedBuilder()
              .setColor('#2ecc71')
              .setDescription(`**Token Creation & Overview**\n For those interested in upgrading to our more advanced tooling, the payment __must__ be done before installation, the base version is free.\n\n**Additional Information**\nSelect the upgrade button below for those who want our premium version. After the payment, press it again for a seamless transition.\n\n__Premium temporarily disabled.__ \n\n**[Partnership & Information](https://www.nitrado-aff.com/2M731JR/D42TT/ \"Nitrado Partner Link\")**\nConsider using our partnership link to purchase your personal servers to help fund our services!`)
              .setFooter({ text: 'Tip: Contact support if there are issues.' })
              .setImage('https://i.imgur.com/2ZIHUgx.png')

            await interaction.reply({ embeds: [embed], components: [button], ephemeral: true }).then(async () => {
              await db.collection('configuration').doc(interaction.guild.id)
                .set({ ['nitrado']: { token: token } }, { merge: true })
            })
          }

          try {
            const nitrado = { token: interaction.fields.getTextInputValue('token-option') };

            const url = 'https://oauth.nitrado.net/token';
            const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
            response.status === 200 ? validToken(nitrado) : invalidToken()

          } catch (error) { invalidToken() }
        }

        if (interaction.customId === 'base-version') {
          const management = await interaction.guild.channels.create({
            name: `Obelisk Management`,
            type: ChannelType.GuildCategory,
          });

          const collector = await interaction.guild.channels.create({
            name: `Obelisk Db Collector`,
            type: ChannelType.GuildCategory,
          });

          const logging = await interaction.guild.channels.create({
            name: `Obelisk Game Logging`,
            type: ChannelType.GuildCategory,
          });

          const commands = await interaction.guild.channels.create({
            name: '⚫│𝗕ot-𝗖ommands',
            type: ChannelType.GuildText,
            parent: management,
          });

          const status = await interaction.guild.channels.create({
            name: '⚫│𝗦erver-𝗦tatus',
            type: ChannelType.GuildText,
            parent: management,
          });

          const playerCollector = await interaction.guild.channels.create({
            name: '📄│𝗣layer-𝗖ollector',
            type: ChannelType.GuildText,
            parent: collector,
          });

          const onlineLogging = await interaction.guild.channels.create({
            name: '🔗│𝗢nline-𝗟ogging',
            type: ChannelType.GuildForum,
            parent: logging,
          });

          const auditLogging = await interaction.guild.channels.create({
            name: '🔗│𝗔udit-𝗟ogging',
            type: ChannelType.GuildForum,
            parent: logging,
          });

          const url = 'https://api.nitrado.net/services';
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });

          const threadCount = [];
          response.data.data.services.forEach(async server => {
            const { id, details } = server;

            //! Obtain channel/message identifier.
            //! Used to send data to discord.
            const onlineLoggingThread = await onlineLogging.threads.create({
              name: `${details.name}` || `Gameserver Unknown - ${id}`,
              type: ChannelType.PrivateThread,
              message: { content: details.name }
            })

            threadCount.push(id)
          })

          //! Pushes all current servers to database.
          //! Used to ensure all servers are connected.
          await db.collection('configuration').doc(interaction.guild.id)
            .set({ ['threadcount']: threadCount })

        }

        if (interaction.customId === 'upgraded-version') {
          console.log('Setting up upgraded version')
        }

      } catch (error) { console.log(error) };
    });
  },
};
