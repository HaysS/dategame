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

import {Router} from '../../app'
import * as firebase from 'firebase'
import * as FirebaseAPI from '../modules/firebaseAPI'

import filterProfiles from '../modules/filter'

const {height, width} = Dimensions.get('window');

export default class MaleHome extends Component {
  componentWillMount() {
    this.state = { 
      profiles: [],
      user: this.props.user,
      question: '',
      foundProfiles: false,
      decisionValue: '',
    }
  }

  componentDidMount() {
    FirebaseAPI.updateUser(this.state.user.uid, 'needsFemale', true)

    FirebaseAPI.updateUser(this.state.user.uid, 'needsMale', true)

    FirebaseAPI.watchUserLocationDemo(this.state.user.uid)
    FirebaseAPI.watchUser(this.state.user.uid, (user) => {
      if (user) {
        FirebaseAPI.findProfiles(user, (profile) => {

          if(!this.state.foundProfiles) {
            const newProfiles = [...this.state.profiles, profile]
            const filteredProfiles = filterProfiles(newProfiles, user)


            if(filteredProfiles.length < 2){
              this.setState({profiles: filteredProfiles})            
            } 

            if(filteredProfiles.length >= 2) {//If there are still less than 2 profiles after filtering
              this.setState({profiles: filteredProfiles, foundProfiles: true})               
            }
          } 

          if(this.state.foundProfiles) {
              this.hasDecision()

            return true
          }

          return false
      })
      }
    })
  }

  componentWillUnmount() {
    const profile = this.state.profiles.find((profile) => {return profile.gender == 'female'})

    FirebaseAPI.removeMatchesWatcher(profile.uid)
    firebase.database().ref().child('users/'+profile.uid).off()
  }

  componentDidUpdate() {
    if(this.state.foundProfiles && this.state.decisionValue == 'hasDecision') {
      this.endGame()
    } else if(this.state.foundProfiles && this.state.decisionValue == 'none') {
      this.watchForMatch()
    }
  }

  watchForQuestion() {
    const profile = this.state.profiles.find((profile) => {return profile.gender == 'female'})


    console.log(profile)

    if(profile != null) {
      firebase.database().ref().child('users/'+profile.uid).on('value', (snap) => {
        if(snap.val().selectedQuestion != -1) {
          const maleProfile = this.state.profiles.find((user) => {
              return user.uid != profile.uid
            })

          FirebaseAPI.getQuestion(snap.val().selectedQuestion, (question) => {
            FirebaseAPI.getUserCb(profile.uid, (user) => {
              this.setState({question: question.text, profiles: [maleProfile, user]})
            })
          })
        }
      })
    }
  }

  watchForMatch() {
    const profile = this.state.profiles.find((profile) => {return profile.gender == 'female'})
    console.log(profile)


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

  hasDecision() {
    const femaleProfile = this.state.profiles.find((profile) => {return profile.gender == 'female'})
    const maleProfile = this.state.profiles.find((profile) => {return profile.gender == 'male'})

    if(femaleProfile != null && maleProfile != null) {
      //Check for when if the female decided on a match
      FirebaseAPI.checkMatches(femaleProfile.uid, (uid) => {
        if(uid != null)
          if (uid[this.state.user.uid] || uid[maleProfile.uid]) {//Will return true if there is a decision
            if(!this.state.hasDecision) {
              this.setState({'decisionValue': 'hasDecision'})
            }
          } else {
            this.setState({'decisionValue': 'none'})
          }
        else
          this.setState({'decisionValue': 'none'})
      })
    } else
      this.setState({'decisionValue': 'none'})
  }

  endGame() {
    const profile = this.state.profiles.find((profile) => {return profile.gender == 'female'})
    console.log(profile)


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

    const profile = this.state.profiles.find((profile) => {return profile.gender == 'female'})
    console.log(profile)


    firebase.database().ref().child('users/'+profile.uid).off()

    if(profile.selectedQuestion == -1) {
      this.watchForQuestion()
      return(<View style={{flex: 6}}><View style={{flex: 1}}><Text style={styles.promptText}>A Question is Being Chosen...</Text></View><View style={{flex: 5}}>{this.showChat()}</View></View>)
    } else {
      if(this.state.question == '') 
         FirebaseAPI.getQuestion(profile.selectedQuestion, (question) => {
              this.setState({question: question.text})
          })

      return(<View style={{flex: 6}}><View style={{flex: 1}}><Text style={styles.promptText}>{this.state.question}</Text></View><View style={{flex: 5}}>{this.showChat()}</View></View>)
    }
  }

  showChat() {
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
    }


  render() {
    const {
      user,
      profiles,
    } = this.state

    console.log(this.state.foundProfiles)


    if(this.state.decisionValue == 'none' && this.state.foundProfiles) {
      const femaleProfile = this.state.profiles.find((profile) => {return (profile.gender == 'female')})

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