import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import {save} from "./save";
//import {get} from "../../other_commands/saveAnswerSubCommands/get";


export default {
    data: new SlashCommandBuilder()
    .setName('answer')
    .setDescription('Answer opslaan')
    .addSubcommand(
        subcommand => save.Command(subcommand)
    )
    .addSubcommand( subcommand =>
        subcommand
        .setName('get')
        .setDescription('get an answer for your question')
        .addStringOption(option => option.setName('vak')
                                        .setDescription('welk vak de oef over gaat')
                                        .setRequired(true)
                                        .setAutocomplete(true)
        )
        .addStringOption( option => option.setName('hoofdstuk')
                                        .setDescription('b')
                                        .setRequired(true)
                                        //.setAutocomplete(true)
        )
        .addStringOption( option => option.setName('oef')
                                        .setDescription('c')
                                        .setRequired(true)
                                        //.setAutocomplete(true)
        )
    )/*
    .addSubcommand( subcommand => 
        subcommand
        .setName('stats')
        .setDescription('get the answer stats of user')
        .addUserOption(option => option.setName('user')
                                        .setDescription('get stats of other user')
                                        .setRequired(false)
        )
    )
    .addSubcommand( subcommand => 
        subcommand
        .setName('list')
        .setDescription('get a list of all the saved answers')
        .addStringOption(option => option.setName('vak')
                                            .setDescription('test')
                                            .setRequired(false)
                                            .setAutocomplete(true)
        )
        .addIntegerOption(option => option.setName('hoofdstuk')
                                            .setDescription('b')
                                            .setRequired(false)
        )
        .addNumberOption( option => option.setName('oef')
                                            .setDescription('c')
                                            .setRequired(false)
        )
        .addMentionableOption( option => option.setName('test')
                                                .setDescription('d')
                                                .setRequired(false)
        )
    )*/
    ,
    async execute(interaction: ChatInputCommandInteraction) {
        const subcommand = interaction.options.getSubcommand();
        switch (subcommand){
            case save.commandname:
                await save.Function(interaction);
                break;
            /*case 'get':
                await get(interaction);
                break;*/
            }
    }
}