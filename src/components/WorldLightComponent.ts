import { Light } from '@babylonjs/core';

export class WorldLightComponent {
    light: Light;
    constructor(light: Light) {
        this.light = light;
    }
}