# Reporta — 프로젝트 현황

> 마지막 업데이트: 2026-04-04

## 현재 상태: MVP 완성 + 배포 완료 + Enterprise UI 적용 ✅

## 핵심 링크
- **Live URL:** https://reporta-three.vercel.app/
- GitHub: https://github.com/javaschang-web/Reporta
- Supabase: https://supabase.com/dashboard/project/jsdnlqvanpvwtdxvfzzp
- Vercel: https://vercel.com/javaschang-web/reporta

## 완료된 기능
- [x] Auth (회원가입/로그인/세션)
- [x] 파일 업로드 (CSV/XLSX → Supabase Storage, Private bucket)
- [x] Excel 리포트 생성 + 다운로드 (Cover/Summary/Data 시트, 네이비 헤더)
- [x] Dashboard (소스 목록 + 리포트 히스토리)
- [x] 랜딩페이지 (한/영 토글, 모바일 반응형)
- [x] GitHub + Vercel 배포 (Next.js 15.5.14)
- [x] Supabase RLS 설정 (DB + Storage 모두 적용)
- [x] Storage Private 전환 + Signed URL 방식 적용
- [x] Enterprise 다크 UI (전 페이지 네이비/앰버 테마 통일)
- [x] Financial Excel 리포트 템플릿 (Cover, Executive Summary, Data sheets)

## 남은 작업 (우선순위 순)

### 🔴 필수 (베타 전)
1. **전체 플로우 E2E 테스트** — 신규 유저 기준 회원가입~리포트 생성 재검증
2. **에러 핸들링 보강** — 업로드 실패/네트워크 오류 시 유저 피드백 개선
3. **Auth 페이지 UI 통일** — 로그인/회원가입 페이지도 Enterprise 테마 적용

### 🟡 베타 단계
4. **AI 분석 요약** — 업로드 데이터 기반 인사이트 자동 생성 (OpenAI/Claude 결정 필요)
5. **커스텀 도메인** — reporta.io 등 연결
6. **베타 테스터 모집** — 금융 실무자 5~10명 초기 피드백

### 🟢 중장기
7. **PPT/Word 출력 포맷** — Excel 외 추가 포맷
8. **리포트 템플릿 라이브러리** — 자주 쓰는 양식 저장/재사용
9. **팀 협업 기능** — 멀티 유저 워크스페이스
10. **ERP/Bloomberg API 직접 연동**
11. **이메일 인증** — Supabase Auth 이메일 확인 플로우 활성화

## Supabase 설정
- Project ref: jsdnlqvanpvwtdxvfzzp
- Storage: uploads (Private bucket) ✅
- Tables: data_sources, reports (RLS 활성화) ✅
- ENV: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY

## Dev 서버 시작
```powershell
cd C:\Users\javas\.openclaw\workspace\Reporta
npm run dev
```
