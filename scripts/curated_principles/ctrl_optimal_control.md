---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 벨만 방정식, 동적 프로그래밍, 최적 제어, 가치 함수, Q-학습, 차원의 저주, 시간차 학습
keywords_en: Bellman equation, dynamic programming, optimal control, value function, Q-learning, curse of dimensionality, temporal difference learning
---
Bellman Equation and Dynamic Programming - 순차적 의사결정 문제를 재귀적으로 분해하는 원리로, 강화학습의 직접적 수학적 토대

## 최적 제어의 핵심 원리

1950년대 냉전기, RAND Corporation의 수학자 Richard Bellman(1920-1984)은 미사일 궤적 최적화, 자원 배분, 재고 관리 같은 문제들과 씨름하고 있었다. 이 문제들은 공통 구조를 가졌다. 결정을 한 번에 내리는 것이 아니라 시간에 걸쳐 연속적으로 내려야 하고, 지금의 선택이 미래의 선택지를 바꾼다는 것이다.

Bellman은 이 문제들을 관통하는 하나의 통찰을 발견했다. **최적성의 원리**(Principle of Optimality, 1957): 최적 경로의 어떤 부분 경로를 잘라내도, 그 부분 역시 해당 구간에서의 최적 경로다. 서울에서 부산까지의 최단 경로가 대전을 경유한다면, 대전에서 부산까지의 구간도 반드시 대전-부산 최단 경로여야 한다. 이 원리 덕분에, 거대한 문제를 작은 하위 문제들의 연쇄로 쪼갤 수 있다.

Bellman은 이 분해 기법을 동적 프로그래밍(Dynamic Programming)이라 명명했다. 이름의 유래가 흥미롭다. Bellman 자신의 회고에 따르면, 당시 RAND 후원자인 국방부 장관이 "연구"라는 단어를 싫어해서, 수학적 내용을 감추면서도 인상적으로 들리는 이름을 골랐다고 한다.

이 원리를 수학적으로 표현한 것이 벨만 방정식이다. 이산 시간, 유한 상태 공간에서의 형태는 다음과 같다.

