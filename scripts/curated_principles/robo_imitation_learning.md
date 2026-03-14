---
difficulty: intermediate
connectionType: conceptual_borrowing
keywords: 모방 학습, 행동 복제, 역강화학습, 분포 이동, 인간 피드백 강화학습, DAgger, 시연 학습, 보상 해킹
keywords_en: imitation learning, behavioral cloning, inverse reinforcement learning, distribution shift, RLHF, DAgger, learning from demonstration, reward hacking
---
Imitation Learning and Learning from Demonstration - 인지심리학의 관찰학습 이론에서 영감을 받아, 전문가의 시연으로부터 정책을 학습하는 기법. IRL에서 RLHF로 이어지는 계보가 현대 AI 정렬의 핵심

## 인지심리학적 기원: 관찰학습

모방 학습의 지적 뿌리는 인지심리학에 있다. Albert Bandura(1977)의 **사회학습 이론(Social Learning Theory)**은 인간이 직접 경험(시행착오)뿐 아니라 **타인의 행동을 관찰**함으로써도 학습한다는 것을 체계적으로 이론화했다. 유명한 보보 인형 실험(Bobo doll experiment, 1961)에서 아이들은 성인이 인형을 공격하는 모습을 관찰한 것만으로 공격 행동을 학습했다. 직접적인 보상이나 벌 없이도 행동이 전이된 것이다.

Bandura는 관찰학습의 네 단계를 제시했다. (1) 주의(attention) -- 모델의 행동에 집중, (2) 파지(retention) -- 관찰한 행동을 기억으로 부호화, (3) 재생(reproduction) -- 기억된 행동을 실제로 수행, (4) 동기(motivation) -- 보상 기대에 의한 행동 실행 여부 결정. 이 프레임워크에서 AI의 모방 학습은 주로 1~3단계의 계산적 구현에 해당한다.

Skinner 식 행동주의(조건화에 의한 학습)가 강화학습의 기원이라면, Bandura의 관찰학습은 모방 학습의 인지과학적 기원이다. "직접 시행착오 없이 관찰만으로 배운다"는 핵심 직관이 AI의 모방 학습에 그대로 투영되어 있다.

## 왜 시연으로 배우는가

강화학습(RL)의 고전적 접근은 보상 함수(reward function)를 설계하고, 에이전트가 시행착오를 통해 최적 정책을 학습하는 것이다. 하지만 많은 실제 문제에서 좋은 보상 함수를 설계하는 것 자체가 극도로 어렵다. 자율주행의 "안전하고 편안한 운전"이란 무엇인가? 로봇 매니퓰레이터의 "자연스러운 동작"이란? 이런 행동은 인간이 쉽게 시연할 수 있지만, 수식으로 명시하기는 매우 어렵다.

모방 학습(Imitation Learning)은 바로 Bandura가 제시한 관찰학습의 계산적 구현이다. 전문가가 "어떻게 하는지" 보여주면, 에이전트가 그 시연을 관찰하여 정책을 학습한다. 보상 함수를 설계할 필요가 없다. 핵심 가정은 간단하다. 전문가의 행동이 곧 바람직한 행동이다.

## 행동 복제: 가장 단순한 접근

행동 복제(Behavioral Cloning, BC)는 전문가의 상태-행동 쌍 (s, a)를 지도학습 데이터로 직접 사용한다.

pi = argmin E_{(s,a) ~ D} [L(pi(s), a)]

D는 전문가 시연 데이터셋이고, L은 손실 함수(연속 행동이면 MSE, 이산 행동이면 교차 엔트로피)다. 본질적으로 "이 상태에서 전문가는 무엇을 했는가?"를 학습하는 분류 또는 회귀 문제다.

이 접근의 선구적 사례가 Pomerleau(1989)의 ALVINN(Autonomous Land Vehicle In a Neural Network)이다. 3층 신경망이 카메라 이미지에서 직접 조향 명령을 출력하여 실제 도로에서 자율주행을 시연했다. 1989년에 종단간(end-to-end) 학습이라는 개념이 실현된 것은 놀라운 성취였다.

## 분포 이동 문제

