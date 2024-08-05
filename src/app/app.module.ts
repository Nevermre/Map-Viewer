import { NgModule, Injector } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { WcMapViewerModule, MapViewerComponent } from 'projects/wc-map-viewer/src/public-api';
import { createCustomElement } from '@angular/elements';
import { DropdownModule } from 'primeng/dropdown';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
// import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { NgxMaskModule } from 'ngx-mask';

@NgModule({
  declarations: [
    //  AppComponent
  ],
  imports: [
    BrowserModule,
    DropdownModule,
    OverlayPanelModule,
    ButtonModule,
    DialogModule,
    BrowserAnimationsModule,
    WcMapViewerModule,
    FormsModule,
    NgxMaskModule.forRoot(),
  ],
  providers: [],
  bootstrap: [
    // AppComponent
  ]
})
export class AppModule {
  constructor(private injector: Injector) { }
  ngDoBootstrap() {
    const MapViewerElm = createCustomElement(MapViewerComponent, {injector: this.injector});
    customElements.define('web-map-viewer', MapViewerElm);
  }
}
