const axios = require('axios');
const { getUrlParams, getJSON } = require('./utils.js');
const log = require('./utils.js').log();

const waitMs = 1000; // TODO:  Optimize speeds. Figure out where we don't need 1000ms wait time because it adds up

exports.getAdvertiser = async (page, uploadConfig, advertiserName) => {
    const advertisersPageUrl = uploadConfig.doubleclick.url + '#advertisers:';
    log.debug('going to page: ' + advertisersPageUrl);
    await page.goto(advertisersPageUrl);
    log.debug('page loaded: ' + page.url());
    //return searchForEntity(page, advertiserName);
    const searchResults = await searchForEntity(page, advertiserName)
    return searchResults;

};

exports.getCampaign = async (page, advertiser, campaignName) => {
    //log.info('checking if campaign exists: ' + campaignName);
    log.debug('going to page: ' + advertiser.url);
    await page.goto(advertiser.url);
    log.debug('page loaded: ' + page.url());
    return searchForEntity(page, campaignName);
};

exports.getCreative = async (page, campaign, creativeName) => {
    //log.info('checking if creative exists: ' + creativeName);
    log.debug('going to page: ' + campaign.url);
    await page.goto(campaign.url);
    log.debug('page loaded: ' + page.url());
    await page.waitFor(3000);
    return searchForEntity(page, creativeName);
};





exports.createAdvertiser = async (browser, page, uploadConfig, advertiserName) => {
    const createAdvertiserUrl = uploadConfig.doubleclick.url + '#advertiser/new:accountId=' + uploadConfig.doubleclick.accountId + '&accountName=' + uploadConfig.doubleclick.accountName;
    //const advertiserUrl = 'https://www.google.com/doubleclick/studio/#Advertiser:';
    const advertiserUrl = uploadConfig.doubleclick.url + '#Advertiser:';

    const qsAdvertiserInput = 'input#gwt-debug-advertiser-advertiserName-input';
    const qsAdvertiserSubmit = 'a#gwt-debug-save-button';
    const qsAdvertiserLabel = '#gwt-debug-advertiser-pageTitle-label';

    //log.info('creating new advertiser: ' + advertiserName);
    log.debug('going to page: ' + createAdvertiserUrl);
    await page.goto(createAdvertiserUrl);
    log.debug('page loaded: ' + page.url());

    log.debug('searching selector: ' + qsAdvertiserInput);
    await page.waitForSelector(qsAdvertiserInput);

    log.debug('clicking selector: ' + qsAdvertiserInput);
    await page.click(qsAdvertiserInput);
    await page.waitFor(waitMs);

    log.debug('filling selector: ' + qsAdvertiserInput);
    await page.type(qsAdvertiserInput, advertiserName);
    await page.waitFor(waitMs);

    log.debug('searching selector: ' + qsAdvertiserSubmit);
    await page.waitForSelector(qsAdvertiserSubmit);

    log.debug('clicking on selector: ' + qsAdvertiserSubmit);
    await page.click(qsAdvertiserSubmit);

    log.debug('searching selector: ' + qsAdvertiserLabel);
    await page.waitForSelector(qsAdvertiserLabel);

    // wait until we're at the created advertisers page so we can record the url params
    const newUrl = await waitForUrl(page, advertiserUrl);
    const urlParams = await getUrlParams(page.url());

    return { exists: true, url: page.url(), urlParams };
};

exports.getPreviewUrl = async (page, uploadConfig) => {
    const campaignUrl = uploadConfig.doubleclick.url + '#campaign:advertiserId=' +  uploadConfig.campaigns[0].advertiser.id + '&campaignId=' + uploadConfig.campaigns[0].campaign.id;
    await page.goto(campaignUrl);
    const previewLinkSel = 'a#external-preview-table-anchor-default';
    await page.waitForSelector(previewLinkSel);
    return await page.$eval(previewLinkSel, e => e.getAttribute('href'));
};

