import { Directive, ElementRef, HostListener, Input, Renderer } from '@angular/core';
import { VideocenterService } from '../../providers/videocenter.service';
import * as xInterface from '../../app/app.interface';
@Directive({
  selector: '[mycanvas]'
})
export class MycanvasDirective {
  @Input() drawSize: string;
  @Input() drawColor: string;
  @Input() drawMode: string;
  @Input() sizeCanvas: string;// small - x1, medium - x1.5 , large- x2
  private canvas: any;
  private canvas_context: any;
  private mouse : xInterface.Mouse = xInterface.mouse;
  constructor(
     private el: ElementRef,
     private renderer: Renderer,
     private vc: VideocenterService) {
      this.initialize();
      this.listenEvents();
  }
  /**
  *@desc This method will initialize the MycanvasDirective
  */
  initialize() {
    this.canvas = this.el.nativeElement;
    this.canvas_context = this.canvas.getContext('2d');
    this.drawSize = "2";
    this.drawColor = "#161515";
    this.drawMode = "l";
    this.sizeCanvas = "small"
  }
  /**
  *@desc Group of EventListener for Mouse Event
  */
  
  @HostListener('mousedown', ['$event'])
  onMouseDown(event) {
    event.preventDefault();
    this.mouse.click = true;
    this.mouse.pos_prev = {x: -12345, y: -12345};
    this.draw(event, this.canvas);
  }
  @HostListener('mouseup', ['$event'])
  onMouseUp(event) {
    event.preventDefault();
    this.mouse.click = false;
  }
  @HostListener('mousemove', ['$event'])
  onMouseMove(event) {
    event.preventDefault();
    if( !this.mouse.click ) return;
    this.draw(event, this.canvas);   
  }
  @HostListener('mouseleave', ['$event'])
  onMouseLeave(event) {
    event.preventDefault();    
    this.mouse.click = false;
    this.mouse.pos_prev = {x: -12345, y: -12345};
  }
  /**
  *@desc Group of EventListener for Touch Event
  */

  @HostListener('touchstart', ['$event'])
  onTouchStart(event) {
    event.preventDefault();
    this.mouse.click = true;
    this.mouse.pos_prev = {x: -12345, y: -12345};
    this.draw(event, this.canvas);
  }
  @HostListener('touchend', ['$event'])
  onTouchEnd(event) {
    event.preventDefault();
    this.mouse.click = false;
  }
  @HostListener('touchmove', ['$event'])
  onTouchMove(event) {
    event.preventDefault();
    if( !this.mouse.click ) return;
    this.draw(event, this.canvas);   
  }
  /**
  *@desc This method will set the data that will be pass
  *in draw_on_canvas and the server
  *@param e, obj
  */    
  draw( e , obj) {
    if ( ! e ) e = window.event;
    let mouseTouchXY = this.getMouseTouchXY( e );
    let elementXY = this.getElementXY( obj );
    let mt_posx = mouseTouchXY.m_posx;
    let mt_posy = mouseTouchXY.m_posy;
    let e_posx = elementXY.e_posx;
    let e_posy = elementXY.e_posy;
    let x : number = mt_posx-e_posx;
    let y : number = mt_posy-e_posy;
    let size = this.getCanvasSize();
    this.mouse.pos.x = x / size;
    this.mouse.pos.y = y / size;
    if ( this.mouse.pos_prev.x == -12345 ) {
        this.mouse.pos_prev.x = this.mouse.pos.x;
        this.mouse.pos_prev.y = this.mouse.pos.y;
    }
    let data :any =  { line : [this.mouse.pos, this.mouse.pos_prev] };
    data.lineWidth = this.drawSize;
    data.color = this.drawColor;
    data.draw_mode = this.drawMode;
    data.command = "draw"; 
    data.room_name = localStorage.getItem('roomname');
    this.vc.whiteboard( data, ()=>{});
    this.draw_on_canvas( data );
    this.mouse.pos_prev.x = this.mouse.pos.x;
    this.mouse.pos_prev.y = this.mouse.pos.y;
  }
  /**
  *@desc This method will get the mouse or touch x and y
  *and return it as data variable
  *@param e
  */ 
  getMouseTouchXY( e ) {
   let data = { m_posx:0, m_posy:0 };   
   if (e.pageX || e.pageY){
        data.m_posx = e.pageX;
        data.m_posy = e.pageY;
    } else if (e.clientX || e.clientY){
        data.m_posx = e.clientX + document.body.scrollLeft
            + document.documentElement.scrollLeft;
        data.m_posy = e.clientY + document.body.scrollTop
            + document.documentElement.scrollTop;
    } else if ( e.changedTouches[0].pageX || e.changedTouches[0].pageY) {
        data.m_posx = e.changedTouches[0].pageX;
        data.m_posy = e.changedTouches[0].pageY;
    } else if ( e.changedTouches[0].clientX || e.changedTouches[0].clientY) {
        data.m_posx = e.changedTouches[0].clientX + document.body.scrollLeft
            + document.documentElement.scrollLeft;
        data.m_posy = e.changedTouches[0].clientY + document.body.scrollTop
            + document.documentElement.scrollTop;
    }
    return data;
  }
  /**
  *@desc This method will get the canvas size and return 
  *a number for computation
  */ 
  getCanvasSize( ) {
    let size = 0;
    if( this.sizeCanvas == null || this.sizeCanvas =='' ) this.sizeCanvas = "small";
    if( this.sizeCanvas == "small" ) size = 100;
    if( this.sizeCanvas == "medium" ) size = 150;
    if( this.sizeCanvas == "large" ) size = 200;
    return size;
  }

