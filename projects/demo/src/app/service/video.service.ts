import { Injectable } from '@angular/core';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

@Injectable({
  providedIn: 'root',
})
export class VideoService {
  ffmpeg?: FFmpeg;

  constructor() {}

  async loadFFmpeg() {
    this.ffmpeg = new FFmpeg();
    this.ffmpeg.on('progress', (e) => {
      console.log(`ffmpeg progress`, e.progress);
      
    });
    this.ffmpeg.on('log', ({ message }) => {
      console.log('ffmpeg message', message);
    });
    const config = await this.loadConfig();
    try {
      await this.ffmpeg.load(config);
    } catch (error) {
      console.error(error);
    }
  }

  private async loadConfig() {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
    return {
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      classWorkerURL: 'assets/ffmpeg/worker.js',
    };
  }


  // "-ss $startTime -t $endTime -i $input -f segment -c copy $output"


  async trimVideo(recordedBlobs: Blob[], startTime: number, endTime: number) {
    if (!this.ffmpeg) {
      console.error('ffmpeg not loaded');
      return;
    }

    const blob = new Blob(recordedBlobs, { type: 'video/webm' });
    const name = 'input.webm';
    await this.ffmpeg.writeFile(name, await fetchFile(blob));

    await this.ffmpeg.exec([
      '-i',
      name, // Input file
        '-ss',
      startTime.toString(),
      '-t',
      (endTime - startTime).toString(),
      'trimmed.mp4', // Output file
    ]);

    console.log('conversion done');

    const data = await this.ffmpeg.readFile('trimmed.mp4');
    return data;

    // const endTime = performance.now();
    // const diffTime = ((endTime - startTime) / 1000).toFixed(2);
    // this.conversionTime.next(` ${diffTime} s`);

    // const data = (await this.ffmpeg.readFile('output.mp4')) as any;
    // this.convertedVideoSrc.next(
    //   URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' })),
    // );
  }

  async convert(recordedBlobs: Blob[]) {
    if (!this.ffmpeg) {
      console.error('ffmpeg not loaded');
      return;
    }

    const blob = new Blob(recordedBlobs, { type: 'video/webm' });
    const name = 'input.webm';
    await this.ffmpeg.writeFile(name, await fetchFile(blob));

    await this.ffmpeg.exec([
      '-i',
      name, // Input file
      '-t',
      '60', // Limit the output duration to 60 seconds
      '-c:v',
      'libx264', // Video codec: H.264
      '-preset',
      'ultrafast', // Preset for faster encoding
      '-r',
      '20', // Frame rate: Reduced to 20 FPS
      '-s',
      '480x360', // Reduced resolution
      '-crf',
      '28', // Slightly reduced quality for speed
      'output.mp4', // Output file
    ]);

    console.log('conversion done');

    const data = await this.ffmpeg.readFile('output.mp4');
    return data;

    // const endTime = performance.now();
    // const diffTime = ((endTime - startTime) / 1000).toFixed(2);
    // this.conversionTime.next(` ${diffTime} s`);

    // const data = (await this.ffmpeg.readFile('output.mp4')) as any;
    // this.convertedVideoSrc.next(
    //   URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' })),
    // );
  }
}
