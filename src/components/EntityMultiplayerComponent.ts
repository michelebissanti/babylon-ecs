
export class EntityMultiplayerComponent {
    serverId: string;
    send: boolean = false;
    delete: string = "";
    busy: string = undefined;

    constructor(send?: boolean) {
        this.send = send
    }
}