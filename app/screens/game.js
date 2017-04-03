import React, {Component} from 'react';
import {
  Animated,
  Alert,
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity, 
  Dimensions,
  InteractionManager,
  ActivityIndicator
} from 'react-native'

import Header from '../components/header'
import Matching from '../components/matching'
import Chat from '../components/chat'


import {Router} from '../../app'
import * as firebase from 'firebase'
import * as FirebaseAPI from '../modules/firebaseAPI'

const {height, width} = Dimensions.get('window');

export default class Game extends Component {
  static route = {
    styles: {
      gestures: null,
    },
  };
  
  componentWillMount() {
    this.state = { 
        game: {},
        user: this.props.user,
        profiles: [],
        matchedProfile: null,
        question: '',
        gameStatus: '',
        matchedUid: '',
        foundProfiles: false,
        chatMounted: false,
        malesReachedMax: false,
        interactionsComplete: false,
    }

    if(this.state.user.gender == 'male') {  
      FirebaseAPI.updateUser(this.state.user.uid, 'needsFemale', true)
      FirebaseAPI.updateUser(this.state.user.uid, 'needsMale', true)
    }
    else if(this.state.user.gender == 'female') {
      FirebaseAPI.updateUser(this.state.user.uid, 'needsFemale', false)
      FirebaseAPI.updateUser(this.state.user.uid, 'needsMale', true)
    }

    if(this.props.game != null && this.props.game != undefined) {      
      this.props.game.id.split('-').map((uid) => {
        if(uid != this.state.user.uid){
          FirebaseAPI.getUserCb(uid, (profile) => {
            if(!this.state.foundProfiles && this.state.gameStatus != 'loadingProfiles') 
              this.setState({gameStatus: 'loadingProfiles'})

            if(this.state.profiles.length == 1) //If there are still less than 2 profiles after filtering
              this.setState({profiles: [...this.state.profiles, profile], foundProfiles: true, game: this.props.game}) 

            if(this.state.profiles.length < 1)
              this.setState({profiles: [...this.state.profiles, profile]})            
             
          })
        }
      })
    } else {
      FirebaseAPI.watchUserLocationDemo(this.state.user.uid)
      FirebaseAPI.findProfiles(this.state.user, (profiles) => {
        if(profiles == 'timedOut') {
          this.setState({gameStatus: 'returnToMenu'})
        }

        if(this.state.gameStatus == '')
          this.setState({gameStatus: 'startingProfilesSearch'})

        if(!this.state.foundProfiles) {
          this.setState({gameStatus: 'loadingNewProfile'})

          if(profiles != null && profiles != 'timedOut' && profiles.length == 2) {
            if(this.state.profiles.length == 0)  {//If there are still less than 2 profiles after filtering
              this.setState({profiles: profiles, foundProfiles: true, gameStatus: 'loadedNewProfiles'}) 
            }             
          }
        }
      })
    }
  }

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.setState({interactionsComplete: true})
    })
  }

  componentWillUnmount() {
    if(this.state.foundProfiles)  {
      const femaleProfile = this.state.user.gender == 'female' ? this.state.user : this.state.profiles.find((profile) => {return profile != null ? profile.gender == 'female' : null})
      const femaleProfileInGame = this.state.game.profilesInfo.find((profile) => {
        return profile.gender == 'female'
      })

      if(femaleProfile != null) {
        FirebaseAPI.removeMatchesWatcher(femaleProfile.uid)
        firebase.database().ref().child('games/'+this.state.game.id).child('profilesInfo/'+this.state.game.profilesInfo.indexOf(femaleProfileInGame)).off()
      }
    }
  }


  componentWillUpdate() {
    if(this.state.gameStatus == 'returnToMenu') {
      Alert.alert('We\'re finding people for a new game! It will appear in the "Play Games" section once it has begun.')
      this.props.navigator.replace(Router.getRoute('menu', {user: this.state.user}))
    }
  }

  componentDidUpdate() {
    if(this.state.gameStatus == 'hasBeenMatched' && this.state.interactionsComplete) {
      this.props.navigator.replace(Router.getRoute('match', {user: this.state.user, profile: this.state.matchedProfile}))
      FirebaseAPI.deleteGame(this.state.game.id)
    } else if(this.state.gameStatus == 'notChosen' && this.state.interactionsComplete) {
      this.props.navigator.replace(Router.getRoute('menu', {user: this.state.user}))    
      FirebaseAPI.deleteGame(this.state.game.id)
    }

    if(this.state.foundProfiles && this.state.gameStatus == 'loadedNewProfiles')
      this.setState({gameStatus: 'foundProfilesForNewGame'})  
    else if(this.state.foundProfiles && this.state.gameStatus == 'loadingProfiles')
      this.setState({gameStatus: 'startingGame'})   


    if(this.state.gameStatus == 'foundProfilesForNewGame') {
      this.createGame()
    }


    if(this.state.gameStatus == 'startingGame' || (this.state.gameStatus == 'foundProfilesForNewGame' && this.state.game.id != null)) {
      firebase.database().ref().child('games/'+this.state.game.id).off()

      if(this.state.question == '')
        this.watchForQuestion()

      if(!this.state.malesReachedMax)
        this.watchForMaxMessages() 

      this.watchForMatch()
    }

    if(this.state.gameStatus == 'hasDecision')
      this.checkForEndGame()

    if(this.state.gameStatus == 'endingGame') 
      this.endGame()
  } 

  createGame() {
    const profileArray = [...this.state.profiles, this.props.user]
    console.log(profileArray)
    const maleProfiles = profileArray.filter((profile) => { return profile.gender == 'male'})
    const femaleProfile = profileArray.find((profile) => {return profile.gender == 'female'})

    const profileInfoArray = [{'name': maleProfiles[0].first_name, 'uid': maleProfiles[0].uid, 'gender': maleProfiles[0].gender, 'viewedEndGame': false}, 
                              {'name': maleProfiles[1].first_name, 'uid': maleProfiles[1].uid, 'gender': maleProfiles[1].gender, 'viewedEndGame': false}, 
                              {'name': femaleProfile.first_name, 'uid': femaleProfile.uid, 'gender': femaleProfile.gender, 'viewedEndGame': false, 'selectedQuestion': -1}].sort((a, b) => {
                                return a.uid.localeCompare(b.uid)
                              })

    //Sort uid concatenation in order of greatness so every user links to the same chat
    const uidArray = profileInfoArray.map((profile) => {return profile.uid})

    uidArray.sort()
    const gameID = uidArray[0]+'-'+uidArray[1]+'-'+uidArray[2]

    firebase.database().ref().child('games/'+gameID).update({'id': gameID, 'profilesInfo': profileInfoArray})
    uidArray.forEach((uid) => {
      FirebaseAPI.updateUser(uid, 'isSearchingForGame', false)
    })

    FirebaseAPI.getGame(gameID, (game) => {
      FirebaseAPI.getUserCb(this.state.user.uid, (user) => {
        this.setState({game: game, gameStatus: 'startingGame', user: user})
      })
    })
  }

  checkForEndGame() {
    if(this.state.foundProfiles) {
      if(this.state.gameStatus == 'hasDecision') {
        const femaleProfile = this.state.user.gender == 'female' ? this.state.user : this.state.profiles.find((profile) => {return profile != null ? profile.gender == 'female' : null})
        const femaleProfileInGame = this.state.game.profilesInfo.find((profile) => {
          return profile.gender == 'female'
        })

        firebase.database().ref().child('games/'+this.state.game.id).child('profilesInfo/'+this.state.game.profilesInfo.indexOf(femaleProfileInGame)).off()
        FirebaseAPI.removeMatchesWatcher(femaleProfile.uid)
        firebase.database().ref().child('games/'+this.state.game.id).child('messages').off()

        this.setState({'gameStatus': 'endingGame'})
      }
    }
  }

  watchForQuestion() {
    const user = this.state.user
    const femaleProfile = user.gender != 'female' ? this.state.profiles.find((profile) => {return profile.gender == 'female'}) : user
    const femaleProfileInGame = this.state.game.profilesInfo.find((profile) => {
      return profile.gender == 'female'
    })

    if(femaleProfile != null) {
      firebase.database().ref().child('games/'+this.state.game.id).child('profilesInfo/'+this.state.game.profilesInfo.indexOf(femaleProfileInGame)).off()
      firebase.database().ref().child('games/'+this.state.game.id).child('profilesInfo/'+this.state.game.profilesInfo.indexOf(femaleProfileInGame)).on('value', (snap) => {
        this.setState({gameStatus: 'watchingForQuestion'})

        if(snap.val() != null && snap.val().selectedQuestion != -1) {
          FirebaseAPI.getQuestion(snap.val().selectedQuestion, (question) => {
            FirebaseAPI.getGame(this.state.game.id, (game) => {
              if(game.id != null && this.state.gameStatus == 'watchingForQuestion') 
              {
                this.setState({gameStatus: 'hasQuestion', question: question.text, game: game})
              }
            })
          })
        } else if(this.state.gameStatus == 'watchingForQuestion')
          this.setState({gameStatus: 'noQuestion'})
      })
    }
  }

  watchForMatch() {
    const femaleProfileInGame = this.state.game.profilesInfo.find((profile) => {
      return profile.gender == 'female'
    })

    if(this.state.user.gender == 'male') {
          const femaleProfile = this.state.profiles.find((profile) => {return profile.gender == 'female'})
          const maleProfile = this.state.profiles.find((profile) => {return profile.gender == 'male'})

          FirebaseAPI.removeMatchesWatcher(femaleProfile.uid)

          FirebaseAPI.watchMatches(femaleProfile.uid, (matches) => {
            if(matches != null) { 
              const matchUids = Object.keys(matches)

              if(matchUids.some((uid) => {return this.state.user.uid == uid})) {
                firebase.database().ref().child('games/'+this.state.game.id).child('profilesInfo/'+this.state.game.profilesInfo.indexOf(femaleProfileInGame)).off()
                this.setState({'matchedUid': this.state.user.uid, 'gameStatus': 'hasDecision'})
              }
              else if(matchUids.some((uid) => {return maleProfile.uid == uid})){
                firebase.database().ref().child('games/'+this.state.game.id).child('profilesInfo/'+this.state.game.profilesInfo.indexOf(femaleProfileInGame)).off()
                this.setState({'matchedUid': maleProfile.uid, 'gameStatus': 'hasDecision'})
              }
            }
          }) 
    } else if(this.state.user.gender == 'female') {
      maleProfiles = this.state.profiles

      FirebaseAPI.removeMatchesWatcher(this.state.user.uid)

      FirebaseAPI.watchMatches(this.state.user.uid, (matches) => {
        if(matches != null) {
          if(matches[maleProfiles[0].uid] || matches[maleProfiles[1].uid]) {
            firebase.database().ref().child('games/'+this.state.game.id).child('profilesInfo/'+this.state.game.profilesInfo.indexOf(femaleProfileInGame)).off()
            this.setState({'matchedUid': this.state.user.uid, 'gameStatus': 'hasDecision'})
          }
        }
      })
    }
  }

  watchForMaxMessages() {
      const gameID = this.state.game.id

      firebase.database().ref().child('games/'+gameID).child('messages').off()
      firebase.database().ref().child('games/'+gameID).child('messages')
        .on('value', (snap) => {
        let messages = []
        snap.forEach((child) => {
          messages.push({
            user: {
              _id: child.val().sender,
            }
          })
        })

        if(this.state.user.gender == 'female') {
          const maleProfiles = this.state.profiles.filter((profile) => {return profile.gender == 'male'})


          if(messages.filter((m) => {return m.user._id === maleProfiles[0].uid}).length >= 5 && messages.filter((m) => {return m.user._id === maleProfiles[1].uid}).length >= 5)
            this.setState({malesReachedMax: true})
        } else if(this.state.user.gender == 'male') {
          const maleProfiles = [this.state.profiles.find((profile) => {return profile.gender == 'male'}), this.state.user]

          if(messages.filter((m) => {return m.user._id === maleProfiles[0].uid}).length >= 5 && messages.filter((m) => {return m.user._id === maleProfiles[1].uid}).length >= 5)
            this.setState({malesReachedMax: true})
        }
      })
  }
  
  endGame() {
    const userInGame = this.state.game.profilesInfo.find((profile) => {
          return profile.uid == this.state.user.uid
        })

    firebase.database().ref().child('games/'+this.state.game.id).child('profilesInfo/'+this.state.game.profilesInfo.indexOf(userInGame)).update({['viewedEndGame']:true})

    if(this.state.user.gender == 'male') {
      const femaleProfile = this.state.profiles.find((profile) => {return profile.gender == 'female'})
      const maleProfile = this.state.profiles.find((profile) => {return profile.gender == 'male'})

      FirebaseAPI.checkMatches(femaleProfile.uid, (matches) => {
        if(matches != null) { 
          this.setState({gameStatus: 'checkingMatches'})
          const matchUids = Object.keys(matches)

          console.log('ending game!!!!')

          if(matchUids.some((uid) => {return this.state.user.uid == uid})) {
            this.setState({gameStatus: 'hasBeenMatched', matchedProfile: femaleProfile})
          } else if(matchUids.some((uid) => {return maleProfile.uid == uid})) {
            Alert.alert('You were not chosen. Keep playing, you will get it eventually!')
            this.setState({gameStatus: 'notChosen'})
          } 
        }
      })
    } else if(this.state.user.gender == 'female') {
            maleProfiles = this.state.profiles

            FirebaseAPI.checkMatches(this.state.user.uid, (matches) => {
              if(matches != null) 
                this.setState({gameStatus: 'checkingMatches'})
                if(matches[maleProfiles[0].uid])
                  this.setState({gameStatus: 'hasBeenMatched', matchedProfile: maleProfiles[0]})
                else if(matches[maleProfiles[1].uid])
                  this.setState({gameStatus: 'hasBeenMatched', matchedProfile: maleProfiles[1]})
            })
      }
  }

  showMenu () {
      return(
        <TouchableOpacity style={{justifyContent: 'flex-start', alignItems:'center'}} onPress={() => {
          if(this.state.chatMounted || this.state.gameStatus == 'newProfileLoaded' || this.state.gameStatus == 'startingProfilesSearch')
            this.props.navigator.replace(Router.getRoute('menu', {user: this.state.user}))}}>
          <Text style={{marginTop: 10, marginBottom: 20, fontSize: 40}}>Menu</Text>
        </TouchableOpacity>
      )
  }

  showFemaleTouchable() {
    const femaleProfile = this.state.user.gender != 'female' ? this.state.profiles.find((profile) => {return (profile.gender == 'female')}) : this.state.user

    return(
      <TouchableOpacity style={{height:height/8+5, borderBottomWidth: 3, borderColor: 'gray', backgroundColor: 'white'}}
        onPress={() => {
          if(this.state.chatMounted || this.state.gameStatus == 'newProfileLoaded' || this.state.gameStatus == 'startingProfilesSearch') 
            this.props.navigator.push(Router.getRoute('profile', {profile: femaleProfile}))}}>
        <Header facebookID={femaleProfile.id} />
      </TouchableOpacity>
    )
  }

  showMaleTouchables() {

    if(this.state.user.gender == 'male') {
    const maleProfile = this.state.profiles.find((profile) => {return profile.gender == 'male'})
    const femaleProfile = this.state.profiles.find((profile) => {return profile.gender == 'female'})

    return(
      <View style={{flexDirection: 'row', justifyContent: 'center',}}>
        <TouchableOpacity style={styles.nameHeader} onPress={() => {
          if(this.state.chatMounted || this.state.gameStatus == 'newProfileLoaded' || this.state.gameStatus == 'startingProfilesSearch')
            this.props.navigator.push(Router.getRoute('profile', {profile: this.props.user}))}}>
          <Text style={styles.name}>{this.state.user.first_name}</Text>
        </TouchableOpacity>
        <View style={styles.nameHeaderPipe}><Text style={styles.name}> | </Text></View>
        <TouchableOpacity style={styles.nameHeader} onPress={() => {
          if(this.state.chatMounted || this.state.gameStatus == 'newProfileLoaded' || this.state.gameStatus == 'startingProfilesSearch')
            this.props.navigator.push(Router.getRoute('profile', {profile: maleProfile}))}}>
          <Text style={styles.name}>{maleProfile.first_name}</Text>
        </TouchableOpacity>
      </View>
      )
  } else if(this.state.user.gender == 'female') {
    const leftProfile = this.state.profiles[0]
    const rightProfile = this.state.profiles[1]
    
    return(
      <View style={{flexDirection: 'row', justifyContent: 'center',}}>
        <TouchableOpacity style={styles.nameHeader} onPress={() => {
          if(this.state.chatMounted || this.state.gameStatus == 'newProfileLoaded' || this.state.gameStatus == 'startingProfilesSearch')
            this.props.navigator.push(Router.getRoute('profile', {profile: leftProfile}))}}>
          <Text style={styles.name}>{leftProfile.first_name}</Text>
        </TouchableOpacity>
        <View style={styles.nameHeaderPipe}><Text style={styles.name}> | </Text></View>
        <TouchableOpacity style={styles.nameHeader} onPress={() => {
          if(this.state.chatMounted || this.state.gameStatus == 'newProfileLoaded' || this.state.gameStatus == 'startingProfilesSearch')
            this.props.navigator.push(Router.getRoute('profile', {profile: rightProfile}))}}>
          <Text style={styles.name}>{rightProfile.first_name}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return(<View />)
}

  chatCallback() {
    console.log('chatCallback')
    if(!this.state.chatMounted)
      this.setState({chatMounted: true})
  }

  showPrompt() {
    const {user} = this.state

    if(this.state.gameStatus == 'hasQuestion') {
        const femaleProfileInGame = this.state.game.profilesInfo.find((profile) => {
          return profile.gender == 'female'
        })

        firebase.database().ref().child('games/'+this.state.game.id).child('profilesInfo/'+this.state.game.profilesInfo.indexOf(femaleProfileInGame)).off()
      }

    if(user.gender == 'male') {
      const profile = this.state.profiles.find((profile) => {return profile.gender == 'female'})

      if(this.state.gameStatus == 'noQuestion')
        return(<View style={{flex: 6}}><View style={{flex: 1}}><Text style={styles.promptText}>A Question is Being Chosen...</Text></View><View style={{flex: 5}}>{this.showChat()}</View></View>)
      else(this.state.gameStatus == 'hasQuestion')
        return(<View style={{flex: 6}}><View style={{flex: 1}}><Text style={styles.promptText}>{this.state.question}</Text></View><View style={{flex: 5}}>{this.showChat()}</View></View>)
    } else if(user.gender == 'female' && this.state.malesReachedMax) {
      profiles = this.state.profiles

      return(<View style={{flex: 6}}><View style={{flex: 1}}><TouchableOpacity style={styles.promptTouchable} 
              onPress={() => {this.props.navigator.push(Router.getRoute('matchDecision', {user: user, topProfile: profiles[0], bottomProfile: profiles[1]}))}}>
                <Text style={styles.promptText}>Messages have run out. Make a Decision</Text></TouchableOpacity></View>
                <View style={{flex: 5}}>{this.showChat()}</View>
              </View>)
      } else if(user.gender == 'female' && this.state.gameStatus == 'hasQuestion') {
        return(<View style={{flex: 6}}><View style={{flex: 1}}><Text style={styles.promptText}>{this.state.question}</Text></View><View style={{flex: 5}}>{this.showChat()}</View></View>)
      } else if (user.gender == 'female' && this.state.gameStatus == 'noQuestion') {
        return(<View style={{flex: 6}}><View style={{flex: 1}}><TouchableOpacity style={styles.promptTouchable} 
              onPress={() => {this.props.navigator.push(Router.getRoute('questions', {user: user, game: this.state.game}))}}>
                <Text style={styles.promptText}>Ask Question</Text></TouchableOpacity></View>
                <View style={{flex: 5}}>{this.showChat()}</View>
              </View>)
      }
  }

  showChat() {
    if(this.state.user.gender == 'male') {
      const maleProfile = this.state.profiles.find((profile) => {return profile.gender == 'male'})
      const femaleProfile = this.state.profiles.find((profile) => {return profile.gender == 'female'})

      return(<View style={styles.container}>
                {this.showMaleTouchables()}
                <Chat callback={() => {this.chatCallback()}} gameID={this.state.game.id} user={this.state.user} firstProfile={maleProfile} secondProfile={femaleProfile} />
              </View>)
    } else if(this.state.user.gender == 'female') {
      const leftProfile = this.state.profiles[0]
      const rightProfile = this.state.profiles[1]
      
      return(<View style={styles.container}>
              {this.showMaleTouchables()}
              <Chat callback={() => {this.chatCallback()} } gameID={this.state.game.id} user={this.state.user} firstProfile={leftProfile} secondProfile={rightProfile} />
            </View>)
    }
  }


  render() {
    const {
      user,
      profiles,
    } = this.state

    console.log('gameStatus -------------------------------')
    console.log(this.state.gameStatus)

    if(this.state.foundProfiles && (this.state.gameStatus == 'hasQuestion' || this.state.gameStatus == 'noQuestion')) {
      return(
        <View style={{flex: 1}}>
          {this.showFemaleTouchable()}
          <View style={styles.container}>
            {this.showPrompt()}
            {this.showMenu()}
          </View>
        </View>
      ) 
    } else {
      return(<View style={{flex: 1}}>
          <TouchableOpacity style={{height:height/8+5, borderBottomWidth: 3, borderColor: 'gray', backgroundColor: 'white'}}
            onPress={() => {}}>
          </TouchableOpacity>
          <View style={styles.container}>
            <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
              <ActivityIndicator size="small"/>
            </View>
            {this.showMenu()}
          </View>
        </View>)
    }
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopWidth: 2,
    borderColor: 'lightgrey',
    backgroundColor:'white',
  },
  promptText: {
    marginTop: 10, 
    marginBottom: 20,
    margin: 10, 
    fontSize: 28,
    textAlign: 'center'
  },
  nameHeader: {
    width: width/3,
    alignSelf: 'center',
    borderBottomWidth:  1,
    borderColor: 'lightgrey'
  },
  nameHeaderPipe: {
    width: width/5,
    alignSelf: 'center',
  },
  name: {
    color: '#2B2B2B',
    fontSize: 20,   
    textAlign: 'center',
  },
});