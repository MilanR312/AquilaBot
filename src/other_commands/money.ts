import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import * as dbs from "./../dbs/dbs";



module.exports = [{
    data: new SlashCommandBuilder()
        .setName("bal")
        .setDescription("show the amount of money")
        .addUserOption(option => option.setName("user")
                                    .setDescription("choose a user")
                                    .setRequired(false)
        ),
        async execute(interaction: ChatInputCommandInteraction){
            const user = interaction.options.getUser('user', false) ?? interaction.user;
            
            const data = await dbs.pool.query(`
                select "money"
                from ugent.users
                where userid=${user.id}
            `);
            const money = (data.rowCount == 0) ? 0 : data.rows[0].money;

            //add a more personalized embed with possible /profile?
            const emb = new EmbedBuilder()
                                .setTitle(`balance of ${user.username}`)
                                .setFields({name: "money", value:money});
            interaction.reply({embeds: [emb] });
        }
}, {
    data: new SlashCommandBuilder()
                .setName("baltop")
                .setDescription("show baltop")
        ,
        async execute(interaction: ChatInputCommandInteraction){
            const data = await dbs.pool.query(`
                select userid, "money"
                from ugent.users
                order by "money" desc
                limit 20;
            `);

            let emb = new EmbedBuilder()
                        .setTitle("baltop")
            console.log(data.rowCount);
            data.rows.forEach(async (row) => {
                const user = await interaction.guild?.members.fetch(row.userid);
                emb.addFields({name: user?.user.username ?? "deleted", value: row.money});
            })
            interaction.reply({embeds: [emb]});
        }
}
]