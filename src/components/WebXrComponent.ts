import { WebXRDefaultExperience } from '@babylonjs/core';

export class WebXrComponent {
    exp: WebXRDefaultExperience;
    constructor(exp: WebXRDefaultExperience) {
        this.exp = exp;
    }
}