BC는 단순하지만 근본적 결함이 있다. **분포 이동(distribution shift)** 또는 **복합 오류(compounding error)** 문제다.

학습 시 에이전트는 전문가의 상태 분포에서 데이터를 본다. 하지만 실행 시 에이전트의 약간의 오류가 전문가가 방문하지 않았던 상태로 이끈다. 그 상태에서의 행동에 대해 학습한 적이 없으므로 더 큰 오류를 만들고, 그 오류가 다시 더 낯선 상태로 이끈다. 시간 스텝 T에 대해 오류가 O(T^2)로 누적된다(Ross & Bagnell, 2010).

직관적으로, 전문가에게 "정상 주행"만 배운 자율주행 차가 차선을 약간 벗어나는 순간, 차선 이탈 상태에서의 복구 방법을 배운 적이 없어 점점 더 벗어나는 것과 같다.

## DAgger: 반복적 해결

Ross, Gordon & Bagnell(2011)의 DAgger(Dataset Aggregation)는 분포 이동 문제에 대한 우아한 해법이다. 핵심 아이디어는 학습과 실행의 분포 불일치를 반복적으로 좁히는 것이다.

1. 초기 전문가 데이터로 정책 pi_1을 학습한다
2. pi_1으로 환경에서 실행하여 상태 시퀀스를 수집한다
3. 전문가에게 이 상태들에서의 올바른 행동을 **라벨링** 요청한다
4. 새 데이터를 기존 데이터셋에 추가하고 정책을 재학습한다
5. 반복한다

DAgger의 이론적 보장은 강력하다. T 라운드 후 학습된 정책의 성능이 최적 정책 대비 O(1/T)로 수렴한다. 분포 이동을 직접 해결하는 대신, 에이전트가 실제로 방문하는 상태에 대한 전문가 라벨을 확보하는 것이다.

## 역강화학습: 보상 자체를 학습하다

행동 복제가 "상태 → 행동" 매핑을 직접 배운다면, 역강화학습(Inverse Reinforcement Learning, IRL)은 한 단계 더 깊이 들어간다. 전문가의 행동 뒤에 숨겨진 **보상 함수 자체**를 추론한다.

Ng & Russell(2000)이 정식화한 IRL의 핵심은 다음과 같다.

max_R [V^{pi_E}_R - max_pi V^pi_R]

전문가 정책 pi_E의 기대 보상이, 그 보상 함수 하에서 최적인 다른 어떤 정책보다도 높게 만드는 보상 함수 R을 찾는 것이다. "전문가가 최적이라면, 전문가를 최적으로 만드는 보상은 무엇인가?"라는 질문이다.

하지만 IRL은 근본적으로 미결정(ill-posed) 문제다. 영(zero) 보상 함수가 항상 해이고(모든 정책이 최적), 무한히 많은 보상 함수가 같은 정책을 최적으로 만든다. Ng & Russell은 최대 마진 제약으로, Abbeel & Ng(2004)는 특징 기대(feature expectation) 매칭으로 이 모호성을 해소하려 했다.

Ziebart et al.(2008)의 최대 엔트로피 IRL(Maximum Entropy IRL)이 결정적 돌파구였다. 보상 함수와 일관된 정책 중에서 **엔트로피가 최대인 정책**을 선택한다는 원칙은, 관측된 행동 이상의 불필요한 가정을 최소화한다. 이것은 정보이론에서 온 원리(Jaynes의 최대 엔트로피 원칙)의 강화학습 적용이다. 경로 확률이 보상의 지수 함수에 비례하게 되어, 확률적 모델링이 자연스럽고 기울기 계산이 용이하다.

## GAIL: 적대적 모방 학습

Ho & Ermon(2016)의 **GAIL(Generative Adversarial Imitation Learning)**은 IRL의 발전에서 중요한 중간 다리다. IRL이 보상 함수를 명시적으로 복원한 뒤 RL로 정책을 학습하는 2단계 과정이라면, GAIL은 GAN의 구조를 빌려 이를 하나로 통합했다. 판별자(discriminator)가 "이 행동이 전문가인가 학습자인가"를 구분하고, 생성자(정책)가 판별자를 속이도록 학습한다. 보상 함수를 명시적으로 복원하지 않으면서도 전문가 수준의 정책을 얻는다. GAIL은 IRL의 계산 비용 문제를 해결하면서, "전문가처럼 행동하라"는 Bandura의 관찰학습 직관을 가장 직접적으로 구현한 알고리즘이다.

