import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { makeDraggable } from '../../util/drag.util';
import { VideoDO } from '../../model/video';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import { createSegmenter } from './segmenter';
import { image } from '@tensorflow/tfjs-core';

@Component({
  selector: 'app-video',
  imports: [],
  templateUrl: './video.component.html',
  styleUrl: './video.component.scss',
  host: {
    '(click)': 'onClick($event)',
  },
})
export class VideoComponent {
  private resizeObserver: ResizeObserver | null = null;

  video = viewChild<ElementRef<HTMLVideoElement>>('video');

  canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  circle = viewChild<ElementRef<SVGCircleElement>>('circle');
  rectangle = viewChild<ElementRef<SVGRectElement>>('rectangle');
  circleHandle = viewChild<ElementRef<SVGCircleElement>>('circleHandle');

  mask = viewChild<ElementRef<SVGCircleElement>>('mask');

  srcObject = input<MediaStream | undefined>(undefined);

  width = model<number>(400);
  height = model<number>(300);

  blurCanvasScale = computed(() => {
    const w = this.width();
    const originalWidth = this.videoDO().settings.width;
    const scale = w / (originalWidth || 1);

    return scale;
  });

  videoDO = input.required<VideoDO>();

  el = inject(ElementRef);

  x = signal(0);
  y = signal(0);

  selected = output<VideoComponent>();

  clipType = model<'circle' | 'rectangle' | 'none'>('none');

  showClippedHint = model<boolean>(true);

  scale = input<number>(1);

  border = model<boolean>(true);
  borderColor = model<string>('#ffffff');
  borderWidth = model<number>(4);

