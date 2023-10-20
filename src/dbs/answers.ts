import {Err, Ok, Result} from "../types/result/result";
import {dbs} from "./dbs";
import {IAnswers} from "../interfaces/IAnswers";
import {ChatInputCommandInteraction, EmbedBuilder} from "discord.js";
import {DbsUser} from "./user";
import {DbsVak} from "./vak";
import {None, Optional, Some} from "src/types/option/option";

export class DbsAnswer implements IAnswers{
    //should not be used anymore, still need to delete in database
    //messageid is unique and can be used as index
    //private readonly _answerid: string;

    private readonly _user: DbsUser;
    private readonly _vak: DbsVak;
    
    private readonly _messageid: string;
    private _chapter: string;
    private _oef: string;

    private _in_sync: boolean;

    private constructor(messageid: string, chapter:string, oef:string,user:DbsUser, vak: DbsVak, in_sync: boolean= false) {
        this._user = user;
        this._messageid = messageid;
        this._vak = vak;
        this._chapter = chapter;
        this._oef = oef;
        this._in_sync = in_sync;
    }
    static newAnswer(message_id: string, chapter: string, oef: string, user: DbsUser, vak: DbsVak): DbsAnswer{
        return new DbsAnswer(message_id,chapter, oef, user, vak);
    }
    static async getAnswer(message_id: string): Promise<Result<DbsAnswer, number>>{
        let con = dbs.getInstance();
        let result = await con.query(`
            select *
            from ugent.answers
            where messageid=${message_id};
        `);
        let out = await result.match(
            async (result) => {
                if (result.rowCount != 1) return Err<DbsAnswer,number>(1);
                let answer_data = result.rows[0];

                //get user and channel
                let userresult = await DbsUser.getUser(answer_data.userid);
                let vakresult = await DbsVak.getVak(answer_data.vak);
                
                if (userresult.isErr()) return Err<DbsAnswer,number>(2);
                let user = userresult.unwrap();

                if (vakresult.isErr()) return Err<DbsAnswer,number>(3);
                let vak = vakresult.unwrap();

                let answer = new DbsAnswer(answer_data.messageid, answer_data.chapter, answer_data.oef, user, vak, true);
                return Ok<DbsAnswer,number>(answer);
            },
            async (err) => Err<DbsAnswer,number>(err)
        );
        return out
    }
    static async getAnswerList(vak: DbsVak, chapter: string, oef: string): Promise<Optional<Array<DbsAnswer>>>{
        //indien het vak niet toelaat antwoorden op te slaan, dan zal er ook sowieso geen antwoord in de database zijn
        if (vak.allowedSave == false) return None();
        let con = dbs.getInstance();
        let result = await con.query(`
            SELECT messageid, userid FROM ugent.answers ans
            inner join ugent.users us using(userid)
            where ans.vak = ${vak.vakId} and ans.chapter = '${chapter}' and ans.oef = '${oef}'
            ORDER BY us."money" DESC LIMIT 10
            ;
        `);
        if (result.isErr()) return None();
        let answers = result.unwrap();
        if (answers.rowCount == 0) return None();
        //voor performance redenen houden we hashmap van alle users bij
        let queried_users = new Map<string, DbsUser>();

        let out: DbsAnswer[] = [];

        for (let row of answers.rows){
            let userid = row.userid;
            if (!queried_users.has(userid)){
                let user = await DbsUser.getUser(userid);
                user.map((user) => queried_users.set(userid, user));
            }
            let answer = new DbsAnswer(
                row.messageid, 
                chapter, 
                oef, 
                queried_users.get(userid) as DbsUser, 
                vak, 
                true
            );
            out.push(answer);
        }
        return Some(out);
    }
    //answer is only in sync if both channel and user are aswell
    public get inSync(): boolean {
        return this._in_sync && this._vak.inSync && this._user.inSync;
    }
    private set inSync(newval: boolean){
        this._in_sync = newval;
    }
    public get user(): DbsUser{
        return this._user;
    }
    public get vak(): DbsVak{
        return this._vak;
    }
    public get chapter(): string {
        return this._chapter;
    }
    public get oef(): string {
        return this._oef;
    }
    /**
     * the push from other dbs classes renamed to make more sense?
     */
    public async save(): Promise<Result<void, number>>{
        if (this.inSync) return Ok((()=>{})());
        let conn = dbs.getInstance();
        let result = await conn.query(`
            insert into ugent.answers (userid, messageid, vak, chapter, oef)
            values (${this.user.id}, ${this._messageid}, ${this.vak.vakId}, ${this.chapter}, ${this.oef})
        `);
        this.inSync = result.isOk();
        return result.map((_) => {});
    }

    async get_reply(interaction: ChatInputCommandInteraction){

        await interaction.reply({ content: "reply to the message you wish to save", ephemeral: true, fetchReply: true});
        //haal de eerste reply op
        const filter = (m:any) => m.author.id === interaction.user.id;
        let collected = await interaction.channel?.awaitMessages({filter, max: 1, time: 30000, errors: ['time']});
        if (collected == undefined) throw "no message collected";
        return collected.first();
}

    async checkChannel(interaction: ChatInputCommandInteraction, conn: dbs){
        const result = await conn.query(`
        SELECT channelid, save
        FROM ugent.vakken
        where channelid=${interaction.channelId};
        `);
        return result.match(
            (queryresult) => {
                if( queryresult.rowCount == 0) return false;
                return queryresult.rows[0].save;
            },
            (Errcode) => {return false}
        )
    }
    //TODO: refactor all this code cuse it is ass
   /* async save(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            const conn = dbs.getInstance();
            /*if (interaction.guild?.id != "978251400872075315") { //Not necesary anymore @milan confirm plss
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
    }*/
}