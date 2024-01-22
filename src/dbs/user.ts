import { Err, Ok, Result } from "../types/result/result";
import { PostgresError } from 'pg-error-enum';
import { dbs } from "./dbs";
import {IUser} from "../interfaces/IUser";
import { None, Optional, Some } from "../types/option/option";
export class DbsUser implements IUser{
    private _banned: boolean;
    private _money: number;
    private readonly userid: string;
    private in_sync: boolean;

    /**
     *
     */
    private constructor(id: string, money: number = 0, banned: boolean = false, in_sync: boolean = false) {
        this._banned = banned;
        this._money = money;
        this.userid = id;
        this.in_sync = in_sync;
    }
    /**
     * generate a new user from userid
     */
    static newUser(id: string): DbsUser{
        return new DbsUser(id);
    }
    /**
     * returns Some(user) if the user existed
     * or None if no user exists
     */
    static async getUser(id: string): Promise<Result<DbsUser,number>>{
        let con = dbs.getInstance();
        let result = await con.query(`SELECT * from ugent.users where userid = ${id}`);
        return result.match(
            (result) => {
                if (result.rowCount != 1) return Err(1);
                let userdata = result.rows[0];
                let user = new DbsUser(userdata.userid, userdata.money, userdata.banned, true);
                return Ok(user);
            },
            (err_code) => Err(err_code)
        )
    }
    /**
     * gets or creates a user in the database
     * returns Ok(user) with an in sync (new or old) user
     * returns Err(code) if it failed to make a user
     * @param id 
     */
    static async getUserOrCreate(id: string): Promise<Result<DbsUser, number>>{
        let user = await DbsUser.getUser(id);

        let out = await user.match(
            async user => Ok<DbsUser, number>(user),
            async err => {
                //create a new user
                let new_user = DbsUser.newUser(id);
                let res = await new_user.push();

                return res.map(() => new_user);
            }
        )
        return out;
    }

    /**
     * returns if the user instance is in sync with the database 
     * */    
    public get inSync() : boolean {
        return this.in_sync;
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
    public get id(): string {
        return this.userid;
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
        return result.map((_) => {});
    } 
    async changeMoney(earned: number): Promise<Result<void, number>>{
        let conn = dbs.getInstance();
        let query;
        if (earned < 0 ) {
            earned = earned *-1 //if negative then change positive and put - for query
            query =         `
            UPDATE ugent.users
            SET "money"="money"-${earned}
            WHERE userid=${this.userid};  
            `
        }else {
          query =         `
            UPDATE ugent.users
            SET "money"="money"-${earned}
            WHERE userid=${this.userid};  
            `
        }
        let result = await conn.query(query);
        this._money += earned; //can stay since += does work with negative numbers
        if (result.isErr()){
            this.inSync = false;
        }
        return result.map((_) => {});
    }
    /**
     * get the user from the database again to resync it
     */
    async pull(): Promise<Result<void, number>>{
        //js doesnt like it if i return Ok(void)
        if (this.inSync) return Ok((()=>{})());

        //get the user again
        let user = await DbsUser.getUser(this.userid);
        //if we got a user update the values of this
        user.match(
            (user) => {
                this._banned = user.banned;
                this._money = user.money;
                this.inSync = true;
            },
            () => {
            }
        );
        return user.map((e) => {});
    }
    /**
     * try to push all the local changes again
     * if a user exists, overwrite the values with the local ones
     * if a user does not exist, create it in the dbs
     */
    async push(): Promise<Result<void, number>> {
        if (this.inSync) return Ok((()=>{})());
        let conn = dbs.getInstance();
        let result = await conn.query(
            `
            INSERT INTO ugent.users (banned, money, userid)
            VALUES(${this.banned},${this.money}, ${this.userid}) 
            ON CONFLICT (userid) 
            DO 
                UPDATE SET banned=${this.banned}, money=${this.money};
            `
        );
        this.inSync = result.isOk();
        return result.map((e) => {});
    }

}