import { EResource, PhotoMekaSetting } from "../interfaces/PhotoMekaTypes";
import { IPhotoMekaDateParser, IPhotoMekaDateResponse } from "../interfaces/IPhotoMekaParser";
import ExifReader from 'exifreader';
import path from "path"
import moment from "moment";

class ExifDateParser implements IPhotoMekaDateParser {
    async parser(filePath: string, mekaSettings: PhotoMekaSetting): Promise<IPhotoMekaDateResponse> {
        const extName = path.extname(filePath)

        if(extName !== ".jpg" && extName !== ".jpeg") {
            throw new Error("File extension not supported.");
        }

        const tags = await ExifReader.load(filePath as any)

        console.log(tags)

        let dateTimeString = undefined
        if(tags['DateTimeOriginal']?.description) {
            dateTimeString = tags['DateTimeOriginal']?.description
        } else if(tags['DateTime']?.description) {
            console.log("tags['DateTime']?.description", tags['DateTime']?.description)
            dateTimeString = tags['DateTime']?.description
        } else {
            throw new Error("File not exist EXIF Date")
        }

        dateTimeString = dateTimeString.replace(/:/gi,"")
        dateTimeString = dateTimeString.replace(/ /gi,"")
        let newMoment = moment(`${dateTimeString.substr(0, 8)} ${dateTimeString.substr(8, 6)}`)

        if(newMoment.isValid()) {
            return {
                source: EResource.EXIF,
                date: newMoment
            } as IPhotoMekaDateResponse
        } else {
            throw new Error("EXIF Date parsing failed.")
        }
    }
}

export default ExifDateParser