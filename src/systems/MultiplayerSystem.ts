import { Engine, Entity, EntitySnapshot, IterativeSystem, Query, QueryBuilder, System } from "tick-knock";
import { AbstractMesh, KeyboardEventTypes, Matrix, Mesh, MeshBuilder, Quaternion, Scene, SceneLoader, Vector3 } from "@babylonjs/core";
import { ClientComponent } from "../components/ClientComponent";
import { EntityMultiplayerComponent } from "../components/EntityMultiplayerComponent";
import { Room } from "colyseus.js";
import { Utils } from "../utils";

export class MultiplayerSystem extends IterativeSystem {
    scene: Scene;
    private Entities: { [playerId: string]: number } = {};
    private entityCodeResponse: string = undefined;
    private init = true;

    constructor(scene: Scene) {
        super(new Query((entity) => entity.hasComponent(EntityMultiplayerComponent)));
        this.scene = scene;
    }

    protected updateEntity(entity: Entity, dt: number): void {
        if (Utils.room != null) {
            if (this.init) {
                Utils.room.onMessage("playerCreated", (message) => {
                    this.entityCodeResponse = message;
                });

                Utils.room.onMessage("entityCreated", (message) => {
                    this.entityCodeResponse = message;
                });

                this.init = false;
            }

            //invio al server la presenza di nuove entità
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

                if (entity.get(EntityMultiplayerComponent).delete == "true") {
                    Utils.room.send("removeEntity", {
                        id: "" + entity.get(EntityMultiplayerComponent).serverId,
                    });

                    entity.get(EntityMultiplayerComponent).delete = "done";
                }


            }
        }
    }
}