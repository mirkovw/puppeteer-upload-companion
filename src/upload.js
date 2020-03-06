const puppeteer = require('puppeteer');
const config = require('config');
const path = require('path');

const mainPageUrl = 'https://www.google.com/doubleclick/studio/'
const advertisersPageUrl = mainPageUrl + '#advertisers:';
const campaignsPageUrl = mainPageUrl + '#campaigns:';
const creativesPageUrl = mainPageUrl + '#creatives:';
const newAdvertiserPageUrl = mainPageUrl + '#advertiser/new:';
const newCampaignPageUrl = mainPageUrl + '#campaign/new:';
const newCreativePageUrl = mainPageUrl + '#creative/new:';

const accountName = 'Mediamonks';
const advertiserName = 'netflix';
const campaignName = 'dcu_test_campaign';
const creativeName = 'dcu_test_300x250';
const creativeOptions = {
    format: 'Banner',
    size: {
        width: '300',
        height: '250',
    }
};

// Query Selectors

// for commencing searches
let qsSearchInput = "#gwt-debug-table-search-input";
let qsSearchBtn = "#gwt-debug-table-search-button";
// let qsSearchResult = "td:first-child a[title='" + advertiserName + "' i]";

// for search results page
let qsLoadingDone = "div.gwt-ScrollTable div#gwt-debug-modal-spinner div[aria-hidden='true']";
let qsHeaders = 'table.headerTable tr';
let qsData = 'table.dataTable tr';

const testBrowser = async () => {
    const testing = false;
    const testHTML = "html/index.html";
    userDir = path.resolve(config.get("common.userDataDir"));

    console.log(userDir);

    const browser = await puppeteer.launch({userDataDir: userDir});
    const page = await browser.newPage();

    console.log("going to google");
    await page.goto('https://www.google.com');
    console.log("google loaded")

    // other actions...
    await browser.close();
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ["--start-maximized"],
        defaultViewport: {
            width: 1920,
            height: 1080,
        },
        userDataDir: path.resolve(config.get("common.userDataDir")),
    });

    const page = await browser.newPage();
    // const navigationPromise = page.waitForNavigation({
    //     waitUntil: 'load',
    // });

    const advertiserExists = await checkIfAdvertiserExists(browser, page, advertiserName);
    console.log("advertiser exists = " + advertiserExists);

    //const advertiserExists = await checkIfAdvertiserExists(browser, page, advertiserName);
    // await browser.close();
})();

const checkIfAdvertiserExists = async (browser, page, advertiserName) => {
    //check if advertiser exists
    console.log("checking if advertiser exists: " + advertiserName);
    console.log("going to page: " + advertisersPageUrl)
    await page.goto(advertisersPageUrl);
    console.log("page loaded: " + page.url())

    if (page.url().indexOf(mainPageUrl) === -1) { //if the page loaded is not the page we wanted to load
        console.log('You are not logged in yet => npm run login');
        return await browser.close();
    }

    console.log("wait for search input to become available");
    // await navigationPromise;
    await page.waitForSelector(qsSearchInput);

    console.log("enter '" + qsSearchInput + "' into search input")
    await page.click(qsSearchInput)
    await page.waitFor(500);
    await page.type(qsSearchInput, advertiserName);

    console.log("click search button")
    await page.waitFor(500);
    await page.click(qsSearchBtn);

    console.log("waiting for loader icon to stop spinning")
    await page.waitFor(500);
    await page.waitForSelector(qsLoadingDone);
    console.log("loading icon is gone, search results should be visible");

    const searchResults = await getSearchResults(page);

    if (searchResults.length === 0) {
        console.log("creating new advertiser")
        return false;
    }

    else {
        console.log("searching through results")
        const searchResultsFilters = searchResults.filter(result => result.name.toLowerCase() === advertiserName.toLowerCase());
        console.log(searchResultsFilters.length + " matches found");
        return true;
    }
}


const getSearchResults = async (page) => {
    let searchResults = [];

    // get headers from search results table
    const headersArr = await page.evaluate(({qsHeaders}) =>
        Array.from(document.querySelectorAll(qsHeaders),
            row => Array.from(row.querySelectorAll('td'),
                cell => cell.innerText)
        ), {qsHeaders}
    );
    headersArr.shift(); // first row is empty, so removing first entry in array
    const [headers] = headersArr; // destructure array

    // get results from search results table
    const dataArr = await page.evaluate(({qsData}) =>
        Array.from(document.querySelectorAll(qsData),
            row => Array.from(row.querySelectorAll('td'),
                cell => cell.innerText)
        ), {qsData}
    );
    dataArr.shift(); // first row is empty, so removing first entry in array

    //turn headers + data arrays into object with keys
    dataArr.forEach((row) => {
        let newObj = {};
        row.forEach((cell, index) => newObj[headers[index].toLowerCase().replace(' ', '_')] = cell)
        searchResults.push(newObj);
    });

    return searchResults;
}

