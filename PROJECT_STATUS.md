# Reporta — 프로젝트 현황

> 마지막 업데이트: 2026-04-03

## 현재 상태: MVP 완성 + Vercel 배포 완료 ✅

## 빠른 재시작 가이드

### Dev 서버 시작
```powershell
cd C:\Users\javas\.openclaw\workspace\Reporta
npm run dev
# 접속: http://localhost:3000
```

### 핵심 링크
- **Live URL:** https://reporta-three.vercel.app/
- GitHub: https://github.com/javaschang-web/Reporta
- Supabase: https://supabase.com/dashboard/project/jsdnlqvanpvwtdxvfzzp
- Vercel: https://vercel.com/javaschang-web/reporta

## 완료된 기능
- [x] Auth (회원가입/로그인/세션)
- [x] 파일 업로드 (CSV/XLSX → Supabase Storage)
- [x] Excel 리포트 생성 + 다운로드
- [x] Dashboard (소스 목록 + 리포트 히스토리)
- [x] 랜딩페이지 (한/영, 다크/라이트, 모바일 반응형)
- [x] GitHub push 완료
- [x] Vercel 배포 완료 (https://reporta-three.vercel.app/)

## 배포 이슈 해결 기록 (2026-04-03)
- **증상:** Vercel 배포 후 404 NOT_FOUND (Vercel 자체 에러)
- **원인 1:** Next.js 16.2.2 → Vercel 보안 정책으로 빌드 차단
- **원인 2:** Next.js 15.3.0 → 동일하게 취약 버전으로 차단
- **해결:** Next.js 15.5.14로 업그레이드 + vercel.json 추가 (framework: nextjs 명시)

## Supabase 설정 요약
- Project ref: jsdnlqvanpvwtdxvfzzp
- Storage: uploads (public bucket)
- Tables: data_sources, reports (RLS disabled - DEV 상태)
- ENV: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY

## 다음 할 일 (우선순위 순)

### 🔴 필수 (운영 전 반드시)
1. **Supabase RLS 정책 설정** — 현재 disabled 상태. 인증된 유저만 자신의 데이터에 접근하도록 설정 필요
2. **실 사용 테스트** — 회원가입 → 파일 업로드 → 리포트 생성 전체 플로우 검증
3. **에러 핸들링 보강** — 업로드 실패/네트워크 오류 시 유저 피드백 개선

### 🟡 단기 (베타 전)
4. **AI 분석 요약 추가** — OpenAI/Gemini/Claude 중 결정 후 데이터 인사이트 자동 생성
5. **커스텀 도메인 연결** — reporta.io 또는 원하는 도메인
6. **베타 테스터 모집** — 금융 실무자 대상 초기 피드백 수집

### 🟢 중장기
7. **PPT/Word 출력 포맷 추가**
8. **보고서 템플릿 라이브러리** — 자주 쓰는 양식 저장/재사용
9. **팀 협업 기능** — 멀티 유저 워크스페이스
10. **ERP/Bloomberg API 직접 연동**
