import { ExportCsvRequestDTO } from '@smambu/lib.constantsjs'
import { PipeTransform, Injectable } from '@nestjs/common'
@Injectable()
export class ParseExportCsvRequest implements PipeTransform<ExportCsvRequestDTO,
  ExportCsvRequestDTO> {
  transform (value: ExportCsvRequestDTO): ExportCsvRequestDTO {
    return value
  }
}
