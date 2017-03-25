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
  InteractionManager
} from 'react-native'

import BackHeader from '../components/backHeader'
import Question from '../components/question'

import {Router} from '../../app'
import { GiftedChat } from 'react-native-gifted-chat';
import * as firebase from 'firebase'
import * as FirebaseAPI from '../modules/firebaseAPI'

import filterProfiles from '../modules/filter'

const {height, width} = Dimensions.get('window');

export default class Questions extends Component {
  componentWillMount() {
    this.state = { 
      questions: [],
      user: this.props.user,
      game: this.props.game,
    }

    FirebaseAPI.getQuestions((questions) => {
      this.setState({questions: questions})
    })
  }

  render() {
    const {
      questions,
      user,
      game
    } = this.state

    return(
      <View style={{flex: 8}}>
        <TouchableOpacity style={{borderBottomWidth: 3, borderColor: 'gray', backgroundColor: 'white'}}
          onPress={() => {this.props.navigator.pop()}}>
          <BackHeader />
        </TouchableOpacity>
        <View style={styles.container}> 
          {
            questions.map((question) => {
              return <Question user={user} game={game} question={question} key={question.id} callback={() => {this.props.navigator.pop()}}/>
            })
          }
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
    flex: 6,
    borderTopWidth: 2,
    borderColor: 'lightgrey',
    backgroundColor:'white',
  },
  text: {
    color: '#2B2B2B',
    fontSize: 48,
    textAlign: 'center'
  },
  questionContainer: {
    flex: 2,
    marginTop: 5,
    justifyContent: 'flex-start',
    alignItems: 'center',
    overflow: 'hidden',
  }
});