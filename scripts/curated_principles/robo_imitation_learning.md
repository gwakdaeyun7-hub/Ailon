---
difficulty: intermediate
connectionType: conceptual_borrowing
keywords: 모방 학습, 행동 복제, 역강화학습, 분포 이동, 인간 피드백 강화학습, DAgger, 보상 해킹, 관찰학습
keywords_en: imitation learning, behavioral cloning, inverse reinforcement learning, distribution shift, RLHF, DAgger, reward hacking, observational learning
---
Imitation Learning - 인지심리학의 관찰학습 이론에서 영감을 받아, 전문가의 시연으로부터 보상 함수 없이 정책을 학습하는 기법

## 관찰학습: 시행착오 없이 배우는 능력

1961년 Albert Bandura의 보보 인형 실험(Bobo doll experiment)에서 아이들은 성인이 인형을 때리는 모습을 **지켜보기만** 했을 뿐인데, 이후 같은 공격 행동을 재현했다. 아이에게 직접적인 보상이나 벌은 없었다. Bandura는 이 결과를 바탕으로 사회학습 이론(Social Learning Theory, 1977)을 체계화하며, 인간 학습에는 두 가지 경로가 있다고 주장했다. 하나는 직접 시행착오를 겪는 것이고, 다른 하나는 **타인의 행동을 관찰하는 것**이다.

Bandura는 관찰학습의 네 단계를 제시했다. (1) 주의(attention) -- 시범자의 행동에 집중, (2) 파지(retention) -- 관찰한 행동을 기억에 부호화, (3) 재생(reproduction) -- 기억을 실제 행동으로 출력, (4) 동기(motivation) -- 예상 보상에 따라 실행 여부를 결정. 이 중 1~3단계가 AI 모방 학습의 계산적 대응물이다. 데이터를 입력받고(주의), 모델 파라미터로 인코딩하고(파지), 새로운 상태에서 행동을 출력한다(재생). 4단계(동기)는 역강화학습(IRL)과 RLHF에서 별도로 구현된다.

Skinner식 행동주의 -- "보상을 받으면 그 행동을 반복한다" -- 가 강화학습(RL)의 기원이라면, Bandura의 관찰학습은 모방 학습의 인지과학적 기원이다. 핵심 직관은 같다. 직접 시행착오를 겪지 않아도, 누군가 하는 것을 보는 것만으로 배울 수 있다.

## 인지심리학에서 알고리즘으로

왜 시연으로 배우려 하는가? 강화학습의 고전적 접근은 보상 함수(reward function)를 설계하고 에이전트가 시행착오로 최적 정책을 찾는 것이다. 그런데 "안전하고 편안한 자율주행"을 수식으로 명시하려면 어떤 항목을 넣어야 하는가? 차선 유지 거리, 급브레이크 빈도, 승객 머리의 횡가속도 -- 항목 수가 한없이 늘어나고, 가중치 하나를 잘못 잡으면 위험한 운전이 "최적"이 된다. 반면 운전 교관이 30분간 시범을 보여주는 것은 간단하다.

모방 학습(Imitation Learning)은 Bandura의 관찰학습을 계산으로 옮긴 것이다. 전문가가 보여주면, 에이전트가 관찰하여 정책(policy)을 학습한다. 핵심 대응 관계는 다음과 같다.

- 시범자의 행동 관찰 --> **전문가 시연 데이터 (s, a) 수집** (상태-행동 쌍)
- 행동의 기억 부호화 --> **모델 파라미터 학습** (신경망 가중치 갱신)
- 새 상황에서 행동 재생 --> **학습된 정책의 추론** (pi(s) -> a)
- 보상/벌 없이 학습 --> **보상 함수 설계 불필요**
- 시범자의 숨겨진 의도 추론 --> **역강화학습(IRL)으로 보상 함수 역추론**

선구적 사례가 Pomerleau(1989)의 ALVINN(Autonomous Land Vehicle In a Neural Network)이다. 3층 신경망이 카메라 이미지에서 직접 조향 명령을 출력하여 실제 도로에서 자율주행을 시연했다. 1989년에 종단간(end-to-end) 학습이라는 개념이 실현된 것은, Bandura의 "관찰만으로 배운다"는 직관이 기계에서 작동할 수 있음을 보인 초기 사례다.

## 행동 복제와 분포 이동: 핵심 메커니즘

행동 복제(Behavioral Cloning, BC)는 가장 단순한 모방 학습이다. 전문가의 상태-행동 쌍 (s, a)를 지도학습 데이터로 직접 사용한다.

