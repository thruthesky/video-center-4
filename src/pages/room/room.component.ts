/// <reference path="../../d.ts/msr.d.ts" />
import { Component, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as xInterface from '../../app/app.interface';
import { VideocenterService } from '../../providers/videocenter.service';
import * as _ from 'lodash';
import { FileServer, FILE_UPLOAD_OPTIONS, FILE_UPLOADED } from '../../providers/file-server';

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
  mediaStreamRecorder: any;
  videos:any =[];
  audios: any = [];
  position: any = null;
  file_progress: any = null;
  
  listMessage: xInterface.MESSAGELIST = <xInterface.MESSAGELIST> {};
  wb: xInterface.WhiteboardSetting = xInterface.whiteboardSetting;
  vs: xInterface.VideoSetting = xInterface.videoSetting;
  show: xInterface.DisplayElement = xInterface.displayElement;
  
  fileUploaded: Array<FILE_UPLOADED> = [];

  //Text Editor Canvas
  wbContainer:any;
  tempCanvas: any;
  tempContext: any;
  textArea: any;
  tempTextContainer: any;
  mouse: any = { click:false, x: 0, y: 0 };
  start_mouse: any = { x: 0, y: 0 };
  
  index:number =1;
  constructor( private router: Router,
    private routes: ActivatedRoute,
    private ngZone: NgZone,
    private fileServer: FileServer,
    private vc: VideocenterService ) {
      this.checkParams();
      this.validate();
      this.initialize();
      this.joinRoom();
      this.streamOnConnection();
      this.showSettings();
      this.listenEvents();
      this.getUploadedFiles();
  }
  /**
  *@desc This method will check if there is username parameter
  */
  checkParams() {
    let username;
    let roomname;
    this.routes.params.subscribe(
        params =>{
          username = params['username'];
          roomname = params['roomname'];
        }
    );
    if(typeof username != 'undefined')localStorage.setItem('username', username );
    if(typeof roomname != 'undefined')localStorage.setItem('roomname', roomname );
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
    this.wb.optionDrawColor =  this.wb.selectDrawColor;
    this.imageUrlPhoto = this.wb.canvasPhoto;
    this.canvasPhoto = this.wb.canvasPhoto;
    this.connection = VideocenterService.connection;
    this.connection.extra = {
      myname: this.myName
    };
    this.connection.updateExtraData();
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
      this.getWhiteboardSettings( data.room );
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
  *@desc This method will get the whiteboard settings of the room
  *@param roomName 
  */
  getWhiteboardSettings( roomName ) {
    let data :any = { room_name : roomName };
    data.command = "settings";
    this.vc.whiteboard( data,( settings ) => {
        if( settings.display ) {
          settings.room_name = this.myRoomname; 
          this.onShowWhiteboard( settings);
          if( settings.image_url )setTimeout(()=>{ this.changeCanvasPhoto( settings.image_url );},100);
        }
    });
  }
  /**
  *@desc This method will get the whiteboard history of the room
  *@param roomName 
  */
  getWhiteboardHistory( roomName ) {
    let data :any = { room_name : roomName };
    data.command = "history";
    this.vc.whiteboard( data,( settings ) => {
        if( settings.display ) {
          settings.room_name = this.myRoomname; 
          this.onShowWhiteboard( settings);
          if( settings.image_url ) this.changeCanvasPhoto( settings.image_url );
        }
    });
  }

  /**
  *@desc This method will open or join a session to have a video conference
  *if the roomName is not lobby
  *@param roomName
  */
  openOrJoinSession( roomName ) {
    if( roomName !== xInterface.LobbyRoomName ) {
      // this.connection.extra = {
      //   myname: this.myName
      // };
      console.log("Name before joining session",this.connection.extra.myname);
      setTimeout(()=>{
        this.connection.openOrJoin( roomName, (roomExist) => {
          if(roomExist)console.log("I Join the Room");
          else console.log("I Open the Room");
          this.connection.socket.on( this.connection.socketCustomEvent, message => { } );
          this.connection.socket.emit( this.connection.socketCustomEvent, this.connection.userid);
        });
      },100);
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
  onClickStartRecord() {
    console.log("Start Recording ...");
    this.mediaStreamRecorder.start(1000 * 1500);
  }
  onClickStopRecord() {
    console.log("Stop Recording");
    this.mediaStreamRecorder.stop();
  }
  /**
  *@desc This method will toggle the whiteboard
  *and get whiteboard history
  */
  onClickWhiteboard() {
    let room = localStorage.getItem('roomname');
    this.wb.whiteboardDisplay = ! this.wb.whiteboardDisplay;
    if(this.wb.whiteboardDisplay){
      setTimeout(()=>{
        this.initializeTextEditor();
        let data :any = { room_name :room };
        data.command = "show-whiteboard";
        this.setCanvasSize( this.wb.canvasWidth, this.wb.canvasHeight);
        this.vc.whiteboard( data,(data) => {
            if( data.image_url ) this.changeCanvasPhoto( data.image_url );
        });
        this.wb.optionSizeCanvas = 'small';
        this.checkCanvasSize( 'small' );
        this.getWhiteboardHistory( room );
      },100);
    } else {
        let data :any = { room_name :room };
        data.command = "hide-whiteboard";
        this.vc.whiteboard( data,() => { } );
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
    this.addVideo( event, 'me');
  }
  /**
   *@desc This method will add 
   *remote video stream
   *@param event
   */
  addRemoteVideo( event ) {
    this.addVideo( event, 'other');
  }

  addVideo(event, cls) {

    setTimeout( ()=> {
      this.mediaStreamRecorder = new MediaStreamRecorder(event.stream);
      // Media Stream Recorder
      this.mediaStreamRecorder.mimeType = 'video/webm';
      this.mediaStreamRecorder.ondataavailable =  (blob) => {
        let blobURL = URL.createObjectURL(blob);
        console.log("My Record Link...",blobURL);
      };
      let newDiv = document.createElement("div");
      let newVideo = event.mediaElement;
      let videoParent = document.getElementById('video-container');
      let oldVideo = document.getElementById(event.streamid);
      newDiv.setAttribute('class', 'user ' + cls);
      if ( oldVideo && oldVideo.parentNode ) {
        let myParentNode = oldVideo.parentNode;
        if( myParentNode && myParentNode.parentNode)myParentNode.parentNode.removeChild(myParentNode);
      }
      if ( videoParent ) {
        newDiv.appendChild( newVideo );
        let myNameDiv = document.createElement("div");
        let myname = 'No name';
        if ( event.extra.myname ) {
          myname = event.extra.myname;
        }
        myNameDiv.innerHTML = myname;
        myNameDiv.setAttribute('class', 'name');
        newDiv.appendChild( myNameDiv );
        if ( cls == 'me' ) videoParent.insertBefore(newDiv, videoParent.firstChild);
        else videoParent.appendChild( newDiv );
      }
    }, 700);
   
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
  
  onClickFile( file ) {
    this.changeCanvasPhoto( file.url );
    let room = localStorage.getItem('roomname');
    let data = {
      room_name: room,
      command: 'change-image',
      image_url: file.url
    };
    console.log("book file clicked: ", data );
    this.vc.whiteboard( data, () => {
      console.log("book chagned:");
    });
    this.onClickClear();
  }

  /**
  *@desc This method will change the canvasPhoto to imageUrlPhoto
  */
  changeCanvasPhoto( imageUrl: string ) {
    let whiteboardcontainer = document.getElementById('whiteboard-container');
    if ( whiteboardcontainer ) whiteboardcontainer.style.backgroundImage="url('"+ imageUrl+"')";
  }

  /**
  *@desc This method will set the dataPhoto for upload
  *then upload it
  *@param event
  */
  onChangeFile( event ) {
    if ( event === void 0 || event.target === void 0 || event.target.files === void 0 ) return;
    let file = event.target.files[0];
    if ( file === void 0 ) return;
    this.file_progress = true;
    let options: FILE_UPLOAD_OPTIONS = {
      folder: this.myName
    };
    this.fileServer.upload( options, ( uploaded: FILE_UPLOADED ) => {
      this.onFileUploadSuccess( uploaded );
    },
    e => {
        this.file_progress = false;
        alert(e);
    },
    code => {
      console.log("complete code: ", code);
    },
    percent => {
        this.position = percent;
        this.renderPage();
        console.log("position: ", this.position);
    } );
  }
  /**
  *@desc This method will be fired after uploading the image
  *@param url, ref
  */
  onFileUploadSuccess( uploaded: FILE_UPLOADED ) {
    console.log("onFileUploadSuccess()");
    this.file_progress = false;
    this.fileUploaded.push( uploaded );
    this.position = 0;
    this.renderPage();
  }
  onClickDeleteFile( file: FILE_UPLOADED ) {
    let re = confirm("Do you want to delete?");
    if ( ! re ) return;
    this.fileServer.delete( file, () => {
      console.log("file deleted");
      _.remove( this.fileUploaded, (v: FILE_UPLOADED) => v.url == file.url );
    },
    e => alert(e),
    () => {}  );
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
    this.hideTextArea();
  } 
  /**
   *@desc This method will change the optionDrawMode to e - erase
   */
  onClickEraseMode() {
    this.wb.optionDrawMode = "e";
    this.hideTextArea();
  }
  /**
   *@desc This method will change the optionDrawMode to t - line
   */
  onClickTextMode() {
    this.wb.optionDrawMode = "t";
  } 
  /**
  *@desc This method will pass the size to
  *changeCanvasSize and broadcast to the room
  *@param size
  */
  onChangeCanvasSize( size ) {
    this.wb.optionSizeCanvas = size;
    this.checkCanvasSize( size );
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
   *@desc Group Method for Text Editor Canvas
   */
  initializeTextEditor() {
    this.wbContainer = document.getElementById('whiteboard-container');
    this.tempCanvas = document.getElementById('mycanvas');
    this.tempContext = this.tempCanvas.getContext('2d');
    this.textArea = document.getElementById('textTool');
    this.tempTextContainer = document.getElementById('tempTextContainer');
    this.listenTextEditorEvent();
  }
  listenTextEditorEvent() {
    this.textArea.addEventListener('mouseup', (e) =>{
      if( this.wb.optionDrawMode != 't') return;
      this.mouse.click = false;
        this.tempCanvas.removeEventListener('mousemove', ()=> {
          this.mouse.click = false;
        }, false);
    }, false);
    this.textArea.addEventListener('keypress',  (e) => {
      if( this.wb.optionDrawMode != 't') return;
      let key = e.which || e.keyCode;
      if (key === 13) { // 13 is enter
      // code for enter
      let newHeight = this.textArea.offsetHeight + 20;
      this.textArea.style.height = newHeight + 'px';
      }
    });
    this.tempCanvas.addEventListener('mousemove', (e)=> {
      if( this.wb.optionDrawMode != 't') return;
      if( !this.mouse.click ) return;
      this.mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
      this.mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
      this.displayTextEditor();
    }, false);
    this.tempCanvas.addEventListener('mousedown', (e)=> {
        if( this.wb.optionDrawMode != 't') return;
        this.mouse.click = true;

        this.mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
        this.mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
        
        this.start_mouse.x = this.mouse.x;
        this.start_mouse.y = this.mouse.y;
    }, false);        
    this.tempCanvas.addEventListener('mouseup', (e)=> {
      if( this.wb.optionDrawMode != 't') return;
      this.mouse.click = false;
      if( this.textArea.style.display == "none"){
        this.displayTextEditor();
      }
      else {
        this.tempCanvas.removeEventListener('mousemove', ()=> {
          this.mouse.click = false;
        }, false);
        let lines = this.textArea.value.split('\n');
        let processed_lines = [];
        for (let i = 0; i < lines.length; i++) {
            let chars = lines[i].length;
            
            for (let j = 0; j < chars; j++) {
                let text_node = document.createTextNode(lines[i][j]);
                this.tempTextContainer.appendChild(text_node);
                
                // Since tempTextContainer is not taking any space
                // in layout due to display: none, we gotta
                // make it take some space, while keeping it
                // hidden/invisible and then get dimensions
                this.tempTextContainer.style.position   = 'absolute';
                this.tempTextContainer.style.visibility = 'hidden';
                this.tempTextContainer.style.display    = 'block';
                
                let width = this.tempTextContainer.offsetWidth;
                
                this.tempTextContainer.style.position   = '';
                this.tempTextContainer.style.visibility = '';
                this.tempTextContainer.style.display    = 'none';
                
                if (width > parseInt(this.textArea.style.width)) {
                    break;
                }
            }
            
            processed_lines.push(this.tempTextContainer.textContent);
            this.tempTextContainer.innerHTML = '';
        }

        let textAreaComputedStyle = getComputedStyle(this.textArea);
        let fontSize = textAreaComputedStyle.getPropertyValue('font-size');
        let fontFamily = textAreaComputedStyle.getPropertyValue('font-family');
        // this.tempContext.font = fontSize + ' ' + fontFamily;
        
        for (let n = 0; n < processed_lines.length; n++) {
            let data :any = { eventType: "whiteboard-mytextarea"};
            data.processed_line = processed_lines[n];
            data.textarea_left = parseInt( this.textArea.style.left );
            data.textarea_top = parseInt( this.textArea.style.top ) + n * parseInt( fontSize );
            data.font_family = fontFamily;
            data.text_baseline = 'top';
            data.draw_mode = 't';
            this.vc.myEvent.emit(data); 
        }

        // Clearing tmp canvas
        this.tempContext.clearRect(0, 0, this.tempContext.width, this.tempContext.height);
        
        // clearInterval(sprayIntervalID);
        this.textArea.style.display = 'none';
        this.textArea.value = '';
      }
    }, false);
    


  }
  displayTextEditor() {
    // Tmp canvas is always cleared up before drawing.
    try {
    this.tempContext.clearRect(0, 0, this.tempContext.width, this.tempContext.height);
    let x = Math.min( this.mouse.x, this.start_mouse.x );
    let y = Math.min( this.mouse.y, this.start_mouse.y );
    let width = Math.abs( this.mouse.x - this.start_mouse.x );
    let height = Math.abs( this.mouse.y - this.start_mouse.y );
    let newWidth = 150 + width;
    let newHeight= 40 + height;
    this.textArea.style.left = x + 'px';
    this.textArea.style.top = y + 'px';
    this.textArea.style.minWidth = "150" + 'px';
    this.textArea.style.minHeight = "40" + 'px';
    this.textArea.style.width = newWidth + 'px';
    this.textArea.style.height = newHeight + 'px';
    this.textArea.style.display = 'block';
    }
    catch(e) {
      console.error(e);
    }
  }
  hideTextArea() {
    if( this.textArea)this.textArea.style.display = 'none';
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
        this.onShowWhiteboard( data );
    }     
    else if ( data.command == 'hide-whiteboard' ) {
        this.wb.whiteboardDisplay = false;
    }
    else if ( data.command == 'change-image' ) {
        this.changeCanvasPhoto( data.image_url );
    }
    else if ( data.command == 'history' ) { 
    }
  }
  /**
  *@desc This method will show the whiteboard and set image,and set the canvas size to small 
  *@param data
  */
  onShowWhiteboard( data ) {
    this.wb.whiteboardDisplay = true;
    this.getWhiteboardHistory( data.room_name );
    setTimeout(()=>{
      this.setCanvasSize( this.wb.canvasWidth, this.wb.canvasHeight);
      this.wb.optionSizeCanvas = 'small';
      this.checkCanvasSize( 'small' );
      if( data.image_url ) this.changeCanvasPhoto( data.image_url );
      this.initializeTextEditor();  
    }, 100);
  }
  /**
  *@desc This method will get the list of uploaded files in the server
  */
  getUploadedFiles() {
    this.fileServer.list( this.myName, fileUploaded => {
      console.log("getUploadedFiles()");
      this.fileUploaded = fileUploaded;
    },
    e => alert('failed to get uploaded files'),
    () => {} );
  }
  /**
  *@desc This method will run the ngZone 
  */
  renderPage() {
      this.ngZone.run(() => {
      });
  }
    


}
