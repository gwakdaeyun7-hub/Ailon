---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 모델 예측 제어, 이동 수평선, 세계 모델, 모델 기반 강화학습, 제약 조건 최적화, 롤아웃, 재계획, 모델 오류 복합
keywords_en: model predictive control, receding horizon, world model, model-based reinforcement learning, constrained optimization, rollout, re-planning, compounding model error
---
Model Predictive Control - 내부 모델로 미래를 예측하고, 최적 행동 시퀀스를 계획한 뒤, 첫 행동만 실행하고 매 순간 다시 계획하는 제어 기법

## 내부 모델로 미래를 내다보는 제어

전통적인 PID 제어기는 주로 과거와 현재의 오차에 반응한다. 목표 온도가 200도인데 현재 195도이면, 그 5도 차이에 비례하여 히터 출력을 올린다. D항(미분항)이 오차의 변화율을 보며 1스텝 정도의 국소적 예측을 수행하기는 하지만, 이것은 현재 기울기의 1차 외삽에 불과하다. 석유화학 정제 공정처럼 온도를 올리는 행동의 효과가 30분 뒤에야 나타나는 시스템에서는, 이 수준의 예측으로는 목표를 지나쳐 진동하거나 제약을 위반한다.

모델 예측 제어(Model Predictive Control, MPC)는 이 한계를 정면으로 돌파한다. 시스템의 수학적 모델을 내장하고, 그 모델로 미래 N 스텝을 명시적으로 예측한 뒤, 예측된 궤적이 가장 좋은 제어 입력 시퀀스를 찾는다. 핵심은 그 시퀀스 전체를 실행하지 않는다는 것이다. **첫 번째 행동만 실행하고, 다음 순간 새로운 측정값을 받아 처음부터 다시 계획한다.** 이 "계획-실행-폐기-재계획" 사이클이 MPC의 본질이다.

공간적으로 비유하면, PID 제어기는 바로 앞 노면의 기울기만 감지하며 운전하는 것이고, MPC는 전방 200미터를 내다보며 운전한다. 커브가 보이면 미리 감속하고, 교차로가 다가오면 차선을 바꾼다.

## 석유화학 공장에서 AI로

MPC의 산업적 기원은 1970년대 석유화학 공정 제어에 있다. Richalet et al.(1978)이 IDCOM을, Cutler와 Ramaker(1980)가 DMC를 독립적으로 개발했다. 석유 정제 공정에서는 수십 개 변수가 상호작용하고, 물리적 한계와 긴 지연이 존재하여, PID 제어기 조합보다 공정 모델로 미래를 예측하고 제약 조건을 명시적으로 반영하는 것이 효과적이었다. 이후 Garcia, Prett, Morari(1989)가 MPC의 통합 이론 프레임워크를 정립했다.

이 제어공학의 패러다임이 AI에 영향을 준 대응 관계는 다음과 같다. 다만 현대 AI에서 계획 기반 접근의 더 직접적인 계보는 Bellman의 동적 프로그래밍에서 Sutton(1991)의 Dyna 아키텍처로 이어지는 강화학습 전통이며, MPC는 2010년대에 MBRL 커뮤니티가 제어공학의 기법을 명시적으로 차용하면서 합류한 흐름이다.

- 시스템의 물리 모델 f(x,u) --> MBRL의 **학습된 세계 모델**. 물리 법칙 대신 신경망이 환경의 동역학을 데이터로부터 학습한다
- 비용 함수 최소화 --> 기대 보상 최대화. 부호만 반대일 뿐 같은 최적화 문제다
- 예측 구간 N 스텝 --> 계획 수평선(planning horizon). 몇 수 앞을 내다볼 것인가
- "첫 행동만 실행하고 재계획" --> MBRL의 일부 알고리즘에서 매 스텝 재계획. 모델이 불완전하므로 과거 계획을 고집하지 않는다
- 상태/입력 제약 조건 --> 안전 제약(safe RL), 행동 클리핑. "로봇 팔이 관절 한계를 넘지 않는다"
- 이동 수평선(receding horizon) --> 매 시간 단계마다 예측 창이 앞으로 한 칸씩 이동하는 구조

## MPC의 한 사이클: 다섯 단계

MPC가 매 시간 단계에서 수행하는 작업을 정리하면 다음과 같다.

1. 현재 상태를 관측한다. 시스템의 상태 x(0)를 센서로 측정하거나 상태 추정기로 추정한다
2. 내부 모델로 미래를 예측한다. 모델 f(x,u)를 사용하여 N 스텝 앞까지의 상태 궤적을 시뮬레이션한다. 이것이 **롤아웃**(rollout)이다
3. 최적화 문제를 푼다. 예측 구간 전체에서 비용을 최소화하는 제어 시퀀스 {u(0), u(1), ..., u(N-1)}를 구한다
4. 첫 행동만 실행한다. 최적 시퀀스의 첫 번째 u(0)만 실제 시스템에 적용하고 나머지는 버린다
5. 다음 시간 단계에서 1번으로 돌아간다

