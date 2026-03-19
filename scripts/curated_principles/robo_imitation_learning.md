---
difficulty: intermediate
connectionType: conceptual_borrowing
keywords: 모방 학습, 행동 복제, 역강화학습, 분포 이동, 인간 피드백 강화학습, DAgger, 보상 해킹, 관찰학습
keywords_en: imitation learning, behavioral cloning, inverse reinforcement learning, distribution shift, RLHF, DAgger, reward hacking, observational learning
---
Imitation Learning - 인지심리학의 관찰학습 이론에서 영감을 받아, 전문가의 시연으로부터 보상 함수 없이 정책을 학습하는 기법

## 관찰학습: 시행착오 없이 배우는 능력

1961년 Albert Bandura의 보보 인형 실험(Bobo doll experiment)에서 아이들은 성인이 인형을 때리는 모습을 **지켜보기만** 했을 뿐인데, 이후 같은 공격 행동을 재현했다. 아이에게 직접적인 보상이나 벌은 없었다. 당시 심리학은 Skinner의 행동주의(Behaviorism)가 지배하던 시기로, 모든 학습은 직접 행동하고 보상이나 벌을 받아야 성립한다는 것이 정설이었다. 관찰만으로 학습이 일어난다는 증거는 행동주의에서 인지혁명(Cognitive Revolution)으로의 전환점 중 하나가 되었다.

Bandura는 이를 바탕으로 사회학습 이론(Social Learning Theory, 1977)을 체계화하며, 인간 학습에는 두 가지 경로가 있다고 주장했다. 하나는 직접 시행착오를 겪는 것이고, 다른 하나는 **타인의 행동을 관찰하는 것**이다. 관찰학습은 단순 흉내가 아니다. 관찰자는 행동 패턴을 추상화하여 새로운 상황에 적용할 수 있다.

Bandura는 관찰학습의 네 단계를 제시했다. (1) 주의(attention), (2) 파지(retention), (3) 재생(reproduction), (4) 동기(motivation). 네 단계 모두 AI 모방 학습에 대응된다. 행동 복제(BC)에서는 전문가 데이터를 수집하고(주의), 신경망 파라미터로 인코딩하고(파지), 새로운 상태에서 행동을 출력하는(재생) 1~3단계가 직접 구현된다. 4단계(동기)는 "왜 그 행동을 했는가"에 해당하며, 역강화학습(IRL)이 보상 함수를 역추론하거나 RLHF가 인간 선호를 반영하는 방식으로 별도 구현된다.

강화학습의 직관적 뿌리가 Skinner의 행동주의(시행착오+보상)에 있다면, 모방 학습의 뿌리는 Bandura의 관찰학습이다 -- 시행착오 없이 관찰만으로 배울 수 있다. 단, RL의 수학적 기반은 Bellman(1957)과 제어이론도 포함하며 단일 기원으로 환원되지 않는다.

## 인지심리학에서 알고리즘으로

왜 시연으로 배우려 하는가? 강화학습은 보상 함수를 설계하고 시행착오로 최적 정책을 찾는다. 그런데 "안전하고 편안한 자율주행"을 수식으로 명시하려면 항목이 한없이 늘어나고, 가중치 하나를 잘못 잡으면 위험한 운전이 "최적"이 된다. 반면 운전 교관의 30분 시범은 간단하다.

모방 학습은 독립적으로 발전했지만, Bandura의 관찰학습과 깊은 구조적 대응을 보인다. 핵심 대응 관계는 다음과 같다.

- 시범자의 행동 관찰 --> **전문가 시연 데이터 (s, a) 수집** (상태-행동 쌍)
- 행동의 기억 부호화 --> **모델 파라미터 학습** (신경망 가중치 갱신)
- 새 상황에서 행동 재생 --> **학습된 정책의 추론** (pi(s) -> a)
- 보상/벌 없이 학습 --> **보상 함수 설계 불필요**
- 시범자의 숨겨진 의도 추론 --> **역강화학습(IRL)으로 보상 함수 역추론**

선구적 사례인 Pomerleau(1989)의 ALVINN은 3층 신경망이 카메라 이미지에서 조향 명령을 출력하여 자율주행을 시연했다. Bandura를 직접 참조하지 않았으나, "시연을 보고 배운다"는 문제 구조가 동일하다.

## 행동 복제와 분포 이동: 핵심 메커니즘

행동 복제(Behavioral Cloning, BC)는 가장 단순한 모방 학습이다. 전문가의 상태-행동 쌍을 지도학습 데이터로 직접 사용한다.

pi = argmin E_{(s,a) ~ D} [L(pi(s), a)]

pi는 정책(상태→행동 함수), D는 전문가 시연 데이터, L은 정책 출력과 전문가 행동 간의 손실 함수다. "이 상태에서 전문가는 무엇을 했는가?"를 학습하는 분류 또는 회귀 문제다.

