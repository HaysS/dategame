import * as _ from 'lodash'
import moment from 'moment'

import * as FirebaseAPI from './firebaseAPI'

export default filterProfiles = (profiles, user) => {
  const uniqueProfiles = _.uniqBy(profiles, 'uid') //get unique profiles

  let passedFemaleProfile = false
  let passedMaleProfile = false
  let counter = 0
  const filteredProfiles = uniqueProfiles.filter((profile) => {
    // console.log("Profile:")
    // console.log(profile)
    
    const isUser = profile.uid != null ? user.uid === profile.uid : false

    return (
      !isUser
    )
  }).map((profile, index) => {
    FirebaseAPI.getGameWithKey(profile.uid, (gameID) => {
      console.log(gameID)
    })

    if(user.gender == 'female' && counter <= 2 && profile.gender == 'male') {
      counter++
      return profile
    }

    if (user.gender == 'male' && !passedMaleProfile && profile.gender == 'male') {
      passedMaleProfile = true
      return profile
    }

    if(user.gender == 'male' && !passedFemaleProfile && profile.gender == 'female') {
      passedFemaleProfile = true
      return profile
    } 
  })

  return filteredProfiles.filter((profile) => {return (profile != undefined)})
}