 import React, { Component } from 'react';
 import {
   StyleSheet,
   Text,
   View,
   TouchableHighlight,
   NativeEventEmitter,
   NativeModules,
   Platform,
   PermissionsAndroid,
   ScrollView,
   AppState,
   FlatList,
   Dimensions,
 } from 'react-native';
 import BleManager from 'react-native-ble-manager';

 const window = Dimensions.get('window');

 const BleManagerModule = NativeModules.BleManager;
 const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);


class App extends Component {
   constructor(){
     super()

     this.state = {
       scanning:false,
       peripherals: new Map(),
       appState: ''
     }
   }

   componentDidMount() {
     AppState.addEventListener('change', this.handleAppStateChange);

     BleManager.start({showAlert: false});

     this.handlerDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral );
     this.handlerStop = bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan );


     if (Platform.OS === 'android' && Platform.Version >= 23) {
         PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
             if (result) {
               console.log("Permission is OK");
             } else {
               PermissionsAndroid.requestPermission(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
                 if (result) {
                   console.log("User accept");
                 } else {
                   console.log("User refuse");
                 }
               });
             }
       });
     }

   }

   handleAppStateChange = (nextAppState)=> {
     if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
       console.log('App has come to the foreground!')
       BleManager.getConnectedPeripherals([]).then((peripheralsArray) => {
         console.log('Connected peripherals: ' + peripheralsArray.length);
       });
     }
     this.setState({appState: nextAppState});
   }

   componentWillUnmount() {
     this.handlerDiscover.remove();
     this.handlerStop.remove();
   }

   handleStopScan=()=> {
     console.log('Scan is stopped');
     this.setState({ scanning: false });
   }

   startScan = ()=> {
     if (!this.state.scanning) {
       this.setState({peripherals: new Map()});
       BleManager.scan([], 3, true).then((results) => {
         console.log('scanning',results);
         console.log('Scanning...');
         this.setState({scanning:true});
       });
     }
   }

   handleDiscoverPeripheral = (peripheral)=>{
     var peripherals = this.state.peripherals;
     console.log('Got ble peripheral', peripheral);
     if (!peripheral.name) {
       peripheral.name = 'NO NAME';
     }
     peripherals.set(peripheral.id, peripheral);
     this.setState({ peripherals });
   }

   renderItem=(item)=> {
     const color = item.connected ? 'green' : '#fff';
     return (
         <View style={[styles.row, {backgroundColor: color}]}>
           <Text style={{fontSize: 12, textAlign: 'center', color: '#333333', padding: 10}}>{item.name}</Text>
           <Text style={{fontSize: 10, textAlign: 'center', color: '#333333', padding: 2}}>RSSI: {item.rssi}</Text>
           <Text style={{fontSize: 8, textAlign: 'center', color: '#333333', padding: 2, paddingBottom: 20}}>{item.id}</Text>
         </View>
     );
   }


   render() {
     const list = Array.from(this.state.peripherals.values());

     return (
       <View style={styles.container}>
         <TouchableHighlight style={{marginTop: 40,margin: 20, padding:20, backgroundColor:'#ccc'}} onPress={() => this.startScan() }>
           <Text>Scan Bluetooth ({this.state.scanning ? 'on' : 'off'})</Text>
         </TouchableHighlight>
         <ScrollView style={styles.scroll}>
           {(list.length == 0) &&
             <View style={{flex:1, margin: 20}}>
               <Text style={{textAlign: 'center'}}>No peripherals</Text>
             </View>
           }
           <FlatList
             data={list}
             renderItem={({ item }) => this.renderItem(item) }
             keyExtractor={item => item.id}
           />

         </ScrollView>
       </View>
     );
   }
 }

 const styles = StyleSheet.create({
   container: {
     flex: 1,
     backgroundColor: '#FFF',
     width: window.width,
     height: window.height
   },
   scroll: {
     flex: 1,
     backgroundColor: '#f0f0f0',
     margin: 10,
   },
   row: {
     margin: 10
   },
 });
 export default  App;
