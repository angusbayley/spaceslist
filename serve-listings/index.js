const pg = require('pg');
let pgPool;

const connectionName =
  process.env.INSTANCE_CONNECTION_NAME;
const dbUser = process.env.SQL_USER;
const dbPassword = process.env.SQL_PASSWORD;
const dbName = process.env.SQL_NAME;

const pgConfig = {
  max: 1,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  host: `/cloudsql/${connectionName}`
};

const extractQuery = "  SELECT url, posted_at, location, price, title, sublet " +
                     "    FROM listings " +
                     "ORDER BY posted_at DESC " +
                     "   LIMIT 100;"

if (!pgPool) {
    pgPool = new pg.Pool(pgConfig);
}

exports.serveListings = async (req, res) => {
    res.set('Access-Control-Allow-Origin', "*")
    res.set('Access-Control-Allow-Methods', 'GET')
    pgPool.query(extractQuery, (err, results) => {
        if (err) {
            console.error(err);
            res.send(err);
        } else {
            res.send(JSON.stringify(results.rows));
        }
    })
}