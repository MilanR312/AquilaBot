const { MessageEmbed, Interaction } = require('discord.js');


async function senderMult(interaction, res){
    embed = new MessageEmbed()
        .setTitle("multiple options found")
        .setDescription("choose which user you wish to see the answer for")

    result = res.rows.map( async quer => {
        const data = await interaction.guild.members.fetch(quer.userid)
        return {name:data.user.username, value: "score = 0"}
    })
    results = await Promise.all(result)
    embed.addFields(results)
    reaction_numbers = ["\u0031\u20E3","\u0032\u20E3","\u0033\u20E3","\u0034\u20E3","\u0035\u20E3", "\u0036\u20E3","\u0037\u20E3","\u0038\u20E3","\u0039\u20E3"]
    const message = await interaction.reply({embeds: [embed], fetchReply : true})
    for (i = 0; i < res.rowCount; i++){
        await message.react(reaction_numbers[i])
    }
    try {
        console.log("checking reactions")
        const filter = (reaction, user) => {
            return reaction_numbers.includes(reaction.emoji.name) && user.id !== message.author.id;
        };
        const collected = await message.awaitReactions({filter: filter, max: 1, time:60000, errors: ['time']})
        const reaction = collected.first()


        const ind = parseInt(reaction.emoji.name[0])
        const mess = await senderSingle(interaction,res,true,ind-1)
        interaction.followUp(mess)
        
    } catch (err) {
        console.log(err)
        console.log("timeout")
    }
    
}
async function senderSingle(interaction, res, channelB, messageIndex = 0){

    const data = res.rows[messageIndex]
    console.log(data)
    const userName = await interaction.guild.members.fetch(data.userid)
    
    content = "empty"
    if (channelB){
        channel = await interaction.guild.channels.fetch(data.vak)
        message = await channel.messages.fetch(data.messageid)
        console.log(message)
        content = message.content
        console.log(content)
        console.log(message.attachments)
        att = []
        try{
            for( const [key, value] of message.attachments){
                att.push(value)
            }
        } catch (e) {
            console.log(e)
        }
        console.log(att)
    }
    return {content: `Found an answer from user ${userName} with content\n"${content}"`, files: [...att]}
}

module.exports = {senderMult, senderSingle}