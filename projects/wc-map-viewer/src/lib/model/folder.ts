import { sourceConfig } from "./sourceConfig"
export interface folder {
  "folderTitle": string,
  "layers": sourceConfig[],
  "folders":folder[]
}
