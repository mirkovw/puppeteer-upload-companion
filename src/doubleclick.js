const puppeteer = require('puppeteer');
const config = require('config');
const path = require('path');
const fs = require('fs');
const { writeCookies, restoreCookies, getUrlParams, getJSON } = require('./utils.js');
const log = require('./utils.js').log();

const mainPageUrl = 'https://www.google.com/doubleclick/studio/';
const advertisersPageUrl = mainPageUrl + '#advertisers:';
const waitMs = 1000;

const searchForEntity = async (page, searchQuery) => {
    // CSS selectors :
    // for commencing searches
    const qsSearchInput = '#gwt-debug-table-search-input';
    const qsSearchBtn = '#gwt-debug-table-search-button';
    const qsSearchResult = page.url().indexOf("campaignId") !== -1 ? 'td a[title="' + searchQuery + '" i]' : 'td:first-child a[title="' + searchQuery + '" i]';

    // for search results page
    const qsLoadingDone = "div.gwt-ScrollTable div#gwt-debug-modal-spinner div[aria-hidden='true']";
    const qsHeaders = 'table.headerTable tr';
    const qsData = 'table.dataTable tr';

    const searchResults = [];

    log.info("searching selector: " + qsSearchInput);
    await page.waitForSelector(qsSearchInput);

    const isDisabled = await page.$eval(qsSearchInput, (element) => element.hasAttribute('disabled')); // when there are no entities in a advertiser/campaign, the search bar is disabled
    if (isDisabled) {
        log.error("SEARCH DISABLED!! NO ENTRIES");
        return { exists: false };
    };

    log.info("clicking selector: " + qsSearchInput);
    await page.click(qsSearchInput);
    await page.waitFor(waitMs);

    log.info("filling selector: " + qsSearchInput);
    await page.type(qsSearchInput, searchQuery);
    await page.waitFor(waitMs);

    log.info("clicking selector: " + qsSearchBtn);
    await page.click(qsSearchBtn);
    await page.waitFor(waitMs);

    log.info("clicking selector: " + qsLoadingDone);
    await page.waitForSelector(qsLoadingDone);
    
    // get headers from search results table
    const headersArr = await page.evaluate(({ qsHeaders }) => Array.from(document.querySelectorAll(qsHeaders),
        (row) => Array.from(row.querySelectorAll('td'),
            (cell) => cell.innerText)), { qsHeaders });
    headersArr.shift(); // first row is empty, so removing first entry in array
    const [headers] = headersArr; // destructure array

    // get results from search results table
    const dataArr = await page.evaluate(({ qsData }) => Array.from(document.querySelectorAll(qsData),
        (row) => Array.from(row.querySelectorAll('td'),
            (cell) => cell.innerText)), { qsData });
    dataArr.shift(); // first row is empty, so removing first entry in array

    // turn headers + data arrays into object with keys
    dataArr.forEach((row) => {
        const newObj = {};
        row.forEach((cell, index) => newObj[headers[index].toLowerCase().replace(' ', '_')] = cell);
        searchResults.push(newObj);
    });

    log.info("search results parsed, searching through results")
    const searchResultsFilters = searchResults.filter((result) => result.name.toLowerCase() === searchQuery.toLowerCase());
    log.info(searchResultsFilters.length + ' matches found');

    if (searchResults.length === 0) {
        log.info("no results")
        return { exists: false };
    }

    log.info("searching selector: " + qsSearchResult);
    await page.waitForSelector(qsSearchResult);
    
    log.info("clicking selector: " + qsSearchResult);
    await page.click(qsSearchResult);
    await page.waitFor(waitMs);

    const urlParams = await getUrlParams(page.url());
    return { exists: true, url: page.url(), urlParams };
};


exports.getAdvertiser = async (page, advertiserName) => {
    const advertisersPageUrl = config.get('doubleclick.url') + '#advertisers:';
    // check if advertiser exists
    log.info('checking if advertiser exists: ' + advertiserName);
    log.info('going to page: ' + advertisersPageUrl);
    await page.goto(advertisersPageUrl);
    log.info('page loaded: ' + page.url());
    return searchForEntity(page, advertiserName);
};

