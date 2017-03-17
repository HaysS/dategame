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

export default class MatchChat extends Component {
  constructor(props) {
    super(props);
    this.state = {messages: [], reachedMax: false}

    const profileUid = this.props.profile.uid
    const uid = this.props.user.uid

    //Sort uid concatenation in order of greatness so every user links to the same chat
    const uidArray = [uid, profileUid]
    uidArray.sort()
    this.chatID = uidArray[0]+'-'+uidArray[1]
  }

  watchChat() {
    firebase.database().ref().child('messages').child(this.chatID)
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

      const uid = this.props.user.uid

      if(messages.filter((m) => {return m.user._id === uid}).length >= 10) {
          this.setState({reachedMax: true})
      }

      this.setState({messages})
    })
  }


  componentWillUnmount() {
    firebase.database().ref().child('messages').child(this.chatID).off()
  }

  componentWillMount() {
    this.watchChat()
  }

  componentDidMount() {
	Alert.alert('You both can only send 10 messages! Share your contact info to chat more :)')
  }

  onSend(message) {
    if(!this.state.reachedMax) {
      firebase.database().ref().child('messages').child(this.chatID)
        .push({
          text: message[0].text,
          createdAt: new Date().getTime(),
          sender: message[0].user._id,
          name: this.props.user.first_name   
        })
      const sentCount = this.state.sentCount+1

      this.setState({sentCount: sentCount})
    }
    else {
      Alert.alert('You have sent 10 messages. You must now wait for the decision.')
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