## IRL에서 RLHF로: 현대 AI 정렬의 계보

모방 학습의 아이디어가 현대 AI에서 가장 극적으로 실현된 것이 RLHF(Reinforcement Learning from Human Feedback)다. 이 계보를 추적하면 다음과 같다.

IRL(Ng & Russell, 2000)은 "전문가 행동에서 보상을 추론하라"고 했다. 하지만 전문가가 직접 시연하기 어려운 작업이 있다. 좋은 글을 쓰는 것보다 두 글 중 어느 것이 더 좋은지 판단하는 것이 쉽다. Christiano et al.(2017)은 이 통찰을 이용하여, 인간의 **선호도 비교**(preference comparison)에서 보상 모델을 학습하고, 그 보상으로 RL 정책을 최적화하는 RLHF 프레임워크를 제안했다.

InstructGPT(Ouyang et al., 2022)가 RLHF를 대규모 언어모델에 적용하여 GPT-3의 도움성과 안전성을 극적으로 개선했고, 이것이 ChatGPT의 기반이 되었다. IRL의 "보상 추론" 아이디어가, "인간 선호에서 보상 학습" → "언어모델 정렬"로 진화한 것이다.

Rafailov et al.(2023)의 DPO(Direct Preference Optimization)는 RLHF를 더 단순화했다. 보상 모델을 명시적으로 학습하지 않고, 선호 데이터에서 직접 정책을 최적화한다. 수학적으로 RLHF의 최적해가 분석적 형태를 가진다는 것을 이용하여, RL 루프를 제거하고 지도학습 형태로 변환했다.

## 로봇 학습에서의 발전

로봇 분야에서 모방 학습은 "사람처럼 움직이는 로봇"이라는 오랜 꿈에 가장 직접적인 경로다. 원격 조종(teleoperation)으로 수집한 시연 데이터에서 로봇 조작 정책을 학습하는 연구가 활발하다.

Google DeepMind의 RT-2(Brohan et al., 2023)는 비전-언어 모델을 로봇 행동 예측에 적용하여, 자연어 지시에 따라 로봇이 객체를 조작하는 것을 시연했다. 인터넷 스케일의 시각-언어 지식이 로봇 조작으로 전이되는 것으로, 언어 모방 학습과 물리적 모방 학습의 융합이다.

ACT(Action Chunking with Transformers, Zhao et al., 2023)는 트랜스포머 아키텍처로 행동 시퀀스를 청크 단위로 예측하여, 100개의 시연만으로 정밀한 양팔 조작 작업을 학습했다.

## 한계와 약점

모방 학습은 강력하지만 본질적 제약이 있다.

- **전문가 품질 의존**: 전문가의 시연 품질이 곧 학습의 상한이다. 차선의 전문가에게 배우면 차선의 정책밖에 얻지 못한다. 전문가보다 더 잘하려면 추가적인 RL이 필요하다.
- **분포 이동의 근본성**: DAgger가 이론적으로 해결하지만, 실시간 전문가 라벨링이 항상 가능한 것은 아니다. 자율주행 중 위험 상황에서 전문가에게 "지금 뭘 해야 하나요?"라고 물을 수 없다.
- **보상 해킹(reward hacking)**: RLHF에서 에이전트가 학습된 보상 모델의 허점을 악용하여, 인간이 의도하지 않은 방식으로 높은 보상을 받는 현상이다. 보상 모델이 인간 선호의 불완전한 근사이기 때문에 발생한다.
- **인과 관계 미학습**: BC는 상관관계만 학습한다. "비가 오면 와이퍼를 켠다"는 시연에서 "와이퍼를 켜면 비가 그친다"고 잘못 학습할 수 있다(인과 혼동). 전문가가 관측하지만 학습자에게 보이지 않는 변수(숨겨진 상태)가 있으면 이 문제가 심화된다.
- **다모달 행동 문제**: 같은 상태에서 전문가가 왼쪽으로도, 오른쪽으로도 가는 시연이 있으면, 평균을 내는 BC는 중간(직진)이라는 잘못된 행동을 학습한다. 이를 해결하려면 혼합 밀도 네트워크나 확산 모델 같은 다모달 출력 모델이 필요하다.

