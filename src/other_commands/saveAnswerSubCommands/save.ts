import { channelMention, ChatInputCommandInteraction, disableValidators, Message } from "discord.js";
import * as dbs from "./../../dbs/dbs";


async function checkChannel(interaction: ChatInputCommandInteraction){
    const query = `
    SELECT channelid, save
    FROM ugent.vakken
    where channelid=${interaction.channelId};
    ` ;
    const result = await dbs.pool.query(query);
    if (result.rowCount == 0) return false;
    return result.rows[0].save;  
}

export async function save(interaction: ChatInputCommandInteraction) {
    if (interaction.guild?.id != "978251400872075315"){
        interaction.reply("this feature is only available in the main server for the moment\njoin the main server here https://discord.gg/ebjWC3tBsa")
        return
    }

    let allowed = await dbs.checkUser(interaction.user.id, "save");
    if (!allowed) {
        interaction.reply({content: "You have been banned from using this feature", ephemeral:true});
        return;
    }
    if (! await checkChannel(interaction)){
        interaction.reply({content: "saving answrs is not allowed in this channel"});
        return;
    }

    const filter = (m:any) => m.author.id === interaction.user.id;
    await interaction.reply({ content: "reply to the message you wish to save", ephemeral: true, fetchReply: true})
    try {
        let collected = await interaction.channel?.awaitMessages({filter, max: 1, time: 30000, errors: ['time']});
        if (collected == undefined) throw "err";
        let data = collected.first();
        if (data == undefined || data.reference == undefined) throw "err";

        const channelId = data.reference.channelId;
        const messageId = data.reference.messageId;

        const channel = await data.guild?.channels.cache.get(channelId);
        if (channel == undefined) throw "err";

        if (!channel.isTextBased()) throw "err";

        const message = await channel.messages.cache.get(messageId ?? "");

        if (message == undefined) throw "err";

        await dbs.checkUser(message.author.id, "check");
        

        const hoofdstuk = interaction.options.getInteger('hoofdstuk');
        const oef = interaction.options.getNumber('oef');

        try {
            let result = await dbs.pool.query(`
                insert into ugent.answers (userid, messageid, vak, chapter, oef)
                values (${message.author.id},${messageId}, ${channelId},${hoofdstuk},${oef});
            `);
            interaction.followUp("succesfully saved");
            //give the user who made the answer +2 and the user who saved the answer +2
            await dbs.pool.query(`
                UPDATE ugent.users
                SET "money"="money"+2
                WHERE userid=${message.author.id} or userid=${interaction.user.id};   
            `);
        } catch (err) {
            interaction.followUp("message has already been saved");
        }

    } catch (err){
        console.log(err);
    }
}