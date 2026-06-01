-- ==========================================
-- File: 20241202_profiles.sql
-- ==========================================
-- Profiles Table & Auth Triggers

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  membership_tier TEXT DEFAULT 'cadet' CHECK (membership_tier IN ('cadet', 'navigator', 'pilot', 'commander', 'admiral')),
  vote_power INTEGER DEFAULT 1,
  eth_wallet TEXT,
  sol_wallet TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_eth_wallet ON public.profiles(eth_wallet);
CREATE INDEX IF NOT EXISTS idx_profiles_sol_wallet ON public.profiles(sol_wallet);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can update own wallet" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Automatically create profile on user signup function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, membership_tier, vote_power, eth_wallet, sol_wallet)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'membership_tier', 'cadet'),
    COALESCE((new.raw_user_meta_data->>'vote_power')::integer, 1),
    new.raw_user_meta_data->>'eth_wallet',
    new.raw_user_meta_data->>'sol_wallet'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ==========================================
-- File: 20241202_nft_system.sql
-- ==========================================
-- NFT System Tables

-- NFTs table
CREATE TABLE IF NOT EXISTS nfts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  tier VARCHAR(50) NOT NULL CHECK (tier IN ('cadet', 'navigator', 'pilot', 'commander', 'admiral')),
  owner_id UUID REFERENCES auth.users(id),
  is_listed BOOLEAN DEFAULT false,
  price DECIMAL(18, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auctions table
CREATE TABLE IF NOT EXISTS auctions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nft_id UUID REFERENCES nfts(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES auth.users(id),
  start_price DECIMAL(18, 8) NOT NULL,
  current_bid DECIMAL(18, 8),
  highest_bidder UUID REFERENCES auth.users(id),
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bids table
CREATE TABLE IF NOT EXISTS bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(18, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Randombox history table
CREATE TABLE IF NOT EXISTS randombox_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  box_type VARCHAR(20) NOT NULL CHECK (box_type IN ('basic', 'premium', 'legendary')),
  result_nft_id UUID REFERENCES nfts(id),
  sol_amount DECIMAL(18, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gifts table
CREATE TABLE IF NOT EXISTS gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user UUID REFERENCES auth.users(id),
  to_wallet VARCHAR(255) NOT NULL,
  nft_id UUID REFERENCES nfts(id),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nfts_owner ON nfts(owner_id);
CREATE INDEX IF NOT EXISTS idx_nfts_tier ON nfts(tier);
CREATE INDEX IF NOT EXISTS idx_nfts_listed ON nfts(is_listed);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_end_time ON auctions(end_time);
CREATE INDEX IF NOT EXISTS idx_bids_auction ON bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_randombox_user ON randombox_history(user_id);
CREATE INDEX IF NOT EXISTS idx_gifts_from ON gifts(from_user);

-- Enable RLS
ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE randombox_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view NFTs" ON nfts FOR SELECT USING (true);
CREATE POLICY "Owners can update their NFTs" ON nfts FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Anyone can view auctions" ON auctions FOR SELECT USING (true);
CREATE POLICY "Sellers can manage their auctions" ON auctions FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Anyone can view bids" ON bids FOR SELECT USING (true);
CREATE POLICY "Users can create bids" ON bids FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their randombox history" ON randombox_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create randombox history" ON randombox_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view gifts they sent" ON gifts FOR SELECT USING (auth.uid() = from_user);
CREATE POLICY "Users can send gifts" ON gifts FOR INSERT WITH CHECK (auth.uid() = from_user);


-- ==========================================
-- File: 20241202_project_management.sql
-- ==========================================
-- Project Management Dashboard Tables
-- Run this SQL in your Supabase SQL Editor

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'in_progress', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  phase TEXT CHECK (phase IN ('phase_1', 'phase_2', 'phase_3', 'phase_4', 'phase_5', 'phase_6', 'phase_7', 'phase_8', 'phase_9', 'phase_10')),
  due_date DATE,
  estimated_hours INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task history for burndown charts
CREATE TABLE IF NOT EXISTS task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  phase TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date, phase)
);

-- Task labels for additional categorization
CREATE TABLE IF NOT EXISTS task_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  color TEXT DEFAULT '#8b5cf6'
);

-- User notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_reminders BOOLEAN DEFAULT TRUE,
  reminder_time TIME DEFAULT '09:00:00',
  days_before_due INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for subtasks
CREATE POLICY "Users can view subtasks of their tasks"
  ON subtasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()));

CREATE POLICY "Users can create subtasks for their tasks"
  ON subtasks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()));

CREATE POLICY "Users can update subtasks of their tasks"
  ON subtasks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()));

CREATE POLICY "Users can delete subtasks of their tasks"
  ON subtasks FOR DELETE
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()));

-- RLS Policies for task_history
CREATE POLICY "Users can view their own task history"
  ON task_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own task history"
  ON task_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task history"
  ON task_history FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for task_labels
CREATE POLICY "Users can view labels of their tasks"
  ON task_labels FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_labels.task_id AND tasks.user_id = auth.uid()));

CREATE POLICY "Users can create labels for their tasks"
  ON task_labels FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_labels.task_id AND tasks.user_id = auth.uid()));

CREATE POLICY "Users can update labels of their tasks"
  ON task_labels FOR UPDATE
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_labels.task_id AND tasks.user_id = auth.uid()));

CREATE POLICY "Users can delete labels of their tasks"
  ON task_labels FOR DELETE
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_labels.task_id AND tasks.user_id = auth.uid()));

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_phase ON tasks(phase);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_user_date ON task_history(user_id, date);
CREATE INDEX IF NOT EXISTS idx_task_labels_task_id ON task_labels(task_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to record task history daily
CREATE OR REPLACE FUNCTION record_daily_task_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert task history for today
  INSERT INTO task_history (user_id, date, total_tasks, completed_tasks, phase)
  SELECT
    NEW.user_id,
    CURRENT_DATE,
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'done'),
    phase
  FROM tasks
  WHERE user_id = NEW.user_id
  GROUP BY user_id, phase
  ON CONFLICT (user_id, date, phase)
  DO UPDATE SET
    total_tasks = EXCLUDED.total_tasks,
    completed_tasks = EXCLUDED.completed_tasks;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER record_task_history_on_change
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION record_daily_task_history();


-- ==========================================
-- File: 20241203_lessons.sql
-- ==========================================
-- Lessons System Tables

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  level VARCHAR(20) NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  thumbnail TEXT,
  read_time INTEGER DEFAULT 5,
  required_tier VARCHAR(50) NOT NULL CHECK (required_tier IN ('cadet', 'navigator', 'pilot', 'commander', 'admiral')),
  order_num INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lesson progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lessons_level ON lessons(level);
CREATE INDEX IF NOT EXISTS idx_lessons_tier ON lessons(required_tier);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(order_num);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);

-- Enable RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view lessons" ON lessons FOR SELECT USING (true);

