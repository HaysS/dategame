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

  if(!isUser)
    FirebaseAPI.getGameWithKey(profile.uid, (gameID) => {
      if(gameID == null)
        func(filterWithPreferences(profile, user))
    })
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