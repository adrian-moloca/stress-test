import Strategy from './Strategy'
import { Storage } from '@google-cloud/storage'
import { join, basename } from 'path'
import * as archiver from 'archiver'
import * as unzipper from 'unzipper'
import { generatePDFArchivesFilename, tPDFGenerationStats } from '@smambu/lib.constantsjs'

/* global Express */
const listDirFiles = (storage: Storage, fromDir: string) => {
  const bucketName = process.env.GCP_BUCKET_NAME

  return storage.bucket(bucketName).getFiles({ prefix: fromDir })
    .then(data => data[0])
}

function zipFile (storage: Storage, file: File, manifest: any[], zip: any) {
  const bucketName = process.env.GCP_BUCKET_NAME
  const pathInZip = file.name.split('/').slice(1)
    .join('/')

  return new Promise(function (resolve, reject) {
    const reader = storage.bucket(bucketName).file(file.name)
      .createReadStream()
    reader.on('error', e => reject(e))
    reader.on('end', () => {
      manifest.push([file.name, pathInZip])

      resolve([file.name, pathInZip])
    })

    zip.append(reader, { name: pathInZip })
  })
}

const zipEachFile = async (storage: Storage, manifest: any[], zip: any, fileList: any[]) => {
  const results = []

  for (const file of fileList) {
    const result = await zipFile(storage, file, manifest, zip)

    results.push(result)
  }

  return results
}

class GCPStrategy implements Strategy {
  storage = new Storage({
    keyFile: join(__dirname, '../../GCP_service_account'),
  })

  async upload (file: Express.Multer.File, fileName: string): Promise<string> {
    const buffer = Buffer.from(file.buffer)
    try {
      const file = this.storage
        .bucket(process.env.GCP_BUCKET_NAME)
        .file(fileName)
      await file.save(buffer)
      return fileName
    } catch (e) {
      console.error(e)
      throw new Error('uploading_error')
    }
  }

  async uploadBase64 (fileEncoded: string, fileName: string): Promise<string> {
    const buffer = Buffer.from(fileEncoded, 'base64')
    try {
      const file = this.storage
        .bucket(process.env.GCP_BUCKET_NAME)
        .file(fileName)
      await file.save(buffer)
      return fileName
    } catch (e) {
      console.error(e)
      throw new Error('uploading_error')
    }
  }

  async get (id: string): Promise<Buffer> {
    try {
      const data = await this.storage
        .bucket(process.env.GCP_BUCKET_NAME)
        .file(id)
        .download()
      return Buffer.from(data[0])
    } catch (e) {
      console.error(e)
      throw new Error('get_file_error')
    }
  }

  async delete (id: string): Promise<void> {
    try {
      const fileExists = await this.storage.bucket(process.env.GCP_BUCKET_NAME).file(id)
        .exists()

      if (!fileExists) return

      await this.storage.bucket(process.env.GCP_BUCKET_NAME).file(id)
        .delete()
    } catch (e) {
      console.error(e)
      throw new Error('delete_file_error')
    }
  }

  async deleteDirectory (targetDir: string): Promise<void> {
    const bucketName = process.env.GCP_BUCKET_NAME
    const [files] = await this.storage.bucket(bucketName).getFiles({ prefix: targetDir })

    for (const file of files)
      await file.delete()
  }

  async zipDirectory (sourceDir: string, targetDir: string): Promise<string> {
    const bucketName = process.env.GCP_BUCKET_NAME
    const lastDirectory = sourceDir.split('/').pop()

    const fileId = `${targetDir}/${lastDirectory}.zip`

    const manifest = []

    const zip = archiver('zip', { zlib: { level: 9 } })

    return listDirFiles(this.storage, sourceDir)
      .then(fileList => zipEachFile(this.storage, manifest, zip, fileList))
      .then(() => {
        zip.finalize()

        const uploadOptions = { destination: targetDir, metadata: { contentType: 'application/zip' } }

        const bucketOutput = this.storage.bucket(bucketName).file(fileId)
          .createWriteStream(uploadOptions)

        const bucketPromise = new Promise((resolve, reject) => {
          bucketOutput.on('finish', () => resolve(fileId))
          bucketOutput.on('error', reject)
        })

        zip.pipe(bucketOutput)

        return bucketPromise
      })
      .then(() => fileId)
  }

