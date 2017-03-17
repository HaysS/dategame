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
import FemaleChat from '../components/femaleChat'
import MaleChat from '../components/maleChat'
import MatchDecision from './matchDecision'

import {Router} from '../../app'
import * as firebase from 'firebase'
import * as FirebaseAPI from '../modules/firebaseAPI'

import filterProfiles from '../modules/filter'

const {height, width} = Dimensions.get('window');

export default class Home extends Component {
  componentWillMount() {
    this.state = { 
      profiles: [],
      user: this.props.user,
      question: '',
      malesReachedMax: false,
      foundProfiles: false,
      chosenQuestion: '',
    }
  }

  componentDidMount() {
    FirebaseAPI.updateUser(this.state.user.uid, 'needsFemale', false)

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
            if(!this.state.chosenQuestion) 
              this.checkForQuestion()

            this.checkForMaxMessages()

            if(!this.state.malesReachedMax) {
              this.watchForMaxMessages() 
            }
            return true //This will cause the geoQuery to cancel when return
          }

          return false  //geoQuery keeps listening...
      })
      }
    })
  }

   checkForQuestion() {
    const profile = this.state.user
    if(profile != null) {
      firebase.database().ref().child('users/'+profile.uid).on('value', (snap) => {
        if(snap.val().selectedQuestion != -1) {
          FirebaseAPI.getQuestion(snap.val().selectedQuestion, (question) => {
            FirebaseAPI.getUserCb(profile.uid, (user) => {
              this.setState({question: question.text, user: user, chosenQuestion: 'true'})
            })
          })
        } else 
            this.setState({chosenQuestion: 'none'})
      })
    } else 
      this.setState({chosenQuestion: 'none'})
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

  checkForMaxMessages() {
    //Sort uid concatenation in order of greatness so every user links to the same chat
      const uidArray = [this.state.profiles[0].uid, this.state.profiles[1].uid, this.state.user.uid]
      uidArray.sort()
      const gameID = uidArray[0]+'-'+uidArray[1]+'-'+uidArray[2]

      firebase.database().ref().child('users/'+this.state.user.uid).off()
      firebase.database().ref().child('games/'+gameID).child('messages')
        .once('value').then((snap) => {
        let messages = []
        snap.forEach((child) => {
          messages.push({
            user: {
              _id: child.val().sender,
            }
          })
        });
        const maleProfiles = this.state.profiles.filter((profile) => {return profile.gender == 'male'})

        if(messages.filter((m) => {return m.user._id === maleProfiles[0].uid}).length >= 5 && messages.filter((m) => {return m.user._id === maleProfiles[1].uid}).length >= 5) {
        console.log('called')

          this.setState({malesReachedMax: true})
        }
      })
  }

  menu () {
    this.props.navigator.pop()
  }

  nextProfileIndex() {
    this.setState({
      profileIndex:this.state.profileIndex+1
    })
  }

  showPrompt() {
    const {user} = this.state

    if(this.state.malesReachedMax && this.state.chosenQuestion == 'true') {
      profiles = this.state.profiles

       return(<View style={{flex: 6}}><TouchableOpacity style={styles.promptTouchable} 
              onPress={() => {this.props.navigator.push(Router.getRoute('matchDecision', {user: user, topProfile: profiles[0], bottomProfile: profiles[1]}))}}>
                <View style={{flex: 1}}><Text style={styles.promptText}>Messages have run out. Make a Decision</Text></View></TouchableOpacity>
                <View style={{flex: 5}}>{this.showChat()}</View>
              </View>)
    } else if(this.state.chosenQuestion == 'true') {
      return(<View style={{flex: 6}}><View style={{flex: 1}}><Text style={styles.promptText}>{this.state.question}</Text></View><View style={{flex: 5}}>{this.showChat()}</View></View>)
    } else if (this.state.chosenQuestion == 'none') {
      return(<View style={{flex: 6}}><TouchableOpacity style={styles.promptTouchable} 
              onPress={() => {this.props.navigator.push(Router.getRoute('questions', {user: user}))}}>
                <View style={{flex: 1}}><Text style={styles.promptText}>Ask Question</Text></View>
            </TouchableOpacity><View style={{flex: 5}}>{this.showChat()}</View></View>)
    }
  }

  showChat() {
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


  render() {
    const {
      user,
      profiles,
    } = this.state

    if(this.state.foundProfiles && this.state.chosenQuestion != '') {
      const femaleProfile = user

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
  promptTouchable: {
    justifyContent: 'flex-start',
    alignItems:'center', 
    height: height/7,
    borderBottomWidth: 2, 
    borderColor: 'gray'
  },
  containerTop: {
    flex: 1,
    marginTop: 5,
    justifyContent: 'flex-start',
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'lightgray'
  },
  containerBottom: {
    flex: 1,
    marginTop: 5,
    justifyContent: 'flex-start',
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'gray'
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