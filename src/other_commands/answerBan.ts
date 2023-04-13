import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { ban } from "./saveAnswerSubCommands/ban";
import { deleteAnswer } from "./saveAnswerSubCommands/delete";


module.exports = {
    data: new SlashCommandBuilder()
            .setName("modanswer")
            .setDescription("mod answer options")
            .addSubcommand( subcommand =>
                subcommand
                    .setName("ban")
                    .setDescription("ban user from saving")
                    .addUserOption( option =>
                        option
                            .setName("user")
                            .setDescription("user to be banned")
                    )    
            )
            .addSubcommand( subcommand => 
                subcommand
                    .setName("delete")
                    .setDescription("delete a message")
            )
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            ,
            async execute(interaction: ChatInputCommandInteraction){
                const subCommand = interaction.options.getSubcommand();
                switch (subCommand){
                    case 'ban':
                        await ban(interaction);
                    case 'delete':
                        await deleteAnswer(interaction);
                }
            }
}