const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Message } = require('discord.js');
const dotenv = require('dotenv');
const { Pool } = require('pg')
const {senderMult, senderSingle } = require('./saveData/answerGet')
const {checkuser} = require('./saveData/DBChecks')

dotenv.config();
const User = process.env.PGUSER
console.log(typeof User, User)
const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: parseInt(process.env.PGPORT)   
})
pool.on('error', (err, client) => {
    console.error('error in backend', err)
    process.exit(-1)
})
module.exports = [{
    data: new SlashCommandBuilder()
        .setName('answer')
        .setDescription('Answer opslaan')
        .addSubcommand( subcommand => 
            subcommand
            .setName('save')
            .setDescription("test")
            .addStringOption(option => option.setName('vak')
                                            .setDescription('welk vak de oef over gaat')
                                            .setRequired(true)
                                            .addChoices(
                                                {name : "wiskunde-i", value : "978251401698365442"}
                                            )
            )
            .addIntegerOption(option => option.setName('hoofdstuk')
                                            .setDescription('het hoofdstuk om op te slaan')
                                            .setRequired(true)
            
            )
            .addNumberOption(option => option.setName('oef')
                                            .setDescription('oefening')
                                            .setRequired(true)
            )
        )
        .addSubcommand( subcommand =>
            subcommand
            .setName('get')
            .setDescription('temp')
            .addStringOption(option => option.setName('vak')
                                            .setDescription('welk vak de oef over gaat')
                                            .setRequired(true)
                                            .addChoices(
                                                {name : "wiskunde-i", value : "978251401698365442"}
                                            )
            )
            .addIntegerOption( option => option.setName('hoofdstuk')
                                            .setDescription('b')
                                            .setRequired(true)
            )
            .addNumberOption( option => option.setName('oef')
                                            .setDescription('c')
                                            .setRequired(true)
            )
        )
        .addSubcommand( subcommand => 
            subcommand
            .setName('stats')
            .setDescription('get stats of user')
            .addUserOption(option => option.setName('user')
                                            .setDescription('get stats of other user')
                                            .setRequired(false)
            )
        )
        ,
    async execute(interaction) {
        const userId = interaction.user.id;
        const subcommand = interaction.options.getSubcommand();
        const vak = interaction.options.getString('vak');
        const hoofdstuk = interaction.options.getInteger('hoofdstuk');
        const oef = interaction.options.getNumber('oef');

        console.log("vak = " + vak + "  hoofdstuk ==" + hoofdstuk + " oef == " + oef)
        switch (subcommand){
            case 'save':
                try {
                    await checkuser(pool,userId)
                } catch (err) {
                    interaction.reply({content: err, ephemeral: true})
                    return
                }

                const filter = m => m.author.id === interaction.user.id;
                await interaction.reply({ content: "reply to the message you wish to save", ephemeral: true, fetchReply: true})
                try {
                    collected = await interaction.channel.awaitMessages({filter, max: 1, time: 30000, errors: ['time']})
                    data = collected.first()
                    const messageId = data.reference.messageId; // get the replied message
                    const channelId = data.reference.channelId;
                    const message = await data.guild.channels.cache.get(channelId).messages.fetch(messageId)
                    try { await checkuser(pool,message.author.id, true)}
                    catch (err) {
                        console.log(err)
                    }
                    //dupe key
                    pool.query(`
                    insert into ugent.answers (userid, messageid, embeddata, vak, chapter, oef)
                    values (${message.author.id},${messageId},false, ${channelId},${hoofdstuk},${oef});
                    `, (err, res) => { console.log(res)
                        interaction.followUp(`message has already been saved, try using \/answer get`)})
                } catch (err) {
                    console.log("time reached")
                }
                

                break;
            case 'get':
                pool.query(`
                SELECT * FROM ugent.answers
                where vak = ${vak} and chapter = ${hoofdstuk} and oef = ${oef}
                ORDER BY answerdid ASC LIMIT 10`, (err, res) => {
                    console.log(res)
                    switch (res.rowCount){
                        case 0:
                            interaction.reply("no answers found for this oef")
                            break;
                        case 1:
                            senderSingle(interaction,res, true)
                                .then( message => {
                                    console.log(message)
                                    interaction.reply(message)
                                })
                            break;
                        default:
                            senderMult(interaction, res);
                            break;
                    }
                    //pool.end()
                })
                break;
            case 'stats':
                const user = interaction.options.getUser('user')
                console.log(interaction.user)
                console.log(user)
                username = interaction.user.username;
                UserIdToStat = userId
                if (user != null){
                    username = user.username
                    UserIdToStat = user.id
                }
                max = 0
                pool.query(`
                select count(*)
                from ugent.answers
                where userid = ${UserIdToStat}
                `, (err, res) => max = res.rows[0].count)
                pool.query(`
                select count(*), uv.naam
                from ugent.answers as ua
                inner join ugent.vakken as uv on uv.channelid = ua.vak
                where userid = ${UserIdToStat}
                group by uv.naam
                order by count(*) desc;
                `, (err, res) => {interaction.reply(`User ${username} has a max amount of ${max} answers\n${res.rows[0].count} in channel ${res.rows[0].naam}`)})

                break;
            }   
    }
}]   