# SAPIX AI Coach（サピAI）

日本中学受験向けのAI学習コーチMVPです。SAPIX生の保護者が、子供の弱点・錯題・偏差値・目標校から「今日何を勉強すべきか」を判断できます。

## Project Structure

```text
app/
  api/
    auth/               メールログインAPI
    children/           子供情報API
    tests/              成績API
    wrong-questions/    錯題API + AI分析
    plan/               AI每日学習計画API
  dashboard/            今日やること、弱点ランキング
  children/             子供情報登録・編集
  tests/                テスト結果登録
  wrong-questions/      錯題登録・AI分析
  plan/                 AI每日学習計画
components/             共通UI
db/schema.sql           PostgreSQL schema
lib/                    auth, db, OpenAI, API helpers
```

## API Design

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | ユーザー登録 |
| POST | `/api/auth/login` | ログイン |
| POST | `/api/auth/logout` | ログアウト |
| GET | `/api/auth/me` | ログイン中ユーザー |
| GET/POST | `/api/children` | 子供一覧・登録 |
| GET/POST | `/api/tests?childId=...` | 成績一覧・登録 |
| GET/POST | `/api/wrong-questions?childId=...` | 錯題一覧・登録 |
| POST | `/api/wrong-questions/:id/analyze` | OpenAIで錯題分析 |
| POST | `/api/plan` | OpenAIで今日の学習計画生成 |

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run db:init
npm run dev
```

Open `http://localhost:3000`.

## Railway Deploy

1. Push this project to GitHub.
2. Create a Railway project.
3. Add a PostgreSQL service.
4. Add a Next.js service from the GitHub repo.
5. Set variables:
   - `DATABASE_URL` from Railway PostgreSQL
   - `JWT_SECRET`
   - `AI_PROVIDER=gemini`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL=gemini-2.5-flash`
   - `OPENAI_API_KEY` if you want to use OpenAI instead
   - `OPENAI_MODEL=gpt-5.4-mini`
6. Run `npm run db:init` once from Railway shell or local machine using Railway's `DATABASE_URL`.
7. Deploy. Railway will run `npm run build` and `npm start`.

## AI Provider

The app can use Gemini or OpenAI. For the free-tier-friendly MVP, use Gemini:

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
```

To use OpenAI instead:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.4-mini
```

The AI endpoints request strict JSON for:

- wrong question analysis
- daily learning plan