V*(s) = max_a [R(s,a) + gamma * sum_s' P(s'|s,a) * V*(s')]

각 기호를 분해하면 다음과 같다.

- V*(s) --> 상태 s에서 출발했을 때 얻을 수 있는 최대 누적 보상
- max_a --> 가능한 모든 행동 a 중 최선의 선택
- R(s,a) --> 상태 s에서 행동 a를 취했을 때 받는 즉각 보상
- gamma --> 할인 인자 (0~1 사이, 미래 보상의 현재 가치 감소율)
- P(s'|s,a) --> 상태 s에서 행동 a를 취했을 때 상태 s'로 전이할 확률
- sum_s' --> 가능한 모든 다음 상태에 대한 기대값

이 방정식이 말하는 것은 명확하다. "지금 상태의 최적 가치 = 최선의 행동으로 얻는 즉각 보상 + 할인된 다음 상태의 최적 가치 기대값"이다. 현재와 미래가 재귀적으로 물려 있다. 연속 시간에서는 Hamilton-Jacobi-Bellman(HJB) 방정식으로 확장되며, 로켓 궤적 최적화나 연속 공정 제어에 쓰인다.

## 제어 이론에서 강화학습으로

벨만 방정식이 강화학습(RL)의 수학적 기반이 된 과정에는 두 가지 결정적 전환이 있었다.

첫째, **모델 기반에서 모델 프리로**. 원래 동적 프로그래밍은 전이 확률 P(s'|s,a)와 보상 함수 R(s,a)를 사전에 완벽히 안다고 가정한다. 공장의 기계를 제어할 때는 물리 법칙으로 전이 확률을 계산할 수 있지만, 로봇이 낯선 지형을 걷는 상황에서는 모델이 없다. Sutton(1988)의 시간차 학습(TD Learning)과 Watkins(1989)의 Q-학습(Q-Learning)이 이 벽을 넘었다. 모델 없이, 환경과 직접 상호작용한 경험 샘플만으로 가치 함수를 추정하는 방법을 제시한 것이다.

둘째, **연속에서 이산으로, 그리고 다시 근사로**. 원래 제어 이론은 연속 시간 시스템을 다루지만, RL은 이산 시간 스텝으로 전환했다. 이 전환에서 연속 시스템의 미세한 동역학 일부가 손실되지만, 계산적으로 다루기 훨씬 용이해진다.

핵심 대응 관계는 다음과 같다.

- 제어 이론의 상태 x(t) --> RL의 상태 s
- 제어 입력 u(t) --> RL의 행동 a
- 비용 함수 J (최소화 대상) --> RL의 보상 R (최대화 대상, 부호 반전)
- 최적 비용-투-고(cost-to-go) 함수 J*(x) --> RL의 최적 가치 함수 V*(s)
- HJB 방정식 --> 벨만 최적 방정식 (이산화 버전)
- 시스템 동역학 모델 --> 환경 전이 확률 (모델 프리에서는 직접 경험으로 대체)

보존된 것은 **재귀적 최적성의 구조** 그 자체다. 변형된 것은 연속을 이산으로, 모델 기반을 경험 기반으로 바꾼 점이다.

## 풀이 메커니즘: 가치 반복과 정책 반복

벨만 방정식을 직접 풀기 위한 두 가지 고전적 알고리즘이 있다.

1. **가치 반복**(Value Iteration): 임의의 초기 값에서 시작해 벨만 방정식을 모든 상태에 반복 적용한다. V(s) <- max_a [R(s,a) + gamma * sum_s' P(s'|s,a) * V(s')]. gamma < 1이면 수축 사상 정리(contraction mapping theorem)에 의해 반드시 수렴한다.
2. **정책 반복**(Policy Iteration): 두 단계를 교대한다. (1) 정책 평가 -- 현재 정책 pi에 대해 V^pi(s)를 계산한다. (2) 정책 개선 -- V^pi를 이용해 각 상태에서 더 나은 행동을 찾아 정책을 갱신한다. 가치 반복보다 반복 횟수가 적지만, 매 반복마다 선형 시스템을 풀어야 한다.

두 알고리즘 모두 **모든 상태를 명시적으로 열거**해야 한다. 여기서 Bellman이 직접 명명한 **차원의 저주**(Curse of Dimensionality)가 등장한다. 상태 변수가 n개이고 각각 m개의 값을 가지면, 상태 공간의 크기는 m^n이다. 바둑판은 361개 교차점에 각각 3가지 상태(흑, 백, 빈)가 가능해서 대략 3^361, 약 10^172개의 상태가 존재한다. 이것을 테이블에 저장하는 것은 물리적으로 불가능하다.

이 문제를 공간적으로 상상하면 이렇다. 가치 반복은 지도의 모든 격자점에 고도를 기록하는 것과 같다. 격자가 2차원이면 100x100 = 10,000개로 충분하지만, 10차원이면 100^10 = 10^20개의 점이 필요하다. 차원이 하나 늘 때마다 필요한 격자점 수가 100배씩 불어난다.

## 할인 인자 gamma: 현재와 미래의 균형

할인 인자 gamma는 미래 보상을 얼마나 중시할지를 결정하는 단일 파라미터다.

- gamma = 0이면 에이전트는 즉각 보상만 본다. 다음 한 걸음의 이득만 최대화하는 근시안적 행동이다.
- gamma = 1이면 먼 미래의 보상도 현재와 동일한 가치를 가진다. 이론적으로는 이상적이지만, 무한 합이 발산할 수 있어 수렴이 보장되지 않는다.
- gamma = 0.99면 100스텝 후의 보상은 현재 가치의 약 37%(0.99^100)로 축소된다. gamma = 0.999면 같은 보상이 약 90%(0.999^100)로 유지된다. 이 차이가 에이전트의 계획 지평선(planning horizon)을 실질적으로 결정한다.

gamma의 선택에는 이론적 최적값이 없다. 문제의 시간 규모에 맞춰 경험적으로 조정해야 하며, 이것이 벨만 방정식 기반 RL의 근본적 하이퍼파라미터 민감성이다.

## 함수 근사와 심층 강화학습

차원의 저주를 우회한 핵심 아이디어는 **함수 근사**(function approximation)다. 상태를 일일이 테이블에 기록하는 대신, 신경망에 상태를 입력하면 가치를 출력하도록 학습시킨다.

Watkins(1989)의 Q-학습은 상태-행동 쌍의 가치를 직접 학습한다. Q-함수의 벨만 방정식은 다음과 같다.

Q*(s,a) = R(s,a) + gamma * sum_s' P(s'|s,a) * max_a' Q*(s',a')

"상태 s에서 행동 a를 취한 후, 이후 항상 최적으로 행동했을 때의 기대 누적 보상"을 의미한다. V*(s) = max_a Q*(s,a)이므로 Q-함수를 알면 최적 정책도 자동으로 결정된다.

모델 프리 환경에서의 Q-학습 갱신 규칙은 다음과 같다.

Q(s,a) <- Q(s,a) + alpha * [r + gamma * max_a' Q(s',a') - Q(s,a)]

대괄호 안의 r + gamma * max_a' Q(s',a') - Q(s,a)를 TD 오차(temporal difference error)라 부른다. 실제 받은 보상 r과 다음 상태의 추정 가치를 합친 것에서, 현재 추정값을 뺀 차이다. 이 오차가 0에 수렴하면 벨만 방정식이 만족된다.

Mnih et al.(2015)의 **DQN**(Deep Q-Network)은 Q-테이블 대신 심층 신경망으로 Q(s,a; theta)를 근사하여, Atari 게임 49개에서 화면 픽셀을 직접 상태로 사용해 인간 수준 성능을 달성했다. 두 가지 핵심 기법이 있었다.

- 경험 재생(Experience Replay): 과거 경험 (s, a, r, s')을 버퍼에 저장하고 무작위로 꺼내 학습한다. 연속된 경험 간의 상관관계를 깨뜨려 학습을 안정화한다.
- 타깃 네트워크(Target Network): Q-값 갱신의 목표를 계산하는 네트워크를 주기적으로만 업데이트한다. 매 스텝마다 목표가 바뀌는 "움직이는 과녁" 문제를 완화한다.

이후 등장한 Actor-Critic 방법들(A3C, PPO, SAC)은 Bellman의 정책 반복의 현대적 변형이다. Actor가 정책을 직접 학습하고, Critic이 가치 함수를 추정해 Actor에게 피드백한다. 정책 평가-개선 사이클이 신경망 시대에 부활한 것이다.

## 현대 AI 기법과의 연결

벨만 방정식의 재귀적 최적성 구조는 현대 AI 곳곳에 살아 있다. 다만 각 연결의 성격이 다르다.

**직접적 수학적 기반:**

- **강화학습 전체 계열**: TD Learning, Q-Learning, SARSA, DQN, A3C, PPO, SAC 등 거의 모든 가치 기반 RL 알고리즘이 벨만 방정식의 변형을 핵심 갱신 규칙으로 사용한다. 이것은 영감이 아니라 직접적 수학적 동일성이다.
- **AlphaGo / AlphaZero**: Silver et al.(2016, 2017)의 몬테카를로 트리 탐색(MCTS)은 게임 트리에서 벨만 방정식의 재귀적 가치 평가를 확률적 샘플링으로 근사한다. AlphaZero는 인간 기보 없이 자기 대국만으로 학습하며, 벨만 방정식의 부트스트래핑(bootstrapping) 원리를 순수하게 구현했다. "현재 가치를 미래 가치 추정으로 갱신한다"는 것이 부트스트래핑이며, 이것은 벨만 방정식의 재귀 구조 그 자체다.

**동일한 원리의 독립적 재발견 (구조적 유사성):**

- **신경망 역전파의 동적 프로그래밍 구조**: 역전파 알고리즘은 출력층의 오차를 입력층 방향으로 전파하면서, 각 층의 그래디언트를 이전 층의 결과로부터 재귀적으로 계산한다. 이것은 동적 프로그래밍의 재귀 분해와 구조적으로 동일하지만, 역사적으로 벨만 방정식에서 직접 영감을 받은 것은 아니다.
- **Viterbi 알고리즘**: 은닉 마르코프 모델(HMM)에서 가장 가능성 높은 상태 시퀀스를 찾는 이 알고리즘은 동적 프로그래밍의 직접 적용이다. 음성 인식 시스템에서 오랫동안 핵심 역할을 했다.

## 한계와 약점

- **차원의 저주는 완화되었을 뿐 해결되지 않았다**: 함수 근사가 완화책이지 해결책은 아니다. 함수 근사 + 부트스트래핑 + 오프 정책 학습의 조합이 발산할 수 있다는 "치명적 삼중주"(deadly triad, Sutton & Barto 2018) 문제가 여전히 남아 있다.
- **보상 설계의 어려움**: 벨만 방정식은 보상 함수 R(s,a)가 주어졌다고 가정한다. 그러나 현실에서 적절한 보상을 설계하는 것 자체가 난제다. 보상 해킹(reward hacking) -- 설계자 의도와 다른 방식으로 보상을 최대화하는 현상 -- 이 대표적이다.
- **부분 관측 문제**: 벨만 방정식은 에이전트가 현재 상태를 완전히 관측한다고 가정한다(MDP). 현실에서는 상태의 일부만 보이는 POMDP 상황이 일반적이며, 이 경우 문제의 복잡도가 급격히 높아진다.
- **할인 인자 gamma의 임의성**: gamma는 에이전트의 계획 지평선을 결정하는 핵심 파라미터이지만, 최적값을 이론적으로 결정하는 원리가 없다. 0.99와 0.999의 차이가 학습 결과를 크게 바꿀 수 있으며, 문제마다 경험적 조정이 필요하다.

## 용어 정리

최적성의 원리(Principle of Optimality) - 최적 경로의 부분 경로도 해당 구간에서 최적이라는 Bellman(1957)의 핵심 원리

동적 프로그래밍(Dynamic Programming) - 의사결정 문제를 재귀적 하위 문제로 분해하여 풀이하는 수학적 방법론

가치 함수(Value Function) - 특정 상태에서 미래에 기대되는 누적 보상의 추정값

차원의 저주(Curse of Dimensionality) - 상태 공간의 차원이 증가하면 필요한 계산량이 지수적으로 폭발하는 현상. Bellman이 명명

Q-함수(Q-function) - 상태 s에서 행동 a를 취한 후 최적 정책을 따랐을 때의 기대 누적 보상

시간차 학습(Temporal Difference Learning) - 미래 가치 추정치를 이용해 현재 가치를 갱신하는 부트스트래핑 기반 학습법. Sutton(1988)

경험 재생(Experience Replay) - 과거 경험을 버퍼에 저장하고 무작위 샘플링하여 학습하는 기법. DQN(2015)의 핵심 구성 요소

부트스트래핑(Bootstrapping) - 하나의 추정치를 다른 추정치로 갱신하는 방법. 벨만 방정식의 재귀 구조에서 직접 유래

치명적 삼중주(Deadly Triad) - 함수 근사 + 부트스트래핑 + 오프 정책 학습의 조합이 발산을 유발할 수 있다는 RL의 근본적 불안정성. Sutton & Barto(2018)

계획 지평선(Planning Horizon) - 에이전트가 실질적으로 고려하는 미래의 시간 범위. gamma에 의해 결정

---EN---
Bellman Equation and Dynamic Programming - The recursive decomposition principle for sequential decision-making that provides the direct mathematical foundation of reinforcement learning

## The Core Principle of Optimal Control

In the 1950s Cold War era, mathematician Richard Bellman (1920-1984) at the RAND Corporation was grappling with problems like missile trajectory optimization, resource allocation, and inventory management. These problems shared a common structure: decisions had to be made sequentially over time, and current choices altered future options.

Bellman discovered a single insight threading through all of them. The **Principle of Optimality** (1957): any sub-path of an optimal path is itself optimal for that segment. If the shortest route from Seoul to Busan passes through Daejeon, then the Daejeon-to-Busan segment must itself be the shortest Daejeon-Busan route. This principle allows any large problem to be decomposed into a chain of smaller subproblems.

Bellman named this decomposition technique Dynamic Programming. The origin of the name is interesting. According to Bellman's own recollection, the Secretary of Defense who funded RAND disliked the word "research," so Bellman chose a name that sounded impressive while concealing its mathematical nature.

The mathematical expression of this principle is the Bellman equation. In discrete time with finite state spaces:

V*(s) = max_a [R(s,a) + gamma * sum_s' P(s'|s,a) * V*(s')]

Breaking down each symbol:

- V*(s) --> the maximum cumulative reward achievable starting from state s
- max_a --> choosing the best among all possible actions a
- R(s,a) --> the immediate reward when taking action a in state s
- gamma --> the discount factor (between 0 and 1, the rate at which future rewards diminish in present value)
- P(s'|s,a) --> the probability of transitioning to state s' when taking action a in state s
- sum_s' --> computing the expected value over all possible next states

The equation states clearly: "optimal value of the current state = immediate reward from the best action + discounted expected optimal value of the next state." Present and future are recursively linked. In continuous time, this extends to the Hamilton-Jacobi-Bellman (HJB) equation, applied to rocket trajectory optimization and continuous process control.

## From Control Theory to Reinforcement Learning

Two critical transitions occurred as the Bellman equation became the mathematical foundation of reinforcement learning (RL).

First, **from model-based to model-free**. Dynamic programming originally assumes perfect prior knowledge of transition probabilities P(s'|s,a) and the reward function R(s,a). When controlling factory machinery, physics can provide these transition probabilities, but when a robot walks across unfamiliar terrain, no model exists. Sutton's (1988) Temporal Difference (TD) Learning and Watkins' (1989) Q-Learning broke through this wall, showing how to estimate value functions using only experience samples from direct interaction with the environment, without any model.

Second, **from continuous to discrete, then to approximation**. Control theory originally deals with continuous-time systems, but RL shifted to discrete time steps. This transition loses some fine-grained dynamics of continuous systems but makes computation far more tractable.

The key correspondences are:

- Control theory state x(t) --> RL state s
- Control input u(t) --> RL action a
- Cost function J (to minimize) --> RL reward R (to maximize, sign flipped)
- Optimal cost-to-go function J*(x) --> RL optimal value function V*(s)
- HJB equation --> Bellman optimality equation (discretized)
- System dynamics model --> Environment transition probability (replaced by direct experience in model-free settings)

What was preserved is the **recursive optimality structure** itself. What was transformed is the shift from continuous to discrete, and from model-based to experience-based.

## Solution Mechanisms: Value Iteration and Policy Iteration

Two classical algorithms exist for directly solving the Bellman equation.

1. **Value Iteration**: Starting from arbitrary initial values, the Bellman equation is applied repeatedly across all states. V(s) <- max_a [R(s,a) + gamma * sum_s' P(s'|s,a) * V(s')]. When gamma < 1, the contraction mapping theorem guarantees convergence.
2. **Policy Iteration**: Two steps alternate. (1) Policy evaluation -- compute V^pi(s) for the current policy pi. (2) Policy improvement -- use V^pi to find better actions at each state and update the policy. Fewer iterations than value iteration, but each iteration requires solving a linear system.

Both algorithms require **explicitly enumerating all states**. This is where Bellman's self-named **Curse of Dimensionality** enters. With n state variables each taking m values, the state space grows as m^n. A Go board has 361 intersections, each with 3 possible states (black, white, empty), yielding roughly 3^361 or about 10^172 states. Storing all of them in a table is physically impossible.

To visualize this spatially: value iteration is like recording the altitude at every grid point on a map. In two dimensions, 100x100 = 10,000 points suffice. In ten dimensions, 100^10 = 10^20 points are needed. Each additional dimension multiplies the required grid points by 100.

## The Discount Factor Gamma: Balancing Present and Future

The discount factor gamma is a single parameter determining how much to value future rewards.

- gamma = 0: the agent sees only immediate rewards. It maximizes the next single step -- myopic behavior.
- gamma = 1: rewards in the far future have the same value as the present. Theoretically ideal, but infinite sums may diverge and convergence is not guaranteed.
- gamma = 0.99: a reward 100 steps away shrinks to about 37% (0.99^100) of its value. gamma = 0.999: the same reward retains about 90% (0.999^100). This difference effectively determines the agent's planning horizon.

No theoretical principle dictates the optimal gamma. It must be tuned empirically to match the problem's time scale -- a fundamental hyperparameter sensitivity in Bellman equation-based RL.

## Function Approximation and Deep Reinforcement Learning

The key idea that circumvented the curse of dimensionality is **function approximation**. Instead of recording values for every state in a table, a neural network is trained to output values given states as input.

Watkins' (1989) Q-Learning directly learns the value of state-action pairs. The Bellman equation for Q-functions is:

Q*(s,a) = R(s,a) + gamma * sum_s' P(s'|s,a) * max_a' Q*(s',a')

This means "the expected cumulative reward of taking action a in state s, then always acting optimally afterward." Since V*(s) = max_a Q*(s,a), knowing the Q-function automatically determines the optimal policy.

The model-free Q-learning update rule is:

Q(s,a) <- Q(s,a) + alpha * [r + gamma * max_a' Q(s',a') - Q(s,a)]

The bracketed term r + gamma * max_a' Q(s',a') - Q(s,a) is called the TD error (temporal difference error). It is the difference between the actual reward r plus the estimated value of the next state, minus the current estimate. When this error converges to zero, the Bellman equation is satisfied.

Mnih et al.'s (2015) **DQN** (Deep Q-Network) replaced Q-tables with deep neural networks to approximate Q(s,a; theta), achieving human-level performance across 49 Atari games using raw screen pixels as states. Two key techniques made this possible:

- Experience Replay: Past experiences (s, a, r, s') are stored in a buffer and randomly sampled for training, breaking correlations between consecutive experiences and stabilizing learning.
- Target Network: The network computing Q-value update targets is updated only periodically, alleviating the "shooting at a moving target" problem.

Subsequent Actor-Critic methods (A3C, PPO, SAC) are modern variants of Bellman's policy iteration. The Actor directly learns the policy while the Critic estimates the value function and provides feedback. The policy evaluation-improvement cycle, reborn in the neural network era.

## Connections to Modern AI

The recursive optimality structure of the Bellman equation lives on throughout modern AI. However, the nature of each connection differs.

**Direct mathematical foundation:**

- **The entire RL family**: TD Learning, Q-Learning, SARSA, DQN, A3C, PPO, SAC -- virtually all value-based RL algorithms use variants of the Bellman equation as their core update rule. This is not mere inspiration but direct mathematical identity.
- **AlphaGo / AlphaZero**: Silver et al. (2016, 2017) used Monte Carlo Tree Search (MCTS) to approximate the Bellman equation's recursive value evaluation in game trees through stochastic sampling. AlphaZero learned purely from self-play, implementing the bootstrapping principle in its purest form. "Updating current values from estimates of future values" is bootstrapping -- precisely the recursive structure of the Bellman equation itself.

**Structural similarities from independent development:**

- **Dynamic programming structure in backpropagation**: Backpropagation propagates output-layer errors toward the input layer, recursively computing each layer's gradient from the results of the previous layer. This is structurally identical to dynamic programming's recursive decomposition, but was not historically inspired by the Bellman equation.
- **Viterbi algorithm**: This algorithm for finding the most likely state sequence in Hidden Markov Models (HMMs) is a direct application of dynamic programming. It served as a core component in speech recognition systems for decades.

## Limitations and Weaknesses

- **The curse of dimensionality is mitigated, not solved**: Function approximation is a workaround, not a solution. The "deadly triad" (Sutton & Barto 2018) -- where the combination of function approximation, bootstrapping, and off-policy learning can cause divergence -- remains unresolved.
- **Reward design difficulty**: The Bellman equation assumes a given reward function R(s,a). But designing appropriate rewards for real-world problems is itself a major challenge. Reward hacking -- agents maximizing rewards in ways unintended by designers -- is a prime example.
- **Partial observability**: The Bellman equation assumes the agent fully observes the current state (MDP). In reality, only partial observation is typical (POMDP), and this dramatically increases the problem's complexity.
- **Arbitrariness of the discount factor gamma**: Gamma is a critical parameter determining the agent's planning horizon, yet no theoretical principle dictates its optimal value. The difference between 0.99 and 0.999 can dramatically alter learning outcomes, requiring empirical tuning for each problem.

## Glossary

Principle of Optimality - Bellman's (1957) core principle that any sub-path of an optimal path is itself optimal for that segment

Dynamic Programming - a mathematical methodology for solving decision problems by decomposing them into recursive subproblems

Value Function - an estimate of the expected cumulative future reward from a given state

Curse of Dimensionality - the phenomenon where required computation explodes exponentially as the state space's dimensionality increases. Named by Bellman

Q-function - the expected cumulative reward of taking action a in state s and then following the optimal policy

Temporal Difference Learning - a bootstrapping-based learning method that updates current value estimates using estimates of future values. Sutton (1988)

Experience Replay - a technique that stores past experiences in a buffer and randomly samples them for training. A core component of DQN (2015)

Bootstrapping - the method of updating one estimate using another estimate. Directly derived from the recursive structure of the Bellman equation

Deadly Triad - the fundamental RL instability where function approximation + bootstrapping + off-policy learning can cause divergence. Sutton & Barto (2018)

Planning Horizon - the effective future time range an agent considers. Determined by gamma
