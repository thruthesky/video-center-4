import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import { NgbdModalDeviceMenu } from '../ngbootstrap/modal/device-menu.component';
import * as xInterface from '../../app/app.interface';
import { VideocenterService } from '../../providers/videocenter.service';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html'
})
export class LobbyComponent {
  myUsername: string;
  inputUsername: string;
  inputRoomname: string;
  inputMessage: string;
  updateUsername: boolean = false;
  createRoom: boolean = false;
  chatDisplay: boolean = false;
  settingsDisplay: boolean = false;
  rooms: xInterface.ROOMS = <xInterface.ROOMS> {};
  listMessage: xInterface.MESSAGELIST = <xInterface.MESSAGELIST> {};
  constructor( private router: Router,
  private vc: VideocenterService, private modalService: NgbModal  ) {
    this.validate();
    this.initialize();
    this.joinLobby();
    this.listenEvents();
  }
  /**
  *@desc This method will validate if there is username
  */
  validate() {
    let name = localStorage.getItem('username');
    let room = localStorage.getItem('roomname');
    if( name ) {
      this.vc.updateUsername( name, re => {});
      if ( room && room != xInterface.LobbyRoomName ) { 
        this.router.navigate(['room']);   
      }
    }
    else {
      this.vc.leaveRoom( ()=> {
        this.router.navigate(['entrance']);
      }); 
    } 
  }
  /**
  *@desc This method will initialize the roompage
  */
  initialize() {
    this.inputMessage = '';
    if ( this.listMessage[0] === void 0 ) this.listMessage[0] = { messages: [] };
  }
  /**
  *@desc This method will join the lobby then
  *will get the username and get all user in roomlist
  */
  joinLobby() {
    let room = localStorage.getItem('roomname');
    if ( room && room != xInterface.LobbyRoomName ) this.router.navigate(['room']);
    else {
      this.vc.joinRoom( xInterface.LobbyRoomName, ( room: string ) => {
        this.myUsername = localStorage.getItem('username');
        this.getUserList();

      });
    }
  }
  /**
  *@desc This method will get all the room list and user list
  *and pass it to showRoomList
  */
  getUserList() {
    this.vc.getUserList( '', ( users: { (key: string) : Array<xInterface.USER> } ) => {
      this.showRoomList( users );
    });
  }
  /**
  *@desc This method will loop through all the users and
  *and display it
  *@param re
  */
  showRoomList( users: { (key: string) : Array<xInterface.USER> } ) {
    for ( let socket_id in users ) {
      let user: xInterface.USER = users[socket_id];
      if(!user.room) continue;
      let room_id = <string> this.vc.md5( user.room );   
      if ( this.rooms[ room_id ] === void 0 ) this.initRoomOnRoomList( user );
      let myuser = this.rooms[ room_id ].users; 
      this.userSpliceList(user, myuser );  
      this.rooms[ room_id ].users.push( user );    
    }
  }
  /**
  *@desc This method will initialize rooms
  *if it's not yet initialized
  *@param user
  */
  initRoomOnRoomList( user ) {
    let room_id = this.vc.md5( user.room );   
    this.rooms[ room_id ] = { name: user.room, users: [] };   
  }
  /**
  *@desc This method will run the userSpliceList
  *@param user
  */
  removeUserList( user ) {  
    for ( let room_id in this.rooms ) {
      let users = this.rooms[ room_id ].users;      
      this.userSpliceList(user, users );
    }  
  }
  /**
  *@desc This method will find a match on the given paramter 
  *and splice it
  *@param user, users
  */
  userSpliceList( user, users ) {
    if ( users.length ) {
      for( let i in users ) {
        if ( users[i].socket == user.socket ) {
            users.splice( i, 1 );
        }
      }
    }
  }
  /**
  *@desc This method is use in the view to list all the roomids
  *@example *ngFor = " let id of roomIds "
  */
  get roomIds () {
    return Object.keys( this.rooms );
  } 
  /**
  *@desc Group of View Method
  */

  /**
  *@desc This method will show the settings in lobby
  */
  onClickMenu() {
    this.settingsDisplay = ! this.settingsDisplay;
    this.updateUsername = false;
    this.createRoom = false;
    this.chatDisplay = false;
  }
 
