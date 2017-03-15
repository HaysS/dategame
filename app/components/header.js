import React, { Component } from 'react'
import {View, StyleSheet, Dimensions, Image} from 'react-native'

const {height, width} = Dimensions.get('window');
const size = 50;

export default Header = ({facebookID, style}) => {
  const fbImageUrl = `https://graph.facebook.com/${facebookID}/picture?height=${height}`

  return (
    <View style={styles.container}>
      <Image
        resizeMode='cover'
        source={{uri: fbImageUrl}}
        style={[{width: size, height: size, borderRadius: size/2}, style]}/>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop:30,
    justifyContent:'center',
    flexDirection:'row',
    height: size,
    backgroundColor:'transparent',
  }
})