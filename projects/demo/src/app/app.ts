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

@Component({
  selector: 'app-root',
  imports: [FormsModule, VideoComponent, CanvasComponent, EditorComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('demo');

  recordingCount = signal(0);
  recordings = signal<Recording[]>([]);
  currentVideo = signal<string | null>(null);

  videos = signal<VideoDO[]>([]);

  settings = inject(Settings);

  canvasComponent = viewChild<CanvasComponent>(CanvasComponent);

  recorder: MediaRecorder | null = null;

  downloadData: string | null = null;

  audioStream: MediaStream | null = null;


  backgroundColor = model('#000000');

  // webcamvideoSrc = signal<MediaStream | undefined>(undefined);
  // screenVideoSrc = signal<MediaStream | undefined>(undefined);

  recordingWidth = model(1920);
  recordingHeight = model(1080);

  constructor() {}

  async getDesktopStream() {
    const video = new VideoDO();

    const screenShareStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });

    screenShareStream.getVideoTracks().forEach((track) => {
      console.log(track.getSettings());
      track.onended = () => {
        console.log('track ended');
        video.stream = undefined;
      };
    });

    //this.screenVideoSrc.set(screenShareStream);

    video.stream = screenShareStream;
    this.videos.update((prev) => [...prev, video]);
  }

  async getWebcamDevices() {
    const webcamStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    // this.webcamvideoSrc.set(webcamStream);

    const video = new VideoDO();
    video.stream = webcamStream;
    this.videos.update((prev) => [...prev, video]);
  }

  async getAudioStream() {
    this.audioStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  }

  startRecording() {

    const name = `recording-${this.recordingCount()}.webm`;
    this.recordingCount.set(this.recordingCount() + 1);

    const recording: Recording = {
      chunks: [],
      name,
    };

    this.recordings.update((prev) => [...prev, recording]);
    

    const canvasComponent = this.canvasComponent();
    if (!canvasComponent || !canvasComponent.ctx || !canvasComponent.canvas) {
      return;
    }
    const canvasStream = canvasComponent.canvas.captureStream(30);

    // combine the canvas stream and mic stream (from above) by collecting
    //  tracks from each.
    const combinedStream = new MediaStream([
      ...canvasStream.getTracks(),
      ...(this.audioStream?.getTracks() || []),
    ]);

    const chunks: Blob[] = [];

    // create a recorder
    this.recorder = new MediaRecorder(combinedStream, {
      // requested media type, basically limited to webm 🤦‍♂️
      mimeType: 'video/webm;codecs=vp9',
    });

    // collect blobs when available
    this.recorder.ondataavailable = (evt) => {
      console.log('data available', evt.data);
      chunks.push(evt.data);
    };

    // when recorder stops (via recorder.stop()), handle blobs
    this.recorder.onstop = () => {

      this.recordings.update((prev) => {
        const lastRecording = prev[prev.length - 1];
        if (lastRecording) {
          lastRecording.chunks = chunks;
        }
        return [...prev];
      });

      // console.log('on stop');
      // const recordedBlob = new Blob(chunks, { type: chunks[0].type });
      // const data = URL.createObjectURL(recordedBlob);
      // this.downloadData = data;
      // console.log(this.downloadData);

      // const link = document.createElement('a');
      // link.href = data;
      // link.download = 'recording.webm';
      // link.dispatchEvent(new MouseEvent('click', { view: window }));

      // // 💡 don't forget to clean up!
      // setTimeout(() => {
      //   URL.revokeObjectURL(data);
      //   link.remove();
      // }, 500);

      // do something with this blob...
    };

    console.log('start recording');
    this.recorder.start();
  }


  getRecordingUrl(recording: Recording) {
    const recordedBlob = new Blob(recording.chunks, { type: recording.chunks[0].type });
    const data = URL.createObjectURL(recordedBlob);
    return data;
  }

  playRecording(recording: Recording) {
    const url = this.getRecordingUrl(recording);
    this.currentVideo.set(url);
  }


  stopRecording() {
    this.recorder?.stop();
  }
}
