import { AnimationGroup } from '@babylonjs/core';

export class AnimationComponent {
    animGroup: AnimationGroup[];
    state: string = null;
    id: string;

    constructor(animGroup: AnimationGroup[]) {
        this.animGroup = animGroup;
    }
}