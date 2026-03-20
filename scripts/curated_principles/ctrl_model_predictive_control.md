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

여기서 ||x||^2_Q는 x^T Q x를 뜻한다. Q 행렬이 각 상태 변수에 서로 다른 가중치를 부여하여, 중요한 변수의 오차일수록 비용에 크게 반영되는 가중 제곱합이다. R은 제어 입력 크기에 대한 벌점이다. P는 종단 비용으로, 예측 구간 끝에서의 안정성을 보장한다. x(k+1) = f(x(k), u(k))가 내부 모델이 등식 제약으로 작용하는 부분이며, X, U는 밸브 개도, 모터 토크 상한 같은 물리적 한계의 부등식 제약이다.

전통적인 MPC에서는 모델이 선형이면 이 문제가 이차 프로그래밍(QP)이 되어 효율적인 솔버로 실시간 해를 구한다. 이 점이 뒤에서 다룰 학습된 비선형 모델과의 중요한 차이다.

## 핵심 트레이드오프: 예측 구간의 딜레마

MPC에서 가장 근본적인 트레이드오프는 **예측 구간 N의 길이**다.

- **N이 길면**: 먼 미래까지 내다보므로 근시안적 결정을 피할 수 있다. 그러나 계산 비용이 급격히 증가하고, 먼 미래의 예측일수록 모델 오차가 누적되어 신뢰도가 떨어진다
- **N이 짧으면**: 계산이 빠르고 모델 오차 누적이 적지만, 먼 미래의 제약 위반이나 불리한 상황을 사전에 대비하지 못한다
- **Q와 R의 균형**: Q를 키우면 목표 추적이 공격적이 되고 입력이 거칠어진다. R을 키우면 입력이 부드러워지지만 목표 추적이 느려진다. "정확성 vs 부드러움"의 트레이드오프다

나머지를 버리고 첫 행동만 실행하는 이유도 이 맥락에서 이해된다. 모델이 완벽하지 않으므로 미래 예측이 멀수록 부정확하고, 매 순간 새로운 측정값이 들어오므로 새 계획이 이전 계획보다 낫다. **이동 수평선**(receding horizon)이라는 이름은 예측 구간의 끝점이 매 단계마다 한 칸씩 앞으로 밀리는 이 구조를 가리킨다.

MPC의 이론적 장점 중 하나는 **재귀적 실현 가능성**(recursive feasibility)을 증명할 수 있다는 것이다. 적절한 종단 비용 P와 종단 제약을 설정하면, 현 시점에서 최적화 해가 존재할 때 다음 시점에서도 해의 존재가 보장된다. 이는 안전이 중요한 시스템에서 MPC가 선호되는 이론적 근거다.

## 현대 AI 기법과의 연결

MPC의 "내부 모델로 미래를 예측하고, 최적 행동을 계획하고, 첫 행동만 실행한 뒤 재계획한다"는 패러다임은 현대 AI 일부 알고리즘에서 명시적으로 채택되었다.

**MPC 구조를 명시적으로 차용한 MBRL 알고리즘:**

