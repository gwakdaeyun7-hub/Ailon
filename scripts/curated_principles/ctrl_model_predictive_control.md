---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 모델 예측 제어, 이동 수평선, 세계 모델, 모델 기반 강화학습, 제약 조건 최적화, 롤아웃, 재계획, 모델 오류 복합
keywords_en: model predictive control, receding horizon, world model, model-based reinforcement learning, constrained optimization, rollout, re-planning, compounding model error
---
Model Predictive Control - 내부 모델로 미래를 예측하고, 최적 행동 시퀀스를 계획한 뒤, 첫 행동만 실행하고 매 순간 다시 계획하는 제어 기법

## 내부 모델로 미래를 내다보는 제어

전통적인 PID 제어기는 과거의 오차에 반응한다. 목표 온도가 200도인데 현재 195도이면, 그 5도 차이에 비례하여 히터 출력을 올린다. 문제는 이것이 철저하게 "과거를 되돌아보는" 방식이라는 점이다. 석유화학 정제 공정처럼 온도를 올리는 행동의 효과가 30분 뒤에야 나타나는 시스템에서는, 과거 오차만 보고 현재를 조절하면 목표를 지나쳐 진동하거나 제약을 위반한다.

모델 예측 제어(Model Predictive Control, MPC)는 이 한계를 정면으로 돌파한다. 시스템의 수학적 모델을 내장하고, 그 모델로 미래 N 스텝을 예측한 뒤, 예측된 궤적이 가장 좋은 제어 입력 시퀀스를 찾는다. 핵심은 그 시퀀스 전체를 실행하지 않는다는 것이다. **첫 번째 행동만 실행하고, 다음 순간 새로운 측정값을 받아 처음부터 다시 계획한다.** 이 "계획-실행-폐기-재계획" 사이클이 MPC의 본질이다.

공간적으로 비유하면 이렇다. PID 제어기는 백미러만 보고 운전하는 것이고, MPC는 전방 200미터를 내다보며 운전한다. 커브가 보이면 미리 감속하고, 교차로가 다가오면 차선을 바꾼다. 다만 200미터 앞의 예측은 부정확할 수 있으므로, 50미터를 진행할 때마다 새로 앞을 내다보고 경로를 수정한다.

## 석유화학 공장에서 AI로

MPC의 산업적 기원은 1970년대 석유화학 공정 제어에 있다. Richalet et al.(1978)이 IDCOM을, Cutler와 Ramaker(1980)가 DMC를 독립적으로 개발했다. 석유 정제 공정에서는 수십 개 변수가 상호작용하고, 온도와 압력에 물리적 한계가 있으며, 제어 행동의 효과가 수 분에서 수 시간 뒤에 나타난다. PID 제어기를 수십 개 조합하는 것보다, 공정 모델로 미래를 예측하고 제약 조건을 명시적으로 반영하며 최적화하는 것이 훨씬 효과적이었다. 이후 Garcia, Prett, Morari(1989)가 MPC의 통합 이론 프레임워크를 정립했다.

이 제어공학의 패러다임이 AI에 직접적 영감을 준 대응 관계는 다음과 같다.

- 시스템의 물리 모델 f(x,u) --> MBRL의 **학습된 세계 모델**. 물리 법칙 대신 신경망이 환경의 동역학을 데이터로부터 학습한다
- 비용 함수 최소화 --> 기대 보상 최대화. 부호만 반대일 뿐 같은 최적화 문제다
- 예측 구간 N 스텝 --> 계획 수평선(planning horizon). 몇 수 앞을 내다볼 것인가
- "첫 행동만 실행하고 재계획" --> 모델 기반 RL에서도 매 스텝 재계획. 모델이 불완전하므로 과거 계획을 고집하지 않는다
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

Q는 상태 추적의 중요도를 결정하는 가중 행렬이고, R은 제어 입력 크기에 대한 벌점이다. P는 종단 비용으로, 예측 구간 끝에서의 안정성을 보장한다. x(k+1) = f(x(k), u(k))가 내부 모델이 등식 제약으로 작용하는 부분이며, X, U는 밸브 개도, 모터 토크 상한 같은 물리적 한계의 부등식 제약이다.

## 핵심 트레이드오프: 예측 구간의 딜레마

MPC에서 가장 근본적인 트레이드오프는 **예측 구간 N의 길이**다.

