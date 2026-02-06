# File Server REST API

파일 업로드/다운로드를 위한 간단한 REST API 서버

## 서버 실행

```bash
docker-compose up --build -d
```

## API 엔드포인트

### 1. 파일 업로드

**POST** `/upload`

#### 바이너리 파일 업로드

```bash
curl -X POST -F "file=@/path/to/file.jpg" http://hongyver.iptime.org:3090/upload
```

#### URL로 파일 업로드

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/image.jpg"}' \
  http://hongyver.iptime.org:3090/upload
```

#### 응답

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "originalFilename": "image.jpg",
  "savedFilename": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
  "size": 123456,
  "downloadUrl": "http://hongyver.iptime.org:3090/files/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
  "viewUrl": "http://hongyver.iptime.org:3090/view/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg"
}
```

#### 에러 응답

```json
{
  "success": false,
  "error": "No file or URL provided"
}
```

---

### 2. 파일 다운로드

**GET** `/files/:filename`

브라우저에서 파일을 다운로드합니다.

```bash
curl http://hongyver.iptime.org:3090/files/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg -o downloaded.jpg
```

#### 에러 응답

```json
{
  "error": "File not found"
}
```

---

### 3. 파일 보기 (인라인)

**GET** `/view/:filename`

브라우저에서 파일을 직접 출력합니다 (이미지, PDF 등).

```
http://hongyver.iptime.org:3090/view/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg
```

#### 에러 응답

```json
{
  "error": "File not found"
}
```

---

## 파일 저장 위치

업로드된 파일은 `./files/` 폴더에 저장되며, Docker 볼륨으로 마운트되어 로컬에서 직접 접근 가능합니다.

## Docker 명령어

```bash
# 서버 시작
docker-compose up --build -d

# 서버 중지
docker-compose down

# 로그 확인
docker-compose logs -f

# 컨테이너 쉘 접근
docker-compose exec fileserver sh
```