- **PETS와 TD-MPC**: Chua et al.(2018)의 PETS(Probabilistic Ensemble Trajectory Sampling)는 MPC를 MBRL에 가장 직접적으로 적용한 사례다. 앙상블 신경망으로 환경 모델을 학습하고, 매 스텝 CEM(Cross-Entropy Method)으로 최적 행동 시퀀스를 탐색하여 첫 행동만 실행한다. 전통 MPC가 선형 모델에 QP 솔버를 쓰는 반면, 학습된 비선형 모델에서는 미분이 불안정하므로 CEM이나 MPPI(Model Predictive Path Integral) 같은 **샘플링 기반 최적화**가 쓰인다는 차이가 있다. Hansen et al.(2022)의 TD-MPC는 여기에 학습된 가치 함수를 결합하여 계획 효율을 높였다. 모델이 물리 법칙이 아닌 데이터에서 학습된다는 점이 제어공학 MPC와의 핵심 차이이며, 이 차이가 **모델 오류의 복합** 문제를 야기한다. 학습된 모델의 작은 오차가 긴 롤아웃에서 눈덩이처럼 불어난다
- **Dreamer**: Hafner et al.(2020)는 RSSM(Recurrent State-Space Model) 기반의 세계 모델을 사용하여, 잠재 공간에서 환경 동역학을 학습한다. 이미지 재구성은 모델 학습을 돕는 보조 신호이며, 핵심은 학습된 잠재 모델 안에서 미래 궤적을 상상(imagination)하며 정책을 최적화하는 것이다. 시행착오를 실제 환경이 아닌 모델 안에서 수행하여 **샘플 효율성**을 확보한다. Dreamer는 매 스텝 재계획하는 MPC 방식이 아니라 모델 안에서 정책 자체를 학습하므로, MPC보다 Dyna 패턴에 더 가깝다

**MPC와 구조적으로 유사한 모델 기반 계획:**

- **MuZero**: DeepMind의 Schrittwieser et al.(2020)는 모델 기반 계획을 가장 정교한 형태로 보여준 사례다. 관측 공간이 아닌 **학습된 잠재 공간**에서 모델을 구축하고 몬테카를로 트리 탐색(MCTS)을 수행한다. "모델로 미래를 시뮬레이션하고 최선의 행동을 선택한다"는 패턴은 MPC와 공유하지만, MCTS는 이산 트리에서 UCB(Upper Confidence Bound)로 탐색-이용 균형을 잡는 구조로 MPC의 연속 최적화와는 수학적으로 다르다. MuZero 논문도 MPC를 직접적 영감 원천으로 인용하지 않으므로, 직접 계승보다는 **동일 직관의 독립적 구현**으로 보는 것이 정확하다

**동일한 직관을 독립적으로 공유하는 구조적 유사성:**

- **LLM 추론 시 트리 탐색**: OpenAI o1 계열 모델이 답변 생성 시 여러 추론 경로를 내부적으로 탐색하고 최선을 선택하는 구조는, MPC가 여러 제어 시퀀스를 시뮬레이션한 뒤 최적 행동을 고르는 것과 동일한 "계획 후 실행" 패턴이다. 다만 이 유사성은 MPC에서 직접 유래한 것이 아니라 탐색 기반 의사결정의 일반적 구조다
- **자기 회귀 생성과 재계획**: LLM이 토큰을 하나씩 생성하며 매 스텝마다 전체 문맥을 재평가하는 과정은, MPC의 "첫 행동만 실행하고 재계획" 원리와 구조적으로 닮았다

## 한계와 약점

MPC 패러다임의 강력함에도 근본적 한계가 존재한다.

- **모델 정확성 의존**: MPC는 모델이 정확한 만큼만 좋다. 학습된 세계 모델의 경우, 작은 오차가 긴 롤아웃에서 복합적으로 누적되어 현실과 동떨어진 행동을 유발한다
- **실시간 계산 비용**: 매 시간 단계마다 최적화 문제를 풀어야 하므로, 제어 주기가 빠른 시스템에서 계산이 병목이 된다. 예를 들어 10ms 주기로 제어해야 하는 드론 비행에서, 최적화 계산이 10ms를 초과하면 제어가 지연된다
- **시뮬레이션-현실 간극(Sim-to-Real Gap)**: 시뮬레이터에서 학습한 세계 모델로 현실 로봇을 제어할 때, 마찰, 공기저항, 센서 노이즈 등이 성능을 저하시킨다. 이 간극을 줄이기 위해 **도메인 랜덤화**(시뮬레이션의 물리 파라미터를 무작위로 변화시켜 견실성을 높이는 기법)가 쓰이지만, 완전히 메우기는 어렵다
- **예측 구간의 근시안성**: N을 길게 잡으면 계산 비용과 모델 오차가 증가하고, 짧게 잡으면 근시안적 결정을 내린다. MBRL에서는 롤아웃 길이, 게임 AI에서는 트리 탐색 깊이로 동일한 트레이드오프가 나타난다