exports.createCampaign = async (browser, page, uploadConfig, advertiser, campaignName) => {
    const createCampaignUrl = uploadConfig. doubleclick.url + '#campaign/new:advertiserId=' + advertiser.urlParams.advertiserId;
    //const campaignUrl = 'https://www.google.com/doubleclick/studio/#campaign:';
    const campaignUrl = uploadConfig. doubleclick.url + '#campaign:';

    const qsCampaignInput = 'input#gwt-debug-new-campaign-campaignText';
    const qsCampaignSubmit = 'a#gwt-debug-save-button';
    const qsCampaignLabel = 'gwt-debug-campaign-pageTitle-label';

    //log.info('creating new campaign: ' + campaignName);
    log.debug('going to page: ' + createCampaignUrl);
    await page.goto(createCampaignUrl);
    log.debug('page loaded: ' + page.url());

    log.debug('searching selector: ' + qsCampaignInput);
    await page.waitForSelector(qsCampaignInput);

    log.debug('clicking selector: ' + qsCampaignInput);
    await page.click(qsCampaignInput);
    await page.waitFor(waitMs);

    log.debug('filling selector: ' + qsCampaignInput);
    await page.type(qsCampaignInput, campaignName);
    await page.waitFor(waitMs);

    log.debug('searching selector: ' + qsCampaignSubmit);
    await page.waitForSelector(qsCampaignSubmit);

    log.debug('clicking selector: ' + qsCampaignSubmit);
    await page.click(qsCampaignSubmit);


    // wait until we're at the created campaign page so we can record the url params
    const newUrl = await waitForUrl(page, campaignUrl);
    const urlParams = await getUrlParams(page.url());

    return { exists: true, url: page.url(), urlParams };
};

exports.createCreative = async (browser, page, uploadConfig, advertiser, campaign, creative) => {
    const createCreativeUrl = uploadConfig.doubleclick.url + '#creative/new:campaignId=' + campaign.urlParams.campaignId + '&advertiserId=' + advertiser.urlParams.advertiserId;
    //const creativeUrl = 'https://www.google.com/doubleclick/studio/#creative:step=MANAGE_FILES';
    const creativeUrl = uploadConfig.doubleclick.url + '#creative:step=MANAGE_FILES';

    const qsCreativeNameInput = 'input#gwt-debug-creativeDetail-nameText';
    const qsCreativeFormatDropdown = 'div#gwt-debug-creativeDetail-formatText';
    const qsCreativeFormatValue = '#gwt-debug-creativeDetail-formatText-' + creative.format;

    const qsCreativeSizeDropdown = 'div#gwt-debug-creativeDetail-sizeText';
    const qsCreativeSizeValueCustom = 'div#gwt-debug-creativeDetail-sizeText-CUSTOM';
    const qsCreativeWidthInput = 'input#gwt-debug-creativeDetail-widthText';
    const qsCreativeHeightInput = 'input#gwt-debug-creativeDetail-heightText';

    const qsCreativeSubmit = 'a#gwt-debug-creativeworkflow-next-button';

    //log.info('creating new creative: ' + creative.name);
    log.debug('going to page: ' + createCreativeUrl);
    await page.goto(createCreativeUrl);
    log.debug('page loaded: ' + page.url());
    await page.waitFor(1500);

    log.debug('searching selector: ' + qsCreativeNameInput);
    await page.waitForSelector(qsCreativeNameInput);

    log.debug('clicking selector: ' + qsCreativeNameInput);
    await page.click(qsCreativeNameInput);
    await page.waitFor(waitMs);

    log.debug('filling selector: ' + qsCreativeNameInput);
    await page.type(qsCreativeNameInput, creative.name);
    await page.waitFor(waitMs);

    log.debug('searching selector: ' + qsCreativeFormatDropdown);
    await page.waitForSelector(qsCreativeFormatDropdown);

    log.debug('clicking selector: ' + qsCreativeFormatDropdown);
    await page.click(qsCreativeFormatDropdown);
    await page.waitFor(waitMs);

    log.debug('searching selector: ' + qsCreativeFormatValue);
    await page.waitForSelector(qsCreativeFormatValue);

    log.debug('clicking selector: ' + qsCreativeFormatValue);
    await page.click(qsCreativeFormatValue);
    await page.waitFor(waitMs);

    log.debug('searching selector: ' + qsCreativeSizeDropdown);
    await page.waitForSelector(qsCreativeSizeDropdown);

    log.debug('clicking selector: ' + qsCreativeSizeDropdown);
    await page.click(qsCreativeSizeDropdown);
    await page.waitFor(waitMs);

    log.debug('searching selector: ' + qsCreativeSizeValueCustom);
    await page.waitForSelector(qsCreativeSizeValueCustom);

    log.debug('clicking selector: ' + qsCreativeSizeValueCustom);
    await page.click(qsCreativeSizeValueCustom);
    await page.waitFor(waitMs);

    log.debug('searching selector: ' + qsCreativeWidthInput);
    await page.waitForSelector(qsCreativeWidthInput);

    log.debug('clicking selector: ' + qsCreativeWidthInput);
    await page.click(qsCreativeWidthInput);
    await page.waitFor(waitMs);

    log.debug('filling selector: ' + qsCreativeWidthInput);
    await page.type(qsCreativeWidthInput, creative.width);
    await page.waitFor(waitMs);

    log.debug('searching selector: ' + qsCreativeHeightInput);
    await page.waitForSelector(qsCreativeHeightInput);

    log.debug('clicking selector: ' + qsCreativeHeightInput);
    await page.click(qsCreativeHeightInput);
    await page.waitFor(waitMs);

    log.debug('filling selector: ' + qsCreativeHeightInput);
    await page.type(qsCreativeHeightInput, creative.height);
    await page.waitFor(waitMs);

    log.debug('searching selector: ' + qsCreativeSubmit);
    await page.waitForSelector(qsCreativeSubmit);

    log.debug('clicking selector: ' + qsCreativeSubmit);
    await page.click(qsCreativeSubmit);
    // wait until we're at the created campaign page so we can record the url params

    const newUrl = await waitForUrl(page, creativeUrl);
    await page.waitFor(waitMs);

    const urlParams = await getUrlParams(page.url());
    return { exists: true, url: page.url(), urlParams };
};

