import { Client, Room } from "colyseus.js";

// questa componente serve a sincronizzare con il server la componente di Mesh
export class MeshMultiComponent {
    id: string;
    name: string;
    location: string;
    render: boolean = false;
    isLocalPlayer: boolean = false;

    constructor(location: string, name: string, render?: boolean, send?: boolean, isLocalPlayer?: boolean) {
        this.name = name;
        this.location = location;
        this.render = render;
        this.isLocalPlayer = isLocalPlayer;
    }
}