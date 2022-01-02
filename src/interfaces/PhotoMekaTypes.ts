import printer from "../modules/Printer"
import path from "path"
import fs from "fs"

export enum EResource {
    EXIF        = "EXIF",
    FILE_NAME   = "FILE_NAME",
    CREATED_AT  = "CREATED_AT",
    USER_INPUT  = "USER_INPUT"
}

export enum ENoInferenceMethod {
    LIVE_QUESTION   = "LIVE_QUESTION",      // 추론 불가가 발견되면 즉시 물어본다
    LAST_QUESTION   = "LAST_QUESTION",      // 추론 불가가 발견되면 모아서 마지막에 물어본다
    IGNORE          = "IGNORE"              // 추론 불가능한 파일은 무시한다.
}

export class PhotoMekaSetting {
    /**
     * 리소스 신뢰 순서
     * 다양한 Parser 에서 응답 했을 때, 신뢰 순서를 기반으로 최종 정한다.
     */
    resourceTrustPriority: EResource[] = [EResource.FILE_NAME, EResource.EXIF, EResource.USER_INPUT, EResource.CREATED_AT]

    resourceTrustPriorityToString(): string {
        return `${this.resourceTrustPriority[0]} > ${this.resourceTrustPriority[1]} > ${this.resourceTrustPriority[2]} > ${this.resourceTrustPriority[3]}`
    }

    resourceTrustPriorityToNumber(resource: EResource) {
        return this.resourceTrustPriority.indexOf(resource)
    }

    /**
     * 추론 불가능한 파일의 처리 방법
     * 파일의 날짜를 추론 할 수 없는 경우, 유저에게 어떻게 질문할지 정한다.
     */
    inferenceFailedMethod: ENoInferenceMethod = ENoInferenceMethod.LAST_QUESTION

    /**
     * 파일의 생성 날짜를 수정합니까?
     */
    alterBTime: boolean = true

    /**
     * 대상 폴더의 절대 경로
     */
    targetPath: string = undefined

    /**
     * 출력 폴더의 절대 경로
     */
    outputPath: string = undefined

    async setup() {
        try {   // 리소스의 순서를 받는다.
            const ans = await printer.question(
                "파일의 날짜를 결정 할 때 신뢰받는 리소스의 순서입니다.", 
                "변경하려면 순서대로 입력하고 그렇지 않으면 Enter: ",
                this.resourceTrustPriorityToString())

            let newResourceTrustPriority = ans.split(" ") as EResource[]
            if(newResourceTrustPriority.length === this.resourceTrustPriority.length) {
                this.resourceTrustPriority = newResourceTrustPriority
            } else {
                throw new Error()
            }
        } catch(ex) {}

        try {   // 추론 불가능한 파일인 경우 질문 방법을 정한다.
            const ans = await printer.question(
                "파일의 날짜를 추론 할 수 없는 경우 처리 방법입니다.",
                "변경하려면 방법을 입력하고 그렇지 않으면 Enter: ",
                `${ENoInferenceMethod.LIVE_QUESTION}: 실시간으로 물어봅니다. ${this.inferenceFailedMethod === ENoInferenceMethod.LIVE_QUESTION ? "*" : ""}
    ${ENoInferenceMethod.LAST_QUESTION}: 마지막에 한번에 물어봅니다. ${this.inferenceFailedMethod === ENoInferenceMethod.LAST_QUESTION ? "*" : ""}
    ${ENoInferenceMethod.IGNORE}: 무시합니다. ${this.inferenceFailedMethod === ENoInferenceMethod.LIVE_QUESTION ? "*" : ""}` 
            )

            let newMethod = ans
            if(newMethod === ENoInferenceMethod.LIVE_QUESTION 
                || newMethod === ENoInferenceMethod.LAST_QUESTION 
                || newMethod === ENoInferenceMethod.IGNORE) {
                this.inferenceFailedMethod = newMethod
            } else {
                throw new Error()
            }
        } catch(ex) {}

        try {   // 파일의 생성날짜 bTime 을 수정할지 물어봅니다.
            const ans = await printer.question(
                "파일의 생성/수정 날짜를 수정할지 결정합니다.",
                "수정하시겠습니까 (Yes/No): ",
                `${this.alterBTime ? "Yes" : "No"}`
            )

            this.alterBTime = ans.toLocaleLowerCase() === "yes"
        } catch(ex) {}

        do {
            const ans = await printer.question(
                "대상 폴더의 위치를 결정합니다. 다중 탐색을 지원합니다.",
                "폴더의 경로를 입력: "
            )
            
            try {
                const newPath = path.resolve(ans)
                fs.accessSync(newPath, fs.constants.X_OK)
                this.targetPath = newPath
            } catch(ex) {
                printer.error(ex.message)
                this.targetPath = undefined
            }
        } while(this.targetPath === undefined)
        
        do {
            const ans = await printer.question(
                "정리 결과를 저장할 폴더의 위치를 결정합니다.",
                "폴더의 경로를 입력: "
            )
            
            try {
                const newPath = path.resolve(ans)
                if(!fs.existsSync(newPath)) {
                    fs.mkdirSync(newPath)
                    printer.log("경로에 폴더가 존재하지 않아 만들었습니다.")
                }
                this.outputPath = newPath
            } catch(ex) {
                printer.error(ex.message)
                this.outputPath = undefined
            }
            
        } while(this.outputPath === undefined)

        try {
            const ans = await printer.question(
                "실행 설정을 마쳤습니다. 검토 하십시오.",
                "탐색하시겠습니까? (Yes/No): ",
                `리소스 신뢰 순서: ${this.resourceTrustPriorityToString()}
    추론 실패 처리 방법: ${this.inferenceFailedMethod}
    bTime 수정 여부: ${this.alterBTime}
    입력 폴더: ${this.targetPath}
    출력 폴더: ${this.outputPath}`
            )

            if(ans.toLocaleLowerCase() !== "yes") {
                printer.log("설정을 초기화 후 다시 진행합니다.")
                this.setup()
            }
        } catch(ex){}
    }
}