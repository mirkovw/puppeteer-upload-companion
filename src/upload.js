const puppeteer = require('puppeteer');
const config = require('config');
const path = require('path');
const fs = require('fs');
const { writeCookies, restoreCookies, getUrlParams, getJSON } = require('./utils.js');
const { getAdvertiser, getCampaign, getCreative, createAdvertiser, createCampaign, createCreative, uploadCreative } = require('./doubleclick.js');
const log = require('./utils.js').log();


const writeUploadConfig = async (uploadObj) => {
    try {
        await fs.writeFileSync(config.get('common.uploadConfigPath'), JSON.stringify(uploadObj, null, 2));
        log.info("uploadConfig updated.")
        return true;
    } catch (err) {
        log.error(err);
    }
};

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
    });

    const page = await browser.newPage();
    await restoreCookies(page, config.get('common.cookiesPath'));
    const navigationPromise = page.waitForNavigation({
        waitUntil: 'load',
    });

    const cookies = await page.cookies(config.get('doubleclick.url'));
    // TODO:    validate if cookies datestamp is still current. Probably only have to check SID cookie

    const uploadConfig = await getJSON(config.get('common.uploadConfigPath'));
    // TODO:    validate upload config.
    //          validate the entries already there
    //          if ID's are already in there, that means the entities already exist, so can probably skip straight to upload


    /* eslint-disable no-await-in-loop */
    // because why not?
    for (let q = 0; q < uploadConfig.campaigns.length; q += 1) {
        const upload = uploadConfig.campaigns[q];

        // check if advertiser exists
        let advertiser = await getAdvertiser(page, upload.advertiser.name);
        if (!advertiser.exists) advertiser = await createAdvertiser(browser, page, upload.advertiser.name);
        log.info(advertiser);

        // check if campaign exists
        let campaign = await getCampaign(page, advertiser, upload.campaign.name);
        if (!campaign.exists) campaign = await createCampaign(browser, page, advertiser, upload.campaign.name)
        log.info(campaign);

        // write new values
        uploadConfig.campaigns[q].advertiser.id = advertiser.urlParams.advertiserId;
        uploadConfig.campaigns[q].advertiser.ownerId = advertiser.urlParams.ownerId;
        uploadConfig.campaigns[q].campaign.id = campaign.urlParams.campaignId;
        await writeUploadConfig(uploadConfig);

        // check if creative exists
        for (let i = 0; i < upload.creatives.length; i += 1) {
            let creative = await getCreative(page, campaign, upload.creatives[i].name);

            if (!creative.exists) {
                log.info(upload.creatives[i].name + " doesn't exist. creating new one")
                creative = await createCreative(browser, page, advertiser, campaign, upload.creatives[i]);
            } else {
                log.info(upload.creatives[i].name + "exists. details: ");
            }
            log.info(creative);

            // write new values
            uploadConfig.campaigns[q].creatives[i].id = creative.urlParams.creativeId;
            uploadConfig.campaigns[q].creatives[i].entityId = creative.urlParams.entityId;
            await writeUploadConfig(uploadConfig);
        }
    }

    
    //TODO      upload all creatives. use upload_file.js for reference

    


    // await browser.close();
})();
