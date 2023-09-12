import { Scene } from "@babylonjs/core";
import { Entity, IterativeSystem, Query } from "tick-knock";
import { EntityMultiplayerComponent } from "../components/EntityMultiplayerComponent";
import { Utils } from "../utils";
import { MeshArrayComponent } from "../components/MeshArrayComponent";
import { MeshComponent } from "../components/MeshComponent";
import { AnimationComponent } from "../components/AnimationComponent";

// MultiplayerSystem: gestisce l'entità che possiede EntityMultiplayerComponent
// in generale serve a sincronizzare con il server le entità ecs
export class MultiplayerSystem extends IterativeSystem {
    scene: Scene;
    private entityCodeResponse: string = null;
    private init = true;

    constructor(scene: Scene) {
        //entra nel loop del sistema solo se ha EntityMultiplayerComponent
        super(new Query((entity) => entity.hasComponent(EntityMultiplayerComponent)));
        this.scene = scene;
    }

    protected async updateEntity(entity: Entity, dt: number): Promise<void> {
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
                if (entity.get(EntityMultiplayerComponent).send == true && entity.get(EntityMultiplayerComponent).serverId == undefined && entity.get(EntityMultiplayerComponent).loading == false) {

                    await Utils.waitForConditionAsync(_ => {
                        return this.entityCodeResponse != null;
                    }).then(_ => {
                        entity.get(EntityMultiplayerComponent).serverId = this.entityCodeResponse;
                        Utils.savedEntities.set(entity.get(EntityMultiplayerComponent).serverId, entity.id);
                        this.entityCodeResponse = null;
                    });



                    //console.log(entity.get(EntityMultiplayerComponent).serverId);
                }

                //caso della entità locale da sincronizzare
                if (entity.get(EntityMultiplayerComponent).send == false && entity.get(EntityMultiplayerComponent).serverId == undefined) {
                    entity.get(EntityMultiplayerComponent).send = true;
                    entity.get(EntityMultiplayerComponent).loading = true;

                    Utils.room.send("createEntity", {
                    });

                    /*  await Utils.waitForConditionAsync(_ => {
                         return this.entityCodeResponse != null;
                     }); */



                }

                if (entity.get(EntityMultiplayerComponent).loading == true && this.entityCodeResponse != null) {
                    entity.get(EntityMultiplayerComponent).loading = false;
                    console.log(this.entityCodeResponse);
                    entity.get(EntityMultiplayerComponent).serverId = this.entityCodeResponse;
                    Utils.savedEntities.set(entity.get(EntityMultiplayerComponent).serverId, entity.id);
                    this.entityCodeResponse = null;
                }



                //per rimuovere un entità
                if (entity.get(EntityMultiplayerComponent).delete == "true") {

                    entity.get(EntityMultiplayerComponent).delete = "done";

                    // se ha una mesh la distruggo
                    if (entity.has(MeshArrayComponent)) {
                        entity.get(MeshArrayComponent).meshes[0].dispose();
                    }

                    if (entity.has(MeshComponent)) {
                        entity.get(MeshComponent).mesh.dispose();
                    }

                    if (entity.has(AnimationComponent)) {
                        if (entity.get(AnimationComponent).isVideo) {
                            entity.get(AnimationComponent).video.dispose();
                        }
                    }

                    Utils.savedEntities.delete(entity.get(EntityMultiplayerComponent).serverId);



                    // tutte le componenti vengono rimosse quando rimuovo dall'engine
                    this.engine.removeEntity(entity);



                    Utils.room.send("removeEntity", {
                        id: "" + entity.get(EntityMultiplayerComponent).serverId,
                    });
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