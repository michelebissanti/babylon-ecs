import { Color3, Matrix, Mesh, MeshBuilder, Scene, SceneLoader, StandardMaterial, VideoTexture } from "@babylonjs/core";
import { Entity, IterativeSystem, Query } from "tick-knock";
import { AnimationComponent } from "../components/AnimationComponent";
import { EntityMultiplayerComponent } from "../components/EntityMultiplayerComponent";
import { MeshArrayComponent } from "../components/MeshArrayComponent";
import { MeshComponent } from "../components/MeshComponent";
import { MeshMultiComponent } from "../components/MeshMultiComponent";
import { Utils } from "../utils";

// MeshMultiplayerSystem: gestisce tutte le entità che possiedono un MeshMultiComponent o che devono istanziarlo
// in generale si occupa di sincronizzare le mesh con il server
export class MeshMultiplayerSystem extends IterativeSystem {
    scene: Scene;

    constructor(scene: Scene) {
        //entra nel loop del sistema solo se ha MeshMultiComponent o EntityMultiplayerComponent
        super(new Query((entity) => (entity.hasComponent(MeshMultiComponent) || entity.hasComponent(EntityMultiplayerComponent))));
        this.scene = scene;
    }

    protected async updateEntity(entity: Entity, dt: number): Promise<void> {

        if (entity.has(MeshMultiComponent)) {
            let meshMultiComponent = entity.get(MeshMultiComponent);

            // se la mesh non è stata istanziata, la istanzio
            if (meshMultiComponent.render == false) {
                meshMultiComponent.render = true;


                if (meshMultiComponent.location == "local" && meshMultiComponent.name == "sphere") {
                    //debug branch

                    entity.add(new MeshComponent(MeshBuilder.CreateSphere('sphere ' + meshMultiComponent.id, { diameter: 1 }, this.scene), entity.id));
                    entity.get(MeshComponent).mesh.setPivotMatrix(Matrix.Translation(0, 0.5, 0), false);
                    entity.get(MeshComponent).mesh.isPickable = false;

                } else if (meshMultiComponent.location == "video") {
                    //se la mesh da istanziare è un video

                    let plane = MeshBuilder.CreateBox("", { height: 0.875, width: 2, depth: 0.01, sideOrientation: Mesh.DOUBLESIDE });
                    plane.isPickable = true;
                    let videoMat = new StandardMaterial("videoMat");
                    let videoTex = new VideoTexture("videoTex", meshMultiComponent.location + "/" + meshMultiComponent.name, this.scene);

                    videoMat.diffuseTexture = videoTex;
                    videoMat.roughness = 1;
                    videoMat.emissiveColor = Color3.White();
                    videoTex.video.muted = false;
                    videoTex.video.pause();
                    plane.material = videoMat;

                    //setto l'origine ai piedi della mesh, centrata orizzontalmente
                    plane.setPivotMatrix(Matrix.Translation(0, plane.getBoundingInfo().boundingBox.extendSize.y, 0), false);

                    //aggiungo la componente di mesh locale e la componente di animazione
                    entity.add(new MeshComponent(plane, entity.id, false));
                    entity.add(new AnimationComponent(null, videoTex, true));


                } else {
                    //se la mesh da istanziare è un oggetto 3d

                    let { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
                        null,
                        meshMultiComponent.location,
                        meshMultiComponent.name
                    );

                    //aggiungo la componente di mesh locale
                    entity.add(new MeshArrayComponent(meshes, entity.id));

                    //se l'oggetto importato ha delle animazioni
                    if (animationGroups.length != 0) {
                        //aggiungo la componente di animazione
                        entity.add(new AnimationComponent(animationGroups, null, false));
                        animationGroups[0].stop();
                        entity.get(AnimationComponent).currentFrame = 0;
                        entity.get(AnimationComponent).state = "pause";
                    }

                    //se l'entità è un player
                    if (entity.get(EntityMultiplayerComponent).isPlayer) {
                        let meshes = entity.get(MeshArrayComponent).meshes;

                        //non posso interagire con la sua mesh
                        meshes.forEach((mesh) => {
                            mesh.isPickable = false;
                        });
                    }

                    //se l'entità è il player locale
                    if (entity.get(MeshMultiComponent).isLocalPlayer) {
                        let meshes = entity.get(MeshArrayComponent).meshes;

                        //non posso interagire con la sua mesh
                        meshes.forEach((mesh) => {
                            mesh.isPickable = false;
                            mesh.visibility = 0;
                        });
                    }

                }


            }
        }

        if (Utils.room != null) {
            if (entity.has(MeshMultiComponent) && entity.has(EntityMultiplayerComponent)) {
                let meshMultiComponent = entity.get(MeshMultiComponent);
                let entityServer = entity.get(EntityMultiplayerComponent);

                //se l'entità non è stata mai inviata al server, invio il segnale di creazione
                if (meshMultiComponent.id == undefined && entityServer.serverId != undefined) {
                    Utils.room.send("attachMeshComponent", {
                        id: "" + entityServer.serverId,
                        location: meshMultiComponent.location,
                        name: meshMultiComponent.name,
                    });

                    meshMultiComponent.id = entityServer.serverId;
                }
            }
        }

    }
}