CREATE POLICY "Users can view their progress" ON lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their progress" ON lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their progress" ON lesson_progress FOR UPDATE USING (auth.uid() = user_id);

-- Seed initial lessons data
INSERT INTO lessons (title, description, content, level, thumbnail, read_time, required_tier, order_num) VALUES

-- 초급 (Beginner) - Cadet 이상 접근
('암호화폐란 무엇인가?', '블록체인과 암호화폐의 기본 개념을 배웁니다.', '## 암호화폐의 정의

암호화폐(Cryptocurrency)는 **암호화 기술을 사용하여 보안이 유지되는 디지털 화폐**입니다.

### 주요 특징

1. **탈중앙화**: 중앙 기관 없이 운영됩니다
2. **투명성**: 모든 거래가 블록체인에 기록됩니다
3. **불변성**: 한번 기록된 데이터는 변경할 수 없습니다
4. **익명성**: 지갑 주소만으로 거래가 가능합니다

### 블록체인이란?

블록체인은 거래 정보를 담은 블록들이 체인처럼 연결된 분산 원장 기술입니다.

```
블록 1 → 블록 2 → 블록 3 → ...
```

각 블록에는 다음 정보가 포함됩니다:
- 거래 데이터
- 이전 블록의 해시값
- 타임스탬프
- 논스(Nonce)

### 왜 중요한가?

암호화폐는 금융의 미래를 바꿀 수 있는 혁신적인 기술입니다. 은행 없이도 전 세계 누구에게나 즉시 송금이 가능하고, 중개자 없이 자산을 직접 관리할 수 있습니다.',
'beginner', 'https://picsum.photos/seed/lesson1/800/400', 5, 'cadet', 1),

('지갑 만들기 가이드', '암호화폐를 보관할 지갑을 만드는 방법을 알아봅니다.', '## 암호화폐 지갑이란?

암호화폐 지갑은 **디지털 자산을 보관하고 관리하는 도구**입니다.

### 지갑의 종류

#### 1. 핫 월렛 (Hot Wallet)
- 인터넷에 연결된 지갑
- 편리하지만 해킹 위험 있음
- 예: MetaMask, Phantom, Trust Wallet

#### 2. 콜드 월렛 (Cold Wallet)
- 오프라인 지갑
- 보안이 뛰어남
- 예: Ledger, Trezor

### Phantom 지갑 만들기 (Solana)

1. **Chrome 확장 프로그램 설치**
   - phantom.app 방문
   - "Add to Chrome" 클릭

2. **새 지갑 생성**
   - "Create a new wallet" 선택
   - 비밀번호 설정

3. **시드 구문 저장** ⚠️ 매우 중요!
   - 12개 단어를 안전한 곳에 저장
   - 절대 다른 사람과 공유하지 마세요

4. **지갑 생성 완료!**
   - 공개 주소(Public Address) 확인
   - 이 주소로 암호화폐를 받을 수 있습니다

### 보안 팁

- 🔐 시드 구문은 오프라인에 보관
- ❌ 절대 화면 캡처하지 마세요
- ⚠️ 피싱 사이트 주의
- ✅ 공식 사이트에서만 다운로드',
'beginner', 'https://picsum.photos/seed/lesson2/800/400', 7, 'cadet', 2),

('첫 거래하기', '처음으로 암호화폐를 구매하고 전송하는 방법을 배웁니다.', '## 첫 거래 가이드

암호화폐를 구매하고 전송하는 방법을 단계별로 알아봅니다.

### 1. 거래소 선택하기

국내 주요 거래소:
- **업비트**: 국내 1위 거래량
- **빗썸**: 다양한 코인 지원
- **코인원**: 간편한 UI

해외 거래소:
- **바이낸스**: 세계 최대 거래소
- **코인베이스**: 초보자 친화적

### 2. 계정 만들기

1. 거래소 가입
2. 본인 인증 (KYC)
3. 보안 설정 (2FA 필수!)

### 3. 원화 입금

- 거래소에서 입금 계좌 확인
- 본인 명의 계좌에서 송금
- 보통 몇 분 내 반영

### 4. 암호화폐 구매

```
예: 10만원으로 비트코인 구매
1. BTC/KRW 마켓 선택
2. 매수 금액 입력: 100,000원
3. "시장가 매수" 클릭
4. 거래 완료!
```

### 5. 외부 지갑으로 전송

1. 지갑 주소 복사
2. 거래소에서 "출금" 선택
3. 주소 붙여넣기
4. 금액 입력 후 출금

⚠️ **주의**: 주소를 잘못 입력하면 자산을 잃을 수 있습니다!',
'beginner', 'https://picsum.photos/seed/lesson3/800/400', 8, 'cadet', 3),

('안전한 보관 방법', '암호화폐를 안전하게 보관하는 방법과 보안 팁을 알려드립니다.', '## 암호화폐 보안 가이드

자산을 안전하게 지키는 방법을 알아봅니다.

### 보안의 3요소

1. **시드 구문 관리**
2. **2단계 인증 (2FA)**
3. **피싱 방지**

### 시드 구문 보관 방법

#### ✅ 좋은 방법
- 종이에 적어서 금고에 보관
- 스테인리스 스틸 플레이트에 각인
- 여러 장소에 분산 보관

#### ❌ 나쁜 방법
- 스마트폰에 저장
- 클라우드에 업로드
- 스크린샷 찍기
- 다른 사람에게 공유

### 2단계 인증 설정

```
추천 앱:
- Google Authenticator
- Authy
- Microsoft Authenticator
```

SMS 인증보다 OTP 앱이 더 안전합니다!

### 피싱 사기 예방

1. **URL 항상 확인**
   - phantom.app ✅
   - phantomm.app ❌

2. **공식 채널만 사용**
   - 디스코드 DM 주의
   - "에어드랍" 사기 주의

3. **서명 요청 꼼꼼히 확인**
   - 무엇에 서명하는지 읽기
   - 의심되면 거절

### 자산 분산

> "모든 달걀을 한 바구니에 담지 마라"

- 거래용: 핫 월렛 (소액)
- 장기 보관: 콜드 월렛 (대부분)',
'beginner', 'https://picsum.photos/seed/lesson4/800/400', 6, 'cadet', 4),

