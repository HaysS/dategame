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
      mounted: false,
      malesReachedMax: false,
    }
  }

  componentDidMount() {
    this.setState({mounted: true})

    if(this.state.user.gender == 'male')
      FirebaseAPI.updateUser(this.state.user.uid, 'needsFemale', true)
    else
      FirebaseAPI.updateUser(this.state.user.uid, 'needsFemale', false)

    FirebaseAPI.updateUser(this.state.user.uid, 'needsMale', true)

    FirebaseAPI.watchUserLocationDemo(this.state.user.uid)
    FirebaseAPI.watchUser(this.state.user.uid, (user) => {
      if (user) {
        this.setState({
          user: user,
        })

        FirebaseAPI.findProfiles(user, (profile) => {
          const newProfiles = [...this.state.profiles, profile]
          const filteredProfiles = filterProfiles(newProfiles, user)
          this.setState({profiles:filteredProfiles})  
        })
      }
    }) 

    this.watchForQuestion()
  }

  componentWillReceiveProps() {
    this.setState({mounted: false})
  }

  componentWillUnmount() {
    firebase.database().ref().off()
  }

  watchForQuestion() {
    const profile = this.state.user.gender == 'male' ? this.state.profiles.find((profile) => {return profile.gender == 'female'}) : this.state.user

    if(profile != null) {
      firebase.database().ref().child('users/'+profile.uid).on('value', (snap) => {
          console.log('watched complete')
          FirebaseAPI.getQuestion(snap.val().selectedQuestion, (question) => this.setState({question: question.text}))
      })
    }
  }

  watchForMaxMessages() {
      //Sort uid concatenation in order of greatness so every user links to the same chat
      const uidArray = [this.state.profiles[0].uid, this.state.profiles[1].uid, this.state.user.uid]
      uidArray.sort()
      const chatID = uidArray[0]+'-'+uidArray[1]+'-'+uidArray[2]

      firebase.database().ref().child('users/'+this.state.user.uid).off()
      firebase.database().ref().child('messages').child(chatID)
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

        if(messages.filter((m) => {return m.user._id === maleProfiles[0].uid}).length >= 5 && messages.filter((m) => {return m.user._id === this.state.user.uid}).length >= 5
          || messages.filter((m) => {return m.user._id === maleProfiles[0].uid}).length >= 5 && messages.filter((m) => {return m.user._id === maleProfiles[1].uid}).length >= 5)
          this.setState({malesReachedMax: true})
      })
  }

  logout () {
    this.props.navigator.popToTop()
    InteractionManager.runAfterInteractions(() => {
      FirebaseAPI.logoutUser().then(
        () => console.log('signout successful'),
        () => console.log('signout not successful'))
    })
  }

  nextProfileIndex() {
    this.setState({
      profileIndex:this.state.profileIndex+1
    })
  }

  showPrompt() {
    console.log('Show prompts')
    const {user} = this.state

    if(user.gender == 'male') {
      const profile = this.state.profiles.find((profile) => {return profile.gender == 'female'})


      if(profile.selectedQuestion != -1 && this.state.malesReachedMax)
          return(<View style={{flex: 1}}><Text style={styles.promptText}>Messages have run out. Time for a decision...</Text>{this.showChat()}</View>)
      else if(profile.selectedQuestion != -1) {
        if(this.state.question == '')
          FirebaseAPI.getQuestion(profile.selectedQuestion, (question) => this.setState({question: question.text}))

        this.watchForMaxMessages()

        return(<View style={{flex: 6}}><View style={{flex: 1}}><Text style={styles.promptText}>{this.state.question}</Text></View><View style={{flex: 5}}>{this.showChat()}</View></View>)

      } else
        return(<View style={{flex: 6}}><View style={{flex: 1}}><Text style={styles.promptText}>A Question is Being Chosen...</Text></View><View style={{flex: 5}}>{this.showChat()}</View></View>)

    } else if(user.gender == 'female') {
      if(user.selectedQuestion != -1 && this.state.malesReachedMax) {
        profiles = this.state.profiles

         return(<View style={{flex: 1}}><TouchableOpacity style={styles.promptTouchable} 
                onPress={() => {this.props.navigator.push(Router.getRoute('matchDecision', {user: user, topProfile: profiles[0], bottomProfile: profiles[1]}))}}>
                <Text style={styles.promptText}>Messages have run out. Make a decision.</Text>
              </TouchableOpacity>{this.showChat()}</View>)
      } else if(user.selectedQuestion != -1) {
        if(this.state.question == '')
          FirebaseAPI.getQuestion(user.selectedQuestion, (question) => this.setState({question: question.text}))

        this.watchForMaxMessages()

        return(<View style={{flex: 1}}><TouchableOpacity style={styles.promptTouchable} 
                onPress={() => {}}>
                <Text style={styles.promptText}>{this.state.question}</Text>
              </TouchableOpacity>{this.showChat()}</View>)
      } else
        return(<View style={{flex: 1}}><TouchableOpacity style={styles.promptTouchable} 
                onPress={() => {this.props.navigator.push(Router.getRoute('questions', {user}))}}>
                <Text style={styles.promptText}>Ask Question</Text>
              </TouchableOpacity>{this.showChat()}</View>)

    }
  }

  showChat() {
    console.log('show Chat')
    if(this.state.user.gender == 'male'){
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
      } else if(this.state.user.gender != 'male'){
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

    const isFindingProfiles = (profiles.length < 2)      

    if(!isFindingProfiles) {
      const femaleProfile = (user.gender == 'female') ? user : this.state.profiles.find((profile) => {return (profile.gender == 'female')})

      return(
        <View style={{flex: 1}}>
          <TouchableOpacity style={{height:height/8+5, borderBottomWidth: 3, borderColor: 'gray', backgroundColor: 'white'}}
            onPress={() => {this.props.navigator.push(Router.getRoute('profile', {profile: femaleProfile}))}}>
            <Header facebookID={femaleProfile.id} />
          </TouchableOpacity>
          <View style={styles.container}>
            {this.showPrompt()}
            <TouchableOpacity style={{justifyContent: 'flex-start', alignItems:'center'}} onPress={() => this.logout()}>
              <Text style={{marginTop: 10, marginBottom: 20, fontSize: 40}}>Logout</Text>
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
            <TouchableOpacity style={{justifyContent: 'flex-start', alignItems:'center'}} onPress={() => this.logout()}>
              <Text style={{marginTop: 10, marginBottom: 20, fontSize: 40}}>Logout</Text>
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