  /**
  *@desc This method will toggle chat function
  */
  onToggleChat() {
    this.chatDisplay = ! this.chatDisplay;
    this.createRoom = false;
    this.settingsDisplay = false;
    this.updateUsername = false;
  }
  /**
  *@desc This method will toggle update name
  */
  onToggleUpdateName() {
    this.updateUsername = ! this.updateUsername;
    this.createRoom = false;
    this.settingsDisplay = false;
    this.chatDisplay = false;
  }
  /**
  *@desc This method will toggle create room
  */
  onToggleCreateRoom() {
    this.createRoom = ! this.createRoom;
    this.settingsDisplay = false;
    this.updateUsername = false;
    this.chatDisplay = false;
    
  }
  /**
  *@desc This method will show the device settings in lobby
  */
  onClickDevice() {
    this.hideAllDisplay();
    this.modalService.open(NgbdModalDeviceMenu);
  }
  /**
  *@desc This method will show a menu modal with video settings
  */
  onClickVideo() {
    this.onClickDevice();
    let data = { eventType: "show-video-settings"};
    setTimeout(()=>{ this.vc.myEvent.emit(data); }, 100); 
  }
  /**
  *@desc This method will show a menu modal with audio settings
  */
  onClickAudio() {
    this.onClickDevice();
    let data = { eventType: "show-audio-settings"};
    setTimeout(()=>{ this.vc.myEvent.emit(data); }, 100); 
  }
  /**
  *@desc This method will go to entrance page
  *after you logout in the server
  */
  onClickLogout() {
    this.vc.logout(()=> {
      this.router.navigate(['entrance']);
    });    
  }
  /**
  *@desc This method will update the username of user
  */
  onUpdateUsername() {
    if ( ! this.inputUsername ) return alert("Your Username input is empty!");
    this.vc.updateUsername(this.inputUsername, ( user: xInterface.USER ) => {
      this.inputUsername = "";
      this.myUsername = user.name;
      this.updateUsername = false;
    });
  }
  /**
  *@desc This method will createroom in the server then 
  *invoke the joinRoom callback
  */
  onCreateRoom(  ) {
    if( !this.inputRoomname) {
      alert("Your Roomname input is empty!"); 
      return;
    }
    if( this.inputRoomname == xInterface.LobbyRoomName || this.inputRoomname == 'lobby' ) {
      alert("You can\'t create the Lobby!");
      return;
    }
    this.vc.createRoom( this.inputRoomname, ( room ) => {
      this.joinRoom( room );
    });
  }
  /**
  *@desc This method is is use to successfully
  * create a room if the user input is not empty
  *@param roomname 
  */
  onJoinRoom( roomname ) {
    if( roomname == xInterface.LobbyRoomName ) {
      alert("You can\'t join the Lobby!");
      return;
    }   
    this.joinRoom( roomname );
  }
  /**
  *@desc This method will send the message to the server
  *after that it will empty the message input box
  *@param message 
  */  
  onSendMessage(message: string) {
    if(message != "") this.vc.sendMessage(message, ()=> { 
      this.inputMessage = ''; 
    });
  }
  hideAllDisplay() {
    this.settingsDisplay = false;
    this.updateUsername = false;
    this.createRoom = false;
    this.chatDisplay = false;
  }
  /**
  *@desc This method will subscribe to all events
  */
  listenEvents() {
    this.vc.myEvent.subscribe( item => {
      if( item.eventType == "update-username")this.updateUserOnUserList( item );
      if( item.eventType == "join-room") this.onJoinRoomEvent( item );
      if( item.eventType == "leave-room") this.onLeaveRoomEvent( item );
      if( item.eventType == "chatMessage") this.addMessage( item );
      if( item.eventType == "log-out") this.removeUserList( item );
      if( item.eventType == "disconnect") this.onDisconnectEvent( item );

    });
  }
  /**
  *@desc Groups of onevent Method 
  */ 
  /**
  *@desc This method will add user in roomlist
  *@param re
  */
  addUserList( user ) {
    let room_id = this.vc.md5( user.room );
    if ( this.rooms[ room_id ] === void 0 ) this.initRoomOnRoomList( user );      
    this.rooms[ room_id ].users.push( user );
  }
  /**
  *@desc This method will find a match on the given user parameter 
  *and update it in userlist
  *@param re
  */
  updateUserOnUserList( user ) {  
    let room_id = this.vc.md5( user.room );   
    if ( this.rooms[ room_id ] === void 0 ) this.initRoomOnRoomList( user );
    let users = this.rooms[ room_id ].users;        
    for(let i in users) { 
      if( users[i].socket === user.socket) {
        this.rooms[ room_id ].users[i] = user;
        break;
      }          
    }    
  }
 
  /**
  *@desc This method will invoke all the methods
  *that will be use after receiving the join room
  *@param data
  */
  onJoinRoomEvent( data ) {  
    this.removeUserList( data );
    this.addUserList( data );
    this.joinMessage( data ); 
  }
  /**
  *@desc This method will delete the room
  *inside roomlist
  *@param data
  */
  onLeaveRoomEvent( data ) {
    if( data.room == xInterface.LobbyRoomName ) return;  
    let room_id = this.vc.md5( data.room );    
    delete this.rooms[ room_id ];    
  }
  /**
  *@desc This method will invoke all the methods
  *that will be use after receiving the disconnect
  *@param data
  */
  onDisconnectEvent( data ) {  
    this.removeUserList( data );
    this.disconnectMessage( data ); 
  }
  /**
   *@desc Add to listMessage to be displayed in the view
   *@param message 
   */  
  addMessage( message ) {     
    this.listMessage[0].messages.push( message );
    let data = { eventType: "scroll-to-bottom"};
    setTimeout(()=>{ this.vc.myEvent.emit(data); }, 100); 
  }
  /**
   *@desc Add to listMessage to be displayed in the view
   *@param message 
   */ 
  joinRoom( roomname ) {
    localStorage.setItem('roomname', roomname);  
    this.router.navigate(['room']);
  }
  /**
   *@desc This method will create a join message variable that
   *will be pass in addMessage
   *@param data 
   */  
  joinMessage( data ){
    let message = { name: data.name, message: ' joins into ' + data.room };
    this.addMessage( message ); 
  }
  /**
   *@desc This method will create a disconnect message variable that
   *will be pass in addMessage
   *@param data 
   */ 
  disconnectMessage( data ){
    if( data.room ){
      let message = { name: data.name, message: ' disconnect into ' + data.room };
      this.addMessage( message );
    } 
  }
}
