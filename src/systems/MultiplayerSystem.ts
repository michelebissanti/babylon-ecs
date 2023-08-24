import { Scene } from "@babylonjs/core";
import { Entity, IterativeSystem, Query } from "tick-knock";
import { EntityMultiplayerComponent } from "../components/EntityMultiplayerComponent";
import { Utils } from "../utils";

// MultiplayerSystem: gestisce l'entità che possiede EntityMultiplayerComponent
// in generale serve a sincronizzare con il server le entità ecs
export class MultiplayerSystem extends IterativeSystem {
    scene: Scene;
    private entityCodeResponse: string = undefined;
    private init = true;

    constructor(scene: Scene) {
        //entra nel loop del sistema solo se ha EntityMultiplayerComponent
        super(new Query((entity) => entity.hasComponent(EntityMultiplayerComponent)));
        this.scene = scene;
    }

    protected updateEntity(entity: Entity, dt: number): void {
        if (Utils.room != null) {
            if (this.init) {
                // se sono in una stanza setto i listener

                //questi listener servono e ricevere il codice entità deciso dal server quando riceve una nuova entità
                Utils.room.onMessage("playerCreated", (message) => {
                    this.entityCodeResponse = message;
                });

                Utils.room.onMessage("entityCreated", (message) => {
                    this.entityCodeResponse = message;
                });

                this.init = false;
            }

            // invio al server la presenza di nuove entità
            if (entity.has(EntityMultiplayerComponent)) {

                //caso del player che joina la stanza
                if (entity.get(EntityMultiplayerComponent).send == true && entity.get(EntityMultiplayerComponent).serverId == undefined) {

                    Utils.waitForConditionAsync(_ => {
                        return this.entityCodeResponse != undefined;
                    }).then(_ => {
                        entity.get(EntityMultiplayerComponent).serverId = this.entityCodeResponse;
                        Utils.savedEntities.set(entity.get(EntityMultiplayerComponent).serverId, entity.id);
                        this.entityCodeResponse = undefined;
                    });



                    //console.log(entity.get(EntityMultiplayerComponent).serverId);
                }

                //caso della entità locale da sincronizzare
                if (entity.get(EntityMultiplayerComponent).send == false && entity.get(EntityMultiplayerComponent).serverId == undefined) {
                    entity.get(EntityMultiplayerComponent).send = true;

                    Utils.room.send("createEntity", {
                    });

                    Utils.waitForConditionAsync(_ => {
                        return this.entityCodeResponse != undefined;
                    }).then(_ => {

                        entity.get(EntityMultiplayerComponent).serverId = this.entityCodeResponse;
                        Utils.savedEntities.set(entity.get(EntityMultiplayerComponent).serverId, entity.id);
                        this.entityCodeResponse = undefined;

                    });

                    //console.log(entity.get(EntityMultiplayerComponent).serverId);
                }

                //per rimuovere un entità
                if (entity.get(EntityMultiplayerComponent).delete == "true") {
                    Utils.room.send("removeEntity", {
                        id: "" + entity.get(EntityMultiplayerComponent).serverId,
                    });

                    entity.get(EntityMultiplayerComponent).delete = "done";
                }

                //per occupare un entità
                if (entity.get(EntityMultiplayerComponent).busy == "true") {
                    Utils.room.send("setBusy", {
                        id: "" + entity.get(EntityMultiplayerComponent).serverId,
                    });

                    entity.get(EntityMultiplayerComponent).busy = Utils.room.sessionId;
                }

                //per liberare un entità
                if (entity.get(EntityMultiplayerComponent).busy == "false") {
                    Utils.room.send("setIdle", {
                        id: "" + entity.get(EntityMultiplayerComponent).serverId,
                    });

                    entity.get(EntityMultiplayerComponent).busy = undefined;
                }



            }
        }
    }
}