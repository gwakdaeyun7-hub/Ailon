---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 모델 예측 제어, 이동 수평선, 세계 모델, 모델 기반 강화학습, 제약 조건 최적화, 롤아웃, 재계획, 모델 오류 복합
keywords_en: model predictive control, receding horizon, world model, model-based reinforcement learning, constrained optimization, rollout, re-planning, compounding model error
---
Model Predictive Control - 내부 모델로 미래를 예측하고, 최적 행동 시퀀스를 계획한 뒤, 첫 행동만 실행하고 매 순간 다시 계획하는 제어 기법

## 내부 모델로 미래를 내다보는 제어

전통적인 PID 제어기는 과거의 오차에 반응한다. 목표 온도가 200도인데 현재 195도이면, 그 5도 차이에 비례하여 히터 출력을 올린다. 오차가 누적되면 보정하고, 변화 속도도 참고한다. 문제는 이것이 철저하게 "과거를 되돌아보는" 방식이라는 점이다. 석유화학 정제 공정처럼 온도를 올리는 행동의 효과가 30분 뒤에야 나타나는 시스템에서는, 과거 오차만 보고 현재를 조절하면 목표를 지나쳐 진동하거나 제약을 위반한다.

모델 예측 제어(Model Predictive Control, MPC)는 이 한계를 정면으로 돌파한다. 시스템의 수학적 모델을 내장하고, 그 모델로 미래 N 스텝을 예측한 뒤, 예측된 궤적이 가장 좋은 제어 입력 시퀀스를 찾는다. 핵심은 그 시퀀스 전체를 실행하지 않는다는 것이다. **첫 번째 행동만 실행하고, 다음 순간 새로운 측정값을 받아 처음부터 다시 계획한다.** 이 "계획-실행-폐기-재계획" 사이클이 MPC의 본질이다.

공간적으로 비유하면 이렇다. PID 제어기는 뒤를 보며 운전하는 것과 같다. 백미러만 보고 핸들을 돌린다. MPC는 전방 200미터를 내다보며 운전한다. 커브가 보이면 미리 감속하고, 교차로가 다가오면 차선을 바꾼다. 다만 200미터 앞의 예측은 부정확할 수 있으므로, 50미터를 진행할 때마다 새로 앞을 내다보고 경로를 수정한다.

## 석유화학 공장에서 AI로

MPC의 산업적 기원은 1970년대 석유화학 공정 제어에 있다. Richalet et al.(1978)이 IDCOM(Identification and Command)을, Cutler와 Ramaker(1980)가 DMC(Dynamic Matrix Control)를 독립적으로 개발했다. 석유 정제 공정에서는 수십 개 변수가 상호작용하고, 온도와 압력에 물리적 한계가 있으며, 제어 행동의 효과가 수 분에서 수 시간 뒤에 나타난다. PID 제어기를 수십 개 조합하는 것보다, 공정 모델로 미래를 예측하고 제약 조건을 명시적으로 반영하며 최적화하는 것이 훨씬 효과적이었다. 이후 Garcia, Prett, Morari(1989)가 MPC의 통합 이론 프레임워크를 정립하면서, 개별 산업 기법들이 하나의 학문적 체계로 수렴했다.

이 제어공학의 패러다임이 AI에 직접적 영감을 준 대응 관계는 다음과 같다.

- 시스템의 물리 모델 f(x,u) --> MBRL의 **학습된 세계 모델**(world model). 물리 법칙 대신 신경망이 환경의 동역학을 데이터로부터 학습한다
- 비용 함수 최소화 --> 기대 보상 최대화. 부호만 반대일 뿐 같은 최적화 문제다
- 예측 구간 N 스텝 --> 계획 수평선(planning horizon). 몇 수 앞을 내다볼 것인가
- "첫 행동만 실행하고 재계획" --> 모델 기반 RL에서도 매 스텝 재계획. 모델이 불완전하므로 과거 계획을 고집하지 않는다
- 상태/입력 제약 조건 --> 안전 제약(safe RL), 행동 클리핑(action clipping). "로봇 팔이 관절 한계를 넘지 않는다"
- 이동 수평선(receding horizon) --> 매 시간 단계마다 예측 창이 앞으로 한 칸씩 이동하는 구조

