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

export default class Game extends Component {
  componentWillMount() {
    this.state = { 
      game: this.props.game,
      user: this.props.user,
      profiles: [],
      question: '',
      questionStatus: '',
    }

    FirebaseAPI.updateUser(this.state.user.uid, 'needsFemale', true)

    FirebaseAPI.updateUser(this.state.user.uid, 'needsMale', true)

    FirebaseAPI.watchUserLocationDemo(this.state.user.uid)
    FirebaseAPI.watchUser(this.state.user.uid, (user) => {
      if (user) {
        console.log('showingingin')
        console.log(this.state.game.id)
          this.state.game.id.split('-').map((uid) => {
            if(uid != this.state.user.uid){
              FirebaseAPI.getUserCb(uid, (profile) => {
                newProfiles = [...this.state.profiles, profile]
                this.setState({profiles: newProfiles})
              })
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
      if(this.state.questionStatus == '') {
        console.log(this.state.profiles)
        this.watchForQuestion()
      } 

      if(this.state.questionStatus == 'hasDecision') {
        this.endGame()
      } else if(this.state.questionStatus == 'none') {
        this.watchForMatch()
      }
    }
  }

  watchForQuestion() {
    const profile = this.state.profiles.find((profile) => {return profile.gender == 'female'})

    if(profile != null) {
      firebase.database().ref().child('users/'+profile.uid).on('value', (snap) => {
        if(snap.val().selectedQuestion != -1) {
          FirebaseAPI.getQuestion(snap.val().selectedQuestion, (question) => {
            FirebaseAPI.getUserCb(profile.uid, (user) => {
              this.setState({question: question.text, user: user, questionStatus: 'hasQuestion'})
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

    
    console.log('I love u')
    console.log(this.state.profiles)

    if(this.state.foundProfiles && this.state.questionStatus != '') {
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