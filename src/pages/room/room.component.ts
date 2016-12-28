import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as xInterface from '../../app/app.interface';
import { VideocenterService } from '../../providers/videocenter.service';
// import { FirebaseStorage } from '../firebase-api/firebase-storage';
@Component({
  selector: 'app-room',
  templateUrl: './room.component.html'
})
export class RoomComponent {
  myRoomname: string;
  myName: string = null;
  inputMessage: string;
  imageUrlPhoto: string; 
  canvasPhoto: string;
  connection:any;
  videos:any =[];
  audios: any = [];
  position: any = null;
  file_progress: any = null;
  
  listMessage: xInterface.MESSAGELIST = <xInterface.MESSAGELIST> {};
  wb: xInterface.WhiteboardSetting = xInterface.whiteboardSetting;
  vs: xInterface.VideoSetting = xInterface.videoSetting;
  show: xInterface.DisplayElement = xInterface.displayElement;
  
  //displayWhiteboard: boolean = false;
  constructor( private router: Router,
  // private fileStorage: FirebaseStorage,
  private vc: VideocenterService ) {
    this.validate();
    this.initialize();
    this.joinRoom();
    this.streamOnConnection();
    this.showSettings();
    this.listenEvents();
   }
  /**
  *@desc This method will validate if there is username and room
  */
  validate() {
    this.myName = localStorage.getItem('username');
    let room = localStorage.getItem('roomname');
    if ( this.myName ) {
      this.vc.updateUsername( this.myName, re => {});
      if( room == xInterface.LobbyRoomName){
        setTimeout(()=>{
        this.vc.leaveRoom( ()=> {
          
          this.router.navigate(['lobby']);
          
        });
        },100);
      }
    } else {
      this.vc.leaveRoom( ()=> {
        this.router.navigate(['entrance']);
      });
    } 
  }
  /**
  *@desc This method will initialize 
  *the some of the properties of RoomPage
  */
  initialize() {
    this.vs.defaultAudio = false;
    this.vs.defaultVideo = false;
    this.inputMessage = '';
    if ( this.listMessage[0] === void 0 ) this.listMessage[0] = { messages: [] };
    this.wb.whiteboardDisplay = false;
    this.wb.selectDrawSize = this.wb.size[0].value;
    this.wb.selectDrawColor = this.wb.colors[0].value;
    this.wb.selectSizeCanvas = this.wb.sizeCanvas[0].value;
    this.imageUrlPhoto = this.wb.canvasPhoto;
    this.canvasPhoto = this.wb.canvasPhoto;
    this.connection = VideocenterService.connection;
    this.connection.extra = {
      myname: 'JaeHo Song'
    };

      this.connection.sdpConstraints.mandatory = {
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: true
      };
    
  }
  /**
  *@desc This method will invoke the setCanvasSize and setDefaultDevice Method
  */
  ngOnInit() {
    
    this.setDefaultDevice();
    //let videoParent = document.getElementById('video-container');
    //videoParent.setAttribute('whiteboard', 'false');
    // this.displayWhiteboard = false;
  }
 
  /**
  *@desc This method will set the default device to be use
  */
  setDefaultDevice() {
    let videoSourceId = localStorage.getItem('default-video');
    let audioSourceId = localStorage.getItem('default-audio');
    if ( videoSourceId ) this.onChangeVideo( videoSourceId );
    if ( audioSourceId ) this.onChangeAudio( audioSourceId );
  }
  
      
  /**
  *@desc This method will get roomname then join the roomname
  */
  joinRoom() {
    let room = localStorage.getItem('roomname');
    this.vc.joinRoom( room, (data)=> {
      this.myRoomname = data.room;
      this.getWhiteboardHistory( data.room );
      this.openOrJoinSession( data.room );
    });
  }

  /**
  *@desc This method will check if there is new stream
  *then invoke addUserVideo to add new stream
  */
  streamOnConnection() {
    this.connection.onstream = (event) => this.addUserVideo( event ); 
  }