그런데 BC에는 근본적 결함이 있다. **분포 이동(distribution shift)** -- 학습 데이터의 상태 분포(전문가가 방문한 상태들)와 실행 시 에이전트가 마주하는 상태 분포가 달라지는 현상이다. 실행 시 작은 오류가 전문가가 방문하지 않았던 상태로 에이전트를 이끌고, 그 낯선 상태에서 더 큰 오류가 발생하며, 이것이 다시 더 낯선 상태를 만든다. Ross & Bagnell(2010)은 이 복합 오류(compounding error)가 시간 스텝 T에 대해 O(T^2)로 누적됨을 증명했다.

공간적으로 비유하면, 전문가가 좁은 산길 정중앙을 걷는 시범을 보여준다. BC 에이전트가 바람에 5cm 밀려나면 "가장자리에서 복귀하는 법"을 배운 적이 없어 더 밀려나고 결국 절벽 아래로 떨어진다. 오류가 오류를 증폭하여 O(T^2)가 발생한다.

## 핵심 트레이드오프: 단순성 대 일반화

모방 학습의 각 방법은 "단순성"과 "일반화 능력" 사이에서 다른 지점을 선택한다.

행동 복제(BC)는 구현이 가장 단순하지만 일반화 능력이 가장 낮다. DAgger(Ross, Gordon & Bagnell, 2011)는 학습된 정책으로 환경을 실행해 새로운 상태를 수집하고, 전문가에게 라벨링을 요청하여 데이터를 반복 추가한다. 반복적 데이터 수집을 통해 BC의 O(T^2) 복합 오류를 O(T)로 줄인다 -- 제곱이 아닌 선형 누적으로 개선. 대가는 전문가를 반복 호출해야 한다는 것이다.

역강화학습(IRL, Ng & Russell, 2000)은 행동이 아니라 행동 뒤의 보상 함수를 추론하므로 일반화 능력이 가장 높지만, 계산 비용이 가장 크다. BC가 다모달 시연의 평균을 내어 잘못된 행동을 출력하는 반면, IRL은 여러 올바른 행동에 높은 보상을 주는 함수를 학습한다. Ziebart et al.(2008)의 최대 엔트로피 IRL은 Jaynes 원칙으로 미결정 문제를 해결했고, Ho & Ermon(2016)의 GAIL은 GAN으로 보상 복원과 정책 학습을 통합했다.

스펙트럼 요약: BC(최소 비용, 최소 일반화) < DAgger(중간, 전문가 반복 필요) < IRL(최대 비용, 최대 일반화).

## 현대 AI와의 연결

모방 학습의 아이디어는 현대 AI의 여러 영역에서 변형되어 살아 있다.

**관찰학습 직관의 직접적 계승:**

- **IRL에서 RLHF, DPO로의 계보**: IRL의 "시연에서 보상을 추론하라"가 출발점이다. Christiano et al.(2017)은 시연 대신 두 출력의 비교 판단으로 전환했고, InstructGPT(Ouyang et al., 2022)가 이를 LLM에 적용하여 ChatGPT의 기반이 되었다. DPO(Rafailov et al., 2023)는 보상 학습과 RL을 단일 지도학습 목표로 통합했다.

**같은 직관을 독립적으로 공유하는 구조적 유사성:**

- **사전학습-미세조정 패러다임**: LLM의 사전학습(인터넷 텍스트 관찰→언어 패턴 학습)은 관찰학습과 구조적으로 닮아 있으나, 역사적 영감 관계는 확인되지 않는다.
- **로봇 원격 조종 학습**: RT-2(Brohan et al., 2023)와 ACT(Zhao et al., 2023)는 비전-언어 모델과 소량 시연으로 로봇 조작을 학습하는 모방 학습의 직접적 후속 연구다.
- **확산 정책(Diffusion Policy)**: Chi et al.(2023)은 확산 모델을 행동 생성에 적용하여, BC의 다모달 행동 평균화 문제를 확산 과정의 다중 모드 분포 표현 능력으로 해결했다. 모방 학습의 활발한 현대적 발전 방향이다.

## 한계와 약점

- **전문가 품질이 곧 천장**: 전문가의 시연 품질이 학습의 상한이다. 전문가를 초월하려면 추가 RL이 필요하며, 이는 모방 학습만으로는 불가능한 영역이다.
- **보상 해킹**: RLHF에서 에이전트가 학습된 보상 모델의 허점을 악용하여 인간이 의도하지 않은 방식으로 높은 보상을 받는 현상이다. IRL의 미결정 문제의 실용적 발현이다.
- **인과 관계 미학습**: BC는 상관관계만 학습한다. "비가 오면 와이퍼를 켠다"는 시연에서 "와이퍼를 켜면 비가 그친다"고 잘못 학습할 수 있다(인과 혼동).
- **다모달 행동의 평균화**: 같은 교차로에서 전문가가 좌회전도, 우회전도 하는 시연이 있을 때, 평균을 내는 BC는 직진이라는 존재하지 않는 행동을 출력한다. 해결하려면 혼합 밀도 네트워크나 확산 정책 같은 다모달 출력 모델이 필요하다.