3단계에서 푸는 최적화 문제의 수학적 형태는 다음과 같다.

min sum_{k=0}^{N-1} [||x(k) - x_ref||^2_Q + ||u(k)||^2_R] + ||x(N) - x_ref||^2_P

subject to:
x(k+1) = f(x(k), u(k))
x(k) in X, u(k) in U

이 비용 함수는 세 가지 벌금의 합이다. 첫째 항은 "목표에서 얼마나 벗어났는가"(Q가 클수록 공격적 추적), 둘째 항은 "제어 입력을 얼마나 크게 썼는가"(R이 클수록 부드러운 제어), 셋째 항 P는 예측 구간 끝에서의 안정성을 보장하는 종단 비용이다. 제약 조건으로 모델 f(x,u)가 시스템 동역학을, X와 U가 밸브 개도나 모터 토크 같은 물리적 한계를 반영한다.

전통적인 MPC에서는 모델이 선형이면 이 문제가 이차 프로그래밍(QP)이 되어 효율적인 솔버로 실시간 해를 구한다. 이 점이 뒤에서 다룰 학습된 비선형 모델과의 중요한 차이다.

## 핵심 트레이드오프: 예측 구간의 딜레마

MPC에서 가장 근본적인 트레이드오프는 **예측 구간 N의 길이**다.

- **N이 길면**: 먼 미래까지 내다보므로 근시안적 결정을 피할 수 있다. 그러나 계산 비용이 급격히 증가하고, 먼 미래의 예측일수록 모델 오차가 누적되어 신뢰도가 떨어진다
- **N이 짧으면**: 계산이 빠르고 모델 오차 누적이 적지만, 먼 미래의 제약 위반이나 불리한 상황을 사전에 대비하지 못한다
- **Q와 R의 균형**: 내비게이션이 "1미터라도 벗어나면 즉시 핸들을 꺾어라"(Q 우세)라 지시하면 추적은 정확하지만 입력이 거칠고, "핸들은 부드럽게만 돌려라"(R 우세)면 부드럽지만 추적이 느려진다

**이동 수평선**(receding horizon)은 자동차 전조등과 같다. 전조등은 항상 전방 100미터를 비추지만, 차가 전진할 때마다 빛이 비추는 구간도 앞으로 밀린다. MPC의 예측 구간도 매 단계마다 끝점이 한 칸씩 앞으로 이동한다. 모델이 완벽하지 않으므로, 새 측정값에 기반한 새 계획이 항상 이전 계획보다 낫기 때문이다.

## 현대 AI 기법과의 연결

MPC의 "내부 모델로 예측하고, 최적 행동을 계획하고, 첫 행동만 실행한 뒤 재계획한다"는 패러다임은 현대 AI에서 다양한 형태로 나타난다.

**MPC를 명시적으로 차용한 MBRL:**

- **PETS와 TD-MPC**: Chua et al.(2018)의 PETS는 앙상블 신경망으로 환경 모델을 학습하고, 매 스텝 CEM으로 최적 행동 시퀀스를 탐색하여 첫 행동만 실행한다. 학습된 비선형 모델에서는 QP 대신 CEM이나 MPPI 같은 샘플링 기반 최적화가 쓰인다. Hansen et al.(2022)의 TD-MPC는 학습된 가치 함수를 결합하여 효율을 높였다. 핵심 차이는 모델이 데이터에서 학습된다는 점이며, 이것이 **모델 오류의 복합** 문제를 야기한다
- **Dreamer**: Hafner et al.(2020)는 잠재 공간의 세계 모델 안에서 미래 궤적을 상상하며 정책을 학습한다. 시행착오를 모델 안에서 수행하여 **샘플 효율성**을 확보하지만, 매 스텝 재계획이 아니라 정책 자체를 학습하므로 MPC보다 Dyna 패턴에 가깝다

**구조적으로 유사한 독립적 구현:**

- **MuZero**: Schrittwieser et al.(2020)는 학습된 잠재 공간에서 MCTS를 수행한다. "모델로 미래를 시뮬레이션하고 최선을 선택한다"는 패턴을 공유하지만, 이산 트리 탐색은 MPC의 연속 최적화와 수학적으로 다르며, MPC를 직접 인용하지 않으므로 독립적 구현이다
- **LLM의 자기 회귀 생성**: 토큰을 하나씩 생성하며 매 스텝 전체 문맥을 재평가하는 과정은 MPC의 재계획과 표면적으로 닮았으나, 이전 토큰을 버리지 않고 명시적 최적화를 매번 풀지도 않으므로 패턴의 유사성이지 메커니즘의 유사성은 아니다

