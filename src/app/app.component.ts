import {
    AfterContentChecked,
    ChangeDetectorRef,
    Component,
    OnInit,
    Renderer2,
    SimpleChanges,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { mapConfig } from 'projects/wc-map-viewer/src/lib/model/config';
import Overlay from 'ol/Overlay';
import * as shp from 'shpjs';
import { MapViewerComponent } from 'projects/wc-map-viewer/src/lib/wc-map-viewer.component';
import { filter } from 'projects/wc-map-viewer/src/lib/model/filter';
import { sourceConfig } from 'projects/wc-map-viewer/src/lib/model/sourceConfig';


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterContentChecked {
    @ViewChild(MapViewerComponent) mapViewerComponent: MapViewerComponent | undefined;
    selectedEstado: any;
    selectedMunicipio: any;

    // Opções para os inputs de seleção
    estados: filter[] = [{ key: "tx_sigla_municipio", value: "PA" }, { key: "tx_sigla_municipio", value: "ES" }];
    municipios: filter[] = [{ key: "tx_nome_municipio", value: "Itupiranga" }, { key: "tx_nome_municipio", value: "Altamira" }, { key: "tx_nome_municipio", value: "Abaetetuba" }];
    layerEdit: any;


    constructor(private cdr: ChangeDetectorRef, private renderer: Renderer2) { }

    ngAfterContentChecked(): void {
        this.cdr.detectChanges();
    }

    ngOnInit(): void {
        this.paramsMapViewer = {
            "mapId": "",
            "title": "Mapa report 6",
            "controlSize": 'large',
            "fontSize": 'large',
            "markerIcon":"well",
            //"measureUnit":"m",
            "baseMap": [

                {
                  "title": "titulo da camada",
                  "type": "OSM",
                  "zIndex": 0,
                  "key": "AsQMFShoIU3hEnknwia7vT_d3fL8X2dO6V3HZX57-Tfzp_jBdFvizuyqjTahBhkC",
                  "imagerySet": "Aerial",
                  "viewParams": []
              },{
                "title": "titulo da camada",
                "type": "bing",
                "zIndex": 0,
                "key": "AsQMFShoIU3hEnknwia7vT_d3fL8X2dO6V3HZX57-Tfzp_jBdFvizuyqjTahBhkC",
                "imagerySet": "Aerial",
                "viewParams": []
            }
            ,

            ],
            "rasters":[
              {
              "title": "Uso do Solo - Mapbiomas ",
              "layerUrl": "https://geoserverdw.apps.geoapplications.net/geoserver/wms",
              "layerIdentifier": [
                {"description":"2021","identifier":"workspace_mit:Uso do Solo - 2021 - Mapbiomas"},
                {"description":"2022","identifier":"workspace_mit:Pastagem - 2021 - Mapbiomas	"},
                {"description":"2023","identifier":"workspace_mit:Estrutura Florestal"}


              ],
              "geoserverType": 'raster',
              "permissions": [
                  "view",
                  "hide",
                  "..."
              ],
              "primary": false,
              "type": "geoserver",
              "visible": false,
              "zIndex": 1,
              "boundingBox": [],
              "sourceType": "wms",
              "descriptionFields": [
                  {
                      "displayName": "Nome da UF",
                      "key": "tx_nome_uf"
                  },
                  {
                      "displayName": "Sigla",
                      "key": "tx_sigla_uf"
                  },
                  {
                      "displayName": "Região",
                      "key": "nm_regiao"
                  }
              ],
              "viewParams": []
          },
          {
              "title": "Pastagem - Mapbiomas",
              "layerUrl": "https://geoserverdw.apps.geoapplications.net/geoserver/wms",
              "layerIdentifier": [
                {"description":"2021","identifier":"workspace_mit:Pastagem - 2021 - Mapbiomas	"}
              ],
              "geoserverType": 'raster',
              "permissions": [
                  "view",
                  "hide",
                  "..."
              ],
              "visible": true,
              "zoomOnInit": false,
              "primary": false,
              "type": "geoserver",
              "zIndex": 2,
              "boundingBox": [
                  -56.9447,
                  -1.313,
                  -56.9013,
                  -1.2805
              ],
              "sourceType": "wms",
              "descriptionFields": [
                  {
                      "displayName": "Nome do Imóvel",
                      "key": "tx_nome_imovel"
                  },
                  {
                      "displayName": "Código do Imóvel",
                      "key": "tx_cod_imovel"
                  },
                  {
                      "displayName": "Status",
                      "key": "tx_status_imovel"
                  },
                  {
                      "displayName": "Tipo",
                      "key": "tx_tipo_imovel"
                  },
                  {
                      "displayName": "Número módulo fiscal",
                      "key": "num_modulo_fiscal"
                  },
                  {
                      "displayName": "Condição",
                      "key": "tx_des_condicao"
                  },
                  {
                      "displayName": "Área",
                      "key": "area_calc_ir"
                  }
              ],
              "viewParams": [
                  "id_imovel:122161"
              ]
          }],
            "centerCoords": [
                -56.9447,
                -1.313
            ],
            "projection": "EPSG:4674",
            "extent": [
              -122.19, -59.87,
              -25.28, 32.72
            ],
            "defaultZoom": 1,
            "maxZoom": 19,
            "controls": {
              "draw": true,
              "legend": true,
              "exportAsImage": true,
              "marker": true,
              "selectVertex": true,
              "search": true,
              "enableIconSelection":true
            },
            "layers": {
                "availableGroups": [
                  {
                    "id":1,
                    "title":"testando dinamico",
                    "subgroups":[
                      {
                        "title":"UF"
                      },
                      {
                        "title":"Imóvel"
                      }
                      ,
                      {
                        "title":"Termo de Reserva Legal e APP"
                      }
                      ,
                      {
                        "title":"Reserva Legal"
                      }
                    ]
                  },
                  {
                    "id":2,
                    "title":"segundo agrupamento",
                    "subgroups":[
                      {
                        "title":"UF"
                      }
                    ]
                  }

                  ],
                "sources": [
                    {
                        "title": "Municípios",
                        "group": {"groupId":1, "subGroup":"UF"},
                        "layerUrl": "https://geoserverdw.apps.geoapplications.net/geoserver/wms",
                        "layerIdentifier": [
                            "workspace_car_20:vw_camada_municipios"
                        ],
                        "permissions": [
                            "view",
                            "hide",
                            "..."
                        ],
                        "primary": false,
                        "type": "geoserver",
                        "zIndex": 5,
                        "boundingBox": [

                        ],
                        "searchField":{
                          "displayName":"Nome do Município",
                          "key":"tx_nome_municipio"
                        },
                        "sourceType": "wms",
                        "descriptionFields": [
                            {
                                "displayName": "Município",
                                "key": "tx_nome_municipio"
                            },
                            {
                                "displayName": "Sigla do Estado",
                                "key": "tx_sigla_municipio"
                            },
                            {
                                "displayName": "Área",
                                "key": "area_km2"
                            }
                        ],
                        "viewParams": [

                        ],
                        "enableFilters": false,
                        "filterList": [
                            {
                                "key": "tx_nome_municipio",
                                "value": "'Itupiranga'"
                            },
                            {
                                "key": "id_municipio",
                                "value": ""
                            }
                        ],
                        "zoomOnInit": false,
                        "visible": true
                    },
                    {
                      "title": "Municípioss",
                      "group": {"groupId":1, "subGroup":"Termo de Reserva Legal e APP"},
                      "layerUrl": "https://geoserverdw.apps.geoapplications.net/geoserver/wms",
                      "layerIdentifier": [
                          "workspace_car_20:vw_camada_municipios"
                      ],
                      "permissions": [
                          "view",
                          "hide",
                          "..."
                      ],
                      "primary": false,
                      "type": "geoserver",
                      "zIndex": 5,
                      "boundingBox": [

                      ],
                      "searchField":{
                        "displayName":"Nome do Município",
                        "key":"tx_nome_municipio"
                      },
                      "sourceType": "wms",
                      "descriptionFields": [
                          {
                              "displayName": "Município",
                              "key": "tx_nome_municipio"
                          },
                          {
                              "displayName": "Sigla do Estado",
                              "key": "tx_sigla_municipio"
                          },
                          {
                              "displayName": "Área",
                              "key": "area_km2"
                          }
                      ],
                      "viewParams": [

                      ],
                      "enableFilters": false,
                      "filterList": [
                          {
                              "key": "tx_nome_municipio",
                              "value": "'Itupiranga'"
                          },
                          {
                              "key": "id_municipio",
                              "value": ""
                          }
                      ],
                      "zoomOnInit": false,
                      "visible": true
                  },
                    {
                        "title": "Unidades da federação",
                        "group": {"groupId":1, "subGroup":"UF"},
                        "layerUrl": "https://geoserverdw.apps.geoapplications.net/geoserver/wms",
                        "layerIdentifier": [
                            "workspace_car_20:vw_camada_ufs"
                        ],
                        "permissions": [
                            "view",
                            "hide",
                            "..."
                        ],
                        "searchField":{
                          "displayName": "Estado",
                          "key":"tx_nome_uf"
                        },
                        "primary": false,
                        "type": "geoserver",
                        "zIndex": 10,
                        "boundingBox": [],
                        "sourceType": "wms",
                        "descriptionFields": [
                            {
                                "displayName": "Nome da UF",
                                "key": "tx_nome_uf"
                            },
                            {
                                "displayName": "Sigla",
                                "key": "tx_sigla_uf"
                            },
                            {
                                "displayName": "Região",
                                "key": "nm_regiao"
                            }
                        ],
                        "viewParams": []
                    },
                    {
                        "title": "Imóveis",
                        "group": {"groupId":1, "subGroup":"Imóvel"},
                        "layerUrl": "https://geoserverdw.apps.geoapplications.net/geoserver/wms",
                        "layerIdentifier": [
                            "workspace_car_20:geo_vw_imoveis"
                        ],
                        "permissions": [
                            "view",
                            "hide",
                            "..."
                        ],
                        "visible": true,
                        "zoomOnInit": true,
                        "primary": false,
                        "type": "geoserver",
                        "zIndex": 9,
                        "boundingBox": [
                            -56.9447,
                            -1.313,
                            -56.9013,
                            -1.2805
                        ],
                        "sourceType": "wms",
                        "descriptionFields": [
                            {
                                "displayName": "Nome do Imóvel",
                                "key": "tx_nome_imovel"
                            },
                            {
                                "displayName": "Código do Imóvel",
                                "key": "tx_cod_imovel"
                            },
                            {
                                "displayName": "Status",
                                "key": "tx_status_imovel"
                            },
                            {
                                "displayName": "Tipo",
                                "key": "tx_tipo_imovel"
                            },
                            {
                                "displayName": "Número módulo fiscal",
                                "key": "num_modulo_fiscal"
                            },
                            {
                                "displayName": "Condição",
                                "key": "tx_des_condicao"
                            },
                            {
                                "displayName": "Área",
                                "key": "area_calc_ir"
                            }
                        ],
                        "viewParams": [
                          "id_imovel:122161"
                        ]
                    },
                    {
                        "title": "Imóvel fora município de cadastro",
                        "group": {"groupId":1, "subGroup":"Imóvel"},
                        "layerUrl": "https://geoserverdw.apps.geoapplications.net/geoserver/wms",
                        "visible": true,
                        "layerIdentifier": [
                            "workspace_car_20:geo_vw_detalhe_imovel_fora_municipio"
                        ],
                        "permissions": [
                            "view",
                            "hide",
                            "..."
                        ],
                        "primary": false,
                        "type": "geoserver",
                        "zIndex": 8,
                        "boundingBox": [
                            -57.218,
                            -1.4919,
                            -56.8463,
                            -1.1668
                        ],
                        "sourceType": "wms",
                        "descriptionFields": [
                            {
                                "displayName": "Cod. Imovel Vizinho",
                                "key": "cod_imovel_vizinho"
                            },
                            {
                                "displayName": "Orgão Responsável",
                                "key": "tx_orgao_resp"
                            },
                            {
                                "displayName": "Data da última análise",
                                "key": "data_ultima_analise"
                            }
                        ],
                        "viewParams": [
                            "id_imovel:122161"
                        ]
                    },
                    {
                      "title": "Imóvel fora município de cadastro referencia",
                      "group": {"groupId":1, "subGroup":"UF"},
                      "layerUrl": "https://geoserverdw.apps.geoapplications.net/geoserver/wms",
                      "visible": true,
                      "layerIdentifier": [
                          "workspace_car_20:geo_vw_detalhe_imovel_fora_municipio"
                      ],
                      "permissions": [
                          "view",
                          "hide",
                          "..."
                      ],
                      "primary": false,
                      "type": "geoserver",
                      "zIndex": 8,
                      "boundingBox": [
                          -57.218,
                          -1.4919,
                          -56.8463,
                          -1.1668
                      ],
                      "sourceType": "wms",
                      "descriptionFields": [
                          {
                              "displayName": "Cod. Imovel Vizinho",
                              "key": "cod_imovel_vizinho"
                          },
                          {
                              "displayName": "Orgão Responsável",
                              "key": "tx_orgao_resp"
                          },
                          {
                              "displayName": "Data da última análise",
                              "key": "data_ultima_analise"
                          }
                      ],
                      "viewParams": [
                          "id_imovel:122161"
                      ]
                  }
                ],
                // "referenceBase": [
                //     {
                //         "title": "Municípios",
                //         "group": {"groupId":1, "subGroup":"UF"},
                //         "layerUrl": "https://geoserverdw.apps.geoapplications.net/geoserver/wms",
                //         "layerIdentifier": [
                //             "workspace_car_20:vw_camada_municipios"
                //         ],
                //         "permissions": [
                //             "view",
                //             "hide",
                //             "..."
                //         ],
                //         "primary": false,
                //         "type": "geoserver",
                //         "zIndex": 5,
                //         "boundingBox": [

                //         ],
                //         "sourceType": "wms",
                //         "descriptionFields": [
                //             {
                //                 "displayName": "Município",
                //                 "key": "tx_nome_municipio"
                //             },
                //             {
                //                 "displayName": "Sigla do Estado",
                //                 "key": "tx_sigla_municipio"
                //             },
                //             {
                //                 "displayName": "Área",
                //                 "key": "area_km2"
                //             }
                //         ],
                //         "viewParams": [

                //         ],
                //         "enableFilters": false,
                //         "filterList": [
                //             {
                //                 "key": "tx_nome_municipio",
                //                 "value": ""
                //             },
                //             {
                //                 "key": "id_municipio",
                //                 "value": ""
                //             }
                //         ],
                //         "zoomOnInit": false,
                //         "visible": true
                //     },
                //     {
                //         "title": "Unidades da federação",
                //         "group": "UF",
                //         "layerUrl": "https://geoserverdw.apps.geoapplications.net/geoserver/wms",
                //         "layerIdentifier": [
                //             "workspace_car_20:vw_camada_ufs"
                //         ],
                //         "permissions": [
                //             "view",
                //             "hide",
                //             "..."
                //         ],
                //         "primary": false,
                //         "type": "geoserver",
                //         "zIndex": 10,
                //         "boundingBox": [],
                //         "sourceType": "wms",
                //         "descriptionFields": [
                //             {
                //                 "displayName": "Nome da UF",
                //                 "key": "tx_nome_uf"
                //             },
                //             {
                //                 "displayName": "Sigla",
                //                 "key": "tx_sigla_uf"
                //             },
                //             {
                //                 "displayName": "Região",
                //                 "key": "nm_regiao"
                //             }
                //         ],
                //         "viewParams": []
                //     },
                //     {
                //         "title": "Imóveis",
                //         "group": "Imovel",
                //         "layerUrl": "https://geoserverdw.apps.geoapplications.net/geoserver/wms",
                //         "layerIdentifier": [
                //             "workspace_car_20:geo_vw_imoveis"
                //         ],
                //         "permissions": [
                //             "view",
                //             "hide",
                //             "..."
                //         ],
                //         "visible": true,
                //         "zoomOnInit": false,
                //         "primary": false,
                //         "type": "geoserver",
                //         "zIndex": 9,
                //         "boundingBox": [
                //             -56.9447,
                //             -1.313,
                //             -56.9013,
                //             -1.2805
                //         ],
                //         "sourceType": "wms",
                //         "descriptionFields": [
                //             {
                //                 "displayName": "Nome do Imóvel",
                //                 "key": "tx_nome_imovel"
                //             },
                //             {
                //                 "displayName": "Código do Imóvel",
                //                 "key": "tx_cod_imovel"
                //             },
                //             {
                //                 "displayName": "Status",
                //                 "key": "tx_status_imovel"
                //             },
                //             {
                //                 "displayName": "Tipo",
                //                 "key": "tx_tipo_imovel"
                //             },
                //             {
                //                 "displayName": "Número módulo fiscal",
                //                 "key": "num_modulo_fiscal"
                //             },
                //             {
                //                 "displayName": "Condição",
                //                 "key": "tx_des_condicao"
                //             },
                //             {
                //                 "displayName": "Área",
                //                 "key": "area_calc_ir"
                //             }
                //         ],
                //         "viewParams": [
                //             "id_imovel:122161"
                //         ]
                //     },
                //     {
                //         "title": "Imóvel fora município de cadastro",
                //         "group": "Imovel",
                //         "layerUrl": "https://geoserverdw.apps.geoapplications.net/geoserver/wms",
                //         "visible": true,
                //         "layerIdentifier": [
                //             "workspace_car_20:geo_vw_detalhe_imovel_fora_municipio"
                //         ],
                //         "permissions": [
                //             "view",
                //             "hide",
                //             "..."
                //         ],
                //         "primary": false,
                //         "type": "geoserver",
                //         "zIndex": 8,
                //         "boundingBox": [
                //             -57.218,
                //             -1.4919,
                //             -56.8463,
                //             -1.1668
                //         ],
                //         "sourceType": "wms",
                //         "descriptionFields": [
                //             {
                //                 "displayName": "Cod. Imovel Vizinho",
                //                 "key": "cod_imovel_vizinho"
                //             },
                //             {
                //                 "displayName": "Orgão Responsável",
                //                 "key": "tx_orgao_resp"
                //             },
                //             {
                //                 "displayName": "Data da última análise",
                //                 "key": "data_ultima_analise"
                //             }
                //         ],
                //         "viewParams": [
                //             "id_imovel:122161"
                //         ]
                //     }
                // ],
                "drawedLayers": [

                ]
            }
        }
        this.selectpoints =
        [
          {
              "disposed": false,
              "pendingRemovals_": null,
              "dispatching_": null,
              "listeners_": {
                  "change": [
                      null
                  ]
              },
              "revision_": 1,
              "ol_uid": "234",
              "values_": null,
              "extent_": [
                  -49.91739900000001,
                  -5.092306147595215,
                  -49.91739900000001,
                  -5.092306147595215
              ],
              "extentRevision_": 1,
              "simplifiedGeometryMaxMinSquaredTolerance": 6.080880399999998e-7,
              "simplifiedGeometryRevision": 1,
              "layout": "XY",
              "stride": 2,
              "flatCoordinates": [
                  -49.91739900000001,
                  -5.092306147595215
              ]
          },
          {
              "disposed": false,
              "pendingRemovals_": null,
              "dispatching_": null,
              "listeners_": {
                  "change": [
                      null
                  ]
              },
              "revision_": 1,
              "ol_uid": "208",
              "values_": null,
              "extent_": [
                  -49.91739900000001,
                  -5.092306147595215,
                  -49.91739900000001,
                  -5.092306147595215
              ],
              "extentRevision_": 1,
              "simplifiedGeometryMaxMinSquaredTolerance": 6.080880399999998e-7,
              "simplifiedGeometryRevision": 1,
              "layout": "XY",
              "stride": 2,
              "flatCoordinates": [
                  -49.91739900000001,
                  -5.092306147595215
              ]
          },
          {
              "disposed": false,
              "pendingRemovals_": null,
              "dispatching_": null,
              "listeners_": {
                  "change": [
                      null
                  ]
              },
              "revision_": 1,
              "ol_uid": "214",
              "values_": null,
              "extent_": [
                  -49.5337374,
                  -5.1266172999999995,
                  -49.5337374,
                  -5.1266172999999995
              ],
              "extentRevision_": 1,
              "simplifiedGeometryMaxMinSquaredTolerance": 6.080880399999998e-7,
              "simplifiedGeometryRevision": 1,
              "layout": "XY",
              "stride": 2,
              "flatCoordinates": [
                  -49.5337374,
                  -5.1266172999999995
              ]
          },
          {
              "disposed": false,
              "pendingRemovals_": null,
              "dispatching_": null,
              "listeners_": {
                  "change": [
                      null
                  ]
              },
              "revision_": 1,
              "ol_uid": "222",
              "values_": null,
              "extent_": [
                  -49.64758810480957,
                  -5.324686499999999,
                  -49.64758810480957,
                  -5.324686499999999
              ],
              "extentRevision_": 1,
              "simplifiedGeometryMaxMinSquaredTolerance": 6.080880399999998e-7,
              "simplifiedGeometryRevision": 1,
              "layout": "XY",
              "stride": 2,
              "flatCoordinates": [
                  -49.64758810480957,
                  -5.324686499999999
              ]
          },
          {
              "disposed": false,
              "pendingRemovals_": null,
              "dispatching_": null,
              "listeners_": {
                  "change": [
                      null
                  ]
              },
              "revision_": 1,
              "ol_uid": "218",
              "values_": null,
              "extent_": [
                  -49.2842014,
                  -5.157809299999999,
                  -49.2842014,
                  -5.157809299999999
              ],
              "extentRevision_": 1,
              "simplifiedGeometryMaxMinSquaredTolerance": 6.080880399999998e-7,
              "simplifiedGeometryRevision": 1,
              "layout": "XY",
              "stride": 2,
              "flatCoordinates": [
                  -49.2842014,
                  -5.157809299999999
              ]
          },
          {
              "disposed": false,
              "pendingRemovals_": null,
              "dispatching_": null,
              "listeners_": {
                  "change": [
                      null
                  ]
              },
              "revision_": 1,
              "ol_uid": "230",
              "values_": null,
              "extent_": [
                  -49.987581,
                  -5.207716595190429,
                  -49.987581,
                  -5.207716595190429
              ],
              "extentRevision_": 1,
              "simplifiedGeometryMaxMinSquaredTolerance": 6.080880399999998e-7,
              "simplifiedGeometryRevision": 1,
              "layout": "XY",
              "stride": 2,
              "flatCoordinates": [
                  -49.987581,
                  -5.207716595190429
              ]
          }
      ].map(point => point.flatCoordinates)

        setTimeout(() => {
            console.log(this.paramsMapViewer.layers.sources[0])
           // this.zoomToLayer(null, this.paramsMapViewer.layers.sources.find(layer => layer.title === "Municípios"))

        }, 3000);


    }
    ngAfterViewInit():void{


    }
    // MAPA
    map: any = null;
    mapFixed: any = null;
    overlay: any = new Overlay({});
    popupShow: boolean = true;

    title = 'MapViewElements';
    paramsMapViewer!: mapConfig;
    coordenada: number[] = [];
    viewParams: string[] = [];
    files: sourceConfig[] = [];
    filesTemp: sourceConfig[] = [];
    boundingBox: any = null;
    request: any = null;
    listOfPoints: any = [];
    drawedLayer:any = [];
    mapLoaded: any = null;
    requestShape: any = null;
    applyFilter:any = null;
    count:any = 0;
    changecontrol:any = null;
    insertDrawedLayer!:any[];
    selectpoints !:any[];

    applyFilterOnLayer(){

      this.applyFilter = {
        layerId:null,
        layerTitle:'Unidades da federação',
        filterList : [
          {
            "value":"'PA'",
            "key":"tx_sigla_uf"
          }
        ]
      }
    }
    removeFilterOnLayer(){

      this.applyFilter = {
        layerId:null,
        layerTitle:'Unidades da federação',
        filterList : null
      }
    }
    removeSelectInteraction(){
      if(!this.changecontrol)
        this.changecontrol = {
          enableVertex:false
        }
      else{
        this.changecontrol = {
          enableVertex: !this.changecontrol.enableVertex
        }
      }
    }
    printShapefile($event: any) {
      console.log($event)
      let shpUrl = window.URL.createObjectURL($event);
        const link = this.renderer.createElement('a');
                    link.setAttribute('target', '_self');
                    link.setAttribute('download','testando')
                    link.setAttribute('href', shpUrl)
                    link.click();
                    link.remove();
  }
    printHighlightedInfo($event: any) {
        console.log($event)
    }
    printMapLoad($event: any) {
      this.mapLoaded = true;
      return true;
  }
    printSelectedPoints($event: any) {
        console.log($event)
        this.listOfPoints = $event;
    }
    printDrawedLayer($event:any){
      //this.drawedLayer.push($event)
      console.log($event)
      this.drawedLayer = [$event]
      console.log(this.drawedLayer)
    }
    insertDrawedlayer(){
      this.insertDrawedLayer = [
        [
            [
                -58.5551055759287,
                -5.715776280167839
            ],
            [
                -51.03302707649041,
                -3.266072086747589
            ],
            [
                -52.59660549719733,
                -8.165480473588088
            ],
            [
                -58.17477552642757,
                -9.094677699210557
            ],
            [
                -58.5551055759287,
                -5.715776280167839
            ]
        ]
    ]
    }
    requestpoints() {
        //this.request = false;
        this.request = { request: true }
        console.log(this.request)

    }
    requestShapeFile(){
      this.requestShape = { layerId:  this.drawedLayer[0].ol_uid }
    }

    parseShape($event: any) {
        if ($event.target && $event.target.files && $event.target.files.length > 0) {
            $event.target.files[0].arrayBuffer().then((ab: any) => {
                shp(ab).then((geojson: any) => {
                    //this.files.geoJson = geojson;
                    var file = {
                        "title": geojson.fileName,
                        "group": {"groupId":1, "subGroup":"UF"},
                        "layerUrl": "https://geoserverdw.apps.geoapplications.net/geoserver/wms",
                        "layerIdentifier": [
                            "semas_car2_prod:geo_vw_imoveis"
                        ],
                        "enableVertex": false,//this.count%2 == 0 ? true : false,
                        "permissions": [
                            "view",
                            "hide",
                            "..."
                        ],
                        "visible": true,
                        "emitLayer":true,
                        "zoomOnInit": false,
                        "primary": false,
                        "type": "geoJson",
                        "geoJson": geojson,
                        "fillColor": geojson.fileName === "vw_car_cancelado_desmatamento_recente_por_condicaoPolygon" ? "red" : "rgb(0, 0, 0,0)",
                        "strokeColor": geojson.fileName === "vw_car_cancelado_desmatamento_recente_por_condicaoPolygon" ? "black" : "green",
                        "zIndex": geojson.fileName === "vw_car_cancelado_desmatamento_recente_por_condicaoPolygon" ? 21 : 20,
                        "boundingBox": [
                            -56.9447,
                            -1.313,
                            -56.9013,
                            -1.2805
                        ],
                        "sourceType": "wms",
                        "descriptionFields": [
                            {
                                "displayName": "Tema",
                                "key": "tema"
                            },
                            {
                                "displayName": "Nome do Imóvel",
                                "key": "tx_nome_im"
                            },
                            {
                                "displayName": "Código do Imóvel",
                                "key": "cod_imovel"
                            },
                            {
                                "displayName": "Status",
                                "key": "tx_status"
                            },
                            {
                                "displayName": "Tipo",
                                "key": "tx_tipo_im"
                            },
                            {
                                "displayName": "Número módulo fiscal",
                                "key": "num_modulo_fiscal"
                            },
                            {
                                "displayName": "Condição",
                                "key": "tx_des_condicao"
                            },
                            {
                                "displayName": "Área",
                                "key": "area_calc_ir"
                            }
                        ],
                        "viewParams": [
                            "id_imovel:122161"
                        ]
                    }
                    this.filesTemp.push(file);
                    console.log(this.filesTemp)
                    this.count++
                });
            });
        }
    }

    updateFiles() {
        this.files = [];
        this.files = this.filesTemp;
        this.filesTemp = [];

    }

    zoomToLayer($event: any, layer: any) {
        //monta a url da camada como WFS
        let wfsUrl = layer.layerUrl +
            '?service=WFS&version=1.1.0&request=GetFeature&typename=' +
            layer.layerIdentifier + '&outputFormat=application/json&srsname=' +
            this.paramsMapViewer.projection + '&viewparams=' + layer.viewParams.join(',') + (layer.filterList ? "&CQL_Filter=" + this.parseCql(layer.filterList) : "");
        console.log(wfsUrl)
        fetch(wfsUrl)
            .then(function (response) {
                return response.json();
            }).then((feature) => {

                //Aplica zoom na camada caso exista a propriedade boundingBox da camada retornada

                if (feature.bbox)
                    this.boundingBox = feature.bbox;

            })
    }

    test() {
        const layerUrl = "https://geoserverdw.apps.geoapplications.net/geoserver/wms";
        const layerIdentifier = "semas_car2_prod:vw_camada_municipios";
        const listFilters: filter[] = [];

        console.log(this.selectedEstado)
        if (this.selectedEstado)
            listFilters.push({ key: "tx_sigla_municipio", value: "'" + this.selectedEstado + "'" });

        if (this.selectedMunicipio)
            listFilters.push({ key: "tx_nome_municipio", value: "'" + this.selectedMunicipio + "'" });

        this.mapViewerComponent?.zoomToLayerWithFilter(layerUrl, layerIdentifier, [], listFilters)
    }

    editLayer() {
        this.layerEdit = {
            "ol_uid": this.drawedLayer[0].ol_uid,
            "op": "replace",
            "title": "titulo da camada",
            "properties": [
                {
                    "key": "description",
                    "value": "descrição editada"
                }
            ]
        }
        console.log(this.layerEdit)
    }
    deleteLayer(){
        this.layerEdit = [{
            "ol_uid":  this.drawedLayer[0].ol_uid,
            "op": "remove"
        }]
        console.log(this.layerEdit)
    }
    printDeletedLayer(event:any){
      console.log("a camada de id "+ event+"foi deletada")
    }
    // Função para lidar com a seleção do estado
    onSelectEstado() {
        console.log()
        console.log('Estado selecionado:', this.selectedEstado);
    }

    // Função para lidar com a seleção do município
    onSelectMunicipio() {
        console.log('Município selecionado:', this.selectedMunicipio);
    }

    // Função para comparar os objetos Filter
    compareFilters(filter1: filter, filter2: filter): boolean {
        return filter1 && filter2 ? filter1.key === filter2.key && filter1.value === filter2.value : filter1 === filter2;
    }

    private parseCql(filterList: any[]) {
        let cqlFilter = ""

        let filters = filterList.filter((filter: any) => filter.value && filter.value !== "")
        filters.forEach((filter: any, index: number) => {
            if (index !== 0)
                cqlFilter += ' and '
            cqlFilter += (filter.key + '=' + filter.value)
        })
        return cqlFilter;
    }
}