## 용어 정리

관찰학습(observational learning) - Bandura가 체계화한 학습 유형. 직접 경험 없이 타인의 행동을 관찰하는 것만으로 새로운 행동을 습득하는 것

행동 복제(behavioral cloning) - 전문가의 상태-행동 쌍을 지도학습 데이터로 사용하여 정책을 학습하는 가장 기본적인 모방 학습 방법

분포 이동(distribution shift) - 학습 시와 실행 시의 상태 분포가 달라지는 현상. 모방 학습에서 오류가 O(T^2)로 누적되는 주요 원인

역강화학습(inverse reinforcement learning) - 전문가의 시연에서 행동이 아닌 보상 함수를 역으로 추론하는 기법. Ng & Russell(2000) 정식화

적대적 모방 학습(GAIL) - GAN 구조를 활용하여 판별자가 전문가와 학습자의 행동을 구분하고 정책이 판별자를 속이도록 학습하는 기법. Ho & Ermon(2016)

인간 피드백 강화학습(RLHF) - 인간의 선호도 비교에서 보상 모델을 학습하고 그 보상으로 정책을 최적화하는 프레임워크

보상 해킹(reward hacking) - 에이전트가 학습된 보상 모델의 허점을 악용하여 인간이 의도하지 않은 방식으로 높은 보상을 받는 현상

복합 오류(compounding error) - 모방 학습에서 작은 행동 오류가 시간에 따라 누적되어 전문가 경로에서 점점 벗어나는 현상. O(T^2)로 증가

---EN---
Imitation Learning - A technique inspired by cognitive psychology's observational learning theory, acquiring policies from expert demonstrations without explicit reward functions

## Observational Learning: Learning Without Trial and Error

In Albert Bandura's 1961 Bobo doll experiment, children who merely **watched** an adult hit a doll later reproduced the same aggressive behavior. No direct reward or punishment was given. At the time, psychology was dominated by Skinner's Behaviorism, which held that learning requires direct action followed by reward or punishment. Evidence that observation alone produces learning became one of the turning points in the shift from behaviorism to the Cognitive Revolution.

Bandura systematized Social Learning Theory (1977), arguing that human learning has two pathways: direct trial and error, and **observing others' behavior**. Observational learning differs from parrot-like mimicry: the observer abstracts behavioral patterns and applies them to novel situations.

Bandura proposed four stages of observational learning: (1) Attention, (2) Retention, (3) Reproduction, (4) Motivation. All four find computational counterparts in AI imitation learning. In Behavioral Cloning (BC), stages 1-3 are directly implemented: collecting expert data (attention), encoding into neural network parameters (retention), and outputting actions in new states (reproduction). Stage 4 (motivation) corresponds to "why was that action taken" -- separately implemented through IRL reverse-inferring reward functions or RLHF incorporating human preferences.

The mathematical foundations of reinforcement learning (RL) include Bellman's dynamic programming (1957) and control theory, but the intuitive root of "learning through trial-and-error via reward signals" lies in Skinner's behaviorism. Likewise, the intuitive root of imitation learning lies in Bandura's observational learning: you can learn just by watching, without trial and error.

## From Cognitive Psychology to Algorithm

Why learn from demonstrations? The classical RL approach designs a reward function and has agents find optimal policies through trial and error. But mathematically specifying "safe and comfortable autonomous driving" requires an endlessly growing list of terms -- lane-keeping distance, hard-brake frequency, lateral acceleration -- and one misweighted term makes dangerous driving "optimal." In contrast, a driving instructor demonstrating for 30 minutes is straightforward.

Imitation Learning developed independently, but reveals deep structural correspondence with Bandura's observational learning. The key correspondences:

- Observing the model's behavior --> **collecting expert demonstration data (s, a)**
- Encoding behavior into memory --> **learning model parameters**
- Reproducing behavior in new situations --> **inference from the learned policy** (pi(s) -> a)
- Learning without reward/punishment --> **no reward function design needed**
- Inferring the model's hidden intentions --> **reverse-inferring reward functions via IRL**

The pioneering example was Pomerleau's (1989) ALVINN -- a 3-layer neural network outputting steering commands from camera images. Pomerleau did not reference Bandura directly, yet the problem structure -- "learning from demonstrations" -- is fundamentally the same.

## Behavioral Cloning and Distribution Shift: Core Mechanism

Behavioral Cloning (BC) is the simplest imitation learning, directly using expert state-action pairs as supervised learning data:

