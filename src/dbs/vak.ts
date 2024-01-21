import { userInfo } from "os";
import { Err, Ok, Result } from "../types/result/result";
import { dbs } from "./dbs";

export class DbsVak{
    private _channel_id: string;
    private _allowed_save: boolean;
    private _in_sync: boolean;
    private constructor(channel_id: string, allowed_save: boolean = false, in_sync: boolean = false){
        this._channel_id = channel_id;
        this._allowed_save = allowed_save;
        this._in_sync = in_sync;
    }

    static newVak(channel_id: string): DbsVak{
        return new DbsVak(channel_id);
    }
    static async getVak(channel_id: string): Promise<Result<DbsVak, number>>{
        let con = dbs.getInstance();
        let result = await con.query(
            ` select *
              from ugent.vakken
              where channelid = ${channel_id};
            `
        );
        return result.match(
            (result) => {
                if (result.rowCount != 1) return Err(1);
                let channeldata = result.rows[0];
                let channel = new DbsVak(channeldata.channelid, channeldata.save, true);
                return Ok(channel);
            },
            (err_code) => Err(err_code)
        )
    }

    public get inSync(): boolean {
        return this._in_sync;
    }
    private set inSync(newval: boolean) {
        this._in_sync = newval;
    }
    public get allowedSave(): boolean {
        return this._allowed_save;
    }
    public get vakId(): string {
        return this._channel_id;
    }

    async setSaving(allowed_save: boolean): Promise<Result<void, number>>{
        let conn = dbs.getInstance();
        let result = await conn.query(`
            update ugent.vakken
            set save=${allowed_save}
            where channelid=${this._channel_id};
        `);
        this._allowed_save = allowed_save;

        this.inSync = result.isOk();
    
        return result.map((_) => {});
    }
    /**
     * get vak from database again to resync
     */
    async pull(): Promise<Result<void, number>>{
        if (this.inSync) return Ok((()=>{})());
        let conn = dbs.getInstance();
        
        let vak = await DbsVak.getVak(this._channel_id);
        vak.match(
            (vak) => {
                this._allowed_save = vak.allowedSave;
                this._in_sync = true;
            },
            ()=>{}
        );
        return vak.map(()=>{});
    }

    async push(): Promise<Result<void, number>>{
        if (this.inSync) return Ok((()=>{})());
        let conn = dbs.getInstance();
        let result = await conn.query(
            `
            INSERT INTO ugent.vakken (channelid, save)
            VALUES(${this._channel_id},${this.allowedSave}) 
            ON CONFLICT (channelid) 
            DO 
                UPDATE SET save=${this.allowedSave};
            `
        );
        this.inSync = result.isOk();
        return result.map((e) => {});
    }
}