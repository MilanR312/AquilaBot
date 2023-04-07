import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

import * as dbs from "./../dbs/dbs";

module.exports = {
    data: new SlashCommandBuilder()
                .setName("profile")
                .setDescription("show your profile")
    ,
    async execute(interaction: ChatInputCommandInteraction){
        const user = interaction.user;

        let embed = new EmbedBuilder()
                        .setAuthor({name: user.username})
                        .setTitle("profile")
                        .setThumbnail(user.avatarURL())
                        .setColor(user.accentColor ?? 0x020202)
                        ;

        let result = await dbs.pool.query(`
        select count(*) as cnt
                from ugent.answers
                where userid = ${user.id}`);

        const totalSavedAnswers = (result.rowCount == 0) ? 0 : result.rows[0].cnt;

        embed.addFields({name:"total Saved answers", value:totalSavedAnswers});

        result = await dbs.pool.query(`
        select count(*) as cnt, vak.channelid 
        from ugent.answers ans
        inner join ugent.vakken as vak on vak.channelid = ans.vak
        where userid = ${user.id}
        group by vak.channelid 
        order by count(*) desc;
        `);
        let d = (result.rowCount > 3) ? result.rows.slice(0,3) : result.rows;
        embed.addFields({name:"best channels", value:"top 3 channels"});
        d.forEach(async (row, index) => {
            const channel = await interaction.guild?.channels.fetch(row.channelid);
            embed.addFields({name:`${index+1}`, value:channel?.name ?? "deleted?", inline:true});
        });      
        
        interaction.reply({embeds:[embed]});
        
    }
}