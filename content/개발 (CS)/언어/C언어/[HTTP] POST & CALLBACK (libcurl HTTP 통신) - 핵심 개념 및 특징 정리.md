---
title: "POST & CALLBACK (libcurl HTTP 통신)"
tags: [학습, 개발-CS, 언어, C언어, 개발, HTTP, libcurl]
created: 2026-09-05
modified: 2026-09-05
---

# POST & CALLBACK (libcurl HTTP 통신)

> [!NOTE]
> libcurl을 이용한 HTTP POST + 콜백 처리 예제 코드와 curlopt/curl_formadd 옵션 정리.

## 🖥️ 시스템/환경
- 라이브러리: libcurl
- 참고: [libcurl 사용법](https://www.skyer9.pe.kr/wordpress/?p=4629)

## 📋 작업 내역

### POST & CALLBACK 예제 코드
```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <curl/curl.h>

struct MemoryStruct {
    char *memory;
    size_t size;
};

size_t write_to_memory_callback(void *buffer, size_t size, size_t nmemb, void *userp) {

    size_t realsize = size * nmemb;
    struct MemoryStruct *mem = (struct MemoryStruct *) userp;
    char *ptr = (char *) realloc(mem->memory, mem->size + realsize + 1);

    if(!ptr) {
        printf("not enough memory (realloc returned NULL)\n");
        return 0;
    }

    mem->memory = ptr;
    memcpy(&(mem->memory[mem->size]), buffer, realsize);
    mem->size += realsize;
    mem->memory[mem->size] = 0;

    return realsize;
}

int main() {

    char *url_post = "https://example.com/";

    CURL *curl;
    CURLcode res;
    curl = curl_easy_init();

    struct curl_slist *list = NULL;

    // =========================================
    // METHOD : POST & CALLBACK
    if(curl) {

        list = NULL;

        struct MemoryStruct chunk;
        chunk.memory = (char *) malloc(1);
        chunk.size = 0;

        // URL
        curl_easy_setopt(curl, CURLOPT_URL, url_post);

        // METHOD
        curl_easy_setopt(curl, CURLOPT_POST, 1L);

        // HEADERS
        list = curl_slist_append(list, "Content-Type: application/json");
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, list);

        // SSL
        curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 1L);
        curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 1L);

        // DATA
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, "data");

        // CALLBACK
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_to_memory_callback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *) &chunk);

        // EXECUTE
        res = curl_easy_perform(curl);

        curl_easy_cleanup(curl);

        if (chunk.size > 0) {
            printf("response : %s", chunk.memory);
        }
        free(chunk.memory);
    }
}
```

### curlopt 옵션
참고: [curl - setopt 종류](https://redstory2010.tistory.com/150)

- `CURLOPT_ERRORBUFFER` — char* 형태로 에러값 저장하는 버퍼
- `CURLOPT_FOLLOWLOCATION` — 리다이렉션을 따르도록 curl에게 지시
- `CURLOPT_COOKIEFILE` — 쿠키를 저장할 파일 이름(덤프). `curl_easy_setopt(curl, CURLOPT_COOKIEFILE, "");` → 따로 저장 안 함
- `CURLOPT_CONNECTTIMEOUT` — 연결 시도를 기다리는 유지 초
- `CURLOPT_TIMEOUT` — curl 함수를 실행하는 데 걸린 시간 최대값
- `CURLOPT_HTTPHEADER` — 설정 http 헤더의 배열
- `CURLOPT_POST` — http POST 실행
- `CURLOPT_HTTPPOST`
- `CURLOPT_SSLVERSION` — 사용할 수 있는 ssl 버전
- `CURLOPT_POSTFIELDS` — http "POST"로 보내는 모든 데이터
- `CURLOPT_WRITEFUNCTION` — 두 개의 인수 사용(첫 번째: curl 리소스, 두 번째: 문자열) ⇒ 정확한 바이트 수를 반환해야 함수 실패가 안 남
- `CURLOPT_WRITEDATA` — callback 저장할 변수 지정
- `CURLOPT_URL` — 검색 URL. `curl_init()` 세션을 초기화할 때 지정 가능
- `CURLOPT_SSL_VERIFYPEER` — 서버 인증서(SSL) 유효 검사(false → 유효성 검사 안 함 // `CURLOPT_SSL_VERIFYHOST` 값도 변경 필요)
- `CURLOPT_SSL_VERIFYHOST` — 1인 경우: peer 인증서의 일반이름이 있는지 여부 확인 / 2인 경우: 이름이 호스트이름과 일치하는지 추가 확인

### curl_formadd
- multipart/form-data POST(예: xml 수집파일 전송)를 만들 때 사용하는 API.
- 주요 옵션(원문 그대로 보존):

```text
CURLFORM_COPYNAME
              followed  by  a  string  which  provides  thename of this part. libcurl copies the
              string so your application does not need to keep  it  around  after  this  function
              call.   If   the  name  is  not  NUL-terminated,  you  must  set  its  length  with
CURLFORM_NAMELENGTH. Thename is not allowed  to  contain  zero-valued  bytes.  The
              copied data will be freed bycurl_formfree(3).
```

```text
CURLFORM_PTRNAME
              followed  by  a  string  which provides thename of this part. libcurl will use the
              pointer and refer to the data in your application, so you must make sure it remains
              until  curl no longer needs it. If the name is not NUL-terminated, you must set its
              length withCURLFORM_NAMELENGTH.  Thename is not allowed  to  contain  zero-valued
              bytes.
```

```text
CURLFORM_COPYCONTENTS
              followed  by  a pointer to the contents of this part, the actual data to send away.
              libcurl copies the provided data, so your application does  not  need  to  keep  it
              around  after  this  function  call.  If the data is not null terminated, or if you
              would like it to contain zero bytes, you must set  the  length  of  the  name  with
CURLFORM_CONTENTSLENGTH. The copied data will be freed bycurl_formfree(3).
```

```text
CURLFORM_PTRCONTENTS
              followed  by  a pointer to the contents of this part, the actual data to send away.
              libcurl will use the pointer and refer to the data in your application, so you must
              make  sure  it  remains  until  curl  no  longer needs it.  If the data is not NUL-
              terminated, or if you would like it to contain zero bytes, you must set its  length
              withCURLFORM_CONTENTSLENGTH.
```

```text
CURLFORM_CONTENTLEN
              followed  by  a  curl_off_t  value giving the length of the contents. Note that for
CURLFORM_STREAM contents, this option is mandatory.

              If you pass a 0 (zero) for this option, libcurl will instead do a strlen()  on  the
              contents  to  figure  out  the size. If you really want to send a zero byte content
              then you must make sure strlen() on the data pointer returns zero.

              (Option added in 7.46.0)
```

```text
CURLFORM_CONTENTSLENGTH
              (This option is deprecated. UseCURLFORM_CONTENTLEN instead!)

              followed by a long giving the length of the contents. Note that forCURLFORM_STREAM
              contents, this option is mandatory.

              If  you  pass a 0 (zero) for this option, libcurl will instead do a strlen() on the
              contents to figure out the size. If you really want to send  a  zero  byte  content
              then you must make sure strlen() on the data pointer returns zero.
```

```text
CURLFORM_FILECONTENT
              followed  by  a filename, causes that file to be read and its contents used as data
              in this part. This part doesnot automatically become a  file  upload  part  simply
              because its data was read from a file.

              The specified file needs to kept around until the associated transfer is done.
```

```text
CURLFORM_FILE
              followed  by  a  filename, makes this part a file upload part. It sets thefilename
              field to the basename of the provided filename, it reads the contents of  the  file
              and  passes  them  as data and sets the content-type if the given file match one of
              the internally known file extensions. ForCURLFORM_FILE the user may  send  one  or
              more  files in one part by providing multipleCURLFORM_FILE arguments each followed
              by the filename (and eachCURLFORM_FILE is allowed to have aCURLFORM_CONTENTTYPE).

              The given upload file has to exist in its full in the file system already when  the
              upload starts, as libcurl needs to read the correct file size beforehand.

              The specified file needs to kept around until the associated transfer is done
```

```text
CURLFORM_CONTENTTYPE
              is  used in combination withCURLFORM_FILE. Followed by a pointer to a string which
              provides the content-type for this part, possibly instead of an  internally  chosen
              one.
```

```text
CURLFORM_FILENAME
              is  used  in  combination withCURLFORM_FILE. Followed by a pointer to a string, it
              tells libcurl to use the given string as thefilename  in  the  file  upload  part
              instead of the actual file name.
```

```text
CURLFORM_BUFFER
              is used for custom file upload parts without use ofCURLFORM_FILE. It tells libcurl
              that the file contents are already present in a buffer. The parameter is  a  string
              which provides thefilename field in the content header.
```

```text
CURLFORM_BUFFERPTR
              is  used  in  combination  withCURLFORM_BUFFER. The parameter is a pointer to the
              buffer  to  be  uploaded.   This   buffer   must   not   be   freed   until   after
curl_easy_cleanup(3)  is called. You must also useCURLFORM_BUFFERLENGTH to set the
              number of bytes in the buffer.
```

```text
CURLFORM_BUFFERLENGTH
              is used in combination withCURLFORM_BUFFER. The parameter is a  long  which  gives
              the length of the buffer.
```

```text
CURLFORM_STREAM
              Tells  libcurl  to  use  theCURLOPT_READFUNCTION(3)  callback  to  get  data. The
              parameter you pass toCURLFORM_STREAM  is  the  pointer  passed  on  to  the  read
              callback's  fourth  argument.  If you want the part to look like a file upload one,
              set theCURLFORM_FILENAME parameter as well. Note that when usingCURLFORM_STREAM,
CURLFORM_CONTENTSLENGTH must also be set with the total expected length of the part
              unless the formpost is sent chunked encoded. (Option added in libcurl 7.18.2)
```

```text
CURLFORM_ARRAY
              Another possibility to send options to curl_formadd() is theCURLFORM_ARRAY option,
              that  passes  a  struct  curl_forms  array  pointer  as  its value. Each curl_forms
              structure element has a CURLformoption and a char pointer. The final element in the
              array must be a CURLFORM_END. All available options can be used in an array, except
              the CURLFORM_ARRAY option itself. The last argument in such an array must always be
CURLFORM_END.
```

```text
CURLFORM_CONTENTHEADER
              specifies extra headers for the form POST section. This takes a curl_slist prepared
              in the usual way usingcurl_slist_append and appends the list of headers  to  those
              libcurl  automatically generates. The list must exist while the POST occurs, if you
              free it before the post completes you may experience problems.

              When you have  passed  the  HttpPost  pointer  tocurl_easy_setopt(3)  (using  the
CURLOPT_HTTPPOST(3) option), you must not free the list until after you have called
curl_easy_cleanup(3) for the curl handle.

              See example below.
```

- 참고: [Ubuntu Manpage: curl_formadd - add a section to a multipart/formdata HTTP POST](https://manpages.ubuntu.com/manpages/jammy/man3/curl_formadd.3.html)

## 🔗 참고
- 소켓 레벨 통신 기초는 [(TCP_IP) Socket 통신 - 핵심 개념 및 특징 정리]([TCP_IP]%20Socket%20통신%20-%20핵심%20개념%20및%20특징%20정리.md) 문서 참고.