## MPC의 한 사이클: 다섯 단계

MPC가 매 시간 단계에서 수행하는 작업을 정리하면 다음과 같다.

1. 현재 상태를 관측한다. 시스템의 상태 x(0)를 센서로 측정하거나 상태 추정기로 추정한다
2. 내부 모델로 미래를 예측한다. 모델 f(x,u)를 사용하여 N 스텝 앞까지의 상태 궤적을 시뮬레이션한다. 이 시뮬레이션을 **롤아웃**(rollout)이라 부른다
3. 최적화 문제를 푼다. 예측 구간 전체에서 비용을 최소화하는 제어 시퀀스 {u(0), u(1), ..., u(N-1)}를 구한다
4. 첫 행동만 실행한다. 최적 시퀀스의 첫 번째 u(0)만 실제 시스템에 적용하고 나머지는 버린다
5. 다음 시간 단계에서 1번으로 돌아간다

3단계에서 푸는 최적화 문제의 수학적 형태는 다음과 같다.

min sum_{k=0}^{N-1} [||x(k) - x_ref||^2_Q + ||u(k)||^2_R] + ||x(N) - x_ref||^2_P

subject to:
x(k+1) = f(x(k), u(k))
x(k) in X, u(k) in U

각 항의 의미를 풀어보면 다음과 같다.

- ||x(k) - x_ref||^2_Q: 상태가 목표 x_ref에서 벗어난 정도에 대한 벌점이다. 가중 행렬 Q가 "어떤 상태 변수를 더 중요하게 볼 것인가"를 결정한다. 예를 들어 화학 반응기에서 온도 편차에 Q를 크게, 압력 편차에 작게 설정하면 온도 추적을 우선한다
- ||u(k)||^2_R: 제어 입력 크기에 대한 벌점이다. R이 크면 입력 변화를 억제하여 에너지를 아끼고 급격한 조작을 피한다. R이 0이면 입력을 아무리 크게 써도 벌점이 없으므로 시스템이 난폭하게 동작할 수 있다
- ||x(N) - x_ref||^2_P: 종단 비용(terminal cost)이다. 예측 구간 끝에서의 상태에 추가 벌점을 부과하여 안정성을 보장한다. P가 없으면 알고리즘이 "어차피 다시 계획하니까" 하며 구간 끝에서 상태가 발산하는 것을 방치할 수 있다
- x(k+1) = f(x(k), u(k)): 시스템의 동역학 모델이 등식 제약으로 작용한다. 이것이 "내부 모델"이다
- X, U: 물리적 한계가 부등식 제약으로 반영된다. 밸브 개도 0~100%, 모터 토크 상한, 온도 안전 범위 같은 것들이다

## 핵심 트레이드오프: 예측 구간의 딜레마

MPC에서 가장 근본적인 트레이드오프는 **예측 구간 N의 길이**다.

- **N이 길면**: 먼 미래까지 내다보므로 근시안적 결정을 피할 수 있다. 그러나 계산 비용이 급격히 증가하고(최적화 변수 수가 N에 비례), 먼 미래의 예측일수록 모델 오차가 누적되어 신뢰도가 떨어진다. 30분 뒤를 예측하는 것과 3시간 뒤를 예측하는 것의 정확도 차이를 생각하면 된다
- **N이 짧으면**: 계산이 빠르고 모델 오차 누적이 적지만, 가까운 미래만 보고 결정하므로 먼 미래의 제약 위반이나 불리한 상황을 사전에 대비하지 못한다
- **Q와 R의 균형**: Q를 키우면 목표 추적이 공격적이 되고 입력이 거칠어진다. R을 키우면 입력이 부드러워지지만 목표 추적이 느려진다. 이것은 "정확성 vs 부드러움"의 트레이드오프이며, 응용 분야마다 다르게 설정한다

