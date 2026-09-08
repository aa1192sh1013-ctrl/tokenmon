# Tokenmon · Claude Code + Codex × AnimalBot

Claude Code와 로컬 Codex에서 작업한 사용량으로 프로젝트별 AnimalBot 캐릭터를 키우는 로컬 대시보드입니다.

- **60종 × Lv.0~20**, AnimalBot 신규 원화 1,260장. 실제 성장은 Lv.1부터, 알(Lv.0)은 도감에서 확인합니다.
- 같은 프로젝트의 Claude + Codex 사용량이 한 캐릭터의 성장에 반영됩니다.
- 서비스별 토큰 합계와 사용 한도를 각각 표시합니다. 토큰 합계와 구독 한도 사용률은 서로 다른 지표입니다.
- 종은 기존 프로젝트명 기반 배정을 유지합니다. 그림에는 색상 필터를 적용하지 않습니다.
- 대시보드·도감 상단의 `한국어 / English` 버튼으로 언어를 바꿉니다. 선택은 해당 브라우저에 1년간 저장됩니다. URL의 `?lang=en` 또는 `?lang=ko` 지정이 가장 우선하며, 지정이 없으면 저장된 선택 → 기존 설정 파일 → 브라우저 언어 → 영어 순으로 정합니다.

## 실행

다른 사람에게 전달할 때는 `dist/tokenmon-share.zip`을 공유하세요. 받는 사람의 시작 안내는 [START-HERE.md](START-HERE.md)에 있습니다. Windows에서는 `start-tokenmon.cmd`를 더블클릭하면 최초 설치와 빌드 후 실행합니다. 캐릭터 이미지가 포함되어 AnimalBot 원본 폴더는 필요 없습니다.

Windows에서 공유 ZIP을 다시 만들려면:

```powershell
powershell -NoProfile -File scripts/share.ps1
```

ZIP은 지정한 앱 파일만 포함하며 사용자 홈의 기록·인증 정보, 개발 캐시, Git 이력은 포함하지 않습니다. 서버에 접속하는 다중 사용자 서비스가 아니라 각자의 PC에서 실행하는 방식입니다.

Node.js 20.9 이상이 필요합니다.

```sh
npm install
npm run dev
# http://127.0.0.1:4242/?lang=ko
```

프로덕션 실행:

```sh
npm run build
npm start
```

기본 서버는 로컬 컴퓨터에만 연결됩니다. 별도 계정이나 API 키를 추가하지 않아도 로컬 Codex 기록을 수집합니다.

## 데이터 연결

### Claude Code

```sh
npm run setup
```

기존 수집기를 `~/.claude/tokenmon`에 설치하고 Claude Code 상태줄에 연결합니다. 설정은 백업하며 기존 상태줄 명령이 있으면 연결해서 사용합니다. 기존 설치 사용자는 다시 설치할 필요가 없습니다.

상태줄 수집 + 로컬 대화 기록의 usage 집계 + 과거 기록 백필을 사용합니다. Anthropic 사용 한도 조회는 기존 로컬 OAuth 인증을 사용합니다. 조회를 끄려면 `~/.claude/tokenmon/config.json`에 `{"useUsageApi": false}`를 설정합니다.

### Codex

`~/.codex/sessions`와 `~/.codex/archived_sessions`를 읽습니다. `CODEX_HOME`을 지정한 환경도 지원합니다.

첫 실행에는 기록을 백그라운드로 집계하며 화면에 진행률을 표시합니다. 큰 기록은 수 분이 걸릴 수 있습니다. 이후에는 파일마다 마지막 읽은 위치 이후만 수집합니다. 화면이 열려 있으면 5초마다 새로고침하며 Codex 재검색 간격은 최소 10초입니다.

- 메타데이터, 모델, 토큰 수, 활동일, 한도 관측값만 별도 저장합니다. 대화나 도구 출력 본문을 새 장부에 저장하지 않습니다.
- 누적 토큰의 증가분만 반영하며 캐시 입력과 추론 출력은 다시 더하지 않습니다.
- 활성/보관 폴더에 같은 세션이 있어도 세션 ID로 한 번만 집계합니다.
- 포크에 복사된 생성 시각 이전 기록과 상속된 초기 토큰을 제외합니다.
- 최초 연결 전 기록은 통계에 반영하며 XP는 최초 감지 이후 활동으로 성장합니다. 오래된 기록만 있는 프로젝트는 새 캐릭터를 만들지 않습니다.
- 사용 한도는 **로컬 기록의 마지막 관측값**입니다. 별도 실시간 계정 API 조회를 구현한 것은 아닙니다. 10분 이상 오래된 값은 갱신 대기를 표시하며, 만료된 구간의 수치를 현재 사용률처럼 표시하지 않습니다.
- 로컬에 내려오지 않은 클라우드 작업은 집계하지 않습니다. 로그 형식 변경이나 읽기 실패 시 일부 누락될 수 있으며 재시도 상태를 표시합니다.

