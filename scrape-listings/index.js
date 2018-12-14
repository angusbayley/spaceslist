const puppeteer = require('puppeteer');

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
        console.log(post.title);
        post.time = await n.$eval('.timestampContent', n2 => n2.innerText);
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
        console.log(post.Title);
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