pi = argmin E_{(s,a) ~ D} [L(pi(s), a)]

D는 전문가 시연 데이터셋이고, L은 손실 함수다. 연속 행동이면 MSE(평균 제곱 오차), 이산 행동이면 교차 엔트로피를 쓴다. "이 상태에서 전문가는 무엇을 했는가?"를 학습하는 분류 또는 회귀 문제다.

그런데 BC에는 근본적 결함이 있다. **분포 이동(distribution shift)**이다. 학습 중 에이전트는 전문가가 방문한 상태 분포에서만 데이터를 본다. 실행 시 에이전트의 작은 오류가 전문가가 방문하지 않았던 상태로 이끌고, 그 낯선 상태에서 더 큰 오류가 발생하며, 다시 더 낯선 상태로 이끈다. Ross & Bagnell(2010)은 이 복합 오류(compounding error)가 시간 스텝 T에 대해 O(T^2)로 누적됨을 보였다.

공간적으로 상상하면 이렇다. 전문가가 좁은 산길의 정중앙을 걷는 시범을 보여준다. BC 에이전트는 정중앙 걷기만 배웠다. 어느 순간 바람에 5cm 밀려나면, "가장자리에서 중앙으로 복귀하는 법"은 배운 적이 없으므로 더 밀려나고, 결국 절벽 아래로 떨어진다. T=100스텝 후 오류가 10,000배 누적되는 것이다. 반대로 오류가 O(T)로만 쌓인다면 -- 즉 매 스텝 독립적으로 작은 오류만 발생한다면 -- 경로 이탈이 천천히 진행되어 복구 가능성이 있다. BC의 O(T^2)는 이전 오류가 다음 오류를 증폭하기 때문에 발생하는 것이며, 이것이 BC의 실용적 한계를 결정한다.

## 핵심 트레이드오프: 단순성 대 일반화

모방 학습의 각 방법은 "구현의 단순성"과 "전문가 분포 바깥으로의 일반화 능력" 사이에서 다른 지점을 선택한다.

행동 복제(BC)는 지도학습 하나로 끝나므로 구현이 가장 단순하지만, 전문가가 방문하지 않은 상태에 대한 대응 능력이 가장 낮다. Ross, Gordon & Bagnell(2011)의 DAgger(Dataset Aggregation)는 이 트레이드오프를 반복적으로 좁힌다. (1) 초기 데이터로 정책 pi_1을 학습하고, (2) pi_1으로 환경을 실행해 상태를 수집하고, (3) 전문가에게 그 상태에서의 올바른 행동을 라벨링 요청하고, (4) 새 데이터를 기존에 추가하여 재학습한다. T 라운드 후 성능이 최적 정책 대비 O(1/T)로 수렴한다. 대가는 전문가를 반복적으로 호출해야 한다는 것이다.

역강화학습(IRL)은 행동이 아니라 행동 뒤의 보상 함수를 추론하므로 일반화 능력이 가장 높지만, 계산 비용이 가장 크다. "같은 상태에서 전문가가 왼쪽으로도, 오른쪽으로도 가는 시연"이 있을 때 BC는 평균(직진)이라는 잘못된 행동을 출력하지만, IRL은 두 방향 모두 높은 보상을 주는 보상 함수를 학습할 수 있다. 그러나 IRL 내부에서 RL을 풀어야 하므로 연산량이 급증한다.

이 스펙트럼에서 각 방법의 위치를 정리하면: BC(최소 비용, 최소 일반화) < DAgger(중간, 전문가 반복 필요) < IRL(최대 비용, 최대 일반화).

## 이론적 심화: 역강화학습과 최대 엔트로피 원칙

행동 복제가 "상태 -> 행동" 매핑을 직접 배운다면, 역강화학습(Inverse Reinforcement Learning, IRL)은 한 단계 더 깊이 들어간다. 전문가의 행동 뒤에 숨겨진 **보상 함수 자체**를 추론한다.

Ng & Russell(2000)이 정식화한 IRL의 핵심은 다음과 같다.

max_R [V^{pi_E}_R - max_pi V^pi_R]

전문가 정책 pi_E의 기대 보상이, 그 보상 함수 하에서 최적인 다른 어떤 정책보다도 높게 만드는 보상 함수 R을 찾는 것이다. "전문가가 최적이라면, 전문가를 최적으로 만드는 보상은 무엇인가?"라는 질문이다. 하지만 이 문제는 근본적으로 미결정(ill-posed)이다. R=0이면 모든 정책이 최적이므로 자명한 해이고, 같은 정책을 최적으로 만드는 보상 함수가 무한히 많다.

