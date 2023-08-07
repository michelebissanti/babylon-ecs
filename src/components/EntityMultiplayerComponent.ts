
export class EntityMultiplayerComponent {
    serverId: string;
    send: boolean = false;
    delete: string = "";

    constructor(send?: boolean) {
        this.send = send
    }
}