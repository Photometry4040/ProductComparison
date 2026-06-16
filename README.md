# 🏆 AV Compare Pro — 제품 비교·의사결정 도구

경쟁 제품을 나란히 놓고 **빠르게 비교하고 의사결정을 내리는** 회사용 웹 애플리케이션입니다.
단순 사양 나열을 넘어, **스펙별 승자 강조 · 가중치 의사결정 매트릭스 · 레이더 비교**로
"우리 기준에서 무엇이 1등인가"에 즉시 답합니다. 현재 AV/디스플레이 영역(프로젝터·모니터·
인터랙티브 디스플레이·LED 비디오월)의 실제 제품 데이터를 기반으로 동작합니다.

> 배포: GitHub `main` 푸시 → Netlify 자동 배포. 저장은 **클라이언트 전용(localStorage)** 으로
> 로그인/백엔드 없이 동작합니다.

<details>
<summary>✨ 주요 기능</summary>

**의사결정 (핵심 차별화)**
- **스펙별 승자 하이라이트**: 비교 대상 중 각 숫자 스펙의 1등 셀을 🏆 초록, 최저값을 회색으로 즉시 표시.
- **가중치 의사결정 매트릭스**: 기준별 가중치 슬라이더 → 0~100 정규화(가격·응답속도 등은 낮을수록 우위) →
  가중 평균으로 **자동 순위 + 추천·가성비 뱃지**. 값이 바뀌면 실시간 갱신.
- **레이더 차트**: 선택 제품을 핵심 스펙 정규화 점수로 겹쳐 그려 다축 비교.
- **차이만 보기**: 모든 제품이 동일한 스펙 행을 숨겨 정보 과부하 제거.

**데이터 & 비교**
- **타입이 있는 스펙 모델**: 각 스펙이 종류(number/currency/text/enum)·단위·좋은 방향·기본 가중치·카테고리를 가짐.
- **카테고리 / 브랜드 / 모델 / 사양 필터**, 스마트 정렬(숫자·통화 인식).
- **동적 제품·사양 관리**(추가/편집/삭제), 드래그 앤 드롭 순서 변경.
- **선택 비교 모달** + **인쇄/PDF 내보내기**(전용 print CSS).
- **CSV/JSON 가져오기·내보내기**(따옴표·콤마·개행을 올바르게 처리하는 RFC 4180 파서).
- **샘플 데이터 불러오기**: AV/디스플레이 36종 시드 데이터로 초기화.

**성능 & UX**
- **가상화**(`react-window`)로 대량 목록 처리, **반응형**(데스크톱=표, 모바일=카드 뷰).
- **코드 스플릿**: 차트(recharts)는 열 때만 로드해 초기 번들 경량화.
- 설정(필터·정렬·뷰·가중치)을 `localStorage`에 저장해 재방문 시 유지.
</details>

---

## 📝 개선사항 리스트 (Changelog)

### 2026-06-16 — 의사결정 도구로 업그레이드 + 실제 데이터
- **의사결정 엔진 도입**: 타입이 있는 스펙 모델(`kind/unit/betterDirection/weight/category`),
  스펙별 승자 하이라이트, 가중치 매트릭스(`DecisionPanel`), 레이더 차트(`RadarChartModal`),
  "차이만 보기" 토글, 카테고리 필터.
- **AV/디스플레이 데이터셋(36종)**: 5개 카테고리. 프로젝터 17종은 projectorcentral.com 기반
  **검증 스펙 + 실제 제품 사진**으로 구성(`public/products/*.jpg`, 재호스팅).
- **브랜딩·산출물**: "AV Compare Pro" 헤더, 비교 결과 **인쇄/PDF 내보내기**, 샘플 데이터 불러오기.
- **안정화(Phase 4)**: RFC 4180 CSV 파서, recharts **코드 스플릿**(초기 번들 696kB→286kB),
  **모바일 카드 뷰**, `@types/react-window`.
- **이미지 파이프라인**: `scripts/generate-product-images.mjs`로 카테고리별 SVG 플레이스홀더 생성,
  실제 사진은 동일 슬러그(`brand-model`)로 `public/products/`에 두면 자동 사용.
- 데이터 수집 가이드: `docs/data-collection-prompts.md`(크롬 Claude 확장용 카테고리별 프롬프트).

### 2024-07-29
- **동적 모델 필터 기능 추가**: 브랜드 선택 시 해당 브랜드 모델만 보여주는 멀티-선택 드롭다운,
  'All Brands'에서는 텍스트 검색 유지.

### 2024-07-28
- **뷰 전환(Transpose View)** 추가, 비교 모달과 동기화, 뷰 모드 `localStorage` 저장,
  렌더링 로직을 `ProductAsRowView`/`ProductAsColumnView`로 분리.

### 2024-07-27
- **데이터 구조 개선**: 단일 '제품명' → '브랜드 + 모델' 분리, 관련 기능 전면 업데이트.

### 2024-07-26
- **성능 최적화**: `react-window` 가상화, hover를 CSS `group-hover`로 전환.
- **안정적 삭제**: `window.confirm` 제거, 커스텀 `ConfirmationModal` 도입.
- **UX**: 삭제 버튼을 수정 모달로 이동, 드래그 앤 드롭 순서 변경, 차트, 설정 저장.

---

<details>
<summary>🛠️ 기술 스택 (Tech Stack)</summary>