나머지를 버리고 첫 행동만 실행하는 이유도 이 맥락에서 이해된다. (1) 모델이 완벽하지 않으므로 미래 예측이 멀수록 부정확하다. (2) 매 순간 새로운 측정값이 들어오므로, 그 정보를 반영한 새 계획이 이전 계획보다 낫다. **이동 수평선**(receding horizon)이라는 이름은 예측 구간의 끝점(수평선)이 매 단계마다 한 칸씩 앞으로 밀리는 이 구조를 가리킨다.

## 안정성과 실현 가능성의 이론

MPC의 이론적 심화는 "이 반복 과정이 시스템을 안정하게 유지하는가?"라는 질문에서 출발한다.

유한 예측 구간 MPC는 원론적으로 안정성을 보장하지 않는다. 예측 구간 밖의 미래를 고려하지 않기 때문이다. 이 문제를 해결하는 핵심 장치가 종단 비용 P와 **종단 제약**(terminal constraint)이다. Mayne et al.(2000)은 종단 비용 P를 적절히 선택하면(보통 무한 수평선 LQR의 비용과 일치시킴), 유한 예측 구간 MPC가 무한 수평선 최적 제어와 동등한 안정성을 가짐을 증명했다. 직관적으로, P는 "예측 구간 밖에서 발생할 비용의 근사치"를 미리 부과하여, 알고리즘이 구간 끝에서의 상태를 방치하지 않게 만드는 장치다.

선형 시스템에서 MPC의 최적화 문제는 **이차 계획법**(Quadratic Programming, QP)으로 환원된다. QP는 볼록 최적화이므로 전역 최적해를 효율적으로 구할 수 있다. 그러나 비선형 시스템에서는 비볼록 최적화가 되어 지역 최적에 빠질 위험이 있고, 계산 비용도 크게 증가한다. 이것이 비선형 MPC(Nonlinear MPC, NMPC)의 핵심 난제다.

**실현 가능성**(feasibility)도 중요한 개념이다. 제약 조건이 있는 MPC에서, 이번 시간 단계에서 해를 찾았다고 해서 다음 시간 단계에서도 해가 존재한다는 보장은 없다. 이를 **재귀적 실현 가능성**(recursive feasibility)이라 부르며, 종단 제약을 적절히 설계하면 이를 보장할 수 있다. 실용적으로는 **소프트 제약**(soft constraint) -- 제약 위반에 큰 벌점을 부과하되 위반 자체는 허용 -- 을 사용하여 해가 존재하지 않는 상황을 회피한다.

## 현대 AI 기법과의 연결

MPC의 "내부 모델로 미래를 예측하고, 최적 행동을 계획하고, 첫 행동만 실행한 뒤 재계획한다"는 패러다임은 현대 AI의 핵심 흐름과 직접적으로 맞닿아 있다.

**제어공학에서 직접 계승된 구조:**

- **모델 기반 강화학습(Model-Based RL)**: Deisenroth & Rasmussen(2011)의 PILCO부터 최근까지, MBRL의 핵심 루프는 MPC와 동일하다 -- 세계 모델을 학습하고, 모델 안에서 롤아웃하여 최적 행동을 탐색하고, 실제 환경에서는 첫 행동만 실행한 뒤 재계획한다. 차이는 모델의 출처에 있다. MPC의 모델은 물리 법칙이나 시스템 식별로 사전에 구축되지만, MBRL의 모델은 에이전트가 환경과 상호작용하며 데이터에서 학습한다. 이 차이가 가져오는 최대 도전이 **모델 오류의 복합**(compounding model error)이다. 학습된 모델의 작은 오차가 긴 롤아웃에서 눈덩이처럼 불어나, 예측이 현실과 동떨어진다
- **MuZero**: DeepMind의 Schrittwieser et al.(2020)는 MPC 패턴을 가장 정교한 형태로 구현했다. 핵심 혁신은 관측 공간이 아닌 **학습된 잠재 공간**(latent space)에서 모델을 구축한 것이다. 표현 함수가 관측을 잠재 상태로 인코딩하고, 역학 함수가 잠재 상태에서 다음 상태를 예측하며, 예측 함수가 정책과 가치를 출력한다. 이 학습된 모델 위에서 몬테카를로 트리 탐색(MCTS)을 수행하는데, 이것은 "모델로 미래를 시뮬레이션하고 최적 행동을 탐색한다"는 MPC의 패턴 그 자체다. 바둑, 체스, 아타리에서 환경 규칙 없이 초인적 성능을 달성했다
- **Dreamer**: Hafner et al.(2020)는 비디오 예측 기반의 세계 모델을 학습하고, 모델 안에서 미래 궤적을 시뮬레이션하며 정책을 최적화했다. 실제 환경 상호작용 횟수를 크게 줄이면서도 복잡한 로봇 제어 과제를 해결했다. MPC의 핵심 이점인 **샘플 효율성** -- 시행착오를 실제 환경이 아닌 모델 안에서 수행 -- 을 신경망 시대에 실현한 것이다

