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

// Connection pools reuse connections between invocations,
// and handle dropped or expired connections automatically.
let pgPool;

let insertQuery = 'INSERT INTO listings ' +
                  '(url, posted_at, location, price, scraped_at, title, description, sublet) ' +
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

function trimUrl(url) {
    let queryStringIndex = url.indexOf('?');
    if (queryStringIndex < 0) {
        return url;
    }
    return url.substring(0, url.indexOf('?'));
}

function isSublet(description) {
    const subletWords = ["sublet", "sub let", "sub-let", "short term", "short-term"]
    for (var i=0; i<subletWords.length; i++) {
        if(description.toLowerCase().indexOf(subletWords[i]) >= 0) {
            return true;
        };
    }
    return false;
}

async function getPosts(page) {
    postElements = await page.$$('._1dwg');

    let postUrl;
    let postTitle;
    let postTime;
    let postLocation;
    let postPrice;
    let scrapedAt = new Date();
    console.log("scrapedAt: " + scrapedAt);

    let posts = await Promise.all(postElements.map(async n => {
        let post = {}
        post.scrapedAt = scrapedAt
        let fullPostUrl = await n.$eval('.timestampContent', n2 => n2.parentElement.parentElement.href);
        post.url = trimUrl(fullPostUrl)
        try {
            post.title = await n.$eval('._l53', n2 => n2.innerText);
        } catch (e) {
            post.title = null;
        }
        post.postedAtText = await n.$eval('.timestampContent', n2 => n2.innerText);
        post.postedAt = parseTime(post.postedAtText)
        try {
            post.location = await n.$eval('._l58', n2 => n2.innerText);
        } catch (e) {
            post.location = null;
        }
        try {
            post.price = await n.$eval('._l57', n2 => parseInt(n2.innerText.substr(1)) || null);
        } catch (e) {
            post.price = null;
        }
        try {
            let descriptionStart = await n.$$eval(".text_exposed_root > p", n2 => {
                return n2.map(n3 => n3.innerText);
            });
            try {
                let descriptionExpansion = await n.$$eval(".text_exposed_show", n2 => {
                    return n2.map(n3 => n3.innerText);
                });
                post.description = descriptionStart.concat(descriptionExpansion).join(" ");
            } catch (e) {
                post.description = descriptionStart.join(" ");
            }
        } catch (e) {
            // TODO - scrappy... need to know exactly why I'm catching this
            console.log("error in extracting description")
        }
        if (!post.description) {
            post.description = await n.$eval("._5pbx", n2 => n2.innerText);
        }
        post.sublet = isSublet(post.description);
        return post;
    }))
    return posts;
};


function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function keepScrolling(page, scrollCounter) {
    await page.evaluate(_ => {
        window.scrollTo(0, document.body.scrollHeight);
    });
    scrollCounter++;
    if (scrollCounter < 5) {
        await timeout(1000);
        await keepScrolling(page, scrollCounter);
    } else {
        console.log("scrolled to page bottom " + scrollCounter + " times");
        return;
    }
}

exports.scrapeListings = async (req, res) => {
    const url = "https://www.facebook.com/groups/HWSpaces/";
    let browser = await puppeteer.launch({args: ['--no-sandbox']});
    let page = await browser.newPage();
    await page.goto(url);
    await keepScrolling(page, 0);
    let posts = await getPosts(page);
    console.log(posts.length + " post objects created");
    await browser.close();

    let postsValues = posts.map(post => {
        return [post.url, post.postedAt, post.location, post.price, post.scrapedAt, post.title, post.description, post.sublet];
    })
    console.log("formatting query from inputs " + postsValues)
    let formattedQuery = format(insertQuery, postsValues);

    console.log("generated INSERT query. Now inserting to the DB");
    console.log(formattedQuery);

    if (!pgPool) {
        pgPool = new pg.Pool(pgConfig);
    }

    pgPool.query(formattedQuery, (err, results) => {
      if (err) {
        throw err
      }
      console.log("inserted " + results.rowCount + " results:");
      console.log(results);
      res.send(JSON.stringify(results));
    })
};