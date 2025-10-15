import { afterNextRender, Component, effect, ElementRef, input, viewChild } from '@angular/core';
import { VideoComponent } from '../video/video.component';
import { VideoDO } from '../../model/video';

@Component({
  selector: 'app-canvas',
  imports: [],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss',
})
export class CanvasComponent {
  canvasElement = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  canvas?: HTMLCanvasElement;
  ctx?: CanvasRenderingContext2D | null;

  canvasWidth = input<number>(800);
  canvasHeight = input<number>(600);

  videos = input<VideoDO[]>([]);

  background = input<string>('#000000');

  // webcamVideoElement = input<VideoComponent | undefined>(undefined);
  // screenVideoElement = input<VideoComponent | undefined>(undefined);

  constructor() {
    afterNextRender(() => {
      console.log(this.canvasElement()?.nativeElement);
      this.canvas = this.canvasElement()?.nativeElement;
      this.ctx = this.canvas?.getContext('2d');
    });

    effect(() => {
      const bg = this.background();
      this.draw();
    });
  }

  startDrawing() {
    const loop = () => {
      this.draw();
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  draw() {
    // const screen = this.screenVideoElement();
    // const webcam = this.webcamVideoElement();
    // const screenElement = screen?.video()?.nativeElement;
    // const webcamElement = webcam?.video()?.nativeElement;
    if (!this.ctx || !this.canvas) {
      return;
    }
    const { width, height } = this.canvas;

    // clear out the entire canvas and paint from scratch
    this.ctx.clearRect(0, 0, width, height);

    this.ctx.fillStyle = this.background();
    this.ctx.fillRect(0, 0, width, height);

    this.videos().forEach((video) => {
      const component = video.component;
      const element = component?.video()?.nativeElement;
      if (element) {
        if (component?.clipType() === 'circle') {
          this.ctx?.save();
          this.ctx?.beginPath();
          const { cx, cy, r } = component.circleProps();
          this.ctx?.arc(cx + component.x(), cy + component.y(), r, 0, Math.PI * 2, false);
          this.ctx!.strokeStyle = '#2465D3';
          this.ctx!.lineWidth = 10;
          this.ctx?.stroke();
          this.ctx?.clip();
          this.ctx?.drawImage(
            element,
            component.x(),
            component.y(),
            component.width(),
            component.height()
          );
          this.ctx?.restore();
        } else if (component?.clipType() === 'rectangle') {
          this.ctx?.save();
          this.ctx?.beginPath();
          const { x, y, width, height } = component.rectProps();
          this.ctx?.moveTo(x + component.x() + 20, y + component.y());
          this.ctx?.lineTo(x + component.x() + width - 20, y + component.y());
          this.ctx?.quadraticCurveTo(
            x + component.x() + width,
            y + component.y(),
            x + component.x() + width,
            y + component.y() + 20
          );
          this.ctx?.lineTo(x + component.x() + width, y + component.y() + height - 20);
          this.ctx?.quadraticCurveTo(
            x + component.x() + width,
            y + component.y() + height,
            x + component.x() + width - 20,
            y + component.y() + height
          );
          this.ctx?.lineTo(x + component.x() + 20, y + component.y() + height);
          this.ctx?.quadraticCurveTo(
            x + component.x(),
            y + component.y() + height,
            x + component.x(),
            y + component.y() + height - 20
          );
          this.ctx?.lineTo(x + component.x(), y + component.y() + 20);
          this.ctx?.quadraticCurveTo(
            x + component.x(),
            y + component.y(),
            x + component.x() + 20,
            y + component.y()
          );
          this.ctx?.closePath();
          this.ctx!.strokeStyle = '#2465D3';
          this.ctx!.lineWidth = 10;
          this.ctx?.stroke();
          this.ctx?.clip();
          this.ctx?.drawImage(
            element,
            component.x(),
            component.y(),
            component.width(),
            component.height()
          );
          this.ctx?.restore();
        } else {
          this.ctx?.drawImage(
            element,
            component.x(),
            component.y(),
            component.width(),
            component.height()
          );
        }
      }
    });

    // this.ctx?.drawImage(screenElement, screen.x(), screen.y(), screen.width(), screen.height());

    // if (webcam.clipType() === 'circle') {
    //   this.ctx.save();
    //   this.ctx.beginPath();
    //   const { cx, cy, r } = webcam.circleProps();
    //   this.ctx.arc(cx + webcam.x(), cy + webcam.y(), r, 0, Math.PI * 2, false);
    //   this.ctx.strokeStyle = '#2465D3';
    //   this.ctx.lineWidth = 10;
    //   this.ctx.stroke();
    //   this.ctx.clip();
    //   this.ctx.drawImage(webcamElement, webcam.x(), webcam.y(), webcam.width(), webcam.height());
    //   this.ctx.restore();
    // } else {
    //   this.ctx.drawImage(webcamElement, webcam.x(), webcam.y(), webcam.width(), webcam.height());
    // }

    // // draw our screen share in top-left
    // // would need to do real math to get proper aspect ratio.

    // this.ctx.save();
    // this.ctx.beginPath();
    // this.ctx.arc(150, 150, 130, 0, Math.PI * 2, false);
    // this.ctx.strokeStyle = '#2465D3';
    // this.ctx.lineWidth = 20;
    // this.ctx.stroke();
    // this.ctx.clip();
    // this.ctx.drawImage(videoEl, 0, 0, 300, 300);
    // this.ctx.restore();

    // // draw our webcam in bottom right.
    // // would need to do real math to get proper aspect ratio.
    // this.ctx.drawImage(webcamEl, width - 200, height - 100, 200, 100);
  }
}