  /**
  *@desc This method will get the element position
  *by calculating the position of element and it's parent
  *@param obj
  */ 
  getElementXY( obj ) {
   let data = { e_posx:0, e_posy:0 };   
    if ( obj.offsetParent){
        do {
            data.e_posx += obj.offsetLeft;
            data.e_posy += obj.offsetTop;
        } while ( obj = obj.offsetParent);
    }
    return data;
  }
  
  draw_on_canvas( data ) {
    let line = data.line;
    let size = this.getCanvasSize();
    if ( typeof data.lineJoin == 'undefined' ) data.lineJoin = 'round';
    if ( typeof data.draw_mode == 'undefined'  ) data.draw_mode = 'l';
    if ( typeof data.lineWidth == 'undefined' || data.lineWidth == "" ) data.lineWidth = 2;
    if ( typeof data.color == 'undefined' ) data.color = 'black';
    let ox = line[0].x * size;
    let oy = line[0].y * size;
    let dx = line[1].x * size;
    let dy = line[1].y * size; 
    let ctx = this.canvas_context;  
    ctx.beginPath();
    ctx.lineJoin = data.lineJoin;
    if ( data.draw_mode == 'e' ) {       
    ctx.globalCompositeOperation = 'destination-out';
        data.lineWidth = 15;
    }
    else if ( data.draw_mode == 'l' ) {
        ctx.globalCompositeOperation = 'source-over';
    }
    if ( ox == dx && oy == dy ) {           
        ctx.fillStyle = data.color;
        ctx.arc( dx, dy, data.lineWidth * 0.5, 0, Math.PI*2, false);            
        ctx.closePath();
        ctx.fill();
    }
    else {
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.lineWidth;
        ctx.moveTo( ox, oy);
        ctx.lineTo( dx, dy);
        ctx.stroke();
        ctx.fillStyle = data.color;
        ctx.arc( dx, dy, data.lineWidth * 0.5, 0, Math.PI*2, false);            
        ctx.closePath();
        ctx.fill();
    }      
  }
  clear_my_canvas() {
    //get the canvas context
    let ctx = this.canvas_context; 
    let canvas = this.canvas; 
    // Store the current transformation matrix
    ctx.save(); 
    // Use the identity matrix while clearing the canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Restore the transform
    ctx.restore();
  }
  broadcastClearCanvas() {    
    let data :any = { command : "clear" };
    data.room_name = localStorage.getItem('roomname');
    this.vc.whiteboard( data, ()=>{ console.log('clear whiteboard'); });
  }
  /**
  *@desc This method will listen to incoming events in the server
  */
  listenEvents() {
    this.vc.myEvent.subscribe( item => {
      if( item.eventType == "click-clear-canvas") this.broadcastClearCanvas();
      if( item.eventType == "whiteboard")  this.onWhiteboardEvent( item ); 
    });  
  }
  /**
  *@desc This method will invoke the method depending on data.command
  *@param data
  */
  onWhiteboardEvent( data ) {  
    if ( data.command == 'draw' ) {
        this.draw_on_canvas(data);
    }
    else if ( data.command == 'history' ) { 
        this.draw_on_canvas(data);
    }     
    else if ( data.command == 'clear' ) {
        this.clear_my_canvas();        
    }
  }
}