Ziebart et al.(2008)의 최대 엔트로피 IRL(Maximum Entropy IRL)이 결정적 돌파구였다. 보상과 일관된 정책 중에서 **엔트로피가 최대인 것**을 선택한다. 이것은 정보이론에서 온 원리다. Jaynes의 최대 엔트로피 원칙 -- "관측 데이터와 일치하는 분포 중 가장 덜 편향된 것을 택하라" -- 을 IRL에 적용한 것이다. 결과적으로 경로 확률이 보상의 지수 함수에 비례하게 되어(높은 보상 경로일수록 높은 확률), 확률적 모델링이 자연스럽고 기울기 계산이 용이해졌다.

Ho & Ermon(2016)의 GAIL(Generative Adversarial Imitation Learning)은 IRL의 2단계 과정(보상 복원 후 RL로 정책 학습)을 하나로 통합했다. 판별자가 "이 행동이 전문가인가 학습자인가"를 구분하고, 정책이 판별자를 속이도록 학습한다. 보상 함수를 명시적으로 복원하지 않으면서도 전문가 수준의 정책을 얻는다.

## 현대 AI와의 연결

모방 학습의 아이디어는 현대 AI의 여러 영역에서 변형되어 살아 있다. 다만 각 연결의 성격은 다르다.

**관찰학습 직관의 직접적 계승:**

- **IRL에서 RLHF로의 계보**: IRL(Ng & Russell, 2000)은 "전문가 행동에서 보상을 추론하라"고 했다. Christiano et al.(2017)은 이 아이디어에 핵심 전환을 가했다. 전문가가 직접 시연하는 대신, 두 출력 중 어느 것이 더 나은지 **비교 판단**만 하면 된다. 좋은 글을 쓰는 것보다 두 글을 비교하는 것이 쉽다는 통찰이다. InstructGPT(Ouyang et al., 2022)가 이를 대규모 언어모델에 적용하여 ChatGPT의 기반이 되었다. IRL의 "보상 역추론"이 "인간 선호에서 보상 학습" -> "언어모델 정렬"로 진화한 것이다.
- **DPO의 단순화**: Rafailov et al.(2023)의 DPO(Direct Preference Optimization)는 RLHF를 더 단순화했다. RLHF의 최적해가 분석적 형태를 가진다는 수학적 사실을 이용하여, 보상 모델 학습과 RL 루프를 하나의 지도학습 목표로 통합했다. 모방 학습이 지도학습으로 시작했듯이, 정렬도 결국 지도학습 형태로 돌아온 셈이다.

**같은 직관을 독립적으로 공유하는 구조적 유사성:**

- **사전학습-미세조정 패러다임**: 대규모 언어모델이 인터넷 텍스트를 관찰하여 언어 패턴을 학습하는 사전학습(pre-training)은 Bandura의 관찰학습과 구조적으로 닮아 있다. 직접 과제를 수행하지 않고 타인의 텍스트를 관찰하는 것만으로 능력이 형성된다. 다만 이것이 역사적으로 관찰학습 이론에서 직접 영감을 받은 것인지는 확인되지 않는다.
- **로봇 원격 조종 학습**: Google DeepMind의 RT-2(Brohan et al., 2023)는 비전-언어 모델을 로봇 행동 예측에 적용했고, ACT(Zhao et al., 2023)는 트랜스포머로 행동 시퀀스를 청크 단위로 예측하여 100개의 시연만으로 정밀한 양팔 조작을 학습했다. 이들은 모방 학습의 직접적 후속 연구다.

## 한계와 약점

- **전문가 품질이 곧 천장**: 전문가의 시연 품질이 학습의 상한이다. 차선의 전문가에게 배우면 차선의 정책밖에 얻지 못한다. 전문가를 초월하려면 추가 RL이 필요하며, 이는 모방 학습만으로는 불가능한 영역이다.
- **보상 해킹**: RLHF에서 에이전트가 학습된 보상 모델의 허점을 악용하여, 인간이 의도하지 않은 방식으로 높은 보상을 받는 현상이다. 보상 모델이 인간 선호의 불완전한 근사이기 때문에 발생하며, IRL의 미결정 문제의 실용적 발현이다.
- **인과 관계 미학습**: BC는 상관관계만 학습한다. "비가 오면 와이퍼를 켠다"는 시연에서 "와이퍼를 켜면 비가 그친다"고 잘못 학습할 수 있다(인과 혼동). 전문가가 관측하지만 학습자에게 보이지 않는 숨겨진 상태 변수가 있으면 이 문제가 심화된다.
- **다모달 행동의 평균화**: 같은 교차로에서 전문가가 좌회전도, 우회전도 하는 시연이 있을 때, 평균을 내는 BC는 직진이라는 존재하지 않는 행동을 출력한다. 이를 해결하려면 혼합 밀도 네트워크나 확산 정책(diffusion policy) 같은 다모달 출력 모델이 필요하다.

