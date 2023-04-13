import { ChatInputCommandInteraction } from "discord.js";
import * as dbs from "./../../dbs/dbs";

export async function ban(interaction: ChatInputCommandInteraction){
    const user = interaction.options.getUser("user");
    if(!user){
        interaction.reply("not a user");
        return;
    }
    const query = `
    INSERT INTO ugent.users
    (userid, banned, "money")
    VALUES(${user.id}, true, 0)
    on conflict(userid) do
    	update set banned = true;
    `
    interaction.deferReply();
    await dbs.pool.query(query);
    if (!user.dmChannel)
        await user.createDM()
    await user.dmChannel?.send("you were banned from saving answers, if this was a mistake blame voetie");
    const channel = await interaction.guild?.channels.fetch("1095036258432073818")
    if (!channel || !channel.isTextBased()) return;
    channel.send(`${interaction.user.username} banned ${user.username}`);
    interaction.editReply("banned user");
}