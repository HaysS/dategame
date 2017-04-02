import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator,
} from 'react-native';

import BackHeader from '../components/backHeader'
import {Router} from '../../app'

import * as FirebaseAPI from '../modules/firebaseAPI'

const {height, width} = Dimensions.get('window');

export default class Matches extends Component {
  static route = {
    styles: {
      gestures: null,
    },
  };
  
	componentWillMount() {
	    this.state = { 
	      profiles: [],
	      user: this.props.user,
        canShowMatches: false,
	    }

      FirebaseAPI.getUserCb(this.state.user.uid, (user) => {
        this.setState({user: user})
      })

      FirebaseAPI.getMatches(this.state.user.uid, (profiles) => {
        if(profiles != null)
          this.setState({profiles: profiles, canShowMatches: true})
      })
  	}

  goToMatch(profile) {
    this.setState({canShowMatches: false})
    this.props.navigator.push(Router.getRoute('match', {user: this.state.user, profile: profile}))
  }


	render() {
    if(this.state.canShowMatches)
	    return(
	      <View>
	      	<View style={{borderBottomWidth: 3, borderColor: 'gray', backgroundColor: 'white'}}>
		        <TouchableOpacity onPress={() => {
              if(this.state.canShowMatches)
                this.props.navigator.pop()}}>
		          <BackHeader />
		        </TouchableOpacity>
	        </View>
	        <View style={styles.container}>  
	          {
	           	this.state.profiles.map((profile) => {
	              	return (
	              		<TouchableOpacity onPress={() => {this.goToMatch(profile)}} 
	              		key={profile.uid+"-touchable"} >
		              		<View style={styles.match}  key={profile.uid+"-container"}>
		          				<Text style={styles.name} key={profile.uid+'-name'}>{profile.first_name}</Text>
		              		</View>
		              	</TouchableOpacity>
	      			)
	            })
	          }
	        </View>
	      </View>)
    else
      return(
        <View>
          <View style={{borderBottomWidth: 3, borderColor: 'gray', backgroundColor: 'white'}}>
            <TouchableOpacity onPress={() => {
              if(this.state.canShowMatches)
                this.props.navigator.pop()}}>
              <BackHeader />
            </TouchableOpacity>
          </View>
          <View style={styles.container}>  
            <View style={styles.match}>
              <Text style={styles.name}>No matches yet, play more games!</Text>
            </View>
          </View>
        </View>)
  	}
}

const styles = StyleSheet.create({
  container: {
    height:height,
    width:width,
    backgroundColor:'white',
    borderTopWidth: 2,
    borderColor: 'lightgrey',
    backgroundColor:'white',
    },
  match: {
  	justifyContent: 'center', 
  	alignItems: 'center',
  	height: 100,
  	borderBottomWidth: 2,
    borderColor: 'gray',
    backgroundColor:'white',
  },
  text: {
    color: '#2B2B2B',
    fontSize: 48,
    textAlign: 'center'
  },
  name: {
    color: '#2B2B2B',
    fontSize: 30,
    marginTop: 5,
    marginBottom: 2,
    textAlign: 'center'
  },
  work: {
    fontSize:15,
    marginBottom: 10,
    color:'#A4A4A4',
    textAlign: 'center'
  },
  bio: {
    fontSize:12,
    color:'black',
    textAlign: 'center'
  },
});