## 용어 정리

이동 수평선(receding horizon) - 매 시간 단계마다 예측 구간의 끝점이 앞으로 한 칸씩 이동하는 MPC의 핵심 구조

롤아웃(rollout) - 모델을 사용하여 현재 상태에서 미래 상태 궤적을 시뮬레이션하는 것

종단 비용(terminal cost) - 예측 구간의 마지막 시점에서 상태에 부과하는 추가 벌점, 유한 구간 MPC의 안정성 보장에 핵심적

세계 모델(world model) - 환경의 동역학을 학습하여 미래 상태를 예측할 수 있는 내부 모델

모델 오류 복합(compounding model error) - 학습된 모델의 작은 오차가 긴 롤아웃에서 누적되어 현실과의 괴리가 커지는 현상

재귀적 실현 가능성(recursive feasibility) - 현재 시간 단계에서 최적화 해가 존재하면 다음 시간 단계에서도 해가 존재함이 보장되는 성질

시뮬레이션-현실 간극(sim-to-real gap) - 시뮬레이터에서 학습된 정책이나 모델이 실제 환경에서 성능이 저하되는 현상

도메인 랜덤화(domain randomization) - 시뮬레이션의 물리적 파라미터를 무작위로 변화시켜 현실 환경에 대한 견실성을 높이는 기법

샘플링 기반 최적화(sampling-based optimization) - CEM이나 MPPI처럼 후보 시퀀스를 다수 생성하여 비용이 낮은 후보를 선별하는 최적화 방식. 학습된 비선형 모델에서 기울기 기반 최적화가 불안정할 때 사용
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

Here, ||x||^2_Q means x^T Q x. The Q matrix assigns different weights to each state variable, so that errors in more important variables contribute more heavily to the cost -- a weighted sum of squares. R penalizes control input magnitude, and P is the terminal cost ensuring stability at the horizon's end. The dynamics model acts as an equality constraint, while X and U reflect physical limits (valve positions, motor torque limits, etc.) as inequality constraints.

In traditional MPC, when the model is linear this problem becomes a quadratic program (QP) that efficient solvers can handle in real time. This distinction from learned nonlinear models, discussed later, is important.

## The Core Tradeoff: The Horizon Dilemma

The most fundamental tradeoff in MPC is the **length of the prediction horizon N**.

- **Long N**: Looking far ahead avoids myopic decisions. However, computational cost increases sharply and predictions further into the future accumulate model errors, degrading reliability
- **Short N**: Computation is fast and model error accumulation is low, but the algorithm fails to anticipate distant constraint violations or unfavorable situations
- **Q vs. R balance**: Increasing Q makes target tracking aggressive but inputs rough. Increasing R makes inputs smooth but target tracking sluggish. A "precision vs. smoothness" tradeoff tuned differently for each application

Why only the first action is executed and the rest discarded becomes clear in this context. The model is imperfect, so predictions degrade with distance, and new measurements enable better plans. The name **receding horizon** refers to this structure where the prediction window's endpoint slides forward one step at each time step.

One of MPC's theoretical advantages is that **recursive feasibility** can be proven. With appropriate terminal cost P and terminal constraints, if a solution exists at the current time step, the existence of a solution at the next time step is guaranteed. This provides the theoretical basis for MPC's preference in safety-critical systems.

## Connections to Modern AI

MPC's paradigm of "predict the future with an internal model, plan optimal actions, execute only the first, and replan" has been explicitly adopted by some modern AI algorithms.

**MBRL algorithms that explicitly borrow the MPC structure:**