- **N이 길면**: 먼 미래까지 내다보므로 근시안적 결정을 피할 수 있다. 그러나 계산 비용이 급격히 증가하고, 먼 미래의 예측일수록 모델 오차가 누적되어 신뢰도가 떨어진다
- **N이 짧으면**: 계산이 빠르고 모델 오차 누적이 적지만, 먼 미래의 제약 위반이나 불리한 상황을 사전에 대비하지 못한다
- **Q와 R의 균형**: Q를 키우면 목표 추적이 공격적이 되고 입력이 거칠어진다. R을 키우면 입력이 부드러워지지만 목표 추적이 느려진다. "정확성 vs 부드러움"의 트레이드오프다

나머지를 버리고 첫 행동만 실행하는 이유도 이 맥락에서 이해된다. 모델이 완벽하지 않으므로 미래 예측이 멀수록 부정확하고, 매 순간 새로운 측정값이 들어오므로 새 계획이 이전 계획보다 낫다. **이동 수평선**(receding horizon)이라는 이름은 예측 구간의 끝점이 매 단계마다 한 칸씩 앞으로 밀리는 이 구조를 가리킨다.

## 현대 AI 기법과의 연결

MPC의 "내부 모델로 미래를 예측하고, 최적 행동을 계획하고, 첫 행동만 실행한 뒤 재계획한다"는 패러다임은 현대 AI의 핵심 흐름과 직접적으로 맞닿아 있다.

**제어공학에서 직접 계승된 구조:**

- **모델 기반 강화학습(Model-Based RL)**: Deisenroth & Rasmussen(2011)의 PILCO부터 최근까지, MBRL의 핵심 루프는 MPC와 동일하다 -- 세계 모델을 학습하고, 모델 안에서 롤아웃하여 최적 행동을 탐색하고, 첫 행동만 실행한 뒤 재계획한다. 차이는 모델의 출처에 있다. MPC의 모델은 물리 법칙으로 사전에 구축되지만, MBRL의 모델은 데이터에서 학습한다. 이 차이가 가져오는 최대 도전이 **모델 오류의 복합**이다. 학습된 모델의 작은 오차가 긴 롤아웃에서 눈덩이처럼 불어난다
- **MuZero**: DeepMind의 Schrittwieser et al.(2020)는 MPC 패턴을 가장 정교한 형태로 구현했다. 핵심 혁신은 관측 공간이 아닌 **학습된 잠재 공간**에서 모델을 구축한 것이다. 이 학습된 모델 위에서 몬테카를로 트리 탐색을 수행하는데, 이것은 MPC의 패턴 그 자체다. 바둑, 체스, 아타리에서 환경 규칙 없이 초인적 성능을 달성했다
- **Dreamer**: Hafner et al.(2020)는 비디오 예측 기반의 세계 모델을 학습하고, 모델 안에서 미래 궤적을 시뮬레이션하며 정책을 최적화했다. MPC의 핵심 이점인 **샘플 효율성** -- 시행착오를 실제 환경이 아닌 모델 안에서 수행 -- 을 신경망 시대에 실현한 것이다

**동일한 직관을 독립적으로 공유하는 구조적 유사성:**

- **LLM 추론 시 트리 탐색**: OpenAI o1 계열 모델이 답변 생성 시 여러 추론 경로를 내부적으로 탐색하고 최선을 선택하는 구조는, MPC가 여러 제어 시퀀스를 시뮬레이션한 뒤 최적 행동을 고르는 것과 동일한 "계획 후 실행" 패턴이다. 다만 이 유사성은 MPC에서 직접 유래한 것이 아니라 탐색 기반 의사결정의 일반적 구조다
- **자기 회귀 생성과 재계획**: LLM이 토큰을 하나씩 생성하며 매 스텝마다 전체 문맥을 재평가하는 과정은, MPC의 "첫 행동만 실행하고 재계획" 원리와 구조적으로 닮았다. 한 번에 전체 시퀀스를 확정하지 않고, 각 스텝에서 최신 정보를 반영하여 다음을 결정한다

## 한계와 약점

MPC 패러다임의 강력함에도 근본적 한계가 존재한다.

