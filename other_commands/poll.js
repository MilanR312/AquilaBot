const { SlashCommandBuilder } = require('@discordjs/builders');

const {PrintEmbeds, Poll, GetEmbedData, ChangeData}  = require('./PollData/PollBuild');
const {checkUserInPoll, checkReference, checkEmbeds} = require('./PollData/PollChecks')
lastActivePoll = {};
var util = require('util');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Used to make a poll')
        .addSubcommand(subcommand => 
            subcommand
                .setName('create')
                .setDescription('Default Setup for poll')
                .addStringOption(option => option.setName('title').setRequired(true).setDescription('The title of the poll'))
                .addStringOption(option => option.setName('description').setRequired(true).setDescription('The title of the poll'))
            )
        .addSubcommand(subcommand =>
            subcommand
                .setName('addquestion')
                .setDescription('Adds a question to the poll')
                .addStringOption(option => option.setName('question').setRequired(true).setDescription('The title of the poll'))
                .addStringOption(option => option.setName('answer').setRequired(true).setDescription('The title of the poll'))
            )
        .addSubcommand(subcommand =>
            subcommand
                .setName('confirm')
                .setDescription('send the poll')
            )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('deletes your current active poll')
            )
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('ttest')
                .addStringOption(option => option.setName('value').setDescription('ba').addChoices(
                    { name: 'titel', value: 'title' },
                    { name: 'description', value: 'description'},
                    { name: 'answers', value: 'fields'}
                ))
            )
        ,
    async execute(interaction) {
        console.log(lastActivePoll);
        const subcommand = interaction.options.getSubcommand();
        const UserId = interaction.user.id;
        try{
            switch(subcommand){
                case 'create':
                    const Titel = interaction.options.getString('title');
                    const Description = interaction.options.getString('description');
        
                    //generate new poll with previous data
                    let Polltest = new Poll(Titel, Description);
                    lastActivePoll[UserId] = Polltest;
                    //send the current poll
                    interaction.reply({ embeds: [Polltest.mainPoll] , ephemeral: true});
                    console.log(lastActivePoll)
                    break;
                case 'addquestion':
                    checkUserInPoll(lastActivePoll, interaction)
 
                    const Question = interaction.options.getString('question');
                    const Answer = interaction.options.getString('answer');
                    
                    //add the question to the active poll
                    lastActivePoll[UserId].addQuestion(Question,Answer);
        
                    //send the current poll
                    PrintEmbeds(interaction, lastActivePoll[UserId].getEmbeds(), true)
                    break;
                case 'confirm':
                    checkUserInPoll(lastActivePoll, interaction)

                    //send the poll and add reactions
                    PrintEmbeds(interaction, lastActivePoll[UserId].getEmbeds(), false)
                    break;
                case 'delete':
                    delete lastActivePoll[UserId]
                    interaction.reply({ content: "Succesfully deleted your poll", ephemeral: true})
                    break;
                case 'edit':
                    const filter = m => m.author.id === interaction.user.id;
                    const ObjectValue = interaction.options.getString('value')
                    var data
                    await interaction.reply({ content: "Succesfully started edit setup\nReply to the poll you wish to edit and send it hereafter", ephemeral: true, fetchReply: true})
                        .then(() => interaction.channel.awaitMessages({filter, max: 1, time: 30000, errors: ['time']}))
                        .then(collected => {
                            data = collected.first() //collect the data en check if it is valid
                            checkReference(data, interaction)

                            const messageId = data.reference.messageId; // get the replied message
                            const channelId = data.reference.channelId;
                            return data.guild.channels.cache.get(channelId).messages.fetch(messageId)
                        })
                        .then(message => {
                            checkEmbeds(message) //check if the message has an embed and change the data
                            result = ChangeData(interaction, message, data, ObjectValue)
                            //used to log messages
                            //interaction.guild.channels.cache.get("992758684981669999").send(result)
                        })
                        .catch(err => {
                            console.log("error name = " + err.name) //print the error code
                            if (typeof err.name === 'string'){
                                interaction.followUp({ content: err.content, ephemeral: true});
                            } else {
                                interaction.followUp({ content: 'Timelimit reached, shutting down edit', ephemeral: true});
                            }
                        });
                        break;
                }
        } catch (e){
            console.log(e)
            interaction.reply({ content: e.message, ephemeral: true});
        }

    }
};