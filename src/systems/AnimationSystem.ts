import { Scene } from "@babylonjs/core";
import { Entity, IterativeSystem, Query } from "tick-knock";
import { AnimationComponent } from "../components/AnimationComponent";
import { EntityMultiplayerComponent } from "../components/EntityMultiplayerComponent";
import { Utils } from "../utils";

// Animation System: gestisce tutte le entità che possiedono un AnimationComponent o che devono istanziarlo
// in generale si occupa di sincronizzare le animazioni con il server
export class AnimationSystem extends IterativeSystem {
    scene: Scene;
    lastDt: number = 0;

    constructor(scene: Scene) {
        //entra nel loop del sistema solo se ha AnimationComponent o EntityMultiplayerComponent
        super(new Query((entity) => (entity.hasComponent(AnimationComponent) || entity.hasComponent(EntityMultiplayerComponent))));
        this.scene = scene;
    }

    protected async updateEntity(entity: Entity, dt: number): Promise<void> {

        this.lastDt += dt;

        if (Utils.room != null) {

            if (entity.has(AnimationComponent) && entity.has(EntityMultiplayerComponent)) {
                let animComponent = entity.get(AnimationComponent);
                let entityServer = entity.get(EntityMultiplayerComponent);

                //se l'entità non è stata mai inviata al server, invio il segnale di creazione
                if (animComponent.id == undefined && entityServer.serverId != undefined) {
                    Utils.room.send("attachAnimationComponent", {
                        id: "" + entityServer.serverId,
                        state: animComponent.state,
                        currentFrame: animComponent.currentFrame,
                        isVideo: animComponent.isVideo
                    });

                    animComponent.id = entityServer.serverId;
                }

                //se l'animazione è in riproduzione, invio lo stato al server
                if (animComponent.id != undefined && animComponent.state != "pause" && entityServer.busy == Utils.room.sessionId) {

                    if (animComponent.isVideo == false) {
                        //se il sistema deve gestire un oggetto 3d animato
                        animComponent.currentFrame = animComponent.animGroup[+animComponent.state].animatables[0].masterFrame;
                    } else {
                        //se il sistema deve gestire un video
                        animComponent.currentFrame = animComponent.video.video.currentTime;
                    }

                    if (this.lastDt >= 1) {
                        Utils.room.send("updateAnimationComponent", {
                            id: "" + entityServer.serverId,
                            state: animComponent.state,
                            currentFrame: animComponent.currentFrame
                        });

                        this.lastDt = 0;

                    }





                    animComponent.isStoppable = true;

                }

                //quando l'animazione è in pausa
                if (animComponent.id != undefined && animComponent.state == "pause" && animComponent.isStoppable == true && entityServer.busy == Utils.room.sessionId) {

                    animComponent.isStoppable = false;

                    Utils.room.send("updateAnimationComponent", {
                        id: "" + entityServer.serverId,
                        state: animComponent.state,
                        currentFrame: animComponent.currentFrame
                    });


                }




            }
        }

    }
}