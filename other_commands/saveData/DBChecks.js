function checkuser(pool, userId, defered = false){
    return new Promise((resolve, reject) => {
        pool.query(`
            SELECT roleid, banned from ugent.users
            where userid = ${userId};
        `, (err, res) => {
            console.log(res)
            if (res.rowCount == 0){
                console.log("user was not found in database, adding him in")
                pool.query(`
                    INSERT INTO ugent.users (userid)
                    VALUES (${userId})
                `)
                resolve()
            } else if (res.rows[0].banned && !defered){
                reject("you are not allowed to use this feature")
            }
            resolve()
        })
    })
}

module.exports = {checkuser}