## 성장과 기존 기록 보존

입력(캐시 포함) + 출력 100만 토큰 = 1 XP. Lv.2는 8 XP, Lv.10은 350 XP, Lv.20은 5,700 XP입니다. 기존 곡선을 유지합니다.

기존 Claude 성장 기준선은 읽기 전용으로 가져오며 통합 기준선은 `~/.tokenmon/projects.json`에 별도 저장합니다. 기존 `~/.claude/tokenmon/projects.json`은 수정하지 않습니다. 나중에 집계된 과거 Codex 기록 때문에 XP가 갑자기 오르지 않습니다.

프로젝트는 정규화된 경로로 구분합니다. Git 저장소 하위 폴더와 worktree는 원래 저장소에 연결합니다. 같은 이름의 서로 다른 경로는 별도 캐릭터가 됩니다. 기존에 이름 하나로 합쳐졌던 Claude 기준선은 해당 경로들의 토큰 비율에 맞춰 나눕니다.

삭제되거나 수동으로 옮긴 worktree는 Git 정보가 없어 자동 연결할 수 없을 수 있습니다. `~/.tokenmon/config.json`에서 명시적으로 연결할 수 있습니다:

```json
{
  "projectAliases": {
    "C:/old-worktree": "C:/Dev/my-project"
  }
}
```

방치 감가는 3일 유예 후 정수 일 단위로 적용됩니다(만 4일째 첫 3%). 두 서비스 중 하나로 해당 프로젝트에서 활동하면 회복합니다.

## 화면

- `/`: 합산·서비스별 토큰, 개별 한도, 세션 차트, 프로젝트별 캐릭터. 12마리 초과 시 더 보기.
- `/gallery`: 종 검색, 목록 레벨 선택, 선택한 종의 알~Lv.20 전체 21단계.

## 캐릭터 가져오기

이미 변환된 WebP가 저장소에 포함돼 있으므로 실행할 때 AnimalBot 폴더는 필요 없습니다.

```sh
npm run assets:import -- ../AnimalBot/character-concepts/mid
```

원본 PNG는 수정하지 않습니다. 8종의 ID 차이를 매핑하고, 640×640 투명 WebP 1,260장으로 변환합니다. `public/species-manifest.json`에 원본 상대 경로와 SHA-256을 기록합니다. 이미지 갱신 시 `components/tokenmon-sprite.tsx`의 버전도 갱신하세요.

## 검증

```sh
npm test
npm run typecheck
npm run build
```

회귀 테스트: 서비스 합산·프로젝트 분리·과거 기록·포크 중복·캐시 중복·불완전 로그 줄·재시작·기존 기준선·worktree 연결.

테스트/별도 환경에서는 `TOKENMON_DATA_DIR`로 통합 장부 저장 위치, `TOKENMON_CLAUDE_DIR`로 기존 Claude 캐릭터 장부를 읽을 위치, `TOKENMON_CODEX_DIR`로 Codex 기록 입력 위치를 바꿀 수 있습니다. Claude 수집 기록 경로는 기존 설정을 따릅니다. 이 환경 변수는 실행 프로세스에만 적용됩니다.

## 주요 코드

| 경로 | 역할 |
|---|---|
| `lib/tokenmon.ts` | 공통 데이터와 성장 계산 |
| `lib/codex-collector.ts` | Codex 증분 수집·기록 캐시 |
| `lib/project-identity.ts` | 프로젝트 경로·worktree 연결 |
| `components/pet-registry.ts` | 기존 성장 이전·통합 기준선 |
| `components/tokenmon-section.tsx` | Claude/Codex 수집 통합 |
| `components/provider-overview.tsx` | 서비스별 토큰·Codex 한도 |
| `components/tokenmon-sprite.tsx` | AnimalBot 원화 표시 |
| `scripts/import-animalbot.mjs` | 원본 이미지 가져오기 |

## 수집기 제거

`npm run remove`는 Claude 상태줄 수집기만 제거하며 기록은 유지합니다. 통합 대시보드를 종료하면 Codex 수집도 멈춥니다. 기존 `remove -- --purge`는 Claude 수집 기록을 삭제하는 명령이므로 성장 기록을 보존하려면 사용하지 마세요.

MIT © Sunhong Min
