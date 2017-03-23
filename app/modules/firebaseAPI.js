import * as firebase from 'firebase';
import GeoFire from 'geofire'
import * as _ from 'lodash'
import Exponent from 'exponent';

export const loginUser = (accessToken) => {
    const provider = firebase.auth.FacebookAuthProvider //declare fb provider
    const credential = provider.credential(accessToken) //generate fb credential
    return firebase.auth().signInWithCredential(credential) // signin to firebase using facebook credential
}

export const logoutUser = () => {
  return firebase.auth().signOut()
}

export const updateUser = (uid, key, value) => {
  firebase.database().ref().child('users').child(uid)
    .update({[key]:value})
}

export const getQuestions = (func) => {
  firebase.database().ref().child('questions').once('value', (snap) => {
    if (snap.val()) {
      const questions = snap.val().slice(0, 4)
      func(questions)
    }})  
}

export const getQuestion = (idString, func) => {
  firebase.database().ref().child('questions').child(idString).once('value', 
    (snap) => { 
      if(snap.val())
        func(snap.val())
    })
}

export const mergeUser = (uid, newData) => {
  console.log('newData', newData)
  watchUserLocationDemo(uid)
  const firebaseRefAtUID = firebase.database().ref().child('users/'+uid)
  return firebaseRefAtUID.once("value").then((snap) => {
    const defaults = {
        maxDistance: 5,
        ageRange: [18,24],
        uid: uid,
        birthday: "01/01/1992",
        bio: 'App Developer',
        selectedQuestion: '-1',
    }
    const current = snap.val()
    const mergedUser = {...defaults, ...current, ...newData}
    firebaseRefAtUID.update(mergedUser)
  })  
}

export const unlikeProfile = (userUid, profileUid) => {
  firebase.database().ref().child('relationships').child(userUid).child('liked')
  .child(profileUid).set(false)
}

export const matchProfile = (userUid, profileUid) => {
  firebase.database().ref().child('relationships').child(userUid).child('matches')
    .child(profileUid).set(true)
  firebase.database().ref().child('relationships').child(profileUid).child('matches')
    .child(userUid).set(true)
}

export const getMatches = (key, func) => {
  firebase.database().ref().child('relationships/'+key).child('matches').once('value')
    .then((snap) => {
      if(snap.val() != null)
        Object.keys(snap.val()).map((key) => {
          getUser(key).then((user) => {func(user)})})})
   
}

export const getUser = (key) => {
  return firebase.database().ref().child('users').child(key).once('value')
    .then((snap) => snap.val())
}

export const getUserCb = (key, func) => {
  firebase.database().ref().child('users').child(key).once('value')
    .then((snap) => func(snap.val()))
}


export const getGame = (key, func) => {
   firebase.database().ref().child('games').child(key).once('value')
    .then((snap) => {
      if(snap.val() != null)
        func(snap.val())
    })
}

export const deleteGame = (key) => {
  //firebase.database().ref().child('games').child(key).remove()
  console.log('remove game')
}

//Returns the first game with the given uid
export const getGameWithKey = (key, func) => {
  firebase.database().ref().child('games').once('value')
    .then((snap) => {
      if(snap.val() != null)
        func(Object.keys(snap.val()).find((gameID) => { //Returns true if there is a gameID with this key in the string
          return gameID.split('-').some((uid) => {
            return uid == key
            })
        }))
    })
}

//Returns the first game with the given uid
export const getGamesWithKey = (key, func) => {
  firebase.database().ref().child('games').once('value')
    .then((snap) => {
      if(snap.val() != null)
        Object.keys(snap.val()).map((game) => {
          if(game != undefined) {
            if(game.split('-').some((uid) => {return uid == key}))
              getGame(game, func)       
          }
        })
    })
}

export const watchUser = (key, func) => {
  firebase.database().ref().child('users/'+key).on('value', (snap) => {
    func(snap.val())
  })
}

export const removeWatchUser = (key) => {
  firebase.database().ref().child('users/'+key).off()
}

export const watchMatches = (key, func) => {
  if(firebase.database().ref().child('relationships/'+key).child('matches').once('value', (snap) => {return snap.val() == undefined})) {
    firebase.database().ref().child('relationships/'+key).child('matches').on('value', (snap) => {
      func(snap.val())
    })
  }
}

export const checkMatches = (key, func) => {
  firebase.database().ref().child('relationships/'+key).child('matches').once('value', (snap) => {
    if(snap.val() != undefined)
      func(snap.val())
    else
      func(null)})
}

export const removeMatchesWatcher = (key) => {
  firebase.database().ref().child('relationships/'+key).child('matches').off()
}

export const watchUserLocation = (key) => {
  const firebaseRef = firebase.database().ref()
  const geoFire = new GeoFire(firebaseRef.child('geoData/'))
  const options ={
    enableHighAccuracy:false,
    timeInterval:100000,
    distanceInterval: 3000
  }
  Exponent.Location.watchPositionAsync(options,(pos)=>{
    const {latitude,longitude} = pos.coords
    geoFire.set(key, [latitude,longitude]).then(() => {
        // console.log("Key has been added to GeoFire");
      }, (error) => {
        // console.log("Error: " + error);
      })
  })
}
export const watchUserLocationDemo = (key) => {
  const firebaseRef = firebase.database().ref()
  const geoFire = new GeoFire(firebaseRef.child('geoData/'))
  const lat = -26.2041028
  const lon = 28.0473051
  geoFire.set(key, [lat, lon]).then(() => {
      // console.log("Key has been added to GeoFire");
    }, (error) => {
      // console.log("Error: " + error);
    })
}

export const findProfiles = (user, func) => {
  const firebaseRef = firebase.database().ref()
  const geoFire = new GeoFire(firebaseRef.child('geoData/'))
  geoFire.get(user.uid).then(location => {    
    const geoQuery = geoFire.query({
      center: location,
      radius: user.maxDistance
    })
    geoQuery.on("ready", (res) => { // loaded geodata
      geoQuery.cancel()
    })

    //This will return the GeoCallbackRegistration so that it can be use to cancel the listener later
    geoQuery.on("key_entered", (key, location, distance) => {
      // console.log(key + " entered query at " + location + " (" + distance + " km from center)");
      getUser(key).then(func).then((bool) => {if(bool) {
        //console.log('cancelled geoquery')
        geoQuery.cancel()}})
    })
  }) 
}

