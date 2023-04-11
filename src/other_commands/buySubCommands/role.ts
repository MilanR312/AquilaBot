import { Console } from "console";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import * as dbs from "./../../dbs/dbs"



let rolesAvailableToBuy = new Map<string, Number>();
//put in dbs
const updateRoles = async () => {
    const query = `
    select * from
    ugent.roles;
    `;
    const result = await dbs.pool.query(query);
    rolesAvailableToBuy.clear();
    result.rows.forEach((row) => {
        console.log(row);
        console.log(row.roleid);
        rolesAvailableToBuy.set(row.roleid, row.cost);
    })
}
updateRoles();
setTimeout(updateRoles, 1000*60*60); //every hour

export async function role(interaction: ChatInputCommandInteraction){
    const roleOption = interaction.options.getRole("rolename");
    if (roleOption == null || roleOption.id == "430407918945566722") return;

    if(!rolesAvailableToBuy.has(roleOption.id)){
        interaction.reply(`role ${roleOption.name} is not available`);
        return;
    }
    //check bal enzo
    console.log("not implemented check for money");
    if (interaction.member == null) return;
    if(Array.isArray(interaction.member.roles)) return;


    await interaction.member.roles.add(roleOption.id)
    interaction.reply("role added");
}
export async function roleDetails(interaction: ChatInputCommandInteraction){
    console.log(`${interaction.user.username} roleDetails`);
    
    let fields:{
        name: string;
        value: string;
    }[] = [];
    for (let [id, price] of rolesAvailableToBuy){
        let role = await interaction.guild?.roles.fetch(id);
        if (role == null || role == undefined) continue;
        fields.push({name: role.name, value: `${price}`});
    }
    console.log(fields)
    let outEmbed = new EmbedBuilder()
                        .setTitle("Roles")
                        .setDescription("roles available to be bought")
                        .setFields(fields)
    //error if too many custom roles fix later
    interaction.reply({embeds:[outEmbed]});
}