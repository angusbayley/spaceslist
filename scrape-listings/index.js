const puppeteer = require('puppeteer');
const chrono = require('chrono-node');


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
        post.url = await n.$eval('.timestampContent', n2 => n2.parentElement.parentElement.href);
        try {
            post.title = await n.$eval('._l53', n2 => n2.innerText);
        } catch (e) {
            console.log("no post title");
            post.title = null;
        }
        post.timeText = await n.$eval('.timestampContent', n2 => n2.innerText);
        post.time = parseTime(post.timeText)
        try {
            post.location = await n.$eval('._l58', n2 => n2.innerText);
        } catch (e) {
            console.log("no post location");
            post.location = null;
        }
        try {
            post.price = await n.$eval('._l57', n2 => n2.innerText.substr(1) - 0);
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
    await browser.close();
    // res.set('Content-Type', 'application/json');
    res.send(posts);
};