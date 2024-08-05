import { Pipe, PipeTransform } from '@angular/core';

    @Pipe({
        name: 'FilterPipe',
        pure:false
    })
    export class FilterPipe implements PipeTransform {

        transform(items: any, filter: any, defaultFilter: boolean): any {
          //console.log(items)
            if (!filter || !Array.isArray(items)) {
                return items;
            }

            if (filter && Array.isArray(items)) {
                let filterKeys = Object.keys(filter);

                if (defaultFilter) {

                    return items.filter(item =>
                        filterKeys.reduce((x, keyName) =>
                            (x && new RegExp("^"+filter[keyName]+ "$", 'i').test(item[keyName])) || filter[keyName] == "", true));
                }
                else {

                  let filtrado = items.filter(item => {
                    let allFilters = true;
                       filterKeys.forEach((keyName) => {
                          if(!( new RegExp("^"+filter[keyName]+ "$", 'i').test(item[keyName]) ||
                          new RegExp("^"+filter[keyName]+ "$", 'i').test(item.group[keyName]) ||
                          filter[keyName] == ""))
                          allFilters=false;

                      });
                      return allFilters;
                  });
                    return filtrado
                }
            }
        }
    }
