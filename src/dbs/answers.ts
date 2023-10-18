import { Result } from "./../types/result/result";
import { PostgresError } from 'pg-error-enum';
import { dbs } from "./dbs";
import {IAnswers} from "../interfaces/IAnswers";
import {ChatInputCommandInteraction, EmbedBuilder} from "discord.js";
import {QueryResult} from "pg";

export class DbAnswers implements IAnswers{
    private readonly _userid: string;
    private readonly _messageid: string;
    private readonly _answerid: string;
    private readonly _vak: string;
    private _chapter: string;
    private _oef: string;

    constructor(userid:string, messageid: string, answerid:string, vak:string, chapter:string, oef:string) {
        this._userid = userid;
        this._messageid = messageid;
        this._answerid = answerid;
        this._vak = vak;
        this._chapter = chapter;
        this._oef = oef;
    }
//  TODO: refactor all this code cuse it is ass
    async get_reply(interaction: ChatInputCommandInteraction){
        const filter = (m:any) => m.author.id === interaction.user.id;
        await interaction.reply({ content: "reply to the message you wish to save", ephemeral: true, fetchReply: true})
        //haal de eerste reply op
        let collected = await interaction.channel?.awaitMessages({filter, max: 1, time: 30000, errors: ['time']});
        if (collected == undefined) throw "no message collected";
        let data = collected.first();
        return data;
}
    async checkChannel(interaction: ChatInputCommandInteraction, conn: dbs){
        const query = `
        SELECT channelid, save
        FROM ugent.vakken
        where channelid=${interaction.channelId};
        ` ;
        const result = await conn.query(query);
        return result.match(
            (queryresult) => {
                if( queryresult.rowCount == 0) return false;
                return queryresult.rows[0].save;
            },
            (Errcode) => {return false}
        )
    }
    async save(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            const conn = dbs.getInstance();
            if (interaction.guild?.id != "978251400872075315") {
                interaction.reply("this feature is only available in the main server for the moment\njoin the main server here https://discord.gg/ebjWC3tBsa")
                return
            }

            let hoofdstuk = interaction.options.getString('hoofdstuk');
            let oef = interaction.options.getString('oef');
            if (!hoofdstuk || !oef) throw "hoofdstuk of oefening kon niet opgehaald worden";


            //check the inputs
            let hoofdstukCheck = /^(?:\d+|examen)$/gi;
            if (!hoofdstukCheck.exec(hoofdstuk)) {
                interaction.reply(`hoofdstuk niet van vorm ${hoofdstukCheck}
            vb van correcte vorm zijn (1, 25, examen)`);
                return;
            }

            let oefCheck = /^(?:\d+(?:(?:(?:\.|,)\d+|\w))*|samenvatting)$/gi
            if (!oefCheck.exec(oef)) {
                interaction.reply(`oefening niet van vorm ${oefCheck}
            vb  van correcte vorm van oef zijn (2e, 5.1, 5.2.1, 8.6e, samenvatting)`);
                return;
            }
            oef = oef.replace(",", ".");

            let allowed = await conn.checkUser(interaction.user.id, "save");
            if (!allowed) {
                interaction.reply({content: "You have been banned from using this feature", ephemeral: true});
                return;
            }
            if (!await this.checkChannel(interaction, conn)) {
                interaction.reply({content: "saving answers is not allowed in this channel"});
                return;
            }
            console.log("finished user check");
            let data = await this.get_reply(interaction);
            if (data == undefined || data.reference == null) throw "message does not reference message";

            //krijg channelid en messageid van de referenced data
            const channelId = data.reference.channelId;
            const messageId = data.reference.messageId;

            const channel = data.guild?.channels.cache.get(channelId);
            if (channel == undefined) throw "error fetching channel";
            data.delete();

            if (!channel.isTextBased()) throw "channel isnt text based";

            const message = channel.messages.cache.get(messageId ?? "");

            if (message == undefined) throw "error getting the message";

            console.log("finished getting message");

            await conn.checkUser(message.author.id, "check");

            const query = `
                insert into ugent.answers (userid, messageid, vak, chapter, oef)
                values (${message.author.id}, ${messageId}, ${channelId}, '${hoofdstuk}', '${oef}');
            `;
            let result = await conn.query(query);
            console.log("finished save")
            interaction.followUp("succesfully saved");

            //give the user who made the answer +2 and the user who saved the answer +2
            let earned = 2;
            if (message.author.id == interaction.user.id) earned = 4;
            await conn.query(`
                UPDATE ugent.users
                SET "money"="money" + ${earned}
                WHERE userid = ${message.author.id}
                   or userid = ${interaction.user.id};
            `);
            console.log("finished update money")
            const logChannel = await interaction.guild.channels.fetch("1095977898508296262");

            if (!logChannel || !logChannel.isTextBased()) return;
            let embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle("save")
                .setDescription(`${interaction.user.username} saved a message from ${message.author.username}`)
                .setFields({
                    name: "channelid",
                    value: `<#${channelId}>`
                }, {
                    name: "messageid",
                    value: `${messageId}`
                }, {
                    name: "content",
                    value: (message.content.length == 0) ? " " : message.content
                });
            logChannel.send({embeds: [embed], files: [...message.attachments.values()]});

        } catch (err) {
            console.log(`saveanswer err ${err}`);
        }
    }
}