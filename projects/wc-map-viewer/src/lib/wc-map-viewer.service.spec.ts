import { TestBed } from '@angular/core/testing';

import { WcMapViewerService } from './wc-map-viewer.service';

describe('WcMapViewerService', () => {
  let service: WcMapViewerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WcMapViewerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
