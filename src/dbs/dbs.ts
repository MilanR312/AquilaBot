import { Pool } from "pg";
import * as dotenv from 'ts-dotenv';
const env = dotenv.load({
    PGHOST:String,
    PGUSER: String,
    PGDATABASE: String,
    PGPASSWORD: String,
    PGPORT: String
});



const pool: Pool = new Pool({
    user: env.PGUSER,
    host: env.PGHOST,
    database: env.PGDATABASE,
    password: env.PGPASSWORD,
    port: parseInt(env.PGPORT)
});
async function addUser(userid: String){
    await pool.query(`insert into ugent.users (userid)
                    values (${userid})`);
}

async function checkUser(userid: String, func: String) {
    let result = await pool.query(`SELECT banned from ugent.users
                                where userid = ${userid}`);
    if (result.rowCount == 0){
        console.log(`user ${userid} was not found in database, adding`);
        await addUser(userid);
        return true;
    }

    if (result.rows[0].banned && func == "save"){
        return false;
    }

    return true;
}

pool.on('error', (err, client) => {
    console.error("error in backend", err);
    process.exit(10);
});

export {pool, addUser, checkUser};