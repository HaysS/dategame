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

import {Router} from '../../app'

const {height, width} = Dimensions.get('window');

export default class MatchDecision extends Component {
  componentWillMount() {
    this.state = { 
      user: this.props.user,
      topProfile: this.props.topProfile,
      bottomProfile: this.props.bottomProfile
    }
  }

  render() {
    const {
      user,
      topProfile,
      bottomProfile
    } = this.state

    const profiles = [topProfile, bottomProfile]

    return(
      <View style={{flex: 8}}>
        <TouchableOpacity style={{borderBottomWidth: 3, borderColor: 'gray', backgroundColor: 'white'}}
          onPress={() => {this.props.navigator.pop()}}>
          <BackHeader />
        </TouchableOpacity>
        <View style={styles.container}> 
          {
            profiles.map((profile, i) => {
              return (<View style={{flex: 1, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: 'lightgray'}} key={'view'+i}>
                <TouchableOpacity onPress={() => {this.props.navigator.pop()}} key={'touchable'+i}>
                  <Text style={{fontSize: 32, textAlign: 'center'}} key={'text'+i}>{profile.first_name}</Text>
                </TouchableOpacity>
              </View>)
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