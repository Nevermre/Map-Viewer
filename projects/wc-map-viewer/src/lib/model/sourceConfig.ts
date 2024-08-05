import { filter } from "./filter"
import { info } from "./info"
import {FeatureCollection} from "./feature-collection"
import { layerIdentifier } from "./layerIdentifier"

export interface sourceConfig{
  "title": string,
  "layerUrl"?: string,
  "layerIdentifier"?:string[] | layerIdentifier[],
  "boundingBox"?: number[]
  "permissions"?: string[],
  "primary"?: boolean,
  "visible"?:boolean,
  "type": string,//"geoserver | OSM | bing",
  "zIndex":number,
  "key"?: string, //Em caso de tipo bing
  "imagerySet"?: string//estilos a serem usados no bing 'RoadOnDemand','Aerial','AerialWithLabelsOnDemand','CanvasDark','OrdnanceSurvey'
  "ref"?: any,
  "sourceType"?:string,
  "descriptionFields"?:info[],
  "viewParams":string[],
  "zoomOnInit"?:boolean,
  "opacity"?:number,
  "legendUrl"?:string,
  "enableFilters"?:boolean,
  "filterList"?:filter[],
  "group"?:{groupId:number, subGroup:string},
  "geoJson"?: FeatureCollection,
  "fillColor"?: string,
  "strokeColor"?: string,
  "geoserverType"?:string,
  "searchField"?:info
  "enableVertex"?:boolean,
  "emitLayer"?:boolean,
  "vertexes"?:any[]

}