exports.uploadCreative = async (uploadConfig, uploadJSON, sidCookie, file) => {
    //const uploadConfig = await getJSON('./upload_config.json');
    const uploadUrl = uploadConfig.doubleclick.url + 'upload/rupio';

    // first part, request upload_id
    const data = uploadJSON;
    const params = {
        headers: {
            Cookie: sidCookie.name + '=' + sidCookie.value,
        },
    };

    const rupioResultUploadId = await axios.post(uploadUrl, data, params);

    //console.log(rupioResultUploadId.data)

    const uploadId = rupioResultUploadId.data.sessionStatus.upload_id;
    log.debug('uploading ' + file.name + ', status: ' + rupioResultUploadId.data.sessionStatus.state);

    // now second part, upload file
    const reqUploadFileUrl = uploadUrl + '?upload_id=' + uploadId + '&file_id=000';
    const headers = {
        Cookie: sidCookie.name + '=' + sidCookie.value,
        'content-type': 'application/octet-stream',
        'Content-Length': file.size,
    };

    const rupioResultPostFile = await axios.post(reqUploadFileUrl, file.data, { headers });

    // if (rupioResultPostFile.data.sessionStatus) {
    //     log.debug('uploading ' + file.name + ', status: ' + rupioResultPostFile.data.sessionStatus.state);
    // }
    //
    // else {
    //     if (rupioResultPostFile.data.errorMessage) {
    //
    //     }
    // }

    return rupioResultPostFile.data;
};