exports.createAdvertiser = async (browser, page, advertiserName) => {
    const createAdvertiserUrl = config.get('doubleclick.url') + '#advertiser/new:accountId=' + config.get('doubleclick.accountId') + '&accountName=' + config.get('doubleclick.accountName');
    const qsAdvertiserInput = 'input#gwt-debug-advertiser-advertiserName-input';
    const qsAdvertiserSubmit = 'a#gwt-debug-save-button';
    const qsAdvertiserLabel = "#gwt-debug-advertiser-pageTitle-label";
    const advertiserUrl = 'https://www.google.com/doubleclick/studio/#Advertiser:';

    // check if advertiser exists
    log.info('creating new advertiser: ' + advertiserName);
    log.info('going to page: ' + createAdvertiserUrl);
    await page.goto(createAdvertiserUrl);
    log.info('page loaded: ' + page.url());
    
    log.info('searching selector: ' + qsAdvertiserInput);
    await page.waitForSelector(qsAdvertiserInput);

    log.info('clicking selector: ' + qsAdvertiserInput);
    await page.click(qsAdvertiserInput);
    await page.waitFor(waitMs);

    log.info('filling selector: ' + qsAdvertiserInput);
    await page.type(qsAdvertiserInput, advertiserName);
    await page.waitFor(waitMs);
    
    console.log("searching selector: " + qsAdvertiserSubmit)
    await page.waitForSelector(qsAdvertiserSubmit);

    log.info("clicking on selector: " + qsAdvertiserSubmit)
    await page.click(qsAdvertiserSubmit);

    log.info('searching selector: ' + qsAdvertiserLabel);
    await page.waitForSelector(qsAdvertiserLabel);
    
    // wait until we're at the created advertisers page so we can record the url params
    const newUrl = await waitForUrl(page, advertiserUrl);
    const urlParams = await getUrlParams(page.url());
    
    return { exists: true, url: page.url(), urlParams };
};

const waitForUrl = async (page, url) => {
    let promise = new Promise((resolve) => {
        const checkUrl = setInterval(() => {
            log.info('checking: ' + page.url());
            if (page.url().indexOf(url) === 0) {
                clearInterval(checkUrl);
                resolve(page.url())
            }
        }, 200);
    });

    return promise;
};

exports.getCampaign = async (page, advertiser, campaignName) => {
    log.info('checking if campaign exists: ' + campaignName);
    log.info('going to page: ' + advertiser.url);
    await page.goto(advertiser.url);
    log.info('page loaded: ' + page.url());
    return searchForEntity(page, campaignName);
};

exports.createCampaign = async (browser, page, advertiser, campaignName) => {
    const createCampaignUrl = config.get('doubleclick.url') + '#campaign/new:advertiserId=' + advertiser.urlParams.advertiserId;
    const qsCampaignInput = 'input#gwt-debug-new-campaign-campaignText';
    const qsCampaignSubmit = 'a#gwt-debug-save-button';
    const qsCampaignLabel = 'gwt-debug-campaign-pageTitle-label';
    const campaignUrl = 'https://www.google.com/doubleclick/studio/#campaign:';

    // check if advertiser exists
    log.info('creating new campaign: ' + campaignName);
    log.info('going to page: ' + createCampaignUrl);
    await page.goto(createCampaignUrl);
    log.info('page loaded: ' + page.url());
    
    log.info('searching selector: ' + qsCampaignInput);
    await page.waitForSelector(qsCampaignInput);
    
    log.info('clicking selector: ' + qsCampaignInput);
    await page.click(qsCampaignInput);
    await page.waitFor(waitMs);
    
    log.info('filling selector: ' + qsCampaignInput);
    await page.type(qsCampaignInput, campaignName);
    await page.waitFor(waitMs);

    console.log("searching selector: " + qsCampaignSubmit)
    await page.waitForSelector(qsCampaignSubmit);
    
    log.info("clicking selector: " + qsCampaignSubmit)
    await page.click(qsCampaignSubmit);


    // wait until we're at the created campaign page so we can record the url params
    const newUrl = await waitForUrl(page, campaignUrl);
    const urlParams = await getUrlParams(page.url());
    
    return { exists: true, url: page.url(), urlParams };
};

exports.getCreative = async (page, campaign, creativeName) => {
    log.info('checking if creative exists: ' + creativeName);
    log.info('going to page: ' + campaign.url);
    await page.goto(campaign.url);
    log.info('page loaded: ' + page.url());
    await page.waitFor(3000);
    return searchForEntity(page, creativeName);
};