## 한계와 약점

MPC의 강력함에도 근본적 한계가 존재한다.

- **모델 정확성 의존**: MPC는 모델이 정확한 만큼만 좋다. 일기예보와 같다 — 내일 예보는 꽤 정확하지만 10일 뒤 예보는 거의 맞지 않는다. 각 시점의 작은 예측 오차가 다음 시점의 초기값 오차가 되어 눈덩이처럼 불어나기 때문이다. 시뮬레이터에서 학습한 모델로 현실 로봇을 제어할 때는 마찰, 센서 노이즈 등이 이 간극을 더 벌린다
- **실시간 계산 비용**: 매 시간 단계마다 최적화 문제를 풀어야 하므로, 10ms 주기로 제어해야 하는 드론 비행 같은 빠른 시스템에서 병목이 된다

## 용어 정리

이동 수평선(receding horizon) - 매 시간 단계마다 예측 구간의 끝점이 앞으로 한 칸씩 이동하는 MPC의 핵심 구조

롤아웃(rollout) - 모델을 사용하여 현재 상태에서 미래 상태 궤적을 시뮬레이션하는 것

종단 비용(terminal cost) - 예측 구간의 마지막 시점에서 상태에 부과하는 추가 벌점, 유한 구간 MPC의 안정성 보장에 핵심적

세계 모델(world model) - 환경의 동역학을 학습하여 미래 상태를 예측할 수 있는 내부 모델

모델 오류 복합(compounding model error) - 학습된 모델의 작은 오차가 긴 롤아웃에서 누적되어 현실과의 괴리가 커지는 현상

재귀적 실현 가능성(recursive feasibility) - 현재 시간 단계에서 최적화 해가 존재하면 다음 시간 단계에서도 해가 존재함이 보장되는 성질

시뮬레이션-현실 간극(sim-to-real gap) - 시뮬레이터에서 학습된 정책이나 모델이 실제 환경에서 성능이 저하되는 현상

---EN---
Model Predictive Control - A control technique that predicts the future using an internal model, plans an optimal action sequence, executes only the first action, and re-plans at every moment

## Controlling by Looking Ahead with an Internal Model

A traditional PID controller primarily reacts to past and present error. If the target temperature is 200 degrees and the current reading is 195, it increases heater output in proportion to that 5-degree gap. The D-term (derivative) does perform a local prediction by looking at the rate of error change, but this is merely a first-order extrapolation of the current slope. In systems like petrochemical refining where a control action's effect takes 30 minutes to manifest, this level of prediction is insufficient to prevent overshoot, oscillation, or constraint violations.

Model Predictive Control (MPC) attacks this limitation head-on. It embeds a mathematical model of the system, uses that model to explicitly predict N steps into the future, and finds the control input sequence that yields the best predicted trajectory. The crucial point is that it does not execute the entire sequence. **It executes only the first action, receives a new measurement at the next moment, and re-plans from scratch.** This "plan-execute-discard-replan" cycle is the essence of MPC.

A spatial analogy helps. A PID controller is like driving by sensing only the slope of the road immediately beneath you. MPC is like driving while scanning 200 meters ahead. Seeing a curve, it decelerates in advance; approaching an intersection, it changes lanes.

## From Petrochemical Plants to AI

MPC's industrial origins lie in 1970s petrochemical process control. Richalet et al. (1978) developed IDCOM, and Cutler and Ramaker (1980) developed DMC independently. In oil refining, dozens of variables interact with physical limits and long delays, making it far more effective to predict the future with a process model and explicitly account for constraints than to combine dozens of PID controllers. Later, Garcia, Prett, and Morari (1989) established a unified theoretical framework for MPC.

The key correspondences through which this control engineering paradigm influenced AI are listed below. However, the more direct lineage for planning-based approaches in modern AI runs from Bellman's dynamic programming through Sutton's (1991) Dyna architecture in the RL tradition. MPC joined this stream in the 2010s when the MBRL community explicitly borrowed techniques from control engineering.

- Physical system model f(x,u) --> MBRL's **learned world model**. Instead of physics equations, a neural network learns environmental dynamics from data
- Cost function minimization --> expected reward maximization. The same optimization problem with the sign flipped
- Prediction horizon of N steps --> planning horizon. How many steps ahead to look
- "Execute only first action then replan" --> step-by-step replanning in some MBRL algorithms. Since the model is imperfect, clinging to old plans is counterproductive
- State/input constraints --> safety constraints (safe RL), action clipping. "The robot arm must not exceed joint limits"
- Receding horizon --> the prediction window slides forward one step at each time step

## One MPC Cycle: Five Steps

What MPC performs at each time step:

1. Observe the current state. Measure system state x(0) via sensors or estimate it with a state estimator
2. Predict the future with the internal model. Use model f(x,u) to simulate the state trajectory N steps ahead. This is called a **rollout**
3. Solve the optimization problem. Find the control sequence {u(0), u(1), ..., u(N-1)} that minimizes cost over the prediction horizon
4. Execute only the first action. Apply only u(0) from the optimal sequence to the actual system and discard the rest
5. Return to step 1 at the next time step

The optimization problem solved in step 3 takes the following mathematical form:

min sum_{k=0}^{N-1} [||x(k) - x_ref||^2_Q + ||u(k)||^2_R] + ||x(N) - x_ref||^2_P

subject to:
x(k+1) = f(x(k), u(k))
x(k) in X, u(k) in U

This cost function is the sum of three penalties. The first term penalizes "how far from the target" (larger Q means more aggressive tracking), the second penalizes "how much control effort was used" (larger R means smoother control), and the third term P is a terminal cost ensuring stability at the horizon's end. The model f(x,u) acts as a dynamics constraint, while X and U enforce physical limits such as valve positions or motor torque.

In traditional MPC, when the model is linear this problem becomes a quadratic program (QP) that efficient solvers can handle in real time. This distinction from learned nonlinear models, discussed later, is important.

## The Core Tradeoff: The Horizon Dilemma

The most fundamental tradeoff in MPC is the **length of the prediction horizon N**.

- **Long N**: Looking far ahead avoids myopic decisions. However, computational cost increases sharply and predictions further into the future accumulate model errors, degrading reliability
- **Short N**: Computation is fast and model error accumulation is low, but the algorithm fails to anticipate distant constraint violations or unfavorable situations
- **Q vs. R balance**: Like a navigation system choosing between "turn the wheel immediately at the slightest deviation" (Q-dominant) and "only turn the wheel gently" (R-dominant) -- precision versus smoothness

**Receding horizon** works like car headlights. Headlights always illuminate 100 meters ahead, but as the car moves forward, the illuminated zone shifts forward too. MPC's prediction window slides one step forward at each time step in exactly the same way. Since the model is imperfect, a new plan based on fresh measurements is always better than the old one.

## Connections to Modern AI

MPC's paradigm of "predict with an internal model, plan optimal actions, execute only the first, and replan" appears in various forms in modern AI.

**MBRL algorithms explicitly borrowing MPC:**

- **PETS and TD-MPC**: Chua et al.'s (2018) PETS learns an environment model with ensemble neural networks, searches for the optimal action sequence via CEM at each step, and executes only the first action. Learned nonlinear models use sampling-based optimization (CEM, MPPI) instead of QP solvers. Hansen et al.'s (2022) TD-MPC adds a learned value function for efficiency. The key difference is that the model is learned from data, creating the problem of **compounding model error**
- **Dreamer**: Hafner et al. (2020) learns a latent-space world model and optimizes policy by imagining future trajectories within it, achieving **sample efficiency**. However, since it learns the policy itself rather than replanning each step, it is closer to the Dyna pattern than to MPC

**Structurally similar independent implementations:**

- **MuZero**: Schrittwieser et al. (2020) performs MCTS in a learned latent space. The "simulate the future and select the best action" pattern is shared, but discrete tree search is mathematically different from MPC's continuous optimization, and the paper does not cite MPC, making this an independent implementation
- **Autoregressive generation in LLMs**: Generating tokens one at a time while re-evaluating full context at each step superficially resembles MPC's replanning, but LLMs do not discard previous tokens or solve an explicit optimization at each step -- a similarity of pattern, not mechanism

## Limitations and Weaknesses

Despite MPC's power, fundamental limitations exist.

- **Model accuracy dependence**: MPC is only as good as its model. Think of weather forecasting -- tomorrow's forecast is fairly accurate, but a 10-day forecast is rarely reliable. Each time step's small prediction error becomes the next step's initial condition error, snowballing over the rollout. When models learned in simulation control real robots, friction and sensor noise widen this gap further
- **Real-time computational cost**: Solving an optimization problem at every time step creates bottlenecks in fast systems like drone flight requiring 10ms control cycles

## Glossary

Receding horizon - MPC's core structure where the prediction window's endpoint advances one step forward at each time step

Rollout - simulating a future state trajectory from the current state using a model

Terminal cost - an additional penalty imposed on the state at the prediction horizon's final time step, essential for guaranteeing finite-horizon MPC stability

World model - an internal model that learns environmental dynamics to predict future states

Compounding model error - the phenomenon where small errors in learned models accumulate over long rollouts, widening the gap with reality

Recursive feasibility - the property that if an optimization solution exists at the current time step, a solution is guaranteed to exist at the next

Sim-to-real gap - the phenomenon where policies or models learned in simulators show degraded performance in real environments

