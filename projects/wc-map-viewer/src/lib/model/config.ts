import { folder } from "./folder";
import { sourceConfig } from "./sourceConfig";


export interface mapConfig{

  "mapId": String,
  "title":  String,
  "baseMap":sourceConfig[],
  "rasters"?:sourceConfig[],
  "centerCoords": number[],
  "defaultZoom": number,
  "maxZoom": number,
  "projection":string,
  "extent"?:number[],
  "controlSize"?:string,
  "fontSize"?:string,
  "skipModalForm"?: boolean,
  "controls": { //exemplos de controles
    "draw": boolean,
    "legend": boolean,
    "exportAsImage": boolean,
    "marker": boolean,
    "selectVertex": boolean,
    "search": boolean,
    "enableIconSelection":boolean
  },

  "layers": {
    "availableGroups":{
      id:number
      title: string
      subgroups:{
        title: string
      }[]
    }[]
    "sources": sourceConfig[]
    "referenceBase"?:sourceConfig[],

    "drawedLayers"?:sourceConfig[]
  },
  "markerIcon"?:string,
  "measureUnit"?:string



}
