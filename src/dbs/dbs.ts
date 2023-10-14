import { Pool, QueryResult } from "pg";
import { PostgresError } from "pg-error-enum";
import { Err, Ok, Result } from "src/types/result/result";
import * as dotenv from 'ts-dotenv';
import { DbsUser } from "./user";

const env = dotenv.load({
    PGHOST:String,
    PGUSER: String,
    PGDATABASE: String,
    PGPASSWORD: String,
    PGPORT: String
});



class dbs {
    private static instance: dbs;

    private pool: Pool = new Pool({
        user: env.PGUSER,
        host: env.PGHOST,
        database: env.PGDATABASE,
        password: env.PGPASSWORD,
        port: parseInt(env.PGPORT)
    });

    private constructor() {
        this.pool.on('error', (err, client) => {
            console.error("error in backend", err);
            process.exit(10);
        });
    }

    public static getInstance() {
        if (!dbs.instance) {
            dbs.instance = new dbs();
        }
        return dbs.instance;
    }

    async addUser(userid: String){
        await this.pool.query(`insert into ugent.users (userid)
                        values (${userid})`);
    }

    async checkUser(userid: String, func: String) {
        let result = await this.pool.query(`SELECT banned from ugent.users
                                    where userid = ${userid}`);
        if (result.rowCount == 0){
            console.log(`user ${userid} was not found in database, adding`);
            await this.addUser(userid);
            return true;
        }
    
        if (result.rows[0].banned && func == "save"){
            return false;
        }
    
        return true;
    }

    async getUser(userid:string): Promise<Result<DbsUser, number>>{
        try {
            let result = await this.pool.query('SELECT * from ugent.users where userid = ${userid}');
            //number here is temporary
            if (result.rowCount != 1) return Err(1);
            let userdata = result.rows[0];
            let user = new DbsUser(userdata.userid, userdata.money, userdata.banned, true);
            return Ok(user);
        } catch (e: any){
            return Err(e.code);
        }
    }

    async deleteUser(userid:string) {
        let result = await this.pool.query(`DELETE from ugent.users where userid = ${userid}`);
        
        if(!result) throw "error deleting user";
    }

    async getMessage(messageId:string) {
        let result = await this.pool.query(`SELECT * from ugent.answers where messageid = ${messageId}`);
        
        if(!result) throw "error getting message";
        return result.rows[0];
    }
    async query(query: string): Promise<Result<QueryResult<any>,number>>{
        try {
            let result = await this.pool.query(query);
            return Ok(result);
        } catch (e: any){
            return Err(e.code);
        }
    }
}

export { dbs }