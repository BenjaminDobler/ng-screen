import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { afterNextRender, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ExportSettingsDO, Recording } from '../../model/video';
import { DraggerDirective } from '@richapps/ngx-drag';
import { EdSelectComponent, EdSelectOptionComponent, InputComponent } from '@richapps/ui-components';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-video-editor',
  imports: [InputComponent, FormsModule, EdSelectComponent, EdSelectOptionComponent, DraggerDirective],
  templateUrl: './video-editor.component.html',
  styleUrl: './video-editor.component.scss',
})
export class VideoEditorComponent {
  timelineEl = viewChild<ElementRef<HTMLDivElement>>('timeline');
  dialogRef = inject<DialogRef<{ data: ExportSettingsDO }>>(DialogRef<{ data: ExportSettingsDO }>);
  data = inject(DIALOG_DATA);
  videoPlayer = viewChild<ElementRef<HTMLVideoElement>>('videoPlayer');
  videoElement?: HTMLVideoElement;

  crf = signal(23);
  preset = signal<
    | 'ultrafast'
    | 'superfast'
    | 'veryfast'
    | 'faster'
    | 'fast'
    | 'medium'
    | 'slow'
    | 'slower'
    | 'veryslow'
  >('medium');
  frameRate = signal(20);
  resolutionWidth = signal(480);
  resolutionHeight = signal(360);

  timelineWidth = signal(0);
  start = signal(0);
  end = signal(0);

  duration = signal(0);

  startTime = computed(() => {
    return parseFloat((this.start() / this.timelineWidth() * this.duration()).toFixed(2));
  });

  endTime = computed(() => {
    return parseFloat((this.end() / this.timelineWidth() * this.duration()).toFixed(2));
  }); 

  constructor() {
    afterNextRender(() => {
      this.videoElement = this.videoPlayer()?.nativeElement;
      this.videoElement!.src = this.data.getRecordingUrl();
      this.timelineWidth.set(this.timelineEl()?.nativeElement.getBoundingClientRect().width || 0);
      this.end.set(this.timelineWidth());
    });
  }

  dragStart() {
    console.log('drag started');
    this.timelineWidth.set(this.timelineEl()?.nativeElement.getBoundingClientRect().width || 0);
    
  }

  leftDragUpdated(event: { x: number; y: number }) {
    console.log('left drag updated', event);
    this.start.set(event.x);
    const pos = this.start() / this.timelineWidth() * this.duration();
    if (this.videoElement) {
      this.videoElement.currentTime = pos;
    }
  }

  rightDragUpdated(event: { x: number; y: number }) {
    console.log('right drag updated', event);
    this.end.set(event.x);
    const pos = this.end() / this.timelineWidth() * this.duration();
    if (this.videoElement) {
      this.videoElement.currentTime = pos;
    }
  }

  onVideoLoaded(event: Event) {
    const video = event.target as HTMLVideoElement;
    console.log('video loaded', video.duration);
    this.duration.set(video.duration);
  }

  

  exportVideo() {
    // Implement video export logic here
    this.dialogRef.close({
      data: {
        crf: this.crf(),
        preset: this.preset(),
        frameRate: this.frameRate(),
        resolutionWidth: this.resolutionWidth(),
        resolutionHeight: this.resolutionHeight(),
        startTime: this.startTime(),
        endTime: this.endTime(),
      },
    });
  }
}