## 용어 정리

행동 복제(behavioral cloning) - 전문가의 상태-행동 쌍을 지도학습 데이터로 사용하여 정책을 학습하는 가장 기본적인 모방 학습 방법

분포 이동(distribution shift) - 학습 시와 실행 시의 상태 분포가 달라지는 현상. 모방 학습에서 복합 오류의 주요 원인

역강화학습(inverse reinforcement learning) - 전문가의 시연에서 보상 함수를 역으로 추론하는 기법. Ng & Russell(2000) 정식화

최대 엔트로피 IRL(Maximum Entropy IRL) - 관측 데이터와 일관된 분포 중 엔트로피가 최대인 것을 선택하는 원칙을 IRL에 적용. Ziebart et al.(2008)

인간 피드백 강화학습(RLHF) - 인간의 선호도 비교에서 보상 모델을 학습하고, 그 보상으로 정책을 최적화하는 프레임워크. ChatGPT 정렬의 핵심

직접 선호 최적화(DPO) - RLHF의 보상 모델 학습과 RL 최적화를 하나의 지도학습 목표로 통합한 방법. Rafailov et al.(2023)

보상 해킹(reward hacking) - 에이전트가 학습된 보상 모델의 약점을 악용하여 의도치 않은 높은 보상을 받는 현상

사회학습 이론(social learning theory) - Bandura(1977)가 제안한 이론. 인간은 직접 경험뿐 아니라 타인의 행동 관찰을 통해서도 학습한다는 관찰학습의 체계적 이론화

적대적 모방 학습(GAIL) - GAN 구조를 활용하여 전문가 행동과 학습자 행동을 판별자가 구분하고, 정책이 판별자를 속이도록 학습하는 모방 학습 기법. Ho & Ermon(2016)

원격 조종(teleoperation) - 인간이 원격으로 로봇을 직접 조종하여 시연 데이터를 수집하는 방법

복합 오류(compounding error) - 모방 학습에서 작은 행동 오류가 시간에 따라 누적되어 전문가 경로에서 점점 벗어나는 현상. 스텝 수 T에 대해 O(T^2)로 증가

---EN---
Imitation Learning and Learning from Demonstration - A technique inspired by cognitive psychology's observational learning theory, acquiring behavior from expert demonstrations without explicit reward functions. The IRL-to-RLHF lineage forms the core of modern AI alignment

## Cognitive Psychology Origin: Observational Learning

The intellectual roots of imitation learning lie in cognitive psychology. Albert Bandura's (1977) **Social Learning Theory** systematically theorized that humans learn not only through direct experience (trial and error) but also by **observing others' behavior**. In the famous Bobo doll experiment (1961), children learned aggressive behavior simply by watching an adult attack the doll -- without any direct reward or punishment.

Bandura proposed four stages of observational learning: (1) Attention -- focusing on the model's behavior, (2) Retention -- encoding observed behavior into memory, (3) Reproduction -- actually performing the remembered behavior, (4) Motivation -- deciding whether to execute based on expected rewards. AI's imitation learning corresponds primarily to the computational implementation of stages 1-3.

If Skinnerian behaviorism (learning through conditioning) is the origin of reinforcement learning, Bandura's observational learning is the cognitive science origin of imitation learning. The core intuition of "learning through observation alone without trial and error" is directly projected into AI's imitation learning.

## Why Learn from Demonstrations

The classical reinforcement learning (RL) approach designs a reward function and has agents learn optimal policies through trial and error. But in many real-world problems, designing a good reward function is itself extremely difficult. What constitutes "safe and comfortable driving" for autonomous vehicles? What is a "natural motion" for a robot manipulator? Humans can easily demonstrate such behaviors, but specifying them mathematically is very hard.

