# DoubleClick Studio Upload Tool
This is a DoubleClick Studio batch upload script using Puppeteer.

## Installation

Quickly describe how to install your project and how to get it running

1. Install Node dependencies

        npm install


2. Add these scripts to package.json

        "login": "node ./node_modules/dc-upload/src/login.js",
        "upload": "node ./node_modules/dc-upload/src/upload.js"

3. Create a upload.config.json in your root folder, with this structure and fill in all the bits in {}

          {
              "common": {
                "cookiesPath": "./user_data/cookies.json",
                "uploadConfigPath": "./upload_config.json"
              },
              "doubleclick": {
                "accountName": "{accountname}",
                "accountId": "{accountId}",
                "url": "https://www.google.com/doubleclick/studio/"
              },
              "campaigns": [
                {
                  "advertiser": {
                    "name": "{advertiser}"
                  },
                  "campaign": {
                    "name": "{campaign}"
                  },
                  "creatives": [
                    {
                      "name": "{creative_name}",
                      "source": "{path, i.e. ./build/300x600.zip}",
                      "width": "{width, i.e. 300}",
                      "height": "{height, i.e. 600}",
                      "format": "{type, i.e. INPAGE}"
                    }
                  ]
                }
              ]
          }

## Usage

1. First, log in to DC Studio using your credentials in the browser:

        npm run login

2. Then, start the upload script:

        npm run upload


## Support & Ownership

Feel free to reach out if you need some support when there are any questions left.
