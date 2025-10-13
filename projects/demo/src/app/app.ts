import { afterNextRender, Component, effect, ElementRef, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { VideoComponent } from './components/video/video.component';
import { CanvasComponent } from './components/canvas/canvas.component';

@Component({
  selector: 'app-root',
  imports: [FormsModule, VideoComponent, CanvasComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('demo');

  canvasComponent = viewChild<CanvasComponent>(CanvasComponent);


  recorder: MediaRecorder | null = null;

  downloadData: string | null = null;

  audioStream: MediaStream | null = null;


  webcamvideoSrc = signal<MediaStream | undefined>(undefined);
  screenVideoSrc = signal<MediaStream | undefined>(undefined);

  constructor() {
    

  }

  

  async getDesktopStream() {
    const screenShareStream = await navigator.mediaDevices.getDisplayMedia({
      // we only want video for now, but can easily specify other options
      video: true,
    });

    this.screenVideoSrc.set(screenShareStream); 
  }

  async getWebcamDevices() {
    const webcamStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    this.webcamvideoSrc.set(webcamStream);
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

    const canvasComponent = this.canvasComponent();
    if (!canvasComponent || !canvasComponent.ctx || !canvasComponent.canvas) {
      return;
    }
    const canvasStream = canvasComponent.canvas.captureStream(30);

    // combine the canvas stream and mic stream (from above) by collecting
    //  tracks from each.
    const combinedStream = new MediaStream([...canvasStream.getTracks(), ...(this.audioStream?.getTracks() || [])]);

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
      console.log('on stop');
      const recordedBlob = new Blob(chunks, { type: chunks[0].type });
      const data = URL.createObjectURL(recordedBlob);
      this.downloadData = data;
      console.log(this.downloadData);

      const link = document.createElement('a');
      link.href = data;
      link.download = 'recording.webm';
      link.dispatchEvent(new MouseEvent('click', { view: window }));

      // 💡 don't forget to clean up!
      setTimeout(() => {
        URL.revokeObjectURL(data);
        link.remove();
      }, 500);

      // do something with this blob...
    };

    console.log('start recording');
    this.recorder.start();
  }

  stopRecording() {
    this.recorder?.stop();
  }
}