## 용어 정리

관찰학습(observational learning) - Bandura가 체계화한 학습 유형. 직접 경험 없이 타인의 행동을 관찰하는 것만으로 새로운 행동을 습득하는 것

행동 복제(behavioral cloning) - 전문가의 상태-행동 쌍을 지도학습 데이터로 사용하여 정책을 학습하는 가장 기본적인 모방 학습 방법. Pomerleau(1989) ALVINN이 초기 사례

분포 이동(distribution shift) - 학습 시와 실행 시의 상태 분포가 달라지는 현상. 모방 학습에서 오류가 O(T^2)로 누적되는 주요 원인

역강화학습(inverse reinforcement learning) - 전문가의 시연에서 행동이 아닌 보상 함수를 역으로 추론하는 기법. Ng & Russell(2000)이 정식화

최대 엔트로피 IRL(Maximum Entropy IRL) - 관측 데이터와 일관된 분포 중 엔트로피가 최대인 것을 선택하는 원칙(Jaynes)을 IRL에 적용한 것. Ziebart et al.(2008)

적대적 모방 학습(GAIL) - GAN 구조를 활용하여 판별자가 전문가와 학습자의 행동을 구분하고 정책이 판별자를 속이도록 학습하는 기법. Ho & Ermon(2016)

인간 피드백 강화학습(RLHF) - 인간의 선호도 비교에서 보상 모델을 학습하고 그 보상으로 정책을 최적화하는 프레임워크. IRL의 "보상 역추론" 아이디어가 언어모델 정렬로 진화한 것

보상 해킹(reward hacking) - 에이전트가 학습된 보상 모델의 허점을 악용하여 인간이 의도하지 않은 방식으로 높은 보상을 받는 현상

복합 오류(compounding error) - 모방 학습에서 작은 행동 오류가 시간에 따라 누적되어 전문가 경로에서 점점 벗어나는 현상. 스텝 수 T에 대해 O(T^2)로 증가

미결정 문제(ill-posed problem) - 해가 유일하지 않거나 존재하지 않는 문제. IRL에서 같은 전문가 행동을 설명하는 보상 함수가 무한히 존재하는 것이 대표적 사례
---EN---
Imitation Learning - A technique inspired by cognitive psychology's observational learning theory, acquiring policies from expert demonstrations without explicit reward functions

## Observational Learning: Learning Without Trial and Error

In Albert Bandura's 1961 Bobo doll experiment, children who merely **watched** an adult hit a doll later reproduced the same aggressive behavior. No direct reward or punishment was given to the children. Building on this, Bandura systematized Social Learning Theory (1977), arguing that human learning has two pathways: one through direct trial and error, and another through **observing others' behavior**.

Bandura proposed four stages of observational learning: (1) Attention -- focusing on the model's behavior, (2) Retention -- encoding observed behavior into memory, (3) Reproduction -- outputting remembered behavior as action, (4) Motivation -- deciding whether to execute based on expected rewards. Stages 1-3 correspond to AI imitation learning's computational counterparts: receiving data (attention), encoding into model parameters (retention), and outputting actions in new states (reproduction). Stage 4 (motivation) is separately implemented through inverse reinforcement learning (IRL) and RLHF.

If Skinnerian behaviorism -- "repeat behaviors that are rewarded" -- is the origin of reinforcement learning (RL), Bandura's observational learning is the cognitive science origin of imitation learning. The core intuition is the same: you can learn just by watching someone do it, without trial and error yourself.

## From Cognitive Psychology to Algorithm

Why learn from demonstrations? The classical RL approach designs a reward function and has agents find optimal policies through trial and error. But to mathematically specify "safe and comfortable autonomous driving," what terms should be included? Lane-keeping distance, hard-brake frequency, lateral head acceleration of passengers -- the list grows endlessly, and one misweighted term can make dangerous driving "optimal." In contrast, a driving instructor demonstrating for 30 minutes is straightforward.

