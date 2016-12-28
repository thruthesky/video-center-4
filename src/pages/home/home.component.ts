import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as xInterface from '../../app/app.interface';
import { VideocenterService } from '../../providers/videocenter.service';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {

  constructor(private vc: VideocenterService , private router: Router) {
    console.log('HomeComponent::constructor()');
    this.checkUserAndRoom(); }

  ngOnInit() {
  }
   /**
   * @desc Check if there's a username
   * and check if there is also a roomname
   * then navigate according to the logic
   */  
  checkUserAndRoom() {
    let username = localStorage.getItem('username');
    let roomname = localStorage.getItem('roomname');
    if ( username ) {
      if ( roomname == xInterface.LobbyRoomName ) {
        this.router.navigate(['lobby']); 
      }
      this.vc.updateUsername( username, re => {
          if ( roomname && roomname != xInterface.LobbyRoomName ) { // if user has room name, don't go to lobby.
            this.router.navigate(['room']);   
          }
      });
    }
    else this.router.navigate(['entrance']);
  }
}
