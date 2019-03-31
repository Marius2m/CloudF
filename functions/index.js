const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const admin = require('firebase-admin');
admin.initializeApp();

exports.getFirstPosts = functions.https.onRequest((req, res) => {
    return admin.database().ref('/regions/').child(req.query.region)
        .limitToFirst(2)
        .once('value')
        .then((snapshot) => {
            let data = snapshot.val();
            let message = "empty"

            if(data === null || data === undefined) { 
                message = "No-posts-in-region"
            }else{
                message = "success"
            }
            console.log(data);
            return res.status(200).send.json({
                version: "check if data is null",
                message: message,
                qry: req.query,
                data: data,
            });
        });
});


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
    let nrPostsToReturn = 0; //15
    let region = req.query.region;
    let prevPostId = req.query.prevPostId;
    let resData = []
    
    let broke = "it didnt";
    let currentNrOfPosts = 0;
    /* eslint-disable no-await-in-loop */
    do{
        let returnedData = await getMorePostsHelper(region, prevPostId);
        nrPostsToReturn += 1
        console.log(`returnedData + ${nrPostsToReturn}`, returnedData);

        returnedStatus = returnedData.status;
        if(returnedStatus === 'failure') {
            console.log("BROKE"); 
            broke = "it did break";
            break;
        }

        returnedPosts = returnedData.data;

        resData.push(...returnedPosts);
      
        prevPostId = resData[resData.length-1]
        prevPostId = prevPostId.postId

        currentNrOfPosts += resData.length;
    }while(currentNrOfPosts < 5);
    /* eslint-enable no-await-in-loop */
    console.log("BROKE STATUS: ",broke);

    let message = "no-more-posts-in-region";
    if(resData.length !== 0) { message = "OK"; }
    return res.status(200).json({
        version: "Nr Days",
        message: message,
        resData: resData,
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