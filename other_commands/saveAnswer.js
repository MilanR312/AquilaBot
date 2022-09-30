const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, Message } = require('discord.js');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const fs = require("fs");
const { symbolName, InvalidatedProjectKind } = require('typescript');
const {senderMult, senderSingle } = require('./saveData/answerGet')
const {checkuser} = require('./saveData/DBChecks')

vakken = require("./saveData/vakken.json")

dotenv.config();
const User = process.env.PGUSER
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

/*pool.query(
    "select naam as name, channelid as value from ugent.vakken;",
    ((err, res) => {
        if (!res.rows) reject("no data found")
        vakken = res.rows
        console.log(vakken)
        var vakJson = JSON.stringify(vakken);
        fs.writeFile('./other_commands/saveData/vakken.json', vakJson, err =>console.log("wrote file"));
    })
)*/
//console.log(vakken);

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
                                            .setAutocomplete(true)
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
                                            .setAutocomplete(true)
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
        .addSubcommand( subcommand => 
            subcommand
            .setName('list')
            .setDescription('te')
            .addStringOption(option => option.setName('vak')
                                                .setDescription('test')
                                                .setRequired(false)
                                                .setAutocomplete(true)
            )
            .addIntegerOption(option => option.setName('hoofdstuk')
                                                .setDescription('b')
                                                .setRequired(false)
            )
            .addNumberOption( option => option.setName('oef')
                                                .setDescription('c')
                                                .setRequired(false)
            )
            .addMentionableOption( option => option.setName('test')
                                                    .setDescription('d')
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

        if (['save','get','list'].includes(subcommand) && !vakken.map(vak => vak.value).includes(vak)){
            interaction.reply({content: "doesnt exist", ephemeral:true})
            return
        }

        console.log("vak = " + vak + "  hoofdstuk ==" + hoofdstuk + " oef == " + oef)
        switch (subcommand){
            case 'save':
                try {
                    if (interaction.guild.id != "978251400872075315"){
                        throw "Error"
                    }
                } catch(err){
                    interaction.reply("this feature is only available in the main server for the moment\njoin the main server here https://discord.gg/ebjWC3tBsa")
                    return
                }
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
                        console.log("got an erro while checking user")
                    }
                    //dupe key check code again
                    pool.query(`
                    insert into ugent.answers (userid, messageid, embeddata, vak, chapter, oef)
                    values (${message.author.id},${messageId},false, ${channelId},${hoofdstuk},${oef});
                    `, (err, res) => { console.log("checked if user existed")
                        if (err) interaction.followUp(`message has already been saved, try using \/answer get`)
                        else interaction.followUp('succesfully saved')})
                } catch (err) {
                    console.log(err)
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
                console.log(username,UserIdToStat);
                max = 0
                pool.query(`
                select count(*)
                from ugent.answers
                where userid = ${UserIdToStat}
                `, (err, res) => max = res.rows[0].count) //bug here
                pool.query(`
                select count(*), uv.naam
                from ugent.answers as ua
                inner join ugent.vakken as uv on uv.channelid = ua.vak
                where userid = ${UserIdToStat}
                group by uv.naam
                order by count(*) desc;
                `, (err, res) => {interaction.reply(`User ${username} has a max amount of ${max} answers\n${res.rows[0].count} in channel ${res.rows[0].naam}`)})

                break;
            case 'list':
                total = 0
                invalid = false
                items = [vak, hoofdstuk, oef]
                console.log(items)
                for (const [index,ell] of items.entries()){
                    total += !!ell
                    invalid = (!!ell && total <= index) ? true : invalid
                }
                if (invalid){
                    interaction.reply("User heeft een hoofdstuk of oefening gegeven zonder vak en/of hoofdstuk ")
                    return;
                }
                const options = {
                    vak: 0,
                    hoofdstuk: 1,
                    oef: 2,
                    suboef : 3
                }

                var opt = {
                    title: "",
                    descript: "",
                    loc: "",
                    query: ``
                }
                switch (total){
                    case options.vak:
                        opt.query = `
                        select uv.naam, count(*)
                        from ugent.answers as ua
                        inner join ugent.vakken as uv on uv.channelid = ua.vak
                        group by uv.naam
                        order by count(*) desc;
                        `
                        opt.title = "vakken"
                        opt.loc = "vak"
                        break;
                        
                    case options.hoofdstuk:
                        opt.query = `
                        select chapter as "naam", count(*)
                        from ugent.answers
                        where vak = ${vak}
                        group by chapter
                        order by count(*) desc;
                        `
                        opt.title = "hoofdstukken"
                        opt.loc = "h"
                        break;
                    case options.oef:
                        opt.query = `
                        select oef as "naam", count(*)
                        from ugent.answers
                        where vak = 978251401698365442 and chapter = 1
                        group by oef
                        order by count(*) desc;
                        `
                        opt.title = "oefeningen"
                        opt.loc = "oef"
                        break;
                }
                console.log(opt)
                function getString(obj,res){
                    const data = res.rows[0]
                    return `${obj.loc} ${data.naam} has a total of ${data.count} answers"`
                }
                function getEmbed(obj, res){
                    console.log(obj);
                    console.log("here");
                    embed = new EmbedBuilder()
                                    .setTitle(`${obj.title}`)
                                    .setDescription(`amount of answers`)
                    results = res.rows.map( data => {return {name: `${obj.loc} ${data.naam}`, value:`has a total of ${data.count} answers`}})
                    embed.addFields(results)
                    return embed
                }

                async function getData(obj){
                    return new Promise((resolve, reject) => {
                        pool.query(obj.query, (err, res) => {
                            console.log(res)
                            console.log(obj)
                            switch (res.rowCount){
                                case 0:
                                    reject("no answers found for the specified parameters")
                                    break;
                                case 1:
                                    resolve(getString(obj,res))
                                    break;
                                default:
                                    resolve(getEmbed(obj, res));
                                    break;
                            }
                            //pool.end()
                        })
                    })
                }
                
                result = await getData(opt)
                console.log(result)
                if (typeof result === 'string'){
                    interaction.reply(result)

                } else {
                    interaction.reply({embeds: [result]})
                }
                break;
            }   
    }
}]   