- **모델 정확성 의존**: MPC는 모델이 정확한 만큼만 좋다. 학습된 세계 모델의 경우, 작은 오차가 긴 롤아웃에서 복합적으로 누적되어 현실과 동떨어진 행동을 유발한다
- **실시간 계산 비용**: 매 시간 단계마다 최적화 문제를 풀어야 하므로, 제어 주기가 빠른 시스템에서 계산이 병목이 된다. 예를 들어 10ms 주기로 제어해야 하는 드론 비행에서, 최적화 계산이 10ms를 초과하면 제어가 지연된다
- **시뮬레이션-현실 간극(Sim-to-Real Gap)**: 시뮬레이터에서 학습한 세계 모델로 현실 로봇을 제어할 때, 마찰, 공기저항, 센서 노이즈 등이 성능을 저하시킨다. 도메인 랜덤화로 견실성을 높이지만, 간극을 완전히 메우지는 못한다
- **예측 구간의 근시안성**: N을 길게 잡으면 계산 비용과 모델 오차가 증가하고, 짧게 잡으면 근시안적 결정을 내린다. MuZero에서는 트리 탐색 깊이, Dreamer에서는 상상 궤적 길이로 이 트레이드오프가 나타난다

## 용어 정리

이동 수평선(receding horizon) - 매 시간 단계마다 예측 구간의 끝점이 앞으로 한 칸씩 이동하는 MPC의 핵심 구조

롤아웃(rollout) - 모델을 사용하여 현재 상태에서 미래 상태 궤적을 시뮬레이션하는 것

종단 비용(terminal cost) - 예측 구간의 마지막 시점에서 상태에 부과하는 추가 벌점, 유한 구간 MPC의 안정성 보장에 핵심적

세계 모델(world model) - 환경의 동역학을 학습하여 미래 상태를 예측할 수 있는 내부 모델

모델 오류 복합(compounding model error) - 학습된 모델의 작은 오차가 긴 롤아웃에서 누적되어 현실과의 괴리가 커지는 현상

재귀적 실현 가능성(recursive feasibility) - 현재 시간 단계에서 최적화 해가 존재하면 다음 시간 단계에서도 해가 존재함이 보장되는 성질

시뮬레이션-현실 간극(sim-to-real gap) - 시뮬레이터에서 학습된 정책이나 모델이 실제 환경에서 성능이 저하되는 현상

도메인 랜덤화(domain randomization) - 시뮬레이션의 물리적 파라미터를 무작위로 변화시켜 현실 환경에 대한 견실성을 높이는 기법
---EN---
Model Predictive Control - A control technique that predicts the future using an internal model, plans an optimal action sequence, executes only the first action, and re-plans at every moment

## Controlling by Looking Ahead with an Internal Model

A traditional PID controller reacts to past error. If the target temperature is 200 degrees and the current reading is 195, it increases heater output in proportion to that 5-degree gap. The problem is that this is strictly a "looking backward" approach. In systems like petrochemical refining where a control action's effect takes 30 minutes to manifest, adjusting based on past error alone causes overshoot, oscillation, or constraint violations.

Model Predictive Control (MPC) attacks this limitation head-on. It embeds a mathematical model of the system, uses that model to predict N steps into the future, and finds the control input sequence that yields the best predicted trajectory. The crucial point is that it does not execute the entire sequence. **It executes only the first action, receives a new measurement at the next moment, and re-plans from scratch.** This "plan-execute-discard-replan" cycle is the essence of MPC.

A spatial analogy helps. A PID controller is like driving using only the rearview mirror. MPC is like driving while scanning 200 meters ahead. Seeing a curve, it decelerates in advance; approaching an intersection, it changes lanes. But since predictions 200 meters out may be inaccurate, it re-scans the road ahead every 50 meters and adjusts the route.

## From Petrochemical Plants to AI

MPC's industrial origins lie in 1970s petrochemical process control. Richalet et al. (1978) developed IDCOM, and Cutler and Ramaker (1980) developed DMC independently. In oil refining, dozens of variables interact, physical limits exist on temperature and pressure, and control actions take minutes to hours to show effects. Rather than combining dozens of PID controllers, it was far more effective to predict the future with a process model, explicitly account for constraints, and optimize. Later, Garcia, Prett, and Morari (1989) established a unified theoretical framework for MPC.

The key correspondences through which this control engineering paradigm directly inspired AI are:

- Physical system model f(x,u) --> MBRL's **learned world model**. Instead of physics equations, a neural network learns environmental dynamics from data
- Cost function minimization --> expected reward maximization. The same optimization problem with the sign flipped
- Prediction horizon of N steps --> planning horizon. How many steps ahead to look
- "Execute only first action then replan" --> step-by-step replanning in model-based RL. Since the model is imperfect, clinging to old plans is counterproductive
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