Imitation Learning is precisely the computational implementation of Bandura's observational learning. When an expert shows "how to do it," the agent observes those demonstrations and learns a policy. No reward function design is needed. The core assumption is simple: the expert's behavior is the desired behavior.

## Behavioral Cloning: The Simplest Approach

Behavioral Cloning (BC) directly uses expert state-action pairs (s, a) as supervised learning data:

pi = argmin E_{(s,a) ~ D} [L(pi(s), a)]

D is the expert demonstration dataset, and L is the loss function (MSE for continuous actions, cross-entropy for discrete). It is essentially a classification or regression problem of "what did the expert do in this state?"

The pioneering example was Pomerleau's (1989) ALVINN (Autonomous Land Vehicle In a Neural Network). A 3-layer neural network directly output steering commands from camera images, demonstrating autonomous driving on real roads. Realizing end-to-end learning in 1989 was a remarkable achievement.

## The Distribution Shift Problem

BC is simple but has a fundamental flaw: the **distribution shift** or **compounding error** problem.

During training, the agent sees data from the expert's state distribution. But during execution, the agent's slight errors lead to states the expert never visited. Having never learned actions for those states, it makes larger errors, which lead to even more unfamiliar states. Errors compound as O(T^2) over time steps T (Ross & Bagnell, 2010).

Intuitively, an autonomous car trained only on "normal driving" demonstrations has never learned recovery from lane departure -- so the moment it slightly drifts, it progressively drifts further.

## DAgger: Iterative Resolution

Ross, Gordon & Bagnell's (2011) DAgger (Dataset Aggregation) is an elegant solution to distribution shift. The key idea is iteratively narrowing the distribution mismatch between training and execution.

1. Train policy pi_1 on initial expert data
2. Execute pi_1 in the environment and collect state sequences
3. Ask the expert to **label** correct actions for these states
4. Add new data to the existing dataset and retrain the policy
5. Repeat

DAgger's theoretical guarantee is strong: after T rounds, the learned policy's performance converges at O(1/T) relative to the optimal policy. Rather than directly solving distribution shift, it secures expert labels for states the agent actually visits.

## Inverse Reinforcement Learning: Learning the Reward Itself

While behavioral cloning directly learns a "state to action" mapping, Inverse Reinforcement Learning (IRL) goes a level deeper, inferring the **reward function itself** hidden behind expert behavior.

The core of IRL, formalized by Ng & Russell (2000), is:

max_R [V^{pi_E}_R - max_pi V^pi_R]

Find a reward function R that makes the expert policy pi_E's expected return higher than any other policy optimal under that reward. The question is: "If the expert is optimal, what reward makes the expert optimal?"

However, IRL is fundamentally ill-posed. The zero reward function is always a solution (all policies are optimal), and infinitely many reward functions make the same policy optimal. Ng & Russell used maximum margin constraints, and Abbeel & Ng (2004) used feature expectation matching to resolve this ambiguity.

Ziebart et al.'s (2008) Maximum Entropy IRL was the decisive breakthrough. The principle of selecting the **maximum entropy policy** among those consistent with the reward function minimizes unnecessary assumptions beyond observed behavior. This applies an information-theoretic principle (Jaynes' maximum entropy principle) to reinforcement learning. Path probabilities become proportional to the exponential of rewards, enabling natural probabilistic modeling and tractable gradient computation.

## GAIL: Adversarial Imitation Learning

Ho & Ermon's (2016) **GAIL (Generative Adversarial Imitation Learning)** is an important intermediate bridge in IRL's evolution. While IRL recovers the reward function explicitly then learns a policy via RL in two stages, GAIL borrows the GAN structure to unify these into one. A discriminator distinguishes "is this behavior from the expert or the learner," while the generator (policy) learns to fool the discriminator. It achieves expert-level policy without explicitly recovering the reward function. GAIL solved IRL's computational cost problem while being the most direct implementation of Bandura's observational learning intuition -- "behave like the expert."

## From IRL to RLHF: The Lineage of Modern AI Alignment

Imitation learning's ideas are most dramatically realized in modern AI through RLHF (Reinforcement Learning from Human Feedback). Tracing this lineage:

