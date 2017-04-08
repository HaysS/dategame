import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';

import Exponent from 'exponent'
import * as FirebaseAPI from '../modules/firebaseAPI'
import firebase from 'firebase'
import {Router} from '../../app'

const APP_ID = '372366163116874';

const {height, width} = Dimensions.get('window');

export default class Login extends Component {
	static route = {
	    styles: {
	      gestures: null,
	    },
	  };
  
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
			this.props.navigator.pop()
	        const fields = ['email','first_name','last_name', 'gender']
	        // facebook user data request
	        const response = await fetch(`https://graph.facebook.com/me?fields=${fields.toString()}&access_token=${token}`)

	        const user = await FirebaseAPI.loginUser(token)

	        FirebaseAPI.mergeUser(await user.uid, await response.json())
	        	.then(() => console.log('merge success'), () => this.showError('Could not add you to database'))
		} else {
			this.displayError('Facebook login failed')
		}
    }

    render() {
	    return (
	      <View style={styles.container}>
	      	<View style={{flex: 1, justifyContent: 'center'}}>
	      		<Text style={{textAlign: 'center', fontSize: 52, color: 'darkred'}}>
	      			Welcome to Catchable!
	      		</Text>
	      	</View>
	      	<View style={{flex: 1, justifyContent: 'center'}}>
		      	<View style={{width:width/1.4, height:height/2.4, borderRadius: 75, shadowColor: '#000000', shadowOffset: {width: 0, height: 0}, shadowRadius: 10, shadowOpacity: 0.5,}}>
					<Image 
					resizeMode='cover'
					source={require( "../assets/Beautiful-Chinese-girls.jpg")}
					style={{width:width/1.4, height:height/2.4, borderRadius: 75}} />
		      	</View>
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