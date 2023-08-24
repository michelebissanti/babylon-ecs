import { AnimationGroup, VideoTexture } from '@babylonjs/core';

// questo componente serve a gestire le animazioni di una entità
// viene usato per:
//  - oggetti 3d che contengono animazioni
//  - video da riprodurre
export class AnimationComponent {
    animGroup: AnimationGroup[];
    //lo stato indica cosa si sta riproducendo, nel caso di un oggetto 3d è l'indice dell'animazione in esecuzione
    state: string = "pause";
    id: string;
    isStoppable: boolean = false;
    currentFrame: number = 0;
    video: VideoTexture;
    isVideo: boolean = false;

    constructor(animGroup?: AnimationGroup[], video?: VideoTexture, isVideo?: boolean) {
        this.animGroup = animGroup;
        this.video = video;
        this.isVideo = isVideo;
    }
}