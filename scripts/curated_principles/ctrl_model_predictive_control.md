---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 모델 예측 제어, 이동 수평선, 세계 모델, 모델 기반 강화학습, 계획 수립, 시뮬레이션에서 현실로, 롤아웃, 재계획
keywords_en: model predictive control, receding horizon, world model, model-based reinforcement learning, planning, sim-to-real, rollout, re-planning
---
Model Predictive Control (MPC) - 내부 모델로 미래를 예측하고, 최적 행동 시퀀스를 계획한 뒤, 첫 행동만 실행하고 다시 계획하는 제어 패러다임

## 미래를 시뮬레이션하여 현재를 결정하다

인간은 운전할 때 전방 도로를 보고 미래를 예측한다. 커브가 다가오면 미리 감속하고, 교차로가 보이면 차선을 변경한다. 과거 데이터에만 반응하는 것이 아니라, **내부 모델로 미래를 예측하고 계획**한다. 그리고 계획을 한번 세웠다고 맹목적으로 따르지 않는다. 매 순간 새로운 정보가 들어오면 계획을 수정한다.

이것이 정확히 모델 예측 제어(Model Predictive Control, MPC)의 작동 방식이다.

MPC의 산업적 기원은 1970년대 석유화학 공정 제어에 있다. Richalet et al.(1978)이 IDCOM(Identification and Command)을, Cutler와 Ramaker(1980)가 DMC(Dynamic Matrix Control)를 각각 독립적으로 개발했다. 석유 정제 공정에서는 수십 개의 변수가 상호작용하며, 온도와 압력에 물리적 제약이 있고, 제어 행동의 효과가 수 분에서 수 시간 후에 나타난다. PID 제어기를 수십 개 조합하는 것보다, 공정 모델로 미래를 예측하고 제약 조건을 명시적으로 고려하며 최적화하는 것이 훨씬 효과적이었다.

## MPC의 핵심 알고리즘

MPC의 각 시간 단계에서 일어나는 일을 정리하면 다음과 같다.

1. 현재 상태 관측: 시스템의 현재 상태 x(0)를 측정 또는 추정한다
2. 미래 예측: 내부 모델을 사용하여 N 스텝 앞까지의 상태 궤적을 예측한다
3. 최적화 문제 풀기: 예측 구간 내에서 비용을 최소화하는 제어 시퀀스 {u(0), u(1), ..., u(N-1)}를 구한다
4. 첫 행동만 실행: 최적 시퀀스의 첫 번째 u(0)만 실제 시스템에 적용한다
5. 반복: 다음 시간 단계에서 1번으로 돌아간다

최적화 문제의 수학적 형태는 다음과 같다.

min sum_{k=0}^{N-1} [||x(k) - x_ref||^2_Q + ||u(k)||^2_R] + ||x(N) - x_ref||^2_P

subject to:
x(k+1) = f(x(k), u(k))        (시스템 모델)
x(k) in X                      (상태 제약)
u(k) in U                      (입력 제약)

각 구성 요소의 의미를 풀면 다음과 같다.

- ||x(k) - x_ref||^2_Q --> 상태가 목표 x_ref에서 벗어난 정도를 Q 행렬로 가중하여 벌점 부과
- ||u(k)||^2_R --> 제어 입력의 크기를 R 행렬로 가중하여 벌점 부과 (에너지 절약, 급격한 변화 억제)
- ||x(N) - x_ref||^2_P --> 종단 비용, 예측 구간 끝에서의 상태를 추가로 벌점 부과 (안정성 보장)
- x(k+1) = f(x(k), u(k)) --> 시스템의 동역학 모델이 등식 제약으로 작용
- X, U --> 물리적 한계(온도 범위, 밸브 개도, 최대 토크 등)가 부등식 제약으로 반영

**이동 수평선**(receding horizon)이라는 이름이 핵심을 드러낸다. 예측 구간의 끝점(수평선)이 매 단계마다 한 칸씩 앞으로 이동한다. 첫 행동만 실행하고 나머지를 버리는 이유는 두 가지다. (1) 모델이 완벽하지 않으므로 미래 예측이 멀어질수록 부정확해진다. (2) 새로운 관측이 들어오면 더 나은 계획을 세울 수 있다. 이 "계획-실행-재계획" 사이클이 MPC의 본질이다.

## MPC와 모델 기반 강화학습: 놀라운 수렴

MPC와 모델 기반 강화학습(Model-Based RL)의 구조적 유사성은 놀라울 정도다. 핵심 패턴을 병렬로 비교하면 다음과 같다.

