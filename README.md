## Setup

Configure your GCP account and get your credentials. Follow [this guide](https://dev.to/chandrapantachhetri/sending-emails-securely-using-node-js-nodemailer-smtp-gmail-and-oauth2-g3a) or its [archived version](https://web.archive.org/web/20230914002757/https://dev.to/chandrapantachhetri/sending-emails-securely-using-node-js-nodemailer-smtp-gmail-and-oauth2-g3a) (just in case).

There was a step missing while using the GCP oauth2 app with https://developers.google.com/oauthplayground: if it fails with the following error:

```
"appname" has not completed the Google verification process.
The app is currently being tested, and can only be accessed by developer-approved testers.
If you think you should have access, contact the developer.
If you are a developer of appname, see error details.
Error 403: access_denied.
```

Then you have to add your email as a app user on the GCP console at the OAuth consent screen page.

After this is done, then add the following variables to a .env file:

```
CLIENT_SECRET=
CLIENT_ID=
CLIENT_REFRESH_TOKEN=
GMAIL_APP_USER=
```


## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```