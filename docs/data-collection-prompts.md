# 제품 데이터 수집 프롬프트 (크롬 Claude 확장용)

이 문서는 **크롬 Claude 확장(브라우징 에이전트)**에 붙여넣어 인터넷에서 제품의
**사실 정보 + 대표 이미지 직접 URL**을 수집하기 위한 프롬프트 모음입니다.
카테고리별로 같은 형식의 프롬프트가 준비되어 있습니다.

## 사용 방법 (워크플로)

1. 아래 카테고리별 프롬프트를 크롬 Claude 확장에 붙여넣고 실행합니다.
2. 확장이 출력한 **JSON 배열**을 복사합니다.
3. 그 JSON을 Claude Code 대화에 붙여넣어 주세요. 그러면:
   - 각 `imageSourceUrl`을 `public/products/<slug>.svg|jpg`로 **내려받아 재호스팅**(외부 핫링크 금지)하고,
   - 스펙 값을 해당 제품에 반영하며(다른 카테고리 데이터는 보존),
   - 빌드·검증 후 배포까지 진행합니다.

> 참고: 브라우저 확장은 **데이터·이미지 URL 추출**에 적합합니다. 파일을 저장소(`public/products/`)에
> 실제로 저장·재호스팅하는 작업은 Claude Code(파일시스템 접근)가 처리하는 것이 안정적입니다.

## 슬러그(이미지 파일명) 규칙

`slug = "<brand> <model>"` 을 소문자로 바꾸고, 영숫자가 아닌 문자열을 `-`로 치환, 양끝 `-` 제거.
- `BenQ TK710` → `benq-tk710`
- `Samsung The Wall IWA (146")` → `samsung-the-wall-iwa-146`
- `Christie DWU760-iS` → `christie-dwu760-is`

이미지는 `public/products/<slug>.svg`(현재 플레이스홀더) 또는 `<slug>.jpg`(실제 사진)로 저장되며,
앱의 `imageUrl`은 `/products/<slug>.svg|jpg` 경로를 참조합니다.

## 스펙 필드 이름 (반드시 그대로 사용)

| 필드 이름 | 종류 | 좋은 방향 | 형식 예시 |
|---|---|---|---|
| `Street Price (USD)` | currency | 낮을수록 | `$1,899` |
| `MSRP (USD)` | currency | 낮을수록 | `$2,099` |
| `Status` | text | - | `Shipping` / `Made to Order` |
| `Released (Year)` | number | 높을수록 | `2024` |
| `Warranty (Years)` | number | 높을수록 | `3 Years` |
| `Brightness` | number | 높을수록 | 프로젝터 `3,200 lumens` · 디스플레이 `400 nits` |
| `Native Resolution` | text | - | `3840x2160` |
| `Contrast Ratio` | number | 높을수록 | `10,000:1` |
| `HDR Support` | enum | - | `HDR10 / HLG` |
| `Refresh Rate (Hz)` | number | 높을수록 | `120 Hz` |
| `Response Time (ms)` | number | 낮을수록 | `5 ms` |
| `Input Lag (ms)` | number | 낮을수록 | `10 ms` |
| `Screen Size (inch)` | number | 높을수록 | `32 inch` |
| `Display Technology` | enum | - | `DLP` / `3LCD` / `OLED` / `IPS` / `MicroLED` |
| `Pixel Pitch (mm)` | number | 낮을수록 | `1.5 mm` |
| `Built-in Speakers (W)` | number | 높을수록 | `10 W` |
| `Connectivity` | text | - | `HDMI 2.1 x2, USB-C` |
| `Touch Points` | number | 높을수록 | `20` |
| `Power Consumption (W)` | number | 낮을수록 | `350 W` |
| `Weight (kg)` | number | 낮을수록 | `4.2 kg` (lbs는 kg로 환산) |
| `Light Source Life (hrs)` | number | 높을수록 | `20,000 hrs` |

**공통 규칙**
- 페이지에 있는 **사실만** 기입. 확인 불가한 값은 **절대 지어내지 말고 빈 문자열 `""`**.
- 무게가 lbs면 kg로 환산(× 0.4536, 소수 1자리). 화면 크기는 인치 숫자.
- 출력은 **JSON 배열 하나만 코드블록**으로. 끝에 누락 항목을 짧게 보고.

---

## 1) 프로젝터 (홈시어터 + 비즈니스/교육)

