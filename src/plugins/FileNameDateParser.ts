import { EResource, PhotoMekaSetting } from "../interfaces/PhotoMekaTypes";
import { IPhotoMekaDateParser, IPhotoMekaDateResponse } from "../interfaces/IPhotoMekaParser";
import ExifReader from 'exifreader';
import path from "path"
import moment from "moment";

class ExifDateParser implements IPhotoMekaDateParser {
    async parser(filePath: string, mekaSettings: PhotoMekaSetting): Promise<IPhotoMekaDateResponse> {
        let filenameOnlyNum = path.basename(filePath).replace(/\D/g,'')
        let resultMoment: moment.Moment = undefined

        // YYYY-MM-DD HH:MM:SS 형태
        if(filenameOnlyNum.length === 14) {
            resultMoment = moment(`${filenameOnlyNum.substr(0, 8)} ${filenameOnlyNum.substr(8, 8)}`)
        }

        // YYYY-MM-DD 형태
        if(filenameOnlyNum.length === 8) {
            resultMoment = moment(filenameOnlyNum)
        }

        if(filenameOnlyNum.length > 14) {
            resultMoment = moment(filenameOnlyNum.substr(0, 14))
        }

        if(resultMoment && resultMoment.isValid()) {
            return {
                source: EResource.FILE_NAME,
                date: resultMoment
            } as IPhotoMekaDateResponse
        } else {
            throw new Error("Parsing from filename failed.")
        }
    }
}

export default ExifDateParser