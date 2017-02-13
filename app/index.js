import React, {Component} from 'react';
import {
  StatusBar
} from 'react-native';

import {
  createRouter,
  NavigationProvider,
  StackNavigation,
} from '@exponent/ex-navigation';

import MaleHomeScreen from './screens/maleHome'
import FemaleHomeScreen from './screens/femaleHome'
import LoginScreen from './screens/login'
import ProfileScreen from './screens/profile'
import LoadingScreen from './screens/loading'
import QuestionsScreen from './screens/questions'
import DecisionScreen from './screens/matchDecision'

import * as firebase from 'firebase'

const firebaseConfig = {
  apiKey: "AIzaSyBVB94M-JVYod9Q1l3dGPNfUJhiNL-PBik",
  databaseURL: "https://dategame-4957f.firebaseio.com",
} 

firebase.initializeApp(firebaseConfig)

export const Router = createRouter(() => ({
  maleHome: () => MaleHomeScreen,
  femaleHome: () => FemaleHomeScreen,
  login: () => LoginScreen,
  profile: () => ProfileScreen,
  loading: () => LoadingScreen,
  questions: () => QuestionsScreen,
  matchDecision: () => DecisionScreen,
}))

export default class App extends Component {
  render() {
    return(
      <NavigationProvider router={Router}>
        <StatusBar barStyle="dark-content" />
        <StackNavigation initialRoute={Router.getRoute('loading')} />
      </NavigationProvider>
      )
  }
}