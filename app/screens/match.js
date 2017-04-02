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
import BackHeader from '../components/backHeader'
import moment from 'moment'

import {Ionicons} from '@exponent/vector-icons'
import { GiftedChat } from 'react-native-gifted-chat'
import {Router} from '../../app'

import * as firebase from 'firebase'
import * as FirebaseAPI from '../modules/firebaseAPI'

import filterProfiles from '../modules/filter'

const {height, width} = Dimensions.get('window');

export default class Match extends Component {
  static route = {
    styles: {
      gestures: null,
    },
  };
  
  componentWillMount() {
    this.state = { 
      messages: [],
      user: this.props.user,
      profile: this.props.profile, 
      reachedMax: false,
      reachedMax: false, 
      interactionsComplete: false,
    }


    const profileUid = this.props.profile.uid
    const uid = this.props.user.uid

    //Sort uid concatenation in order of greatness so every user links to the same chat
    const uidArray = [uid, profileUid]
    uidArray.sort()
    this.chatID = uidArray[0]+'-'+uidArray[1]

    this.watchChat()
  }
  
  componentWillUnmount() {
    firebase.database().ref().off()
    firebase.database().ref().child('messages').child(this.chatID).off()
  }

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.setState({interactionsComplete: true});
    });
  }
  nextProfileIndex() {
    this.setState({
      profileIndex:this.state.profileIndex+1
    })
  }

  popBackTwice() {
    if(this.state.interactionsComplete) {
      this.props.navigator.pop(2)
    }
  }

   watchChat() {
    firebase.database().ref().child('messages').child(this.chatID)
      .orderByChild('createdAt')
      .on('value', (snap) => {
      if(this.state.chatLoaded)
        this.setState({chatLoaded: false})

      let messages = []
      snap.forEach((child) => {
        const date = moment(child.val().createdAt).format()
        messages.push({
          text: child.val().text,
          _id: child.key,
          createdAt: date,
          user: {
            _id: child.val().sender,
            name: child.val().name
          }
        })
      });
      messages.reverse()

      if(messages != this.state.messages)
        this.setState({messages: messages})      
    })
  }

  onSend(message) {
    // if(!this.state.reachedMax) {
      firebase.database().ref().child('messages').child(this.chatID)
        .push({
          text: message[0].text,
          createdAt: new Date().getTime(),
          sender: message[0].user._id,
          name: this.props.user.first_name   
        })
  }

  render() {
    const {
      user,
      profile
    } = this.state

  	return(
  		<View style={{flex: 16}}>
        <View style={{flex: 3, width: width, borderBottomWidth: 3, borderColor: 'gray', backgroundColor: 'white', justifyContent: 'flex-start'}}>
          <View style={{flex: 3, flexDirection: 'row', justifyContent: 'space-around'}} >
            <View style={{flex:1, justifyContent: 'center', alignItems: 'center'}} >
              <TouchableOpacity onPress={() => {this.popBackTwice()}}>
                  <BackHeader />
              </TouchableOpacity>
            </View>
            <View style={{flex:1, justifyContent: 'center', alignItems: 'center'}}>
        		  <TouchableOpacity style={{}}
        		    onPress={() => {
                  if(this.state.chatLoaded)
                    this.props.navigator.push(Router.getRoute('profile', {profile: profile}))}}>
        		    <Header facebookID={profile.id}/>
                    <View>
                      	<Text style={styles.name}>{profile.first_name}</Text>
                    </View>
      		    </TouchableOpacity>
            </View>
            <View style={{flex:1}} />
          </View>
        </View>
  		  <View style={styles.container}>
  		  	<View style={{flex:1, borderBottomWidth: 1, borderColor: 'gray'}} >
            <GiftedChat
              messages={this.state.messages}
              onSend={(m) => this.onSend(m)}
              renderTime={() => {}}
              user={{
                _id: this.props.user.uid,
              }} />
          </View>
  		    <TouchableOpacity style={{justifyContent: 'flex-start', alignItems:'center'}} onPress={() => {}}>
  		      <Text style={{marginTop: 10, marginBottom: 20, fontSize: 40}}></Text>
  		    </TouchableOpacity>
  		  </View>
  		</View>
  	)
	}
}

const styles = StyleSheet.create({
  container: {
    flex: 13,
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
    width: width,
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