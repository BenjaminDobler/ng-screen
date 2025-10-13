import { Component, effect, ElementRef, input, viewChild } from '@angular/core';

@Component({
  selector: 'app-video',
  imports: [],
  templateUrl: './video.component.html',
  styleUrl: './video.component.scss',
})
export class VideoComponent {
  video = viewChild<ElementRef<HTMLVideoElement>>('video');

  srcObject = input<MediaStream | undefined>(undefined);

  constructor() {
    effect(()=>{
      const src = this.srcObject();
      console.log('src changed', src);
    })
  }
}
