import PhotoMeka from "./modules/PhotoMeka"
import ExifDateParser from "./plugins/ExifDateParser"
import FileNameDateParser from "./plugins/FileNameDateParser"

async function bootstrap() {
    const photoMeka: PhotoMeka = new PhotoMeka()

    /**
     * 날짜 데이터 Parser 를 설치하는 방법
     * IPhotoMekaDateParser 를 구현한 클래스 생성하여 applyParser() 에 등록합니다.
     */
    photoMeka.applyParser(new ExifDateParser())
    photoMeka.applyParser(new FileNameDateParser())
    
    // 포토메카 초기화
    await photoMeka.initialize()

    // 실행
    await photoMeka.execute()
}

bootstrap()