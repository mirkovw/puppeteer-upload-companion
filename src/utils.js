const tracer = require('tracer');
const fs = require('fs');

exports.log = () => tracer.colorConsole();

exports.writeCookies = async (page, cookiesPath) => {
    const client = await page.target().createCDPSession();
    const cookies = (await client.send("Network.getAllCookies"))["cookies"];
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies));
};

exports.restoreCookies = async (page, cookiesPath) => {
    try {
        let buf = fs.readFileSync(cookiesPath);
        let cookies = JSON.parse(buf);
        await page.setCookie(...cookies);
    } catch (err) {
        // log.info("restore cookie error", err);
    }
};

exports.getJSON = async (path) => {
    try {
        const buf = fs.readFileSync(path);
        return JSON.parse(buf);
    } catch (err) {
        // log.info("restore cookie error", err);
        // return err;
    }
};

exports.getUrlParams = (url) => {
    const theObj = {};
    const theStr = url.substr(url.indexOf(":", 6)+1, url.length);
    const theArr = theStr.split("&");
    theArr.forEach( param => {
        tempArr = param.split("=");
        theObj[tempArr[0]] = tempArr[1];
    });

    return theObj;
};
