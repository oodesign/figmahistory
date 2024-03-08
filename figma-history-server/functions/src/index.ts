import * as functions from 'firebase-functions';
import * as express from 'express';
import * as cors from 'cors';
import * as admin from 'firebase-admin';
import { DocumentData, Timestamp } from 'firebase-admin/firestore'
// import axios from 'axios';

const app = express();
const fetch = require('node-fetch');



app.use(cors());

const CLIENT_ID = "ECsZGdpdZooHd5lBmVoGfc";
const CLIENT_SECRET = "cnri8wIswQlPDmFSOnWom8EAOUj5G1";
//const REDIRECT_URI = "https://us-central1-figma-history-server.cloudfunctions.net/api/figmaCallback";
const REDIRECT_URI = "http://127.0.0.1:5001/figma-history-server/us-central1/api/figmaCallback";
const serviceAccount = require('../fb/credentials.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://figma-history-server.firebaseio.com',
});

const firestore = admin.firestore();

enum AppState {
    NOT_REGISTERED,
    TRIAL_EXPIRED,
    TRIAL_ACTIVE,
    ACTIVE,
    LICENSE_DISABLED
}

interface User {
    id: string;
    handle: string;
    img_url: string;
    email: string;
};

interface AppResponse {
    state: AppState,
    trialDaysLeft: number
}

interface License {
    emails: string[];
    licenseKey: string;
    licenseType: string;
    activationDate: Timestamp
}

interface AuthorizedToken {
    uuid: string;
    user: User;
    token: string;
}

interface Trial {
    email: string;
    trialStartDate: Timestamp;
}

// interface User {
//     id: string;
//     handle: string;
//     img_url: string;
//     email: string;
// };

// interface TrialData {
//     email: string;
//     startDate: string;
// }


const addTrial = async (data: Trial): Promise<void> => {
    const trialsRef = admin.firestore().collection('Trials');
    await trialsRef.add(data);
};

const addLicense = async (data: License): Promise<void> => {
    const licensesRef = admin.firestore().collection('Licenses');
    await licensesRef.add(data);
};

const addAuthorizedToken = async (data: AuthorizedToken): Promise<void> => {
    const authorizedTokenRef = admin.firestore().collection('AuthorizedTokens');
    await authorizedTokenRef.add(data);
};


async function getUser(token: string): Promise<User> {
    const response = await fetch('https://api.figma.com/v1/me/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.json();
}


async function getAuthorizedToken(uuid: string): Promise<AuthorizedToken | null> {
    try {
        const authorizedTokensRef = firestore.collection('AuthorizedTokens');
        const querySnapshot = await authorizedTokensRef.where('uuid', '==', uuid).get();
        if (querySnapshot.empty) {
            return null; // No license found for the provided email
        }

        const tokenDoc = querySnapshot.docs[0];
        const tokenData = tokenDoc.data() as AuthorizedToken;
        return tokenData;

    } catch (error) {
        console.error('Error checking license:', error);
        throw error;
    }
}

async function getTrialFromEmail(email: string): Promise<Trial | null> {
    try {
        console.log("Checking if there is a trial with this email:" + email)
        const trialsRef = firestore.collection('Trials');
        const querySnapshot = await trialsRef.where('email', '==', email).get();
        if (querySnapshot.empty) {
            console.log("--- Apparently there isn't");
            return null; // No license found for the provided email
        }

        const trialDoc = querySnapshot.docs[0];
        const trialData = trialDoc.data() as Trial;
        console.log("--- Apparently there is. Returning related trial.");
        return trialData;
    } catch (error) {
        console.error('Error checking license:', error);
        throw error;
    }
}

async function getLicenseFromKey(licenseKey: string): Promise<DocumentData | null> {
    try {
        const licensesRef = firestore.collection('Licenses');
        const querySnapshot = await licensesRef.where('licenseKey', '==', licenseKey).get();
        if (querySnapshot.empty) {
            return null; // No license found for the provided email
        }

        const licenseDoc = querySnapshot.docs[0];

        return licenseDoc;
    } catch (error) {
        console.error('Error checking license:', error);
        throw error;
    }
}

async function getLicenseFromEmail(email: string): Promise<License | null> {
    try {
        console.log("Checking if there is a license with this email:" + email)
        const licensesRef = firestore.collection('Licenses');
        //const querySnapshot = await licensesRef.where('email', '==', email).get();
        const querySnapshot = await licensesRef.where('emails', 'array-contains', email).get();
        if (querySnapshot.empty) {
            console.log("--- Apparently there isn't");
            return null; // No license found for the provided email
        }

        const licenseDoc = querySnapshot.docs[0];
        const licenseData = licenseDoc.data() as License;

        console.log("--- Apparently there is. Returning related license.");
        return licenseData;
    } catch (error) {
        console.error('Error checking license:', error);
        throw error;
    }
}

function isTrialActive(trial: Trial) {
    const currentDate = Timestamp.now().toDate();
    const differenceInMilliseconds = currentDate.getTime() - trial.trialStartDate.toDate().getTime();

    const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1000;
    const isActive = differenceInMilliseconds < sevenDaysInMilliseconds;

    return isActive;
}

async function getGumroadLicense(licenseKey: string): Promise<any> {
    const apiUrl = `https://api.gumroad.com/v2/licenses/verify`;

    const requestOptions: RequestInit = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            product_id: 'FeA6PPl3A7Bameb0qrAbMw==',
            license_key: licenseKey,
        }),
    };

    try {
        const response = await fetch(apiUrl, requestOptions);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        return responseData;
    } catch (error) {
        // Handle errors, log or return false if the license is not valid
        return false;
    }
}