**동일한 직관을 독립적으로 공유하는 구조적 유사성:**

- **LLM의 계획과 추론**: 대규모 언어 모델에서 Chain-of-Thought 추론이나 Tree-of-Thought 탐색은 "미래 결과를 내부적으로 시뮬레이션하고 가장 좋은 경로를 선택한다"는 점에서 MPC의 구조를 연상시킨다. 그러나 LLM은 MPC에서 직접 영감을 받아 설계된 것이 아니라, 별도의 연구 흐름에서 발전한 것이다
- **예측 부호화(Predictive Coding)와 세계 모델**: 인지과학의 예측 부호화 가설 -- 뇌가 끊임없이 감각 입력을 예측하고, 예측 오차만 위로 전파한다 -- 은 MPC의 "내부 모델로 예측하고 오차를 수정한다"는 철학과 구조적으로 닮아 있다. Ha & Schmidhuber(2018)의 "World Models" 논문이나 LeCun(2022)의 JEPA도 이 계열에 속한다. 그러나 이들은 MPC에서 직접 파생되었다기보다, "좋은 내부 모델이 있으면 효율적으로 행동할 수 있다"는 공통 직관을 공유하는 것이다

## 한계와 약점

MPC 패러다임의 강력함에도 근본적 한계가 존재한다.

- **모델 정확성 의존**: MPC는 모델이 정확한 만큼만 좋다. 학습된 세계 모델의 경우, 작은 오차가 긴 롤아웃에서 복합적으로 누적되어 현실과 동떨어진 행동을 유발한다. 모델이 경험하지 못한 상황(분포 밖 영역)에서 예측이 급격히 무너지는 것도 같은 맥락이다
- **실시간 계산 비용**: 매 시간 단계마다 최적화 문제를 풀어야 하므로, 제어 주기가 빠른 시스템에서 계산이 병목이 된다. 비선형 MPC는 비볼록 최적화를 반복적으로 풀어야 하여 부담이 더 크다. 예를 들어 10ms 주기로 제어해야 하는 드론 비행에서, 최적화 계산이 10ms를 초과하면 제어가 지연된다
- **시뮬레이션-현실 간극(Sim-to-Real Gap)**: 시뮬레이터에서 학습한 세계 모델로 현실 로봇을 제어할 때, 마찰, 공기저항, 센서 노이즈 등 시뮬레이터가 포착하지 못한 요소가 성능을 저하시킨다. 도메인 랜덤화(domain randomization)로 시뮬레이션 파라미터를 무작위로 변화시켜 견실성을 높이지만, 간극을 완전히 메우지는 못한다
- **예측 구간의 근시안성**: N을 길게 잡으면 계산 비용이 증가하고 모델 오차가 누적된다. 짧게 잡으면 먼 미래를 고려하지 못하여 근시안적 결정을 내린다. MuZero에서는 트리 탐색 깊이라는 형태로, Dreamer에서는 상상 궤적 길이라는 형태로 이 트레이드오프가 나타난다