-- 중급 (Intermediate) - Navigator 이상 접근
('차트 읽는 법', '캔들스틱 차트와 기본적인 기술적 분석을 배웁니다.', '## 차트 분석 기초

가격 차트를 읽고 분석하는 방법을 배웁니다.

### 캔들스틱 이해하기

```
    ┃  ← 윗꼬리 (고가)
  ┏━┻━┓
  ┃   ┃ ← 몸통
  ┗━┳━┛
    ┃  ← 아랫꼬리 (저가)
```

- **양봉 (녹색)**: 시가 < 종가 (상승)
- **음봉 (빨강)**: 시가 > 종가 (하락)

### 주요 캔들 패턴

#### 1. 도지 (Doji)
```
  ┃
━━╋━━
  ┃
```
시가 = 종가, 추세 전환 신호

#### 2. 망치형 (Hammer)
```
┏━┓
┗━┛
  ┃
  ┃
```
하락 후 반등 신호

#### 3. 역망치형 (Inverted Hammer)
```
  ┃
  ┃
┏━┓
┗━┛
```
상승 반전 가능성

### 지지선과 저항선

- **지지선**: 가격이 하락을 멈추는 가격대
- **저항선**: 가격이 상승을 멈추는 가격대

### 거래량의 중요성

> "거래량은 가격에 선행한다"

- 상승 + 높은 거래량 = 강한 상승
- 상승 + 낮은 거래량 = 약한 상승',
'intermediate', 'https://picsum.photos/seed/lesson5/800/400', 10, 'navigator', 5),

('DeFi 기초', '탈중앙화 금융의 핵심 개념과 프로토콜을 이해합니다.', '## DeFi란?

DeFi(Decentralized Finance)는 **블록체인 기반의 탈중앙화 금융 시스템**입니다.

### 기존 금융 vs DeFi

| 기존 금융 | DeFi |
|----------|------|
| 은행/기관 필요 | 스마트 컨트랙트 |
| 업무 시간 제한 | 24/7 운영 |
| 본인 인증 필요 | 지갑만 있으면 OK |
| 수수료 높음 | 상대적으로 낮음 |

### 주요 DeFi 서비스

#### 1. DEX (탈중앙화 거래소)
- Uniswap, Raydium, Jupiter
- 지갑 연결만으로 거래
- AMM(자동 마켓 메이커) 방식

#### 2. 렌딩 (Lending)
- Aave, Compound, Solend
- 암호화폐 예치 → 이자 수익
- 담보 대출 가능

#### 3. 이자 농사 (Yield Farming)
- 유동성 제공의 대가로 토큰 보상
- 높은 APY, 높은 위험

#### 4. 스테이블코인
- USDC, USDT, DAI
- 1달러 가치 유지
- DeFi의 기축통화 역할

### 주의사항

⚠️ **스마트 컨트랙트 리스크**
- 코드 버그 가능성
- 해킹 위험

⚠️ **비영구적 손실 (Impermanent Loss)**
- 유동성 제공 시 발생 가능
- 토큰 가격 변동에 따른 손실',
'intermediate', 'https://picsum.photos/seed/lesson6/800/400', 12, 'navigator', 6),

('NFT 이해하기', 'NFT의 개념과 활용 사례를 알아봅니다.', '## NFT란?

NFT(Non-Fungible Token)는 **대체 불가능한 토큰**입니다.

### 대체 가능 vs 대체 불가능

- **대체 가능**: 1비트코인 = 1비트코인 (동일)
- **대체 불가능**: 모나리자 ≠ 다른 그림 (고유)

### NFT의 특징

1. **고유성**: 각 NFT는 유일합니다
2. **소유권 증명**: 블록체인에 기록
3. **거래 가능**: 마켓플레이스에서 매매
4. **프로그래밍 가능**: 로열티 등 설정 가능

### NFT 활용 사례

#### 🎨 디지털 아트
- Beeple의 $69M 작품
- 디지털 아티스트의 새로운 수입원

#### 🎮 게임 아이템
- 캐릭터, 무기, 땅
- 게임 간 이동 가능

#### 🎵 음악
- 앨범 NFT
- 팬과의 직접 거래

#### 🎫 티켓/멤버십
- 위조 불가능
- 2차 거래 추적 가능

### NFT 마켓플레이스

- **OpenSea**: 최대 NFT 마켓
- **Magic Eden**: 솔라나 대표
- **Blur**: 트레이더용

### BeyondFleet NFT

BeyondFleet의 멤버십 NFT는:
- 등급별 혜택 제공
- 투표권 부여
- 커뮤니티 접근권',
'intermediate', 'https://picsum.photos/seed/lesson7/800/400', 8, 'navigator', 7),

('스테이킹 가이드', '스테이킹의 원리와 수익 창출 방법을 배웁니다.', '## 스테이킹이란?

스테이킹은 **암호화폐를 네트워크에 예치하여 보상을 받는 것**입니다.

### 작동 원리

```
1. 코인 예치 (Lock)
    ↓
2. 네트워크 검증 참여
    ↓
3. 보상 수령 (이자)
```

### PoS (Proof of Stake)

- 코인을 많이 예치할수록 검증 기회 증가
- 비트코인(PoW)보다 에너지 효율적
- 이더리움, 솔라나 등이 사용

### 스테이킹 방법

#### 1. 직접 스테이킹
- 노드 운영 필요
- 최소 수량 높음 (예: ETH 32개)
- 높은 보상, 높은 책임

#### 2. 위임 스테이킹
- 검증자에게 위임
- 적은 수량도 가능
- 수수료 발생

#### 3. 거래소 스테이킹
- 가장 간편
- 거래소가 대행
- 보상률 낮을 수 있음

### 주요 코인 스테이킹 보상

| 코인 | 연 수익률 |
|-----|----------|
| ETH | 4-5% |
| SOL | 6-7% |
| ADA | 4-5% |
| DOT | 12-15% |

### 리스크

⚠️ **락업 기간**
- 일정 기간 출금 불가
- 급락 시 대응 어려움

⚠️ **슬래싱**
- 검증자 잘못 시 패널티
- 스테이킹한 코인 일부 손실',
'intermediate', 'https://picsum.photos/seed/lesson8/800/400', 9, 'navigator', 8),

-- 고급 (Advanced) - Pilot 이상 접근
('기술적 분석 심화', '고급 기술적 분석 지표와 전략을 학습합니다.', '## 고급 기술적 분석

심화된 기술적 분석 도구를 배웁니다.

### 이동평균선 (MA)

#### 단순이동평균 (SMA)
```
SMA = (P1 + P2 + ... + Pn) / n
```

#### 지수이동평균 (EMA)
- 최근 가격에 더 높은 가중치
- SMA보다 빠른 반응

#### 골든크로스 & 데드크로스
- **골든크로스**: 단기 MA가 장기 MA 상향 돌파 → 매수 신호
- **데드크로스**: 단기 MA가 장기 MA 하향 돌파 → 매도 신호

### RSI (상대강도지수)

```
RSI = 100 - (100 / (1 + RS))
RS = 평균 상승폭 / 평균 하락폭
```

- **70 이상**: 과매수 (매도 고려)
- **30 이하**: 과매도 (매수 고려)

### MACD

```
MACD = 12일 EMA - 26일 EMA
Signal = MACD의 9일 EMA
```

- MACD > Signal: 상승 모멘텀
- MACD < Signal: 하락 모멘텀

### 볼린저 밴드

```
중심선 = 20일 SMA
상단밴드 = 중심선 + (2 × 표준편차)
하단밴드 = 중심선 - (2 × 표준편차)
```

- 밴드 수축: 변동성 감소, 큰 움직임 예고
- 밴드 확장: 변동성 증가

### 피보나치 되돌림

주요 레벨: 23.6%, 38.2%, 50%, 61.8%, 78.6%

> 61.8%는 "황금비율"로 가장 중요',
'advanced', 'https://picsum.photos/seed/lesson9/800/400', 15, 'pilot', 9),

