import Strategy from './Strategy'
import { Readable } from 'stream'
/* global Express */
class FilesDriver {
  strategy: Strategy
  constructor (strategy: Strategy) {
    this.strategy = strategy
  }

  upload (file: Express.Multer.File, fileName: string): Promise<string> {
    return this.strategy.upload(file, fileName)
  }

  uploadBase64 (fileEncoded: string, fileName: string): Promise<string> {
    return this.strategy.uploadBase64(fileEncoded, fileName)
  }

  async get (id: string): Promise<Readable> {
    const buffer = await this.strategy.get(id)
    const readable = new Readable()
    readable._read = () => { } // _read is required but you can noop it
    readable.push(buffer)
    readable.push(null)
    return readable
  }

  async delete (id: string): Promise<void> {
    return this.strategy.delete(id)
  }

  async deleteDirectory (targetDir: string): Promise<void> {
    return this.strategy.deleteDirectory(targetDir)
  }

  async move (oldId: string, newId: string): Promise<void> {
    const buffer = await this.strategy.get(oldId)
    await this.strategy.uploadBase64(buffer.toString('base64'), newId)
    await this.strategy.delete(oldId)
  }

  async zipDirectory (sourceDir: string, targetDir: string): Promise<string> {
    return this.strategy.zipDirectory(sourceDir, targetDir)
  }

  async zipPDFArchive (sourceFiles: string[],
    maxArchiveSize: number,
    maxFilesPerArchive:number,
    translateFun: (label: string, props?: Record<string, string>) => string):
    Promise<string[]> {
    try {
      return this.strategy.zipPDFArchive(sourceFiles,
        maxArchiveSize,
        maxFilesPerArchive,
        translateFun)
    } catch (e) {
      throw new Error(e)
    }
  }

  async unzipDirectory (zipFileId: string, targetDir: string): Promise<boolean> {
    return this.strategy.unzipDirectory(zipFileId, targetDir)
  }

  async cloneDir (sourceDir: string, targetDir: string): Promise<boolean> {
    return this.strategy.cloneDir(sourceDir, targetDir)
  }
}

export default FilesDriver