## 용어 정리

PID 제어기(PID controller) - 오차의 비례(Proportional), 적분(Integral), 미분(Derivative) 세 항을 조합하여 제어 입력을 산출하는 고전적 피드백 제어기

이동 수평선(receding horizon) - 매 시간 단계마다 예측 구간의 끝점이 앞으로 한 칸씩 이동하는 MPC의 핵심 구조

롤아웃(rollout) - 모델을 사용하여 현재 상태에서 미래 상태 궤적을 시뮬레이션하는 것

종단 비용(terminal cost) - 예측 구간의 마지막 시점에서 상태에 부과하는 추가 벌점, 유한 구간 MPC의 안정성 보장에 핵심적

이차 계획법(Quadratic Programming) - 목적 함수가 이차식이고 제약이 선형인 볼록 최적화 문제, 선형 MPC의 각 스텝에서 풀어야 하는 문제 유형

세계 모델(world model) - 환경의 동역학을 학습하여 미래 상태를 예측할 수 있는 내부 모델

모델 오류 복합(compounding model error) - 학습된 모델의 작은 오차가 긴 롤아웃에서 누적되어 현실과의 괴리가 커지는 현상

재귀적 실현 가능성(recursive feasibility) - 현재 시간 단계에서 최적화 해가 존재하면 다음 시간 단계에서도 해가 존재함이 보장되는 성질

시뮬레이션-현실 간극(sim-to-real gap) - 시뮬레이터에서 학습된 정책이나 모델이 실제 환경에서 성능이 저하되는 현상

도메인 랜덤화(domain randomization) - 시뮬레이션의 물리적 파라미터를 무작위로 변화시켜 현실 환경에 대한 견실성을 높이는 기법

---EN---
Model Predictive Control - A control technique that predicts the future using an internal model, plans an optimal action sequence, executes only the first action, and re-plans at every moment

## Controlling by Looking Ahead with an Internal Model

A traditional PID controller reacts to past error. If the target temperature is 200 degrees and the current reading is 195, it increases heater output in proportion to that 5-degree gap. It corrects for accumulated error and considers the rate of change. The problem is that this is strictly a "looking backward" approach. In systems like petrochemical refining where a control action's effect takes 30 minutes to manifest, adjusting based on past error alone causes overshoot, oscillation, or constraint violations.

Model Predictive Control (MPC) attacks this limitation head-on. It embeds a mathematical model of the system, uses that model to predict N steps into the future, and finds the control input sequence that yields the best predicted trajectory. The crucial point is that it does not execute the entire sequence. **It executes only the first action, receives a new measurement at the next moment, and re-plans from scratch.** This "plan-execute-discard-replan" cycle is the essence of MPC.

A spatial analogy helps. A PID controller is like driving by looking backward -- steering based only on the rearview mirror. MPC is like driving while scanning 200 meters ahead. Seeing a curve, it decelerates in advance; approaching an intersection, it changes lanes. But since predictions 200 meters out may be inaccurate, it re-scans the road ahead every 50 meters and adjusts the route.

## From Petrochemical Plants to AI

MPC's industrial origins lie in 1970s petrochemical process control. Richalet et al. (1978) independently developed IDCOM (Identification and Command), and Cutler and Ramaker (1980) developed DMC (Dynamic Matrix Control). In oil refining, dozens of variables interact, physical limits exist on temperature and pressure, and control actions take minutes to hours to show effects. Rather than combining dozens of PID controllers, it was far more effective to predict the future with a process model, explicitly account for constraints, and optimize. Later, Garcia, Prett, and Morari (1989) established a unified theoretical framework for MPC, consolidating individual industrial techniques into a single academic discipline.

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
2. Predict the future with the internal model. Use model f(x,u) to simulate the state trajectory N steps ahead. This simulation is called a **rollout**
3. Solve the optimization problem. Find the control sequence {u(0), u(1), ..., u(N-1)} that minimizes cost over the prediction horizon
4. Execute only the first action. Apply only u(0) from the optimal sequence to the actual system and discard the rest
5. Return to step 1 at the next time step

