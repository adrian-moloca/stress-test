import Strategy from './Strategy'
import * as fs from 'fs'
import * as archiver from 'archiver'
import * as unzipper from 'unzipper'
import * as fsExtra from 'fs-extra'
import { generatePDFArchivesFilename, tPDFGenerationStats } from '@smambu/lib.constantsjs'
const path = require('node:path')

/* global Express */
class FilesystemStrategy implements Strategy {
  async upload (file: Express.Multer.File, fileName: string): Promise<string> {
    const index = fileName.lastIndexOf('/')
    let directory = process.env.BUCKET_FILESYSTEM_FOLDER
    if (index > -1)
      directory = `${directory}/${fileName.substring(0, index)}`

    if (!fs.existsSync(directory))
      fs.mkdirSync(directory, {
        recursive: true,
      })

    fs.writeFile(
      `${process.env.BUCKET_FILESYSTEM_FOLDER}/${fileName}`,
      Buffer.from(file.buffer),
      err => {
        console.error(err)
        if (err) throw new Error('uploading_error')
      },
    )
    return fileName
  }

  async uploadBase64 (fileEncoded: string, fileName: string): Promise<string> {
    const index = fileName.lastIndexOf('/')
    let directory = process.env.BUCKET_FILESYSTEM_FOLDER
    if (index > -1)
      directory = `${directory}/${fileName.substring(0, index)}`

    if (!fs.existsSync(directory))
      fs.mkdirSync(directory, {
        recursive: true,
      })

    fs.writeFile(
      `${process.env.BUCKET_FILESYSTEM_FOLDER}/${fileName}`,
      Buffer.from(fileEncoded, 'base64'),
      err => {
        console.error(err)
        if (err) throw new Error('uploading_error')
      },
    )
    return fileName
  }

  async get (id: string): Promise<Buffer> {
    try {
      const buffer = fs.readFileSync(
        `${process.env.BUCKET_FILESYSTEM_FOLDER}/${id}`,
      )

      return buffer
    } catch (e) {
      console.error(e)
      throw new Error('get_file_error')
    }
  }

  async delete (id: string): Promise<void> {
    try {
      if (!fs.existsSync(`${process.env.BUCKET_FILESYSTEM_FOLDER}/${id}`)) return

      fs.unlinkSync(`${process.env.BUCKET_FILESYSTEM_FOLDER}/${id}`)
    } catch (e) {
      console.error(e)
      throw new Error('delete_file_error')
    }
  }

  async deleteDirectory (targetDir: string): Promise<void> {
    try {
      const mainFolder = process.env.BUCKET_FILESYSTEM_FOLDER
      const targetFolder = `${mainFolder}/${targetDir}`
      if (!fs.existsSync(targetFolder)) return

      fs.rmdirSync(targetFolder, {
        recursive: true,
      })
    } catch (e) {
      console.error(e)
      throw new Error('delete_directory_error')
    }
  }

  async zipDirectory (sourceDir: string, targetDir: string): Promise<string> {
    const mainFolder = process.env.BUCKET_FILESYSTEM_FOLDER
    const sourceFolder = `${mainFolder}/${sourceDir}`
    const lastDirectory = sourceDir.split('/').pop()

    const fileName = `${targetDir}/${lastDirectory}.zip`

    const index = fileName.lastIndexOf('/')
    let directory = `${mainFolder}/${fileName.substring(0, index)}`

    if (!fs.existsSync(directory))
      fs.mkdirSync(directory, {
        recursive: true,
      })

    return new Promise((resolve, reject) => {
      const zip = archiver('zip', { zlib: { level: 9 } })

      const output = fs.createWriteStream(`${mainFolder}/${fileName}`)

      output.on('close', function () {
        resolve(fileName)
      })

      output.on('end', function () {
        resolve(fileName)
      })

      zip.on('error', function (err) {
        console.error(err)
        reject(err)
      })

      zip.pipe(output)

      zip.directory(sourceFolder, '')

      zip.finalize()
    })
  }

  async zipPDFArchive (sourceFiles: string[],
    maxArchiveSize: number,
    maxFilesPerArchive: number,
    translateFun: (label: string, props?: Record<string, string>) => string)
    : Promise<string[]> {
    try {
      const mainFolder = process.env.BUCKET_FILESYSTEM_FOLDER
      const archiveExportFolder = process.env.PDF_ARCHIVES_FOLDER

      // this is necessary to avoid errors, the (current) zip library cannot
      // create all the "intermediate" dirs by itself
      const outputFolder = `${mainFolder}/${archiveExportFolder}`
      if (!fs.existsSync(outputFolder))
        fs.mkdirSync(outputFolder, {
          recursive: true,
        })

      const statsPromises = sourceFiles.map(current => {
        return new Promise<tPDFGenerationStats>((resolve, reject) => {
          const currentFilename = `${mainFolder}/${current}`

          fs.stat(currentFilename, (err, stat) => {
            if (err) {
              reject(err)
              return
            }

            const returnObj = { filename: currentFilename, size: stat.size }
            resolve(returnObj)
          })
        })
      })

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
          const baseFilename = path.basename(current.filename)
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
          const outFileName = `${outputFolder}/${archiveFileName}`

          const output = fs.createWriteStream(outFileName)
          const zip = archiver('zip', { zlib: { level: 9 } })

          for (const currentFile of currentArchive) {
            const tmpStream = fs.createReadStream(currentFile)
            const baseFilename = path.basename(currentFile)

            zip.append(tmpStream, { name: baseFilename })
          }

          zip.on('error', function (err) {
            console.error(err)

            reject(err)
          })

          zip.pipe(output)

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

  async unzipDirectory (zipFileId: string, targetDir: string): Promise<boolean> {
    const mainFolder = process.env.BUCKET_FILESYSTEM_FOLDER
    const filename = `${mainFolder}/${zipFileId}`
    const unzipDir = `${mainFolder}/${targetDir}`

    const zip = fs.createReadStream(filename)
      .pipe(unzipper.Parse({ forceStream: true }))

    for await (const entry of zip) {
      const fileId = `${unzipDir}/${entry.path}`
      const index = fileId.lastIndexOf('/')
      let directory = fileId.substring(0, index)
      if (!fs.existsSync(directory))
        fs.mkdirSync(directory, {
          recursive: true,
        })

      entry.pipe(fs.createWriteStream(fileId))
    }

    return true
  }

  async cloneDir (sourceDir: string, targetDir: string) {
    const mainFolder = process.env.BUCKET_FILESYSTEM_FOLDER
    const sourceFolder = `${mainFolder}/${sourceDir}`
    const targetFolder = `${mainFolder}/${targetDir}`

    fsExtra.copySync(sourceFolder, targetFolder, { overwrite: false })

    return true
  }
}

export default FilesystemStrategy