const startUpload = async () => {
    console.log("starting browser");

    const browser = await puppeteer.launch({
        headless: false,
        args: ["--start-maximized"],
        defaultViewport: {
            width: 1920,
            height: 1080,
        },
        userDataDir: path.resolve(config.get("common.userDataDir")),
    });

    const page = await browser.newPage();
    const navigationPromise = page.waitForNavigation({
        waitUntil: 'load',
    });

    // if (testing) {
    // await page.goto('file:///C:/Projects/m/mediamonks/puppeteer-test/src/html/index.html');
    //
    // let searchResults = [];
    // // get headers from search results table
    // const headersArr = await page.evaluate(({qsHeaders}) =>
    //     Array.from(document.querySelectorAll(qsHeaders),
    //             row => Array.from(row.querySelectorAll('td'),
    //                     cell => cell.innerText)
    //     ), {qsHeaders}
    // );
    // headersArr.shift(); // first row is empty, so removing first entry in array
    // const [headers] = headersArr; // destructure array
    //
    // // get results from search results table
    // const dataArr = await page.evaluate(({qsData}) =>
    //     Array.from(document.querySelectorAll(qsData),
    //         row => Array.from(row.querySelectorAll('td'),
    //             cell => cell.innerText)
    //     ), {qsData}
    // );
    // dataArr.shift(); // first row is empty, so removing first entry in array
    //
    // //turn headers + data arrays into object with keys
    // dataArr.forEach((row) => {
    //     let newObj = {};
    //     row.forEach((cell, index) => newObj[headers[index].toLowerCase().replace(' ', '_')] = cell)
    //     searchResults.push(newObj);
    // });
    //
    //
    // console.log(searchResults.length + " results. Searching");
    // const searchResultsFilters = searchResults.filter(result => result.name.toLowerCase() === advertiserName.toLowerCase());
    // console.log(searchResultsFilters.length + " matches found, advertiser exists");
    //
    //
    // await page.waitFor(5000000);
    // }


    // Continue to DC Studio
    // await page.goto('https://www.google.com/doubleclick/studio/');
    // await navigationPromise;
    // await page.screenshot({
    //     path: config.get('common.screensFolder') + '/Logged into DC.png',
    // });

    //check if advertiser exists
    console.log("going to page: " + advertisersPageUrl)
    await page.goto(advertisersPageUrl);
    console.log("page loaded: " + page.url())

    if (page.url().indexOf(mainPageUrl) === -1) { //if the page loaded is not the page we wanted to load
        console.log('You are not logged in yet => npm run login');
        return await browser.close();
    }

    console.log("wait for search input to become available");
    await navigationPromise;
    await page.waitForSelector(qsSearchInput);


    console.log("enter '" + qsSearchInput + "' into search input")
    await page.click(qsSearchInput)
    await page.waitFor(500);
    await page.type(qsSearchInput, advertiserName);

    console.log("click search button")
    await page.waitFor(500);
    await page.click(qsSearchBtn);


    //console.log("searching for " + qsSearchResult)
    await page.waitFor(500);
    await page.waitForSelector(qsLoadingDone);
    console.log("loading icon is gone, search results should be visible");

    let searchResults = [];
    // get headers from search results table
    const headersArr = await page.evaluate(({qsHeaders}) =>
        Array.from(document.querySelectorAll(qsHeaders),
            row => Array.from(row.querySelectorAll('td'),
                cell => cell.innerText)
        ), {qsHeaders}
    );
    headersArr.shift(); // first row is empty, so removing first entry in array
    const [headers] = headersArr; // destructure array

    // get results from search results table
    const dataArr = await page.evaluate(({qsData}) =>
        Array.from(document.querySelectorAll(qsData),
            row => Array.from(row.querySelectorAll('td'),
                cell => cell.innerText)
        ), {qsData}
    );
    dataArr.shift(); // first row is empty, so removing first entry in array

    //turn headers + data arrays into object with keys
    dataArr.forEach((row) => {
        let newObj = {};
        row.forEach((cell, index) => newObj[headers[index].toLowerCase().replace(' ', '_')] = cell)
        searchResults.push(newObj);
    });

    console.log(searchResults.length + " results");

    if (searchResults.length === 0) {
        console.log("creating new advertiser")
    }

    else {
        console.log("searching through results")
        const searchResultsFilters = searchResults.filter(result => result.name.toLowerCase() === advertiserName.toLowerCase());
        console.log(searchResultsFilters.length + " matches found");
    }


    //await page.focus(searchResult);
    //const el = await page.$(searchResult)
    //console.log(el);
    //
    // const bodyHandle = await page.$('body');
    // const html = await page.evaluate(body => body.innerHTML, bodyHandle);


    // let name = 'jack';
    // let age  = 33;
    // let location = 'Berlin/Germany';

    // await page.evaluate(({advertiserName}) => {
    //
    //     //var
    //
    //
    //     // console.log(name);
    //     // console.log(age);
    //     // console.log(location);
    //
    // },{advertiserName});

    //await bodyHandle.dispose();


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
}