- MPC의 시스템 모델 f(x,u) --> MBRL의 학습된 세계 모델(world model, learned dynamics)
- MPC의 비용 함수 최소화 --> MBRL의 기대 보상 최대화 (부호만 반전)
- MPC의 예측 구간 N --> MBRL의 계획 수평선(planning horizon)
- MPC의 "첫 행동만 실행" --> MBRL의 첫 행동 실행 후 재계획
- MPC의 이동 수평선 --> MBRL의 매 스텝 재계획
- MPC의 물리 모델 --> MBRL의 신경망으로 학습한 전이 모델
- MPC의 제약 조건 --> MBRL의 안전 제약(safe RL) 또는 행동 클리핑

차이점은 모델의 출처에 있다. MPC에서 모델은 물리 법칙이나 시스템 식별(system identification)을 통해 사전에 구축된다. MBRL에서 모델은 에이전트가 환경과 상호작용하며 데이터로부터 학습한다. 이 차이가 가져오는 가장 큰 도전이 **모델 오류의 복합**(compounding model error)이다. 학습된 모델이 약간의 오차를 가지면, 긴 롤아웃(rollout)에서 오차가 누적되어 예측이 현실과 동떨어진다.

## MuZero와 Dreamer: MPC 패턴의 현대적 구현

DeepMind의 MuZero(Schrittwieser et al., 2020)는 MPC 패턴을 가장 세련된 형태로 구현했다. MuZero의 핵심 혁신은 환경의 관측 공간이 아닌 **학습된 잠재 공간**에서 모델을 구축한다는 것이다. 세 가지 학습된 함수가 있다.

- 표현 함수(representation function): 관측 o를 잠재 상태 s로 인코딩한다
- 역학 함수(dynamics function): 잠재 상태 s와 행동 a로부터 다음 잠재 상태 s'를 예측한다
- 예측 함수(prediction function): 잠재 상태 s에서 정책과 가치를 출력한다

MuZero는 이 학습된 모델 위에서 MCTS(몬테카를로 트리 탐색)를 수행한다. 이것은 MPC의 "모델로 미래를 예측하고 최적 행동을 탐색한다"는 패턴 그 자체다. 바둑, 체스, 아타리 게임에서 환경 규칙에 대한 사전 지식 없이 초인적 성능을 달성했다.

Hafner et al.(2020)의 Dreamer는 비디오 예측 기반의 세계 모델을 학습하고, 모델 안에서 "꿈을 꾸듯" 미래 궤적을 상상하며 정책을 최적화한다. 실제 환경과의 상호작용 횟수를 획기적으로 줄이면서도 복잡한 로봇 제어 과제를 해결했다.

두 접근 모두 MPC의 핵심 직관을 공유한다. "좋은 모델이 있으면, 시행착오를 실제 환경이 아닌 모델 안에서 할 수 있다." 이것은 모델 프리 RL(DQN, PPO 등)이 수백만 번의 환경 상호작용을 필요로 하는 것과 대비되는 **샘플 효율성**의 원천이다.

## 세계 모델의 부상

MPC의 "내부 모델로 미래를 예측한다"는 원리는 더 넓은 맥락에서 **세계 모델** 연구의 핵심 동기가 되었다.

Ha & Schmidhuber(2018)의 "World Models" 논문은 환경의 시각적 역학을 VAE + RNN으로 학습한 모델 안에서 정책을 전적으로 학습하는 가능성을 보여주었다. 에이전트가 "꿈속에서" 학습하는 것이다.

LeCun(2022)이 제안한 JEPA(Joint Embedding Predictive Architecture) 같은 자기 지도 학습 프레임워크도 결국 "세계의 내부 모델을 학습하고, 그것으로 미래를 예측하며, 예측에 기반하여 행동한다"는 MPC의 철학을 공유한다. 이것은 인지과학에서 말하는 **예측 부호화** 가설 -- 뇌가 끊임없이 감각 입력을 예측하고 예측 오차만 위로 전파한다 -- 과도 맞닿아 있다.

## 한계와 약점

MPC 패턴의 강력함에도 불구하고, 근본적 한계가 존재한다.

