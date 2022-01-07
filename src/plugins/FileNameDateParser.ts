import { EResource, PhotoMekaSetting } from "../interfaces/PhotoMekaTypes";
import { IPhotoMekaDateParser, IPhotoMekaDateResponse } from "../interfaces/IPhotoMekaParser";
import path from "path"
import moment from "moment";

class ExifDateParser implements IPhotoMekaDateParser {
    checkIsValidMoment(resultMoment: moment.Moment) {
        return resultMoment.isValid()
    }

    async parser(filePath: string, mekaSettings: PhotoMekaSetting): Promise<IPhotoMekaDateResponse> {
        let filenameOnlyNum = path.basename(filePath).replace(/\D/g,'')
        let response = {
            source: EResource.FILE_NAME,
            date: undefined
        } as IPhotoMekaDateResponse

        // YYYY-MM-DD HH:MM:SS 형태
        if(filenameOnlyNum.length >= 14) {
            response.date = moment(`${filenameOnlyNum.substr(0, 8)} ${filenameOnlyNum.substr(8, 6)}`)
            if(this.checkIsValidMoment(response.date)) return response
        }

        // Timestamp 형태
        if(filenameOnlyNum.length === 13) {
            response.date = moment(Number(filenameOnlyNum))
            console.log(response.date.format("YYYY-MM-DD HH:mm:ss"))
            if(this.checkIsValidMoment(response.date)) return response
        }

        // YYYY-MM-DD 형태
        if(filenameOnlyNum.length === 8) {
            response.date = moment(`${filenameOnlyNum.substr(0, 8)}`)
            if(this.checkIsValidMoment(response.date)) return response
        }

        throw new Error("Parsing from filename failed.")
    }
}

export default ExifDateParser