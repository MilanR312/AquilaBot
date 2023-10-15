import { Result } from "./../types/result/result";
import { PostgresError } from 'pg-error-enum';
import { dbs } from "./dbs";
export class DbsUser{
    private _banned: boolean;
    private _money: number;
    private readonly userid: string;
    private in_sync: boolean;

    /**
     *
     */
    constructor(id: string, money: number = 0, banned: boolean = false, in_sync: boolean = false) {
        this._banned = banned;
        this._money = money;
        this.userid = id;
        this.in_sync = in_sync;
    }

    /**
     * returns if the user instance is in sync with the database 
     * */    
    public get inSync() : boolean {
        return this.inSync;
    }
    private set inSync(newval: boolean){
        this.in_sync = newval;
    }
    public get money(): number {
        return this._money;
    }
    public get banned(): boolean {
        return this._banned;
    }
    /**
     * 
     * @param banned set if a user needs to be banned from saving answer
     * @returns Ok(void) if the sync was succesfull, Err(error_code) if an error occured 
     */
    async setBanned(banned: boolean): Promise<Result<void, number>>{
        //get the postgress client
        let conn = dbs.getInstance();
        let result = await conn.query(
            `
            UPDATE ugent.users
            SET banned=${banned}
            WHERE userid=${this.userid};
            `
        );
        this._banned = banned;
        //if there was an error set the type to be out of sync
        if (result.isErr()){
            this.inSync = false;
        }
        return result.map((val) => {});
    } 
    async addMoney(earned: number): Promise<Result<void, number>>{
        let conn = dbs.getInstance();
        let result = await conn.query(
            `
            UPDATE ugent.users
            SET "money"="money"+${earned}
            WHERE userid=${this.userid};  
            `
        );
        this._money += earned;
        if (result.isErr()){
            this.inSync = false;
        }
        return result.map((val) => {});
    }
    /**
     * get the user from the database again to resync it
     */
    async sync(): Promise<Result<void, number>>{
        let conn = dbs.getInstance();

        //get the user again
        let user = await conn.getUser(this.userid);
        //if we got a user update the values of this
        user.match(
            (user) => {
                this._banned = user.banned;
                this._money = user.money;
                this.inSync = true;
            },
            (err_code) => {
            }
        );
        return user.map((e) => {});
    }

}