IRL (Ng & Russell, 2000) said "infer reward from expert behavior." But some tasks are hard for experts to demonstrate directly. Judging which of two texts is better is easier than writing a good text. Christiano et al. (2017) exploited this insight, proposing the RLHF framework: learn a reward model from human **preference comparisons**, then optimize an RL policy with that reward.

InstructGPT (Ouyang et al., 2022) applied RLHF to large language models, dramatically improving GPT-3's helpfulness and safety -- becoming the foundation for ChatGPT. IRL's "reward inference" idea evolved into "reward learning from human preferences" then into "language model alignment."

Rafailov et al.'s (2023) DPO (Direct Preference Optimization) further simplified RLHF. Without explicitly learning a reward model, it optimizes the policy directly from preference data. Leveraging the fact that RLHF's optimal solution has an analytical form, it removes the RL loop and converts the problem to a supervised learning objective.

## Advances in Robot Learning

In robotics, imitation learning is the most direct path to the long-standing dream of "robots that move like humans." Research is active on learning robot manipulation policies from demonstration data collected through teleoperation.

Google DeepMind's RT-2 (Brohan et al., 2023) applied vision-language models to robot action prediction, demonstrating robots manipulating objects from natural language instructions. Internet-scale visual-language knowledge transferring to robot manipulation represents a fusion of linguistic and physical imitation learning.

ACT (Action Chunking with Transformers, Zhao et al., 2023) predicts action sequences in chunks using a transformer architecture, learning precise bimanual manipulation tasks from just 100 demonstrations.

## Limitations and Weaknesses

Imitation learning is powerful but has inherent constraints.

- **Expert quality dependency**: The quality of expert demonstrations is the upper bound of learning. Learning from a suboptimal expert yields only a suboptimal policy. Surpassing the expert requires additional RL.
- **Fundamentality of distribution shift**: DAgger resolves this theoretically, but real-time expert labeling is not always feasible. One cannot ask an expert "what should I do now?" during a dangerous autonomous driving situation.
- **Reward hacking**: In RLHF, agents exploit weaknesses in the learned reward model to receive high rewards in ways humans did not intend. This occurs because the reward model is an imperfect approximation of human preferences.
- **Failure to learn causality**: BC learns only correlations. From a demonstration of "turn on wipers when it rains," it might incorrectly learn "turning on wipers stops the rain" (causal confusion). This worsens when variables observed by the expert are hidden from the learner.
- **Multimodal action problem**: When demonstrations show the expert going both left and right from the same state, averaging-based BC learns the incorrect middle action (going straight). Resolving this requires multimodal output models such as mixture density networks or diffusion models.

## Glossary

Behavioral cloning - the most basic imitation learning method that learns a policy using expert state-action pairs as supervised learning data

Distribution shift - the phenomenon where state distributions differ between training and execution; the main cause of compounding errors in imitation learning

Inverse reinforcement learning - a technique that reverse-infers the reward function from expert demonstrations; formalized by Ng & Russell (2000)

Maximum Entropy IRL - applying the principle of selecting the maximum-entropy distribution consistent with observed data to IRL; Ziebart et al. (2008)

RLHF (Reinforcement Learning from Human Feedback) - a framework that learns a reward model from human preference comparisons and optimizes a policy with that reward; core of ChatGPT alignment

DPO (Direct Preference Optimization) - a method unifying RLHF's reward model learning and RL optimization into a single supervised learning objective; Rafailov et al. (2023)

Reward hacking - the phenomenon where an agent exploits weaknesses in the learned reward model to receive unintended high rewards

Social learning theory - Bandura's (1977) theory that humans learn not only through direct experience but also through observing others' behavior; the systematic theorization of observational learning

GAIL (Generative Adversarial Imitation Learning) - an imitation learning method using GAN structure where a discriminator distinguishes expert from learner behavior and the policy learns to fool it; Ho & Ermon (2016)

Teleoperation - a method of collecting demonstration data by having a human remotely control a robot directly

Compounding error - the phenomenon in imitation learning where small action errors accumulate over time, progressively diverging from the expert trajectory; grows as O(T^2) with time steps T
