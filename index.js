const { Client, Intents, Modal, TextInputComponent, MessageActionRow, MessageEmbed } = require('discord.js');
const { token, cooldown, approvedRoles, amount } = require('./config.json');
const fs = require('fs');
const isAddress = require('./utils/address');
const sendFunds = require('./utils/sendFunds.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const Keyv = require('keyv');
const keyv = new Keyv();

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.on('interactionCreate', async interaction => {
	if (interaction.isButton()) {
		if (interaction.customId === 'faucet-button') {
			const modal = new Modal()
				.setCustomId('faucet-modal')
				.setTitle('Faucet')
				.addComponents([
					new MessageActionRow().addComponents(
						new TextInputComponent()
							.setCustomId('faucet-input')
							.setLabel('Address')
							.setStyle('SHORT')
							.setMinLength(42)
							.setMaxLength(42)
							.setPlaceholder('0x0000000000000000000000000000000000000000')
							.setRequired(true),
					),
				]);

			await interaction.showModal(modal);
		}
	}

	if (interaction.isModalSubmit()) {
		if (interaction.customId === 'faucet-modal') {
			const address = interaction.fields.getTextInputValue('faucet-input');
			if (!isAddress(address)) {
				return interaction.reply({ content: 'Please enter a valid Ethereum Address', ephemeral: true });
			}

			// If the last transaction was less than 15 seconds ago, disallow to prevent nonce reuse (no concurrent transactions ATM)
			const lastTx = await keyv.get('lastTx');
			if (lastTx > Date.now() - 15000) {
				const timeLeft = 15000 - (Date.now() - lastTx);
				return interaction.reply({ content: `Please wait 15 seconds between requests to prevent nonce issues. Try again in ${timeLeft / 1000}s.`, ephemeral: true });
			}

			if (!approvedRoles.some(role => interaction.member.roles.cache.has(role))) {
				const lastRequested = await keyv.get(interaction.user.id);
				if (lastRequested) {
					if (Date.now() - lastRequested < cooldown) {
						const timeLeft = Math.floor(((cooldown - (Date.now() - lastRequested)) / 1000) / 60);
						return interaction.reply({ content: `You can only request funds once every 60 minutes. Please try again in ${timeLeft} minutes.`, ephemeral: true });
					}
				}
			}

			try {
				const request = await sendFunds(address, amount);
				if (request.status === 'success') {
					const embed = new MessageEmbed()
						.setColor('#3BA55C')
						.setDescription(`[View on Oonescan](https://dev.oonescan.com/tx/${request.message})`);
					interaction.reply({ content: `Transaction for ${amount} tOONE created.`, embeds: [embed], ephemeral: true });
				}
				else {
					return interaction.reply({ content: `Failed to send funds. Error: ${request.message}`, ephemeral: true });
				}

				// If not an approved role, set the last requested time
				if (!approvedRoles.some(role => interaction.member.roles.cache.has(role))) {
					await keyv.set(interaction.user.id, Date.now());
				}
				await keyv.set('lastTx', Date.now());
			}
			catch (error) {
				interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
	}
});

client.login(token);