- **PETS and TD-MPC**: Chua et al.'s (2018) PETS (Probabilistic Ensemble Trajectory Sampling) is the most direct application of MPC to MBRL. It learns an environment model with an ensemble of neural networks, searches for the optimal action sequence using CEM (Cross-Entropy Method) at each step, and executes only the first action. While traditional MPC uses QP solvers for linear models, learned nonlinear models make gradient-based optimization unstable, so **sampling-based optimization** such as CEM or MPPI (Model Predictive Path Integral) is used instead. Hansen et al.'s (2022) TD-MPC combines this with a learned value function to improve planning efficiency. The key difference from control engineering MPC is that the model is learned from data rather than derived from physics, and this difference creates the problem of **compounding model error** -- small errors snowball over long rollouts
- **Dreamer**: Hafner et al. (2020) used an RSSM (Recurrent State-Space Model)-based world model that learns environment dynamics in latent space. Image reconstruction serves as an auxiliary learning signal; the core is optimizing policy by imagining future trajectories within the learned latent model. Performing trial-and-error inside the model rather than the real environment achieves **sample efficiency**. Since Dreamer learns the policy itself within the model rather than replanning at each step in MPC fashion, it is closer to the Dyna pattern than to MPC

**Model-based planning structurally similar to MPC:**

- **MuZero**: DeepMind's Schrittwieser et al. (2020) demonstrated model-based planning in its most refined form. It builds a model in a **learned latent space** rather than observation space and performs Monte Carlo Tree Search (MCTS) on top. The pattern of "simulate the future with a model and select the best action" is shared with MPC, but MCTS operates in discrete trees with UCB (Upper Confidence Bound) for exploration-exploitation balance, which is mathematically different from MPC's continuous optimization. The MuZero paper does not cite MPC as a direct inspiration, so this is more accurately viewed as **independent implementation of the same intuition** rather than direct inheritance

**Structural similarities sharing the same intuition independently:**

- **Tree search in LLM reasoning**: Models like OpenAI's o1 family internally explore multiple reasoning paths during generation and select the best -- the same "plan then act" pattern as MPC simulating multiple control sequences and choosing the optimal action. However, this resemblance derives from the general structure of search-based decision-making, not directly from MPC
- **Autoregressive generation and replanning**: The way LLMs generate tokens one at a time, re-evaluating full context at each step, structurally mirrors MPC's "execute only the first action and replan"

## Limitations and Weaknesses

Despite MPC's paradigmatic power, fundamental limitations exist.

- **Model accuracy dependence**: MPC is only as good as its model. For learned world models, small errors compound over long rollouts, producing actions disconnected from reality
- **Real-time computational cost**: Solving an optimization problem at every time step creates bottlenecks in fast-cycle systems. For example, in drone flight requiring 10ms control cycles, if optimization exceeds 10ms, control is delayed
- **Sim-to-real gap**: When controlling real robots with world models learned in simulation, factors like friction, air resistance, and sensor noise degrade performance. **Domain randomization** (randomly varying simulation physics parameters to increase robustness) helps reduce this gap, but fully bridging it remains difficult
- **Horizon myopia**: Long N increases computational cost and accumulates model error. Short N leads to myopic decisions. In MBRL this manifests as rollout length; in game AI, as tree search depth -- the same tradeoff

## Glossary

Receding horizon - MPC's core structure where the prediction window's endpoint advances one step forward at each time step

Rollout - simulating a future state trajectory from the current state using a model

Terminal cost - an additional penalty imposed on the state at the prediction horizon's final time step, essential for guaranteeing finite-horizon MPC stability

World model - an internal model that learns environmental dynamics to predict future states

Compounding model error - the phenomenon where small errors in learned models accumulate over long rollouts, widening the gap with reality

Recursive feasibility - the property that if an optimization solution exists at the current time step, a solution is guaranteed to exist at the next

Sim-to-real gap - the phenomenon where policies or models learned in simulators show degraded performance in real environments

Domain randomization - a technique that randomly varies simulation physics parameters to increase robustness to real-world conditions

Sampling-based optimization - an optimization approach like CEM or MPPI that generates many candidate sequences and selects those with lowest cost, used when gradient-based optimization is unstable with learned nonlinear models
