const puppeteer = require('puppeteer');
const { restoreCookies, getCookie, getJSON, getFileData, writeUploadConfig, validateUploadConfig } = require('./utils.js');
const { getAdvertiser, getCampaign, getCreative, createAdvertiser, createCampaign, createCreative, uploadCreative, composeUploadJSON, getPreviewUrl } = require('./doubleclick.js');
const log = require('./utils.js').log();


// TODO: Maybe create some sort of prompt style menu to create initial upload_config.json. Or perhaps it's better to just create the uploadConfig from scratch.

(async () => {
    const uploadConfig = await getJSON('./upload_config.json');

    const browser = await puppeteer.launch({
        headless: false,
    });

    const page = await browser.newPage();

    // inject previously saved cookies and validate timestamps

    await restoreCookies(page, uploadConfig.common.cookiesPath);
    const cookies = await page.cookies(uploadConfig.doubleclick.url);
    const expiredCookies = cookies.filter((cookie) => cookie.expires < Math.floor(new Date() / 1000));
    log.info(expiredCookies.length === 0 ? 'cookies checked, all good to go' : 'some of the required cookies have expired, please log in again with \'npm run login\': ' + expiredCookies);

    // Validate uploadConfig file. Make sure all ID's are in there
    log.info("validating upload config file");
    const validateResult = validateUploadConfig(uploadConfig);

    /* eslint-disable no-await-in-loop */
    // because why not?

    if (!validateResult.valid) {
        log.debug(validateResult.errors);
        log.info("some ID's are missing, retrieving them now");

        // get ID's (advertiserId, campaignId, creativeId, etc), or create new entities, for all entities and save these to uploadConfig for future reference
        for (let q = 0; q < uploadConfig.campaigns.length; q += 1) {
            const data = uploadConfig.campaigns[q];

            // check if advertiser exists
            log.info('checking if advertiser exists: ' + data.advertiser.name);
            let advertiser = await getAdvertiser(page, uploadConfig, data.advertiser.name);

            if (advertiser.exists) {
                log.info("advertiser " + data.advertiser.name + " found with ID: "  + advertiser.urlParams.advertiserId + " & ownerId: " + advertiser.urlParams.ownerId)
            }

            else {
                log.info("can't find advertiser " + data.advertiser.name + ", creating new")
                advertiser = await createAdvertiser(browser, page, uploadConfig, data.advertiser.name);
                log.info("advertiser " + data.advertiser.name + " created with ID: "  + advertiser.urlParams.advertiserId + " & ownerId: " + advertiser.urlParams.ownerId)
            }


            // check if campaign exists
            log.info('checking if campaign exists: ' + data.campaign.name);
            let campaign = await getCampaign(page, advertiser, data.campaign.name);

            if (campaign.exists) {
                log.info("campaign " + data.campaign.name + " found with ID: "  + campaign.urlParams.campaignId)
            }

            else {
                log.info("can't find campaign " + data.campaign.name + ", creating new")
                campaign = await createCampaign(browser, page, uploadConfig, advertiser, data.campaign.name);
                log.info("campaign " + data.campaign.name + " created with ID: "  + campaign.urlParams.campaignId)
            }

            //const previewUrl = await(getPreviewUrl);

            // write new values
            uploadConfig.campaigns[q].advertiser.id = advertiser.urlParams.advertiserId;
            uploadConfig.campaigns[q].advertiser.ownerId = advertiser.urlParams.ownerId;
            uploadConfig.campaigns[q].campaign.id = campaign.urlParams.campaignId;
            await writeUploadConfig(uploadConfig);



            // check if creative exists
            for (let i = 0; i < data.creatives.length; i += 1) {

                log.info('checking if creative exists: ' + data.creatives[i].name);
                let creative = await getCreative(page, campaign, data.creatives[i].name);

                if (creative.exists) {
                    log.info("creative " + data.creatives[i].name + " found with ID: "  + creative.urlParams.creativeId + " & entityId: " + creative.urlParams.entityId)
                }

                else {
                    log.info("can't find creative " + data.creatives[i].name + ", creating new")
                    creative = await createCreative(browser, page, uploadConfig, advertiser, campaign, data.creatives[i]);
                    log.info("creative " + data.creatives[i].name + " created with ID: "  + creative.urlParams.creativeId + " & entityId: " + creative.urlParams.entityId)
                }

                // write new values
                uploadConfig.campaigns[q].creatives[i].id = creative.urlParams.creativeId;
                uploadConfig.campaigns[q].creatives[i].entityId = creative.urlParams.entityId;
                await writeUploadConfig(uploadConfig);
            }
        }
    }

    else {
        log.info("upload config validated");

    }

    // upload all creatives
    for (let q = 0; q < uploadConfig.campaigns.length; q += 1) {
        const batch = uploadConfig.campaigns[q];
        log.info('starting upload of ' + batch.advertiser.name + ':' + batch.campaign.name + ' with ' + batch.creatives.length + ' creatives');

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

            log.info("uploading " + file.name + " to doubleclick studio")

            const upload = await uploadCreative(uploadConfig, uploadJSON, sidCookie, file);

            if (upload.sessionStatus) {
                // all good
            }

            else {
                if (upload.errorMessage) {
                    log.info("error uploading file: " + upload.errorMessage.reason);
                    log.info("cancelling upload. please check upload_config.json for bad/old data");
                    return;
                }
            }

        }

        log.info("getting preview URL")
        const previewUrl = await getPreviewUrl(page, uploadConfig);
        log.info("preview url is.. " + previewUrl);
    }



    await browser.close();

})();
