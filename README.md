🎮 GClip – 게임 하이라이트 공유 SNS

게임 스크린샷·하이라이트를 올리고 공유하는 게임 특화 SNS 서비스입니다.
유저는 자신이 플레이한 게임의 멋진 순간을 업로드하고, 태그·게임·탐색 탭을 통해 다양한 클립을 발견할 수 있습니다.

FE: React + MUI · BE: Node.js(Express) + MySQL · 실시간: socket.io · 외부 API: RAWG

📌 주요 기능
1. 메인 피드

게임별 하이라이트 게시글(이미지/영상) 피드

기능

좋아요 / 북마크 / 공유(링크 복사)

댓글 작성 (기본 댓글, 추후 대댓글/멘션 고도화 예정)

게임 필터 (검색형 드롭다운으로 게임 선택)

정렬/기간 필터 (최신순 등 – 필요에 따라 확장 가능)

UI

인스타그램 스타일 카드 레이아웃

유저 아바타/닉네임, 게임 이름, 업로드 날짜, 좋아요/댓글 수 표시

캡션이 길면 더보기 버튼 → 상세 모달로 이동

2. 게시글 작성(CreatePostDialog)

사이드바의 글 쓰기 버튼 클릭 시 모달로 게시글 작성

기능

게임 선택 (검색 가능한 드롭다운)

캡션 입력

이미지 여러 장 업로드

영상 1개 업로드

캡션에 #태그 입력 시 자동으로 해시태그 추출 & 저장

업로드 후:

메인 피드 갱신

팔로워들에게 새 글 알림 발송

3. 해시태그 시스템

캡션에서 #태그명 자동 파싱

tags 테이블에 태그 upsert

post_tags에 post_id / tag_id 매핑 저장

UI

피드/상세 모달에서 태그 클릭 → TagFeedPage로 이동

TagFeedPage에서 해당 태그의 게시글 목록을 피드 형태로 표시

4. 탐색 탭 (ExplorePage)

왼쪽 사이드바의 탐색 메뉴.

인기 태그

최근 N일 기준으로 가장 많이 사용된 태그 리스트

#태그명 · 게시글 수 형식으로 표시

클릭 시 태그 피드 페이지로 이동

최근 많이 올라오는 게임

최근 N일 기준 게시글 수가 많은 게임

게임 카드에 썸네일 + 이름 + 게시글 수 표시

이 게임 피드 보기 버튼 → 메인 피드로 이동 + 해당 게임 필터 적용

랜덤 추천 클립

랜덤으로 선정된 게시글 썸네일 그리드

클릭 시 게시글 상세 모달 오픈

5. 게임 랭킹 (인기 TOP 10 게임)

GameRankingPage

최근 7일 / 30일 / 전체기간 기준 TOP 10 게임 랭킹

점수 계산

기본: postCount * 1 + totalLikes * 2 + totalComments * 1 (또는 서버에서 제공하는 score 사용)

UI

랭킹 순위, 게임 이름, 게시글수/좋아요/댓글 수

LinearProgress로 비율 시각화

이 게임 피드 보기 버튼 → 메인 피드에서 해당 게임 필터 적용

DB

games (id, name, slug, thumbnail_url, created_at, …)

RAWG API 기반으로 games 테이블 초기 데이터 구성

6. 검색 (SearchResultsPage)

상단 헤더 검색창에서 검색 시 /search?query=...

통합 검색 탭:

유저

클립(게시글)

태그

게임

각 탭별:

유저: 아바타/닉네임/아이디 → 프로필 페이지 이동

클립: 썸네일 카드 → 게시글 상세 모달

태그: 버튼 클릭 시 태그 피드

게임: 버튼 클릭 시 메인 피드에서 해당 게임 필터 적용

사이드바 & 다크모드 모두 적용

7. 유저 프로필 / 마이페이지

/me : 내 프로필 & 내 피드

/users/:id : 다른 유저 프로필 페이지

기능

프로필 이미지 / 닉네임 / 소개 / 통계(게시글/팔로워/팔로잉)

팔로우 / 언팔로우

해당 유저의 게시글을 인스타 그리드 형태로 표시

게시글 클릭 시 상세 모달

프로필 편집 페이지 /me/edit

닉네임, 소개, 프로필 이미지 수정

비밀번호 변경 (현재 비밀번호 확인 후 변경)

8. 실시간 채팅 (ChatPage)

