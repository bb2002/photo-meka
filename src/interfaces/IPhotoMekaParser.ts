import moment from "moment";
import { EResource, PhotoMekaSetting } from "./PhotoMekaTypes";

export interface IPhotoMekaDateParser {
    parser(filePath: string, mekaSettings: PhotoMekaSetting): Promise<IPhotoMekaDateResponse>
}

export interface IPhotoMekaDateResponse {
    source: EResource               // 날짜를 어디서 파싱 해 왔습니까?
    date: moment.Moment             // 날짜 데이터
}