const { MessageEmbed, Interaction } = require('discord.js');

class SubPoll {
    constructor(Question, Answer){
        this.Question = Question.toString();
        this.Answers = Answer.toString().split("|");
        this.len = this.Answers.length
        this.Fields = []

        //generate fields object for every answer
        this.Answers.forEach( (element, index) => {
            const obj = {
                name : "default",
                value : "default",
                inline : true
            }
            obj.name = `${String.fromCharCode(index+65)})`
            obj.value = element;
            this.Fields.push(obj);
        });

        //generate the embed
        this.embed = new MessageEmbed()
            .setTitle(this.Question)
            .setColor('#0099ff')
            .setFields(this.Fields)

        
        console.log("succesfully added question")

    }
}


class Poll {//uptime, amount of questions, answers per question, pinned?, ceator id, titel
    
    constructor(Titel, Description) {
        this.Titel = Titel;
        this.Description = Description
        this.Questions = [];
        this.mainPoll = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(Titel.toString())
            .setDescription(Description.toString())
            .setTimestamp()
    }

    addQuestion(Question, Answer){
        //add a question with answers via a subpoll class
        const newQuestion = new SubPoll(Question,Answer);
        this.Questions.push(newQuestion);
        console.log("added")
    }
    getEmbeds(){
        this.out = [this.mainPoll]
        //return every embed with the amount of answers
        this.Questions.forEach(element => {
            this.out.push([element.embed,element.len])
        })
        return this.out
    }
}
emojiLookup = ["🇦","🇧","🇨"]
async function PrintEmbeds(interaction, data, eph){
    const [main, ...rest] = data;
    await interaction.reply({ embeds: [main], ephemeral: eph})
    console.log(interaction)
    for (const element of rest){
        //for every subpoll send it and add the required reactions
        const message = await interaction.followUp({embeds: [element[0]], ephemeral: eph, fetchReply: true})
        //console.log(message)
        if (eph) continue;
        for (i = 0; i < element[1]; i++){
            message.react(emojiLookup[i])
        }
    }
}
async function GetEmbedData(msg){
    console.log(msg.embeds)
    msg.embeds.forEach((embed) => {
        fields = embed.fields;
    })
}
function ChangeData(intercation, msg, data, object){
    emb = msg.embeds[0]
    oldData = emb[object];
    user = intercation.user.id;
    console.log("olddata " + oldData)
    console.log("data = " + data.content)

    switch(object){
        case 'title':
        case 'description':
            emb[object] = data.content;
            msg.edit({embeds: [emb]})
            break;
    }
    return `User <@${user}> changed ${object} from message found here ${msg.url}\nfrom "${oldData}" to "${data.content}"`

}

module.exports = {PrintEmbeds, Poll, GetEmbedData, ChangeData}
