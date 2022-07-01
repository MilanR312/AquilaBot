const { SlashCommandBuilder } = require('@discordjs/builders');

const {PrintEmbeds, Poll, GetEmbedData}  = require('./PollData/PollBuild');

lastActivePoll = {};


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
                    { name: 'titel', value: 'titel' },
                    { name: 'description', value: 'description'},
                    { name: 'answers', value: 'answer'}
                ))
            )
        ,
    async execute(interaction) {
        console.log(lastActivePoll);
        const subcommand = interaction.options.getSubcommand();
        const UserId = interaction.user.id;

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
            case 'addQuestion':
                if (!UserId in lastActivePoll){
                    interaction.reply({ content: "No active polls found, start a new poll using /poll create", ephemeral: true});
                    return;
                }
                const Question = interaction.options.getString('question');
                const Answer = interaction.options.getString('answer');
                
                //add the question to the active poll
                lastActivePoll[UserId].addQuestion(Question,Answer);
    
                //send the current poll
                PrintEmbeds(interaction, lastActivePoll[UserId].getEmbeds(), true)
                break;
            case 'confirm':
                //send the poll and add reactions
                PrintEmbeds(interaction, lastActivePoll[UserId].getEmbeds(), false)
                break;
            case 'delete':
                delete lastActivePoll[UserId]
                interaction.reply({ content: "Succesfully deleted your poll", ephemeral: true})
                break;
            case 'edit':
                //console.log(interaction)
                console.log(interaction.user.id)
                const filter = m => m.author.id === interaction.user.id;

                const temp = interaction.options.getString('value')
                console.log(temp)


                await interaction.reply({ content: "Succesfully started edit setup\nReply to the poll you wish to edit and send it hereafter", ephemeral: true, fetchReply: true})
                    .then(() => {
                        interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] })
                            .then(collected => {
                                const message = collected.first()
                                console.log(message)
                                interaction.followUp(`User wants to edit ${temp} from message with id = ${message.reference.messageId}\nWith content "${message.content}"`);
                            })
                            .catch(collected => {
                                interaction.followUp('Timelimit reached, shutting down edit');
                            });
                    });
                    break;
        }
    }
};