```
역할: 너는 제품 데이터 리서치 어시스턴트다. 아래 페이지에서 지정한 프로젝터들의
"사실 정보"와 "제품 이미지 직접 URL"을 정확히 추출해, 지정한 JSON 스키마로만 출력한다.

대상 페이지: https://www.projectorcentral.com/projectors.cfm?g=2#list
(필요하면 각 제품 상세 페이지나 사이트 검색으로 들어가 정확한 값을 확인할 것)

수집할 제품 (브랜드 / 모델 — 목록에 없으면 건너뛰고 결과에 표시):
1. BenQ TK710            (category: Home Theater Projector)
2. BenQ HT4550i          (category: Home Theater Projector)
3. Epson Pro Cinema LS12000 (category: Home Theater Projector)
4. Sony VPL-XW5000ES     (category: Home Theater Projector)
5. JVC DLA-NZ500         (category: Home Theater Projector)
6. Epson Home Cinema 2350 (category: Home Theater Projector)
7. XGIMI Horizon Ultra   (category: Home Theater Projector)
8. Epson PowerLite L630U (category: Business / Education Projector)
9. BenQ LU935            (category: Business / Education Projector)
10. Panasonic PT-VMZ71   (category: Business / Education Projector)
11. Optoma ZU607T        (category: Business / Education Projector)
12. NEC PV800UL          (category: Business / Education Projector)
13. Christie DWU760-iS   (category: Business / Education Projector)

각 제품마다 수집:
- imageSourceUrl: 제품 대표 이미지의 직접 URL(https://...로 시작, .jpg/.png/.webp).
  썸네일이 아닌 가능한 한 큰 이미지. 페이지 <img src> 확인.
- 스펙(사실만, 없으면 ""):
  "Street Price (USD)"      예: "$1,899"
  "Released (Year)"         예: "2024"  (연도 숫자만)
  "Warranty (Years)"        예: "3 Years"
  "Brightness"              예: "3,200 lumens"
  "Native Resolution"       예: "3840x2160"
  "Contrast Ratio"          예: "10,000:1"
  "Display Technology"      예: "DLP" / "3LCD" / "SXRD" / "D-ILA"
  "Built-in Speakers (W)"   예: "5 W"
  "Light Source Life (hrs)" 예: "20,000 hrs" (Lamp Life)
  "Weight (kg)"             lbs면 kg로 환산(소수1자리). 예: 6.6 lbs → "3.0 kg"

규칙: 사실만, 없으면 ""; 추측 금지. lbs→kg 환산.

출력: 아래 스키마의 JSON 배열 하나만 코드블록으로.
[
  {
    "brand": "BenQ",
    "model": "TK710",
    "category": "Home Theater Projector",
    "imageSourceUrl": "https://www.projectorcentral.com/images/....jpg",
    "specs": {
      "Street Price (USD)": "$1,899",
      "Released (Year)": "2024",
      "Warranty (Years)": "3 Years",
      "Brightness": "3,200 lumens",
      "Native Resolution": "3840x2160",
      "Contrast Ratio": "10,000:1",
      "Display Technology": "DLP",
      "Built-in Speakers (W)": "5 W",
      "Light Source Life (hrs)": "20,000 hrs",
      "Weight (kg)": "3.0 kg"
    }
  }
]

마지막에 찾지 못했거나 비어 누락된 제품/필드를 짧게 보고한다.
```

---

## 2) 전문가용 모니터 (Professional Monitor)

