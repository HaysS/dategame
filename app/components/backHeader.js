import React, { Component } from 'react'
import {View, StyleSheet, Dimensions} from 'react-native'
import {Ionicons} from '@exponent/vector-icons'

const {height, width} = Dimensions.get('window');
const size = 60;

export default BackHeader = () => {
  return (
    <View style={styles.container}>
      <Ionicons 
        name={'ios-arrow-dropleft'}
        size={size}
        color={'black'} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop:30,
    marginLeft: 25,
    marginRight: 25,
    height: size,
    width: size,
    backgroundColor:'transparent',
  }
})