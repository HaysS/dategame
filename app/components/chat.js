import React, {Component} from 'react'
import {
  Alert,
  View,
  TouchableOpacity,
  Text,
  PixelRatio,
  StyleSheet
} from 'react-native'

import * as firebase from 'firebase'
import moment from 'moment'
import {Ionicons} from '@exponent/vector-icons'
import {Router} from '../../app'


import { GiftedChat } from 'react-native-gifted-chat'

const ratio = PixelRatio.get()

export default class Chat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: this.props.user,
      messages: [], 
      reachedMax: false
    }

    const profileArray = [this.props.firstProfile, this.props.secondProfile, this.props.user]
    const maleProfiles = profileArray.filter((profile) => { return profile.gender == 'male'})
    const femaleProfile = profileArray.find((profile) => {return profile.gender == 'female'})

    const profileInfoArray = [{'name': maleProfiles[0].first_name, 'uid': maleProfiles[0].uid, 'matched': false}, 
                              {'name': maleProfiles[1].first_name, 'uid': maleProfiles[1].uid, 'matched': false}, 
                              {'name': femaleProfile.first_name, 'uid': femaleProfile.uid, 'matched': false, 'selectedQuestion': -1}].sort((a, b) => {
                                return a.uid.localeCompare(b.uid)
                              })

    //Sort uid concatenation in order of greatness so every user links to the same chat
    const uidArray = profileInfoArray.map((profile) => {return profile.uid})
    console.log(uidArray)

    uidArray.sort()
    this.gameID = uidArray[0]+'-'+uidArray[1]+'-'+uidArray[2]

    firebase.database().ref().child('games/'+this.gameID).update({'id': this.gameID, 'profilesInfo': profileInfoArray})

  }

  watchChat() {
    firebase.database().ref().child('games/'+this.gameID).child('messages')
      .orderByChild('createdAt')
      .on('value', (snap) => {
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

      if(this.state.user.gender == 'male') {

        const uid = this.state.user.uid

        if(messages.filter((m) => {return m.user._id === uid}).length >= 5)
          this.setState({reachedMax: true, messages: messages})
        else
          this.setState({messages})
      } else if(this.state.user.gender == 'female')
        this.setState({messages})
    })
  }


  componentWillUnmount() {
    firebase.database().ref().child('games/'+this.gameID).child('messages').off()
  }

  componentWillMount() {
    this.watchChat()
  }

  onSend(message) {
    if(this.state.user.gender == 'female') {
      firebase.database().ref().child('games/'+this.gameID).child('messages')
      .push({
        text: message[0].text,
        createdAt: new Date().getTime(),
        sender: message[0].user._id,
        name: this.props.user.first_name   
      })

    } else if(this.state.user.gender == 'male' && !this.state.reachedMax) {
      firebase.database().ref().child('games/'+this.gameID).child('messages')
        .push({
          text: message[0].text,
          createdAt: new Date().getTime(),
          sender: message[0].user._id,
          name: this.props.user.first_name   
        })

      const sentCount = this.state.sentCount+1

      this.setState({sentCount: sentCount})
    }
    else if(this.state.user.gender == 'male' && this.state.reachedMax) {
      Alert.alert('You have sent more than 5 messages. You must now wait for the decision.')
    }
  }
	render() {
		return (
        <View style={{flex:1, borderBottomWidth: 1, borderColor: 'gray'}} >
          <GiftedChat
            messages={this.state.messages}
            onSend={(m) => this.onSend(m)}
            renderTime={() => {}}
            user={{
              _id: this.props.user.uid,
            }} />
  		  </View>
		)    
	}

 }