import * as _ from 'lodash'
import moment from 'moment'

import * as FirebaseAPI from './firebaseAPI'

export default filterProfile = (profile, user, func) => {
  let passedFemaleProfile = false
  let passedMaleProfile = false
  let counter = 0 

  // console.log("Profile:")
  // console.log(profile)
  
  const isUser = profile.uid != null ? user.uid === profile.uid : false

  if(!isUser) {
    let games = []

    FirebaseAPI.getGamesWithKey(profile.uid, (game) => {
      if(game == null)
        games.push(game)
    }) 

    //If user is in 3 games or less, continue
    if(games.length <= 3)
      func(filterWithPreferences(profile, user))
  }
    
}


const filterWithPreferences = (profile, user) => {
    if(user.gender == 'female' && profile.gender == 'male') {
      return profile
    }

    if (user.gender == 'male') {
      if(user.needsMale && profile.gender == 'male') {
        FirebaseAPI.updateUser(user.uid, 'needsMale', false)
        return profile
      }

      if(user.needsFemale && profile.gender == 'female') {
        FirebaseAPI.updateUser(user.uid, 'needsFemale', false)
        return profile
      }
    }
}