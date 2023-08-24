import { WebXRDefaultExperience } from '@babylonjs/core';

// questa componente serve ad astrarre la sessione webxr
// dovrebbe essere associata solo ad una entità, ovvero il player locale
export class WebXrComponent {
    exp: WebXRDefaultExperience;
    constructor(exp: WebXRDefaultExperience) {
        this.exp = exp;
    }
}