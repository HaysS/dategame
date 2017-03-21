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
import MaleChat from '../components/maleChat'
import FemaleChat from '../components/femaleChat'


import {Router} from '../../app'
import * as firebase from 'firebase'
import * as FirebaseAPI from '../modules/firebaseAPI'

import filterProfiles from '../modules/filter'

const {height, width} = Dimensions.get('window');

export default class Game extends Component {
  componentWillMount() {
    this.state = { 
      game: this.props.game,
      user: this.props.user,
      profiles: [],
      question: '',
      questionStatus: '',
      foundProfiles: false,
      malesReachedMax: false,
    }

    if(this.state.user.gender == 'male') {  
      FirebaseAPI.updateUser(this.state.user.uid, 'needsFemale', true)
      FirebaseAPI.updateUser(this.state.user.uid, 'needsMale', true)
    }
    else if(this.state.user.gender == 'female') {
      FirebaseAPI.updateUser(this.state.user.uid, 'needsFemale', false)
      FirebaseAPI.updateUser(this.state.user.uid, 'needsMale', true)
    }

    
    this.state.game.id.split('-').map((uid) => {
      if(uid != this.state.user.uid){
        FirebaseAPI.getUserCb(uid, (profile) => {
          if(this.state.profiles.length == 1) {//If there are still less than 2 profiles after filtering
            this.setState({profiles: [...this.state.profiles, profile], foundProfiles: true})               
          }

          if(this.state.profiles.length < 1) {
            this.setState({profiles: [...this.state.profiles, profile]})            
          } 
        })
      }
    })
  }

  componentWillUnmount() {
    //If no profiles are stored, an error will be thrown when you try to .find() one
    if(this.state.profiles.length > 0)  {
      const profile = this.state.profiles.find((profile) => {return profile != null ? profile == 'female' : null})

      if(profile != null) {
        FirebaseAPI.removeMatchesWatcher(profile.uid)
        firebase.database().ref().child('users/'+profile.uid).off()
      }
    }
  }

  componentDidUpdate() {
    if(this.state.foundProfiles) {
      if(this.state.questionStatus == '')
        this.watchForQuestion()

      if(this.state.user.gender == 'female') {
        if(!this.state.malesReachedMax) {
          this.watchForMaxMessages() 
        }
      }

      if(this.state.questionStatus == 'hasDecision') {
        this.endGame()
      } else if(this.state.questionStatus == 'none') {
        this.watchForMatch()
      }
    }
  }

  watchForQuestion() {
    const user = this.state.user
    const profile = user.gender != 'female' ? this.state.profiles.find((profile) => {return profile.gender == 'female'}) : user

    if(profile != null) {
      firebase.database().ref().child('users/'+profile.uid).on('value', (snap) => {
        if(snap.val().selectedQuestion != -1) {
          FirebaseAPI.getQuestion(snap.val().selectedQuestion, (question) => {
            FirebaseAPI.getUserCb(profile.uid, (profile) => {
              if(user.gender == 'female')
                this.setState({question: question.text, user: profile, questionStatus: 'hasQuestion'})
              else if(user.gender == 'male')
                this.setState({question: question.text, questionStatus: 'hasQuestion'})
            })
          })
        } else 
            this.setState({questionStatus: 'none'})
      })
    }
  }

  watchForMatch() {
    const profile = this.state.profiles.find((profile) => {return profile.gender == 'female'})

    if(profile != null) {
      //Watch for when the female decides on a match
      FirebaseAPI.watchMatches(profile.uid, (uid) => {
        if(uid != null)
          if (uid[this.state.user.uid]) { //Will return true if there is a match, something other than true otherwise
          this.props.navigator.push(Router.getRoute('match', {user: this.state.user, profile: profile}))
          } else {
            Alert.alert('You were not chosen. Keep playing, you will get it eventually!')
            this.props.navigator.pop()
          }
      }) 
    }
  }

  watchForMaxMessages() {
      //Sort uid concatenation in order of greatness so every user links to the same chat
      const uidArray = [this.state.profiles[0].uid, this.state.profiles[1].uid, this.state.user.uid]
      uidArray.sort()
      const gameID = uidArray[0]+'-'+uidArray[1]+'-'+uidArray[2]

      firebase.database().ref().child('games/'+gameID).child('messages')
        .on('value', (snap) => {
        let messages = []
        snap.forEach((child) => {
          messages.push({
            user: {
              _id: child.val().sender,
            }
          })
        });
        const maleProfiles = this.state.profiles.filter((profile) => {return profile.gender == 'male'})


        if(messages.filter((m) => {return m.user._id === maleProfiles[0].uid}).length >= 5 && messages.filter((m) => {return m.user._id === maleProfiles[1].uid}).length >= 5)
          this.setState({malesReachedMax: true})
      })
  }
  
  endGame() {
    const profile = this.state.profiles.find((profile) => {return profile.gender == 'female'})

    if(profile != null) {
      FirebaseAPI.checkMatches(profile.uid, (uid) => {

        if (uid[this.state.user.uid]) { //Will return true if there is a match, something other than true otherwise
          this.props.navigator.push(Router.getRoute('match', {user: this.state.user, profile: profile}))
        } else {
          Alert.alert('You were not chosen. Keep playing, you will get it eventually!')
          this.props.navigator.pop()
        }
      })
    }
  }

  menu () {
    this.props.navigator.pop()
  }

