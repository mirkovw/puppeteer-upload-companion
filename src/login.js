const puppeteer = require('puppeteer');
const config = require('config');
const path = require('path');
const fs = require('fs');
const { writeCookies, restoreCookies, getUrlParams } = require('./utils.js');
const log = require('./utils.js').log();

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 900,
            height: 700,
        },
    });

    const page = await browser.newPage();

    const navigationPromise = page.waitForNavigation({
        waitUntil: 'load',
    });

    // load cookies if they're available
    await restoreCookies(page, config.get('common.cookiesPath'));

    await page.goto('https://accounts.google.com/');
    await navigationPromise;

    // CHECK WHAT THE URL IS
    if (page.url().indexOf('https://myaccount.google.com/') === 0) {
        log.info('You are already logged in. You can now run \'npm run upload\'');
        return browser.close();
    }

    log.info('Log into the Google account you use for DoubleClick.');
    await browser.waitForTarget((target) => target.url().indexOf('https://myaccount.google.com/') === 0, {
        timeout: 0,
    });

    log.info("Successfully logged in. You can now run 'npm run upload'");

    await writeCookies(page, config.get('common.cookiesPath'));

    return browser.close();
})();