The optimization problem solved in step 3 takes the following mathematical form:

min sum_{k=0}^{N-1} [||x(k) - x_ref||^2_Q + ||u(k)||^2_R] + ||x(N) - x_ref||^2_P

subject to:
x(k+1) = f(x(k), u(k))
x(k) in X, u(k) in U

Breaking down each term:

- ||x(k) - x_ref||^2_Q: A penalty for state deviation from target x_ref. The weighting matrix Q determines "which state variables matter more." For example, in a chemical reactor, setting Q large for temperature deviation and small for pressure deviation prioritizes temperature tracking
- ||u(k)||^2_R: A penalty on control input magnitude. Large R suppresses input changes to conserve energy and avoid abrupt actuations. If R is zero, there is no penalty for arbitrarily large inputs, so the system may behave erratically
- ||x(N) - x_ref||^2_P: The terminal cost. An additional penalty on the state at the prediction horizon's end to guarantee stability. Without P, the algorithm may neglect the end state, thinking "I'll replan anyway," and let the trajectory diverge
- x(k+1) = f(x(k), u(k)): The system's dynamics model acts as an equality constraint. This IS the "internal model"
- X, U: Physical limits reflected as inequality constraints. Valve position 0-100%, motor torque limits, safe temperature ranges, and the like

## The Core Tradeoff: The Horizon Dilemma

The most fundamental tradeoff in MPC is the **length of the prediction horizon N**.

- **Long N**: Looking far ahead avoids myopic decisions. However, computational cost increases sharply (the number of optimization variables scales with N), and predictions further into the future accumulate model errors, degrading reliability. Consider the accuracy difference between predicting 30 minutes ahead versus 3 hours ahead
- **Short N**: Computation is fast and model error accumulation is low, but the algorithm only sees the near future, failing to anticipate distant constraint violations or unfavorable situations
- **Q vs. R balance**: Increasing Q makes target tracking aggressive but inputs rough. Increasing R makes inputs smooth but target tracking sluggish. This is a "precision vs. smoothness" tradeoff, tuned differently for each application domain

Why only the first action is executed and the rest discarded becomes clear in this context. (1) The model is imperfect, so predictions degrade with distance. (2) New measurements arrive at each moment, enabling better plans. The name **receding horizon** refers to this structure where the prediction window's endpoint slides forward one step at each time step.

## Stability and Feasibility Theory

Theoretical depth in MPC starts from the question: "Does this iterative process keep the system stable?"

Finite-horizon MPC does not inherently guarantee stability, because it ignores the future beyond the prediction window. The key devices that resolve this are the terminal cost P and **terminal constraints**. Mayne et al. (2000) proved that with a properly chosen P (typically matched to the infinite-horizon LQR cost), finite-horizon MPC achieves stability equivalent to infinite-horizon optimal control. Intuitively, P pre-charges an approximation of "cost that would be incurred beyond the horizon," preventing the algorithm from neglecting the end state.

For linear systems, MPC's optimization reduces to **Quadratic Programming** (QP). QP is convex optimization, so the global optimum can be found efficiently. For nonlinear systems, however, the problem becomes non-convex with the risk of local optima and significantly increased computational cost. This is the central challenge of Nonlinear MPC (NMPC).

**Feasibility** is another important concept. In constrained MPC, finding a solution at the current time step does not guarantee that a solution exists at the next. This is called **recursive feasibility**, and it can be guaranteed through proper terminal constraint design. In practice, **soft constraints** -- imposing heavy penalties for violations while permitting them -- are used to avoid situations where no solution exists.

## Connections to Modern AI

MPC's paradigm of "predict the future with an internal model, plan optimal actions, execute only the first, and replan" is directly connected to core currents in modern AI.

**Structures directly inherited from control engineering:**