function getTrialDaysLeft(timestamp: Timestamp) {
    const trialDurationDays = 7;
    const millisecondsInDay = 24 * 60 * 60 * 1000; // 24 hours * 60 minutes * 60 seconds * 1000 milliseconds

    const currentDate = new Date();
    const trialStartDate = timestamp.toDate();

    const elapsedTime = currentDate.getTime() - trialStartDate.getTime();
    const remainingTime = trialDurationDays * millisecondsInDay - elapsedTime;

    if (remainingTime > 0) {
        const remainingDays = Math.ceil(remainingTime / millisecondsInDay);
        return remainingDays;
    } else {
        return 0; // Trial has expired
    }
}

app.post('/activate-license', async (req, res) => {

    try {
        // Extract the code from the request body or wherever it is provided
        const email = req.body.email;
        const licenseKey = req.body.licenseKey;

        //console.log("Activating license!" + email + "," + token + "," + licenseKey)


        //Check license key on Gumroad platform
        const gumroadlicenseResponse = await getGumroadLicense(licenseKey);
        if (gumroadlicenseResponse.success) {
            const licenseType = gumroadlicenseResponse.purchase.variants;

            //TODO  CHECK IF LICENSE ALREADY EXISTS. DEPENDING ON IT RETURN MESSAGE MAY BE DIFFERENT
            let licenseData: License | null = null;
            const fbLicense = await getLicenseFromKey(licenseKey);
            if (fbLicense) {
                //If license already exists in Firebase, check if it's single or team license
                let licenseData = fbLicense.data() as License;
                if (licenseData.licenseType == "(Team license)") {
                    //If team license, add the email in the authorized emails array (if it's not there already)
                    if (!licenseData.emails.includes(email)) {
                        const licensesRef = firestore.collection('Licenses');
                        //console.log("License exists. Updating authorized emails of:" + fbLicense.id)
                        await licensesRef.doc(fbLicense.id).update({
                            emails: [...licenseData.emails, email]
                        });
                    }

                    res.status(200).json({ message: "License was activated", licenseData: JSON.stringify(licenseData) });

                } else if (licenseData.licenseType == "(Single license)") {
                    //If license exists and is single, check if it's same user or not.
                    if (licenseData.emails.includes(email)) {

                        res.status(200).json({ message: "License was activated", licenseData: JSON.stringify(licenseData) });
                    } else {
                        //If email is not in, the license key was used to activate a different account.
                        res.status(200).json({ message: "License already used" });
                    }
                }
            }
            else {
                //If license doesn't exist in Firebase then needs to be created.
                addLicense({
                    emails: [email],
                    licenseKey: licenseKey,
                    licenseType: licenseType,
                    activationDate: Timestamp.now()
                })
                licenseData = {
                    emails: [email],
                    licenseKey: licenseKey,
                    licenseType: licenseType,
                    activationDate: Timestamp.now()
                }
                res.status(200).json({ message: "License was activated", licenseData: JSON.stringify(licenseData) });
            }

        }
        else {
            res.status(200).json({ message: "License not valid" });
        }


    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.post('/getAccessDetails', async (req, res) => {

    try {
        // Extract the token from the request body or wherever it is provided
        const uuid = req.body.uuid;


        console.log("getAccessDetails")

        let appResponse: AppResponse = {
            state: AppState.NOT_REGISTERED,
            trialDaysLeft: 0
        }

        if (uuid) {
            const authorizedToken = await getAuthorizedToken(uuid);
            console.log("--- authorizedToken is:");
            console.log(authorizedToken)
            if (authorizedToken) {
                //console.log("Getting license from email. Email is:" + user.email)
                const license = await getLicenseFromEmail(authorizedToken.user.email);
                if (license) {
                    console.log("--- Checking GUmroad license key. Key is:"+license.licenseKey);
                    const gumroadlicenseResponse = await getGumroadLicense(license.licenseKey);
                    if (gumroadlicenseResponse.success) {
                        appResponse.state = AppState.ACTIVE;
                        console.log("User was already registered.");
                    }
                    else {
                        console.log("Gumroad returned License invalid");
                        appResponse.state = AppState.LICENSE_DISABLED;
                    }
                }
                else {
                    //console.log("Getting trial from email. Email is:" + user.email)
                    const trial = await getTrialFromEmail(authorizedToken.user.email);
                    //console.log(trial);
                    if (trial) {
                        const trialActive = isTrialActive(trial);
                        appResponse.state = trialActive ? AppState.TRIAL_ACTIVE : AppState.TRIAL_EXPIRED;
                        appResponse.trialDaysLeft = getTrialDaysLeft(trial.trialStartDate);
                        //console.log("User is in trial." + (trialActive ? "Trial is active" : "But trial has expired") + ". Here trial data:");
                        //console.log(trial);
                    }
                    else {
                        //console.log("User is not registered. Let's enable a free trial");
                        addTrial({
                            email: authorizedToken.user.email,
                            trialStartDate: Timestamp.now()
                        });
                        appResponse.state = AppState.TRIAL_ACTIVE;
                        appResponse.trialDaysLeft = getTrialDaysLeft(Timestamp.now());
                    }
                }
            }

        }


        console.log("Concluded getAccessDetails. appResponse is:");
        console.log(appResponse);

        // Send a response back to your client
        res.status(200).json({ appResponse });


    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/figmaCallback', async (req, res) => {
    // console.log("This is figmaCallback");
    try {
        // console.log("--- Storing authorizedToken");

        const state = req.query.state?.toString();
        const code = req.query.code?.toString();


        // console.log("--- Received state:" + state + " - code:" + code);

        if (state && code) {

            const figmaToken = await getUserFigmaToken(code);
            const user = await getUser(figmaToken);

            addAuthorizedToken({
                uuid: state,
                user: user,
                token: figmaToken
            });


            console.log("--- Stored in DB:" + state + " - token:" + figmaToken);
        }

        res.send(`
            <script>
                window.close();
            </script>
          `);
        // console.log("--- Sent response");
    } catch (error: any) {
        // console.log("--- But FAILED:");
        console.error('Error calling figmaCallback:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/poll-authentication', async (req, res) => {
    console.log("Polling auth token")
    const uuid = req.body.uuid;
    const authorizedToken = await getAuthorizedToken(uuid);
    console.log("Got the token:")
    console.log(authorizedToken);
    res.json(authorizedToken);
});


export const api = functions.https.onRequest(app);

async function getUserFigmaToken(code: string) {
    try {
        // Create the request body as URLSearchParams
        const requestBody = new URLSearchParams();
        requestBody.append('client_id', CLIENT_ID);
        requestBody.append('client_secret', CLIENT_SECRET);
        requestBody.append('redirect_uri', REDIRECT_URI);
        requestBody.append('code', code);
        requestBody.append('grant_type', 'authorization_code');

        // Make a POST request to the Figma API to exchange the code for an access token
        const figmaResponse = await fetch('https://www.figma.com/api/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: requestBody,
        });


        // Handle the response from the Figma API
        const figmaData = await figmaResponse.json();
        const userFigmaToken = figmaData.access_token;

        console.log("Got the user Figma token from Figma. Token is:" + userFigmaToken);

        return userFigmaToken;

    } catch (error: any) {
        // console.log("--- But FAILED:");
        console.error('Error calling getUserFigmaToken:', error.message);
    }
}
