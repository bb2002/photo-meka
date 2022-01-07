import moment from "moment";
import fs from "fs"
import path from "path"
import { PhotoMekaSetting } from "../interfaces/PhotoMekaTypes";
import { utimes } from "utimes";

export function moveFile(targetFile: string, date: moment.Moment, mekaSettings: PhotoMekaSetting) {
    const newPath = path.join(mekaSettings.outputPath, date.format("YYYY. MM"))

    if(!fs.existsSync(newPath)) {
        fs.mkdirSync(newPath, { recursive: true })       // 폴더가 없다면 새로 만듭니다.
    }

    fs.renameSync(targetFile, path.join(newPath, path.basename(targetFile)))
}

export async function editBTime(targetFile: string, date: moment.Moment) {
    if(fs.existsSync(targetFile)) {
        await utimes(targetFile, {
            btime: date.valueOf(),
            mtime: date.valueOf()
        })
    }
}