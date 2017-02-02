import React, {Component} from 'react'
import {
  View,
  Dimensions,
  TouchableOpacity,
  Text,
  PixelRatio,
  StyleSheet
} from 'react-native'

import * as firebase from 'firebase'
import moment from 'moment'
import {Ionicons} from '@exponent/vector-icons'
import {Router} from '../../app'


const {height, width} = Dimensions.get('window')
import { GiftedChat } from 'react-native-gifted-chat'

const ratio = PixelRatio.get()

export default class FemaleChat extends Component {
  constructor(props) {
    super(props);
    this.state = {messages: []}

    const leftProfileUid = this.props.firstProfile.uid
    const rightProfileUid = this.props.secondProfile.uid
    const uid = this.props.user.uid

    //Sort uid concatenation in order of greatness so every user links to the same chat
    const uidArray = [uid, leftProfileUid, rightProfileUid]
    uidArray.sort()
    this.chatID = uidArray[0]+'-'+uidArray[1]+'-'+uidArray[2]
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
            name: child.val().name,
          }
        })
      });
      messages.reverse()

      

      this.setState({messages})
    })
  }

   componentWillUnmount() {
    console.log('DB OFF')
    firebase.database().ref().child('messages').child(this.chatID).off()
  }

  componentWillMount() {
    this.watchChat()
  }

  onSend(message) {
    firebase.database().ref().child('messages').child(this.chatID)
      .push({
        text: message[0].text,
        createdAt: new Date().getTime(),
        sender: message[0].user._id,
        name: this.props.user.first_name   
      })
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width:width,
    backgroundColor:'white',
  },
  answer: {
    color: '#2B2B2B',
    fontSize: 40,   
    textAlign: 'center',
  },
});