Imitation Learning is the computational translation of Bandura's observational learning. When an expert shows how, the agent observes and learns a policy. The key correspondences are:

- Observing the model's behavior --> **Collecting expert demonstration data (s, a)** (state-action pairs)
- Encoding behavior into memory --> **Learning model parameters** (updating neural network weights)
- Reproducing behavior in new situations --> **Inference from the learned policy** (pi(s) -> a)
- Learning without reward/punishment --> **No reward function design needed**
- Inferring the model's hidden intentions --> **Reverse-inferring reward functions via IRL**

The pioneering example was Pomerleau's (1989) ALVINN (Autonomous Land Vehicle In a Neural Network). A 3-layer neural network directly output steering commands from camera images, demonstrating autonomous driving on real roads. Realizing end-to-end learning in 1989 was an early case showing that Bandura's intuition of "learning through observation alone" could work in machines.

## Behavioral Cloning and Distribution Shift: Core Mechanism

Behavioral Cloning (BC) is the simplest form of imitation learning. It directly uses expert state-action pairs (s, a) as supervised learning data:

pi = argmin E_{(s,a) ~ D} [L(pi(s), a)]

D is the expert demonstration dataset and L is the loss function -- MSE (mean squared error) for continuous actions, cross-entropy for discrete ones. It is a classification or regression problem: "what did the expert do in this state?"

However, BC has a fundamental flaw: **distribution shift**. During training, the agent only sees data from states the expert visited. During execution, small errors lead the agent to states the expert never visited, where larger errors occur, leading to even more unfamiliar states. Ross & Bagnell (2010) showed this compounding error accumulates as O(T^2) over time steps T.

Imagine it spatially: the expert demonstrates walking dead center along a narrow mountain trail. The BC agent has only learned center-walking. The moment wind pushes it 5cm off-center, it has never learned "how to recover from the edge to the center," so it drifts further and eventually falls off the cliff. After T=100 steps, errors compound 10,000-fold. By contrast, if errors accumulated only as O(T) -- each step producing small independent errors -- the path deviation would progress slowly enough to allow recovery. BC's O(T^2) arises because each error amplifies the next, and this determines BC's practical limits.

## Core Tradeoff: Simplicity vs. Generalization

Each imitation learning method occupies a different point on the tradeoff between "implementation simplicity" and "generalization beyond the expert's distribution."

Behavioral Cloning (BC) ends with a single supervised learning step, making it the simplest to implement, but has the weakest ability to handle states the expert never visited. Ross, Gordon & Bagnell's (2011) DAgger (Dataset Aggregation) iteratively narrows this tradeoff: (1) train policy pi_1 on initial data, (2) execute pi_1 in the environment and collect states, (3) ask the expert to label correct actions for those states, (4) add new data to the existing dataset and retrain. After T rounds, performance converges at O(1/T) relative to the optimal policy. The cost is requiring repeated expert queries.

Inverse Reinforcement Learning (IRL) infers the reward function behind behavior rather than behavior itself, giving it the strongest generalization, but at the highest computational cost. When demonstrations show the expert going both left and right from the same intersection, BC averages them into going straight -- a nonexistent action -- while IRL can learn a reward function that gives high reward to both directions. However, IRL must solve an RL problem internally, causing computation to surge.

The spectrum in summary: BC (minimum cost, minimum generalization) < DAgger (moderate, requires repeated expert access) < IRL (maximum cost, maximum generalization).

## Theoretical Depth: Inverse RL and the Maximum Entropy Principle

While behavioral cloning directly learns a "state to action" mapping, Inverse Reinforcement Learning (IRL) goes a level deeper, inferring the **reward function itself** hidden behind expert behavior.

The core of IRL, formalized by Ng & Russell (2000):

max_R [V^{pi_E}_R - max_pi V^pi_R]

Find a reward function R making the expert policy pi_E's expected return higher than any other policy optimal under that reward. The question: "If the expert is optimal, what reward makes the expert optimal?" But this problem is fundamentally ill-posed. R=0 makes all policies optimal (a trivial solution), and infinitely many reward functions make the same policy optimal.

Ziebart et al.'s (2008) Maximum Entropy IRL was the decisive breakthrough. Among policies consistent with the reward, select the one with **maximum entropy**. This applies an information-theoretic principle -- Jaynes' maximum entropy principle: "among distributions consistent with observations, choose the least biased one" -- to IRL. The result is that path probabilities become proportional to the exponential of rewards (higher-reward paths get higher probability), enabling natural probabilistic modeling and tractable gradient computation.

