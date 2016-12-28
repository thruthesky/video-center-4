import { Directive, ElementRef } from '@angular/core';
import { VideocenterService } from '../../providers/videocenter.service';
@Directive({
  selector: '[myautoscroll]' // Attribute selector
})
export class AutoscrollDirective {
  private myScrollContainer: any;
  constructor(
     private el: ElementRef,
     private vc: VideocenterService) {
      this.myScrollContainer = el.nativeElement;
      this.listenEvents();
  }
  listenEvents() {
    this.vc.myEvent.subscribe( item => {
      if( item.eventType == "scroll-to-bottom") {
        this.scrollToBottom();
      }
    });
  }
  scrollToBottom(): void {
    this.myScrollContainer.scrollTop = this.myScrollContainer.scrollHeight;
  }
}
