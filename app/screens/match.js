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
import MatchChat from '../components/matchChat'

import {Router} from '../../app'
import * as firebase from 'firebase'
import * as FirebaseAPI from '../modules/firebaseAPI'

import filterProfiles from '../modules/filter'

const {height, width} = Dimensions.get('window');

export default class Match extends Component {
  componentWillMount() {
    this.state = { 
      user: this.props.user,
      profile: this.props.profile, 
      reachedMax: false,
    }
  }
  
  componentWillUnmount() {
    firebase.database().ref().off()
  }

  nextProfileIndex() {
    this.setState({
      profileIndex:this.state.profileIndex+1
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
            <TouchableOpacity onPress={() => {this.props.navigator.push(Router.getRoute('menu', {user}))}}>
                <BackHeader />
            </TouchableOpacity>
          </View>
          <View style={{flex:1, justifyContent: 'center', alignItems: 'center'}}>
      		  <TouchableOpacity style={{}}
      		    onPress={() => {this.props.navigator.push(Router.getRoute('profile', {profile: profile}))}}>
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
		  	<MatchChat user={user} profile={profile}/>
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