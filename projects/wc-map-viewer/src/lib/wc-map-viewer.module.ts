import { NgModule } from '@angular/core';
import { MapViewerComponent } from './wc-map-viewer.component';
import { DropdownModule } from 'primeng/dropdown';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { FieldsetModule } from 'primeng/fieldset';
//import { ResizableModule } from 'angular-resizable-element';
import { SearchPipePipe } from './pipes/search-pipe.pipe';
import { FilterPipe } from './pipes/filter-pipe';

import { DividerModule } from 'primeng/divider';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import {TooltipModule} from 'primeng/tooltip';
import { NgxMaskModule } from 'ngx-mask';
import { MinMaxDirective } from './numberRange';




@NgModule({
  declarations: [
    MapViewerComponent,
    SearchPipePipe,
    FilterPipe,
    MinMaxDirective
  ],
  imports: [
    DropdownModule,
    DragDropModule,
    OverlayPanelModule,
    ButtonModule,
    DialogModule,
    CommonModule,
    FormsModule,
    TieredMenuModule,
    FieldsetModule,
//    ResizableModule,
    DividerModule,
    RadioButtonModule,
    InputTextareaModule,
    InputTextModule,
    ReactiveFormsModule,
    TableModule,
    TooltipModule,
    NgxMaskModule.forRoot()
  ],
  exports: [
    MapViewerComponent
  ]
})
export class WcMapViewerModule { }