  circleProps = model<{ cx: number; cy: number; r: number }>({ cx: 160, cy: 120, r: 120 });
  rectProps = model<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 320,
    height: 240,
  });

  constructor() {
    effect(() => {
      const videoDO = this.videoDO();
      if (videoDO) {
        videoDO.component = this;
      }
    });

    effect(() => {
      const backgroundType = this.videoDO().backgroundType();
      if (backgroundType === 'none') {
        this.stopBackgroundEffect();
      } else {
        this.startBackgroundEffect();
      }
    });

    afterNextRender(() => {
      this.addDragNDrop();
      this.addDragNDropCircle();
      this.addCircleHandleDnD();
      this.addDragNDropRect();
      this.watchResize();
    });
  }

  onClick(event: Event) {
    this.selected.emit(this);
  }

  addCircleHandleDnD() {
    console.log('add drag n drop circle');
    const circleHandle = this.circleHandle()?.nativeElement;
    if (!circleHandle) {
      return;
    }
    const { dragMove$, dragStart$ } = makeDraggable(circleHandle);

    let circleX = 0;
    let circleY = 0;
    let startX = 0;
    let startY = 0;

    dragStart$.subscribe((pos) => {
      startX = this.circleProps().cx + this.circleProps().r;
      startY = this.circleProps().cy;
    });

    dragMove$.subscribe((pos) => {
      const x = pos.deltaX / this.scale();
      const y = pos.deltaY / this.scale();

      circleX = startX + x;
      circleY = startY + y;

      const newR = circleX - this.circleProps().cx;
      this.circleProps.update((props) => ({ ...props, r: newR }));
      //this.x.set(startX + x);
      //this.y.set(startY + y);
      //this.el.nativeElement.style.left = `${x}px`;
      //this.el.nativeElement.style.top = `${y}px`;

      //
      //circle.style.transform = `translate(${circleX}px, ${circleY}px)`;
      //this.el.nativeElement.style.transform = `translate(${pos.deltaX}px, ${pos.deltaY}px)`;
    });
  }

  addDragNDropRect() {
    const rectangle = this.rectangle()?.nativeElement;
    if (!rectangle) {
      return;
    }
    const { dragMove$, dragStart$ } = makeDraggable(rectangle);

    let rectX = 0;
    let rectY = 0;
    let startX = 0;
    let startY = 0;

    let dragType = 'none';

    let rect = this.rectProps();

    dragStart$.subscribe((pos) => {
      startX = this.rectProps().x;
      startY = this.rectProps().y;
      rect = this.rectProps();
    });

    dragMove$.subscribe((pos) => {
      const x = pos.deltaX / this.scale();
      const y = pos.deltaY / this.scale();

      rectX = startX + x;
      rectY = startY + y;

      if (pos.startOffsetX < 10) {
        // left resize
      } else if (pos.startOffsetX / this.scale() > rect.width - 50) {
        // right resize

        const x = pos.originalEvent.x / this.scale();
        const w = x - rect.x;

        //let width = pos.originalEvent.x - rect.left + rect.width - pos.startOffsetX;
        this.rectProps.update((props) => ({ ...props, width: Math.round(w) }));
      } else if (pos.startOffsetY < 10) {
        // top resize
      } else if (pos.startOffsetY > this.rectProps().height - 10) {
        // bottom resize
      } else {
        // move

        this.rectProps.update((props) => ({ ...props, x: rectX, y: rectY }));
      }
    });
  }

  addDragNDropCircle() {
    console.log('add drag n drop circle');
    const circle = this.circle()?.nativeElement;
    if (!circle) {
      return;
    }
    const { dragMove$, dragStart$ } = makeDraggable(circle);

    let circleX = 0;
    let circleY = 0;
    let startX = 0;
    let startY = 0;

    dragStart$.subscribe((pos) => {
      startX = this.circleProps().cx;
      startY = this.circleProps().cy;
    });

    dragMove$.subscribe((pos) => {
      const x = pos.deltaX / this.scale();
      const y = pos.deltaY / this.scale();

      circleX = startX + x;
      circleY = startY + y;

      this.circleProps.update((props) => ({ ...props, cx: circleX, cy: circleY }));

      this.mask()?.nativeElement.setAttribute('cx', `${circleX}`);
      this.mask()?.nativeElement.setAttribute('cy', `${circleY}`);
      this.mask()?.nativeElement.setAttribute('r', `${this.circleProps().r}`);
    });
  }

  addDragNDrop() {
    console.log('add drag n drop');
    const { dragMove$, dragStart$ } = makeDraggable(this.el.nativeElement);

    let startX = 0;
    let startY = 0;
    let rect = this.el.nativeElement.getBoundingClientRect();

    dragStart$.subscribe((pos) => {
      rect = this.el.nativeElement.getBoundingClientRect();
      startX = this.x();
      startY = this.y();
    });

    dragMove$.subscribe((pos) => {
      console.log(pos);

      if (pos.startOffsetX < 10) {
        // left resize
        console.log('left resize');
      } else if (pos.startOffsetX > rect.width - 10) {
        // right resize
        console.log('right resize');

        const x = pos.originalEvent.x / this.scale();
        const w = x - rect.left / this.scale();

        //let width = pos.originalEvent.x - rect.left + rect.width - pos.startOffsetX;
        console.log('new width', w);
        this.width.set(Math.round(w));
      } else if (pos.startOffsetY < 10) {
        // top resize
        console.log('top resize');
      } else if (pos.startOffsetY > rect.height - 10) {
        // bottom resize
        console.log('bottom resize');
      } else {
        // move
        console.log('move');

        console.log('scale is', this.scale());

        const x = pos.deltaX / this.scale();
        const y = pos.deltaY / this.scale();
        this.x.set(startX + x);
        this.y.set(startY + y);
        this.el.nativeElement.style.transform = `translate(${startX + x}px, ${startY + y}px)`;
      }
    });
  }

  watchResize() {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          const contentBoxSize = entry.contentBoxSize[0];
          const width = contentBoxSize.inlineSize;
          const height = contentBoxSize.blockSize;
          // this.width.set(Math.round(width));
          this.height.set(Math.round(height));
        }
      }

      console.log('Size changed');
    });

    this.resizeObserver.observe(this.el.nativeElement);
  }

  videoLoaded(event: Event) {
    const videoEl = this.video()?.nativeElement;

    if (videoEl) {
      setTimeout(() => {
        const rect = this.el.nativeElement.getBoundingClientRect();
        this.height.set(Math.round(rect.height / this.scale()));
        this.width.set(Math.round(rect.width / this.scale()));
      }, 1000);
    }
  }

  segmenter: bodySegmentation.BodySegmenter | null = null;

  getSegmenter = async () => {
    if (!this.segmenter) {
      this.segmenter = await createSegmenter();
    }
    return this.segmenter;
  };

  animationId: number | null = null;

  async stopBackgroundEffect() {
    const canvas = this.canvas()?.nativeElement;
    if (canvas) {
      canvas.style.display = 'none';
    }
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  async startBackgroundEffect() {
    const backgroundType = this.videoDO().backgroundType();
    if (backgroundType === 'blur') {
      await this.blurBackground();
    } else if (backgroundType === 'image') {
      await this.changeBackground();
    }
  }

  async blurBackground() {
    const segmenter = await this.getSegmenter();
    const video = this.video()?.nativeElement;
    const canvas = this.canvas()?.nativeElement;

    if (!video || !canvas) {
      return;
    }

    canvas.style.display = 'block';

    console.log('canvas size', canvas.width, canvas.height);

    const processFrame = async () => {
      const rect = video.getBoundingClientRect();

      const foregroundThreshold = this.videoDO().foregroundThreshold();
      const edgeBlurAmount = this.videoDO().edgeBlurAmount();
      const flipHorizontal = false;
      const blurAmount = this.videoDO().blurAmount();
      // canvas!.width = rect!.width;
      // canvas!.height = rect!.height;
      console.log('updated canvas size', canvas.width, canvas.height);
      const segmentation = await segmenter.segmentPeople(video);
      await bodySegmentation.drawBokehEffect(
        canvas,
        video,
        segmentation,
        foregroundThreshold,
        blurAmount,
        edgeBlurAmount,
        flipHorizontal,
      );
      this.animationId = requestAnimationFrame(processFrame);
    };
    this.animationId = requestAnimationFrame(processFrame);
  }

  async changeBackground() {
    const video = this.video()?.nativeElement;
    const canvas = this.canvas()?.nativeElement;

    if (!video || !canvas) {
      return;
    }

    canvas.style.display = 'block';

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }
    const segmenter = await this.getSegmenter();
    const processFrame = async () => {
      console.log('process frame for remove');
      context.drawImage(video, 0, 0);
      const segmentation = await segmenter.segmentPeople(video);

      const foregroundCollor = { r: 255, g: 255, b: 255, a: 0 };
      const backgroundColor = { r: 0, g: 0, b: 0, a: 255 };
      const coloredPartImage = await bodySegmentation.toBinaryMask(
        segmentation,
        foregroundCollor,
        backgroundColor,
      );
      const imageData = context.getImageData(0, 0, video.videoWidth, video.videoHeight);

      //bodySegmentation.drawMask(canvas, video, coloredPartImage, 1, 0, false);

      // imageData format; [R,G,B,A,R,G,B,A...]
      // below for loop iterate through alpha channel
      for (let i = 3; i < imageData.data.length; i += 4) {
        // By default background pixels alpha will be 255.
        if (coloredPartImage.data[i] === 255) {
          imageData.data[i] = 0; // this is a background pixel's alpha. Make it fully transparent
        }
      }

      // Why is this not working?
      //await bodySegmentation.drawMask(canvas, video, imageData, 1);

      context.putImageData(imageData, 0, 0);
      this.animationId = requestAnimationFrame(processFrame);
    };
    this.animationId = requestAnimationFrame(processFrame);
  }
}