  async zipPDFArchive (sourceFiles: string[],
    maxArchiveSize: number,
    maxFilesPerArchive: number,
    translateFun: (label: string, props?: Record<string, string>) => string):
    Promise<string[]> {
    try {
      const archiveExportFolder = process.env.PDF_ARCHIVES_FOLDER
      const bucketName = process.env.GCP_BUCKET_NAME

      const statsPromises = sourceFiles.map(current => this.storage
        .bucket(bucketName)
        .file(current)
        .getMetadata()
        .then(([metadata]) => {
          const returnObj:tPDFGenerationStats = {
            filename: current,
            size: Number(metadata.size)
          }

          return returnObj
        }))

      const stats = await Promise.all(statsPromises)

      const archives:string[][] = [[]]

      let currentArchiveIndex = 0
      let archiveSize = 0

      stats.forEach(current => {
        const currentSize = current.size
        const currentFilesNumber = archives[currentArchiveIndex].length

        if (currentSize > maxArchiveSize) {
          // this is a pretty impossible case. Going down this path means that,
          // either:
          // - there is a problem with the configuration;
          // - there is a problem with a specific file.
          // both of which must be investigated
          const baseFilename = basename(current.filename)
          const errorMessage = translateFun('cannotArchiveFileTooBig', {
            invoiceName: baseFilename,
            invoiceSize: `${currentSize}`,
            maxInvoiceSize: `${maxArchiveSize}`
          })

          throw new Error(errorMessage)
        }

        const tooBig = (archiveSize + currentSize) > maxArchiveSize
        const tooManyFiles = currentFilesNumber >= maxFilesPerArchive

        if (tooBig || tooManyFiles) {
          currentArchiveIndex++
          archiveSize = currentSize

          archives.push([])
        } else {
          archiveSize += currentSize
        }

        archives[currentArchiveIndex].push(current.filename)
      })

      return new Promise((resolve, reject) => {
        const archivesFilenames:string[] = []
        for (const currentArchive of archives) {
          const archiveFileName = generatePDFArchivesFilename()
          const outFileName = `${archiveExportFolder}/${archiveFileName}`

          const uploadOptions = {
            metadata: {
              contentType: 'application/zip'
            }
          }

          const bucketOutput = this.storage.bucket(bucketName).file(outFileName)
            .createWriteStream(uploadOptions)

          bucketOutput.on('error', reject)

          const zip = archiver('zip', { zlib: { level: 9 } })

          for (const currentFile of currentArchive) {
            const bucket = this.storage.bucket(bucketName)

            const tmpStream = bucket
              .file(currentFile)
              .createReadStream()
            const baseFilename = basename(currentFile)

            zip.append(tmpStream, { name: baseFilename })
          }

          zip.on('error', function (err) {
            console.error(err)

            reject(err)
          })

          zip.pipe(bucketOutput)

          zip.finalize()

          archivesFilenames.push(outFileName)
        }

        resolve(archivesFilenames)
      })
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  async unzipDirectory (zipFileName: string, targetDir: string): Promise<boolean> {
    // TODO: discuss this
    // eslint-disable-next-line no-useless-catch
    try {
      const bucketName = process.env.GCP_BUCKET_NAME

      const bucket = this.storage.bucket(bucketName)

      const zip = bucket
        .file(zipFileName)
        .createReadStream()
        .pipe(unzipper.Parse({ forceStream: true }))

      for await (const entry of zip) {
        const file = bucket.file(`${targetDir}/${entry.path}`)
        entry.pipe(file.createWriteStream())
      }

      return true
    } catch (e) {
      throw e
    }
  }

  async cloneDir (sourceDir: string, targetDir: string): Promise<boolean> {
    const bucketName = process.env.GCP_BUCKET_NAME

    const [files] = await this.storage.bucket(bucketName).getFiles({ prefix: sourceDir })

    await Promise.all(files.map(async file => {
      const newFileName = file.name.replace(sourceDir, targetDir)
      file.copy(this.storage.bucket(bucketName).file(newFileName))
    }))

    return true
  }
}

export default GCPStrategy
