import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";

export module save {

    export var commandname = "save";
    
    export function Command(subcommand: SlashCommandSubcommandBuilder){
        subcommand
            .setName('save')
            .setDescription("save an answer")
            .addStringOption(option => option.setName('hoofdstuk')
                                            .setDescription('het hoofdstuk om op te slaan')
                                            .setRequired(true)
                                            //.setAutocomplete(true)
            
            )
            .addStringOption(option => option.setName('oef')
                                            .setDescription('oefening')
                                            .setRequired(true)
                                            //.setAutocomplete(true)
            )
        return subcommand;
    }
    export async function Function(interaction: ChatInputCommandInteraction){
        
    }
}

    




