const tracer = require('tracer');
const fs = require('fs');
const path = require('path');
const config = require('config');

exports.log = () => tracer.colorConsole();

exports.writeCookies = async (page, cookiesPath) => {
    const dir = path.dirname(config.get('common.cookiesPath'));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    const client = await page.target().createCDPSession();
    const { cookies } = await client.send('Network.getAllCookies');
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
};

exports.restoreCookies = async (page, cookiesPath) => {
    try {
        const buf = fs.readFileSync(cookiesPath);
        const cookies = JSON.parse(buf);
        await page.setCookie(...cookies);
    } catch (err) {
        // log.info("restore cookie error", err);
    }
};

exports.getCookie = (cookies, cookieID) => cookies.filter((cookie) => cookie.name === cookieID);

exports.getJSON = async (filePath) => {
    try {
        const buf = fs.readFileSync(filePath);
        return JSON.parse(buf);
    } catch (err) {
        // log.info("restore cookie error", err);
        return err;
    }
};

exports.getUrlParams = (url) => {
    const theObj = {};
    const theStr = url.substr(url.indexOf(':', 6) + 1, url.length);
    const theArr = theStr.split('&');
    theArr.forEach((param) => {
        const tempArr = param.split('=');
        const tempKey = tempArr[0];
        const tempVal = tempArr[1];
        theObj[tempKey] = tempVal;
    });

    return theObj;
};

exports.writeUploadConfig = async (uploadObj) => {
    try {
        await fs.writeFileSync(config.get('common.uploadConfigPath'), JSON.stringify(uploadObj, null, 2));
        // log.info('uploadConfig updated.');
        return true;
    } catch (err) {
        // log.error(err);
    }
};

exports.getFileData = (filePath) => ({
    path: filePath,
    name: path.basename(filePath),
    size: fs.statSync(filePath).size,
    data: fs.createReadStream(filePath),
});