socket.io 기반 실시간 채팅

모드

게임 채팅 (GAME) : 특정 게임 방에 입장해 다수가 함께 채팅

DM : 특정 유저와 1:1 채팅

기능

게임 선택 후 이 게임 채팅방 입장 → 해당 게임 방 join

DM 모드에서 닉네임/아이디 검색 후 상대 선택 → DM 방 join

메시지 실시간 송수신

방별 안읽은 메시지 수 집계

최근 메시지 알림 → “이 방으로 이동” 버튼으로 곧바로 입장

UI

말풍선 좌우 정렬 (내 메시지 / 상대 메시지)

다크/라이트 모드에 맞는 버블/테두리 색

오늘 보낸 메시지는 시간만, 과거 메시지는 날짜+시간 출력

9. 알림 시스템

백엔드에서 게시글/채팅 등 주요 이벤트 발생 시 알림 생성

클라이언트

getNotificationSummary로 unreadTotal & 최근 알림 1개 불러오기

socket.io notify:new 이벤트 수신 → 실시간 배지 갱신

상단 헤더(MainHeader)

종 아이콘에 unreadTotal 뱃지

클릭 시 드롭다운 메뉴로 알림 목록 표시

알림 클릭 시:

채팅 알림 → 채팅 페이지 이동

팔로우한 유저 새 글 → 메인 피드 / 추후 해당 게시글 상세로 확장 가능

markAllNotificationsRead로 모두 읽음 처리

10. 유저 레벨 & 업적 시스템

DB

user_stats : post_count, received_likes, received_comments, exp, level

achievements : 업적 정의(코드, 이름, 설명, 조건 등)

user_achievements : 유저가 달성한 업적 기록

경험치 & 레벨

게시글 작성: +20 EXP (updateOnNewPost)

좋아요 받음: +2 EXP (updateOnReceivedLike)

댓글 받음: +3 EXP (updateOnReceivedComment)

레벨 = FLOOR(exp / 100) + 1

업적

게시글 수, 받은 좋아요/댓글 수, 레벨 등 조건 기반 체크

특정 이벤트(새 글/좋아요/댓글 처리 후) achievementService.checkAndUnlockAll(userId) 호출

UI

MainHeader 오른쪽

아바타 옆에 Lv. N / EXP 수치 + 진행 바 표시

마이페이지

MyStatsPanel에서 상세 스탯 & 해금된 업적 리스트 표시 (구현 방향)

11. 다크 모드

ColorModeContext + MUI Theme 사용

전역 테마

theme.palette.mode에 따라 background / text / 카드 / 검색창 / 채팅 버블 등 색상 자동 조정

토글 위치

왼쪽 사이드바 더보기 → “다크 모드” 항목의 Switch

상태 유지

(선택) localStorage 활용하여 새로고침 시에도 모드 유지하도록 구성 가능

12. 사이드바(Navigation)

좌측 고정 사이드바(SideNav)

메뉴

메인

탐색

인기 TOP 10 게임

실시간 채팅

글 쓰기

프로필

더보기 (계정 설정 / 다크 모드)

로그아웃

각 페이지에서 onMenuClick 콜백을 넘겨 route 이동 & 상태 초기화 처리

🧱 기술 스택
Frontend

React

React Router

Material UI (MUI)

socket.io-client

Context API

AuthContext (로그인 상태, 유저 정보)

ColorModeContext (다크/라이트 모드)

Axios 기반 API 모듈

/src/api/postApi.js

/src/api/gameApi.js

/src/api/searchApi.js

/src/api/notificationApi.js

/src/api/exploreApi.js

/src/api/userApi.js

/src/api/followApi.js

/src/api/ChatApi.js

등

Backend

Node.js / Express

MySQL (mysql2)

socket.io

JWT 인증

폴더 구조 (예시)

controllers/

models/

routes/

services/

middleware/

db.js

server.js

scripts/ (RAWG API를 이용해 games 테이블 채우는 스크립트 등)

Infra / 기타

환경변수 설정 (.env)

공통

PORT

DB

DB_HOST

DB_USER

DB_PASSWORD

DB_NAME

인증

JWT_SECRET

외부 API

RAWG_API_KEY (게임 목록 가져오기)

클라이언트

REACT_APP_API_ORIGIN=http://localhost:3020 (또는 배포 주소)

