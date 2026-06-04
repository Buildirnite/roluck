declare module 'gif.js' {
  interface GIFOptions {
    workers?: number;
    quality?: number;
    workerScript?: string;
    width?: number;
    height?: number;
    repeat?: number;
    background?: string;
    transparent?: number | null;
  }
  interface AddFrameOptions {
    delay?: number;
    copy?: boolean;
  }
  export default class GIF {
    constructor(options?: GIFOptions);
    addFrame(image: CanvasImageSource | ImageData, options?: AddFrameOptions): void;
    on(event: 'finished', cb: (blob: Blob) => void): void;
    on(event: 'progress', cb: (progress: number) => void): void;
    on(event: 'abort' | 'start', cb: () => void): void;
    render(): void;
    abort(): void;
  }
}
