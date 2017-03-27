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
    FirebaseAPI.getGamesWithKey(profile.uid, (games) => {
      if(games == [] || games.length < 3) {
        const gameWithUser = games.map((game) => {
          const gameID = game.id

          if(gameID.split('-').some((uid) => {return uid == user.uid}) && gameID.split('-').some((uid) => {return uid == profile.uid}))
            return game
        })[0]

        if(gameWithUser == null)
          func(profile)
      }
    })
  }
}

export const filterWithPreferences = (profile, user) => {
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

    return false
}