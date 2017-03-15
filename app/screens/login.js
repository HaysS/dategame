import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  Dimensions
} from 'react-native';

import Exponent from 'exponent'
import * as FirebaseAPI from '../modules/firebaseAPI'
import firebase from 'firebase'
import {Router} from '../../app'

const APP_ID = '372366163116874';

const {height, width} = Dimensions.get('window');

export default class Login extends Component {
	displayError(messsage) {
	    Alert.alert(
	      'Error: ',
	      messsage,
	      [
	        {text: 'Ok', onPress: () => console.log('accepted error')},
	      ]
	    )
	 }

	fbLogin = async() => {
	 	const { type, token } = await Exponent.Facebook.logInWithReadPermissionsAsync(
		    APP_ID, {
		      permissions: ['public_profile', 'email', 'user_birthday'],
		    });
		if (type === 'success') {
	        const fields = ['email','first_name','last_name', 'gender']
	        // facebook user data request
	        const response = await fetch(`https://graph.facebook.com/me?fields=${fields.toString()}&access_token=${token}`)

	        const user = await FirebaseAPI.loginUser(token)

	        FirebaseAPI.mergeUser(await user.uid, await response.json())
	        	.then(() => console.log('merge success'), () => this.showError('Could not add you to database'))

        	this.firebaseRef = firebase.database().ref('users')

    		firebase.auth().onAuthStateChanged(fbAuth => {
      			if (fbAuth) {  
      				this.firebaseRef.child(fbAuth.uid).on('value', snap => {
						const user = snap.val()
						if (user != null) {
							this.props.navigator.push(Router.getRoute('menu', {user}))
						}
					})
				}
			})
		} else {
			this.displayError('Facebook login failed')
		}
    }

    render() {
	    return (
	      <View style={styles.container}>
	      	<View style={{flex: 1, justifyContent: 'center'}}>
	      		<Text style={{textAlign: 'center', fontSize: 52, color: 'darkred'}}>
	      			Welcome to DateGame!
	      		</Text>
	      	</View>
	      	<View style={{flex: 1, justifyContent: 'center'}}>
		      	<TouchableOpacity onPress={this.fbLogin}>
		      		<Text style={styles.login}>Login with Facebook</Text>
		      	</TouchableOpacity>
      		</View>
	      </View>
	    );
  	}
}

const styles = StyleSheet.create({
  container: {
  	flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  login: {
  	width: width/2,
  	textAlign: 'center', 
  	color:'white', 
  	fontSize:24, 
  	backgroundColor: 'darkred',
  	borderColor: 'darkred', 
  	borderWidth: 1, 
  	borderRadius: 10,
  	overflow: 'hidden'
  }
});