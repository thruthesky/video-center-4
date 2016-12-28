import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { VideocenterService } from '..//providers/videocenter.service';
@Component({
  selector: `app-component`,
  template: `
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  
  constructor( private vcServer: VideocenterService, private router: Router ) {
    document.addEventListener("deviceready", () => this.onDevinceReady(), false);
    vcServer.connect();
  }
  onDevinceReady() {
    console.log("yes, I am running in cordova.");
  }
  
}
