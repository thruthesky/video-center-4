/// <reference path="../d.ts/rmc.d.ts" />
import { Injectable, EventEmitter } from '@angular/core';
import { Md5 } from 'ts-md5/dist/md5';
import { videoCenterServerUrl } from '../app/app.interface';
@Injectable()
export class VideocenterService {
  socketUrl: string = videoCenterServerUrl;
  static socket:any = false;
  static connection: any;
  public myEvent: EventEmitter<any>;
  constructor() {
    console.log('Hello VideocenterService Provider');
    this.myEvent = new EventEmitter();
  }
  /**
   * @desc This method will get the socket
   */
  get socket() {
    return this.getSocket();
  }
  /**
   * @desc This method will return the socket
   */
  getSocket() {
    if ( VideocenterService.socket === false ) {
        VideocenterService.socket = VideocenterService.connection.getSocket();
    }
    return VideocenterService.socket;
  }
  /**
   * @desc This method will connect to 
   * RTCMultiConnection Server 
   */
  connect() {
    console.log("Videocenter::connect()");
    VideocenterService.connection = new RTCMultiConnection();
    VideocenterService.connection.socketURL = this.socketUrl;
    this.initializeConnection();
    this.listen();
  }
  initializeConnection() {
    let connection: any = <any> VideocenterService.connection;
    connection.enableFileSharing = false;
    connection.session = {
        audio: true,
        video: true,
        data : false
    };
    connection.sdpConstraints.mandatory = {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
    };
    connection.getExternalIceServers = false;
    connection.iceServers = [];
    // connection.candidates = {
    //   turns: true,
    //   stun: false,
    //   host: false
    // };
    connection.iceServers.push({
        urls: 'turn:english.withcenter.com:3478',
        username: 'test_username1',
        credential: 'test_password1'
    });
    // connection.iceServers.push({
    //     urls: 'turn:video.withcenter.com:3478',
    //     username: 'test_username1',
    //     credential: 'test_password1'
    // });
    connection.bandwidth = {
        audio: 50,
        video: 256,
        data: 163840,
        screen: 300
    };
  }
  /**
   * @desc This Method will emit a protocol in the server
   * @param protocol - name of socket event
   * @param data - any class of data for example username, roomname, message
   * @param callback - this will be invoke after the server invoke it
   */
  emit( protocol: string, data?: any, callback?: boolean | any ) {
    if ( callback ) this.socket.emit( protocol, data, callback );
    else this.socket.emit( protocol, data );
  }

  /**
   * @desc Group of methods to communicate
   * in the Server
   */

  /**
   * @desc This method will update the username
   * @param username, callback
   */
  updateUsername( username: string, callback: ( user:any ) => void ) {
    this.emit( 'update-username', username, ( user: any ) => {
      localStorage.setItem('username', user.name);
      callback( user );
    });
  }
  /**
   * @desc This method will send the message
   * @param username, callback
   */
  sendMessage( inputMessage: string, callback : any ) : void {
    this.emit('chat-message', inputMessage, callback);
  }
  /**
   * @desc This method will create a room 
   * @param roomname, callback
   */
  createRoom( roomname: string, callback) {
    this.emit( 'create-room', roomname, room => {
      localStorage.setItem('roomname', room);
      callback( room );
    });
  }
  /**
   * @desc This method will join a room 
   * @param roomname, callback
   */
  joinRoom( roomname: string, callback: ( room:any ) => void ) {
    this.emit('join-room', roomname, user => {
      localStorage.setItem('roomname', user.room);
      callback( user );
    });
  }
  /**
   * @desc This method will get all the user in roomlist
   * @param roomname, callback
   */
  getUserList( roomname: string, callback : any ) : void {
    this.emit('user-list', roomname, callback);
  }
  /**
   * @desc This method will logout the user
   * @param  callback
   */ 
  logout( callback ) {
    localStorage.setItem('username', '');
    this.emit('log-out', callback );
  }
   /**
   * @desc This method will leave the user in the room
   * @param  callback
   */ 
  leaveRoom( callback ) {
    this.emit('leave-room', callback );
  }
  /**
   * @desc This method will pass the whiteboard data to server
   * @param data, callback
   */
  whiteboard( data, callback : any ) : void {
    this.emit('whiteboard', data, callback);
  }
  /**
   * @desc This Method listens to socket event and
   * pass it to eventEmmiter
   */
  
  listen() {
    let socket = this.socket;

    socket.on('update-username', data => {
      data.eventType = "update-username";
      this.myEvent.emit(data);
    });
    socket.on('join-room', data => {
      data.eventType = "join-room";
      this.myEvent.emit(data);
    });
    socket.on('leave-room', data => {
      let item = {room:data, eventType: "leave-room"};
      this.myEvent.emit(item);
    });
    socket.on('room-cast', re => {
    });
    socket.on('you-are-new-owner', re => {
    });
    socket.on('chatMessage', data => {
      data.eventType = "chatMessage";
      this.myEvent.emit(data);
    });
    socket.on('whiteboard', data => {
      data.eventType = "whiteboard";
      console.log("whiteboard:",data);
      this.myEvent.emit(data);
    });
    socket.on('log-out', data => {
      data.eventType = "log-out";
      this.myEvent.emit(data);
    });
    socket.on('disconnect', data => {
      if(typeof data !== "string" )data.eventType = "disconnect";
      this.myEvent.emit(data);
    });
  }

  /**
   * @desc Groups of other Functionality
   */

  /**
   * @desc This method will get a string paramter 
   * and return it on md5
   * @param str
   */
  md5( str: string ) : string {
    let md = new Md5();
    md.appendStr( str );
    return <string> md.end();
  }
  /**
   * @desc This method will return a random number
   * base on min, max parameter
   * @param min, max
   */
  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }
}