('온체인 데이터 분석', '블록체인 데이터를 분석하여 시장을 읽는 방법을 배웁니다.', '## 온체인 분석

블록체인 데이터로 시장을 분석하는 방법을 배웁니다.

### 온체인 데이터란?

블록체인에 기록된 모든 거래 정보:
- 지갑 주소별 잔액
- 거래 내역
- 스마트 컨트랙트 활동

### 주요 온체인 지표

#### 1. 활성 주소 (Active Addresses)
- 네트워크 활동 지표
- 상승 → 관심 증가

#### 2. 거래소 유입/유출
```
거래소 유입 ↑ = 매도 압력 증가
거래소 유출 ↑ = 장기 보유 의사
```

#### 3. 고래 움직임
- 대량 보유자의 거래 추적
- 급격한 이동 = 시장 변동 예고

#### 4. SOPR (Spent Output Profit Ratio)
```
SOPR = 판매 가격 / 구매 가격
```
- SOPR > 1: 수익 실현
- SOPR < 1: 손실 실현

### 분석 도구

| 도구 | 특징 |
|-----|------|
| Glassnode | 가장 포괄적 |
| Nansen | 고래/펀드 추적 |
| Dune | 커스텀 대시보드 |
| Arkham | 지갑 레이블링 |

### 실전 활용

#### 바닥 신호
- 장기 보유자 축적 증가
- 거래소 유출 지속
- SOPR < 1 지속

#### 천장 신호
- 장기 보유자 매도 증가
- 거래소 유입 급증
- 레버리지 과열',
'advanced', 'https://picsum.photos/seed/lesson10/800/400', 12, 'pilot', 10),