exports.composeUploadJSON = (accountId, advertiser, campaign, creative, file) => ({
    protocolVersion: '0.8',
    createSessionRequest: {
        fields: [
            {
                external: {
                    name: 'file',
                    filename: file.name,
                    put: {

                    },
                    size: file.size,
                },
            },
            {
                inlined: {
                    name: 'TYPE',
                    content: 'CREATIVE',
                    contentType: 'text/plain',
                },
            },
            {
                inlined: {
                    name: 'ACCOUNT_ID',
                    content: accountId,
                    contentType: 'text/plain',
                },
            },
            {
                inlined: {
                    name: 'ADVERTISER_ID',
                    content: advertiser.id,
                    contentType: 'text/plain',
                },
            },
            {
                inlined: {
                    name: 'ADVERTISER_OWNER_ID',
                    content: advertiser.ownerId,
                    contentType: 'text/plain',
                },
            },
            {
                inlined: {
                    name: 'CREATIVE_ID',
                    content: creative.id,
                    contentType: 'text/plain',
                },
            },
            {
                inlined: {
                    name: 'CREATIVE_ENTITY_ID',
                    content: creative.entityId,
                    contentType: 'text/plain',
                },
            },
            {
                inlined: {
                    name: 'CREATIVE_OWNER_ID',
                    content: advertiser.ownerId,
                    contentType: 'text/plain',
                },
            },
            {
                inlined: {
                    name: 'CREATIVE_FORMAT',
                    content: creative.format,
                    contentType: 'text/plain',
                },
            },
        ],
    },
});

const searchForEntity = async (page, searchQuery) => {
    // CSS selectors :
    // for commencing searches
    const qsSearchInput = '#gwt-debug-table-search-input';
    const qsSearchBtn = '#gwt-debug-table-search-button';
    const qsSearchResult = page.url().indexOf('campaignId') !== -1 ? 'td a[title="' + searchQuery + '" i]' : 'td:first-child a[title="' + searchQuery + '" i]';

    // for search results page
    const qsLoadingDone = "div.gwt-ScrollTable div#gwt-debug-modal-spinner div[aria-hidden='true']";
    const qsHeaders = 'table.headerTable tr';
    const qsData = 'table.dataTable tr';

    const searchResults = [];

    log.debug('searching selector: ' + qsSearchInput);
    await page.waitForSelector(qsSearchInput);

    const isDisabled = await page.$eval(qsSearchInput, (element) => element.hasAttribute('disabled')); // when there are no entities in a advertiser/campaign, the search bar is disabled
    if (isDisabled) {
        log.debug('Search is disabled, so there are no search results.');
        return { exists: false };
    }

    log.debug('clicking selector: ' + qsSearchInput);
    await page.click(qsSearchInput);
    await page.waitFor(waitMs);

    log.debug('filling selector: ' + qsSearchInput);
    await page.type(qsSearchInput, searchQuery);
    await page.waitFor(waitMs);

    log.debug('clicking selector: ' + qsSearchBtn);
    await page.click(qsSearchBtn);
    await page.waitFor(waitMs);

    log.debug('clicking selector: ' + qsLoadingDone);
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

    log.debug('search results parsed, searching through results');
    const searchResultsFilters = searchResults.filter((result) => result.name.toLowerCase() === searchQuery.toLowerCase());
    log.debug(searchResultsFilters.length + ' match found, retrieving IDs from url params...');

    if (searchResults.length === 0) {
        log.debug('no results');
        return { exists: false };
    }

    log.debug('searching selector: ' + qsSearchResult);
    await page.waitForSelector(qsSearchResult);

    log.debug('clicking selector: ' + qsSearchResult);
    await page.click(qsSearchResult);
    await page.waitFor(waitMs);

    const urlParams = await getUrlParams(page.url());
    return { exists: true, url: page.url(), urlParams };
};

const waitForUrl = async (page, url) => {
    const promise = new Promise((resolve) => {
        const checkUrl = setInterval(() => {
            log.debug('checking: ' + page.url());
            if (page.url().indexOf(url) === 0) {
                clearInterval(checkUrl);
                resolve(page.url());
            }
        }, 200);
    });

    return promise;
};
