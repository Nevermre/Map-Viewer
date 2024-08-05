import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'searchPipe',
  pure: false
})
export class SearchPipePipe implements PipeTransform {

  transform(values: any[], key: string, valueFilter: string, defaultValue: string, exactSearch?:boolean): any[] {
    //defaultValue = filter for complete search
    //key = field  to search in object
    //valueFilter = value to search

    if (valueFilter === defaultValue) {
      return values;
    } else {
      if(exactSearch){
        console.log(values)
        return (values || []).filter(item => key.split(',').some(key => item.hasOwnProperty(key) && new RegExp(valueFilter+'\\b', 'gi').test(item[key]))).sort((a, b) => a.order - b.order);

      }
        else{
          console.log(values)

      return (values || []).filter(item => key.split(',').some(key => item.hasOwnProperty(key) && new RegExp(valueFilter, 'gi').test(item[key]))).sort((a, b) => a.order - b.order);;
        }
    }
  }

}

