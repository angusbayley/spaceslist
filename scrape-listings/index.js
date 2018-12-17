const puppeteer = require('puppeteer');
const chrono = require('chrono-node');
const pg = require('pg');
const format = require('pg-format');

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

const scrapedAt = new Date();

// Connection pools reuse connections between invocations,
// and handle dropped or expired connections automatically.
let pgPool;

let insertQuery = 'INSERT INTO listings ' +
                  '(url, posted_at, location, price, scraped_at) ' +
                  'VALUES %L ' +
                  'ON CONFLICT DO NOTHING'

function parseTime(timeText) {
    let parsedTime;
    if (chrono.parse(timeText).length > 0) {
        parsedTime = chrono.parse(timeText)[0].start.date();
    }
    else {
        let d = new Date();
        if (timeText.indexOf("hr") >= 0) {
            let hrDiff = timeText.match(/[0-9]+/)[0];
            d.setHours(d.getHours() - hrDiff);
        }
        else if (timeText.indexOf("min") >= 0) {
            let minDiff = timeText.match(/[0-9]+/)[0];
            d.setMinutes(d.getMinutes() - minDiff);
        }
        parsedTime = chrono.parse(d.toString())[0].start.date();
    }
    return parsedTime
}

async function getPosts(page) {
    postElements = await page.$$('._1dwg');

    let postUrl;
    let postTitle;
    let postTime;
    let postLocation;
    let postPrice;

    const posts = await Promise.all(postElements.map(async n => {
        const post = {}
        post.scrapedAt = scrapedAt
        post.url = await n.$eval('.timestampContent', n2 => n2.parentElement.parentElement.href);
        try {
            post.title = await n.$eval('._l53', n2 => n2.innerText);
        } catch (e) {
            console.log("no post title");
            post.title = null;
        }
        post.postedAtText = await n.$eval('.timestampContent', n2 => n2.innerText);
        post.postedAt = parseTime(post.postedAtText)
        try {
            post.location = await n.$eval('._l58', n2 => n2.innerText);
        } catch (e) {
            console.log("no post location");
            post.location = null;
        }
        try {
            post.price = await n.$eval('._l57', n2 => parseInt(n2.innerText.substr(1)) || null);
        } catch (e) {
            console.log("no price found");
            post.price = null;
        }
        return post;
    }))
    return posts;
};

exports.scrapeListings = async (req, res) => {
    const url = "https://www.facebook.com/groups/HWSpaces/";
    const browser = await puppeteer.launch({args: ['--no-sandbox']});
    let page = await browser.newPage();
    await page.goto(url);
    const posts = await getPosts(page)
    console.log(posts.length + ' post objects created')
    await browser.close();

    let postsValues = posts.map(post => {
        return [post.url, post.postedAt, post.location, post.price, post.scrapedAt];
    })
    console.log('postsValues coming up:')
    console.log(postsValues)
    const formattedQuery = format(insertQuery, postsValues)
    console.log('query: ' + formattedQuery)

    if (!pgPool) {
        pgPool = new pg.Pool(pgConfig);
    }

    pgPool.query(formattedQuery, (err, results) => {
      if (err) {
        throw err
      }
      res.send(JSON.stringify(results));
    })
};