pi = argmin E_{(s,a) ~ D} [L(pi(s), a)]

Here pi is the policy being learned (a function deciding what action to take in a given state), s is the state, a is the action, D is the expert demonstration dataset, and L is a loss function measuring the error between the policy's output and the expert's action. In other words, a classification or regression problem: "what did the expert do in this state?"

However, BC has a fundamental flaw: **distribution shift** -- the state distribution in training data (states the expert visited) diverges from what the agent encounters during execution. Small errors push the agent into states the expert never visited, where larger errors occur, which in turn create even more unfamiliar states. Ross & Bagnell (2010) proved this compounding error accumulates as O(T^2) over time horizon T.

Imagine: the expert demonstrates walking dead center along a narrow mountain trail. The moment wind pushes the BC agent 5cm off-center, it has never learned "how to recover from the edge," so it drifts further and eventually falls off the cliff. Each error amplifies the next, producing O(T^2) -- this determines BC's practical limits.

## Core Tradeoff: Simplicity vs. Generalization

Each imitation learning method occupies a different point between "simplicity" and "generalization."

BC is simplest but has the weakest generalization. DAgger (Ross, Gordon & Bagnell, 2011) iteratively narrows this tradeoff by executing the learned policy, collecting new states, and asking the expert to label correct actions. Through iterative data collection, it reduces BC's O(T^2) compounding error to O(T) -- errors accumulate only linearly rather than quadratically over the time horizon. The cost: requiring repeated expert queries.

IRL (Ng & Russell, 2000) infers the reward function behind behavior, giving strongest generalization but highest computational cost. When demonstrations show the expert going both left and right at the same intersection, BC averages them into going straight -- a nonexistent action -- while IRL can learn a reward function rewarding both directions. Ziebart et al.'s (2008) Maximum Entropy IRL applied Jaynes' information-theoretic principle to resolve the ill-posedness, and Ho & Ermon's (2016) GAIL unified reward recovery and policy learning using GAN architecture.

The spectrum: BC (minimum cost, minimum generalization) < DAgger (moderate, requires repeated expert access) < IRL (maximum cost, maximum generalization).

## Connections to Modern AI

**Direct lineage from observational learning intuition:**

- **From IRL to RLHF to DPO**: IRL's "infer reward from demonstrations" was the starting point. Christiano et al. (2017) pivoted to comparative judgments, InstructGPT (Ouyang et al., 2022) applied this to LLMs as the foundation for ChatGPT, and DPO (Rafailov et al., 2023) unified reward learning and RL into a single supervised objective.

**Structural similarities sharing the same intuition independently:**

- **Pre-training paradigm**: LLM pre-training (observing internet text to learn language patterns) structurally resembles observational learning, though a direct historical inspiration is unconfirmed.
- **Robot teleoperation learning**: RT-2 (Brohan et al., 2023) and ACT (Zhao et al., 2023) use vision-language models and small demonstration sets for robot manipulation -- direct descendants of imitation learning.
- **Diffusion Policy**: Chi et al. (2023) applied diffusion models to action generation, addressing BC's multimodal averaging problem via multimodal distribution representation. An active modern frontier of imitation learning.

## Limitations and Weaknesses

- **Expert quality is the ceiling**: The quality of expert demonstrations is the upper bound. Surpassing the expert requires additional RL -- beyond imitation learning alone.
- **Reward hacking**: In RLHF, agents exploit weaknesses in the learned reward model. This is the practical manifestation of IRL's ill-posedness.
- **Failure to learn causality**: BC learns only correlations. From "wipers on when it rains," it might learn "turning wipers on stops rain" (causal confusion).
- **Averaging multimodal actions**: When demonstrations show both left and right turns at the same intersection, averaging-based BC outputs going straight -- a nonexistent action. Requires multimodal output models like mixture density networks or diffusion policies.

## Glossary

Observational learning - a learning type systematized by Bandura where new behaviors are acquired by observing others' actions without direct experience

Behavioral cloning - the most basic imitation learning method using expert state-action pairs as supervised learning data

Distribution shift - the phenomenon where state distributions differ between training and execution; main cause of O(T^2) compounding errors

Inverse reinforcement learning - a technique reverse-inferring the reward function from expert demonstrations; formalized by Ng & Russell (2000)

GAIL (Generative Adversarial Imitation Learning) - an imitation learning method using GAN structure where a discriminator distinguishes expert from learner behavior; Ho & Ermon (2016)

RLHF (Reinforcement Learning from Human Feedback) - a framework learning a reward model from human preference comparisons and optimizing a policy with that reward

Reward hacking - the phenomenon where an agent exploits weaknesses in the learned reward model to receive unintended high rewards

Compounding error - the phenomenon in imitation learning where small action errors accumulate over time, diverging from the expert trajectory; grows as O(T^2)