```
역할: 너는 제품 데이터 리서치 어시스턴트다. 각 제품의 "사실 정보"와 "제품 이미지 직접 URL"을
정확히 추출해, 지정한 JSON 스키마로만 출력한다.

추천 소스(우선순위대로 확인): 제조사 공식 제품 페이지 → rtings.com → displayspecifications.com
각 제품을 검색해 공식 스펙으로 교차 확인할 것.

수집할 제품 (모두 category: "Professional Monitor"):
1. Apple Pro Display XDR
2. Dell UltraSharp U3223QE
3. LG UltraFine 32EP950
4. ASUS ProArt PA32UCG
5. EIZO ColorEdge CG2700X
6. Samsung ViewFinity S9
7. BenQ PD3220U

각 제품마다 수집:
- imageSourceUrl: 제조사 공식 제품 이미지의 직접 URL(가능한 한 큰 정면 이미지).
- 스펙(사실만, 없으면 ""):
  "Street Price (USD)"     예: "$999"
  "Released (Year)"        예: "2022"
  "Warranty (Years)"       예: "3 Years"
  "Brightness"             예: "400 nits"  (peak/typical 중 peak 우선, nits 단위)
  "Native Resolution"      예: "3840x2160"
  "Contrast Ratio"         예: "2,000:1"  (native contrast 우선)
  "HDR Support"            예: "HDR400" / "Dolby Vision / HDR10"
  "Refresh Rate (Hz)"      예: "60 Hz"
  "Response Time (ms)"     예: "5 ms"  (GtG 우선)
  "Input Lag (ms)"         예: "10 ms"  (rtings 값 있으면)
  "Screen Size (inch)"     예: "31.5 inch"
  "Display Technology"     예: "IPS" / "IPS Black" / "OLED" / "IPS (mini-LED)"
  "Built-in Speakers (W)"  예: "4 W"  (스피커 없으면 "")
  "Connectivity"           예: "Thunderbolt 3, HDMI, DP"
  "Power Consumption (W)"  예: "140 W"  (typical/On 모드)
  "Weight (kg)"            스탠드 포함 무게. lbs면 kg 환산(소수1자리).

규칙: 사실만, 없으면 ""; 추측 금지. Brightness/Weight 단위 통일(nits, kg).

출력: 아래 스키마의 JSON 배열 하나만 코드블록으로.
[
  {
    "brand": "Dell",
    "model": "UltraSharp U3223QE",
    "category": "Professional Monitor",
    "imageSourceUrl": "https://...dell.../u3223qe.jpg",
    "specs": {
      "Street Price (USD)": "$999",
      "Released (Year)": "2022",
      "Warranty (Years)": "3 Years",
      "Brightness": "400 nits",
      "Native Resolution": "3840x2160",
      "Contrast Ratio": "2,000:1",
      "HDR Support": "HDR400",
      "Refresh Rate (Hz)": "60 Hz",
      "Response Time (ms)": "5 ms",
      "Input Lag (ms)": "10 ms",
      "Screen Size (inch)": "31.5 inch",
      "Display Technology": "IPS Black",
      "Built-in Speakers (W)": "",
      "Connectivity": "USB-C 90W hub, HDMI, DP",
      "Power Consumption (W)": "140 W",
      "Weight (kg)": "9.0 kg"
    }
  }
]

마지막에 누락 항목을 짧게 보고한다.
```

---

## 3) 인터랙티브 디스플레이 (Interactive Display / 전자칠판)

```
역할: 너는 제품 데이터 리서치 어시스턴트다. 각 제품의 "사실 정보"와 "제품 이미지 직접 URL"을
정확히 추출해, 지정한 JSON 스키마로만 출력한다.

추천 소스: 제조사 공식 제품/스펙 페이지(가장 신뢰). 모델 검색으로 정확한 사양 확인.

수집할 제품 (모두 category: "Interactive Display"):
1. Samsung Flip Pro WMB (예: WM65B/WM75B 계열, 65")
2. Microsoft Surface Hub 3 50"
3. ViewSonic ViewBoard IFP7550
4. Promethean ActivPanel 9 (75")
5. SMART Board GX075
6. LG CreateBoard 86TR3DK

각 제품마다 수집:
- imageSourceUrl: 제조사 공식 제품 이미지의 직접 URL(정면 이미지).
- 스펙(사실만, 없으면 ""):
  "Street Price (USD)"     공개가 있으면 기입, 없으면 ""
  "Released (Year)"        예: "2023"
  "Warranty (Years)"       예: "3 Years"
  "Brightness"             예: "400 nits"
  "Native Resolution"      예: "3840x2160"
  "Screen Size (inch)"     예: "75 inch"
  "Display Technology"     예: "LCD" / "LCD (PixelSense)"
  "Touch Points"           예: "20"  (동시 터치 점 수, 숫자만)
  "Built-in Speakers (W)"  예: "20 W"  (총 출력)
  "Connectivity"           예: "HDMI x3, USB-C, LAN"
  "Power Consumption (W)"  예: "350 W"  (typical/On)
  "Weight (kg)"            본체 무게. lbs면 kg 환산(소수1자리).

규칙: 사실만, 없으면 ""; 추측 금지. Touch Points는 숫자만, Brightness는 nits, Weight는 kg.

출력: 아래 스키마의 JSON 배열 하나만 코드블록으로.
[
  {
    "brand": "ViewSonic",
    "model": "ViewBoard IFP7550",
    "category": "Interactive Display",
    "imageSourceUrl": "https://...viewsonic.../ifp7550.png",
    "specs": {
      "Street Price (USD)": "",
      "Released (Year)": "2022",
      "Warranty (Years)": "3 Years",
      "Brightness": "400 nits",
      "Native Resolution": "3840x2160",
      "Screen Size (inch)": "75 inch",
      "Display Technology": "LCD",
      "Touch Points": "20",
      "Built-in Speakers (W)": "16 W",
      "Connectivity": "HDMI x3, USB-C, LAN",
      "Power Consumption (W)": "400 W",
      "Weight (kg)": "56.0 kg"
    }
  }
]

마지막에 누락 항목을 짧게 보고한다.
```

