const config = require('config');
const puppeteer = require('puppeteer');

const mainPageUrl = 'https://www.google.com/doubleclick/studio/'
const advertisersPageUrl = mainPageUrl + '#advertisers:';
const campaignsPageUrl = mainPageUrl + '#campaigns:';
const creativesPageUrl = mainPageUrl + '#creatives:';
const newAdvertiserPageUrl = mainPageUrl + '#advertiser/new:';
const newCampaignPageUrl = mainPageUrl + '#campaign/new:';
const newCreativePageUrl = mainPageUrl + '#creative/new:';

const accountName = 'Mediamonks';
const advertiserName = 'dcu_test_advertiser';
const campaignName = 'dcu_test_campaign';
const creativeName = 'dcu_test_300x250';
const creativeOptions = {
    format: 'Banner',
    size: {
        width: '300',
        height: '250',
    }
};

(async () => {
    // const browser = await puppeteer.launch();
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 1920,
            height: 1080,
        },
        userDataDir: './user_data',
        args: [
            "--start-maximized"
        ]
    });
    const page = await browser.newPage();
    const navigationPromise = page.waitForNavigation({
        waitUntil: 'load',
    });


    // Continue to DC Studio
    await page.goto('https://www.google.com/doubleclick/studio/');
    await navigationPromise;
    await page.screenshot({
        path: config.get('common.screensFolder') + '/Logged into DC.png',
    });


    //check if advertiser exists
    await page.goto(advertisersPageUrl);
    await navigationPromise;
    console.log("showing Advertisers");

    const searchInput = "#gwt-debug-table-search-input";
    const searchBtn = "#gwt-debug-table-search-button";
    const searchResult = "a[title='" + advertiserName + "']"

    await page.waitForSelector(searchInput);
    console.log("advertiser search input available now.")

    await page.click(searchInput)
    await page.waitFor(500);
    await page.type(searchInput, advertiserName);

    await page.waitFor(500);
    await page.click(searchBtn);

    console.log("searching for " + searchResult)
    await page.waitForSelector(searchResult);
    //await page.waitForSelector("#gwt-debug-creatives-table-name-link-36525044");


    console.log("found it")














    // //check if creative exists
    // await page.goto(creativesPageUrl);
    // await navigationPromise;
    // console.log("showing Creatives")
    //
    // //make new creative
    // await page.goto(newCreativePageUrl);
    // await navigationPromise;
    // console.log("make new creative screen")









    //await browser.close();


})();
