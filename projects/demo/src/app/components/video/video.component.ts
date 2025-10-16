import {
  afterNextRender,
  Component,
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

  circle = viewChild<ElementRef<SVGCircleElement>>('circle');
  rectangle = viewChild<ElementRef<SVGRectElement>>('rectangle');
  circleHandle = viewChild<ElementRef<SVGCircleElement>>('circleHandle');

  mask = viewChild<ElementRef<SVGCircleElement>>('mask');

  srcObject = input<MediaStream | undefined>(undefined);

  width = model<number>(400);
  height = model<number>(300);

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
      const src = this.srcObject();
      console.log('src changed', src);
    });

    effect(() => {
      const videoDO = this.videoDO();
      if (videoDO) {
        videoDO.component = this;
      }
    });

    afterNextRender(() => {
      console.log(this.video()?.nativeElement);
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
      console.log(pos);
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

      console.log(circleX);

      //
      //circle.style.transform = `translate(${circleX}px, ${circleY}px)`;
      //this.el.nativeElement.style.transform = `translate(${pos.deltaX}px, ${pos.deltaY}px)`;
    });
  }

  addDragNDropRect() {
    console.log('add drag n drop rectangle');
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
      console.log(pos.startOffsetX, this.rectProps().width);
      const x = pos.deltaX / this.scale();
      const y = pos.deltaY / this.scale();

      rectX = startX + x;
      rectY = startY + y;

      console.log('start offset', pos.startOffsetX, pos.startOffsetY);

      if (pos.startOffsetX < 10) {
        // left resize
        console.log('left resize');
      } else if (pos.startOffsetX / this.scale() > rect.width - 50) {
        // right resize
        console.log('right resize');

        const x = pos.originalEvent.x / this.scale();
        const w = x  - rect.x;

        //let width = pos.originalEvent.x - rect.left + rect.width - pos.startOffsetX;
        console.log('new width', w);
        this.rectProps.update((props) => ({ ...props, width: Math.round(w) }));
      } else if (pos.startOffsetY < 10) {
        // top resize
        console.log('top resize');
      } else if (pos.startOffsetY > this.rectProps().height - 10) {
        // bottom resize
        console.log('bottom resize');
      } else {
        // move
        console.log('move');

        this.rectProps.update((props) => ({ ...props, x: rectX, y: rectY }));
      }

      //this.x.set(startX + x);
      //this.y.set(startY + y);
      //this.el.nativeElement.style.left = `${x}px`;
      //this.el.nativeElement.style.top = `${y}px`;

      // this.mask()?.nativeElement.setAttribute('cx', `${circleX}`);
      // this.mask()?.nativeElement.setAttribute('cy', `${circleY}`);
      // this.mask()?.nativeElement.setAttribute('r', `${this.circleProps().r}`);
      //
      //circle.style.transform = `translate(${circleX}px, ${circleY}px)`;
      //this.el.nativeElement.style.transform = `translate(${pos.deltaX}px, ${pos.deltaY}px)`;
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
      console.log(pos);
      const x = pos.deltaX / this.scale();
      const y = pos.deltaY / this.scale();

      circleX = startX + x;
      circleY = startY + y;
      //this.x.set(startX + x);
      //this.y.set(startY + y);
      //this.el.nativeElement.style.left = `${x}px`;
      //this.el.nativeElement.style.top = `${y}px`;

      this.circleProps.update((props) => ({ ...props, cx: circleX, cy: circleY }));

      this.mask()?.nativeElement.setAttribute('cx', `${circleX}`);
      this.mask()?.nativeElement.setAttribute('cy', `${circleY}`);
      this.mask()?.nativeElement.setAttribute('r', `${this.circleProps().r}`);
      //
      //circle.style.transform = `translate(${circleX}px, ${circleY}px)`;
      //this.el.nativeElement.style.transform = `translate(${pos.deltaX}px, ${pos.deltaY}px)`;
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

      // check if right resize drag

      //this.el.nativeElement.style.left = `${x}px`;
      //this.el.nativeElement.style.top = `${y}px`;

      //this.el.nativeElement.style.transform = `translate(${pos.deltaX}px, ${pos.deltaY}px)`;
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

          // const h1Elem = this.el.nativeElement.querySelector('h1');
          // const pElem = this.el.nativeElement.querySelector('p');
          // if (contentBoxSize) {
          //   h1Elem.style.fontSize = `${Math.max(1.5, contentBoxSize.inlineSize / 200)}rem`;
          //   pElem.style.fontSize = `${Math.max(1, contentBoxSize.inlineSize / 600)}rem`;
          // } else {
          //   h1Elem.style.fontSize = `${Math.max(1.5, entry.contentRect.width / 200)}rem`;
          //   pElem.style.fontSize = `${Math.max(1, entry.contentRect.width / 600)}rem`;
          // }
        }
      }

      console.log('Size changed');
    });

    this.resizeObserver.observe(this.el.nativeElement);
  }

  videoLoaded(event: Event) {
    const videoEl = this.video()?.nativeElement;

    if (videoEl) {
      console.log('video loaded', videoEl.videoWidth, videoEl.videoHeight);
      setTimeout(() => {
        const rect = this.el.nativeElement.getBoundingClientRect();
        console.log('rect', rect);
        console.log(Math.round(rect.width / this.scale()), Math.round(rect.height / this.scale()));
        this.height.set(Math.round(rect.height / this.scale()));
        this.width.set(Math.round(rect.width / this.scale()));
      }, 1000);
    }
  }
}