Q is the weighting matrix determining how much state tracking matters, R penalizes control input magnitude, and P is the terminal cost ensuring stability at the horizon's end. The dynamics model acts as an equality constraint, while X and U reflect physical limits (valve positions, motor torque limits, etc.) as inequality constraints.

## The Core Tradeoff: The Horizon Dilemma

The most fundamental tradeoff in MPC is the **length of the prediction horizon N**.

- **Long N**: Looking far ahead avoids myopic decisions. However, computational cost increases sharply and predictions further into the future accumulate model errors, degrading reliability
- **Short N**: Computation is fast and model error accumulation is low, but the algorithm fails to anticipate distant constraint violations or unfavorable situations
- **Q vs. R balance**: Increasing Q makes target tracking aggressive but inputs rough. Increasing R makes inputs smooth but target tracking sluggish. A "precision vs. smoothness" tradeoff tuned differently for each application

Why only the first action is executed and the rest discarded becomes clear in this context. The model is imperfect, so predictions degrade with distance, and new measurements enable better plans. The name **receding horizon** refers to this structure where the prediction window's endpoint slides forward one step at each time step.

## Connections to Modern AI

MPC's paradigm of "predict the future with an internal model, plan optimal actions, execute only the first, and replan" is directly connected to core currents in modern AI.

**Structures directly inherited from control engineering:**

- **Model-Based Reinforcement Learning (MBRL)**: From Deisenroth & Rasmussen's (2011) PILCO onward, MBRL's core loop is identical to MPC -- learn a world model, rollout within the model to search for optimal actions, execute only the first in the real environment, and replan. The difference lies in the model's origin: MPC models are pre-built from physics; MBRL models are learned from data. The biggest challenge this creates is **compounding model error** -- small errors snowball over long rollouts
- **MuZero**: DeepMind's Schrittwieser et al. (2020) implemented the MPC pattern in its most refined form. The key innovation was building the model in a **learned latent space** rather than observation space. Monte Carlo Tree Search runs on top of this learned model -- precisely MPC's pattern. It achieved superhuman performance in Go, chess, and Atari without prior knowledge of environment rules
- **Dreamer**: Hafner et al. (2020) learned a video-prediction-based world model and optimized policy by simulating future trajectories within the model. This realizes MPC's core advantage -- **sample efficiency**, performing trial-and-error inside the model rather than the real environment -- in the neural network era

**Structural similarities sharing the same intuition independently:**

- **Tree search in LLM reasoning**: Models like OpenAI's o1 family internally explore multiple reasoning paths during generation and select the best -- the same "plan then act" pattern as MPC simulating multiple control sequences and choosing the optimal action. However, this resemblance derives from the general structure of search-based decision-making, not directly from MPC
- **Autoregressive generation and replanning**: The way LLMs generate tokens one at a time, re-evaluating full context at each step, structurally mirrors MPC's "execute only the first action and replan." Rather than committing to an entire sequence at once, each step incorporates the latest information to decide what comes next

## Limitations and Weaknesses

Despite MPC's paradigmatic power, fundamental limitations exist.

- **Model accuracy dependence**: MPC is only as good as its model. For learned world models, small errors compound over long rollouts, producing actions disconnected from reality
- **Real-time computational cost**: Solving an optimization problem at every time step creates bottlenecks in fast-cycle systems. For example, in drone flight requiring 10ms control cycles, if optimization exceeds 10ms, control is delayed
- **Sim-to-real gap**: When controlling real robots with world models learned in simulation, factors the simulator fails to capture -- friction, air resistance, sensor noise -- degrade performance. Domain randomization increases robustness but cannot fully bridge the gap
- **Horizon myopia**: Long N increases computational cost and accumulates model error. Short N leads to myopic decisions. In MuZero this manifests as tree search depth; in Dreamer, as imagination trajectory length

## Glossary

Receding horizon - MPC's core structure where the prediction window's endpoint advances one step forward at each time step

Rollout - simulating a future state trajectory from the current state using a model

Terminal cost - an additional penalty imposed on the state at the prediction horizon's final time step, essential for guaranteeing finite-horizon MPC stability

World model - an internal model that learns environmental dynamics to predict future states

Compounding model error - the phenomenon where small errors in learned models accumulate over long rollouts, widening the gap with reality

Recursive feasibility - the property that if an optimization solution exists at the current time step, a solution is guaranteed to exist at the next

Sim-to-real gap - the phenomenon where policies or models learned in simulators show degraded performance in real environments

Domain randomization - a technique that randomly varies simulation physics parameters to increase robustness to real-world conditions
