import Feature from 'ol/Feature';

export interface FeatureCollection{
  "features":Feature[],
  "filename":string,
  "type":string
}