  /**
  *@desc This method will get the whiteboard history of the room
  *@param roomName 
  */
  getWhiteboardHistory( roomName ) {
    let data :any = { room_name : roomName };
    data.command = "history";
    this.vc.whiteboard( data,() => { console.log("get whiteboard history")} );
  }
  /**
  *@desc This method will open or join a session to have a video conference
  *if the roomName is not lobby
  *@param roomName
  */
  openOrJoinSession( roomName ) {
    if( roomName !== xInterface.LobbyRoomName ) {
      this.connection.openOrJoin( roomName, (roomExist) => {
        if(roomExist)console.log("I Join the Room");
        else console.log("I Open the Room");
        this.connection.socket.on( this.connection.socketCustomEvent, message => { } );
        this.connection.socket.emit( this.connection.socketCustomEvent, this.connection.userid);
      });
    }
  }
  /**
  *@desc This method will add device for video select and audio select
  */
  showSettings() {
    let room = localStorage.getItem('roomname');
     setTimeout(()=>{
       if( room !== xInterface.LobbyRoomName ) {
        this.connection.getUserMedia(()=> {
            this.connection.DetectRTC.load(() => {
            this.connection.DetectRTC.MediaDevices.forEach((device) => {
              this.addVideoOption( device );
              this.addAudioOption( device );
            });
            this.setDefaultAudioSelected();
            this.setDefaultVideoSelected();
          });
        });
       }
    }, 1000);
  }
  /**
  *@desc This method will add video options on video select
  *@param device 
  */
  addVideoOption( device ) {
    if(device.kind.indexOf('video') !== -1) {
      let video = {
        text: device.label || device.id,
        value: device.id
      };
      this.videos.push( video );
    }
  }
  /**
  *@desc This method will add audio options on audio select
  *@param device
  */
  addAudioOption ( device ) {
    if(device.kind === 'audioinput') {
      let audio = {
          text: device.label || device.id,
          value: device.id
        };
      this.audios.push( audio );
    }
  }
  /**
  *@desc This method will set the selected audio from storage
  */
  setDefaultAudioSelected(){
    let audio = localStorage.getItem('default-audio')
    if(audio)this.vs.selectAudio = audio;
    else this.vs.selectAudio = '';
  }
  /**
  *@desc This method will set the selected video from storage
  */
  setDefaultVideoSelected(){
    let video = localStorage.getItem('default-video')
    if(video)this.vs.selectVideo = video;
    else this.vs.selectVideo = '';
  }
  /**
  *@desc Group of View Method
  */

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
  
  /**
  *@desc This method will show the settings in room
  */
  onClickMenu() {
    this.show.settingsDisplay = ! this.show.settingsDisplay;
  }
  /**
  *@desc This method will Leave the room and go back to lobby
  */
  onClickLobby() {
    this.vc.leaveRoom( ()=> {
      localStorage.setItem('roomname', xInterface.LobbyRoomName );
      location.href= "/";
    });
  }
  /**
  *@desc This method will toggle the whiteboard
  *and get whiteboard history
  */
  onClickWhiteboard() {
    let room = localStorage.getItem('roomname');
    // let videoParent = document.getElementById('video-container');
    this.wb.whiteboardDisplay = ! this.wb.whiteboardDisplay;
    if(this.wb.whiteboardDisplay){
      setTimeout(()=>{
        //this.displayWhiteboard = true;
        //videoParent.setAttribute('whiteboard', 'true');
        let data :any = { room_name :room };
        data.command = "show-whiteboard";
        this.getWhiteboardHistory( room );
        this.setCanvasSize( this.wb.canvasWidth, this.wb.canvasHeight);
        this.vc.whiteboard( data,() => { console.log("show whiteboard")} );
        this.wb.optionSizeCanvas = 'small';
        this.checkCanvasSize( 'small' );
      },100);
    } else {
        //this.displayWhiteboard = false;
        //videoParent.setAttribute('whiteboard', 'false');
        let data :any = { room_name :room };
        data.command = "hide-whiteboard";
        this.vc.whiteboard( data,() => { console.log("hide whiteboard")} );
    }
  }
  
