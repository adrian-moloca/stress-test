/* global Express */
interface Strategy {
  upload: (file: Express.Multer.File, fileName: string) => Promise<string>
  uploadBase64: (fileEncoded: string, fileName: string) => Promise<string>
  get: (id: string) => Promise<Buffer>
  delete: (id: string) => Promise<void>
  deleteDirectory: (targetDir: string) => Promise<void>
  zipDirectory: (sourceDir: string, targetDir: string) => Promise<string>
  zipPDFArchive (sourceFiles: string[],
    maxArchiveSize: number,
    maxFilesPerArchive: number,
    translateFun: (label: string, props?: Record<string, string>) => string):
  Promise<string[]>
  unzipDirectory: (zipFileName: string, targetDir: string) => Promise<boolean>
  cloneDir: (sourceDir: string, targetDir: string) => Promise<boolean>
}

export default Strategy
