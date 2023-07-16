import { Client, Room } from "colyseus.js";

export class MeshMultiComponent {
    id: string;
    name: string;
    location: string;
    render: boolean = false;

    constructor(location: string, name: string, render?: boolean) {
        this.name = name;
        this.location = location;
        this.render = render;
    }
}