# Reporta — 프로젝트 현황

> 마지막 업데이트: 2026-04-05
> **CHECKPOINT** — 컨텍스트 초기화 후 이 파일부터 읽을 것

## 현재 상태: MVP 완성 + Enterprise UI 완료 ✅

## 핵심 링크
- **Live URL:** https://reporta-three.vercel.app/
- **GitHub:** https://github.com/javaschang-web/Reporta
- **Supabase:** https://supabase.com/dashboard/project/jsdnlqvanpvwtdxvfzzp
- **Vercel:** https://vercel.com/javaschang-web/reporta
- **Local:** `cd C:\Users\javas\.openclaw\workspace\Reporta && npm run dev`

---

## ✅ 완료된 모든 작업 (2026-04-02 ~ 04-05)

### 기능
- Auth (회원가입/로그인/세션/리다이렉트)
- 파일 업로드 CSV/XLSX → Supabase Storage (Private bucket)
- Excel 리포트 생성 + 다운로드
- Dashboard (업로드 목록 + 리포트 히스토리 + 빈 상태 UI)

### 보안
- Supabase DB RLS 활성화 (data_sources, reports — 본인 row만 접근)
- Storage RLS 활성화 (uploads 버킷 — 본인 폴더만 접근)
- Storage Public → Private 전환
- Public URL → Signed URL (60초 TTL) 방식으로 변경

### UI/UX — Enterprise Dark Theme
- 전체 테마: 다크 네이비 (#0F1A2E) + 앰버/골드 (#D4A843)
- 좌측 사이드바 (Sidebar.tsx 컴포넌트)
- 랜딩페이지, 대시보드, 업로드, 리포트 생성, 로그인, 회원가입 — 모두 통일

### Excel 리포트 템플릿
- Sheet 1 'Cover': REPORTA 헤더(네이비/화이트), 앰버 타이틀 행, 메타데이터, CONFIDENTIAL 표시
- Sheet 2 'Executive Summary': 소스별 요약 테이블, 네이비 헤더, 교차 행 색상, 합계 행
- Sheet 3~N: 데이터 시트, 네이비 헤더, 교차 행 색상, 상단 행 고정, 최대 5000행

### 에러 핸들링
- 업로드: 친절한 에러 메시지 매핑, 재시도 버튼, 파일 크기 힌트, 전체 실패 배너
- 리포트 생성: 403/401 에러 안내, 상태별 컬러 코딩(앰버/파랑/초록/빨강), 에러 복사 버튼

### 배포 이슈 해결 기록
- Next.js 16.2.2 → Vercel 보안 정책으로 빌드 차단
- Next.js 15.5.14 + vercel.json (framework: nextjs 명시)로 해결

---

## 📋 남은 작업 (우선순위 순)

### 🔵 진행 중 — 데이터 레이크하우스 (2026-04-05)
1. **Data Explorer 페이지** — `/datasets` 목록 + `/datasets/:id` 테이블 뷰 구현
2. **n8n 워크플로우 완성** — HTTP Request Body 이슈 해결 후 자동 ingest 완성
3. **리포트 연동** — Data Explorer에서 선택 → 리포트 생성 흐름

### 🟡 베타 단계
4. **AI 분석 요약** — 업로드 데이터 기반 인사이트 자동 생성
   - 결정 필요: OpenAI GPT-4o vs Claude API
   - 구현 위치: reports/new/page.tsx generate() 함수 내 또는 별도 /api/analyze 라우트
2. **커스텀 도메인** — reporta.io 또는 원하는 도메인 Vercel 연결
3. **베타 테스터 모집** — 금융 실무자 5~10명 초기 피드백

### 🟢 중장기
4. PPT/Word 출력 포맷 추가
5. 리포트 템플릿 라이브러리 (자주 쓰는 양식 저장/재사용)
6. 팀 협업 기능 (멀티 유저 워크스페이스)
7. ERP/Bloomberg API 직접 연동
8. 이메일 인증 플로우 (Supabase Auth 이메일 확인 활성화)

---

## 🗃 데이터 레이크하우스 현황 (2026-04-05 추가)
- **n8n:** v2.14.2 로컬 설치 완료 (`localhost:5678`)
- **n8n API Key:** 발급 완료
- **Supabase 신규 테이블:**
  - `datasets` — 데이터셋 카탈로그 (user_id, name, source_type, schema_info, tags, row_count)
  - `dataset_records` — 실제 데이터 (dataset_id, user_id, data JSONB, recorded_at)
  - GIN 인덱스 + RLS 정책 설정 완료
- **샘플 데이터:** Monthly Revenue 2026 Q1 (3행) 삽입 완료
- **n8n 워크플로우:** `8UJ4DYD2sH9ZiNKF` (HTTP Request body 방식 미해결, PowerShell로 직접 삽입으로 우회)

---

## 🏗 기술 스택
- **Framework:** Next.js 15.5.14 (App Router)
- **Styling:** Tailwind CSS v4
- **DB/Auth/Storage:** Supabase
- **Excel:** xlsx (SheetJS)
- **Hosting:** Vercel
- **Repo:** javaschang-web/Reporta (main 브랜치)

## 📁 주요 파일 구조
```
src/
  app/
    page.tsx              # 랜딩페이지
    layout.tsx            # 루트 레이아웃 (Inter 폰트)
    globals.css           # 전역 CSS (Enterprise 테마 변수)
    dashboard/page.tsx    # 대시보드
    upload/page.tsx       # 파일 업로드
    reports/new/page.tsx  # 리포트 생성 (Excel 템플릿 포함)
    auth/
      login/page.tsx      # 로그인
      signup/page.tsx     # 회원가입
  components/
    Sidebar.tsx           # 공통 사이드바
  lib/
    supabase/client.ts    # Supabase 클라이언트
```

## Supabase 설정
- Project ref: jsdnlqvanpvwtdxvfzzp
- Tables: data_sources (id, user_id, name, file_type, file_url=storage_path, created_at)
- Tables: reports (id, user_id, title, format, status, file_url, created_at)
- Storage bucket: uploads (Private) — 경로 형식: {user_id}/{timestamp}-{filename}
- RLS: 모두 활성화, auth.uid() = user_id 정책
- ENV: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
