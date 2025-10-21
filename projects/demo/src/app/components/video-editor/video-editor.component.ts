import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { afterNextRender, Component, ElementRef, inject, viewChild } from '@angular/core';
import { Recording } from '../../model/video';

@Component({
  selector: 'app-video-editor',
  imports: [],
  templateUrl: './video-editor.component.html',
  styleUrl: './video-editor.component.scss',
})
export class VideoEditorComponent {


  dialogRef = inject<DialogRef<{data: Recording}>>(DialogRef<{data: Recording}>);
  data = inject(DIALOG_DATA);
  videoPlayer = viewChild<ElementRef<HTMLVideoElement>>('videoPlayer');
  videoElement?: HTMLVideoElement;



  constructor() {
    afterNextRender(() => {
      this.videoElement = this.videoPlayer()?.nativeElement;
      this.videoElement!.src = this.data.getRecordingUrl();
    }); 
  }



 }
