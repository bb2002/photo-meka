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

        const tags = await ExifReader.load(Buffer.from(filePath))

        let dateTimeString = undefined
        if(tags['DateTimeOriginal']?.description) {
            dateTimeString = tags['DateTimeOriginal']?.description
        } else if(tags['DateTime']?.description) {
            dateTimeString = tags['DateTime']?.description
        } else {
            throw new Error("File not exist EXIF Date")
        }

        console.log(dateTimeString)

        return {
            source: EResource.EXIF,
            date: moment()
        } as IPhotoMekaDateResponse
    }
}

export default ExifDateParser