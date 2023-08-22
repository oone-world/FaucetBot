const { amount } = require('../config.json');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const sendFunds = require('../utils/sendFunds.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('faucet')
		.setDescription('Request testnet funds from the faucet')
		.addStringOption(option =>
			option.setName('address')
				.setDescription('The address to request funds from the faucet')
				.setRequired(true)),
	async execute(interaction) {
		const address = interaction.options.get('address').value.trim();

		await interaction.reply('Request sent to OONE Chain Testnet. Please check the link to see if it\'s mined.');
		const request = await sendFunds(address, amount);

		if (request.status === 'success') {
			const embed = new MessageEmbed()
				.setColor('#3BA55C')
				.setDescription(`[View on Oonescan](https://dev.oonescan.com/tx/${request.message})`);
			return interaction.followUp({ content: `Transaction for ${amount} tOONE created.`, embeds: [embed] });
		}
		else {
			return interaction.followUp(`Failed to send funds. Error: ${request.message}`);
		}
	},
};