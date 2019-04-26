const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//     data = JSON.stringify("Hello from Firebase!");
//     console.log("req:", request.query);
//     return response.send({message: "Hi Android!"});
//     //return response.status(200).json({message: '[S] getMorePosts',});
// });
exports.helloWorld = functions.https.onCall((data, context) => {
    console.log("data:", data.text);

    return{
        res: "Hi Android"
    };
});

exports.addNumbers = functions.https.onCall(async (data) => {
    // [END addFunctionTrigger]
      // [START readAddData]
      // Numbers passed from the client.
      const firstNumber = data.firstNumber;
      const secondNumber = data.secondNumber;
      // [END readAddData]
    
      // [START addHttpsError]
      // Checking that attributes are present and are numbers.
      if (!Number.isFinite(firstNumber) || !Number.isFinite(secondNumber)) {
        // Throwing an HttpsError so that the client gets the error details.
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
            'two arguments "firstNumber" and "secondNumber" which must both be numbers.');
      }
    //   [END addHttpsError]
    
      // [START returnAddData]
      // returning result.
      return {
        firstNumber: firstNumber,
        secondNumber: secondNumber,
        operator: '+',
        operationResult: firstNumber + secondNumber,
      };
      // [END returnAddData]
    });
    // [END allAdd]


const admin = require('firebase-admin');
admin.initializeApp();




// exports.getInitialPosts = functions.https.onRequest((req, res) => {

//     let initialData = await admin.database().ref('/regions/').child(req.query.region).limitToFirst(2).once('value');

//     console.log("init data", initialData.val());

//     // let initialPostData = await admin.database().ref('/posts/').child(id).once('value');

//     return res.status(200).send.json({
//         version: "check if data is null",
//         message: message,
//         qry: req.query,
//         data: data,
//     });
   
// });

async function getValidPosts(region, prevPostId) {
    let nrPostsToReturn = 0; //15

    let resData = []
    let currentNrOfPosts = 0;
    /* eslint-disable no-await-in-loop */
    do {
        let returnedData = await getMorePostsHelper(region, prevPostId);
        nrPostsToReturn += 1
        console.log(`returnedData + ${nrPostsToReturn}`, returnedData);

        returnedStatus = returnedData.status;
        if (returnedStatus === 'failure') {
            broke = "it did break";
            break;
        }

        returnedPosts = returnedData.data;

        resData.push(...returnedPosts);

        prevPostId = resData[resData.length - 1]
        prevPostId = prevPostId.postId

        currentNrOfPosts += resData.length;
    } while (currentNrOfPosts < 5);
    /* eslint-enable no-await-in-loop */

    return { message: "OK", validPosts: resData};

}

async function getMorePostsHelper(region, prevPostId){
    console.log("ENTERED:");
    let resData = {"status": "failure", "data": []}

    const regionSnapshot = await admin.database().ref('/regions/').child(region).orderByKey().startAt(prevPostId).limitToFirst(3).once('value');
    let postsIdsJSON = regionSnapshot.val();
    if(postsIdsJSON === null || postsIdsJSON === undefined) 
        return resData;

    let postsIdsArray = [];
    for(let id in postsIdsJSON){
        postsIdsArray.push(id);
    }
    postsIdsArray = postsIdsArray.filter(id => id !==prevPostId);
    if(postsIdsArray.length === 0)
        return resData;

    prevPostId = postsIdsArray[postsIdsArray.length - 1]

    let promises = []
    for(id of postsIdsArray){
        promises.push(admin.database().ref('/posts/').child(id).once('value'));
    }
    
    console.log("postsIdsArray", postsIdsArray);

    await Promise.all(promises).then(values => {
        let posts = JSON.parse(JSON.stringify(values))
        posts.forEach((post, index) =>  {
            post["postId"] = postsIdsArray[index]
            //console.log("Accessed field .nrDays:",post.nrDays);
            resData.data.push(post)
        })
        return;
    }).catch(err => console.log(err));

    resData.status = "success";
    console.log("EXIT 2:", resData);
    
    return resData;
}

exports.getMorePosts = functions.https.onRequest(async (req, res) => {
    let region = req.query.region;
    let prevPostId = req.query.prevPostId;
    
    let postsData = await getValidPosts(region, prevPostId); 

    let message = "no-posts";
    if(postsData.validPosts.length !== 0) { message = "ok"; }
    
    return res.status(200).json({
        version: "getMorePosts 3",
        message: message,
        posts: postsData.validPosts,
    });

});

exports.getFirstPosts = functions.https.onRequest(async (req, res) => {
    let dbRef = admin.database().ref();
    let region = req.query.region;

    return dbRef.child('/regions/').child(region)
        .limitToFirst(1)
        .once('value')
        .then(async (snapshot) => {
            let data = snapshot.val();
            let message = "empty"

            if(data === null || data === undefined) { 
                message = "No-posts-in-region"
            }else{
                message = "success"
            }
            console.log(data);

            let firstPostId = Object.keys(data)[0]
        
            return dbRef.child('/posts').child(firstPostId).once('value')
                .then(async (snapshot) => {
                    let postsData = await getValidPosts(region, firstPostId);

                    return res.status(200).json({
                        version: "update 5",
                        message: message,
                        data: data,
                        post: snapshot.val(),
                        posts: postsData.validPosts,
                    });
                });
        
        });
});

exports.addMessage = functions.https.onRequest(async (req, res) => {
    const original = req.query.text;

    const snapshot = await admin.database().ref('/messages').push({original: original});
    // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
    return res.status(200).json({
              message: '[S] getMorePosts',
              snapshot: snapshot,
              original: original,
          });
  });

// exports.dummyFunction = functions.https.onRequest((req, res) => {
//     var type = "nuf";
//     if(req.query.prevPostId instanceof String) 
//         type = "truee";
//     else type = "falsee";
//     if(typeof req.query.prevPostId === 'string') 
//         type = "truee";
//     else type = "falsee";

//     return res.status(200).json({
//         message: '[S] getMorePosts',
//         qry: req.query,
//         prevPostId: req.query.prevPostId,
//         prevPostIdIsString: type
//     });
// });

// Listens for new messages added to /messages/:pushId/original and creates an
// uppercase version of the message to /messages/:pushId/uppercase
exports.makeUppercase = functions.database
    .ref('/messages/{pushId}/original')
    .onCreate((snapshot, context) => {
      // Grab the current value of what was written to the Realtime Database.
      const original = snapshot.val();
      console.log('Uppercasing', context.params.pushId, original);
      const uppercase = original.toUpperCase();
      // You must return a Promise when performing asynchronous tasks inside a Functions such as
      // writing to the Firebase Realtime Database.
      // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
      return snapshot.ref.parent.child('uppercase').set(uppercase);
    });


// Listens for new posts added to /posts/:postId and creates an
// entry with postId under /regions/r_{x}/ 
exports.addPostToRegion = functions.database
    .ref('/posts/{pushId}')
    .onCreate((snapshot, context) => {
        const original = snapshot.val();
        console.log("Data is:",original);
        console.log("Context.resouce is:", context.resource);
        console.log("Context.params is:", context.params);

        const postID = context.params.pushId;
        let regionData = {
            [postID]:1
        }
        return snapshot.ref.parent.parent.child('regions').child('r_10').set({[postID] : 1});
    });