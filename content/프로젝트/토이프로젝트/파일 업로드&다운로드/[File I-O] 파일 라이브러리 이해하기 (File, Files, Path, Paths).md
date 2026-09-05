---
title: "[File I/O] 파일 라이브러리 이해하기 (File, Files, Path, Paths)"
tags: [토이프로젝트, 파일 업로드&다운로드]
created: 2026-09-05
modified: 2026-09-05
---

# [File I/O] 파일 라이브러리 이해하기 (File, Files, Path, Paths)

## 구조

| File | Java 17 기준 | Paths | Path | Files |
| --- | --- | --- | --- | --- |
| 파일 관련 라이브러리 | <- 이전 이후-> | Path의 유틸리티 라이브러리 | 파일 경로 인터페이스 | 파일관련 라이브러리 |
| 파일 생성,삭제,수정 가능 | <- 이전 이후-> | get() 메서드를 이용하여 경로 생성 | 상대경로, 절대경로, 경로 결합 등 손쉽게 이용 | 기존 File에서 제공되는 유틸 메서드 제공 |
| 파일 심볼링 링크 및 고급기능 제한 | <- 이전 이후-> |  | 기존 File객체와 호환 가능 ( toFile(), toPath() ) | 추가적인 File관련 유틸 메서드 제공 (파일트리순회, 심볼릭 링크, 고급 기능 가능) |
| 예외처리 미흡 | <- 이전 이후-> |  |  | 예외처리 강화 (IoException) |
|  | <- 이전 이후-> |  |  | watch Service(디렉터리 변경 감시를 이용하여 이벤트 처리 가능) |
|  | <- 이전 이후-> | * 해당 Paths, Path, Files를 NIO(New I/O) API라고 불리움 | * 해당 Paths, Path, Files를 NIO(New I/O) API라고 불리움 | * 해당 Paths, Path, Files를 NIO(New I/O) API라고 불리움 |

## File (java.io)

*   인스턴스 메서드 제공
*    java 17 이전부터 존재하던 File I/O 라이브러리
*   Path와의 연동보다는 File자체적으로 사용되었음

```bash
//주요 메서드

//1. 파일 또는 디렉터리 상태 확인
exists(), isFile(), isDirectory()

//2. 파일 목록 조회
list(), listFiles()

//3. 파일 생성
createNewFile() //이미 존재하면 false 반환

//4. 디렉터리 생성
mkdir(), mkdirs()

//5. 파일 또는 디렉터리 삭제
delete()

//6. 파일 또는 디렉터리 이름 변경
renameTo(File dest)
```

[https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/io/File.html](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/io/File.html)

 [File (Java SE 17 & JDK 17)

All Implemented Interfaces: Serializable, Comparable An abstract representation of file and directory pathnames. User interfaces and operating systems use system-dependent pathname strings to name files and directories. This class presents an abstract, sys

docs.oracle.com](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/io/File.html)

## Files (java.nio)

*   파일관려 정적 메서드 및 인스턴스 메서드 제공
*   파일의 생성, 수정, 삭제, 이동 등 메서드 지원
*   Path와의 연동으로 많이 사용

```bash
//1. 파일/디렉터리 생성 및 삭제
createFile(Path path), createDirectory(Path dir), createDirectories(Path dir)
delete(Path path), deleteIfExists(Path path)

//2. 파일 복사 및 이동
copy(Path source, Path target, CopyOption... options)
move(Path source, Path target, CopyOption... options)

//3. 파일 읽기/쓰기
readAllBytes(Path path) // 파일 내용을 바이트 배열로 읽기
readAllLines(Path path) // 파일 내용을 문자열 리스트로 읽기
write(Path path, byte[] bytes, OpenOption... options) // 바이트 배열을 파일에 쓰기
write(Path path, Iterable<? extends CharSequence> lines, Charset cs, OpenOption... options) // 문자열 리스트를 파일에 쓰기

//4. 스트림 제공
newBufferedReader(Path path, Charset cs)
newBufferedWriter(Path path, Charset cs, OpenOption... options)

//5. 기타 유용한 메서드:
exists(Path path, LinkOption... options) // 경로 존재 여부 확인
isReadable(Path path), isWritable(Path path) // 읽기/쓰기 가능 여부 체크
walk(Path start, FileVisitOption... options) // 파일 트리 순회
```

[https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/nio/file/Files.html](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/nio/file/Files.html)

 [Files (Java SE 17 & JDK 17)

public final class Files extends Object This class consists exclusively of static methods that operate on files, directories, or other types of files. In most cases, the methods defined here will delegate to the associated file system provider to perform t

docs.oracle.com](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/nio/file/Files.html)

## Path (java.nio)

*   파일의 경로를 반환
*   파일의 경로(상대경로, 절대경로)를 유연하게 사용하게 하기 위한 라이브러리 (File과 상호 연동 가능)
*   **Paths 유틸리티를 사용하여 Path를 간편하게 생성 및 사용 가능**

```bash
// Paths 사용 (Path 유틸리티)
Path path = Paths.get("src", "main", "resources", "file.txt");

//Path

//1. 파일 이름 추출
getFileName()

//2. 상위 디렉토리 경로 반환
getParent()

//3. 상대경로 결합 (현재 경로 기준)
resolve(String other)

//4. 불필요한 경로 요소 제거
normalize()

//5. 절대 경로 변환
toAbsolutePath()
```

[https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/nio/file/Path.html](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/nio/file/Path.html)

 [Path (Java SE 17 & JDK 17)

All Superinterfaces: Comparable , Iterable , Watchable An object that may be used to locate a file in a file system. It will typically represent a system dependent file path. A Path represents a path that is hierarchical and composed of a sequence of direc

docs.oracle.com](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/nio/file/Path.html)

[https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/nio/file/Paths.html](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/nio/file/Paths.html)

 [Paths (Java SE 17 & JDK 17)

public final class Paths extends Object This class consists exclusively of static methods that return a Path by converting a path string or URI. API Note: It is recommended to obtain a Path via the Path.of methods instead of via the get methods defined in

docs.oracle.com](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/nio/file/Paths.html)

## 결론

*   요구사항에 맞춰서 간단한 File I/O를 처리할시, java.io.File을 이용, 그 외에 복잡할경우 NIO 고려
*   Path와 Files를 이용한 파일 관리 (생성, 삭제, 이동, 경로탐색 등)를 유용하게 가능
*   자세한 사용법 및 튜토리얼은 하위 공식문서 참고

[https://docs.oracle.com/javase/tutorial/essential/io/](https://docs.oracle.com/javase/tutorial/essential/io/)

 [Lesson: Basic I/O (The Java™ Tutorials > Essential Java Classes)

The Java Tutorials have been written for JDK 8. Examples and practices described in this page don't take advantage of improvements introduced in later releases and might use technology no longer available. See Dev.java for updated tutorials taking advantag

docs.oracle.com](https://docs.oracle.com/javase/tutorial/essential/io/)