📁 프로젝트 구조 (요약)
root/
  client/
    src/
      api/
      components/
        layout/
          MainHeader.jsx
          SideNav.jsx
        post/
          CreatePostDialog.jsx
          postDetail.jsx
        stats/
          MyStatsPanel.jsx
      context/
        AuthContext.jsx
        ColorModeContext.jsx
      pages/
        FeedPage.jsx
        ExplorePage.jsx
        GameRankingPage.jsx
        ChatPage.jsx
        SearchResultsPage.jsx
        TagFeedPage.jsx
        MyPage.jsx
        UserProfilePage.jsx
        ProfileEditPage.jsx
      utils/
        url.js
      App.jsx
  server/
    controllers/
      postController.js
      gameController.js
      searchController.js
      tagController.js
      exploreController.js
      userController.js
      followController.js
      notificationController.js
      chatController.js
    models/
      postModel.js
      gameModel.js
      userModel.js
      userStatsModel.js
      ...
    services/
      hashtagService.js
      achievementService.js
      notificationService.js
      ...
    routes/
      posts.js
      games.js
      tags.js
      explore.js
      users.js
      follows.js
      notifications.js
      chat.js
    socket/
      chatSocket.js
      notifySocket.js
    db.js
    server.js
    scripts/
      fetchGamesFromRawg.js


(실제 구조와 파일명은 프로젝트에 맞게 조정)

🚀 실행 방법
1) 서버 (backend)
cd server
npm install

# .env 설정 (DB / JWT / RAWG_API_KEY 등)
# 예: cp .env.example .env 후 수정

npm start   # 혹은 npm run dev 등 실제 스크립트에 맞게 실행


MySQL에 필요한 테이블 스키마/초기 데이터는 DDL 스크립트를 통해 미리 생성

games 테이블은 RAWG API 스크립트로 초기 데이터 주입

예) node scripts/fetchGamesFromRawg.js

2) 클라이언트 (frontend)
cd client
npm install

# .env 설정
# REACT_APP_API_ORIGIN=http://localhost:3020  (백엔드 주소)

npm start


기본 접속: http://localhost:3000

🧪 주요 엔드포인트 예시

실제 라우트 prefix는 프로젝트에 맞게 변경되어 있을 수 있음.

게시글

POST /posts – 새 게시글 작성 (이미지/영상 업로드 + 캡션 + 게임 + 태그)

GET /posts/feed – 메인 피드 (sort/period/gameId 필터)

PATCH /posts/:postId – 게시글 수정 (caption, gameId, 태그 재생성)

DELETE /posts/:postId – 게시글 삭제

좋아요/북마크/댓글

POST /posts/:postId/like

DELETE /posts/:postId/like

POST /posts/:postId/bookmark

DELETE /posts/:postId/bookmark

POST /posts/:postId/comments

태그/탐색

GET /tags/:tagName/posts

GET /explore/summary?days=7&tagsLimit=20&gamesLimit=10&postsLimit=18

게임

GET /games – 게임 목록 (검색/페이지네이션 가능)

GET /games/ranking?days=7 – 인기 TOP 10

유저/팔로우/통계

GET /users/me

PATCH /users/me – 프로필 수정

GET /users/me/stats – 내 레벨/EXP/카운트

POST /users/:id/follow

DELETE /users/:id/follow

알림

GET /notifications/summary

POST /notifications/read-all

채팅(socket.io)

chat:joinGame / chat:joinDm

chat:message

chat:notification

notify:new (알림 소켓)

📈 향후 개선 아이디어

댓글 고도화

대댓글, 댓글 좋아요, 유저 멘션 (@닉네임), 알림 연동

업적 UI 강화

업적 뱃지, 업적 해금 애니메이션, 프로필에 대표 업적 표시

추천 시스템

유저별 선호 게임/태그 기반 개인화 추천 피드

게임 데이터 확장

RAWG API 기반으로 장르/플랫폼 정보까지 보여주기

모바일 최적화

반응형 레이아웃 세밀한 튜닝 및 모바일 전용 UI

📷 스크린샷 (예시)

실제 이미지로 교체해서 사용하세요.

메인 피드
![Main Feed](./docs/images/feed.png)

탐색 탭
![Explore](./docs/images/explore.png)

게임 랭킹
![Ranking](./docs/images/ranking.png)

프로필 / 마이페이지
![Profile](./docs/images/profile.png)
