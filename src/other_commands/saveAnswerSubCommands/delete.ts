import { ChatInputCommandInteraction, EmbedBuilder, GuildBasedChannel } from "discord.js";
import { dbs } from "./../../dbs/dbs";


export async function deleteAnswer(interaction: ChatInputCommandInteraction){
    await interaction.reply({ content: "reply to the message to delete", ephemeral:true});

    const filter = (m:any) => m.author.id === interaction.user.id;
    try {
        let collected = await interaction.channel?.awaitMessages({filter, max: 1, time: 30000, errors: ['time']});
        if (!collected) throw "err";
        let data = collected.first();
        if (!data || ! data.reference) throw "err";

        let channelId = data.reference.channelId;
        let messageId = data.reference.messageId;


        let channel = await interaction.guild?.channels.fetch(channelId);
    
        if (!channel?.isTextBased()) throw "error retrieving channel";

        //if channel is logging defer the message
        if (channelId == "1095977898508296262"){
            //get the id in front of the message
            const message = await channel.messages.fetch(messageId ?? "");
            if (!message){
                channel.send("error getting message");
                throw "err";
            }
            console.log(message.embeds[0].fields);
            for (let field of message.embeds[0].fields){
                if (field.name == "channelid") channelId = field.value;
                if (field.name == "messageid") messageId = field.value;
            }
        }
        if(!channelId || !messageId) throw "empty id";
        let query = `
        DELETE FROM ugent.answers
        WHERE vak=${channelId} and messageid=${messageId};
        `
        const message = await channel.messages.fetch(messageId);
        //let reqult = await pool.query(query);   //put in comments so it still works but should be reworked
        //should be a function in dbs class updates to come
        interaction.followUp("succesfully deleted answer");

        
        //console.log(reqult);
        const debugchannel = await interaction.guild?.channels.fetch("1095977898508296262");
        if (!debugchannel?.isTextBased()) return;
        let embed = new EmbedBuilder()
                        .setTitle("delete")
                        .setColor(0xFF0000)
                        .setDescription(`<@${interaction.user.id}> delete message from <@${message.author.id}>`)
                        .setFields({
                                    name: "channelid",
                                    value: `${channelId}`
                                },{
                                    name: "messageid",
                                    value: `${messageId}`
                                }, {
                                    name: "content",
                                    value: message.content
                                });
        debugchannel.send({embeds:[embed], files: [...message.attachments.values()]});
        
    } catch (err){
        console.log(err);
    }
}