- **Model-Based Reinforcement Learning (MBRL)**: From Deisenroth & Rasmussen's (2011) PILCO onward, MBRL's core loop is identical to MPC -- learn a world model, rollout within the model to search for optimal actions, execute only the first in the real environment, and replan. The difference lies in the model's origin. MPC models are pre-built from physics or system identification; MBRL models are learned from data as the agent interacts with the environment. The biggest challenge this difference creates is **compounding model error**. Small errors in the learned model snowball over long rollouts, causing predictions to diverge from reality
- **MuZero**: DeepMind's Schrittwieser et al. (2020) implemented the MPC pattern in its most refined form. The key innovation was building the model in a **learned latent space** rather than observation space. A representation function encodes observations into latent states, a dynamics function predicts next latent states, and a prediction function outputs policy and value. Monte Carlo Tree Search (MCTS) runs on top of this learned model -- precisely MPC's pattern of "simulating the future with a model to search for optimal actions." It achieved superhuman performance in Go, chess, and Atari without prior knowledge of environment rules
- **Dreamer**: Hafner et al. (2020) learned a video-prediction-based world model and optimized policy by simulating future trajectories within the model. It dramatically reduced real environment interactions while solving complex robotic control tasks. This realizes MPC's core advantage -- **sample efficiency**, performing trial-and-error inside the model rather than the real environment -- in the neural network era

**Structural similarities sharing the same intuition independently:**

- **LLM planning and reasoning**: In large language models, Chain-of-Thought reasoning and Tree-of-Thought search evoke MPC's structure in that they "internally simulate future outcomes and select the best path." However, LLMs were not directly inspired by MPC but developed from a separate research lineage
- **Predictive coding and world models**: The predictive coding hypothesis in cognitive science -- the brain constantly predicts sensory inputs and propagates only prediction errors upward -- structurally resembles MPC's philosophy of "predict with an internal model and correct errors." Ha & Schmidhuber's (2018) "World Models" and LeCun's (2022) JEPA belong to this lineage. However, rather than deriving directly from MPC, they share the common intuition that "a good internal model enables efficient action"

## Limitations and Weaknesses

Despite MPC's paradigmatic power, fundamental limitations exist.

- **Model accuracy dependence**: MPC is only as good as its model. For learned world models, small errors compound over long rollouts, producing actions disconnected from reality. Predictions also collapse sharply in situations the model has never experienced (out-of-distribution regions)
- **Real-time computational cost**: Solving an optimization problem at every time step creates bottlenecks in fast-cycle systems. Nonlinear MPC must repeatedly solve non-convex optimization, increasing the burden further. For example, in drone flight requiring 10ms control cycles, if optimization exceeds 10ms, control is delayed
- **Sim-to-real gap**: When controlling real robots with world models learned in simulation, factors the simulator fails to capture -- friction, air resistance, sensor noise -- degrade performance. Domain randomization randomly varies simulation parameters to increase robustness, but cannot fully bridge the gap
- **Horizon myopia**: Long N increases computational cost and accumulates model error. Short N leads to myopic decisions. In MuZero this tradeoff manifests as tree search depth; in Dreamer, as imagination trajectory length

## Glossary

PID controller - a classical feedback controller that computes control input from three terms: Proportional, Integral, and Derivative of the error

Receding horizon - MPC's core structure where the prediction window's endpoint advances one step forward at each time step

Rollout - simulating a future state trajectory from the current state using a model

Terminal cost - an additional penalty imposed on the state at the prediction horizon's final time step, essential for guaranteeing finite-horizon MPC stability

Quadratic Programming - a convex optimization problem with a quadratic objective and linear constraints, the problem type solved at each MPC step for linear systems

World model - an internal model that learns environmental dynamics to predict future states

Compounding model error - the phenomenon where small errors in learned models accumulate over long rollouts, widening the gap with reality

Recursive feasibility - the property that if an optimization solution exists at the current time step, a solution is guaranteed to exist at the next

Sim-to-real gap - the phenomenon where policies or models learned in simulators show degraded performance in real environments

Domain randomization - a technique that randomly varies simulation physics parameters to increase robustness to real-world conditions
