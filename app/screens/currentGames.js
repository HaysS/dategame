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

export default class CurrentGames extends Component {
	componentWillMount() {
	    this.state = { 
	      games: [],
	      user: this.props.user,
	    }
  	}

  componentDidMount() {
    FirebaseAPI.getGamesWithKey(this.state.user.uid, (game) => {
       if(game != undefined) {
          const newGames = [...this.state.games, game]

          this.setState({games: newGames})
        }
      })
  }

  renderStartGameTouchable() {
    if(this.state.games.length <= 3)
      return(<TouchableOpacity onPress={() => {this.startNewGame()}} 
            key={"newgame-touchable"} >
              <View style={styles.game}  key={"newgame-container"}>
                <Text style={styles.name} key={'newgame-name'}>Start a New Game</Text>
              </View>
            </TouchableOpacity>)
    else
      return(<View />)
  }   

  openGame(game) {
    this.props.navigator.push(Router.getRoute('game', {user: this.state.user, game: game}))
  }

  getProfileNamesFromGame(game) {
    return game.profilesInfo.map((profile) => {
      if(profile.uid != this.state.user.uid) 
        return profile.name
    }).filter((name) => {
      if(name != null)
        return name
    })
  }

  startNewGame() {
    this.props.navigator.push(Router.getRoute('game', {user: this.state.user}))
  }

	render() {
    if(this.state.games[0] != null)
	    return(
	      <View>
	      	<View style={{borderBottomWidth: 3, borderColor: 'gray', backgroundColor: 'white'}}>
		        <TouchableOpacity onPress={() => {this.props.navigator.pop()}}>
		          <BackHeader />
		        </TouchableOpacity>
	        </View>
	        <View style={styles.container}>  
	          {
              this.state.games.map((game) => {
                const names = this.getProfileNamesFromGame(game)

                return (
                  <TouchableOpacity onPress={() => {this.openGame(game)}} 
                  key={game.id+"-touchable"} >
                    <View style={styles.game}  key={game.id+"-container"}>
                      <Text style={styles.name} key={game.id+'-name'}>{names[0]} & {names[1]}</Text>
                    </View>
                  </TouchableOpacity>
                )
              })
            }
            {this.renderStartGameTouchable()}
	        </View>
	      </View>)
    else
      return(
        <View>
          <View style={{borderBottomWidth: 3, borderColor: 'gray', backgroundColor: 'white'}}>
            <TouchableOpacity onPress={() => {this.props.navigator.pop()}}>
              <BackHeader />
            </TouchableOpacity>
          </View>
          <View style={styles.container}>  
            {this.renderStartGameTouchable()}
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
  game: {
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