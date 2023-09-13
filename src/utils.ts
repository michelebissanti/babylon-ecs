import { Quaternion, Scene, SceneLoader, WebXRDefaultExperience } from "@babylonjs/core";

import { Room } from "colyseus.js";
import { Engine, Entity } from "tick-knock";
import { AnimationComponent } from "./components/AnimationComponent";
import { EntityMultiplayerComponent } from "./components/EntityMultiplayerComponent";
import { MeshArrayComponent } from "./components/MeshArrayComponent";
import { MeshComponent } from "./components/MeshComponent";
import { MeshMultiComponent } from "./components/MeshMultiComponent";
import { TransformComponent } from "./components/TransformComponent";

// classe che rappresenta le informazioni per un oggetto 3d da poter inserire
// questa classe viene utilizzata per fornire un array di oggetti da visualizzare nella gui
export class Object3d {
    nome: string;
    urlIcona: string;
    percorso: string;
    nomeFile: string;

    constructor(nome, urlIcona, percorso, nomeFile) {
        this.nome = nome;
        this.urlIcona = urlIcona;
        this.percorso = percorso;
        this.nomeFile = nomeFile;
    }
}

// classe che rappresenta le informazioni per un video da poter inserire nella stanza
// questa classe viene utilizzata per fornire un array di video da visualizzare nella gui
export class CustomVideo {
    nome: string;
    urlIcona: string;
    percorso: string;
    nomeFile: string;

    constructor(nome, urlIcona, percorso, nomeFile) {
        this.nome = nome;
        this.urlIcona = urlIcona;
        this.percorso = percorso;
        this.nomeFile = nomeFile;
    }
}

// classe che rappresenta le informazioni per un immagine da poter inserire nella stanza
// questa classe viene utilizzata per fornire un array di immagini da visualizzare nella gui
export class CustomImage {
    nome: string;
    urlIcona: string;
    percorso: string;
    nomeFile: string;

    constructor(nome, urlIcona, percorso, nomeFile) {
        this.nome = nome;
        this.urlIcona = urlIcona;
        this.percorso = percorso;
        this.nomeFile = nomeFile;
    }
}

// classe di utilità che contiene riferimenti a oggetti unici e globali e metodi statici
export class Utils {
    public static room: Room;
    public static engineEcs: Engine;
    public static scene: Scene;
    public static savedEntities = new Map<string, number>();
    public static inWebXR: boolean = false;
    public static webXRSession: WebXRDefaultExperience;

    /** Returns a new Quaternion set from the passed Euler float angles (y, x, z). */
    static euler(eulerX: number, eulerY: number, eulerZ: number): Quaternion {
        return Quaternion.RotationYawPitchRoll(eulerY, eulerX, eulerZ);
    }

    // restituisce la lista di oggetti 3d che si possono inserire in una stanza
    static getAvaiableObjects(): Array<Object3d> {
        let objects: Array<Object3d> = [];

        objects[0] = new Object3d("Cofee Cup", "models_image/coffee_cup.png", "models/", "coffee_cup.glb");
        objects[1] = new Object3d("Wood Chair", "models_image/chair.png", "models/", "chair.glb");
        objects[2] = new Object3d("Lion", "models_image/lion.png", "models/", "lion.glb");
        objects[3] = new Object3d("Table Football", "models_image/table_football.png", "models/", "table_football.glb");
        objects[4] = new Object3d("Mystery Block", "models_image/mystery_block.png", "models/", "mystery_block.glb");
        objects[5] = new Object3d("Bee", "models_image/bee.png", "models/", "bee.glb");

        return objects;

    }

    // restituisce la lista di video che si possono inserire in una stanza
    static getAvaiableVideo(): Array<CustomVideo> {
        let objects: Array<CustomVideo> = [];

        objects[0] = new CustomVideo("Train", "video_thumb/train.png", "video", "train.mp4");
        objects[1] = new CustomVideo("Magic", "video_thumb/magic.jpg", "video", "magic.mp4");

        return objects;

    }

    // restituisce la lista di immagini che si possono inserire in una stanza
    static getAvaiableImages(): Array<CustomImage> {
        let objects: Array<CustomImage> = [];

        objects[0] = new CustomImage("Future", "image/future.jpeg", "image", "future.jpeg");

        return objects;

    }


    static waitForConditionAsync(conditionFunction, timerInMs?: number, timeout?: number) {
        let isExpired = false;
        const poll = async resolve => {
            if (isExpired || await conditionFunction()) resolve();
            else setTimeout(_ => poll(resolve), timerInMs ? timerInMs : 100);
        }

        if (timeout) {
            setTimeout(() => isExpired = true, timeout);
        }

        return new Promise(poll);
    }

