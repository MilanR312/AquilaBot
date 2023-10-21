import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";
import { Err, Ok, Result, WrapErr } from "src/types/result/result";
import { serverdata } from "src/data/server";
import { Wrap } from "src/types/option/option";
import { $try } from "src/types/try"

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
    enum Error {
        NotInGuildError = "guild not valid",
        InvalidHoofdstuk = "hoofdstuk niet van vorm __",
        InvalidOef = "oefening niet van vorm __"
    }
    //allows all inputs of form (number, examen)
    const hoofdstuk_check = /^(?:\d+|examen)$/gi;

    //allows all inputs of form (number(.number)+(letter) | samenvatting)
    //bv 2e 5.1 5.2.1 8.6e samenvatting
    const oef_check = /^(?:\d+(?:(?:(?:\.|,)\d+|\w))*|samenvatting)$/gi;

    export async function Function(interaction: ChatInputCommandInteraction): Promise<Result<void,Error>>{
        let guild = $try!(
            Wrap(interaction.guild)
            .filter(guild => guild.id == serverdata.guild_id)
            .okOr(Error.NotInGuildError)
        );

        let hoofdstuk = interaction.options.getString("hoofdstuk", true);
        let oef = interaction.options.getString("oef", true);

        

        return Ok((()=>{})());
    }
}

    




