const functions = require('firebase-functions');

exports.sendClientReserveCancelNotification = functions.https.onCall((data, response) => {
    const clientUid = data.clientUid;
    const businessId = data.businessId;
    const command = data.command;

    console.log("clientUid: " + clientUid);
    console.log("businessId : " + businessId);
    console.log("Command: " + command);
});
