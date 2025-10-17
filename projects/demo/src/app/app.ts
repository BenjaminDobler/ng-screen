import {
  afterNextRender,
  Component,
  effect,
  ElementRef,
  inject,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { VideoComponent } from './components/video/video.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { EditorComponent } from './components/editor/editor.component';
import { Settings } from './service/settings';
import { Recording, VideoDO } from './model/video';
import { VideoService } from './service/video.service';
import { RecordingService } from './service/recording.service';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ControlsComponent } from './components/controls/controls.component';

@Component({
  selector: 'app-root',
  imports: [FormsModule, VideoComponent, CanvasComponent, EditorComponent, SidebarComponent, ControlsComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('demo');

  videoService = inject(VideoService);
  recordingService = inject(RecordingService);

  // recordingCount = signal(0);
  // recordings = signal<Recording[]>([]);
  currentVideo = signal<string | null>(null);

  // videos = signal<VideoDO[]>([]);

  settings = inject(Settings);

  // canvasComponent = viewChild<CanvasComponent>(CanvasComponent);

  // recorder: MediaRecorder | null = null;

  downloadData: string | null = null;

  // audioStream: MediaStream | null = null;


  // isRecording = signal(false);

  constructor() {}

  // async getDesktopStream() {
  //   const video = new VideoDO();

  //   const screenShareStream = await navigator.mediaDevices.getDisplayMedia({
  //     video: true,
  //   });

  //   screenShareStream.getVideoTracks().forEach((track) => {
  //     console.log('track', track.getSettings());
  //     track.onended = () => {
  //       console.log('track ended');
  //       video.stream = undefined;
  //     };
  //   });

  //   //this.screenVideoSrc.set(screenShareStream);

  //   video.stream = screenShareStream;
  //   this.videos.update((prev) => [...prev, video]);
  // }

  // async getWebcamDevices() {
  //   const webcamStream = await navigator.mediaDevices.getUserMedia({
  //     video: true,
  //     audio: false,
  //   });
  //   // this.webcamvideoSrc.set(webcamStream);

  //   const video = new VideoDO();
  //   video.stream = webcamStream;
  //   this.videos.update((prev) => [...prev, video]);
  // }

  // async getAudioStream() {
  //   this.audioStream = await navigator.mediaDevices.getUserMedia({
  //     video: false,
  //     audio: {
  //       echoCancellation: true,
  //       noiseSuppression: true,
  //       autoGainControl: true,
  //     },
  //   });
  // }

  // startRecording() {
  //   this.isRecording.set(true);
  //   const cv = this.canvasComponent();
  //   if (cv) {
  //     cv.startDrawing();
  //   }
  //   const name = `recording-${this.recordingCount()}`;
  //   this.recordingCount.set(this.recordingCount() + 1);

  //   const recording: Recording = {
  //     chunks: [],
  //     name,
  //   };

  //   this.recordings.update((prev) => [...prev, recording]);

  //   const canvasComponent = this.canvasComponent();
  //   if (!canvasComponent || !canvasComponent.ctx || !canvasComponent.canvas) {
  //     return;
  //   }
  //   const canvasStream = canvasComponent.canvas.captureStream(30);

  //   // combine the canvas stream and mic stream (from above) by collecting
  //   //  tracks from each.
  //   const combinedStream = new MediaStream([
  //     ...canvasStream.getTracks(),
  //     ...(this.audioStream?.getTracks() || []),
  //   ]);

  //   const chunks: Blob[] = [];

  //   // create a recorder
  //   this.recorder = new MediaRecorder(combinedStream, {
  //     // requested media type, basically limited to webm 🤦‍♂️
  //     mimeType: 'video/webm;codecs=vp9',
  //   });

  //   // collect blobs when available
  //   this.recorder.ondataavailable = (evt) => {
  //     console.log('data available', evt.data);
  //     chunks.push(evt.data);
  //   };

  //   // when recorder stops (via recorder.stop()), handle blobs
  //   this.recorder.onstop = () => {
  //     this.isRecording.set(false);
  //     if (cv) {
  //       cv.stopDrawing();
  //     }

  //     this.recordings.update((prev) => {
  //       const lastRecording = prev[prev.length - 1];
  //       if (lastRecording) {
  //         lastRecording.chunks = chunks;
  //       }
  //       return [...prev];
  //     });

  //     // console.log('on stop');
  //     // const recordedBlob = new Blob(chunks, { type: chunks[0].type });
  //     // const data = URL.createObjectURL(recordedBlob);
  //     // this.downloadData = data;
  //     // console.log(this.downloadData);

  //     // const link = document.createElement('a');
  //     // link.href = data;
  //     // link.download = 'recording.webm';
  //     // link.dispatchEvent(new MouseEvent('click', { view: window }));

  //     // // 💡 don't forget to clean up!
  //     // setTimeout(() => {
  //     //   URL.revokeObjectURL(data);
  //     //   link.remove();
  //     // }, 500);

  //     // do something with this blob...
  //   };

  //   console.log('start recording');
  //   this.recorder.start();
  // }

  getRecordingUrl(recording: Recording) {
    const recordedBlob = new Blob(recording.chunks, { type: recording.chunks[0].type });
    const data = URL.createObjectURL(recordedBlob);
    return data;
  }

  getConvertedUrl(recording: Recording) {
    if (recording.convertedData) {
      const data = URL.createObjectURL(recording.convertedData);
      return data;
    }
    return null;
  }

  playRecording(recording: Recording) {
    const url = this.getRecordingUrl(recording);
    this.currentVideo.set(url);
  }

  playConvertedRecording(recording: Recording) {
    if (recording.convertedData) {
      const url = URL.createObjectURL(recording.convertedData);
      this.currentVideo.set(url);
    }
  }

  // stopRecording() {
  //   this.recorder?.stop();
  // }

  async convertRecording(recording: Recording) {
    await this.videoService.loadFFmpeg();
    const data = await this.videoService.convert(recording.chunks);
    if (data) {
      const blob = new Blob([(data as any).buffer], { type: 'video/mp4' });
      recording.convertedData = blob;
    }
    console.log('conversion done!');

    this.recordingService.recordings.update((prev) => [...prev]);
    return data;
  }
}
