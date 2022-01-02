import { PhotoMekaSetting, ENoInferenceMethod } from "../interfaces/PhotoMekaTypes"
import { IPhotoMekaDateParser, IPhotoMekaDateResponse } from "../interfaces/IPhotoMekaParser"
import { SUPPORT_EXTENSION } from "./Constants"
import printer from "./Printer"
import fs from "fs"
import path from "path"
import moment from "moment"
import { editBTime, moveFile } from "./PhotoMekaService"

class PhotoMeka {
    parserPlugins: IPhotoMekaDateParser[] = []              // 파서 플러그인 배열
    mekaSettings: PhotoMekaSetting = new PhotoMekaSetting() // 포토메카 셋팅 값
    beforeFiles: string[] = []                              // 정리 전 파일
    inferenceFailFiles: string[] = []                       // 정리 실패 파일

    constructor() {

    }

    /**
     * 날짜 파서를 등록합니다.
     * @param parser    IPhotoMekaDateParser
     */
    applyParser(parser: IPhotoMekaDateParser) {
        this.parserPlugins.push(parser)
    }

    /**
     * 파일을 탐색합니다.
     */
    scanFiles(location: string): Promise<string[]> {
        const getFiles = (dirPath: string, arrOfFiles: string[]) => {
            const files = fs.readdirSync(dirPath)

            files.forEach((file) => {
                if(fs.statSync(path.join(dirPath, "/", file)).isDirectory()) {
                    arrOfFiles = getFiles(path.join(dirPath, "/", file), arrOfFiles)
                } else {
                    const fileFullPath = path.join(dirPath, "/", file)
                    if(SUPPORT_EXTENSION.indexOf(path.extname(fileFullPath).toLowerCase()) != -1) {
                        arrOfFiles.push(fileFullPath)
                    }
                }
            })

            return arrOfFiles
        }

        return new Promise((resolve, reject) => {
            try {
                const files = getFiles(location, [])
                resolve(files)
            } catch(ex) {
                reject(ex)
            }
        })
    }

    /**
     * 플러그인 로드, 설정 검토, 파일 탐색을 한다.
     * 프로세스를 돌릴 준비를 한다.
     */
    async initialize() {
        printer.log("Loading parser plugins...")
        printer.log(`${this.parserPlugins.length} plugin loaded.`)
        printer.log("Starting setup progress...")

        await this.mekaSettings.setup()

        printer.success("Setup completed.")
        printer.log("Scanning target files...")

        try {
            this.beforeFiles = await this.scanFiles(this.mekaSettings.targetPath)
            printer.success(`${this.beforeFiles.length} file scan completed.`)
        } catch(ex) {
            printer.error(`Folder scan failed. Reason: ${ex}`)
        }
    }

    /**
     * 메카 셋팅값을 기반으로 파일 정리를 시작한다.
     */
    async execute() {
        console.log()
        printer.log("Start progress...")

        for(let i = 0; i < this.beforeFiles.length; ++i) {
            let parsedDate: IPhotoMekaDateResponse = undefined

            for(let j = 0; j < this.parserPlugins.length; ++j) {
                try {
                    let newParsedDate = await this.parserPlugins[j].parser(this.beforeFiles[i], this.mekaSettings)

                    if(parsedDate) {
                        if(this.mekaSettings.resourceTrustPriorityToNumber(parsedDate.source) > this.mekaSettings.resourceTrustPriorityToNumber(newParsedDate.source)) {
                            parsedDate = newParsedDate
                        }
                    } else {
                        parsedDate = newParsedDate
                    }
                } catch(ex) {
                    parsedDate = undefined
                }
            }

            if(parsedDate) {
                // 날짜 파싱에 성공한 경우
                if(this.mekaSettings.alterBTime) {
                    editBTime(this.beforeFiles[i], parsedDate.date)
                }

                moveFile(this.beforeFiles[i], parsedDate.date, this.mekaSettings)
                printer.success(`[${i+1}/${this.beforeFiles.length}] ${path.basename(this.beforeFiles[i])} file edited ${parsedDate.date.format("YYYY.MM.DD HH:mm:ss")}`)
            } else {
                // 날짜 파싱에 실패한 경우
                if(this.mekaSettings.inferenceFailedMethod === ENoInferenceMethod.LAST_QUESTION) {
                    this.inferenceFailFiles.push(this.beforeFiles[i])
                    printer.log(`[${i+1}/${this.beforeFiles.length}] parsing failed rejection count: ${this.inferenceFailFiles.length}`)
                }

                if(this.mekaSettings.inferenceFailedMethod === ENoInferenceMethod.LIVE_QUESTION) {
                    this.inferenceFailFiles.push(this.beforeFiles[i])
                    this.resolveInferenceFailedFiles()
                }
            }
        }

        if(this.mekaSettings.inferenceFailedMethod === ENoInferenceMethod.LAST_QUESTION) {
            // 마지막에 추론 실패 파일을 정리한다.
            await this.resolveInferenceFailedFiles()
        }

        printer.success(`파일 정리를 완료했습니다. 총 파일 ${this.beforeFiles.length}개, 수동 추론 ${this.inferenceFailFiles.length} 개`)
    }

    /**
     * 추론 실패한 파일을 정리한다.
     */
    async resolveInferenceFailedFiles() {
        for(let i = 0; i < this.inferenceFailFiles.length; ++i) {
            const ifFile = this.inferenceFailFiles[i]
            let newMoment: moment.Moment = undefined
            do {
                const userInDate = await printer.question(`${path.basename(ifFile)} 파일의 날짜를 추론 할 수 없습니다.`, "날짜를 입력하세요: ", "포맷: YYYY-MM-DD HH:mm:ss")
                newMoment = moment(userInDate)

                if(!newMoment.isValid()) {
                    newMoment = undefined
                    printer.error("날짜 포맷이 일치하지 않습니다. 다시 입력하십시오.")
                }
            } while(newMoment === undefined)
            
            if(this.mekaSettings.alterBTime) {
                editBTime(ifFile, newMoment)
            }
            moveFile(ifFile, newMoment, this.mekaSettings)
        }
    }
}

export default PhotoMeka