- 모델 정확성 의존: MPC는 모델의 정확도만큼만 좋다. "모든 모델은 틀리다. 일부는 유용하다"(George Box)라는 경구가 정확히 적용된다. 학습된 세계 모델의 오차는 긴 계획 수평선에서 복합적으로 증가하며, 이로 인해 현실과 동떨어진 행동이 나올 수 있다.
- 실시간 계산 비용: 매 시간 단계마다 최적화 문제를 풀어야 하므로, 제어 주기가 빠른 시스템(예: 10ms 단위 로봇 제어)에서 계산이 병목이 된다. 비선형 MPC(NMPC)의 경우 비볼록 최적화를 반복적으로 풀어야 하여 더욱 부담이 크다.
- 시뮬레이션-현실 간극(Sim-to-Real Gap): 시뮬레이션에서 학습된 세계 모델로 현실 환경을 제어할 때, 시뮬레이터와 현실의 차이가 성능 저하를 유발한다. 도메인 랜덤화(domain randomization)와 시스템 식별(system identification)이 대응책이지만, 간극을 완전히 메우지는 못한다.
- 지역 최적 문제: 비선형 시스템에서 MPC의 최적화가 지역 최적해에 빠질 수 있다. 전역 최적을 보장하려면 계산 비용이 크게 증가한다.
- 장기 계획의 한계: MPC의 예측 구간 N이 길어지면 계산 비용이 증가하고 모델 오차가 누적된다. 짧은 N은 근시안적 결정을 낳는다. 이 트레이드오프는 MuZero 같은 시스템에서도 트리 깊이 설정이라는 형태로 나타난다.

## 용어 정리

이동 수평선(receding horizon) - 매 시간 단계마다 예측 구간의 끝점이 앞으로 한 칸씩 이동하는 MPC의 핵심 개념

롤아웃(rollout) - 모델을 사용하여 미래 상태 궤적을 시뮬레이션하는 것

세계 모델(world model) - 환경의 동역학을 학습하여 미래 상태를 예측할 수 있는 내부 모델

잠재 공간(latent space) - 관측의 고차원 표현을 압축한 저차원 표현 공간, MuZero가 여기서 역학 모델을 구축

시뮬레이션-현실 간극(sim-to-real gap) - 시뮬레이터에서 학습된 정책이나 모델이 실제 환경에서 성능이 저하되는 현상

도메인 랜덤화(domain randomization) - 시뮬레이션의 물리적 파라미터를 무작위로 변화시켜 현실에 대한 견실성을 높이는 기법

제약 조건(constraints) - 물리적 한계나 안전 조건 등 최적화에서 반드시 만족해야 하는 조건

모델 오류 복합(compounding model error) - 학습된 모델의 작은 오차가 긴 롤아웃에서 누적되어 커지는 현상

예측 부호화(predictive coding) - 뇌가 감각 입력을 지속적으로 예측하고 예측 오차만 처리한다는 신경과학 가설

---EN---
Model Predictive Control (MPC) - A control paradigm that predicts the future using an internal model, plans an optimal action sequence, executes only the first action, and re-plans

## Simulating the Future to Decide the Present

When humans drive, they look at the road ahead and predict the future. Approaching a curve, they decelerate in advance; seeing an intersection, they change lanes. Rather than merely reacting to past data, they **look ahead with an internal model and plan**. And they don't blindly follow a plan once made -- as new information arrives each moment, they revise the plan.

This is exactly how Model Predictive Control (MPC) works.

MPC's industrial origins lie in 1970s petrochemical process control. Richalet et al. (1978) independently developed IDCOM (Identification and Command) and Cutler and Ramaker (1980) developed DMC (Dynamic Matrix Control). In oil refining, dozens of variables interact, physical constraints exist on temperature and pressure, and control actions take minutes to hours to show effects. Rather than combining dozens of PID controllers, it was far more effective to predict the future with a process model, explicitly account for constraints, and optimize.

## The Core MPC Algorithm

What happens at each time step of MPC:

1. Observe current state: Measure or estimate the system's current state x(0)
2. Predict the future: Use an internal model to predict the state trajectory N steps ahead
3. Solve the optimization problem: Find the control sequence {u(0), u(1), ..., u(N-1)} that minimizes cost within the prediction horizon
4. Execute only the first action: Apply only the first u(0) from the optimal sequence to the actual system
5. Repeat: Return to step 1 at the next time step

The mathematical formulation of the optimization problem:

min sum_{k=0}^{N-1} [||x(k) - x_ref||^2_Q + ||u(k)||^2_R] + ||x(N) - x_ref||^2_P

subject to:
x(k+1) = f(x(k), u(k))        (system model)
x(k) in X                      (state constraints)
u(k) in U                      (input constraints)

Breaking down each component:

- ||x(k) - x_ref||^2_Q --> penalizes state deviation from target x_ref, weighted by Q matrix
- ||u(k)||^2_R --> penalizes control input magnitude, weighted by R matrix (energy conservation, suppressing abrupt changes)
- ||x(N) - x_ref||^2_P --> terminal cost, additional penalty on state at the prediction horizon's end (stability guarantee)
- x(k+1) = f(x(k), u(k)) --> the system's dynamics model acts as an equality constraint
- X, U --> physical limits (temperature ranges, valve positions, maximum torque) reflected as inequality constraints

The name **receding horizon** reveals the essence. The prediction horizon's endpoint moves forward one step at each time step. The first-action-only strategy exists for two reasons: (1) The model is imperfect, so predictions become less accurate further into the future. (2) New observations enable better planning. This "plan-execute-replan" cycle is MPC's essence.

