const puppeteer = require('puppeteer');
const path = require('path');
const config = require('config');
const axios = require('axios');
const fs = require('fs');

// ONLY USE WHEN DEVELOPING IN CHARLES
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// const mainPageUrl = 'https://localhost:65000/doubleclick/studio/';
const mainPageUrl = 'https://www.google.com/doubleclick/studio/';
const uploadScriptUrl = 'upload/rupio';

const zipFilename = './files/dcu_test_300x250.zip';
const zipData = fs.createReadStream(zipFilename);
const zipFilesize = fs.statSync(zipFilename).size;

const accountId = '33345';
const advertiserId = '36525044';
const creativeId = '36529182';
const ownerId = '291343';
const entityId = '106215518';
const creativeFormat = 'INPAGE';

const uploadScriptData = {
    'protocolVersion': '0.8',
    'createSessionRequest': {
        'fields': [
            {
                'external': {
                    'name': 'file',
                    'filename': 'dcu_test_300x250.zip',
                    'put': {

                    },
                    'size': zipFilesize
                }
            },
            {
                'inlined': {
                    'name': 'TYPE',
                    'content': 'CREATIVE',
                    'contentType': 'text/plain'
                }
            },
            {
                'inlined': {
                    'name': 'ACCOUNT_ID',
                    'content': accountId,
                    'contentType': 'text/plain'
                }
            },
            {
                'inlined': {
                    'name': 'ADVERTISER_ID',
                    'content': advertiserId,
                    'contentType': 'text/plain'
                }
            },
            {
                'inlined': {
                    'name': 'ADVERTISER_OWNER_ID',
                    'content': ownerId,
                    'contentType': 'text/plain'
                }
            },
            {
                'inlined': {
                    'name': 'CREATIVE_ID',
                    'content': creativeId,
                    'contentType': 'text/plain'
                }
            },
            {
                'inlined': {
                    'name': 'CREATIVE_ENTITY_ID',
                    'content': entityId,
                    'contentType': 'text/plain'
                }
            },
            {
                'inlined': {
                    'name': 'CREATIVE_OWNER_ID',
                    'content': ownerId,
                    'contentType': 'text/plain'
                }
            },
            {
                'inlined': {
                    'name': 'CREATIVE_FORMAT',
                    'content': creativeFormat,
                    'contentType': 'text/plain'
                }
            }
        ]
    }
};

const getCookie = (cookies, cookieID) => cookies.filter( (cookie) => cookie.name === cookieID);

(async () => {
    // Set up puppeteer instance
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--start-maximized'],
        defaultViewport: {
            width: 1920,
            height: 1080,
        },
        userDataDir: path.resolve(config.get('common.userDataDir')),
    });

    const page = await browser.newPage();
    const navigationPromise = page.waitForNavigation({
        waitUntil: 'load',
    });


    // Get the SID Cookie
    await page.goto('https://www.google.com/doubleclick/studio/#creative:step=MANAGE_FILES&advertiserId=36525044&creativeId=36529182&ownerId=291343&entityId=106215518');
    //await page.goto(mainPageUrl);
    await navigationPromise;
    const cookies = await page.cookies();
    const [sidCookie] = getCookie(cookies, 'SID');
    console.log('Got cookie: '  + sidCookie.name + '=' + sidCookie.value)

    // first part, request upload_id
    const reqUploadIDUrl = mainPageUrl + uploadScriptUrl;
    const data = uploadScriptData;
    const params = {
        'headers': {
            Cookie: sidCookie.name + '=' + sidCookie.value,
        }
    };
    const rupioResultUploadId = await axios.post(reqUploadIDUrl, data, params);
    console.log(rupioResultUploadId.data);

    const uploadId = rupioResultUploadId.data.sessionStatus.upload_id;
    console.log('received upload id: ' + uploadId);

    // now second part, upload file
    const reqUploadFileUrl = mainPageUrl + uploadScriptUrl + '?upload_id=' + uploadId + '&file_id=000';
    const headers = {
        Cookie: sidCookie.name + '=' + sidCookie.value,
        'content-type': 'application/octet-stream',
        'Content-Length': zipFilesize,
    };

    const rupioResultPostFile = await axios.post(reqUploadFileUrl, zipData, {headers});
    console.log(rupioResultPostFile.data);
})();