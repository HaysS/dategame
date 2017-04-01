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
  }

  componentWillMount() {
    this.state = {
      user: this.props.user,
      gameID: this.props.gameID,
      messages: [], 
      reachedMax: false,
      chatLoaded: false,
    }

    this.watchChat()
  }

  componentDidMount() {
    if(!this.state.chatLoaded && this.state.messages.length > 1)
      this.setState({chatLoaded: true})

    if(this.state.chatLoaded)
      this.props.callback()
  }

  componentDidUpdate() {
    if(!this.state.chatLoaded && this.state.messages.length > 1)
      this.setState({chatLoaded: true})

    if(this.state.chatLoaded)
      this.props.callback()
  }

  componentWillUnmount() {
    firebase.database().ref().child('games/'+this.state.gameID).child('messages').off()
  }

  messageHandler(snap) {
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


    if(this.state.user.gender == 'male') {
      const uid = this.state.user.uid

      if(messages.filter((m) => {return m.user._id === uid}).length >= 5)
        this.setState({reachedMax: true, messages: messages, chatLoaded: true})
      else 
        this.setState({messages: messages, chatLoaded: true})
    } else if(this.state.user.gender == 'female'){
      this.setState({messages: messages, chatLoaded: true})
    }
  }

  watchChat() {
    firebase.database().ref().child('games/'+this.state.gameID).child('messages')
      .orderByChild('createdAt')
      .on('value', (snap) => {this.messageHandler(snap)})
  }

  onSend(message) {
    if(this.state.user.gender == 'female') {
      firebase.database().ref().child('games/'+this.state.gameID).child('messages')
      .push({
        text: message[0].text,
        createdAt: new Date().getTime(),
        sender: message[0].user._id,
        name: this.props.user.first_name   
      })

    } else if(this.state.user.gender == 'male' && !this.state.reachedMax) {
      firebase.database().ref().child('games/'+this.state.gameID).child('messages')
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
    if(this.state.chatLoaded) {
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

    return (
        <View style={{flex:1, borderBottomWidth: 1, borderColor: 'gray'}} >
        </View>
    ) 
	}

 }