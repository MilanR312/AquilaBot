import { EmbedBuilder } from "discord.js";
import { User } from "discord.js";
import { MessageReaction } from "discord.js";
import { ChatInputCommandInteraction } from "discord.js"
import { QueryResult } from "pg";

export async function getAnswerMessage
(interaction: ChatInputCommandInteraction, result: QueryResult<any>, messageindex = 0){
    const data = result.rows[messageindex];

    const userName = await interaction.guild?.members.fetch(data.userid) ?? "Deleted user";

    const channel = await interaction.guild?.channels.fetch(data.vak);
    if (!channel?.isTextBased()) throw "wtf";

    const message = await channel.messages.fetch(data.messageid);

    let attachments = message.attachments.values();
    let content = message.content;

    return {content: `Found an answer from user ${userName} with content\n"${content}"`, files: [...attachments]}

}

export async function getAnswerMessages
(interaction: ChatInputCommandInteraction, result: QueryResult<any>){
    let embed = new EmbedBuilder()
                .setTitle("multiple options found")
                .setDescription("choose which answer to see")
    let results = result.rows.map( async quer => {
        const data = await interaction.guild?.members.fetch(quer.userid);
        return {name: data?.user.username ?? "deleted", value: `score = ${quer.money}`}
    });
    let resultData = await Promise.all(results);
    embed.addFields(resultData);

    const reaction_numbers =  ["\u0031\u20E3","\u0032\u20E3","\u0033\u20E3","\u0034\u20E3","\u0035\u20E3", "\u0036\u20E3","\u0037\u20E3","\u0038\u20E3","\u0039\u20E3"]
    const message = await interaction.reply({embeds: [embed], fetchReply: true})
    for (let i = 0; i < result.rowCount; i++){
        await message.react(reaction_numbers[i]);
    }

    try {
        const filter = (reaction:MessageReaction, user:User) => {
            if (reaction.emoji.name == null) return false;
            return reaction_numbers.includes(reaction.emoji.name) && user.id !== message.author.id;
        }

        const collected = await message.awaitReactions({filter, max: 1, time:60000, errors: ['time']});
        const reaction = collected.first();
        if (reaction == undefined || reaction.emoji.name == null) throw "wtf";

        const ind = parseInt(reaction.emoji.name[0]);
        const mess = await getAnswerMessage(interaction,result, ind);
        interaction.followUp(mess);
    } catch (err) {
        console.log(err);
    }

}