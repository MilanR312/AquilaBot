import { ChatInputCommandInteraction } from "discord.js";

import * as dbs from "./../../dbs/dbs";
import {getAnswerMessages, getAnswerMessage} from "./../../helper/message";

export async function get(interaction: ChatInputCommandInteraction){
    
    const vak = interaction.options.getString("vak", true);
    const hoofdstuk = interaction.options.getInteger('hoofdstuk');
    const oef = interaction.options.getNumber('oef');
    const result = await dbs.pool.query(`
        SELECT * FROM ugent.answers ans
        inner join ugent.users us using(userid)
        where ans.vak = ${vak} and ans.chapter = ${hoofdstuk} and ans.oef = ${oef}
        ORDER BY us."money" DESC LIMIT 10`);
    switch (result.rowCount){
        case 0:
            interaction.reply(`no answers found for oef\n vak=${vak}\nchapter=${hoofdstuk}\noef=${oef}`);
            break;
        case 1:
            const message = await getAnswerMessage(interaction,result, 0);
            interaction.reply(message);
            break;
        default:
            getAnswerMessages(interaction,result);
            break;
        }   
}