  showPrompt() {
    const {user} = this.state

    if(user.gender == 'male') {
      const profile = this.state.profiles.find((profile) => {return profile.gender == 'female'})

      firebase.database().ref().child('users/'+profile.uid).off()

      if(profile.selectedQuestion == -1) {
        return(<View style={{flex: 6}}><View style={{flex: 1}}><Text style={styles.promptText}>A Question is Being Chosen...</Text></View><View style={{flex: 5}}>{this.showChat()}</View></View>)
      } else {
        if(this.state.question == '') 
           FirebaseAPI.getQuestion(profile.selectedQuestion, (question) => {
                this.setState({question: question.text})
            })

        return(<View style={{flex: 6}}><View style={{flex: 1}}><Text style={styles.promptText}>{this.state.question}</Text></View><View style={{flex: 5}}>{this.showChat()}</View></View>)
      }
    } else if(user.gender == 'female') {
      if(this.state.malesReachedMax) {
        console.log('males have reached max')
        profiles = this.state.profiles

         return(<View style={{flex: 6}}><View style={{flex: 1}}><TouchableOpacity style={styles.promptTouchable} 
                onPress={() => {this.props.navigator.push(Router.getRoute('matchDecision', {user: user, topProfile: profiles[0], bottomProfile: profiles[1]}))}}>
                  <Text style={styles.promptText}>Messages have run out. Make a Decision</Text></TouchableOpacity></View>
                  <View style={{flex: 5}}>{this.showChat()}</View>
                </View>)
      } else if(this.state.questionStatus == 'hasQuestion') {
        return(<View style={{flex: 6}}><View style={{flex: 1}}><Text style={styles.promptText}>{this.state.question}</Text></View><View style={{flex: 5}}>{this.showChat()}</View></View>)
      } else if (this.state.questionStatus == 'none') {
        return(<View style={{flex: 6}}><TouchableOpacity style={styles.promptTouchable} 
                onPress={() => {this.props.navigator.push(Router.getRoute('questions', {user: user}))}}>
                  <View style={{flex: 1}}><Text style={styles.promptText}>Ask Question</Text></View>
              </TouchableOpacity><View style={{flex: 5}}>{this.showChat()}</View></View>)
      }
    }
  }

  showChat() {
    if(this.state.user.gender == 'male') {
      const maleProfile = this.state.profiles.find((profile) => {return profile.gender == 'male'})
      const femaleProfile = this.state.profiles.find((profile) => {return profile.gender == 'female'})

      return(<View style={styles.container}>
               <View style={{flexDirection: 'row', justifyContent: 'center',}}>
                  <TouchableOpacity style={styles.nameHeader} onPress={() => {this.props.navigator.push(Router.getRoute('profile', {profile: this.props.user}))}}>
                    <Text style={styles.name}>{this.props.user.first_name}</Text>
                  </TouchableOpacity>
                  <View style={styles.nameHeaderPipe}><Text style={styles.name}> | </Text></View>
                  <TouchableOpacity style={styles.nameHeader} onPress={() => {this.props.navigator.push(Router.getRoute('profile', {profile: maleProfile}))}}>
                    <Text style={styles.name}>{maleProfile.first_name}</Text>
                  </TouchableOpacity>
                </View>
                <MaleChat user={this.state.user}  maleProfile={maleProfile} femaleProfile={femaleProfile} />
              </View>)
    } else if(this.state.user.gender == 'female') {
      const leftProfile = this.state.profiles[0]
      const rightProfile = this.state.profiles[1]
      
      return(<View style={styles.container}>
              <View style={{flexDirection: 'row', justifyContent: 'center',}}>
                <TouchableOpacity style={styles.nameHeader} onPress={() => {this.props.navigator.push(Router.getRoute('profile', {profile: leftProfile}))}}>
                  <Text style={styles.name}>{leftProfile.first_name}</Text>
                </TouchableOpacity>
                <View style={styles.nameHeaderPipe}><Text style={styles.name}> | </Text></View>
                <TouchableOpacity style={styles.nameHeader} onPress={() => {this.props.navigator.push(Router.getRoute('profile', {profile: rightProfile}))}}>
                  <Text style={styles.name}>{rightProfile.first_name}</Text>
                </TouchableOpacity>
              </View>
              <FemaleChat user={this.state.user} firstProfile={leftProfile} secondProfile={rightProfile} />
            </View>)
    }
  }


  render() {
    const {
      user,
      profiles,
    } = this.state

    if(this.state.foundProfiles && this.state.questionStatus != '') {
      const femaleProfile = user.gender != 'female' ? this.state.profiles.find((profile) => {return (profile.gender == 'female')}) : user

      return(
        <View style={{flex: 1}}>
          <TouchableOpacity style={{height:height/8+5, borderBottomWidth: 3, borderColor: 'gray', backgroundColor: 'white'}}
            onPress={() => {this.props.navigator.push(Router.getRoute('profile', {profile: femaleProfile}))}}>
            <Header facebookID={femaleProfile.id} />
          </TouchableOpacity>
          <View style={styles.container}>
            {this.showPrompt()}
            <TouchableOpacity style={{justifyContent: 'flex-start', alignItems:'center'}} onPress={() => this.menu()}>
              <Text style={{marginTop: 10, marginBottom: 20, fontSize: 40}}>Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) 
    } else
      return(
        <View style={{flex: 1}}>
          <TouchableOpacity style={{height:height/8+5, borderBottomWidth: 3, borderColor: 'gray', backgroundColor: 'white'}}
            onPress={() => {this.props.navigator.push(Router.getRoute('profile', {profile: user}))}}>
          </TouchableOpacity>
          <View style={styles.container}>
            <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
              <ActivityIndicator size="small"/>
            </View>
            <TouchableOpacity style={{justifyContent: 'flex-start', alignItems:'center'}} onPress={() => this.menu()}>
              <Text style={{marginTop: 10, marginBottom: 20, fontSize: 40}}>Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) 
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