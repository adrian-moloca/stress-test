import { IExtraMaterial, IExtraMaterialsDTO } from '@smambu/lib.constantsjs'
import { PipeTransform, Injectable } from '@nestjs/common'
@Injectable()
export class ParseExtraMaterials implements PipeTransform<IExtraMaterialsDTO, IExtraMaterial[]> {
  transform (value: IExtraMaterialsDTO): IExtraMaterial[] {
    return value.materials.map(material => {
      const editedPrice = material.editedPrice != null ? Number(material.editedPrice) : null
      const amount = Number(material.amount)

      return ({
        ...material,
        editedPrice,
        amount
      })
    })
  }
}
