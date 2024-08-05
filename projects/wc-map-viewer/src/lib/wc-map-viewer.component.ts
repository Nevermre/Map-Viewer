import {
  Component,
  OnInit,
  Input,
  ElementRef,
  Renderer2,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation,
  AfterViewInit,
  ViewChild
} from "@angular/core";
import { Map, View } from "ol";
import LayerSwitcher, {
  BaseLayerOptions,
  GroupLayerOptions,
} from "ol-layerswitcher";
import LayerGroup from "ol/layer/Group";
import TileLayer from "ol/layer/Tile";
import { mapConfig } from "./model/config";
import OSM from "ol/source/OSM";
import TileWMS from "ol/source/TileWMS";
import BingMaps from "ol/source/BingMaps.js";
import {
  ScaleLine,
  FullScreen,
  defaults as defaultControls,
  ZoomSlider,
  MousePosition,
} from "ol/control.js";
import {
  CdkDragDrop,
  CdkDragStart,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import WMSGetFeatureInfo from "ol/format/WMSGetFeatureInfo.js";
import VectorSource from "ol/source/Vector.js";
import { Tile, Vector as VectorLayer } from "ol/layer.js";
import { bbox as bboxStrategy } from "ol/loadingstrategy.js";
import GeoJSON from "ol/format/GeoJSON.js";
import Overlay from "ol/Overlay";
import { info } from "./model/info";
import DragZoom from "ol/interaction/DragZoom";
import { click, shiftKeyOnly } from "ol/events/condition";
import WMSCapabilities from "ol/format/WMSCapabilities";
import { transformExtent } from "ol/proj";
import proj4 from "proj4";
import { register } from "ol/proj/proj4.js";
import { createStringXY } from "ol/coordinate";
import {
  DragAndDrop, DragRotate, Modify, Select,
} from 'ol/interaction.js';
import { KML, WKT } from 'ol/format.js';
import * as shp from 'shpjs';
import Compass from "ol-ext/control/Compass";
import { MenuItem } from "primeng/api";
import { LineString, MultiPoint, Point, Polygon } from 'ol/geom.js';
import { Circle as CircleStyle, Fill, Icon, Stroke, Style, Text } from 'ol/style.js';
import { getArea, getLength } from 'ol/sphere.js';
import { unByKey } from 'ol/Observable.js';
import Draw from 'ol/interaction/Draw.js';
import { format } from 'ol/coordinate';
import { filter } from "./model/filter";
import Feature from 'ol/Feature.js';
//import 'location.png'
import html2canvas from 'html2canvas';
import { sourceConfig } from "./model/sourceConfig";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import spatial_ref_sys from "./assets/spatial_ref_sys.json"
import markersBase64 from "./assets/markersBase64.json"
import { TieredMenu } from "primeng/tieredmenu";

var shpwrite = require("@mapbox/shp-write");



@Component({
  selector: "lib-wc-map-viewer",
  encapsulation: ViewEncapsulation.None,
  templateUrl: "./wc-map-viewer.component.html",
  styleUrls: ["./wc-map-viewer.component.css",
    "./assets/ol-ext.css"],
})
export class MapViewerComponent implements OnInit, OnChanges, AfterViewInit {
  constructor(private el: ElementRef, private renderer: Renderer2) { }
  @Input() params!: mapConfig;
  allLayers: any = [];
  controlStyle: any = {};

  // MENU
  itemsOptionsMap: MenuItem[] = new Array<MenuItem>;

  // MAPA
  mapTimeout: any = null;
  map: any = null;
  loading: boolean = false;
  baseMap: any = null;
  mapEle: any = null;
  selectedFeature: any = null;
  highlightedArea: any = null;
  @Output() highlightedAreaEvent = new EventEmitter<any>();
  dragging: boolean = false;
  isBlockDraggable: boolean = false;
  mousePositionControl: any = null;
  styles: any[] = [
    {
      "description": "Aéreo",
      "value": "Aerial"
    },
    {
      "description": "Aéreo com descrição",
      "value": "AerialWithLabelsOnDemand"
    },
    {
      "description": "Estrada",
      "value": "RoadOnDemand"
    },
    {
      "description": "Estrada escura",
      "value": "CanvasDark"
    }
  ]
  selectedStyle: any;

  baseMapControl: boolean = false;
  legendVisible: boolean = false;
  selectedTool: string = "move";
  draw: any;
  /**
        * The help tooltip element.
        * @type {HTMLElement}
        */
  helpTooltipElement: any;
  sourceDraw = new VectorSource();
  vectorDraw: any;
  sourceMarkers = new VectorSource();
  vectorMarkers: any = new VectorLayer({
    source: this.sourceMarkers,
    zIndex: 999
  });
  drawGroup:any = new LayerGroup({
    layers: [

    ],
    visible:true
  })
  previousIndex: any = null;
  selectedLayers:any = []
  activeLayer: any = null;
  overlay: any = null; //new Overlay({});
  popupShow: boolean = true;
  infos: featureDisplayInfo[] = [];
  private _viewParams: string[] = [];
  kmlLayers: any[] = [];
  resizeObserver: any = null;
  widthLayerTree: number = 2000;
  widthMap: number = 2000;
  heightMap: number = 2000;
  layerSelectedRadio: any;
  visibleDialogGif: boolean = false;
  selectedHoverFeature: any;
  vectorSourcePoints = new VectorSource();
  kmlLayer: any
  select:any
  popupOverlayPoint:any;
  confirmDraw:any = false;
  formInfo = new FormGroup({
    title:new FormControl('',[Validators.required]),
    description:new FormControl(''),
    latitude:new FormControl('',[

      Validators.pattern(/^-?([0-8]?[0-9]|90)(\.[0-9]{1,10})?$/)]),
    longitude:new FormControl('',[
      Validators.pattern(/^-?([0-8]?[0-9]|90)(\.[0-9]{1,10})?$/)]),
    selectedIcon:new FormControl('default')
  })
  drawedLayerRef:any;
  selectedBaseMapType:string = '';
  searching:boolean = false;
  searchLayer:any = false;
  searchData:any = [];
  searchText:FormControl = new FormControl('',[
    Validators.required,
    Validators.minLength(3)]);
  searchFailed:boolean = false;
  searchLoading:boolean = false;
  optionsIcons:any[] =[
    {label:"Padrão", key:"default"},
    {label:"Árvore", key:"tree"},
    {label:"Fogo", key:"fire"},
    {label:"Gota d'água", key:"water-drop"},
    {label:"Poço", key:"well"},

  ];
  selectedIcon:string = '';

  //Zoom na coordenada informada
  @Input() set zoom(coordenada: number[]) {
    if (coordenada && this.mapEle) {
      this.mapEle.setView(
        new View({
          center: coordenada,
          zoom: this.mapEle.getView().getZoom(),
          projection: this.mapEle.getView().getProjection(),
          extent: this.params.extent,
        })
      );
      this.ExtractFeaturesFromCoordinate(coordenada);
    }
  }

  //Aplica o filtro na camada ativa
  @Input() set setViewParams(viewParams: string[]) {
    if (this.activeLayer && viewParams && viewParams.length > 0 && this.mapEle) {
      this.activeLayer.ref.getSource()?.updateParams({
        'VIEWPARAMS': viewParams
      })
      this._viewParams = viewParams;
    }

  }

  //Define a barra de escala gráfica
  controlBar = new ScaleLine({
    units: "metric",
    bar: true,
    steps: parseInt("4", 10),
    text: true,
    minWidth: 140,
  });

  expandControl = true;

  @ViewChild('mapViewer')
  mapElem!: ElementRef;

  @ViewChild('layertree')
  layerTreeElem!: ElementRef;

  @ViewChild('dropdownButton')
  dropdownButtonRef!: ElementRef;

  @ViewChild('control')
  controlElem!: ElementRef;

  @ViewChild('popup')
  popupElem!: ElementRef;

  @ViewChild('fullscreen')
  fullscreenElem!: ElementRef;

  @ViewChild('mousePosition')
  mousePosElem!: ElementRef;

  @ViewChild('popupPoint')
  popupPointElem!: ElementRef;

  @ViewChild('tiered')
  tieredMenuElem!: ElementRef;

  @ViewChild('imageDownload')
  imageDownloadElem!: ElementRef;


  @Input() parsedFiles!: any;

  @Input() editLayer!: any[];

  @Input() requestSelectedPoints!: any;

  @Input() requestShapefile!: any;

  @Input() applyFilter!: any;

  @Input() changeEnabledControl!: any;

  @Input() zoomBoundingBox!: any[];
  @Input() insertDrawedLayer!: any[];

  @Input() selectPoints?: any[];


  @Output()
  selectedPoints: EventEmitter<any> = new EventEmitter<any>();

  @Output()
  drawedLayer: EventEmitter<any> = new EventEmitter<any>();

  @Output()
  deletedLayer: EventEmitter<any> = new EventEmitter<any>();

  @Output()
  shapefile: EventEmitter<any> = new EventEmitter<any>();

  @Output()
  mapLoaded: EventEmitter<any> = new EventEmitter<any>();

  spatialRef:any[] = spatial_ref_sys as any[];


  ngOnInit(): void {
    this.loading = true;
    this.controlStyle = {
      "width": (this.params.controlSize && this.params.controlSize === 'small' ? '300px' : (this.params.controlSize && this.params.controlSize === 'medium' ? '350px' : '400px')),
      "font-size": (this.params.fontSize && this.params.fontSize === 'small' ? '0.7em' : (this.params.fontSize && this.params.fontSize === 'medium' ? '0.8em' : '1em'))
    }
    // this.params = {"mapId":"","title":"Mapa report 6","baseMap":{"title":"titulo da camada","type":"bing","zIndex":0,"key":"AsQMFShoIU3hEnknwia7vT_d3fL8X2dO6V3HZX57-Tfzp_jBdFvizuyqjTahBhkC","imagerySet":"Aerial","viewParams":[]},"centerCoords":[-56.9447,-1.313],"projection":"EPSG:4674","extent":[-58.8955, -9.8412, -46.07, 4.4707],"defaultZoom":1,"maxZoom":19,"controls":{"fullScreen":true,"zoomInOut":true,"currentLocation":true,"zoomExtent":true,"scale":true,"scaleLine":true,"basemap":true, "rotate": true},"layers":{"sources":[{"title":"Municípios","layerUrl":"https://geoserver.apps.geoapplications.net/geoserver/wms","layerIdentifier":["semas_car2_hom:vw_camada_municipios"],"permissions":["view","hide","..."],"primary":false,"type":"geoserver","zIndex":5,"boundingBox":[],"sourceType":"wms","descriptionFields":[{"displayName":"Município","key":"tx_nome_municipio"},{"displayName":"Sigla do Estado","key":"tx_sigla_municipio"},{"displayName":"Área","key":"area_km2"}],"viewParams":[]},{"title":"Unidades da federação","layerUrl":"https://geoserver.apps.geoapplications.net/geoserver/wms","layerIdentifier":["semas_car2_hom:vw_camada_ufs"],"permissions":["view","hide","..."],"primary":false,"type":"geoserver","zIndex":10,"boundingBox":[],"sourceType":"wms","descriptionFields":[{"displayName":"Nome da UF","key":"tx_nome_uf"},{"displayName":"Sigla","key":"tx_sigla_uf"},{"displayName":"Região","key":"nm_regiao"}],"viewParams":[]},{"title":"Imóveis","layerUrl":"https://geoserver.apps.geoapplications.net/geoserver/wms","layerIdentifier":["semas_car2_hom:geo_vw_imoveis"],"permissions":["view","hide","..."],"visible":true,"zoomOnInit":true,"primary":false,"type":"geoserver","zIndex":9,"boundingBox":[-56.9447,-1.313,-56.9013,-1.2805],"sourceType":"wms","descriptionFields":[{"displayName":"Nome do Imóvel","key":"tx_nome_imovel"},{"displayName":"Código do Imóvel","key":"tx_cod_imovel"},{"displayName":"Status","key":"tx_status_imovel"},{"displayName":"Tipo","key":"tx_tipo_imovel"},{"displayName":"Número módulo fiscal","key":"num_modulo_fiscal"},{"displayName":"Condição","key":"tx_des_condicao"},{"displayName":"Área","key":"area_calc_ir"}],"viewParams":["id_imovel:122161"]},{"title":"Imóvel fora município de cadastro","layerUrl":"https://geoserver.apps.geoapplications.net/geoserver/wms","visible":true,"layerIdentifier":["semas_car2_hom:geo_vw_detalhe_imovel_fora_municipio"],"permissions":["view","hide","..."],"primary":false,"type":"geoserver","zIndex":8,"boundingBox":[-57.218,-1.4919,-56.8463,-1.1668],"sourceType":"wms","descriptionFields":[{"displayName":"Cod. Imovel Vizinho","key":"cod_imovel_vizinho"},{"displayName":"Orgão Responsável","key":"tx_orgao_resp"},{"displayName":"Data da última análise","key":"data_ultima_analise"}],"viewParams":["id_imovel:122161"]}]}}

  }

  ngAfterViewInit() {
    this.mapTimeout = setTimeout(() => {
      this.initMap(this.map, this.mapElem && this.mapElem.nativeElement);
      this.loading = false;
      // console.log(this.tieredMenuElem);
      // (this.tieredMenuElem as any).show();
      this.mapLoaded.emit(true);
    }, 2000);

  }
  printShowMenu(ev: any){
    console.log(ev)
  }
  ngOnChanges(changes: SimpleChanges): void {
    //reinicializa o mapa caso haja alguma alteração nos parametros
    for (const propName in changes) {
      if (changes.hasOwnProperty(propName)) {
        switch (propName) {
          case "params": {
            this.mousePositionControl = null;
            if (this.mapEle) {
              this.baseMapControl = false;
              this.expandControl = true;
              this.legendVisible = false;
              this.mapEle.removeOverlay(this.overlay);
              this.overlay.setPosition(undefined);
              this.mapEle.setTarget(null);
              this.optionNavigateMap();
              this.confirmDraw = false;

              this.loading = true;
              if (this.mapTimeout) {
                clearTimeout(this.mapTimeout)
              }
              this.mapTimeout = setTimeout(() => {
                this.initMap(this.map, this.mapElem && this.mapElem.nativeElement);
                this.loading = false;

              }, 2000);
            }
            break;
          }
          case "parsedFiles": {
            if (this.parsedFiles) {
              let output:any = []
              this.parsedFiles.forEach((file: any,index:any) => {
                let kmlLayer = this.addLayerFromGeojson(file);
                file.ref = kmlLayer.kmlLayer;
                if(file.zoomOnInit){
                  this.zoomToLayer(null,file);
                }
                file.vertexes = kmlLayer.vertexes;
                console.log(file)
                let existLayer = this.params.layers.sources.find((layer:any) => {
                  if(layer.title === file.title && layer.group?.groupId === file.group?.groupId && layer.group?.subGroup === file.group?.subGroup)
                    return layer
                  else
                    return false
                });
                console.log(existLayer)
                if(existLayer){
                  this.mapEle.removeLayer(existLayer.ref);
                  let layerIndex : any = this.params.layers.sources?.findIndex(layer => layer.title === file.title && layer.group?.groupId === file.group?.groupId && layer.group?.subGroup === file.group?.subGroup);
                  this.params.layers.sources.splice(layerIndex,1)
                }
                this.params.layers.sources.push(file);
                if(file.emitLayer){
                  let sourceConfig = Object.assign({}, file, {ref: undefined})
                  sourceConfig.geoJson = new GeoJSON().writeFeaturesObject(file.ref.getSource().getFeatures(),{featureProjection: this.params.projection,dataProjection:this.params.projection})
                  sourceConfig.geoJson.fileName = file.ref.get('title')

                  output.push( {
                      "ol_uid": file.ref.ol_uid,

                      "title": file.ref.get('title'),
                      "properties": file.ref.getSource().getFeatures().map((feature:any) => feature.getProperties()),
                      "wktGeom": file.ref.getSource().getFeatures().map((feature:any) => new WKT().writeGeometry(feature.getProperties().geometry)),
                      "area":Math.round(((getArea(file.ref.getSource().getFeatures().map((feature:any) => feature.getProperties())[0].geometry, { projection: this.params.projection })/10000) * 100.0)) / 100,
                      "sourceConfig":sourceConfig
                    })
                }

                // this.params.layers.sources = this.params.layers.sources.sort(
                //   (a: any, b: any) =>
                //     this.params.layers.availableGroups.indexOf(a.group) -
                //     this.params.layers.availableGroups.indexOf(b.group) || b.ref.getZIndex() - a.ref.getZIndex()
                // );
              })
              this.drawedLayer.emit(output)

            }
            break;
          }
          case "editLayer": {
            if (this.editLayer && this.editLayer.length > 0) {
              this.editLayer.forEach(l => {
                //let layerIndex: any = this.params.layers.sources?.findIndex(layer => layer.type === "geoJson");
                let layerIndex : any = this.params.layers.drawedLayers?.findIndex(layer => layer.ref && layer.ref.ol_uid === l.ol_uid);
                if(layerIndex == -1)
                  layerIndex = this.params.layers.sources?.findIndex(layer => layer.ref && layer.ref.ol_uid === l.ol_uid);
                if (l.op === "remove") {
                  if (layerIndex !== -1) {
                    // console.log('DRAWED LAYERS ', this.params.layers.drawedLayers)
                    if(this.params.layers.drawedLayers![layerIndex]){
                      this.mapEle.removeLayer(this.params.layers.drawedLayers![layerIndex].ref)
                      this.params.layers.drawedLayers?.splice(layerIndex, 1);
                    }
                    else{
                      this.mapEle.removeLayer(this.params.layers.sources![layerIndex].ref)
                      this.params.layers.sources?.splice(layerIndex, 1);
                    }
                  }
                } else {
                  let layer = this.params.layers.drawedLayers![layerIndex];
                  if(!layer)
                    layer = this.params.layers.sources![layerIndex];
                  layer.ref.getSource()?.getFeatures().forEach((feature: any) => {
                    l.properties.forEach((propertie: any) => {
                      feature.set(propertie.key, propertie.value)
                    })
                  });
                  layer.ref.set("title", l.title)
                  layer.title = l.title;
                }
              });

            }
            break;
          }
          case "requestSelectedPoints": {
            if (this.requestSelectedPoints && this.requestSelectedPoints.request) {
              this.selectedPoints.emit(this.requestPoints());
            }
            break;
          }
          case "selectPoints": {
            if(this.select){
              let features = this.vectorSourcePoints.getFeatures();

              features.forEach((feature: any) =>{
                if(this.selectPoints?.findIndex(point=> feature.getGeometry().flatCoordinates[0] == point[0] && feature.getGeometry().flatCoordinates[1] == point[1]) !== -1){
                  this.select.getFeatures().push(feature)
                  this.setFeatureIndex(feature, true);

                }
              })

            //   if (features.length == selectedFeatures.getLength()) {
            //     this.select.getFeatures().clear()
            //   }
            //   else {
            //     this.select.getFeatures().clear()
            //     features.forEach((feature: any) => this.select.getFeatures().push(feature))
            // }
            }
            break;
          }
          case "requestShapefile": {
            if (this.requestShapefile && this.requestShapefile.layerId) {
              this.requestShapeFile(this.requestShapefile.layerId);
            }
            break
          }
          case "changeEnabledControl":{
            if(this.changeEnabledControl && this.select){

                this.select.setActive(this.changeEnabledControl.enableVertex)
                this.params.controls.selectVertex = this.changeEnabledControl.enableVertex;
                let optionIndex = this.itemsOptionsMap.findIndex(option => option.title === 'Selecionar/desmarcar os vértices')

                if(optionIndex !== -1)
                  this.itemsOptionsMap = this.itemsOptionsMap.filter(option => option.title !== 'Selecionar/desmarcar os vértices')
                else{
                  this.itemsOptionsMap.push({
                    title: 'Selecionar/desmarcar os vértices',
                    icon: 'pi pi-map-marker',
                    command: () => this.selectAllFeatures()
                  })
                  this.itemsOptionsMap = this.itemsOptionsMap.slice()
                }


            }
            break
          }
          case "zoomBoundingBox":{
            console.log('boundingboxset', this.zoomBoundingBox)
            if (this.zoomBoundingBox && this.mapEle) {
              this.mapEle.getView().fit(this.zoomBoundingBox,
                {
                  duration: 1500
                });
            }
            break;
          }
          case "insertDrawedLayer":{
            let tempfeature = new Feature({

              geometry: new Polygon(this.insertDrawedLayer),
            });
            let sourceDraw = new VectorSource(

            );
            sourceDraw.addFeature(tempfeature);
        let vectorDraw :any = new VectorLayer({
          source: sourceDraw,
          zIndex:1000,
          style: [new Style({
            fill: new Fill({
              color: 'rgba(252, 3, 23, 0.3)',
            }),
            stroke: new Stroke({
              color: '#fc0317',
              width: 2,
            }),
          }),
          new Style({
            image: new CircleStyle({
              radius: 7,
              fill: new Fill({
                color: '#fc0317',
              }),
            }),
            geometry: function (feature: any) {
              // return the coordinates of all rings of the polygon
              let coordinates;
              if (feature.getGeometry().getType() == "LineString") {
                coordinates = feature.getGeometry().getCoordinates();
              } else if (feature.getGeometry().getType() == "Polygon") {
                coordinates = feature.getGeometry().getCoordinates()[0];
              }

              return new MultiPoint(coordinates);
            },
          }),],
        });
        //this.drawGroup.getLayers().getArray().push(vectorDraw)
        vectorDraw.set("ol_uid",12345)
        this.mapEle.addLayer(vectorDraw)
        this.draw = new Draw({
          source: sourceDraw,
          type: 'Polygon',
          style: new Style({
            fill: new Fill({
              color: 'rgba(255, 255, 255, 0.2)',
            }),
            stroke: new Stroke({
              color: '#fc0317',
              lineDash: [10, 10],
              width: 2,
            }),
            image: new CircleStyle({
              radius: 5,
              stroke: new Stroke({
                color: 'rgba(0, 0, 0, 0.7)',
              }),
              fill: new Fill({
                color: 'rgba(255, 255, 255, 0.2)',
              }),
            }),
          }),
        });
        this.mapEle.addInteraction(this.draw);
        //this.draw.drawend();
        //vectorDraw.setId(666)
        console.log(vectorDraw)
        let drawedLayer:any = {
          "title":"",
          "type":"geoJson",
          "ref":vectorDraw,
          "visible":true,
          "opacity":1,
          "zIndex":1000,
          "descriptionFields":[{
            "key":"description",
            "displayName":"Descrição"
          }]
        }
        this.drawedLayerRef = drawedLayer;
        if(this.params.layers.drawedLayers)
          this.params.layers.drawedLayers?.push(drawedLayer)
        else
          this.params.layers.drawedLayers = [drawedLayer]
        this.mapEle.removeInteraction(this.draw);
            break;
          }
          case "applyFilter":{

            this.applyFilterOnLayer(this.applyFilter);
          }
        }
      }
    }
  }

  //procura a referencia de uma camada por um determinado ID
  searchLayerById(id: any, index: number, group: any) {
    group.getLayers().forEach((layer: any, i: any) => {
      if (layer.ol_uid === id) {
        layer.setZIndex(this.params.layers.sources.length - index + 1);
      }

      if (layer instanceof LayerGroup) {
        this.rebuildZIndex(id, index, layer);
      }
    });
  }
  zoomOnBoundingBox(boundingBox: number[]) {
    if (boundingBox && this.mapEle) {
      this.mapEle.getView().fit(boundingBox,
        {
          duration: 1500
        });
    }
  }

  searchModal(layer:any){
    //if(layer){
      this.searchFailed = false;
      this.searchLayer = layer;
      this.searching = true;
      this.expandControl = false;
    //}

  }

  //aplica filtro CQL em uma determinada camada
  /**
   *
   * @param applyFilter {Object} applyFilter
   * @param applyFilter.layerID - Id da camada que deseja aplicar o filtro (opcional caso informar o titulo da camada)
   * @param applyFilter.layerTitle - Título da camada
   * @param applyFilter.filterList {filter[]} - filtros a serem aplicados
   *
   */
  applyFilterOnLayer(applyFilter:any){

    if(this.mapEle)
    this.mapEle.getLayerGroup().getLayers().forEach((layer: any, i: any) => {
      if(applyFilter.layerId){
        if (layer.ol_uid === applyFilter.layerId) {

          layer.getSource().updateParams({
            'CQL_Filter': applyFilter.filterList && applyFilter.filterList.length>0 ? this.parseCql(applyFilter.filterList) : null
        });

        }
      }
      else{
        if(layer.get('title') === applyFilter.layerTitle){
          layer.getSource().updateParams({
            'CQL_Filter': applyFilter.filterList && applyFilter.filterList.length>0 ? this.parseCql(applyFilter.filterList) : null
          });
        }
      }

    });
  }

  //recebe o id de uma camada GeoJSON e exporta em formato shapefile
  async requestShapeFile(layerId:any): Promise<any> {
    let layer:any = this.params.layers.drawedLayers?.find((layer:any) => layer.ref.ol_uid === layerId)
    let features = layer.ref.getSource().getFeatures()
      var json = new GeoJSON().writeFeatures(layer.ref.getSource().getFeatures(),{featureProjection: this.params.projection,dataProjection:this.params.projection} /*{featureProjection: 'EPSG:4674',dataProjection:'EPSG:31981'}*/);
      const options = {
        folder: "",
        filename: layer.title,
        outputType: "blob",
        compression: "DEFLATE",
        types: {
          point: layer.title,
          polygon: layer.title,
          polyline: layer.title,
        },
        prj: this.spatialRef.find((ref:any) => ref.srid == this.params.projection.split(':')[1])?.srtext
      };
      let file = null;
      file = await shpwrite.zip(JSON.parse(json),options).then((zip:any) =>{
        this.shapefile.emit(zip)
        return zip
      } );
      return file;
  }

  //retorna os pontos selecionados no mapa
  requestPoints(): any {
    return this.select.getFeatures().getArray().map((feature: any) => feature.getGeometry());
  }

  //adiciona uma camada em formato geoJSON no mapa
  /**
   *
   * @param parsedFiles {sourceConfig[]}
   *
   */
  addLayerFromGeojson(parsedFiles: any): any {
    const OLgeo = new GeoJSON(/*{
      dataProjection: 'EPSG:4674',
      featureProjection: 'EPSG:31981'}*/).readFeatures(parsedFiles.geoJson
      );

    const vectorSource = new VectorSource({
      features: OLgeo
    });
    let kmlLayer = new VectorLayer({
      title: parsedFiles.geoJson.fileName,
      style: [new Style({
        fill: new Fill({
          color: parsedFiles.fillColor,
        }),
        stroke: parsedFiles.strokeColor ? new Stroke({
          color: parsedFiles.strokeColor,
          width: 2,
        }) : undefined,
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: parsedFiles.fillColor,
          }),
        }) ,
      })],
      source: vectorSource,
      zIndex: parsedFiles.zIndex
    } as BaseLayerOptions)
    this.mapEle.addLayer(
      kmlLayer
    );
    let candidates: any = [];
    let vertexes:any = []
    if(this.params.controls.selectVertex && parsedFiles.enableVertex)
      vectorSource.forEachFeature((feature: any) => {
        let coordinates;

        if (feature.getGeometry().getType() == "LineString") {
          coordinates = feature.getGeometry().getCoordinates();
        } else if (feature.getGeometry().getType() == "Polygon") {
          coordinates = feature.getGeometry().getCoordinates();
        }
        else {
          if(feature.getGeometry().getType() == "Point")
            coordinates = [feature.getGeometry().getCoordinates()];
          else
            coordinates = feature.getGeometry().getCoordinates().flat(2);

        }
        coordinates.forEach((coordinate: any) => {

          if (coordinate.length == 2)
          vertexes.push(this.createFeature(coordinate));
          else {
            coordinate.forEach((coordP: any) => vertexes.push(this.createFeature(coordP)))
          }
        })


      })

    this.kmlLayers.push({
      title: parsedFiles.geoJson.fileName,
      ref: kmlLayer
    });



    return {kmlLayer: kmlLayer, vertexes:vertexes};
  }

  //cria um ponto e adiciona na lista de pontos selecionados
  private createFeature(coordinate: any) {
    let tempfeature : any = new Feature({

      geometry: new Point(coordinate),
    });
    let iconStyle = new Style({
      image: new CircleStyle({
        radius: 7,
        fill: new Fill({
          color: '#fc0317',
        }),
      })
    });
    tempfeature.setStyle(iconStyle);
    this.vectorSourcePoints.addFeature(tempfeature);

      if(this.selectPoints?.findIndex(point=> tempfeature.getGeometry()?.flatCoordinates[0] == point[0] && tempfeature.getGeometry()?.flatCoordinates[1] == point[1]) !== -1){
        this.select.getFeatures().push(tempfeature)
        this.setFeatureIndex(tempfeature, false);

      }

    return tempfeature;
    //this.select.getFeatures().push(tempfeature)
  }

  //Cria um ponto de acordo com uma coordenada
  private createPointMarkerFromCoordinate(coordinate: any) {
    const iconFeature = new Feature({
      geometry: new Point(coordinate),
      coords: coordinate,
      title: "Ponto ",
      description:"",
      longitude:coordinate[0],
      latitude:coordinate[1]
    });
    const img2 = document.createElement("img"); // Use DOM HTMLImageElement
    img2.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABm0lEQVR4nKXT4XXaMBhG4VcTlE5QmKB0gtgT0E5QswGZIPIEbSfA3YANqg3qDepOUDNBc4VQkIXj4OSe8/zggPXZsjCa1wJLSS1uymBOB2zQSbqH/zzZ3AGVpD1ijcKgHqPNHeDrJH1ArEWJHlcZzM1KekBaI2mLqwzmVkj6hbwvOGDQawb4/iOvk7TCIIOx9igU9rbTsKWkPxhri0ZJBnmFLlvQokSP2B6VxnMKv3/KIO831oj12KFTWLjSdO/R41Q+YA0/4C2VcDpnkGZ1fQSnOuId0u7xHafyAU7SHW7NL2Y1HFLD6pxBmtO8AStYSV8Rq2F1ziDN6fYBNayCB8S2aHTOIO2ADdL+osdHxGpYhayGAz6hxSmDtErhnKet0ElaKvAX94g5XZ76iAWeMkjzX3YavrQSTs/3D/46Xw2rJIO8Hb4h9hOVxrO6bI+/+6WGTyeDsQ7YILbDD6R9xh4L+Eo4ZRk8V6Ph8WvhFCoU/vW+IyqFm7pqaoCvUnCHPL+wX9QqvLfRXhoQW2OBQiGn8EQ9Jrt1wKt7BPsJUhlLlSlbAAAAAElFTkSuQmCC"
    img2.setAttribute('width', '300px');
    img2.setAttribute('height', '300px');
    let iconStyle = new Style({
      image: new Icon({
        anchor: [0.5, 100],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        src: "data:image/png;base64,"+markersBase64['default'],
        scale: 0.05
      }),
    });
    iconFeature.setStyle(iconStyle);

    let sourceMarkers = new VectorSource();
    let vectorMarkers: any = new VectorLayer({
      source: sourceMarkers,
      zIndex: 999
    });
    sourceMarkers.addFeature(iconFeature)
    return vectorMarkers;
  }

  //vincula informações a uma camada desenhada
  async addDrawedFeatureInfo(){
    if(this.formInfo.valid || this.params.skipModalForm){
      this.confirmDraw = false;
      if(this.selectedTool === "Coordenadas"){
        let vectorMarkers = this.createPointMarkerFromCoordinate([this.formInfo.get('longitude')?.value,this.formInfo.get('latitude')?.value])
        this.mapEle.addLayer(vectorMarkers)
        let drawedLayer:any = {
          "title":"",
          "type":"geoJson",
          "ref":vectorMarkers,
          "visible":true,
          "opacity":1,
          "zIndex":1000,
          "descriptionFields":[{
            "key":"description",
            "displayName":"Descrição"
          },{
            "key":"latitude",
            "displayName":"Lat"
          },{
            "key":"longitude",
            "displayName":"Lon"
          }]
        }
        this.drawedLayerRef = drawedLayer;
        if(this.params.layers.drawedLayers)
          this.params.layers.drawedLayers?.push(drawedLayer)
        else
          this.params.layers.drawedLayers = [drawedLayer]
      }


      this.drawedLayerRef.ref.set("title",this.formInfo.get('title')?.value);
      this.drawedLayerRef.ref.getSource()?.getFeatures().forEach((feature:any)=>{
        feature.set("description",this.formInfo.get('description')?.value)
        feature.set("title",this.formInfo.get('title')?.value)

        console.log(this.formInfo.get('selectedIcon')?.value)
        if(this.params.controls.enableIconSelection && (this.selectedTool === "Marcação" || this.selectedTool === "Coordenadas") && this.formInfo.get('selectedIcon')?.value !== "default"){
          feature.setStyle(new Style({
            image: new Icon({
              anchor: [0.0,0],
              anchorXUnits: 'fraction',
              anchorYUnits: 'pixels',
              src: "data:image/png;base64,"+markersBase64[this.formInfo.get('selectedIcon')?.value as keyof { default: string; fire: string; tree: string; "water-drop": string; well: string; }],
              scale: 0.8
            })
          }))
        }
      })
      this.drawedLayerRef.title = this.formInfo.get('title')?.value
      this.formInfo.reset({
        "description":"",
        "title":"",
        "latitude":"",
        "longitude":"",
        "selectedIcon":""
      })
      let sourceConfig = Object.assign({}, this.drawedLayerRef, {ref: undefined})
      sourceConfig.geoJson = new GeoJSON().writeFeaturesObject(this.drawedLayerRef.ref.getSource().getFeatures(),{featureProjection: this.params.projection,dataProjection:this.params.projection})
      sourceConfig.geoJson.fileName = this.drawedLayerRef.ref.get('title')
      let output = {
            "ol_uid": this.drawedLayerRef.ref.ol_uid,
            "title": this.drawedLayerRef.ref.get('title'),
            "properties": this.drawedLayerRef.ref.getSource().getFeatures().map((feature:any) => feature.getProperties()),
            "wktGeom": this.drawedLayerRef.ref.getSource().getFeatures().map((feature:any) => new WKT().writeGeometry(feature.getProperties().geometry)),
            "area":Math.round(((getArea(this.drawedLayerRef.ref.getSource().getFeatures().map((feature:any) => feature.getProperties())[0]?.geometry, { projection: this.params.projection })/10000) * 100.0)) / 100,
            "sourceConfig":sourceConfig


        }
        console.log('feacturePolygon',this.drawedLayerRef.ref.getSource().getFeatures())
      this.drawedLayer.emit(output)
        //this.optionNavigateMap();


    }
  }
  cancelDraw(){
    if(this.drawedLayerRef && this.drawedLayerRef.ref)
      this.deleteLayer(null,this.drawedLayerRef.ref)
    this.confirmDraw = false;
  }

  //altera a camada base do mapa para bing ou openstreetmaps
  setActiveBaseMap($event: any, layer: any) {
    //this.selectedBaseMapType = layer.type
    //console.log(this.baseMap.getLayers().getArray()[0])
    this.mapEle.removeLayer(this.baseMap)//.getLayers().getArray()[0])
    if(layer){
      let sourceBaseMap
      if(this.selectedBaseMapType === 'bing')
        sourceBaseMap = new BingMaps({
          key: layer.key,
          imagerySet: this.selectedStyle,
          // use maxZoom 19 to see stretched tiles instead of the BingMaps
          // "no photos at this zoom level" tiles
          // maxZoom: 19
        });
      else{

        sourceBaseMap = new OSM();
      }
      let tile = sourceBaseMap
          ? new TileLayer({
            title: layer.title,
            type: "base",
            visible: true,
            source: sourceBaseMap,
            zIndex: layer.zIndex,
          } as BaseLayerOptions)
          : null;
      this.baseMap = tile
      this.mapEle.addLayer(this.baseMap)
    }
    else{
      this.baseMap = null;
    }

    //.getLayers().getArray().push(tile)

  }

  //torna uma camada como a camada ativa
  setActiveLayer($event: any, layer: any) {
    //limpa a camada ativa anterior
    this.searchData = [];
    this.searchText.reset("");
    this.searching = false;
    this.searchLoading = false;
    if (this.activeLayer) {
      this.activeLayer.primary = false;
      this.infos = [];
      this.highlightedArea.getSource()?.clear();
      this.overlay.setPosition(undefined);

    }

    if (this.activeLayer === layer || layer.type === 'geoJson') {
      this.activeLayer = null;
      this.layerSelectedRadio = "";
      if(layer.type === 'geoJson'){
        // this.itemsOptionsMap[this.itemsOptionsMap.length-1].disabled = true;
        // let disabledMenuItem = document.getElementsByClassName("p-menuitem-link");
        // if(disabledMenuItem)
        //   disabledMenuItem[disabledMenuItem.length-1].classList.add("p-disabled");
      }
    } else {
      //insere camada como principal
      layer.primary = true;
      this.activeLayer = layer;
      // if(layer.searchField){
      //   this.itemsOptionsMap[this.itemsOptionsMap.length-1].disabled = false;
      //   let disabledMenuItem = document.getElementsByClassName("p-menuitem-link p-disabled");
      //   if(disabledMenuItem && disabledMenuItem[0])
      //     disabledMenuItem[0].classList.remove("p-disabled");
      // }
      // else{
      //   let disabledMenuItem = document.getElementsByClassName("p-menuitem-link");
      //   console.log(disabledMenuItem)
      //   if(disabledMenuItem && disabledMenuItem.length > 0)
      //     disabledMenuItem[disabledMenuItem.length-1].classList.add("p-disabled");
      // }

    }


  }

  //limpa o popup de informações da feature selecionada
  closePopup(event: any = null) {
    if (event)
      event.stopPropagation();
    this.highlightedArea.getSource()?.clear();
    this.overlay.setPosition(undefined);
  }

  //deleta uma camada do mapa
  deleteLayer(event:any,selectedLayer:any){
    console.log(selectedLayer)
    if(this.params.layers.drawedLayers?.find((layer:any ) => selectedLayer.ol_uid === layer.ref.ol_uid)){
      this.deletedLayer.emit(selectedLayer.ol_uid)
      this.mapEle.removeLayer(this.params.layers.drawedLayers?.find((layer:any ) => selectedLayer.ol_uid === layer.ref.ol_uid)?.ref)
      this.params.layers.drawedLayers?.splice(this.params.layers.drawedLayers?.findIndex(layer => layer.ref.ol_uid === selectedLayer.ol_uid),1)
    }
    if (event)
      event.stopPropagation();
      this.highlightedArea.getSource()?.clear();
      this.overlay.setPosition(undefined);
  }

  //abre o popup de legendas
  showLegend() {
    this.legendVisible = true;
    this.clearStyleOptionsMap();
    this.clearBackgroundColorOptionsDrawMap();
    this.setBackgroundColorOption("Navegar");
  }

  dragTouchEndEvent(itemArray: any, layer: any, group: any) {
    this.previousIndex = itemArray.findIndex((e: any) => e === layer);
    console.log(this.previousIndex)
  }

  drop($event: any, group: any = "source") {
    console.log($event.currentIndex)
    if (group === "source") {
      moveItemInArray(
        this.params.layers.sources,
        this.previousIndex,
        $event.currentIndex
      );
      //reordena as camadas no mapa de acordo com a ordem no controle de camadas
      this.params.layers.sources.forEach((layer: any, index: number) => {
        this.rebuildZIndex(layer.ref.ol_uid, ((this.params.layers.availableGroups.indexOf(layer.group) + 1) * 50) - index,
          this.mapEle.getLayerGroup());
      });
    }
    else {
      moveItemInArray(
        (this.params.layers.referenceBase || []),
        this.previousIndex,
        $event.currentIndex
      );
      //reordena as camadas no mapa de acordo com a ordem no controle de camadas
      (this.params.layers.referenceBase || []).forEach((layer: any, index: number) => {
        this.rebuildZIndex(layer.ref.ol_uid, index + ((this.params.layers.availableGroups.indexOf(layer.group) + 1) * 50), this.mapEle.getLayerGroup());
      });

    }

  }

  public handleDragStart(event: CdkDragStart): void {
    this.dragging = true;
  }


  //altera a opacidade da camada
  onChangeOpacity($event: any, layer: any) {
    layer.setOpacity(parseFloat($event.target.value));
  }


  //controla a visibilidade do controlador de mapa base
  showBaseMapControl() {
    this.baseMapControl = !this.baseMapControl;
  }

  //muda o estilo do mapa base Bing
  onBaseMapChange(style: any,baseMap:any) {
    let bingLayer: any = null;
    bingLayer = this.baseMap
    //encontra a referencia da camada base
    // this.baseMap.getLayersArray().forEach((layer: any) => {
    //   if (layer.getSource() instanceof BingMaps)
    //     bingLayer = layer;
    // })
    if (bingLayer.getSource() instanceof BingMaps ) {
      //altera o estilo da camada base Bing
      this.selectedStyle = style;
      let sourceBaseMap = new BingMaps({
        key: baseMap.key!,
        imagerySet: style,
        // use maxZoom 19 to see stretched tiles instead of the BingMaps
        // "no photos at this zoom level" tiles
        // maxZoom: 19
      });
      bingLayer.setSource(sourceBaseMap)
      bingLayer.getSource().changed()
      this.baseMap.changed()

      this.mapEle.updateSize()

    }
    this.baseMapControl = !this.baseMapControl;
  }

  //exporta uma camada do geoserver ou geoJSON como shapefile
  exportShapefile($event: any, layer: any) {
    //monta a url de exportação da camada para shapefile
    let shpUrl = ''
    if(layer.type != 'geoJson'){
      shpUrl = layer.layerUrl +
      '?service=WFS&version=1.1.0&request=GetFeature&typename=' +
      layer.layerIdentifier + '&outputFormat=SHAPE-ZIP&srsname=' +
      this.params.projection + '&viewparams=' + layer.viewParams.join(',') + (layer.filterList ? "&CQL_Filter=" + this.parseCql(layer.filterList) : "");
      //realiza o download do shapefile
      const link = this.renderer.createElement('a');
      link.setAttribute('target', '_self');
      link.setAttribute('href', shpUrl)
      link.click();
      link.remove();
    }
    else{
      let features = layer.ref.getSource().getFeatures()

      var json = new GeoJSON().writeFeatures(layer.ref.getSource().getFeatures(),{featureProjection: this.params.projection,dataProjection:this.params.projection} /*{featureProjection: 'EPSG:4674',dataProjection:'EPSG:31981'}*/);
      const options = {
        folder: "",
        filename: layer.title,
        outputType: "blob",
        compression: "DEFLATE",
        types: {
          point: layer.title,
          polygon: layer.title,
          polyline: layer.title,
        },
        prj:this.spatialRef.find((ref:any) => ref.auth_name == this.params.projection.split(':')[0] && ref.srid == this.params.projection.split(':')[1])?.srtext || null
      };

      shpwrite.zip(JSON.parse(json),options).then((zip:any) =>{
        shpUrl = window.URL.createObjectURL(zip);
        const link = this.renderer.createElement('a');
                    link.setAttribute('target', '_self');
                    link.setAttribute('download',options.filename)
                    link.setAttribute('href', shpUrl)
                    link.click();
                    link.remove();
      } );
    }

  }

  likeFilter(event:any){
    if(this.searchText.valid && !this.searchLoading){
      this.searchLoading = true;
      this.searchText.disable()
      let wfsUrl = this.searchLayer.layerUrl +
          '?service=WFS&version=1.1.0&request=GetFeature&typename=' +
          this.searchLayer.layerIdentifier + '&outputFormat=application/json&srsname=' +
          this.params.projection + "&CQL_Filter=" + this.parseCql([{
            "value":encodeURIComponent("'%"+event.value+"%'"),
            "key":this.searchLayer.searchField.key
          }
          ],' ILIKE ');
        console.log(wfsUrl)
        try {
          fetch(wfsUrl)
            .then(function (response) {
              return response.json();
            }).then((feature) => {
              this.searchLoading = false;
              this.searchText.enable()
              this.searchFailed = false;
              //Aplica zoom na camada caso exista a propriedade boundingBox da camada retornada
              this.searchData = feature.features.map((f:any) =>{
                return {
                  bbox: f.bbox,
                  properties: f.properties[this.searchLayer.searchField.key]
                }
              })
            }).catch( (error:any) => {
              this.searchLoading = false;
              console.log(
                "There has been a problem with your fetch operation: " + error.message,
              );
              this.searchFailed = true;
              this.searchText.enable()
            });
        }
        catch(e){
          this.searchLoading = false;
          this.searchText.enable()
          console.log(
            "There has been a problem with your fetch operation: " + e,
          );
          this.searchFailed = true;
        }
      }

  }

  //Dá zoom em uma determinada camada
  zoomToLayer($event: any, layer: any) {
    if (layer.type === "geoJson") {
      this.mapEle.getView().fit(layer.ref.getSource().getExtent(),
        {
          duration: 1500
        });
    } else {
      //monta a url da camada como WFS
      let wfsUrl = layer.layerUrl +
        '?service=WFS&version=1.1.0&request=GetFeature&typename=' +
        layer.layerIdentifier + '&outputFormat=application/json&srsname=' +
        this.params.projection + '&viewparams=' + layer.viewParams.join(',') + (layer.filterList && this.parseCql(layer.filterList) ? "&CQL_Filter=" + this.parseCql(layer.filterList) : "");
      console.log(wfsUrl)
      fetch(wfsUrl)
        .then(function (response) {
          return response.json();
        }).then((feature) => {

          //Aplica zoom na camada caso exista a propriedade boundingBox da camada retornada

          if (feature.bbox)
            layer.boundingBox = feature.bbox;
          this.mapEle.getView().fit(layer.boundingBox,
            {
              duration: 1500
            });
        })

    }
  }

  //Dá zoom em uma camada filtrada
  public zoomToLayerWithFilter(layerUrl: string, layerIdentifier: string, viewParams: string[], filters: filter[]) {

    let wfsUrl = layerUrl +
      '?service=WFS&version=1.1.0&request=GetFeature&typename=' +
      layerIdentifier + '&outputFormat=application/json&srsname=' +
      this.params.projection + '&viewparams=' + viewParams.join(',') + (filters ? "&CQL_Filter=" + this.parseCql(filters) : "");
    console.log(wfsUrl)
    fetch(wfsUrl)
      .then(function (response) {
        return response.json();
      }).then((feature) => {
        //Aplica zoom na camada caso exista a propriedade boundingBox da camada retornada
        this.mapEle.getView().fit(feature.bbox,
          {
            duration: 1500
          });
      })
  }

  rebuildZIndex(id: any, index: number, group: any) {
    group.getLayers().forEach((layer: any, i: any) => {
      if (layer.ol_uid === id) {
        layer.setZIndex(index + 1);
      }

      if (layer instanceof LayerGroup) {
        this.rebuildZIndex(id, index, layer);
      }
    });
  }

  //Altera a visibilidade de uma camada
  visibilityChange($event: any, layer: any) {
    let visibility = layer.ref.getVisible();


    if (visibility === true) {
      this.renderer.removeClass($event.target, "pi-eye");
      this.renderer.addClass($event.target, "pi-eye-slash");
    } else {
      this.renderer.removeClass($event.target, "pi-eye-slash");
      this.renderer.addClass($event.target, "pi-eye");
    }
    //altera a visibilidade da camada no mapa
    this.findLayer(layer.ref.ol_uid, this.mapEle.getLayerGroup(), !visibility);
    if(layer.vertexes){
      console.log(this.requestPoints())
      layer.vertexes.forEach((vertex: any)=>{

        this.setFeatureIndex(vertex, visibility);
      })
      console.log(this.requestPoints())
    }

  }

  private setFeatureIndex(vertex: any, visibility: any) {
    let index = -1;
    this.select.getFeatures().forEach((feature: any, indice: any) => {
      if (feature.ol_uid == vertex.ol_uid)
        index = indice;
    });
    let style = index !== -1 ? new Style({
      image: new CircleStyle({
        radius: 10,
        fill: new Fill({
          color: '#00AAFF',
        }),
      }),
      stroke: new Stroke({
        color: 'rgba(255, 255, 255, 0.7)',
        width: 2,
      }),
      text: new Text({
        text: (index + 1) + "",
        scale: 2
      })
    }) : new Style({
      image: new CircleStyle({
        radius: 7,
        fill: new Fill({
          color: '#fc0317',
        }),
      })
    });


    vertex.setStyle(!visibility === false ? new Style({}) : style);
  }

  onVisibilityChange($event: any, layer: any) {

    this.findLayer(
      layer.ol_uid,
      this.mapEle.getLayerGroup(),
      $event.target.checked
    );

  }

  expandDropDown($event: any) {

    if (this.dragging) {
      this.dragging = false;
      return;
    } else {
      let element: any = this.layerTreeElem && this.layerTreeElem.nativeElement;
      this.expandControl = !this.expandControl;
    }

  }

  findLayer(id: any, group: any, value: boolean) {

    group.getLayers().forEach((layer: any, i: any) => {
      if (layer.ol_uid === id) {
        layer.setVisible(value);
      }

      if (layer instanceof LayerGroup) {
        this.findLayer(id, layer, value);
      }
    });

  }


  onRasterChange(raster:any,imagerySet:any){
    raster.ref.getSource().updateParams({
      'LAYERS': imagerySet
  });

  }



  initMap(map: any, element: any) {

    //define a projeção EPSG:4674
    proj4.defs("EPSG:4674", "+proj=longlat +ellps=GRS80 +no_defs +type=crs");
    proj4.defs("EPSG:31983", "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");
    proj4.defs("EPSG:31981", "+proj=utm +zone=21 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");
    proj4.defs("EPSG:31976", "+proj=utm +zone=22 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");

    register(proj4);

    this.activeLayer = null;


    if (this.params) {
      //reordena as camadas de acordo com seu zIndex
      // this.params.layers.sources = this.params.layers.sources.sort(
      //   (a: any, b: any) =>
      //     this.params.layers.availableGroups.indexOf(a.group) -
      //     this.params.layers.availableGroups.indexOf(b.group) || b.zIndex - a.zIndex //b.zIndex - a.zIndex
      // );
      // this.params.layers.referenceBase = this.params.layers.referenceBase?.sort(
      //   (a: any, b: any) => this.params.layers.availableGroups.indexOf(a.group) -
      //     this.params.layers.availableGroups.indexOf(b.group) || b.zIndex - a.zIndex
      // );
      let layerAgg = [];

      //encontra a baseMap enviada nos parametros
      let baseMapUrl: any = this.params.baseMap.find(basemap =>  basemap.type === "OSM");

      if(!baseMapUrl){
        baseMapUrl= this.params.baseMap.find(basemap =>  basemap.type === "bing");
        this.selectedBaseMapType = 'bing'
      }
      else
        this.selectedBaseMapType = 'OSM'

      let sourceBaseMap: any = null;

      //guarda as demais camadas
      let otherLayers: any = this.params.layers.sources.filter((layer: any) => {
        if (layer && layer.type === "geoserver") return layer;
      });

      //cria uma camada para cada camada adicional
      let otherLayersSources = this.params.layers.sources.map((layer: any) => {
        let tileLayer = null;
        if (layer && layer.sourceType && layer.sourceType === "wfs") {
          tileLayer = new VectorLayer({
            title: layer.title,
            source: new VectorSource({
              format: new GeoJSON(),
              url: (extent) => {
                return (
                  layer.layerUrl +
                  "?service=WFS&" +
                  "version=1.1.0&request=GetFeature&typename=" +
                  layer.layerIdentifier +
                  "&outputFormat=application/json&srsname=" +
                  this.params.projection +
                  "&" +
                  "bbox=" +
                  extent.join(",") +
                  "," +
                  this.params.projection
                );
              },
              strategy: bboxStrategy,
            }),
            visible: false,
            zIndex: layer.zIndex,
            transition: 0,
          } as BaseLayerOptions);
        } else {
          let wmsParams = {
            LAYERS: layer.layerIdentifier,
            TILED: true,
            SRS: this.params.projection,
            BBOX: layer.boundingBox.join(","),
            viewparams: layer.viewParams,
            VERSION: "1.1.0",
          };

          if (layer.enableFilters && (layer.filterList && layer.filterList.length > 0)) {
            let cqlFilter = ""
            cqlFilter = this.parseCql(layer.filterList);
            if (cqlFilter)
              Object.assign(wmsParams, { CQL_Filter: cqlFilter });

          }
          let source = new TileWMS({
            url: layer.layerUrl,
            serverType: "geoserver",
            crossOrigin: "anonymous",
            params: wmsParams,
          });
          tileLayer = new TileLayer({
            title: layer.title,
            source: source,
            visible: layer.visible ? true : false,
            zIndex: layer.zIndex,
            transition: 0,
            opacity: layer.opacity ? layer.opacity : layer.opacity = 1
          } as BaseLayerOptions);
        }
        let capabilities = new WMSCapabilities();

        //recupera a bounding box da camada


        fetch(layer.layerUrl + "?REQUEST=GetCapabilities")
          .then(function (response) {
            return response.text();
          })
          .then((text) => {
            var result = capabilities.read(text);
            let laterCapability = result.Capability.Layer.Layer.find(
              (layerB: any) => layerB.Name === layer.layerIdentifier[0]
            );


            let boundingBoxes = laterCapability.BoundingBox;
            if (boundingBoxes) {
              layer.boundingBox = boundingBoxes.find(
                (box: any) => (box.crs = this.params.projection)
              ).extent;
            }
          });

        if (baseMapUrl)
          this.allLayers.push({
            title: baseMapUrl.title,
            type: "geoserver",
            layer: tileLayer,
          });
        layer.ref = tileLayer;
        layer.legendUrl = layer.ref.getSource().getLegendUrl() ?
          layer.ref.getSource().getLegendUrl() : null;
        return tileLayer;
      });


      //layer do basemap
      let otherLayersSourcesBaseMap = this.params.baseMap.filter(layer => layer.type !== "bing" && layer.type !== "OSM").map((layer: any) => {
        let tileLayer = null;
        if (layer && layer.sourceType && layer.sourceType === "wfs") {
          tileLayer = new VectorLayer({
            title: layer.title,
            source: new VectorSource({
              format: new GeoJSON(),
              url: (extent) => {
                return (
                  layer.layerUrl +
                  "?service=WFS&" +
                  "version=1.1.0&request=GetFeature&typename=" +
                  layer.layerIdentifier +
                  "&outputFormat=application/json&srsname=" +
                  this.params.projection +
                  "&" +
                  "bbox=" +
                  extent.join(",") +
                  "," +
                  this.params.projection
                );
              },
              strategy: bboxStrategy,
            }),
            visible: false,
            zIndex: layer.zIndex,
            transition: 0,
          } as BaseLayerOptions);
        } else {
          let wmsParams = {
            LAYERS: layer.layerIdentifier,
            TILED: true,
            SRS: this.params.projection,
            BBOX: layer.boundingBox.join(","),
            viewparams: layer.viewParams,
            VERSION: "1.1.0"
          };

          if (layer.enableFilters && (layer.filterList && layer.filterList.length > 0)) {
            let cqlFilter = ""
            cqlFilter = this.parseCql(layer.filterList);
            if (cqlFilter)
              Object.assign(wmsParams, { CQL_Filter: cqlFilter });

          }
          let source = new TileWMS({
            url: layer.layerUrl,
            serverType: "geoserver",
            crossOrigin: "anonymous",
            params: wmsParams,
          });
          tileLayer = new TileLayer({
            title: layer.title,
            source: source,
            visible: layer.visible ? true : false,
            zIndex: layer.zIndex,
            transition: 0,
            opacity: layer.opacity ? layer.opacity : layer.opacity = 1
          } as BaseLayerOptions);
        }
        let capabilities = new WMSCapabilities();

        //recupera a bounding box da camada


        fetch(layer.layerUrl + "?REQUEST=GetCapabilities")
          .then(function (response) {
            return response.text();
          })
          .then((text) => {
            var result = capabilities.read(text);
            let laterCapability = result.Capability.Layer.Layer.find(
              (layerB: any) => layerB.Name === layer.layerIdentifier[0]
            );



            let boundingBoxes = laterCapability.BoundingBox;
            if (boundingBoxes) {
              layer.boundingBox = boundingBoxes.find(
                (box: any) => (box.crs = this.params.projection)
              ).extent;
            }
          });

        if (baseMapUrl)
          this.allLayers.push({
            title: baseMapUrl.title,
            type: "geoserver",
            layer: tileLayer,
          });
        layer.ref = tileLayer;
        layer.legendUrl = layer.ref.getSource().getLegendUrl() ?
          layer.ref.getSource().getLegendUrl() : null;

        return tileLayer;

      });

      //rasters
      let otherRasterSources = this.params.rasters?.map((layer: any) => {
        let tileLayer = null;
        if (layer && layer.sourceType && layer.sourceType === "wfs") {
          tileLayer = new VectorLayer({
            title: layer.title,
            source: new VectorSource({
              format: new GeoJSON(),
              url: (extent) => {
                return (
                  layer.layerUrl +
                  "?service=WFS&" +
                  "version=1.1.0&request=GetFeature&typename=" +
                  layer.layerIdentifier +
                  "&outputFormat=application/json&srsname=" +
                  this.params.projection +
                  "&" +
                  "bbox=" +
                  extent.join(",") +
                  "," +
                  this.params.projection
                );
              },
              strategy: bboxStrategy,
            }),
            visible: false,
            zIndex: layer.zIndex,
            transition: 0,
          } as BaseLayerOptions);
        } else {
          let wmsParams = {
            LAYERS: layer.layerIdentifier[0].identifier,
            TILED: true,
            SRS: this.params.projection,
            BBOX: layer.boundingBox.join(","),
            viewparams: layer.viewParams,
            VERSION: "1.1.0"
          };

          if (layer.enableFilters && (layer.filterList && layer.filterList.length > 0)) {
            let cqlFilter = ""
            cqlFilter = this.parseCql(layer.filterList);
            if (cqlFilter)
              Object.assign(wmsParams, { CQL_Filter: cqlFilter });

          }
          let source = new TileWMS({
            url: layer.layerUrl,
            serverType: "geoserver",
            crossOrigin: "anonymous",
            params: wmsParams,
          });
          tileLayer = new TileLayer({
            title: layer.title,
            source: source,
            visible: layer.visible ? true : false,
            zIndex: layer.zIndex,
            transition: 0,
            opacity: layer.opacity ? layer.opacity : layer.opacity = 1
          } as BaseLayerOptions);
        }
        let capabilities = new WMSCapabilities();

        //recupera a bounding box da camada

        if(!layer.layerIdentifier[0].identifier)
          fetch(layer.layerUrl + "?REQUEST=GetCapabilities")
            .then(function (response) {
              return response.text();
            })
            .then((text) => {
              var result = capabilities.read(text);
              let laterCapability = result.Capability.Layer.Layer.find(
                (layerB: any) =>  layerB.Name === layer.layerIdentifier[0]
              );

              let boundingBoxes = laterCapability.BoundingBox;
              if (boundingBoxes) {
                layer.boundingBox = boundingBoxes.find(
                  (box: any) => (box.crs = this.params.projection)
                ).extent;
              }
            });

        if (baseMapUrl)
          this.allLayers.push({
            title: baseMapUrl.title,
            type: "geoserver",
            layer: tileLayer,
          });
        layer.ref = tileLayer;
        layer.legendUrl = layer.ref.getSource().getLegendUrl() ?
          layer.ref.getSource().getLegendUrl() : null;
        return tileLayer;
      });

      //layer de referencia
      let otherReferenceSources = this.params.layers.referenceBase?.map((layer: any) => {
        let tileLayer = null;
        if (layer && layer.sourceType && layer.sourceType === "wfs") {
          tileLayer = new VectorLayer({
            title: layer.title,
            source: new VectorSource({
              format: new GeoJSON(),
              url: (extent) => {
                return (
                  layer.layerUrl +
                  "?service=WFS&" +
                  "version=1.1.0&request=GetFeature&typename=" +
                  layer.layerIdentifier +
                  "&outputFormat=application/json&srsname=" +
                  this.params.projection +
                  "&" +
                  "bbox=" +
                  extent.join(",") +
                  "," +
                  this.params.projection
                );
              },
              strategy: bboxStrategy,
            }),
            visible: false,
            zIndex: layer.zIndex,
            transition: 0,
          } as BaseLayerOptions);
        } else {
          let wmsParams = {
            LAYERS: layer.layerIdentifier,
            TILED: true,
            SRS: this.params.projection,
            BBOX: layer.boundingBox.join(","),
            viewparams: layer.viewParams,
            VERSION: "1.1.0"
          };

          if (layer.enableFilters && (layer.filterList && layer.filterList.length > 0)) {
            let cqlFilter = ""
            cqlFilter = this.parseCql(layer.filterList);
            if (cqlFilter)
              Object.assign(wmsParams, { CQL_Filter: cqlFilter });

          }
          let source = new TileWMS({
            url: layer.layerUrl,
            serverType: "geoserver",
            crossOrigin: "anonymous",
            params: wmsParams,
          });
          tileLayer = new TileLayer({
            title: layer.title,
            source: source,
            visible: layer.visible ? true : false,
            zIndex: layer.zIndex,
            transition: 0,
            opacity: layer.opacity ? layer.opacity : layer.opacity = 1
          } as BaseLayerOptions);
        }
        let capabilities = new WMSCapabilities();

        //recupera a bounding box da camada


        fetch(layer.layerUrl + "?REQUEST=GetCapabilities")
          .then(function (response) {
            return response.text();
          })
          .then((text) => {
            var result = capabilities.read(text);
            let laterCapability = result.Capability.Layer.Layer.find(
              (layerB: any) => layerB.Name === layer.layerIdentifier[0]
            );


            let boundingBoxes = laterCapability.BoundingBox;
            if (boundingBoxes) {
              layer.boundingBox = boundingBoxes.find(
                (box: any) => (box.crs = this.params.projection)
              ).extent;
            }
          });

        if (baseMapUrl)
          this.allLayers.push({
            title: baseMapUrl.title,
            type: "geoserver",
            layer: tileLayer,
          });
        layer.ref = tileLayer;
        layer.legendUrl = layer.ref.getSource().getLegendUrl() ?
          layer.ref.getSource().getLegendUrl() : null;
        return tileLayer;
      });

      //Cria a camada da base
      switch (baseMapUrl && baseMapUrl.type) {
        case "OSM":
          sourceBaseMap = new OSM();
          this.allLayers.push({
            title: baseMapUrl.title,
            type: "OSM",
            layer: sourceBaseMap,
          });
          break;
        case "bing":
          this.selectedStyle = baseMapUrl.imagerySet;
          sourceBaseMap = new BingMaps({
            key: baseMapUrl.key,
            imagerySet: this.selectedStyle,
            // use maxZoom 19 to see stretched tiles instead of the BingMaps
            // "no photos at this zoom level" tiles
            // maxZoom: 19
          });
          this.allLayers.push({
            title: baseMapUrl.title,
            type: "bing",
            layer: sourceBaseMap,
          });

          break;
      }

      let tile = sourceBaseMap
        ? new TileLayer({
          title: baseMapUrl.title,
          type: "base",
          visible: true,
          source: sourceBaseMap,
          zIndex: baseMapUrl.zIndex,
        } as BaseLayerOptions)
        : null;

      this.baseMap = tile
      // sourceBaseMap
      //   ? new LayerGroup({
      //     title: "BaseMap",
      //     layers: [tile],
      //     strategies :[]
      //   } as GroupLayerOptions)
      //   : null;
      baseMapUrl.ref = tile;

      let layers = otherLayersSources;
      if (otherLayersSourcesBaseMap) {
        layers = layers.concat(otherLayersSourcesBaseMap)
      }
      if (otherReferenceSources) {
        layers = layers.concat(otherReferenceSources)

      }
      if(otherRasterSources){
        layers = layers.concat(otherRasterSources)

      }
      if (this.baseMap) layers.push(this.baseMap);
      this.vectorDraw = new VectorLayer({
        source: this.sourceDraw,
        zIndex: 1000,
        style: [new Style({
          fill: new Fill({
            color: 'rgba(252, 3, 23, 0.3)',
          }),
          stroke: new Stroke({
            color: '#fc0317',
            width: 2,
          }),
        }),
        new Style({
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({
              color: '#fc0317',
            }),
          }),
          geometry: function (feature: any) {
            // return the coordinates of all rings of the polygon
            let coordinates;
            if (feature.getGeometry().getType() == "LineString") {
              coordinates = feature.getGeometry().getCoordinates();
            } else if (feature.getGeometry().getType() == "Polygon") {
              coordinates = feature.getGeometry().getCoordinates()[0];
            }

            return new MultiPoint(coordinates);
          },
        }),],
      });

      layers.push(this.vectorDraw)
      layers.push(this.vectorMarkers)
      layers.push(this.drawGroup)

      if (map) {
        this.mapEle = map;
      } else {
        let container: any = this.popupElem && this.popupElem.nativeElement;
        //cria um Overlay para o popup de informações
        if (!this.overlay) {
          this.overlay = new Overlay({
            element: container,
            autoPan: {
              animation: {
                duration: 250,
              },
            },
          });
        }
        this.kmlLayer = new VectorLayer({
          title: "Pontos",
          source: this.vectorSourcePoints,
          zIndex: 1000
        } as BaseLayerOptions)
        layers.push(
          this.kmlLayer
        );

        //cria o mapa com as informações do JSON (projeção, coordenadas centrais, zoom, etc)
        this.mapEle = new Map({
          target: element,
          layers: layers,
          overlays: [this.overlay],
          view: new View({
            projection: this.params.projection,
            center: this.params.centerCoords,
            maxZoom: this.params.maxZoom,
            zoom: this.params.defaultZoom,
            extent: this.params.extent,
          }),
          controls: defaultControls().extend([
            this.controlBar,
            new FullScreen({
              source: this.fullscreenElem && this.fullscreenElem.nativeElement,
            }),

          ]),
        });
        this.popupOverlayPoint = new Overlay({
          element: this.popupPointElem.nativeElement,
          offset: [0, 0]
        });
        this.mapEle.addOverlay(this.popupOverlayPoint);

        //Aplica zoom caso alguma camada tenha sido indicada para zoom inicial
        let zoomOnInit: any = null;
        zoomOnInit = this.params.layers.sources.find(layer => layer.zoomOnInit);
        if (zoomOnInit) {
          setTimeout(() => {
            this.zoomToLayer(null, zoomOnInit);
          }, 1000);
        }


        this.highlightedArea = new VectorLayer({
          source: new VectorSource(),
          visible: true,
          map: this.mapEle,
        });
      }

      //controle de zoom em uma area
      let dragZoom = new DragZoom({
        condition: shiftKeyOnly, //zoom ao utilizar a tecla shift
      });
      this.mapEle.addInteraction(dragZoom);

      //slide de controlador de zoom
      const zoomslider = new ZoomSlider();
      this.mapEle.addControl(zoomslider);

      //controle de importação de camada ao arrastar arquivo no mapa
      const dragAndDropInteraction = new DragAndDrop({
        formatConstructors: [GeoJSON, new KML({ extractStyles: true, }), new Shapefile({})],
      });
      this.mapEle.addInteraction(dragAndDropInteraction);

      this.select = new Select({
        layers: [this.kmlLayer],
        multi: true,
        condition: click,
        toggleCondition: click

      });
      this.select.on('select',  (event:any) => {
        this.select.getFeatures().forEach((point:any,index:any)=>{
          point.setStyle(new Style({
            image: new CircleStyle({
              radius: 10,
              fill: new Fill({
                color: '#00AAFF',
              }),
            }),
            stroke: new Stroke({
              color: 'rgba(255, 255, 255, 0.7)',
              width: 2,
            }),
            text: new Text({
              text:(index+1)+"",
              scale:2
            })
          }))
        })

      });

      const modify = new Modify({
        features: this.select.getFeatures(),
      });

      this.mapEle.addInteraction(this.select);
      //this.mapEle.addInteraction(modify);

      //adiciona controle de rotação de mapa
      let rotate = new DragRotate();
      this.mapEle.addInteraction(rotate)

      dragAndDropInteraction.on('addfeatures', (event: any) => {
        //cria uma camada com as features contidas no arquivo importado
        const vectorSource = new VectorSource({
          features: event.features,
        });
        let kmlLayer = new VectorLayer({
          title: event.file.name,
          source: vectorSource,
        } as BaseLayerOptions)
        this.mapEle.addLayer(
          kmlLayer
        );
        this.kmlLayers.push({
          title: event.file.name,
          ref: kmlLayer
        });
      });

      // const parseShapefile = (source: any) => {
      // 	let geojson =  shp.parseShp(source);
      // 	return {
      // 	'type': 'FeatureCollection',

      // 	'features':geojson
      // 	};
      // }

      // const addLayerFromFile = (source: any) => {
      // 	let parsedShape = parseShapefile(source);
      // 	const vectorSource = new VectorSource({
      // 		features: parsedShape.features,
      // 	});
      // 	let kmlLayer = new VectorLayer({
      // 		title: event.file.name,
      // 		source: vectorSource,
      // 	}as BaseLayerOptions)
      // 	this.mapEle.addLayer(
      // 		kmlLayer
      // 	);
      // 	this.kmlLayers.push({
      // 		title:event.file.name,
      // 		ref: kmlLayer});
      // }

      if (!this.mousePositionControl) {
        let mousePositionDiv = this.mousePosElem && this.mousePosElem.nativeElement;
        let child = mousePositionDiv.lastElementChild;
        if (child) {
          mousePositionDiv.removeChild(child);
        }
        //cria controle de indicação de coordenada do mouse no mapa
        const mousePositionControl = new MousePosition({
          coordinateFormat: function (coordinate: any) {
            return format(coordinate, 'Lat: {y}, Lon: {x}', 4);
          },
          projection: this.params.projection,

          //  className: 'custom-mouse-position',
          //  target: mousePositionDiv,
        });
        this.mousePositionControl = this.mapEle.addControl(mousePositionControl);

      }

      const layerSwitcher = new LayerSwitcher({
        reverse: true,
        tipLabel: "Legend",
      });
      //this.mapEle.addControl(layerSwitcher);
      //cria controle de compasso, apontando para o norte que rotaciona de acordo com a view
      const compass = new Compass({
        className: "compass",
        src: 'compact',
        rotateVithView: true
      })
      this.mapEle.addControl(compass);

      //NOVA DEMANDA

      const selectStyle = new Style({
        fill: new Fill({
          color: '#eeeeee',
        }),
        stroke: new Stroke({
          color: 'rgba(255, 255, 255, 0.7)',
          width: 2,
        }),
      });


      this.selectedHoverFeature = null;
      this.mapEle.on('pointermove', (e: any) => {

        if (this.selectedHoverFeature !== null) {
          this.selectedHoverFeature.setStyle(undefined);
          this.selectedHoverFeature = null;
        }
        if (!this.activeLayer) {
          this.mapEle.forEachFeatureAtPixel(e.pixel, (f: any,layer:any) => {
            if(layer && layer !== this.kmlLayer && layer !== this.vectorMarkers && !this.params.layers.drawedLayers?.find(layerRef => layerRef.ref.ol_uid === layer.ol_uid))
            {this.selectedHoverFeature = f;
            selectStyle.getFill().setColor(f.get('COLOR') || '#eeeeee');
            f.setStyle(selectStyle);}
            return true;
          });

        }
      });



      //adiciona evento de obtenção de features do mapa no clique
      this.mapEle.on("singleclick", (evt: any) => {
        let coordinate = evt.coordinate;
        this.expandControl = false;
        this.baseMapControl = false;
        let pointsOnPixel: any = []
        let features: Array<any> = [];
        this.infos = [];
        this.selectedLayers = [];
        this.mapEle.forEachFeatureAtPixel(evt.pixel, (feature: any, layer: any) => {
          if (!layer || (layer && (layer === this.vectorDraw || layer === this.kmlLayer))) return
          if (feature.getGeometry().getType() === "Point")
            pointsOnPixel.push(feature);
          if (layer && layer === this.vectorMarkers) return;
          let fDisplayInfo: featureDisplayInfo = { feature: [],layer:null };
          const layerSelected: sourceConfig = this.params.layers.sources.filter(obj => obj.ref.ol_uid === layer.ol_uid)[0] || this.params.layers.drawedLayers?.filter(obj => obj.ref.ol_uid === layer.ol_uid)[0]
          features.push(feature);
          if (!this.activeLayer) {
            this.selectedLayers.push(layer)
            if(this.params.layers.drawedLayers?.find(obj => obj.ref.ol_uid === layer.ol_uid))
              fDisplayInfo.layer = layer
            if (layerSelected && layerSelected.descriptionFields) {
              fDisplayInfo.feature.push({
                displayName: "Nome da camada:",
                value: layer.get("title"),
              });
              layerSelected.descriptionFields.forEach(
                (info: info) => {
                  if (feature.getProperties()[info.key])
                    fDisplayInfo.feature.push({
                      displayName: info.displayName,
                      value: feature.getProperties()[info.key],
                    });

                }
              );
            }
            this.infos.push(fDisplayInfo);
          }
        });
        this.highlightedArea.getSource()?.clear();
        this.overlay.setPosition(null);
        if (features.length > 0) {
          this.overlay.setPosition(coordinate);
          this.highlightedArea.setZIndex(
            999
          );
          this.highlightedArea.getSource()?.addFeatures(features, {
            featureProjection: this.params.projection,
          });
          let properties: any = [];
          features.forEach((feature: any) => {
            properties.push(feature.getProperties());
          });
          this.highlightedAreaEvent.emit(properties);
        }
        if (this.selectedTool === "move")
          this.ExtractFeaturesFromCoordinate(coordinate);
        if (this.selectedTool === "Ponto") {
          if (!this.mapEle.hasFeatureAtPixel(evt.pixel) || (this.mapEle.hasFeatureAtPixel(evt.pixel) &&
            pointsOnPixel.length === 0)) {
            const iconFeature = new Feature({
              geometry: new Point(coordinate),
              coords: coordinate,
              title: "Ponto " + (this.sourceMarkers.getFeatures().length + 1)
            });

            let iconStyle = new Style({
              image: new Icon({
                anchor: [0.5, 100],
                anchorXUnits: 'fraction',
                anchorYUnits: 'pixels',
                src: "data:image/png;base64,"+ markersBase64['default'],
                scale: 0.05
              }),
            });
            iconFeature.setStyle(iconStyle);
            this.sourceMarkers.addFeature(iconFeature)

            let overlayDiv = document.createElement('div');


            let overlayRef = new Overlay({
              element: overlayDiv,
              autoPan: {
                animation: {
                  duration: 250,
                },
              },
            });
            overlayDiv.innerHTML = '<p>' + iconFeature.get("title") + '</p> <p>Lat: ' + coordinate[1] + '</p> <p>Lon: ' + coordinate[0] + '</p> ';
            overlayDiv.classList.add("ol-popup");
            let closer = document.createElement('a');
            closer.classList.add("ol-popup-closer");

            overlayDiv.append(closer);
            var closePointPopup = function () {
              closer.blur();
              overlayRef.setPosition(undefined);

            };
            closer.addEventListener('click', closePointPopup);

            overlayRef.setPosition(coordinate);

            this.mapEle.addOverlay(overlayRef)
          }
          else {
            let coordinateFeature = this.sourceMarkers.getClosestFeatureToCoordinate(coordinate).get("coords");
            let title = this.sourceMarkers.getClosestFeatureToCoordinate(coordinate).get("title");
            let overlayDiv = document.createElement('div');


            let overlayRef = new Overlay({
              element: overlayDiv,
              autoPan: {
                animation: {
                  duration: 250,
                },
              },
            });
            overlayDiv.innerHTML = '<p>' + title + '</p> <p>Lat: ' + coordinateFeature[1] + '</p> <p>Lon: ' + coordinateFeature[0] + '</p> ';;
            overlayDiv.classList.add("ol-popup");
            let closer = document.createElement('a');
            closer.classList.add("ol-popup-closer");

            overlayDiv.append(closer);
            var closePointPopup = function () {
              closer.blur();
              overlayRef.setPosition(undefined);

            };
            closer.addEventListener('click', closePointPopup);

            overlayRef.setPosition(coordinate);

            this.mapEle.addOverlay(overlayRef)
          }
        }
        if (this.selectedTool === "Marcação") {
          if (!this.mapEle.hasFeatureAtPixel(evt.pixel)||(this.mapEle.hasFeatureAtPixel(evt.pixel) &&
          pointsOnPixel.length === 0)) {
            const iconFeature = new Feature({
              geometry: new Point(coordinate),
              coords: coordinate,
              title: "Ponto ",
              description:"",
              longitude:coordinate[0],
              latitude:coordinate[1]
            });
            let type = this.params.markerIcon as string
            let iconStyle = new Style({
              image: new Icon({
                anchor: (!this.params.markerIcon || (this.params.markerIcon && this.params.markerIcon === "default")) ?  [0.5, 100] :[0.5,0],
                anchorXUnits: 'fraction',
                anchorYUnits: 'pixels',
                src: "data:image/png;base64,"+ markersBase64['default'],
                scale: (!this.params.markerIcon || (this.params.markerIcon && this.params.markerIcon === "default")) ? 0.05 :  0.05
              }),
            });
            iconFeature.setStyle(iconStyle);

            let sourceMarkers = new VectorSource();
            let vectorMarkers: any = new VectorLayer({
              source: sourceMarkers,
              zIndex: 999
            });
            sourceMarkers.addFeature(iconFeature)

            // let overlayDiv = document.createElement('div');


            // let overlayRef = new Overlay({
            //   element: overlayDiv,
            //   autoPan: {
            //     animation: {
            //       duration: 250,
            //     },
            //   },
            // });
            // overlayDiv.innerHTML = '<p>' + iconFeature.get("title") + '</p> <p>Lat: ' + coordinate[1] + '</p> <p>Lon: ' + coordinate[0] + '</p> ';
            // overlayDiv.classList.add("ol-popup");
            // let closer = document.createElement('a');
            // closer.classList.add("ol-popup-closer");

            // overlayDiv.append(closer);
            // var closePointPopup = function () {
            //   closer.blur();
            //   overlayRef.setPosition(undefined);

            // };
            // closer.addEventListener('click', closePointPopup);

            // overlayRef.setPosition(coordinate);

            this.mapEle.addLayer(vectorMarkers)

            let drawedLayer:any = {
              "title":"",
              "type":"geoJson",
              "ref":vectorMarkers,
              "visible":true,
              "opacity":1,
              "zIndex":1000,
              "descriptionFields":[{
                "key":"description",
                "displayName":"Descrição"
              },{
                "key":"latitude",
                "displayName":"Lat"
              },{
                "key":"longitude",
                "displayName":"Lon"
              }]
            }
            this.drawedLayerRef = drawedLayer;
            if(this.params.layers.drawedLayers)
              this.params.layers.drawedLayers?.push(drawedLayer)
            else
              this.params.layers.drawedLayers = [drawedLayer]

            if(!this.params.skipModalForm){
              this.confirmDraw = true;
            }

            this.addDrawedFeatureInfo();
          }

        }
      });

      const ro: any = new ResizeObserver(entries => {
        for (let entry of entries) {
          if (this.mapEle)
            setTimeout(() => {
              this.widthMap = this.fullscreenElem.nativeElement.clientWidth;
              this.heightMap = this.fullscreenElem.nativeElement.clientHeight;
              console.log(this.widthMap + " X " + this.heightMap)
              this.mapEle.updateSize();
            }, 200);
        }
      });
      let fullscreenDiv = this.fullscreenElem && this.fullscreenElem.nativeElement;

      if (fullscreenDiv && !this.resizeObserver)
        this.resizeObserver = ro.observe(this.fullscreenElem && this.fullscreenElem.nativeElement);




      /**
       * Currently drawn feature.
       * @type {import("../src/ol/Feature.js").default}
       */
      let sketch: any;



      /**
       * Overlay to show the help messages.
       * @type {Overlay}
       */
      let helpTooltip: any;

      /**
       * The measure tooltip element.
       * @type {HTMLElement}
       */
      let measureTooltipElement: any;

      /**
       * Overlay to show the measurement.
       * @type {Overlay}
       */
      let measureTooltip: any;

      /**
       * Message to show when the user is drawing a polygon.
       * @type {string}
       */
      const continuePolygonMsg = 'Clique para continuar desenhando o polígono/ clique duas vezes para finalizar o desenho';

      /**
       * Message to show when the user is drawing a line.
       * @type {string}
       */
      const continueLineMsg = 'Clique para continuar desenhando a linha/ clique duas vezes para finalizar o desenho';

      /**
       * Handle pointer move.
       * @param {import("../src/ol/MapBrowserEvent").default} evt The event.
       */
      const pointerMoveHandler = (evt: any) => {
        if (evt.dragging) {
          return;
        }
        /** @type {string} */
        let helpMsg = 'Clique para começar a desenhar';

        if (sketch) {
          const geom = sketch.getGeometry();
          if (geom instanceof Polygon) {
            helpMsg = continuePolygonMsg;
          } else if (geom instanceof LineString) {
            helpMsg = continueLineMsg;
          }
        }
        if (this.helpTooltipElement)
          this.helpTooltipElement!.innerHTML = helpMsg;
        if (helpTooltip)
          helpTooltip.setPosition(evt.coordinate);

        if (this.helpTooltipElement)
          this.helpTooltipElement!.classList.remove('hidden');
      };



      this.mapEle.on('pointermove', pointerMoveHandler);

      this.mapEle.getViewport().addEventListener('mouseout', () => {
        if (this.helpTooltipElement)
          this.helpTooltipElement.classList.add('hidden');
      });

      const typeSelect = document.getElementById('type');

      // global so we can remove it later

      /**
       * Format length output.
       * @param {LineString} line The line.
       * @return {string} The formatted length.
       */
      const formatLength = (line: any) => {
        const length = getLength(line, { projection: this.params.projection });
        let output;
        if (length > 100) {
          output = Math.round((length / 1000) * 100) / 100 + ' ' + 'km';
        } else {
          output = Math.round(length * 100) / 100 + ' ' + 'm';
        }
        return output;
      };

      /**
       * Format area output.
       * @param {Polygon} polygon The polygon.
       * @return {string} Formatted area.
       */
      const formatArea = (polygon: any) => {
        const area = getArea(polygon, { projection: this.params.projection });
        let output;
       // if (area > 10000) {
        if (this.params.measureUnit === "km") {
          output = Math.round(((area / 1000000.0) * 100)) / 100 + ' ' + 'km<sup>2</sup>';
        } else {
          if (this.params.measureUnit === "m")
            output = Math.round((area * 100.0)) / 100 + ' ' + 'm<sup>2</sup>';
          else{

            output = Math.round(((area/10000) * 100.0)) / 100 + ' ' + 'ha';
          }
        }
        return output;
      };
      const addInteraction = (typeDraw: string) => {
        if (this.draw)
          this.mapEle.removeInteraction(this.draw);

        this.clearStyleOptionsMap();
        this.setBackgroundColorOption("Régua");
        this.clearBackgroundColorOptionsDrawMap();
        this.setBackgroundColorOptionDrawMap(typeDraw);
        this.selectedTool = typeDraw
        this.mapElem.nativeElement.style.cursor = "default"

        const type = typeDraw == "Linha" ? 'LineString' : "Polygon";
        this.draw = new Draw({
          source: this.sourceDraw,
          type: type,
          style: new Style({
            fill: new Fill({
              color: 'rgba(255, 255, 255, 0.2)',
            }),
            stroke: new Stroke({
              color: '#fc0317',
              lineDash: [10, 10],
              width: 2,
            }),
            image: new CircleStyle({
              radius: 5,
              stroke: new Stroke({
                color: 'rgba(0, 0, 0, 0.7)',
              }),
              fill: new Fill({
                color: 'rgba(255, 255, 255, 0.2)',
              }),
            }),
          }),
        });
        this.mapEle.addInteraction(this.draw);

        createMeasureTooltip();
        createHelpTooltip();

        let listener: any;
        this.draw.on('drawstart', function (evt: any) {
          // set sketch
          sketch = evt.feature;

          /** @type {import("../src/ol/coordinate.js").Coordinate|undefined} */
          let tooltipCoord = evt.coordinate;

          listener = sketch.getGeometry().on('change', function (evt: any) {
            const geom = evt.target;
            let output;
            if (geom instanceof Polygon) {
              output = formatArea(geom);
              tooltipCoord = geom.getInteriorPoint().getCoordinates();
            } else if (geom instanceof LineString) {
              output = formatLength(geom);
              tooltipCoord = geom.getLastCoordinate();
            }
            measureTooltipElement.innerHTML = output;
            measureTooltip.setPosition(tooltipCoord);
          });
        });

        this.draw.on('drawend',  () => {
          measureTooltipElement.className = 'ol-tooltip ol-tooltip-static ol-red dark-font';
          measureTooltip.setOffset([0, -7]);
          // unset sketch
          sketch = null;
          // unset tooltip so that a new one can be created
          measureTooltipElement = null;
          createMeasureTooltip();
          unByKey(listener);
        });
      }

      const addDrawInteraction = (typeDraw: string) => {
        if (this.draw)
          this.mapEle.removeInteraction(this.draw);

        this.clearDrawInteraction();

        this.clearStyleOptionsMap();
        this.setBackgroundColorOption("Adicionar marcação");
        this.clearBackgroundColorOptionsDrawMap();
        this.setBackgroundColorOptionDrawMap(typeDraw);
        this.selectedTool = typeDraw
        this.mapElem.nativeElement.style.cursor = "default"
        let sourceDraw = new VectorSource();
        let vectorDraw :any = new VectorLayer({
          source: sourceDraw,
          zIndex:1000,
          style: [new Style({
            fill: new Fill({
              color: 'rgba(252, 3, 23, 0.3)',
            }),
            stroke: new Stroke({
              color: '#fc0317',
              width: 2,
            }),
          }),
          new Style({
            image: new CircleStyle({
              radius: 7,
              fill: new Fill({
                color: '#fc0317',
              }),
            }),
            geometry: function (feature: any) {
              // return the coordinates of all rings of the polygon
              let coordinates;
              if (feature.getGeometry().getType() == "LineString") {
                coordinates = feature.getGeometry().getCoordinates();
              } else if (feature.getGeometry().getType() == "Polygon") {
                coordinates = feature.getGeometry().getCoordinates()[0];
              }

              return new MultiPoint(coordinates);
            },
          }),],
        });
        vectorDraw.set('ol_uid',vectorDraw.ol_uid)
        //this.drawGroup.getLayers().getArray().push(vectorDraw)
        this.mapEle.addLayer(vectorDraw)
        const type = typeDraw == "Linha" ? 'LineString' : "Polygon";
        this.draw = new Draw({
          source: sourceDraw,
          type: type,
          style: new Style({
            fill: new Fill({
              color: 'rgba(255, 255, 255, 0.2)',
            }),
            stroke: new Stroke({
              color: '#fc0317',
              lineDash: [10, 10],
              width: 2,
            }),
            image: new CircleStyle({
              radius: 5,
              stroke: new Stroke({
                color: 'rgba(0, 0, 0, 0.7)',
              }),
              fill: new Fill({
                color: 'rgba(255, 255, 255, 0.2)',
              }),
            }),
          }),
        });
        this.mapEle.addInteraction(this.draw);

        //createMeasureTooltip();
        createHelpTooltip();

        let listener: any;
        this.draw.on('drawstart', function (evt: any) {
          // set sketch
          sketch = evt.feature;

          /** @type {import("../src/ol/coordinate.js").Coordinate|undefined} */
          let tooltipCoord = evt.coordinate;

          listener = sketch.getGeometry().on('change', function (evt: any) {
            const geom = evt.target;
            let output;
            if (geom instanceof Polygon) {
              output = formatArea(geom);
              tooltipCoord = geom.getInteriorPoint().getCoordinates();
            } else if (geom instanceof LineString) {
              output = formatLength(geom);
              tooltipCoord = geom.getLastCoordinate();
            }
            //measureTooltipElement.innerHTML = output;
            //measureTooltip.setPosition(tooltipCoord);
          });
        });

         this.draw.on('drawend',  async () => {
          //measureTooltipElement.className = 'ol-tooltip ol-tooltip-static ol-red';
          //measureTooltip.setOffset([0, -7]);
          // unset sketch
          sketch = null;
          // unset tooltip so that a new one can be created
          measureTooltipElement = null;
          createMeasureTooltip();
          unByKey(listener);


          this.formInfo.controls['latitude']?.clearValidators()
          this.formInfo.controls['longitude']?.clearValidators()
          this.formInfo.controls['latitude']?.updateValueAndValidity()
          this.formInfo.controls['longitude']?.updateValueAndValidity()
          let drawedLayer:any = {
            "title":"",
            "type":"geoJson",
            "ref":vectorDraw,
            "visible":true,
            "opacity":1,
            "zIndex":1000,
            "descriptionFields":[{
              "key":"description",
              "displayName":"Descrição"
            }]
          }
          this.drawedLayerRef = drawedLayer;
          if(this.params.layers.drawedLayers)
            this.params.layers.drawedLayers?.push(drawedLayer)
          else
            this.params.layers.drawedLayers = [drawedLayer]
          this.mapEle.removeInteraction(this.draw);
          await addDrawInteraction("Área marcação")

          // NÃO ABRE MODAL PARA ADICIONAR TÍTULO/DESCRIÇÃO A MARCAÇÃO
          if(!this.params.skipModalForm){
            this.confirmDraw = true;
          } else {
            this.addDrawedFeatureInfo()
          }
        });
      }

      /**
       * Creates a new help tooltip
       */
      const createHelpTooltip = () => {
        if (this.helpTooltipElement && this.helpTooltipElement.parentNode) {
          this.helpTooltipElement.parentNode.removeChild(this.helpTooltipElement);
        }
        this.helpTooltipElement = document.createElement('div');
        this.helpTooltipElement.className = 'ol-tooltip hidden ol-red dark-font';
        helpTooltip = new Overlay({
          element: this.helpTooltipElement,
          offset: [15, 0],
          positioning: 'center-left',
        });
        this.mapEle.addOverlay(helpTooltip);
      }

      /**
       * Creates a new measure tooltip
       */
      const createMeasureTooltip = () => {
        if (measureTooltipElement) {
          measureTooltipElement.parentNode.removeChild(measureTooltipElement);
        }
        measureTooltipElement = document.createElement('div');
        measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure ol-red dark-font';
        measureTooltip = new Overlay({
          element: measureTooltipElement,
          offset: [0, -15],
          positioning: 'bottom-center',
          stopEvent: false,
          insertFirst: false,
        });
        this.mapEle.addOverlay(measureTooltip);
      }
      let options : any = [
        {
          title: 'Navegar',
          icon: 'pi pi-compass',
          style: { 'background-color': '#F0FDFA', 'font-weight': 'bold', 'border': '2px groove #4cd07d' },
          command: () => this.optionNavigateMap()
        },
        {
          title: 'Informações',
          icon: 'pi pi-info-circle',
          command: () => this.optionInfoMap()
        }


      ]

      if(this.params.controls.draw)
        options.push({
          title: 'Régua',
          icon: 'pi pi-arrows-v',
          items: [
            {
              label: 'Área',
              //icon: 'pi pi-chart-area',
              style: {},
              command: () => addInteraction("Área")
            },
            {
              label: 'Linha',
              //icon: 'pi pi-fw pi-calendar-times',
              style: {},
              command: () => addInteraction("Linha")
            },
            {
              label: 'Ponto',
              //icon: 'pi pi-fw pi-calendar-times',
              style: {},
              command: () => this.optionDrawMap("Ponto")
            }
          ]
        })
      if(this.params.controls.exportAsImage)
        options.push({
          title: 'Exportar como PNG',
          icon: 'pi pi-camera',
          command: () => this.printscreen()
        })
      if(this.params.controls.legend)
        options.push({
          title: 'Legenda',
          icon: 'pi pi-book',
          command: () => this.showLegend()
        })
      if(this.params.controls.marker)
        options.push({
          title: 'Adicionar marcação',
          icon: 'pi pi-pencil',
          items: [
            {
              label: 'Área',
              //icon: 'pi pi-chart-area',
              style: {},
              command: () => addDrawInteraction("Área marcação")
            },
            {
              label: 'Ponto',
              //icon: 'pi pi-fw pi-calendar-times',
              style: {},
              command: () => this.optionDrawMarker("Marcação")
            },
            {
              label: 'Coordenadas',
              //icon: 'pi pi-fw pi-calendar-times',
              style: {},
              command: () => this.optionDrawMarker("Coordenadas")
            }
          ]
        })
      if(this.params.controls.selectVertex)
        options.push({
          title: 'Selecionar/desmarcar os vértices',
          icon: 'pi pi-map-marker',
          command: () => this.selectAllFeatures()
        })
      if(this.params.controls.search)
        options.push({
          title: 'Pesquisar',
          icon: 'pi pi-search',
          style: { 'disabled': 'true' },
          disabled: false,
          command: () => this.searchModal(this.activeLayer)
        })



      this.itemsOptionsMap = options
      //addInteraction()
      this.mapEle.on('pointermove', (e: any) => {
        if (this.selectedTool === "Ponto") {
          const pixel = this.mapEle.getEventPixel(e.originalEvent);
          const hit = this.mapEle.hasFeatureAtPixel(pixel);
          this.mapEle.getTarget().style.cursor = hit ? 'pointer' : '';
        }
        else {
          if (this.selectedTool === "move") {
            let features: any = [];
            this.mapEle.forEachFeatureAtPixel(e.pixel,
              (feature: any, layer: any) => {
                const valuesToShow: any = [];
                if (feature.getGeometry().getType() === "Point") {
                  features.push(feature)
                  this.popupPointElem.nativeElement.innerHTML ="Lat: "+ feature.getGeometry().flatCoordinates[1] + " , Lon: " + feature.getGeometry().flatCoordinates[0];
                  this.popupPointElem.nativeElement.hidden = false;
                  this.popupOverlayPoint.setPosition(e.coordinate);
                }

              }
            );
            if (!features || features.length === 0) {
              this.popupPointElem.nativeElement.innerHTML = '';
              this.popupPointElem.nativeElement.hidden = true;
            }
          }
        }

      });
      return this.mapEle;


    }

  }
  private clearDrawInteraction() {
    if (this.helpTooltipElement && this.helpTooltipElement.parentNode) {
      this.helpTooltipElement.parentNode.removeChild(this.helpTooltipElement);
    }
    let overlays = this.mapEle.getOverlays().getArray().slice();
    if (overlays)
      overlays.forEach((overlay: any) => {
        if (overlay !== this.overlay && overlay !== this.popupOverlayPoint)
          this.mapEle.removeOverlay(overlay);
      });
    this.vectorDraw.getSource()?.clear();
    this.vectorMarkers.getSource()?.clear();
  }

  selectAllFeatures(): void {
    let features = this.vectorSourcePoints.getFeatures();
    let selectedFeatures = this.select.getFeatures();

    if (features.length == selectedFeatures.getLength()) {
      this.select.getFeatures().clear()
    }
    else {
      this.select.getFeatures().clear()
      features.forEach((feature: any) => this.select.getFeatures().push(feature))
    }
    this.select.getFeatures().forEach((point:any,index:any)=>{
      point.setStyle(new Style({
        image: new CircleStyle({
          radius: 10,
          fill: new Fill({
            color: '#00AAFF',
          }),
        }),
        text: new Text({
          text:(index+1)+"",
          scale:2
        })
      }))
    })
  }
  printscreen(): void {
    this.mapEle.once('rendercomplete', () => {
      html2canvas(this.mapElem.nativeElement).then((canvas) => {
        let fileWidth = 208;
        let fileHeight = (canvas.height * fileWidth) / canvas.width;
        const FILEURI = canvas.toDataURL('image/png');

        const link: any = this.imageDownloadElem;
        link.nativeElement.href = FILEURI;
        link.nativeElement.click();
      });
    });
    this.mapEle.renderSync();
  }
  private parseCql(filterList: any[],operation='=') {
    let cqlFilter = ""
    console.log(filterList)
    let filters = filterList.filter((filter: any) => filter.value && filter.value !== "")
    filters.forEach((filter: any, index: number) => {
      if (index !== 0)
        cqlFilter += ' and '
      cqlFilter += (filter.key + operation + filter.value)
    })
    return cqlFilter;
  }


  private ExtractFeaturesFromCoordinate(coordinate: any) {
    //caso tenha uma camada ativa
    if (this.activeLayer) {
      let view = this.mapEle.getView();
      //recupera a url de obtenção de features da coordenada informada
      let url = this.activeLayer.ref.getSource().getFeatureInfoUrl(
        coordinate,
        view.getResolution(),
        view.getProjection(),

        {
          INFO_FORMAT: "application/json",
          QUERY_LAYERS: this.activeLayer.layerIdentifier,
          FEATURE_COUNT: "100",
          VERSION: "1.1.0",
          viewparams: this.activeLayer.viewParams,
        }
        //Mudar FEATURE_COUNT caso queira que seja retornado mais de 1 feature na coordenada
      );

      if (url) {
        fetch(url)
          .then(function (response) {
            return response.text();
          })
          .then((response) => {
            // modo padrão de ler features
            let allFeatures = new GeoJSON().readFeatures(response, {
              featureProjection: this.params.projection,
            });
            //caso tenha encontrado alguma feature, preenche a camada de highlight com as
            //features encontradas
            if (allFeatures && allFeatures.length > 0) {
              this.highlightedArea.getSource()?.clear();
              this.highlightedArea.setZIndex(
                999
              );
              this.highlightedArea.getSource()?.addFeatures(allFeatures, {
                featureProjection: this.params.projection,
              });

              let properties: any = [];
              allFeatures.forEach((feature: any) => {
                properties.push(feature.getProperties());
              });
              this.highlightedAreaEvent.emit(properties);
              let content: any = document.getElementById("popup-content");
              //monta as informações que serão mostradas no popup
              if (this.activeLayer.descriptionFields &&
                this.activeLayer.descriptionFields.length > 0) {
                this.infos = [];
                allFeatures.forEach((feature: any) => {
                  let fDisplayInfo: featureDisplayInfo = { feature: [] };
                  this.activeLayer.descriptionFields.forEach(
                    (info: info) => {
                      if (feature.getProperties()[info.key])
                        fDisplayInfo.feature.push({
                          displayName: info.displayName,
                          value: feature.getProperties()[info.key],
                        });
                    }
                  );
                  this.infos.push(fDisplayInfo)
                });
              }

              this.overlay.setPosition(coordinate);
              //da zoom na feature
              // this.mapEle.getView().fit(this.highlightedArea
              //   .getSource()?.getFeatures()[0]
              //   .getGeometry(), {padding: [170, 50, 30, 150]})
            } else {
              this.highlightedArea.getSource()?.clear();
              this.overlay.setPosition(undefined);
            }
          });
      }
    }
  }

  private optionDrawMap(typeDraw: string) {
    this.clearStyleOptionsMap();
    this.setBackgroundColorOption("Régua");
    this.clearBackgroundColorOptionsDrawMap();
    this.setBackgroundColorOptionDrawMap(typeDraw);
    this.mapElem.nativeElement.style.cursor = "default"
    this.selectedTool = typeDraw
    this.mapEle.removeInteraction(this.draw);
    if (this.helpTooltipElement) {
      this.helpTooltipElement.parentNode.removeChild(this.helpTooltipElement);
    }
  }

  private optionDrawMarker(typeDraw: string) {
    this.clearStyleOptionsMap();
    this.setBackgroundColorOption("Adicionar marcação");
    this.clearBackgroundColorOptionsDrawMap();
    this.setBackgroundColorOptionDrawMap(typeDraw);
    this.mapElem.nativeElement.style.cursor = "default"
    this.selectedTool = typeDraw
    this.clearDrawInteraction();
    this.mapEle.removeInteraction(this.draw);
    if (this.helpTooltipElement && this.helpTooltipElement.parentNode) {
      this.helpTooltipElement.parentNode.removeChild(this.helpTooltipElement);
    }
    if(typeDraw === "Coordenadas"){
      this.confirmDraw = true;

      this.formInfo.controls['latitude']?.setValidators([Validators.pattern(/^-?([0-8]?[0-9]|90)(\.[0-9]{1,10})?$/),
      Validators.required]);
      this.formInfo.controls['longitude']?.setValidators([Validators.pattern(/^-?([1]?[0-9]?[0-9]|180)(\.[0-9]{1,10})?$/),
      Validators.required]);

    }
    else{
      this.formInfo.controls['latitude']?.clearValidators()
      this.formInfo.controls['longitude']?.clearValidators()
      this.formInfo.controls['latitude']?.updateValueAndValidity()
      this.formInfo.controls['longitude']?.updateValueAndValidity()

    }

  }

  private optionNavigateMap() {
    this.selectedTool = "move"
    this.clearStyleOptionsMap();
    this.clearBackgroundColorOptionsDrawMap();
    this.setBackgroundColorOption("Navegar");
    this.mapElem.nativeElement.style.cursor = "default"
    this.mapEle.removeInteraction(this.draw);
    if (this.helpTooltipElement && this.helpTooltipElement.parentNode) {
      this.helpTooltipElement.parentNode.removeChild(this.helpTooltipElement);
    }
    let overlays = this.mapEle.getOverlays().getArray().slice();
    if (overlays)
      overlays.forEach((overlay: any) => {
        if (overlay !== this.overlay && overlay !== this.popupOverlayPoint)
          this.mapEle.removeOverlay(overlay)
      })
    this.vectorDraw.getSource()?.clear();
    this.vectorMarkers.getSource()?.clear();
  }

  private optionInfoMap() {
    this.selectedTool = "move"
    this.clearStyleOptionsMap();
    this.clearBackgroundColorOptionsDrawMap();
    this.setBackgroundColorOption("Informações");
    this.mapElem.nativeElement.style.cursor = "help"
    this.mapEle.removeInteraction(this.draw);
    if (this.helpTooltipElement && this.helpTooltipElement.parentNode) {
      this.helpTooltipElement.parentNode.removeChild(this.helpTooltipElement);
    }
    let overlays = this.mapEle.getOverlays().getArray().slice();
    if (overlays)
      overlays.forEach((overlay: any) => {
        if (overlay !== this.overlay && overlay !== this.popupOverlayPoint)
          this.mapEle.removeOverlay(overlay)
      })
    this.vectorDraw.getSource()?.clear();
    this.vectorMarkers.getSource()?.clear();
  }

  private clearBackgroundColorOptionsDrawMap() {
    const regua = this.itemsOptionsMap.find(item => item.title === 'Régua');

    if (regua && regua.items) {
      regua.items.map((item: any) => {
        item.style = {};
      })

    }
  }

  private setBackgroundColorOptionDrawMap(option: string) {

    const regua = this.itemsOptionsMap.find(item => item.title === 'Régua');

    if (regua && regua.items) {
      regua.items.map((item: any) => {
        if (item.label == option) {
          item.style = { 'background-color': '#F0FDFA', 'font-weight': 'bold' };
        }
      })

    }
  }

  private setBackgroundColorOption(option: string) {
    const itemSelected = this.itemsOptionsMap.find(item => item.title === option);

    if (itemSelected) {
      itemSelected.style = { 'background-color': '#F0FDFA', 'border': '2px groove #4cd07d' };
    }
  }

  private clearStyleOptionsMap() {
    this.itemsOptionsMap.map((item: any) => {
      item.style = {};
    })
  }

  updateWidthLayerTree() {
    const ro: any = new ResizeObserver(entries => {
      this.widthLayerTree = this.layerTreeElem.nativeElement.offsetWidth;
      if (this.widthLayerTree < Number(this.controlStyle.width.replace("px", ""))) {
        this.controlElem.nativeElement.style.width = this.controlStyle.width;
        this.layerTreeElem.nativeElement.style.width = this.controlStyle.width;
        this.layerTreeElem.nativeElement.style.height = "140px";
      } else {
        this.controlElem.nativeElement.style.width = this.widthLayerTree + 'px';
      }

      this.layerTreeElem.nativeElement.style.maxWidth = this.widthMap + 'px';
      this.layerTreeElem.nativeElement.style.maxHeight = this.heightMap - 50 + 'px'; //-100px por causa do dropdownButton

    });
    let layertree = this.layerTreeElem && this.layerTreeElem.nativeElement;
    if (layertree && !this.resizeObserver)
      this.resizeObserver = ro.observe(this.layerTreeElem && this.layerTreeElem.nativeElement);
  }

  showDialog() {
    this.visibleDialogGif = true;
  }

  removeDuplicates(array: any[], nameField: string): any[] {
    const result: any[] = [];
    array.forEach(objeto => {
      if (result.findIndex(item => item[nameField] === objeto[nameField]) === -1) {
        result.push(objeto);
      }
    });
    return result;
  }

  createLegendImage(fillColor: string | undefined, strokeColor: string | undefined): { [key: string]: string } {
    const styles = {
      'margin-top': '5px',
      'margin-left': '3px',
      'width': '13px',
      'height': '13px',
      'background-color': fillColor ?? "",
      'border': 'none'
    };
    if (strokeColor) {
      styles['border'] = `2px solid ${strokeColor}`;
    }
    return styles;
  }


}


//interface de informação do popup
export interface featureDisplayInfo {
  feature: { displayName?: string; value: string }[],
  layer?: any
}
//classe que transforma um shapefile como geoJSON
class Shapefile extends GeoJSON {
  constructor(options: any) {
    super(options);
  }
  override getType(): any {
    return "arraybuffer";
  }
  override readFeature(source: any, options: any): any {
    // transforma o shapefile em geoJSON
    let geojson: any = this.parseShapefile(source)
    if (geojson.features && geojson.features.length > 0) {
      return super.readFeature(geojson.features[0], options);
    }
  }
  parseShapefile(source: any) {
    let geojson = shp.parseShp(source);
    return {
      'type': 'FeatureCollection',

      'features': geojson
    };
  }

  override readFeatures(source: any, options: any): any {

    let geojson = this.parseShapefile(source)

    return super.readFeatures(geojson,  {
      dataProjection: 'EPSG:31981',
      featureProjection: 'EPSG:31981'
  });
  }
  override readProjection(source: any): any {

    let geojson;

    if (source instanceof ArrayBuffer) {

      geojson = this.parseShapefile(source)

    } else {
      geojson = source;
    }
    return super.readProjection(geojson);
  }
}