    // questa funzione inizializza tutti i listener che servono per la gestione multiplayer
    static setServerTrigger(engine: Engine) {

        // aspetto che l'utente sia in una stanza
        Utils.waitForConditionAsync(_ => {
            return Utils.room != null;
        }).then(_ => {

            // quando si aggiunge un entità al server
            Utils.room.state.entities.onAdd(async (serverEntity) => {
                // entra solo se chi ha inviato il messaggio non sono io
                if (serverEntity.sender != Utils.room.sessionId) {
                    console.log("nuova entita da server");
                    let joiner = new Entity();
                    joiner.addComponent(new EntityMultiplayerComponent(true));
                    engine.addEntity(joiner);

                    if (serverEntity.id != undefined) {
                        joiner.get(EntityMultiplayerComponent).serverId = serverEntity.id;
                    }

                    joiner.get(EntityMultiplayerComponent).isPlayer = serverEntity.isPlayer;

                    Utils.savedEntities.set(serverEntity.id, joiner.id);


                }

                serverEntity.onChange(async () => {
                    // aggiorno lo stato dell'entità
                    let localEntity = engine.getEntityById(Utils.savedEntities.get(serverEntity.id));

                    if (localEntity != undefined) {
                        localEntity.get(EntityMultiplayerComponent).busy = serverEntity.busy;
                    }
                });


            });

            // quando una entità viene rimossa dal server
            Utils.room.state.entities.onRemove((serverEntity) => {
                let localEntity = engine.getEntityById(this.savedEntities.get(serverEntity.id));

                if (localEntity != null) {

                    // se ha una mesh la distruggo
                    if (localEntity.has(MeshArrayComponent)) {
                        localEntity.get(MeshArrayComponent).meshes[0].dispose();
                    }

                    if (localEntity.has(MeshComponent)) {
                        localEntity.get(MeshComponent).mesh.dispose();
                    }

                    if (localEntity.has(AnimationComponent)) {
                        if (localEntity.get(AnimationComponent).isVideo) {
                            localEntity.get(AnimationComponent).video.dispose();
                        }
                    }

                    Utils.savedEntities.delete(serverEntity.id);

                    // tutte le componenti vengono rimosse quando rimuovo dall'engine
                    engine.removeEntity(localEntity);

                }



            });

            Utils.room.onLeave(code => {
            });




            // quando si aggiunge una componente di transform
            Utils.room.state.transformComponents.onAdd(async (entityServer, client) => {

                // cercare se esiste un entità con quel server id
                if (Utils.savedEntities.has(entityServer.id)) {
                    if (entityServer.sender != Utils.room.sessionId) {
                        let localEntity = engine.getEntityById(Utils.savedEntities.get(entityServer.id));
                        localEntity.add(new TransformComponent());
                        localEntity.get(TransformComponent).id = entityServer.id;

                        let transform = localEntity.get(TransformComponent);

                        transform.x = entityServer.x;
                        transform.y = entityServer.y;
                        transform.z = entityServer.z;
                        transform.rotation_x = entityServer.rotation_x;
                        transform.rotation_y = entityServer.rotation_y;
                        transform.rotation_z = entityServer.rotation_z;
                        transform.rotation_w = entityServer.rotation_w;
                        transform.scale_x = entityServer.scale_x;
                        transform.scale_y = entityServer.scale_y;
                        transform.scale_z = entityServer.scale_z;
                    }

                    entityServer.onChange(() => {
                        // aggiorno il modello prendendo la sua entità
                        let localEntity = engine.getEntityById(Utils.savedEntities.get(entityServer.id));

                        // aggiorno solo se non sono io a mandare l'update
                        if (entityServer.sender != Utils.room.sessionId) {

                            let transform = localEntity.get(TransformComponent);

                            transform.x = entityServer.x;
                            transform.y = entityServer.y;
                            transform.z = entityServer.z;
                            transform.rotation_x = entityServer.rotation_x;
                            transform.rotation_y = entityServer.rotation_y;
                            transform.rotation_z = entityServer.rotation_z;
                            transform.rotation_w = entityServer.rotation_w;
                            transform.scale_x = entityServer.scale_x;
                            transform.scale_y = entityServer.scale_y;
                            transform.scale_z = entityServer.scale_z;

                        }


                    });
                }

            });

            Utils.room.state.transformComponents.onRemove((entity) => {

            });






            // quando si aggiunge un componente di mesh
            Utils.room.state.meshComponents.onAdd(async (entityServer) => {

                if (Utils.savedEntities.has(entityServer.id)) {
                    if (entityServer.sender != Utils.room.sessionId) {
                        let localEntity = engine.getEntityById(Utils.savedEntities.get(entityServer.id));

                        localEntity.add(new MeshMultiComponent(entityServer.location, entityServer.name, false));
                        localEntity.get(MeshMultiComponent).id = entityServer.id;
                    }

                    entityServer.onChange(async () => {
                        // aggiorno il modello prendendo la sua entità
                        let localEntity = engine.getEntityById(Utils.savedEntities.get(entityServer.id));

                        // aggiorno solo se non sono io a mandare l'update
                        if (entityServer.sender != Utils.room.sessionId) {
                            localEntity.get(MeshMultiComponent).location = entityServer.location;
                            localEntity.get(MeshMultiComponent).name = entityServer.name;
                            localEntity.get(MeshMultiComponent).render = false;

                            // aggiorno e istanzio le modifiche
                            if (localEntity.has(MeshArrayComponent)) {
                                localEntity.get(MeshArrayComponent).meshes[0].dispose();
                            }

                        }

                    });
                }

            });

            Utils.room.state.meshComponents.onRemove((serverEntity) => {
            });




            // quando si aggiunge un componente di animazione
            Utils.room.state.animationComponents.onAdd((entityServer) => {

                if (Utils.savedEntities.has(entityServer.id)) {
                    // se non sono stato io ad inviarla
                    if (entityServer.sender != Utils.room.sessionId) {

                        let localEntity = engine.getEntityById(Utils.savedEntities.get(entityServer.id));

                        if (localEntity.has(AnimationComponent)) {
                            localEntity.get(AnimationComponent).id = entityServer.id;
                            localEntity.get(AnimationComponent).state = entityServer.state;
                            localEntity.get(AnimationComponent).currentFrame = entityServer.currentFrame;
                            localEntity.get(AnimationComponent).isVideo = entityServer.isVideo;
                        }

                    }

                    entityServer.onChange(() => {
                        // aggiorno la componente prendendo la sua entità
                        let localEntity = engine.getEntityById(Utils.savedEntities.get(entityServer.id));

                        if (localEntity.has(AnimationComponent)) {

                            let animComponent = localEntity.get(AnimationComponent);

                            let animations = animComponent.animGroup;

                            // aggiorno solo se non sono io a mandare l'update
                            // il messaggio in questo listener non viene mai aggiornato !!!
                            // per rendere il tutto usabile uso il componente di entity che almeno mi permette di utilizzare l'oggetto localmente
                            if (localEntity.get(EntityMultiplayerComponent).busy != Utils.room.sessionId) {

                                // se l'animazione era in pausa la avvio
                                if (animComponent.state == "pause" && entityServer.state != "pause") {
                                    animComponent.state = entityServer.state;
                                    animComponent.currentFrame = entityServer.currentFrame;

                                    if (!(animComponent.isVideo)) {
                                        // se devo aggiornare un modello 3d
                                        animations[+animComponent.state].goToFrame(animComponent.currentFrame);
                                        animations[+animComponent.state].play(true);

                                    } else {
                                        // se devo aggiornare un video
                                        animComponent.video.video.currentTime = animComponent.currentFrame;
                                        animComponent.video.video.play();

                                    }

                                    animComponent.isStoppable = true;

                                }

                                // se l'animazione è in play e la devo stoppare
                                if (animComponent.state != "pause" && entityServer.state == "pause") {

                                    if (!(animComponent.isVideo)) {
                                        // se devo aggiornare un modello 3d
                                        animations[+animComponent.state].pause();
                                    } else {
                                        // se devo aggiornare un video
                                        animComponent.video.video.pause();
                                    }

                                    animComponent.isStoppable = false;

                                    animComponent.state = entityServer.state;
                                    animComponent.currentFrame = entityServer.currentFrame;
                                }

                                // se l'animazione è diversa da quella nuova (caso unico del modello 3d)
                                if (animComponent.state != "pause" && entityServer.state != "pause" && animComponent.state != entityServer.state && !(animComponent.isVideo)) {
                                    animations[+animComponent.state].pause();
                                    animComponent.isStoppable = false;

                                    animComponent.state = entityServer.state;
                                    animComponent.currentFrame = entityServer.currentFrame;

                                    animations[+animComponent.state].goToFrame(animComponent.currentFrame);
                                    animations[+animComponent.state].play(true);
                                    animComponent.isStoppable = true;
                                }

                            }

                        }



                    });
                }

            });

            Utils.room.state.animationComponents.onRemove((serverEntity) => {
            });

        });

    }

    public static getParentSize(parent) {
        const sizes = parent.getHierarchyBoundingVectors()
        const size = {
            x: sizes.max.x - sizes.min.x,
            y: sizes.max.y - sizes.min.y,
            z: sizes.max.z - sizes.min.z
        }
        return size;
    }

    public static async createBackgroundScene() {
        let { meshes } = await SceneLoader.ImportMeshAsync(
            null,
            "background/",
            "mesh.gltf",
            this.scene
        );

        meshes.forEach((mesh) => {
            mesh.isPickable = false;
            mesh.checkCollisions = true;
        });

        meshes[0].position.z = 4;

    }
}