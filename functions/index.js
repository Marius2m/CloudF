const functions = require('firebase-functions');

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

// exports.helloWorld = functions.https.onRequest((request, response) => {
//     data = JSON.stringify("Hello from Firebase!");
//     console.log("req:", request.query);
//     return response.send({message: "Hi Android!"});
//     //return response.status(200).json({message: '[S] getMorePosts',});
// });

// maybe include continents names inside the array in the case of continent selected
const regions = [
    {
        africa: 
            ["Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cameroon", "Cape Verde", "Central African Republic", "Chad", "Comoros", "Republic of the Congo", "Democratic Republic of the Congo", "Côte d'Ivoire", 
            "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Ethiopia", "Gabon", "The Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius",
            "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "São Tomé and Príncipe", "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Swaziland", "Tanzania", "Togo", "Tunisia", 
            "Uganda", "Western Sahara", "Zambia", "Zimbabwe"]
    },
    {
        antarctica: 
            ["2"],
    },
    {
        asia: 
            ["Afghanistan", "Armenia", "Azerbaijan", "Bahrain", "Bangladesh", "Bhutan", "Brunei", "Cambodia", "China", "Cyprus", "East Timor", "Georgia", "India", "Indonesia", "Iran", "Iraq", "Israel", "Japan", "Jordan", "Kazakhstan",
            "Kuwait", "Kyrgyzstan", "Laos", "Lebanon", "Malaysia", "Maldives", "Mongolia", "Myanmar", "Nepal", "North Korea", "Oman", "Pakistan", "Palestine", "Philippines", "Qatar", "Russian", "Saudi Arabia", "Singapore", "South Korea",
            "Sri Lanka", "Syria", "Taiwan", "Tajikistan", "Thailand", "Turkey", "Turkmenistan", "United Arab Emirates", "Uzbekistan", "Vietnam", "Yemen"]
    },
    {
        europe: 
            ["Albania", "Andorra", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Czech Republic", "Denmark", "Estonia", "Findland", "France", "Germany", "Greece", "Hungary", "Iceland", "Republic of Ireland",
            "Italy", "Kosovo", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Macedonia", "Malta", "Moldova", "Monaco", "Montenegro", "Netherlands", "Norway", "Poland", "Portugal", "Romania", "San Marino", "Serbia", "Slovakia", "Slovenia",
            "Spain", "Sweden", "Switzerland", "Ukraine", "United Kingdom", "Vatican City"]
    },
    {
        "north america": 
            ["Canada", "Greenland", "Western Iceland", "United States of America", "Mexico", "Bermuda", "Antigua and Barbuda", "Aruba", "The Bahamas", "Barbados", "Belize", "Bonaire", "Costa Rica", "Cuba", "Curaçao", "Dominica", "Dominican Republic",
            "El Salvador", "Grenada", "Guatemala", "Haiti", "Honduras", "Jamaica", "Nicaragua", "Panama", "Puerto Rico", "Saba", "Saint Kitts and Nevis", "Saint Martin", "Saint Lucia", "Saint Vincent and the Grenadines", "Sint Eustatius", "Sint Maarten",
            "Trinidad and Tobago", "Turks and Caicos"]
    },
    {
        "south america": 
            ["Argentina", "Bolivia", "Brazil", "Chile", "Colombia", "Ecuador", "French Guiana", "Guyana", "Paraguay", "Peru", "Suriname", "Uruguay", "Venezuela"]
    },
    {
        oceania: 
            ["Australia", "Federated States of Micronesia", "Fiji", "Kiribati", "Marshall Islands", "Nauru", "New Zealand", "Palau", "Papua New Guinea", "Samoa", "Solomon Islands", "Tonga", "Tuvalu", "Vanuatu"]
    }
];

// exports.helloWorld = functions.https.onCall((data, context) => {
//     console.log("data:", data.text);

//     return{
//         res: "Hi Android"
//     };
// });

// exports.addNumbers = functions.https.onCall(async (data) => {
//     // [END addFunctionTrigger]
//       // [START readAddData]
//       // Numbers passed from the client.
//       const firstNumber = data.firstNumber;
//       const secondNumber = data.secondNumber;
//       // [END readAddData]
    
//       // [START addHttpsError]
//       // Checking that attributes are present and are numbers.
//       if (!Number.isFinite(firstNumber) || !Number.isFinite(secondNumber)) {
//         // Throwing an HttpsError so that the client gets the error details.
//         throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
//             'two arguments "firstNumber" and "secondNumber" which must both be numbers.');
//       }
//     //   [END addHttpsError]
    
