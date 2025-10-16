import { VideoComponent } from "../components/video/video.component";



export class VideoDO {
    
    component?: VideoComponent;
    stream: MediaStream | undefined;

}


export interface Recording {
    chunks: Blob[];
    name: string;
}