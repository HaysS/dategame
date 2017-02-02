import React, { Component } from 'react';
import {
  Alert,
  StyleSheet,
  Dimensions,
  View,
  Image,
  Text,
  InteractionManager,
  TouchableOpacity,
  PixelRatio
} from 'react-native';

import {Router} from '../../app'
import * as FirebaseAPI from '../modules/firebaseAPI'

const {height, width} = Dimensions.get('window');
const ratio = PixelRatio.get() // get the pixel ratio so that we can calc optimum image size later
const size = width/4
 
export default class Question extends Component { 
  selectQuestion() {
    FirebaseAPI.updateUser(this.props.user.uid, 'selectedQuestion', this.props.question.id)

    this.props.callback()
  }

  render() {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => {this.selectQuestion()}}>
          <View>
            <Text style={styles.question}>{this.props.question.text}</Text>
          </View>
        </TouchableOpacity>
      </View> 
    )    
  }

 }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 5,
    justifyContent: 'flex-start',
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'lightgray'
  },
  question: {
    margin: 10,
    color: '#2B2B2B',
    fontSize: 24,   
    textAlign: 'center',
  },
});