//       // [START returnAddData]
//       // returning result.
//       return {
//         firstNumber: firstNumber,
//         secondNumber: secondNumber,
//         operator: '+',
//         operationResult: firstNumber + secondNumber,
//       };
//       // [END returnAddData]
//     });
//     // [END allAdd]


const admin = require('firebase-admin');
admin.initializeApp();

const findContinent = (findCountry) => {
    let foundContinent = 'other';

    regions.some( (regionEl) => {
         region = Object.keys(regionEl)[0];

        if (findCountry.toLocaleLowerCase() === region.toLocaleLowerCase()) {
            foundContinent = region;
            return true;
        }

        return regionEl[region].find( (country) => {
            if(findCountry.toLocaleLowerCase() === country.toLocaleLowerCase()){
                foundContinent = region;
                return true;
            }
            return false;
        });
    });
    return foundContinent;
}

const convertDegreesToRadians = (degrees) => {
    return degrees * Math.PI / 180;
}

function distanceBetween2Coordinates(A_lat, A_long, B_lat, B_long) {
    const earthRadius = 6371; // km

    const A_latRad = convertDegreesToRadians(A_lat);
    const B_latRad = convertDegreesToRadians(B_lat);

    const d_lat = convertDegreesToRadians(B_lat - A_lat);
    const d_long = convertDegreesToRadians(B_long - A_long);

    let a = Math.sin(d_lat / 2) * Math.sin(d_lat / 2) + 
            Math.cos(A_latRad) * Math.cos(B_latRad) *
            Math.sin(d_long / 2) * Math.sin(d_long / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return earthRadius * c; // km
}

async function getValidPosts(region, prevPostId, distance, currentLocationCoordinates) {
    let nrPostsToReturn = 5; // pagination

    let resData = []
    let currentNrOfPosts = 0;
    /* eslint-disable no-await-in-loop */
    do {
        let returnedData = await getMorePostsHelper(region, prevPostId, distance, currentLocationCoordinates);

        returnedStatus = returnedData.status;
        if (returnedStatus === 'failure') {
            break;
        }

        returnedPosts = returnedData.data;
        resData.push(...returnedPosts);

        prevPostId = returnedData.prevPostId;

        currentNrOfPosts += resData.length;
    } while (currentNrOfPosts < nrPostsToReturn);
    /* eslint-enable no-await-in-loop */

    return { message: "OK", validPosts: resData, prevPostId: prevPostId};

}

async function getMorePostsHelper(region, prevPostId, distance, currentLocationCoordinates){
    // console.log("ENTERED:");
    let resData = {"status": "failure", "data": []}

    const regionSnapshot = await admin.database().ref('/regions/').child(region).orderByKey().startAt(prevPostId).limitToFirst(3).once('value');
    let postsIdsJSON = regionSnapshot.val();
    if(postsIdsJSON === null || postsIdsJSON === undefined) {
        console.log("=== empty region 1");
        return resData;
    }

    let postsIdsArray = [];
    for(let id in postsIdsJSON){
        postsIdsArray.push(id);
    }
    postsIdsArray = postsIdsArray.filter(id => id !==prevPostId);
    if(postsIdsArray.length === 0) {
        console.log("==== empty region 2");
        return resData;
    }

    prevPostId = postsIdsArray[postsIdsArray.length - 1]
    // console.log("prevPostId: ", `'${prevPostId}'`);

    let promises = []
    for(id of postsIdsArray){
        promises.push(admin.database().ref('/posts/').child(id).once('value'));
    }
    
    // console.log("postsIdsArray", postsIdsArray);

    await Promise.all(promises).then(values => {
        let posts = JSON.parse(JSON.stringify(values))
        posts.forEach((post, index) =>  {
            if (distanceBetween2Coordinates(currentLocationCoordinates.latitude, currentLocationCoordinates.longitude, 
                    post.latitude, post.longitude) < distance) 
            {
                post["postId"] = postsIdsArray[index]
                resData.data.push(post)
            }
        })
        return;
    }).catch(err => console.log(err));

    resData.prevPostId = prevPostId;
    resData.status = "success";
    // console.log("EXIT:", resData);
    
    return resData;
}

exports.getMorePosts = functions.https.onRequest(async (req, res) => {
    let region = findContinent(req.query.country);
    let prevPostId = req.query.prevPostId;
    let distance = req.query.distance;
    let currentLocationCoordinates = {latitude: req.query.latitude, longitude: req.query.longitude};
    
    let postsData = await getValidPosts(region, prevPostId, distance, currentLocationCoordinates); 
    let message = "no-posts";
    let statusCode = 204;
    if(postsData.validPosts.length !== 0) { message = "ok"; statusCode = 200;}
    
    return res.status(statusCode).json({
        version: "getMorePosts 6",
        message: message,
        posts: postsData.validPosts,
        prevPostId: postsData.prevPostId,
    });

});

exports.getFirstPosts = functions.https.onRequest(async (req, res) => {
    let dbRef = admin.database().ref();
    let region = findContinent(req.query.country);
    let distance = req.query.distance;
    let currentLocationCoordinates = {latitude: req.query.latitude, longitude: req.query.longitude};
    console.log("QueryParams: ",req.query);    

    return dbRef.child('/regions/').child(region)
        .limitToFirst(1)
        .once('value')
        .then(async (snapshot) => {
            let data = snapshot.val();
            let message = "empty"

            if(data === null || data === undefined) { 
                message = "no-posts"
                return res.status(204).json({
                    version: "update 12",
                    message: message,
                });
            }else{
                message = "success"
            }
            console.log("data;", data);

            let firstPostId = Object.keys(data)[0]
        
            let resData = [];
            return dbRef.child('/posts').child(firstPostId).once('value')
                .then(async (snapshot) => {
                    let firstPost = snapshot.val();

                    if (distanceBetween2Coordinates(currentLocationCoordinates.latitude, currentLocationCoordinates.longitude, 
                        firstPost.latitude, firstPost.longitude) < distance) {
                            firstPost['postId'] = firstPostId;
                            resData.push(firstPost);
                    }

                    let postsData = await getValidPosts(region, firstPostId, distance, currentLocationCoordinates);
                    resData.push(...postsData.validPosts);

                    return res.status(200).json({
                        version: "update 12",
                        message: message,
                        posts: resData,
                        prevPostId: postsData.prevPostId,
                    });
                });
        
        })
        .catch((err) => {
            console.log("errrr", err);
            return res.status(202).json({
                version: "update 12",
                message: "no-posts-2",
                error: err,
            });
        });
});

// exports.addMessage = functions.https.onRequest(async (req, res) => {
//     const original = req.query.text;

//     const snapshot = await admin.database().ref('/messages').push({original: original});
//     // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
//     return res.status(200).json({
//               message: '[S] getMorePosts',
//               snapshot: snapshot,
//               original: original,
//           });
//   });


// Listens for new messages added to /messages/:pushId/original and creates an
// uppercase version of the message to /messages/:pushId/uppercase
// exports.makeUppercase = functions.database
//     .ref('/messages/{pushId}/original')
//     .onCreate((snapshot, context) => {
//       // Grab the current value of what was written to the Realtime Database.
//       const original = snapshot.val();
//       console.log('Uppercasing', context.params.pushId, original);
//       const uppercase = original.toUpperCase();
//       // You must return a Promise when performing asynchronous tasks inside a Functions such as
//       // writing to the Firebase Realtime Database.
//       // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
//       return snapshot.ref.parent.child('uppercase').set(uppercase);
//     });


// Listens for new posts added to /posts/:postId and creates an
// entry with postId under /regions/{continent}/ 
exports.addPostToRegion = functions.database
    .ref('/posts/{pushId}')
    .onCreate((snapshot, context) => {
        const snapshotData = snapshot.val();
        // console.log("Data is:",snapshotData); // data
        // console.log("Context.resouce is:", context.resource); // firebase project
        // console.log("Context.params is:", context.params); // key

        let foundContinent = 'other';
        //let findCountry = 'S�o Tom� and Pr�ncipe'; // snapshotData.country 
        let findCountry = snapshotData.location.split(',').pop().trim();

        regions.some( (regionEl) => {
            let region = Object.keys(regionEl)[0];

            if (findCountry.toLocaleLowerCase() === region.toLocaleLowerCase()) {
                foundContinent = region;
                return true;
            }

            return regionEl[region].find( (country) => {
                if(findCountry.toLocaleLowerCase() === country.toLocaleLowerCase()){
                    foundContinent = region;
                    return true;
                }
                return false;
            });
        });

        const postID = context.params.pushId;
        let regionData = {
            [postID]:1
        }
        

        return admin.database().ref().child('posts').child(postID).update({region: foundContinent})
            .then((data) => {
                console.log("dataUpdate", data);
                return snapshot.ref.parent.parent.child('regions').child(foundContinent).update(regionData);
            });
        // return snapshot.ref.parent.parent.child('regions').child(foundContinent).update(regionData);
});

exports.deletePost = functions.database
    .ref('/users/{userId}/posts/{postKey}')
    .onDelete(async (snapshot, context) => {        
        const postId = snapshot.val();
        // console.log("Data is:", postId); // value of {postId}
        // console.log("Context.resouce is:", context.resource); // the ref
        // console.log("Context.params is:", context.params); // {userId} {postKey}

        let postLocation = await admin.database().ref().child(`/posts/${postId}`).child('location').once('value');
        postLocation = postLocation.val();
        if (postLocation === null || postLocation === undefined) {
            return null;
        }

        const country = postLocation.split(',').pop().trim();
        const continent = findContinent(country);

        admin.database().ref().child('posts').child(`${postId}`)
            .remove()
            .catch((err) => {
                console.log("/posts/postId", err);
            });
        
        admin.database().ref().child('posts_contents').child(`${postId}`)
            .remove()
            .catch((err) => {
                console.log("/posts_contents/postId", err);
            });

        admin.database().ref().child('regions').child(`${continent}/${postId}`)
            .remove()
            .catch((err) => {
                console.log("/posts_contents/postId", err);
            });

        console.log(`Deleted post: ${postId}`)
        
        const bucket = admin.storage().bucket();
        return bucket.deleteFiles({
            prefix: `posts/${postId}`
        });
});

exports.deleteProfile = functions.https.onRequest(async (req, res) => {
    let dbRef = admin.database().ref();
    let userId = req.body.userId;

    console.log("req.body 1", req.body);

    let userPostsSnapshot = await dbRef.child(`/users/${userId}/posts`).once('value');
    userPostsSnapshot = userPostsSnapshot.val();
    console.log("userPostsSnapshot", userPostsSnapshot);

    let postsData = []
    
    /* eslint-disable no-await-in-loop */
    for (const key of Object.keys(userPostsSnapshot)) {
        let postId = userPostsSnapshot[key];
        let regionSnapshot = await dbRef.child(`/posts/${postId}/region`).once('value');
        postsData.push({id: postId, region: regionSnapshot.val()});
    }
    /* eslint-enable no-await-in-loop */

    const bucket = admin.storage().bucket();

    let promises = []
    for(post of postsData) {
        promises.push(dbRef.child(`/posts/${post.id}`).remove());
        promises.push(dbRef.child(`posts_contents/${post.id}`).remove());
        promises.push(dbRef.child(`regions/${post.region}/${post.id}`).remove());
        promises.push(bucket.deleteFiles({prefix: `posts/${post.id}`}));
    }

    await Promise.all(promises)
        .then((values) => {
            return dbRef.child(`users/${userId}`).remove()
                .then((resolve) => {

                   return admin.auth().deleteUser(userId)
                        .then(() => {
                            console.log(`Deleted user ${userId}`);
                            return res.status(200).json({
                                version: "deleteProfile 10",
                                userPostsSnapshot: userPostsSnapshot,
                                postsData: postsData,
                                values: values,
                            });
                        })
                        .catch((err) => {
                            console.error(`Failed to delete ${userId}: ${err}`);
                        });
                })
        })
        .catch(err => {
            console.log(err)
            return res.status(200).json({
                version: "deleteProfile 09",
                userPostsSnapshot: userPostsSnapshot,
                err: err,
            });
        });
});

exports.fakeFunction = functions.https.onRequest(async (req, res) => {

    // const storage = require('@google-cloud/storage')();
    // const bucket = storage.bucket('albums');
    // bucket.deleteFiles({
    //     prefix: `-Les4uTwiZB5Vyf0GCPh`
    //   }, function(err) {
    //     if (!err) {
    //       console.log("all files have been deleted");
    //     }
    // });

    const bucket1 = admin.storage().bucket();

    await bucket1.deleteFiles(
        {
        prefix: `posts/-Les4uTwiZB5Vyf0GCPh/`
        }, 
        (err => console.log("bucketError", err))
    );
    
    return res.status(200).json({
        message: 'Fake Function 02',
    });
});

exports.fakeDelete = functions.https.onRequest(async (req, res) => {
    // console.log(req);
    res.status(204).send({message: "Successfully deleted"});
});