('스마트 컨트랙트 이해', '스마트 컨트랙트의 작동 원리를 깊이 있게 이해합니다.', '## 스마트 컨트랙트란?

스마트 컨트랙트는 **블록체인에서 실행되는 자동화된 프로그램**입니다.

### 기본 개념

```
조건 충족 → 자동 실행 → 결과 기록
```

예시:
```
IF 입금액 >= 1 SOL
THEN NFT 전송
ELSE 트랜잭션 실패
```

### 주요 블록체인 비교

| 블록체인 | 언어 | 특징 |
|---------|------|------|
| Ethereum | Solidity | 가장 큰 생태계 |
| Solana | Rust | 빠른 속도, 낮은 수수료 |
| Polygon | Solidity | 이더리움 호환 |

### Solidity 기본 구조

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private value;

    function set(uint256 _value) public {
        value = _value;
    }

    function get() public view returns (uint256) {
        return value;
    }
}
```

### 스마트 컨트랙트 활용

1. **토큰 발행**: ERC-20, SPL 토큰
2. **NFT**: ERC-721, Metaplex
3. **DeFi**: 대출, 스왑, 스테이킹
4. **DAO**: 탈중앙화 투표

### 보안 취약점

⚠️ **재진입 공격 (Reentrancy)**
- 함수 호출 중 재호출
- The DAO 해킹 사례

⚠️ **정수 오버플로우**
- 숫자 범위 초과
- SafeMath 사용으로 방지

⚠️ **접근 제어 미비**
- 권한 검증 누락
- onlyOwner 패턴 사용',
'advanced', 'https://picsum.photos/seed/lesson11/800/400', 14, 'pilot', 11),

('투자 전략과 포트폴리오', '체계적인 투자 전략과 포트폴리오 관리 방법을 배웁니다.', '## 암호화폐 투자 전략

체계적인 투자 방법을 배웁니다.

### 투자 원칙

1. **손실 감당 가능 금액만 투자**
2. **분산 투자**
3. **장기적 관점**
4. **감정적 결정 금지**

### 투자 전략 유형

#### 1. 적립식 투자 (DCA)
```
매월 일정 금액 투자
예: 매월 1일, 50만원 BTC 매수
```
- 평균 매수가 효과
- 시장 타이밍 불필요
- 감정 배제

#### 2. 가치 투자
- 저평가된 프로젝트 발굴
- 펀더멘털 분석
- 장기 보유

#### 3. 모멘텀 투자
- 상승 추세 따라가기
- 기술적 분석 활용
- 빠른 손절 중요

### 포트폴리오 구성 예시

#### 보수적 포트폴리오
```
BTC 50% | ETH 30% | 스테이블 20%
```

#### 균형 포트폴리오
```
BTC 40% | ETH 25% | 알트코인 25% | 스테이블 10%
```

#### 공격적 포트폴리오
```
BTC 20% | ETH 20% | 알트코인 50% | 스테이블 10%
```

### 리밸런싱

```
목표: BTC 50%, ETH 50%
현재: BTC 60%, ETH 40%
→ BTC 일부 매도, ETH 매수
```

- 분기별 또는 비중 ±10% 시 실행
- 규칙 기반 실행

### 리스크 관리

- **손절선 설정**: -10% ~ -20%
- **포지션 크기**: 전체의 5-10% 이하
- **레버리지 제한**: 가급적 사용 안함',
'advanced', 'https://picsum.photos/seed/lesson12/800/400', 13, 'pilot', 12);


-- ==========================================
-- File: 20241204_admin_role.sql
-- ==========================================
-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Set coinkim00@gmail.com as admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'coinkim00@gmail.com';

-- If the user doesn't exist in profiles yet, we'll need to handle it on first login
-- This is handled by the auth trigger that creates profiles

-- Create a function to check admin role
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policy for admin access to profiles (admins can view all)
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Add RLS policy for admin to update profiles (for changing roles, membership tiers)
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );


-- ==========================================
-- File: 20241204_content_ideas.sql
-- ==========================================
-- Content Ideas table for admin memo feature
CREATE TABLE IF NOT EXISTS content_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  source_url TEXT,
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'idea' CHECK (status IN ('idea', 'in_progress', 'completed', 'archived')),
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_content_ideas_status ON content_ideas(status);
CREATE INDEX IF NOT EXISTS idx_content_ideas_tags ON content_ideas USING GIN(tags);

-- Enable RLS
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;

-- Only admins can access content ideas
CREATE POLICY "Admins can manage content ideas" ON content_ideas
  FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );


-- ==========================================
-- File: 20241204_news_table.sql
-- ==========================================
-- Create news table
CREATE TABLE IF NOT EXISTS news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  source VARCHAR(255),
  source_url TEXT,
  image_url TEXT,
  category VARCHAR(100) DEFAULT 'general',
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for published news
CREATE INDEX IF NOT EXISTS idx_news_published ON news(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);

-- Enable RLS
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Anyone can read published news
CREATE POLICY "Anyone can view published news" ON news
  FOR SELECT
  USING (is_published = true);

-- Admins can do everything
CREATE POLICY "Admins can manage news" ON news
  FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Trigger for updated_at
CREATE TRIGGER update_news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- File: 20241205_journal_entries.sql
-- ==========================================
-- Journal Entries table for Challenge Journal feature
-- Run this in Supabase Studio SQL Editor

DROP TABLE IF EXISTS journal_entries;

CREATE TABLE journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT,
  author_name TEXT DEFAULT '익명',
  title TEXT NOT NULL,
  content TEXT,
  goal_amount DECIMAL(20, 2),
  current_amount DECIMAL(20, 2),
  target_date DATE,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paused')),
  is_public BOOLEAN DEFAULT false,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT user_or_wallet CHECK (user_id IS NOT NULL OR wallet_address IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_journal_user_id ON journal_entries(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_journal_wallet ON journal_entries(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_journal_status ON journal_entries(status);
CREATE INDEX idx_journal_public ON journal_entries(is_public) WHERE is_public = true;
CREATE INDEX idx_journal_created_at ON journal_entries(created_at DESC);
CREATE INDEX idx_journal_likes ON journal_entries(likes DESC) WHERE is_public = true;

-- Disable RLS for simplicity (we check user/wallet in application code)
ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;


-- ==========================================
-- File: 20241205_journal_entries_v2.sql
-- ==========================================
-- Journal Entries table for Challenge Journal feature (v2)
-- Run this in Supabase Studio SQL Editor
-- This version removes the foreign key constraint for wallet-only users

-- Drop existing table if exists
DROP TABLE IF EXISTS journal_entries;

-- Create table without foreign key constraint for flexibility
CREATE TABLE journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,  -- No foreign key constraint for wallet-only users
  wallet_address TEXT,
  author_name TEXT DEFAULT '익명',
  title TEXT NOT NULL,
  content TEXT,
  goal_amount DECIMAL(20, 2),
  current_amount DECIMAL(20, 2),
  target_date DATE,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paused')),
  is_public BOOLEAN DEFAULT false,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_journal_user_id ON journal_entries(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_journal_wallet ON journal_entries(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_journal_status ON journal_entries(status);
CREATE INDEX idx_journal_public ON journal_entries(is_public) WHERE is_public = true;
CREATE INDEX idx_journal_created_at ON journal_entries(created_at DESC);
CREATE INDEX idx_journal_likes ON journal_entries(likes DESC) WHERE is_public = true;

-- Enable RLS but allow all operations for now
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read public entries
CREATE POLICY "Public entries are viewable by everyone"
  ON journal_entries
  FOR SELECT
  USING (is_public = true);

-- Policy: Users can read their own entries (by user_id)
CREATE POLICY "Users can view own entries by user_id"
  ON journal_entries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own entries
CREATE POLICY "Users can insert own entries"
  ON journal_entries
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR (user_id IS NULL AND wallet_address IS NOT NULL)
  );

-- Policy: Users can update their own entries
CREATE POLICY "Users can update own entries"
  ON journal_entries
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR (user_id IS NULL AND wallet_address IS NOT NULL)
  );

-- Policy: Users can delete their own entries
CREATE POLICY "Users can delete own entries"
  ON journal_entries
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR (user_id IS NULL AND wallet_address IS NOT NULL)
  );

-- For simplicity during development, allow anonymous access too
-- Remove these in production!
CREATE POLICY "Allow anonymous insert for development"
  ON journal_entries
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select for development"
  ON journal_entries
  FOR SELECT
  USING (true);

CREATE POLICY "Allow anonymous update for development"
  ON journal_entries
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow anonymous delete for development"
  ON journal_entries
  FOR DELETE
  USING (true);


-- ==========================================
-- File: 20241205_journal_simple.sql
-- ==========================================
-- Journal Entries table - SIMPLE VERSION (No RLS)
-- Run this in Supabase Studio SQL Editor
-- Use this for quick setup without RLS complexity

DROP TABLE IF EXISTS journal_entries;

CREATE TABLE journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  wallet_address TEXT,
  author_name TEXT DEFAULT '익명',
  title TEXT NOT NULL,
  content TEXT,
  goal_amount DECIMAL(20, 2),
  current_amount DECIMAL(20, 2),
  target_date DATE,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paused')),
  is_public BOOLEAN DEFAULT false,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_journal_user_id ON journal_entries(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_journal_wallet ON journal_entries(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_journal_public ON journal_entries(is_public) WHERE is_public = true;
CREATE INDEX idx_journal_created_at ON journal_entries(created_at DESC);

-- Disable RLS completely for development
ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;

-- Grant access to anon and authenticated roles
GRANT ALL ON journal_entries TO anon;
GRANT ALL ON journal_entries TO authenticated;


-- ==========================================
-- File: 20241205_premium_news.sql
-- ==========================================
-- Premium News System Migration
-- Add premium columns to news table

-- Add premium columns
ALTER TABLE news ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE news ADD COLUMN IF NOT EXISTS premium_category TEXT CHECK (premium_category IN ('institution', 'whale', 'analysis', 'prediction', 'etf'));
ALTER TABLE news ADD COLUMN IF NOT EXISTS required_tier TEXT CHECK (required_tier IN ('navigator', 'pilot', 'commander', 'admiral'));

-- Create indexes for premium news filtering
CREATE INDEX IF NOT EXISTS idx_news_premium ON news(is_premium) WHERE is_premium = true;
CREATE INDEX IF NOT EXISTS idx_news_premium_category ON news(premium_category) WHERE premium_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_news_required_tier ON news(required_tier) WHERE required_tier IS NOT NULL;

-- Update RLS policy to allow viewing premium news metadata (but content will be filtered in app)
-- Keep existing policy - premium filtering will be done at application level


-- ==========================================
-- File: 20241205_premium_news_automation.sql
-- ==========================================
-- Premium News Automation System Tables

-- Daily AI Reports table
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('cadet', 'navigator', 'pilot', 'commander', 'admiral')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  market_sentiment TEXT CHECK (market_sentiment IN ('bullish', 'bearish', 'neutral')),
  key_events JSONB DEFAULT '[]',
  price_prediction JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, tier)
);

-- Whale Transactions table
CREATE TABLE IF NOT EXISTS whale_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coin TEXT NOT NULL,
  amount DECIMAL(30, 8) NOT NULL,
  amount_usd DECIMAL(20, 2),
  from_address TEXT,
  to_address TEXT,
  from_label TEXT,
  to_label TEXT,
  tx_type TEXT CHECK (tx_type IN ('exchange_deposit', 'exchange_withdrawal', 'transfer', 'unknown')),
  tx_hash TEXT,
  blockchain TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  is_significant BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Analysis Jobs table (for tracking cron jobs)
CREATE TABLE IF NOT EXISTS ai_analysis_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type TEXT NOT NULL CHECK (job_type IN ('daily_report', 'whale_analysis', 'market_summary')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_reports_tier ON daily_reports(tier);
CREATE INDEX IF NOT EXISTS idx_whale_transactions_timestamp ON whale_transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whale_transactions_coin ON whale_transactions(coin);
CREATE INDEX IF NOT EXISTS idx_whale_transactions_significant ON whale_transactions(is_significant) WHERE is_significant = true;
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_analysis_jobs(status);

-- Enable RLS
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_reports
CREATE POLICY "Anyone can view cadet reports" ON daily_reports
  FOR SELECT USING (tier = 'cadet');

CREATE POLICY "Authenticated users can view based on tier" ON daily_reports
  FOR SELECT USING (true); -- App handles tier filtering

-- RLS Policies for whale_transactions
CREATE POLICY "Anyone can view whale transactions" ON whale_transactions
  FOR SELECT USING (true);

-- Admin policies
CREATE POLICY "Admins can manage daily_reports" ON daily_reports
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Admins can manage whale_transactions" ON whale_transactions
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Admins can manage ai_analysis_jobs" ON ai_analysis_jobs
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Service role bypass for cron jobs
CREATE POLICY "Service role can insert daily_reports" ON daily_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert whale_transactions" ON whale_transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage ai_analysis_jobs" ON ai_analysis_jobs
  FOR ALL USING (true);


-- ==========================================
-- File: 20241205_watchlist.sql
-- ==========================================
-- Watchlist table for user coin favorites
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  coin_symbol TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, coin_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_coin_id ON watchlist(coin_id);

-- Enable RLS
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own watchlist
CREATE POLICY "Users can view own watchlist" ON watchlist
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add to their own watchlist
CREATE POLICY "Users can add to own watchlist" ON watchlist
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove from their own watchlist
CREATE POLICY "Users can remove from own watchlist" ON watchlist
  FOR DELETE
  USING (auth.uid() = user_id);


-- ==========================================
-- File: 20241205_watchlist_v2.sql
-- ==========================================
-- Drop existing table if exists (for fresh start)
DROP TABLE IF EXISTS watchlist;

-- Watchlist table - supports both user_id and wallet_address
CREATE TABLE watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT,
  coin_id TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  coin_symbol TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Either user_id or wallet_address must be present
  CONSTRAINT user_or_wallet CHECK (user_id IS NOT NULL OR wallet_address IS NOT NULL),
  -- Unique per user_id + coin
  CONSTRAINT unique_user_coin UNIQUE (user_id, coin_id),
  -- Unique per wallet + coin
  CONSTRAINT unique_wallet_coin UNIQUE (wallet_address, coin_id)
);

-- Indexes
CREATE INDEX idx_watchlist_user_id ON watchlist(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_watchlist_wallet ON watchlist(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_watchlist_coin_id ON watchlist(coin_id);

-- Disable RLS for simplicity (or enable with proper policies)
ALTER TABLE watchlist DISABLE ROW LEVEL SECURITY;


-- ==========================================
-- File: 20241207_nft_purchase_system.sql
-- ==========================================
-- NFT 구매 시스템 마이그레이션
-- Metaplex Auction House 연동을 위한 스키마 확장

-- ============================================
-- 1. NFTs 테이블 확장
-- ============================================
ALTER TABLE nfts ADD COLUMN IF NOT EXISTS mint_address TEXT;
ALTER TABLE nfts ADD COLUMN IF NOT EXISTS owner_wallet TEXT;
ALTER TABLE nfts ADD COLUMN IF NOT EXISTS metadata_uri TEXT;
ALTER TABLE nfts ADD COLUMN IF NOT EXISTS collection_address TEXT;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_nfts_mint_address ON nfts(mint_address) WHERE mint_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nfts_owner_wallet ON nfts(owner_wallet) WHERE owner_wallet IS NOT NULL;

-- ============================================
-- 2. Auctions 테이블 확장 (스나이핑 방지)
-- ============================================
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS original_end_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS extension_count INTEGER DEFAULT 0;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS max_extensions INTEGER DEFAULT 12;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS seller_wallet TEXT;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS auction_house_address TEXT;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS listing_receipt TEXT;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS settlement_tx TEXT;

-- original_end_time이 없으면 end_time으로 채우기
UPDATE auctions SET original_end_time = end_time WHERE original_end_time IS NULL;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_auctions_seller_wallet ON auctions(seller_wallet) WHERE seller_wallet IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_auctions_end_time_active ON auctions(end_time) WHERE status = 'active';

-- ============================================
-- 3. Bids 테이블 확장
-- ============================================
ALTER TABLE bids ADD COLUMN IF NOT EXISTS bidder_wallet TEXT;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS tx_signature TEXT;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS is_refunded BOOLEAN DEFAULT FALSE;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS refund_tx TEXT;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_bids_bidder_wallet ON bids(bidder_wallet) WHERE bidder_wallet IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bids_tx_signature ON bids(tx_signature) WHERE tx_signature IS NOT NULL;

-- ============================================
-- 4. NFT 구매 기록 테이블 (신규)
-- ============================================
CREATE TABLE IF NOT EXISTS nft_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nft_id UUID REFERENCES nfts(id) ON DELETE SET NULL,
  buyer_wallet TEXT NOT NULL,
  seller_wallet TEXT NOT NULL,
  price DECIMAL(18, 8) NOT NULL,
  tx_signature TEXT NOT NULL UNIQUE,
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('fixed', 'auction', 'randombox')),
  fee_amount DECIMAL(18, 8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON nft_purchases(buyer_wallet);
CREATE INDEX IF NOT EXISTS idx_purchases_seller ON nft_purchases(seller_wallet);
CREATE INDEX IF NOT EXISTS idx_purchases_nft ON nft_purchases(nft_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created ON nft_purchases(created_at DESC);

-- RLS
ALTER TABLE nft_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view purchases"
  ON nft_purchases FOR SELECT
  USING (true);

CREATE POLICY "System can insert purchases"
  ON nft_purchases FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 5. 경매 정산 예약 함수 (Cron용)
-- ============================================
CREATE OR REPLACE FUNCTION get_pending_auction_settlements()
RETURNS TABLE (
  auction_id UUID,
  nft_id UUID,
  nft_name TEXT,
  winner_wallet TEXT,
  final_price DECIMAL,
  seller_wallet TEXT,
  end_time TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id as auction_id,
    a.nft_id,
    n.name as nft_name,
    a.highest_bidder as winner_wallet,
    a.current_bid as final_price,
    a.seller_wallet,
    a.end_time
  FROM auctions a
  JOIN nfts n ON a.nft_id = n.id
  WHERE a.status = 'active'
    AND a.end_time < NOW()
    AND a.highest_bidder IS NOT NULL
  ORDER BY a.end_time ASC;
END;
$$;

-- ============================================
-- 6. 스나이핑 방지 트리거 함수
-- ============================================
CREATE OR REPLACE FUNCTION check_auction_extension()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  five_minutes INTERVAL := '5 minutes';
  time_until_end INTERVAL;
BEGIN
  -- 새 입찰이 들어왔을 때만 실행
  IF TG_OP = 'UPDATE' AND NEW.current_bid > OLD.current_bid THEN
    -- 종료까지 남은 시간 계산
    time_until_end := NEW.end_time - NOW();

    -- 5분 이하이고, 최대 연장 횟수 미만인 경우
    IF time_until_end <= five_minutes
       AND time_until_end > '0 seconds'
       AND NEW.extension_count < NEW.max_extensions THEN
      -- 5분 연장
      NEW.end_time := NEW.end_time + five_minutes;
      NEW.extension_count := NEW.extension_count + 1;

      -- 로그 (optional)
      RAISE NOTICE 'Auction % extended by 5 minutes (extension #%)',
                   NEW.id, NEW.extension_count;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_auction_extension ON auctions;
CREATE TRIGGER trigger_auction_extension
  BEFORE UPDATE ON auctions
  FOR EACH ROW
  EXECUTE FUNCTION check_auction_extension();

-- ============================================
-- 7. 통계 뷰
-- ============================================
CREATE OR REPLACE VIEW nft_market_stats AS
SELECT
  COUNT(DISTINCT CASE WHEN is_listed THEN id END) as listed_count,
  COUNT(DISTINCT CASE WHEN NOT is_listed THEN id END) as sold_count,
  COALESCE(SUM(CASE WHEN is_listed THEN price END), 0) as total_listed_value,
  COALESCE(AVG(CASE WHEN is_listed THEN price END), 0) as avg_listed_price,
  (SELECT COUNT(*) FROM auctions WHERE status = 'active') as active_auctions,
  (SELECT COALESCE(SUM(price), 0) FROM nft_purchases) as total_volume
FROM nfts;

-- ============================================
-- 8. 권한 설정
-- ============================================
GRANT SELECT ON nft_market_stats TO anon;
GRANT SELECT ON nft_market_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_auction_settlements() TO authenticated;


-- ==========================================
-- File: 20241207_security_rls_fix.sql
-- ==========================================
-- Security Fix: Enable RLS on tables that had it disabled
-- Run this migration to enable proper Row Level Security

-- ============================================
-- 1. Watchlist Table - Enable RLS
-- ============================================
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can manage their own watchlist" ON watchlist;

-- Create policies for user_id based access
CREATE POLICY "Users can view own watchlist by user_id"
  ON watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist by user_id"
  ON watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist by user_id"
  ON watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for wallet_address based access (for non-authenticated wallet users)
CREATE POLICY "Anyone can view watchlist by wallet_address"
  ON watchlist FOR SELECT
  USING (wallet_address IS NOT NULL);

CREATE POLICY "Anyone can insert watchlist by wallet_address"
  ON watchlist FOR INSERT
  WITH CHECK (wallet_address IS NOT NULL AND user_id IS NULL);

CREATE POLICY "Anyone can delete own watchlist by wallet_address"
  ON watchlist FOR DELETE
  USING (wallet_address IS NOT NULL);

-- ============================================
-- 2. Journal Entries Table - Enable RLS
-- ============================================
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can manage own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Public entries viewable by all" ON journal_entries;

-- Public entries can be viewed by anyone
CREATE POLICY "Public journal entries viewable by all"
  ON journal_entries FOR SELECT
  USING (is_public = true);

-- Users can view their own entries (including private)
CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own entries
CREATE POLICY "Users can insert own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries
CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own entries
CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Wallet-based access for non-authenticated users
CREATE POLICY "Wallet users can view own journal entries"
  ON journal_entries FOR SELECT
  USING (wallet_address IS NOT NULL);

CREATE POLICY "Wallet users can insert journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (wallet_address IS NOT NULL AND user_id IS NULL);

CREATE POLICY "Wallet users can update own journal entries"
  ON journal_entries FOR UPDATE
  USING (wallet_address IS NOT NULL AND user_id IS NULL);

CREATE POLICY "Wallet users can delete own journal entries"
  ON journal_entries FOR DELETE
  USING (wallet_address IS NOT NULL AND user_id IS NULL);

-- ============================================
-- 3. Revoke direct table access from anon/authenticated
-- (RLS will handle access control)
-- ============================================
REVOKE ALL ON watchlist FROM anon;
REVOKE ALL ON watchlist FROM authenticated;
GRANT SELECT, INSERT, DELETE ON watchlist TO anon;
GRANT SELECT, INSERT, DELETE ON watchlist TO authenticated;

REVOKE ALL ON journal_entries FROM anon;
REVOKE ALL ON journal_entries FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON journal_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON journal_entries TO authenticated;

-- ============================================
-- 4. Add audit columns if not exists
-- ============================================
ALTER TABLE watchlist ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 5. Create trigger for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_watchlist_updated_at ON watchlist;
CREATE TRIGGER update_watchlist_updated_at
  BEFORE UPDATE ON watchlist
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


-- ==========================================
-- File: create_journal_comments.sql
-- ==========================================
-- journal_comments 테이블 생성
CREATE TABLE IF NOT EXISTS journal_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  wallet_address TEXT,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_journal_comments_journal_id ON journal_comments(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_comments_user_id ON journal_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_comments_created_at ON journal_comments(created_at);

-- RLS 활성화
ALTER TABLE journal_comments ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 사람이 댓글 조회 가능
CREATE POLICY "Anyone can view comments"
  ON journal_comments
  FOR SELECT
  USING (true);

-- 정책: 인증된 사용자가 댓글 작성 가능
CREATE POLICY "Authenticated users can insert comments"
  ON journal_comments
  FOR INSERT
  WITH CHECK (true);

-- 정책: 본인이 작성한 댓글만 삭제 가능
CREATE POLICY "Users can delete own comments"
  ON journal_comments
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR wallet_address IS NOT NULL
  );

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_journal_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_journal_comments_updated_at
  BEFORE UPDATE ON journal_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_journal_comments_updated_at();


-- ==========================================
-- File: 20241212_fix_comment_rls.sql
-- ==========================================
-- Fix: Allow anonymous users (wallet connected) to insert comments
-- Date: 2024-12-12
-- 1. Enable INSERT for anon users (with wallet_address)
CREATE POLICY "Anon users can insert comments with wallet" ON journal_comments FOR
INSERT WITH CHECK (
        wallet_address IS NOT NULL
        AND user_id IS NULL
    );
-- 2. Allow anon users to delete their own comments (by wallet_address)
-- Note: 'Users can delete own comments' might already exist but often checks auth.uid()
-- We ensure coverage for wallet_address specifically for anon role if not covered.
DROP POLICY IF EXISTS "Anon users can delete own comments" ON journal_comments;
CREATE POLICY "Anon users can delete own comments" ON journal_comments FOR DELETE USING (wallet_address IS NOT NULL);
-- 3. Ensure anon role has permission (just in case)
GRANT INSERT,
    DELETE ON journal_comments TO anon;

-- ==========================================
-- File: 20241216_daily_briefs.sql
-- ==========================================
-- Daily Briefs 테이블 (AI 일일 리포트)
-- ============================================

CREATE TABLE IF NOT EXISTS daily_briefs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_content TEXT NOT NULL,
  market_sentiment TEXT CHECK (market_sentiment IN ('bullish', 'bearish', 'neutral')),
  btc_price DECIMAL(18, 2),
  eth_price DECIMAL(18, 2),
  btc_change_24h DECIMAL(8, 2),
  eth_change_24h DECIMAL(8, 2),
  fear_greed_index INTEGER,
  key_events JSONB DEFAULT '[]',
  predictions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_daily_briefs_date ON daily_briefs(date DESC);

-- RLS 활성화
ALTER TABLE daily_briefs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 조회 가능 (등급별 접근 제어는 API에서 처리)
CREATE POLICY "Anyone can view daily briefs"
  ON daily_briefs FOR SELECT
  USING (true);

-- Service role만 생성/수정 가능
CREATE POLICY "Service role can insert daily briefs"
  ON daily_briefs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update daily briefs"
  ON daily_briefs FOR UPDATE
  USING (true);

-- 권한 부여
GRANT SELECT ON daily_briefs TO anon;
GRANT SELECT ON daily_briefs TO authenticated;


-- ==========================================
-- 2026 MIGRATIONS (DAILY BRIEF CMS & LEARNING SYSTEM)
-- ==========================================

-- 1. Daily Brief CMS fields
ALTER TABLE daily_briefs
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'market',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_daily_briefs_category
  ON daily_briefs(category);

CREATE INDEX IF NOT EXISTS idx_daily_briefs_tags
  ON daily_briefs USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_daily_briefs_published_featured
  ON daily_briefs(is_published, is_featured, date DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_briefs_one_featured
  ON daily_briefs(is_featured)
  WHERE is_featured = TRUE;

-- 2. Learning Progress System
CREATE TABLE IF NOT EXISTS learning_progress (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  lesson_title TEXT NOT NULL,
  lesson_xp INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS learning_saved_lessons (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  lesson_title TEXT NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS learning_recent_items (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('lesson', 'brief')),
  item_id TEXT NOT NULL,
  title TEXT NOT NULL,
  href TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS learning_user_stats (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user_completed
  ON learning_progress(user_id, completed, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_saved_lessons_user
  ON learning_saved_lessons(user_id, saved_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_recent_items_user
  ON learning_recent_items(user_id, viewed_at DESC);

ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_saved_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_recent_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learning progress"
  ON learning_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning progress"
  ON learning_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning progress"
  ON learning_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own learning progress"
  ON learning_progress FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own saved lessons"
  ON learning_saved_lessons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved lessons"
  ON learning_saved_lessons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved lessons"
  ON learning_saved_lessons FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own recent items"
  ON learning_recent_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recent items"
  ON learning_recent_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recent items"
  ON learning_recent_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recent items"
  ON learning_recent_items FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own learning stats"
  ON learning_user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning stats"
  ON learning_user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning stats"
  ON learning_user_stats FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Recommendation & Personalization Engine
CREATE TABLE IF NOT EXISTS user_interest_profiles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  topics JSONB DEFAULT '[]',
  dominant_track TEXT,
  learning_stage TEXT DEFAULT 'beginner' CHECK (learning_stage IN ('beginner', 'intermediate', 'adaptive')),
  confidence NUMERIC(4, 3) DEFAULT 0,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_interest_profiles_stage
  ON user_interest_profiles(learning_stage);

ALTER TABLE user_interest_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interest profile"
  ON user_interest_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interest profile"
  ON user_interest_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interest profile"
  ON user_interest_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Content Activation Phase
ALTER TABLE daily_briefs
  ADD COLUMN IF NOT EXISTS what_happened TEXT,
  ADD COLUMN IF NOT EXISTS why_it_matters TEXT,
  ADD COLUMN IF NOT EXISTS second_order_effects TEXT,
  ADD COLUMN IF NOT EXISTS risk_conditions TEXT,
  ADD COLUMN IF NOT EXISTS reflection_prompt TEXT,
  ADD COLUMN IF NOT EXISTS related_lesson_ids TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS editorial_quality_score INTEGER DEFAULT 0 CHECK (editorial_quality_score >= 0 AND editorial_quality_score <= 100),
  ADD COLUMN IF NOT EXISTS reading_level TEXT DEFAULT 'foundational',
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS editor_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_daily_briefs_reflection_prompt
  ON daily_briefs(date DESC)
  WHERE reflection_prompt IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_daily_briefs_related_lessons
  ON daily_briefs USING GIN(related_lesson_ids);

CREATE TABLE IF NOT EXISTS daily_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brief_id UUID REFERENCES daily_briefs(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  content TEXT NOT NULL,
  insight_type TEXT DEFAULT 'daily' CHECK (insight_type IN ('daily', 'assumption', 'idea', 'weekly_review')),
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'shared')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_reflections_user_created
  ON daily_reflections(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_reflections_brief
  ON daily_reflections(brief_id);

ALTER TABLE daily_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily reflections"
  ON daily_reflections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily reflections"
  ON daily_reflections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily reflections"
  ON daily_reflections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily reflections"
  ON daily_reflections FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS saved_assumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brief_id UUID REFERENCES daily_briefs(id) ON DELETE SET NULL,
  assumption TEXT NOT NULL,
  revisit_trigger TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revisited', 'retired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revisited_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_saved_assumptions_user_status
  ON saved_assumptions(user_id, status, created_at DESC);

ALTER TABLE saved_assumptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved assumptions"
  ON saved_assumptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved assumptions"
  ON saved_assumptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved assumptions"
  ON saved_assumptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved assumptions"
  ON saved_assumptions FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS reading_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brief_id UUID REFERENCES daily_briefs(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  reading_progress INTEGER DEFAULT 100 CHECK (reading_progress >= 0 AND reading_progress <= 100),
  UNIQUE(user_id, brief_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_completions_user_completed
  ON reading_completions(user_id, completed_at DESC);

ALTER TABLE reading_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reading completions"
  ON reading_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading completions"
  ON reading_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading completions"
  ON reading_completions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading completions"
  ON reading_completions FOR DELETE
  USING (auth.uid() = user_id);

-- 권한 부여
GRANT ALL ON TABLE learning_progress TO anon, authenticated, service_role;
GRANT ALL ON TABLE learning_saved_lessons TO anon, authenticated, service_role;
GRANT ALL ON TABLE learning_recent_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE learning_user_stats TO anon, authenticated, service_role;
GRANT ALL ON TABLE user_interest_profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE daily_reflections TO anon, authenticated, service_role;
GRANT ALL ON TABLE saved_assumptions TO anon, authenticated, service_role;
GRANT ALL ON TABLE reading_completions TO anon, authenticated, service_role;
