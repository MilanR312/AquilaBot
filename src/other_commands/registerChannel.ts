
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import {pool} from "./../dbs/dbs";
module.exports = {
    data: new SlashCommandBuilder()
                .setName('register')
                .setDescription('register the channel to Aquila')
                .addBooleanOption(option => option.setName('answer')
                                        .setDescription('allows saving of answers')
                                        .setRequired(true)
                                        )
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
            async execute(interaction: ChatInputCommandInteraction) {
                const saveAnswerPerms = interaction.options.getBoolean('answer') ?? false;
                
                //check if channel exists
                let result = await pool.query(`
                    select * from ugent.vakken where channelid=${interaction.channelId}
                `);
                let query = `INSERT INTO ugent.vakken
                (channelid, save)
                VALUES(${interaction.channelId}, ${saveAnswerPerms});
                `;
                if (result.rowCount == 1){
                    query = `UPDATE ugent.vakken
                    SET save=${saveAnswerPerms}
                    WHERE channelid=${interaction.channelId};
                    `;
                };

                result = await pool.query(query);
                const message = `user ${interaction.user.username} set channel answer saving to ${saveAnswerPerms}`
                interaction.reply(message);
                let channel = await interaction.guild?.channels.fetch("1095036258432073818")
                if (!channel?.isTextBased()) return;
                channel.send(message);
            }
}