  /**
   *@desc Group Method for Audio and Video
   */
  /**
   *@desc This method will first check
   *if the userid is others or his/her self
   */
  addUserVideo( event ) {
    if( this.connection.userid == event.userid ) this.addLocalVideo( event ); 
    else this.addRemoteVideo( event ); 
    
  }
  /**
   *@desc This method will add 
   *local video stream
   *@param event
   */
  addLocalVideo( event ) {
    console.log("event: ", event);
    setTimeout(()=> {
      let newDiv = document.createElement("div");
      let newVideo = event.mediaElement;
      let videoParent = document.getElementById('video-container');
      let oldVideo = document.getElementById(event.streamid);
      newDiv.setAttribute('class', 'me');
      if( oldVideo && oldVideo.parentNode) {
        let myParentNode = oldVideo.parentNode;
        if( myParentNode && myParentNode.parentNode)myParentNode.parentNode.removeChild(myParentNode);
      }
      if( videoParent ) {
        newDiv.appendChild( newVideo );
        videoParent.insertBefore(newDiv, videoParent.firstChild);
      }
    },700);
  }
  /**
   *@desc This method will add 
   *remote video stream
   *@param event
   */
  addRemoteVideo( event ) {
    console.log("event: ", event);
    setTimeout(()=> {
      let newDiv = document.createElement("div");
      let newVideo = event.mediaElement;
      let videoParent = document.getElementById('video-container');
      let oldVideo = document.getElementById(event.streamid);
      newDiv.setAttribute('class', 'other');
      if( oldVideo && oldVideo.parentNode) {
        let myParentNode = oldVideo.parentNode;
        if( myParentNode && myParentNode.parentNode)myParentNode.parentNode.removeChild(myParentNode);
      }
      if( videoParent ) {
        newDiv.appendChild( newVideo );
        videoParent.appendChild( newDiv );
      }
    },700);
  }
  /**
  *@desc This method will change video device
  *@param videoSourceId
  */
  onChangeVideo( videoSourceId ) {
    if( this.vs.defaultVideo )  if(this.videoSelectedAlready( videoSourceId )) return;
    localStorage.setItem('default-video', videoSourceId );
    this.removeVideoTrackAndStream();
    this.removeAudioTrackAndStream();
    this.connection.mediaConstraints.video.optional = [{
        sourceId: videoSourceId
    }];
    let video = document.getElementsByClassName('me')[0];
    if(video) {
      video.parentNode.removeChild( video );
      this.connection.captureUserMedia( ()=> {
        this.connection.renegotiate();
      });
    }
    this.vs.defaultVideo = true;
  }
  /**
  *@desc This method will check if video is already selected
  *@param videoSourceId
  *@return result 
  */
  videoSelectedAlready( videoSourceId ) {
    let result = 0;
    let videoOptionalLength = this.connection.mediaConstraints.video.optional.length;
    let attachStreamsLength = this.connection.attachStreams.length;
    
    if( videoOptionalLength && attachStreamsLength ) {
      if(this.connection.mediaConstraints.video.optional[0].sourceId === videoSourceId) {
          alert('Selected video device is already selected.');
          result = 1;
      }
    }
    return result;
  }
  /**
  *@desc This method will remove the track and stream of video
  */
  removeVideoTrackAndStream() {
    this.connection.attachStreams.forEach((stream) =>{
      stream.getVideoTracks().forEach((track) =>{
        stream.removeTrack(track);
        if(track.stop)track.stop();
      });
    });
  }

