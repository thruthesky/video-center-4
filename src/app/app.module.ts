import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';



import {NgbModule} from '@ng-bootstrap/ng-bootstrap';


import { LobbyRoomName } from './app.interface';

import { HomeComponent } from '../pages/home/home.component';
import { EntranceComponent } from '../pages/entrance/entrance.component';
import { LobbyComponent } from '../pages/lobby/lobby.component';
import { RoomComponent } from '../pages/room/room.component';

import { LayoutComponent } from '../pages/layout/layout.component';
import { LogoComponent } from '../components/logo/logo';
import { CopyrightComponent } from '../components/copyright/copyright';
import { AutoscrollDirective } from '../components/autoscroll/autoscroll';
import { MycanvasDirective } from '../components/mycanvas/mycanvas';

import { NgbdModalDeviceMenu } from '../pages/ngbootstrap/modal/device-menu.component';

import { VideocenterService } from '../providers/videocenter.service';

const appRoutes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'entrance', component: EntranceComponent },
  { path: 'lobby', component: LobbyComponent },
  { path: 'room', component: RoomComponent }
];
let username = localStorage.getItem('username');
let roomname = localStorage.getItem('roomname');
let begin = null;
if ( username ) {
  if ( roomname && roomname != LobbyRoomName ) begin = RoomComponent;
  else begin = LobbyComponent;
}
else begin = EntranceComponent;
appRoutes.push( { path: '', component: begin } );

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    HomeComponent,
    EntranceComponent,
    LobbyComponent,
    RoomComponent,
    NgbdModalDeviceMenu,
    LogoComponent,
    CopyrightComponent,
    AutoscrollDirective,
    MycanvasDirective
  ],
  entryComponents: [
    NgbdModalDeviceMenu
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot( appRoutes ),
    NgbModule.forRoot()
  ],
  bootstrap: [ AppComponent ],
  providers: [ VideocenterService ]
})
export class AppModule {}


