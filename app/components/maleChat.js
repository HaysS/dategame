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

export default class MaleChat extends Component {
  constructor(props) {
    super(props);
    this.state = {messages: [], reachedMax: false}

    const maleProfileUid = this.props.maleProfile.uid
    const femaleProfileUid = this.props.femaleProfile.uid
    const uid = this.props.user.uid

    const profileInfoArray = [{'name': this.props.maleProfile.first_name, 'uid': this.props.maleProfile.uid}, 
                              {'name': this.props.femaleProfile.first_name, 'uid': this.props.femaleProfile.uid}, 
                              {'name': this.props.user.first_name, 'uid': this.props.user.uid}]

    //Sort uid concatenation in order of greatness so every user links to the same chat
    const uidArray = [uid, maleProfileUid, femaleProfileUid]
    console.log(uid)

    uidArray.sort()
    this.gameID = uidArray[0]+'-'+uidArray[1]+'-'+uidArray[2]

    firebase.database().ref().child('games/'+this.gameID).update({'id': this.gameID, profilesInfo: profileInfoArray})

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

      const uid = this.props.user.uid

      if(messages.filter((m) => {return m.user._id === uid}).length >= 5) {
          this.setState({reachedMax: true})
      }

      this.setState({messages})
    })

    firebase.database().ref().child('games/'+this.gameID).update({'id': this.gameID})
  }


  componentWillUnmount() {
    firebase.database().ref().child('games/'+this.gameID).child('messages').off()
  }

  componentWillMount() {
    this.watchChat()
  }

  onSend(message) {
    if(!this.state.reachedMax) {
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
    else {
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