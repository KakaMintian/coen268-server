const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

function sendNotification(recvRegToken, title, body) {
    let messagePayload = {
        notification: {
            titie: title,
            body: body
        }
    };

    return admin.messaging().sendToDevice(recvRegToken, messagePayload);
}

function getRegTokenFromUid(userId) {
    return db.collection("userSession")
        .doc(userId)
        .get()
        .catch(e => console.log("GetBizRegTokenDocSnapshot: " + e))
        .then(docSnapshot => {
            if (docSnapshot.exists) {
                const tokenData = docSnapshot.data();
                console.log("{ userId: " + docSnapshot.id + ", regToken: " + tokenData.regToken + " }");
                // We got the device regtoken, then we can initiate the fcm message
                return tokenData.regToken;

            } else {
                throw new Error("RegToken for bizUid not found");
            }
        });
}

function getRegTokenFromBusinessId(businessId) {
    return db.collection("users")
        .where("business_id", "==", businessId)
        .get()
        .then(querySnapshot => {
            if (querySnapshot.empty) {
                throw new Error("bizUid is not found");
            }
            const queryDoc = querySnapshot.docs[0];
            const bizUid = queryDoc.id;
            return bizUid;
        })
        .catch(e => console.log("GetBizUid: " + e))
        .then(getRegTokenFromUid);
}

exports.sendClientReserveCancelNotification = functions.https.onCall((data, response) => {
    const clientUsername = data.clientUsername;
    const businessId = data.businessId;
    const command = data.command;

    console.log("Start!!");

    return getRegTokenFromBusinessId(businessId)
        .catch(e => console.log("getRegTokenFromBusinessId: " + e))
        .then(regToken => {
            let title = "";
            if (command === "Reserve") {
                title = "New reservation";
                body = clientUsername + " has just reserved a spot at your business!";
            } else if (command === "Cancel") {
                title = "New cancellation";
                body = clientUsername + " has just cancelled a reservation at your business!";
            } else {
                throw new Error("Bad command: " + command);
            }
            return sendNotification(regToken, title, body);
        })
        .catch(e => console.log("Build notification error: " + e))
        .then((response) => {
            // Response is a message ID string.
            console.log("Successfully sent message: ", response);
            return { result: "Success" };
        }).catch((e) => {
            console.log("Error sending message: ", e);
        });
});

exports.sendAcceptReservationNotification = functions.https.onCall((data, response) => {
    const bizUserName = data.bizUserName;
    const clientUid = data.clientUid;

    return getRegTokenFromUid(clientUid)
        .catch(e => console.log("getRegTokenFromUid: " + e))
        .then(regToken => {
            let title = "Reservation accepted";
            let body = "Business \"" + bizUserName + "\" has accepted your reservation!";
            return sendNotification(regToken, title, body);
        })
        .catch(e => console.log("Build notification error: " + e))
        .then((response) => {
            // Response is a message ID string.
            console.log("Successfully sent message: ", response);
            return { result: "Success" };
        }).catch((e) => {
            console.log("Error sending message: ", e);
        });
});