Ho & Ermon's (2016) GAIL (Generative Adversarial Imitation Learning) unified IRL's two-stage process (recover reward then learn policy via RL) into one. A discriminator distinguishes "is this behavior from the expert or the learner," and the policy learns to fool the discriminator. It achieves expert-level policy without explicitly recovering the reward function.

## Connections to Modern AI

Imitation learning's ideas live on in transformed forms across modern AI. However, the nature of each connection differs.

**Direct lineage from observational learning intuition:**

- **From IRL to RLHF**: IRL (Ng & Russell, 2000) said "infer reward from expert behavior." Christiano et al. (2017) introduced a key pivot: instead of the expert demonstrating directly, they need only make **comparative judgments** between two outputs. It is easier to compare two texts than to write a good one. InstructGPT (Ouyang et al., 2022) applied this to large language models, becoming the foundation for ChatGPT. IRL's "reward reverse-inference" evolved into "reward learning from human preferences" then "language model alignment."
- **DPO's simplification**: Rafailov et al.'s (2023) DPO (Direct Preference Optimization) further simplified RLHF. Leveraging the mathematical fact that RLHF's optimal solution has an analytical form, it unified reward model learning and the RL loop into a single supervised learning objective. Just as imitation learning began with supervised learning, alignment too has come full circle back to supervised form.

**Structural similarities sharing the same intuition independently:**

- **Pre-training paradigm**: Large language models learning language patterns by observing internet text during pre-training structurally resembles Bandura's observational learning -- capabilities form from observing others' text without performing the task directly. Whether this was historically inspired by observational learning theory is not confirmed.
- **Robot teleoperation learning**: Google DeepMind's RT-2 (Brohan et al., 2023) applied vision-language models to robot action prediction, and ACT (Zhao et al., 2023) used transformers to predict action sequences in chunks, learning precise bimanual manipulation from just 100 demonstrations. These are direct descendants of imitation learning research.

## Limitations and Weaknesses

- **Expert quality is the ceiling**: The quality of expert demonstrations is the upper bound of learning. A suboptimal expert yields only a suboptimal policy. Surpassing the expert requires additional RL -- a domain beyond imitation learning alone.
- **Reward hacking**: In RLHF, agents exploit weaknesses in the learned reward model to receive high rewards in unintended ways. This occurs because the reward model is an imperfect approximation of human preferences, and is the practical manifestation of IRL's ill-posedness.
- **Failure to learn causality**: BC learns only correlations. From "wipers turn on when it rains," it might learn "turning on wipers stops rain" (causal confusion). This worsens when variables observed by the expert are hidden from the learner.
- **Averaging multimodal actions**: When demonstrations show the expert turning both left and right at the same intersection, averaging-based BC outputs going straight -- an action that does not exist. Resolving this requires multimodal output models such as mixture density networks or diffusion policies.

## Glossary

Observational learning - a type of learning systematized by Bandura where new behaviors are acquired by observing others' actions without direct experience

Behavioral cloning - the most basic imitation learning method that learns a policy using expert state-action pairs as supervised learning data; Pomerleau's (1989) ALVINN was an early example

Distribution shift - the phenomenon where state distributions differ between training and execution; the main cause of O(T^2) compounding errors in imitation learning

Inverse reinforcement learning - a technique that reverse-infers the reward function rather than behavior from expert demonstrations; formalized by Ng & Russell (2000)

Maximum Entropy IRL - applying the principle of selecting the maximum-entropy distribution consistent with observed data (Jaynes) to IRL; Ziebart et al. (2008)

GAIL (Generative Adversarial Imitation Learning) - an imitation learning method using GAN structure where a discriminator distinguishes expert from learner behavior and the policy learns to fool it; Ho & Ermon (2016)

RLHF (Reinforcement Learning from Human Feedback) - a framework learning a reward model from human preference comparisons and optimizing a policy with that reward; the evolution of IRL's "reward reverse-inference" idea into language model alignment

Reward hacking - the phenomenon where an agent exploits weaknesses in the learned reward model to receive unintended high rewards

Compounding error - the phenomenon in imitation learning where small action errors accumulate over time, progressively diverging from the expert trajectory; grows as O(T^2) with time steps T

Ill-posed problem - a problem where the solution is not unique or does not exist; the classic example in IRL is the infinite number of reward functions explaining the same expert behavior