  /**
  *@desc This method will change audio device
  *@param audioSourceId
  */
  onChangeAudio( audioSourceId ) {
    if( this.vs.defaultAudio ) if(this.audioSelectedAlready( audioSourceId )) return;
    localStorage.setItem('default-audio', audioSourceId );
    this.removeAudioTrackAndStream();
    this.removeVideoTrackAndStream();
    this.connection.mediaConstraints.audio.optional = [{
        sourceId: audioSourceId
    }];
    let video = document.getElementsByClassName('me')[0];
    if(video) {
      video.parentNode.removeChild( video );
      this.connection.captureUserMedia( ()=> {
        this.connection.renegotiate();
      });
    }
    this.vs.defaultAudio = true;
  }
  /**
  *@desc This method will check if audio is already selected
  *@param audioSourceId
  *@return result 
  */
  audioSelectedAlready( audioSourceId ) {
    let result = 0;
    let attachStreamsLength = this.connection.attachStreams.length;
    let audioOptionalLength = this.connection.mediaConstraints.audio.optional.length;
    if( audioOptionalLength && attachStreamsLength) {
      if(this.connection.mediaConstraints.audio.optional[0].sourceId === audioSourceId) {
          alert('Selected audio device is already selected.');
          result = 1;
      }
    }
    return result;
  }
  /**
  *@desc This method will remove the track and stream of audio
  */
  removeAudioTrackAndStream() {
    this.connection.attachStreams.forEach((stream) =>{
      stream.getAudioTracks().forEach((track) =>{
        stream.removeTrack(track);
        if(track.stop)track.stop();
      });
    });
  }
  /**
  *@desc This method will change the imageUrlPhoto to samplePic
  */
  onClickSamplePreview(pic) {
    if( pic == 1 ) this.imageUrlPhoto = this.wb.canvasPhoto;
    if( pic == 2 ) this.imageUrlPhoto = xInterface.samplePics.pic1;
    if( pic == 3 ) this.imageUrlPhoto = xInterface.samplePics.pic2;
    
  }
  /**
  *@desc This method will invoke the changeCanvasPhoto
  */
  onClickPreviewPhoto() {
    this.changeCanvasPhoto( this.imageUrlPhoto );
    let room = localStorage.getItem('roomname');
    let data :any = { room_name :room };
    data.image_url = this.imageUrlPhoto;
    data.command = "change-image";
    this.vc.whiteboard( data,() => { console.log("change canvas image")} );
  }
  /**
  *@desc This method will change the canvasPhoto to imageUrlPhoto
  */
  changeCanvasPhoto( image ) {
    let whiteboardcontainer = document.getElementById('whiteboard-container');
    if(whiteboardcontainer)whiteboardcontainer.style.backgroundImage="url('"+ image+"')";
  }
  /**
  *@desc This method will set the dataPhoto for upload
  *then upload it
  *@param event
  */
  onChangeFile( event ) {
    // let file = event.target.files[0];
    // if ( file === void 0 ) return;
    // this.file_progress = true;
    // let ref = 'vc4/' +  file.name;
    // this.fileStorage.upload( { file: file, ref: ref }, uploaded => {
    //   this.onFileUploaded( uploaded.url, uploaded.ref );
    //  },
    //   e => {
    //       this.file_progress = false;
    //       alert(e);
    //   },
    //   percent => {
    //       this.position = percent;
    //   } );
  }
  /**
  *@desc This method will be fired after uploading the image
  *@param url, ref
  */
  onFileUploaded( url, ref ) {
    this.file_progress = false;
    this.imageUrlPhoto = url;
  }
  /**
   * @desc Group for Whiteboard Functionality
   */

