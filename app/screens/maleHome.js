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

export default class Home extends Component {
  componentWillMount() {
    this.state = { 
      profiles: [],
      user: this.props.user,
      question: '',
    }
  }

  componentDidMount() {

    FirebaseAPI.updateUser(this.state.user.uid, 'needsFemale', true)

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
  }

  componentWillUnmount() {
    firebase.database().ref().off()
  }

  componenetDidUpdate() {

  }

  watchForQuestion() {
    const profile = this.state.profiles.find((profile) => {return profile.gender == 'female'})

    if(profile != null) {
      firebase.database().ref().child('users/'+profile.uid).on('value', (snap) => {
          console.log('watched complete')
          FirebaseAPI.getQuestion(snap.val().selectedQuestion, (question) => this.setState({question: question.text}))
      })
    }
  }

  watchForMatch() {
    const profile = this.state.profiles.find((profile) => {return profile.gender == 'female'})

    if(profile != null) {
      //Watch for when the female decides on a match
      FirebaseAPI.watchLikes(profile.uid, (uid) => {
        if (uid[this.state.user.uid]) { //Will return true if there is a match, something other than true otherwise
          this.props.navigator.push(Router.getRoute('match', {user: this.state.user, profile: profile}))
        } else 
          Alert.alert('YOU WERE NOT CHOSEN. BUT I STILL LOVE U')
      }) 
    }
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

    const profile = this.state.profiles.find((profile) => {return profile.gender == 'female'})

    if(profile.selectedQuestion != -1) {
      firebase.database().ref().child('users/'+profile.uid).off()

      if(this.state.question == '')
        FirebaseAPI.getQuestion(profile.selectedQuestion, (question) => this.setState({question: question.text}))

      return(<View style={{flex: 6}}><View style={{flex: 1}}><Text style={styles.promptText}>{this.state.question}</Text></View><View style={{flex: 5}}>{this.showChat()}</View></View>)
    } else
      return(<View style={{flex: 6}}><View style={{flex: 1}}><Text style={styles.promptText}>A Question is Being Chosen...</Text></View><View style={{flex: 5}}>{this.showChat()}</View></View>)
  }

  showChat() {
    console.log('show Chat')

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

    const isFindingProfiles = (profiles.length < 2)      

    if(!isFindingProfiles) {
      this.watchForQuestion()
      this.watchForMatch()
      const femaleProfile = this.state.profiles.find((profile) => {return (profile.gender == 'female')})

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