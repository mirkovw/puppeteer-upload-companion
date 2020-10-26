const puppeteer = require('puppeteer');

const {
    restoreCookies, getCookie, getJSON, getFileData, writeUploadConfig,
} = require('./utils.js');
const {
    getAdvertiser, getCampaign, getCreative, createAdvertiser, createCampaign, createCreative, uploadCreative, composeUploadJSON,
} = require('./doubleclick.js');
const log = require('./utils.js').log();

// TODO:        Maybe create some sort of prompt style menu to create initial upload_config.json. Or perhaps it's better to just create the uploadConfig from scratch.

(async () => {
    const uploadConfig = await getJSON('./upload_config.json');

    const browser = await puppeteer.launch({
        headless: true,
    });

    const page = await browser.newPage();
    // const navigationPromise = page.waitForNavigation({
    //     waitUntil: 'load',
    // });



    // inject previously saved cookies and validate timestamps

    await restoreCookies(page, uploadConfig.common.cookiesPath);
    const cookies = await page.cookies(uploadConfig.doubleclick.url);
    const expiredCookies = cookies.filter((cookie) => cookie.expires < Math.floor(new Date() / 1000));
    log.info(expiredCookies.length === 0 ? 'Cookies checked, all good to go' : 'Some of the required cookies have expired, please log in again with \'npm run login\': ' + expiredCookies);

    // const uploadConfig = await getJSON(config.get('common.uploadConfigPath'));


    const configIncomplete = true; // true when ID's are missing from uploadConfig.
    // TODO:    validate upload config.
    //          validate the entries already there
    //          if ID's are already in there, that means the entities already exist, so can probably skip straight to upload
    //          set configIncomplete based on whether ID's are missing or not

    // get ID's (advertiserId, campaignId, creativeId, etc), or create new entities, for all entities and save these to uploadConfig for future reference
    /* eslint-disable no-await-in-loop */
    // because why not?

    if (configIncomplete) {
        for (let q = 0; q < uploadConfig.campaigns.length; q += 1) {
            const data = uploadConfig.campaigns[q];

            // check if advertiser exists
            let advertiser = await getAdvertiser(page, data.advertiser.name);
            if (!advertiser.exists) advertiser = await createAdvertiser(browser, page, data.advertiser.name);
            log.info(advertiser);

            // check if campaign exists
            let campaign = await getCampaign(page, advertiser, data.campaign.name);
            if (!campaign.exists) campaign = await createCampaign(browser, page, advertiser, data.campaign.name);
            log.info(campaign);

            // write new values
            uploadConfig.campaigns[q].advertiser.id = advertiser.urlParams.advertiserId;
            uploadConfig.campaigns[q].advertiser.ownerId = advertiser.urlParams.ownerId;
            uploadConfig.campaigns[q].campaign.id = campaign.urlParams.campaignId;
            await writeUploadConfig(uploadConfig);

            // check if creative exists
            for (let i = 0; i < data.creatives.length; i += 1) {
                let creative = await getCreative(page, campaign, data.creatives[i].name);
                if (!creative.exists) creative = await createCreative(browser, page, advertiser, campaign, data.creatives[i]);
                log.info(creative);

                // write new values
                uploadConfig.campaigns[q].creatives[i].id = creative.urlParams.creativeId;
                uploadConfig.campaigns[q].creatives[i].entityId = creative.urlParams.entityId;
                await writeUploadConfig(uploadConfig);
            }
        }
    }

    // upload all creatives
    for (let q = 0; q < uploadConfig.campaigns.length; q += 1) {
        const batch = uploadConfig.campaigns[q];
        log.debug('starting upload of ' + batch.advertiser.name + ':' + batch.campaign.name + ' with ' + batch.creatives.length + ' creatives.');

        // check if creative exists
        for (let i = 0; i < batch.creatives.length; i += 1) {
            const file = getFileData(batch.creatives[i].source);
            const [sidCookie] = getCookie(cookies, 'SID');

            const uploadJSON = composeUploadJSON(
                uploadConfig.doubleclick.accountId,
                batch.advertiser,
                batch.campaign,
                batch.creatives[i],
                file,
            );

            await uploadCreative(uploadJSON, sidCookie, file);
        }
    }

    await browser.close();
})();