  /**
   *@desc This method clear the canvas
   */
  onClickClear() {
    let data = { eventType: "click-clear-canvas"};
    this.vc.myEvent.emit(data);
  } 
  /**
   *@desc This method will change the optionDrawMode to l - line
   */
  onClickDrawMode() {
    this.wb.optionDrawMode = "l";
  } 
  /**
   *@desc This method will change the optionDrawMode to e - erase
   */
  onClickEraseMode() {
    this.wb.optionDrawMode = "e";
  }
  /**
  *@desc This method will pass the size to
  *changeCanvasSize and broadcast to the room
  *@param size
  */
  onChangeCanvasSize( size ) {
    this.wb.optionSizeCanvas = size;
    this.checkCanvasSize( size );
    // let room = localStorage.getItem('roomname');
    // let data :any = { room_name :room };
    // data.command = "canvas-size";
    // data.size = size;
    // this.vc.whiteboard( data,() => { console.log("change canvas size")} );
  }
  /**
  *@desc This method will change the size of canvas
  *and container then get whiteboard history
  *@param size
  */
  checkCanvasSize( size ) {
    let room = localStorage.getItem('roomname');
    let w, h;
      if ( size == 'small' ) { w = '320px'; h = '400px'; }
      else if ( size == 'medium' ) { w = '480px'; h = '600px'; }
      else if ( size == 'large' ) {w = '640px';h = '800px';}
      this.setCanvasSize( w, h );
      this.setCanvasContainerSize( size );
      this.getWhiteboardHistory( room );
  }
  /**
   *@desc This method will set the canvas size
   *@param width
   *@param height
   */
  setCanvasSize( width, height ) {
     let mycanvas= document.getElementById('mycanvas');
     mycanvas.setAttribute('width', width);
     mycanvas.setAttribute('height', height);
  }
  /**
   *@desc This method will set the canvas container size
   *@param size
   */
  setCanvasContainerSize( size ) {
     let container= document.getElementById('whiteboard-container');
     container.setAttribute('size', size);
  }
  /**
  *@desc This method will subscribe to all events
  */
  listenEvents() {
    this.vc.myEvent.subscribe( item => {
      if( item.eventType == "join-room") this.onJoinRoomEvent( item );
      if( item.eventType == "chatMessage") this.addMessage( item );
      if( item.eventType == "disconnect") this.onDisconnectEvent( item );
      if( item.eventType == "whiteboard")  this.onWhiteboardEvent( item ); 
    });
  }
  /**
  *@desc Groups of onevent Method 
  */

  /**
  *@desc This method will invoke all the methods
  *that will be use after receiving the join room
  *@param data
  */
  onJoinRoomEvent( data ) {  
    this.joinMessage( data ); 
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
  *@desc This method will invoke all the methods
  *that will be use after receiving the disconnect
  *@param data
  */
  onDisconnectEvent( data ) {
    this.disconnectMessage( data );
    this.reloadPage(); 
  }
  reloadPage() {
    let random = this.vc.getRandomInt(0,500);
    setTimeout( ()=> {
       location.href= "/";
      //  location.reload();
       }, random);
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
  /**
  *@desc This method will invoke the method depending on data.command
  *@param data
  */
  onWhiteboardEvent( data ) {  
    if ( data.command == 'canvas-size' ) {
        this.checkCanvasSize(data.size);
    }
    else if ( data.command == 'show-whiteboard' ) {
        //let videoParent = document.getElementById('video-container');
        //videoParent.setAttribute('whiteboard', 'true');
        //this.displayWhiteboard = true; 
        this.wb.whiteboardDisplay = true;
        this.getWhiteboardHistory( data.room_name );
        setTimeout(()=>{
          this.setCanvasSize( this.wb.canvasWidth, this.wb.canvasHeight);
          this.wb.optionSizeCanvas = 'small';
          this.checkCanvasSize( 'small' );  
        }, 100);
    }     
    else if ( data.command == 'hide-whiteboard' ) {
        this.wb.whiteboardDisplay = false;
        //this.displayWhiteboard = false;
        //let videoParent = document.getElementById('video-container');
        //videoParent.setAttribute('whiteboard', 'false');      
    }
    else if ( data.command == 'change-image' ) {
        this.changeCanvasPhoto( data.image_url );
    }
  }
}
