import * as _ from 'lodash'
import moment from 'moment'

import * as FirebaseAPI from './firebaseAPI'

export const filterProfile = (profile, user, func) => {
  let counter = 0 

  // console.log("Profile:")
  // console.log(profile)
  
  const isUser = profile.uid != null ? user.uid === profile.uid : false

  if(!isUser && profile.isSearchingForGame) {
    FirebaseAPI.getMatches(user.uid, (profiles) => {
      if(profiles == null || profiles.some((matchedProfile) => {return profile.uid == matchedProfile.uid}) == false) {
        if(user.gender == 'male') {
          FirebaseAPI.getGamesWithKey(profile.uid, (games) => {
            if(games == [] || games.length <= 3) {
              const gameWithUser = profile.gender == 'female' ? games.map((game) => {
                const gameID = game.id

                if(gameID.split('-').some((uid) => {return uid == user.uid}) && gameID.split('-').some((uid) => {return uid == profile.uid}))
                  return game
              }).filter((game) => {return game != null})[0] : null

              if(gameWithUser == null)
                func(profile)
            }
          })
        } else if(user.gender == 'female' && profile.gender != 'female') {
          FirebaseAPI.getGamesWithKey(profile.uid, (games) => {
            if(games == [] || games.length <= 3) {
              const gameWithUser = games.map((game) => {
                const gameID = game.id

                if(gameID.split('-').some((uid) => {return uid == user.uid}) && gameID.split('-').some((uid) => {return uid == profile.uid}))
                  return game
                else
                  return null
              }).filter((game) => {return game != null})

              if(gameWithUser[0] == null)
                func(profile)
            }
          })
        }
      }
    })
  }
}

export const filterWithPreferences = (profiles, user) => {
  let needsMale = user.needsMale
  let needsFemale = user.needsFemale
  let counter = 0

  // if (user.gender == 'male') {

  //   const femaleProfile = profiles.find((profile) => {return profile.gender == 'female'})

  //   let maleProfile = null

  //   profiles.filter((profile) => {return profile.gender == 'male'})
  //     .find((profile) => {
  //       let isMatched = false
  //       FirebaseAPI.getMatches(profile.uid, (maleMatches) => {
  //         if(maleMatches == null || maleMatches.some((matchedProfile) => {return femaleProfile.uid == matchedProfile.uid}) == false) {
  //           maleProfile = profile
  //           console.log('aadfasfsadasdfasdfs')
  //           console.log(maleProfile)
  //         }
  //       })

  //       console.log('maleProfils::::::')
  //       console.log(maleProfile)
  //   })
  // }

  const filteredProfiles = profiles.map((profile) => {
      if(user.gender == 'female')
        if(needsMale && profile.gender == 'male') {
          counter++

          if(counter >= 2)
            needsMale = false

          return profile
        }

      if (user.gender == 'male') {
        if(needsFemale && profile.gender == 'female') {
          needsFemale = false

          return profile
        }

        if(needsMale && profile.gender == 'male') {
          needsMale = false

          return profile
        }

        
      }

    return false
  }).filter((profile) => {return profile != false})

  return filteredProfiles
}