- **[React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)** — 컴포넌트 기반 UI, 정적 타입.
- **[Vite 6](https://vite.dev/)** — 개발 서버 및 프로덕션 번들러. `npm run build` → `dist/`.
- **[Tailwind CSS](https://tailwindcss.com/)** — 유틸리티 우선 스타일(현재 `index.html`의 CDN 사용).
- **[Recharts](https://recharts.org/)** — 막대/레이더 차트(코드 스플릿으로 지연 로드).
- **[react-window](https://react-window.vercel.app/)** — 대규모 목록 가상화.
- **상태 관리** — React 훅(`useState`/`useMemo`/`useCallback`), 외부 상태 라이브러리 없음.
- **영속성** — 브라우저 `localStorage`(specs/products/settings). 백엔드 없음.
</details>

<details>
<summary>🚀 로컬 환경에서 실행하기</summary>

[Node.js](https://nodejs.org/)(20 이상 권장)가 필요합니다.

```bash
# 1) 의존성 설치
npm install

# 2) 개발 서버 (기본 http://localhost:3000)
npm run dev

# 3) 프로덕션 빌드 → dist/
npm run build

# 4) 빌드 결과 미리보기
npm run preview

# 5) (선택) 제품 이미지 플레이스홀더 재생성
npm run gen:images
```

> 환경변수: `vite.config.ts`가 `GEMINI_API_KEY`를 참조하지만, 현재 기능 동작에 필수는 아닙니다.
</details>

<details>
<summary>🐳 Docker로 실행하기</summary>

[Docker Desktop](https://www.docker.com/products/docker-desktop/)이 설치되어 있어야 합니다.

```bash
docker build -t av-compare-pro .
docker run -p 3000:3000 --rm --name av-compare-runner av-compare-pro
```
브라우저에서 `http://localhost:3000` 접속.
</details>

<details>
<summary>📁 프로젝트 구조</summary>

```
.
├── App.tsx                     # 핵심 컴포넌트: 상태·로직·레이아웃, 행/열 뷰, 비교/인쇄 모달
├── index.tsx                   # React 앱 마운트 진입점
├── index.html                  # HTML 뼈대 + Tailwind CDN + 인쇄용 print CSS
├── types.ts                    # 타입 정의: Spec(메타 포함), Product
├── data/
│   └── mockData.ts             # AV/디스플레이 36종 시드 데이터 + 타입 메타 스펙(SEED_SPECS/SEED_PRODUCTS)
├── utils/
│   └── specValue.ts            # 공유 파서·정규화·승자맵·가중 점수·메타 추론
├── components/
│   ├── Modal.tsx               # 범용 모달 뼈대
│   ├── ConfirmationModal.tsx   # 삭제 확인 모달
│   ├── SpecFormModal.tsx       # 사양 추가/편집
│   ├── ProductFormModal.tsx    # 제품 추가/편집(이미지 업로드 포함)
│   ├── DataImportModal.tsx     # CSV/JSON 가져오기·템플릿 내보내기(RFC 4180 파서)
│   ├── ChartModal.tsx          # 단일 스펙 막대 차트(지연 로드)
│   ├── RadarChartModal.tsx     # 다축 레이더 비교(지연 로드)
│   ├── DecisionPanel.tsx       # 가중치 의사결정 매트릭스(순위·추천·가성비)
│   ├── ProductCardView.tsx     # 모바일 카드 뷰
│   └── icons.tsx               # SVG 아이콘 모음
├── public/
│   └── products/               # 제품 이미지(실사 .jpg + 플레이스홀더 .svg), /products/<slug> 로 참조
├── scripts/
│   └── generate-product-images.mjs  # 플레이스홀더 이미지 생성기 (npm run gen:images)
├── docs/
│   └── data-collection-prompts.md   # 크롬 Claude 확장용 데이터 수집 프롬프트
├── netlify.toml                # Netlify 빌드 설정
├── Dockerfile / .dockerignore  # Docker 설정
├── vite.config.ts              # Vite 설정
└── tsconfig.json               # TypeScript 설정
```
</details>

<details>
<summary>🧩 핵심 모듈 설명</summary>

### `types.ts`
- **`Spec`**: `id`, `name` 외에 비교용 메타데이터 — `kind`(number/currency/text/enum), `unit`,
  `betterDirection`(higher/lower/none), `weight`(0~100), `category`.
- **`Product`**: `id`, `brand`, `model`, `imageUrl`, `category`, `specs`(specId→문자열 값).

### `utils/specValue.ts`
- `parseSpecValue` — 통화/콤마/단위를 제거하고 선행 숫자를 추출(차트·승자·점수가 공유).
- `computeBestWorstMap` / `rankCell` — 스펙별 최고·최저 계산과 셀 등급 판정(승자 하이라이트).
- `normalizeSpec` / `computeScores` — 0~100 정규화와 가중 점수·가성비 계산.
- `inferSpecMeta` / `withInferredMeta` — 이름 기반으로 레거시·가져온 스펙에 메타 자동 부여.

### `data/mockData.ts`
- `SEED_SPECS`(21개 스펙, 메타 포함)와 `SEED_PRODUCTS`(36종, 5개 카테고리).
- 이미지 경로는 `slugify("brand model")` → `/products/<slug>.svg|jpg`. 실제 사진을 같은 슬러그로
  넣으면 자동 사용됩니다.

### `App.tsx`
- 앱의 두뇌. specs/products/필터/정렬/뷰/가중치 상태를 관리하고 `localStorage`에 저장.
- 표시 스펙(`finalDisplayedSpecs`)·정렬 제품(`sortedProducts`)·승자맵·점수 대상은 `useMemo`로 계산.
- 데스크톱은 `ProductAsRowView`/`ProductAsColumnView`, 모바일은 `ProductCardView`로 렌더.
- 차트 모달은 `React.lazy`로 지연 로드(코드 스플릿).
</details>