exports.createCreative = async (browser, page, advertiser, campaign, creative) => {
    const createCreativeUrl = config.get('doubleclick.url') + '#creative/new:campaignId=' + campaign.urlParams.campaignId + '&advertiserId=' + advertiser.urlParams.advertiserId;
    const qsCreativeNameInput = 'input#gwt-debug-creativeDetail-nameText';
    const qsCreativeFormatDropdown = 'div#gwt-debug-creativeDetail-formatText';
    const qsCreativeFormatValue = '#gwt-debug-creativeDetail-formatText-' + creative.format;

    const qsCreativeSizeDropdown = 'div#gwt-debug-creativeDetail-sizeText';
    const qsCreativeSizeValueCustom = 'div#gwt-debug-creativeDetail-sizeText-CUSTOM';
    const qsCreativeWidthInput = 'input#gwt-debug-creativeDetail-widthText';
    const qsCreativeHeightInput = 'input#gwt-debug-creativeDetail-heightText';

    const qsCreativeSubmit = 'a#gwt-debug-creativeworkflow-next-button';
    const qsCreativeLabel = "#gwt-debug-creativeworkflow-pageTitle-label";

    const creativeUrl = 'https://www.google.com/doubleclick/studio/#creative:step=MANAGE_FILES';

    log.info('creating new creative: ' + creative.name);
    log.info('going to page: ' + createCreativeUrl);
    await page.goto(createCreativeUrl);
    log.info('page loaded: ' + page.url());
    await page.waitFor(1500);
    
    log.info('searching selector: ' + qsCreativeNameInput);
    await page.waitForSelector(qsCreativeNameInput);

    log.info('clicking selector: ' + qsCreativeNameInput);
    await page.click(qsCreativeNameInput);
    await page.waitFor(waitMs);
    
    log.info('filling selector: ' + qsCreativeNameInput);
    await page.type(qsCreativeNameInput, creative.name);
    await page.waitFor(waitMs);

    log.info('searching selector: ' + qsCreativeFormatDropdown);
    await page.waitForSelector(qsCreativeFormatDropdown);
    
    log.info('clicking selector: ' + qsCreativeFormatDropdown);
    await page.click(qsCreativeFormatDropdown);
    await page.waitFor(waitMs);

    log.info('searching selector: ' + qsCreativeFormatValue);
    await page.waitForSelector(qsCreativeFormatValue);

    log.info('clicking selector: ' + qsCreativeFormatValue);
    await page.click(qsCreativeFormatValue);
    await page.waitFor(waitMs);

    log.info('searching selector: ' + qsCreativeSizeDropdown);
    await page.waitForSelector(qsCreativeSizeDropdown);
    
    log.info('clicking selector: ' + qsCreativeSizeDropdown);
    await page.click(qsCreativeSizeDropdown);
    await page.waitFor(waitMs);

    log.info('searching selector: ' + qsCreativeSizeValueCustom);
    await page.waitForSelector(qsCreativeSizeValueCustom);
    
    log.info('clicking selector: ' + qsCreativeSizeValueCustom);
    await page.click(qsCreativeSizeValueCustom);
    await page.waitFor(waitMs);

    log.info('searching selector: ' + qsCreativeWidthInput);
    await page.waitForSelector(qsCreativeWidthInput);
    
    log.info('clicking selector: ' + qsCreativeWidthInput);
    await page.click(qsCreativeWidthInput);
    await page.waitFor(waitMs);
    
    log.info('filling selector: ' + qsCreativeWidthInput);
    await page.type(qsCreativeWidthInput, creative.width);
    await page.waitFor(waitMs);

    log.info('searching selector: ' + qsCreativeHeightInput);
    await page.waitForSelector(qsCreativeHeightInput);
    
    log.info('clicking selector: ' + qsCreativeHeightInput);
    await page.click(qsCreativeHeightInput);
    await page.waitFor(waitMs);
    
    log.info('filling selector: ' + qsCreativeHeightInput);
    await page.type(qsCreativeHeightInput, creative.height);
    await page.waitFor(waitMs);

    log.info('searching selector: ' + qsCreativeSubmit);
    await page.waitForSelector(qsCreativeSubmit);
    
    log.info('clicking selector: ' + qsCreativeSubmit);
    await page.click(qsCreativeSubmit);
    // wait until we're at the created campaign page so we can record the url params

    const newUrl = await waitForUrl(page, creativeUrl);
    await page.waitFor(waitMs);

    const urlParams = await getUrlParams(page.url());

    return { exists: true, url: page.url(), urlParams };
};