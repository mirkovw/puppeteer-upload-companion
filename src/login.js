// const config = require('config');
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 900,
            height: 700,
        },
        userDataDir: './user_data',
    });

    const page = await browser.newPage();
    const navigationPromise = page.waitForNavigation({
        waitUntil: 'load',
    });

    await page.goto('https://accounts.google.com/');
    await navigationPromise;

    // CHECK WHAT THE URL IS
    if (page.url().indexOf('https://myaccount.google.com/') === 0) {
        console.log('You are already logged in. You can now run \'npm run upload\'');
        return await browser.close();
    }

    console.log('Log into the Google account you use for DoubleClick.');
    await browser.waitForTarget((target) => target.url().indexOf('https://myaccount.google.com/') === 0, {
        timeout: 0,
    });

    console.log("Successfully logged in. You can now run 'npm run upload'");
    await browser.close();
})();