## MPC and Model-Based RL: A Remarkable Convergence

The structural similarity between MPC and Model-Based Reinforcement Learning (MBRL) is striking. Comparing core patterns in parallel:

- MPC system model f(x,u) --> MBRL's learned world model (learned dynamics)
- MPC cost function minimization --> MBRL's expected reward maximization (sign flipped)
- MPC prediction horizon N --> MBRL's planning horizon
- MPC "execute only first action" --> MBRL's execute first action then replan
- MPC receding horizon --> MBRL's per-step replanning
- MPC physics model --> MBRL's neural network-learned transition model
- MPC constraints --> MBRL's safety constraints (safe RL) or action clipping

The difference lies in the model's origin. In MPC, models are pre-built through physics or system identification. In MBRL, models are learned from data as the agent interacts with the environment. The biggest challenge this difference creates is **compounding model error**. When learned models have slight errors, they accumulate over long rollouts, causing predictions to diverge from reality.

## MuZero and Dreamer: Modern Implementations of the MPC Pattern

DeepMind's MuZero (Schrittwieser et al., 2020) implements the MPC pattern in its most refined form. MuZero's key innovation is building models in a **learned latent space** rather than the environment's observation space. Three learned functions:

- Representation function: Encodes observation o into latent state s
- Dynamics function: Predicts next latent state s' from latent state s and action a
- Prediction function: Outputs policy and value from latent state s

MuZero performs MCTS (Monte Carlo Tree Search) on top of this learned model. This is precisely MPC's pattern of "predicting the future with a model and searching for optimal actions." It achieved superhuman performance in Go, chess, and Atari games without prior knowledge of environment rules.

Hafner et al.'s (2020) Dreamer learns a video-prediction-based world model and optimizes policy by "dreaming" future trajectories within the model. It dramatically reduced real environment interactions while solving complex robotic control tasks.

Both approaches share MPC's core intuition: "With a good model, trial-and-error can happen inside the model rather than in the real environment." This is the source of **sample efficiency** compared to model-free RL (DQN, PPO, etc.), which requires millions of environment interactions.

## The Rise of World Models

MPC's principle of "predicting the future with an internal model" has become the core motivation for broader **world model** research.

Ha & Schmidhuber's (2018) "World Models" paper demonstrated the possibility of learning policies entirely within a model that captures environmental visual dynamics via VAE + RNN. The agent learns "in its dreams."

Self-supervised learning frameworks like LeCun's (2022) JEPA (Joint Embedding Predictive Architecture) ultimately share MPC's philosophy: "learn an internal model of the world, predict the future with it, and act based on predictions." This also connects to the **predictive coding** hypothesis in cognitive science -- the brain constantly predicts sensory inputs and propagates only prediction errors upward.

## Limitations and Weaknesses

Despite the MPC pattern's power, fundamental limitations exist.

- Model accuracy dependence: MPC is only as good as its model. "All models are wrong. Some are useful" (George Box) applies precisely. Learned world model errors compound over long planning horizons, potentially producing actions disconnected from reality.
- Real-time computational cost: Solving an optimization problem at every time step creates bottlenecks in fast control systems (e.g., 10ms robotic control). Nonlinear MPC (NMPC) requires repeatedly solving non-convex optimization, making the burden even greater.
- Sim-to-Real Gap: When controlling real environments with world models learned in simulation, differences between simulator and reality cause performance degradation. Domain randomization and system identification are countermeasures but cannot fully bridge the gap.
- Local optima problem: In nonlinear systems, MPC optimization can get trapped in local optima. Guaranteeing global optimality significantly increases computational cost.
- Long-horizon planning limitations: As MPC's prediction horizon N grows, computational cost increases and model errors accumulate. Short N leads to myopic decisions. This tradeoff manifests as tree depth settings in systems like MuZero.

## Glossary

Receding horizon - MPC's core concept where the prediction horizon's endpoint advances one step forward at each time step

Rollout - simulating a future state trajectory using a model

World model - an internal model that learns environmental dynamics to predict future states

Latent space - a low-dimensional representation space compressing high-dimensional observations; MuZero builds its dynamics model here

Sim-to-real gap - the phenomenon where policies or models learned in simulators show degraded performance in real environments

Domain randomization - a technique that randomly varies simulation physics parameters to increase robustness to reality

Constraints - conditions that must be satisfied in optimization, such as physical limits or safety requirements

Compounding model error - the phenomenon where small errors in learned models accumulate and grow over long rollouts

Predictive coding - a neuroscience hypothesis that the brain continuously predicts sensory inputs and processes only prediction errors
