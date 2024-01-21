import { ChatInputCommandInteraction, Guild, Message, SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";
import { Err, Ok, Result, WrapErr } from "../../types/result/result";
import { serverdata } from "../../data/server";
import { Wrap } from "../../types/option/option";
import { $try } from "../../types/try"
import { DbsUser } from "../../dbs/user";
import { DbsVak } from "../../dbs/vak";

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
        NotInGuildError,
        InvalidHoofdstuk,
        InvalidOef,
        UserCreationError,
        UserBanned,
        ChannelNonSaveable,
        ChannelNotExists,
        ReplyTimeout,
        InvalidMessage
    }
    //allows all inputs of form (number, examen)
    const hoofdstuk_check = /^(?:\d+|examen)$/gi;

    //allows all inputs of form (number(.number)+(letter) | samenvatting)
    //bv 2e 5.1 5.2.1 8.6e samenvatting
    const oef_check = /^(?:\d+(?:(?:(?:\.|,)\d+|\w))*|samenvatting)$/gi;

    function getGuild(interaction: ChatInputCommandInteraction): Result<Guild, Error>{
        let guild = Wrap(interaction.guild)
            .filter(guild => guild.id === serverdata.guild_id)
            .okOr(Error.NotInGuildError);
        if (guild.isErr()){
            interaction.reply("this command only works inside the main server");
        }
        return guild;
    }

    function getInputs(interaction: ChatInputCommandInteraction): Result<{hoofdstuk: string, oef: string}, Error>{
        let hoofdstuk = interaction.options.getString("hoofdstuk", true);
        let oef = interaction.options.getString("oef", true);

        if (!hoofdstuk_check.exec(hoofdstuk)){
            interaction.reply(`hoofdstuk niet van vorm ${hoofdstuk_check}
            vb van correcte vorm zijn (1, 25, examen)`);
            return Err(Error.InvalidHoofdstuk);
        }
        if (!oef_check.exec(oef)){
            interaction.reply(`oefening niet van vorm ${oef_check}
            vb  van correcte vorm van oef zijn (2e, 5.1, 5.2.1, 8.6e, samenvatting)`);
            return Err(Error.InvalidOef);
        }
        return Ok({hoofdstuk: hoofdstuk, oef: oef.replace(",",".")});
    } 

    async function getUser(interaction: ChatInputCommandInteraction): Promise<Result<DbsUser, Error>>{
        let user = $try!(
            (await DbsUser.getUserOrCreate(interaction.user.id))
                .mapErr((_) => Error.UserCreationError)
            );

        if (user.banned){
            interaction.reply({content: "you have been banned from saving answers", ephemeral: true});
            return Err(Error.UserBanned);
        }
        return Ok(user);
    }

    async function getChannel(interaction: ChatInputCommandInteraction): Promise<Result<DbsVak, Error>>{
        let channel = $try!( (await DbsVak.getVak(interaction.channelId))
            .mapErr((_) => Error.ChannelNotExists)
        );

        if (channel.allowedSave){
            return Ok(channel);
        } else {
            return Err(Error.ChannelNonSaveable);
        }
            
    }

    async function getReply(interaction: ChatInputCommandInteraction): Promise<Result<Message<boolean>, Error>>{
        const user_filter = (m:any) => m.author.id === interaction.user.id;
        await interaction.reply({ content: "reply to the message you wish to save", ephemeral: true/*, fetchReply: true*/});

        let channel = $try!(Wrap(interaction.channel)
            .okOr(Error.ChannelNotExists));
        if (!channel.isDMBased()){
            return Err(Error.ChannelNotExists);
        }
        try {
            let message = await channel.awaitMessages({filter: user_filter, max: 1, time: 30000, errors:["time"]})
            return Wrap(message.first())
                .filter(message => message.reference != null)
                .okOr(Error.InvalidMessage);
        } catch {
            return Err(Error.ReplyTimeout)
        }

    }


    export async function Function(interaction: ChatInputCommandInteraction): Promise<Result<void,Error>>{
        let guild = $try!(getGuild(interaction));

        let oef_data = $try!(getInputs(interaction));        

        let user = $try!(await getUser(interaction));

        let vak = $try!(await getChannel(interaction));

        let message = $try!(await getReply(interaction));

        return Ok((()=>{})());
    }
}

    




