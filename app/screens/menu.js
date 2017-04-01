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

import {Router} from '../../app'
import * as firebase from 'firebase'
import * as FirebaseAPI from '../modules/firebaseAPI'

const {height, width} = Dimensions.get('window');

export default class Match extends Component {
  static route = {
    styles: {
      gestures: null,
    },
  };
  
  componentWillMount() {
    this.state = { 
      user: this.props.user
    }
  }
  
  logout() {
    this.props.navigator.popToTop()
    InteractionManager.runAfterInteractions(() => {
      FirebaseAPI.logoutUser().then(
        () => console.log('signout successful'),
        () => console.log('signout not successful'))
    })
  }


  render() {
    const user = this.state.user

	return(
		<View style={{flex: 1}}>
		  <TouchableOpacity style={{height:height/8+30, borderBottomWidth: 3, borderColor: 'gray', backgroundColor: 'white'}}
		    onPress={() => {this.props.navigator.push(Router.getRoute('profile', {profile: user}))}}>
		    <Header facebookID={user.id} />
            <View style={{justifyContent: 'center',}}>
              	<Text style={styles.name}>{user.first_name}</Text>
            </View>
		  </TouchableOpacity>
      <View style={styles.container}>
          <View style={{flex: 1, justifyContent:'center', backgroundColor: 'white'}}>
          <TouchableOpacity onPress={() => {this.props.navigator.push(Router.getRoute('editProfile', {profile: this.state.user}))}}>
            <Text style={styles.menuItem}>Edit Profile</Text> 
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {this.props.navigator.push(Router.getRoute('currentGames', {'user': this.state.user}))}}>
            <Text style={styles.menuItem}>Play Games</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {this.props.navigator.push(Router.getRoute('matches', {'user': this.state.user}))}}>
            <Text style={styles.menuItem}>Matches</Text>
          </TouchableOpacity>
        </View>
		    <TouchableOpacity style={styles.logout} onPress={() => this.logout()}>
		      <Text style={{marginTop: 10, marginBottom: 20, fontSize: 40}}>Logout</Text>
		    </TouchableOpacity>
		  </View>
		</View>
	)
	}
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    borderTopWidth: 2,
    borderColor: 'lightgrey',
    backgroundColor:'white'
  },
  menuItem: { 
    lineHeight: 100,
    textAlign: 'center',
    fontSize: 28,
  },
  logout: {
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    borderTopWidth: 2,
    borderColor: 'gray',
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