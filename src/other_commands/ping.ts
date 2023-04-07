import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js"

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with pong'),
    async execute(interaction: ChatInputCommandInteraction){
        interaction.reply({content: 'Pong'});
    }
}