---

## 4) LED 비디오월 (LED Video Wall)

```
역할: 너는 제품 데이터 리서치 어시스턴트다. 각 제품의 "사실 정보"와 "제품 이미지 직접 URL"을
정확히 추출해, 지정한 JSON 스키마로만 출력한다.

추천 소스: 제조사 공식 제품/스펙 페이지. LED월은 구성에 따라 사양이 달라지니,
괄호 안 화면 크기에 해당하는 대표 구성 기준으로 기입(없으면 대표값/시리즈 스펙).

수집할 제품 (모두 category: "LED Video Wall"):
1. Samsung The Wall IWA (146")
2. LG MAGNIT LSAB (136")
3. Absen Acclaim Plus (130")
4. Planar TVF Series (120")

각 제품마다 수집:
- imageSourceUrl: 제조사 공식 제품 이미지의 직접 URL.
- 스펙(사실만, 없으면 ""; LED월은 가격 비공개가 흔하니 가격은 보통 ""):
  "Street Price (USD)"     공개가 있으면 기입, 없으면 ""
  "Status"                 예: "Made to Order" / "Shipping"
  "Released (Year)"        예: "2023"
  "Warranty (Years)"       예: "2 Years"
  "Brightness"             예: "1,600 nits"
  "Native Resolution"      예: "3840x2160"
  "Contrast Ratio"         예: "1,000,000:1"  (있으면)
  "Screen Size (inch)"     예: "146 inch"
  "Display Technology"     예: "MicroLED" / "LED (SMD)"
  "Pixel Pitch (mm)"       예: "1.68 mm"  (핵심 사양)
  "Connectivity"           예: "HDMI, DP, controller"
  "Power Consumption (W)"  예: "3,000 W"  (max/typical)
  "Weight (kg)"            대표 구성 기준. lbs면 kg 환산.

규칙: 사실만, 없으면 ""; 추측 금지. Pixel Pitch는 mm, Brightness는 nits, Weight는 kg.

출력: 아래 스키마의 JSON 배열 하나만 코드블록으로.
[
  {
    "brand": "Samsung",
    "model": "The Wall IWA (146\")",
    "category": "LED Video Wall",
    "imageSourceUrl": "https://...samsung.../the-wall.jpg",
    "specs": {
      "Street Price (USD)": "",
      "Status": "Made to Order",
      "Released (Year)": "2023",
      "Warranty (Years)": "2 Years",
      "Brightness": "1,600 nits",
      "Native Resolution": "3840x2160",
      "Contrast Ratio": "1,000,000:1",
      "Screen Size (inch)": "146 inch",
      "Display Technology": "MicroLED",
      "Pixel Pitch (mm)": "1.68 mm",
      "Connectivity": "HDMI, DP, controller",
      "Power Consumption (W)": "3,000 W",
      "Weight (kg)": "200.0 kg"
    }
  }
]

마지막에 누락 항목을 짧게 보고한다.
```

---

## 모델 매칭 주의
- 위 모델명은 현재 시드 데이터(`data/mockData.ts`)와 일치합니다. 수집 결과의 `brand`+`model`이
  시드와 동일해야 자동 매칭됩니다. 사이트에서 약간 다른 표기(지역명/접미사)를 쓰면, 결과의
  `model`은 **시드 표기 그대로** 두고 실제 사양만 채워주세요.
- 새 제품을 추가로 발견하면 별도 항목으로 추가해도 됩니다(매칭되지 않으면 신규로 취급).
