const { MongoClient } = require('mongodb')

let dbConnection

module.exports = {
    connectToDb: (callb) => {
        MongoClient.connect('mongodb://localhost:27017/carerapp')
        .then((client) => {
            dbConnection = client.db()
            return callb()
        })
        .catch(err => {
            console.log(err)
            return callb(err)
        })
    },
    getDb: () => dbConnection,
}