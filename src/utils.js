const tracer = require('tracer');
const fs = require('fs');
const path = require('path');
const validate = require('jsonschema').validate;

exports.log = () => tracer.colorConsole({ level: 'info' });



exports.getJSON = async (filePath) => {
    try {
        const buf = fs.readFileSync(filePath);
        return JSON.parse(buf);
    } catch (err) {
        // log.info("restore cookie error", err);
        return err;
    }
};

exports.writeCookies = async (page, cookiesPath) => {
    const dir = path.dirname(cookiesPath);
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
        // log.error("restore cookie error", err);
    }
};

exports.getCookie = (cookies, cookieID) => cookies.filter((cookie) => cookie.name === cookieID);

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
        await fs.writeFileSync('./upload_config.json', JSON.stringify(uploadObj, null, 2));
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


exports.validateUploadConfig = (uploadConfig) => {
    const mainSchema = {
        "id": "/mainSchema",
        "type": "object",
        "required": true,
        "properties": {
            "common": {
                "type": "object",
                "required": true,
                "properties": {
                    "cookiesPath": {
                        "type": "string",
                        "required": true
                    }
                }
            },
            "doubleclick": {
                "type": "object",
                "required": true,
                "properties": {
                    "accountName": {
                        "type": "string",
                        "required": true
                    },
                    "accountId": {
                        "type": "string",
                        "required": true
                    },
                    "url": {
                        "type": "string",
                        "required": true
                    }
                }
            },
            "campaigns": {
                "type": "array",
                "required": true,
                "items": {
                    "type": "object",
                    "required": true,
                    "properties": {
                        "advertiser": {
                            "type": "object",
                            "required": true,
                            "properties": {
                                "name": {
                                    "type": "string",
                                    "required": true
                                },
                                "id": {
                                    "type": "string",
                                    "required": true
                                },
                                "ownerId": {
                                    "type": "string",
                                    "required": true
                                },
                            }
                        },
                        "campaign": {
                            "type": "object",
                            "required": true,
                            "properties": {
                                "name": {
                                    "type": "string",
                                    "required": true
                                },
                                "id": {
                                    "type": "string",
                                    "required": true
                                }
                            }
                        },
                        "creatives": {
                            "type": "array",
                            "required": true,
                            "items": {
                                "type": "object",
                                "required": true,
                                "properties": {
                                    "name": {
                                        "type": "string",
                                        "required": true
                                    },
                                    "source": {
                                        "type": "string",
                                        "required": true
                                    },
                                    "width": {
                                        "type": "string",
                                        "required": true
                                    },
                                    "height": {
                                        "type": "string",
                                        "required": true
                                    },
                                    "format": {
                                        "type": "string",
                                        "required": true
                                    },
                                    "id": {
                                        "type": "string",
                                        "required": true
                                    },
                                    "entityId": {
                                        "type": "string",
                                        "required": true
                                    },
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    return validate(uploadConfig, mainSchema);
}
