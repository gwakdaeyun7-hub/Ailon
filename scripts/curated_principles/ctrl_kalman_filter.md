---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 칼만 필터, 상태 추정, 베이지안 필터링, 예측-갱신 사이클, 칼만 이득, 센서 융합, 상태 공간 모델
keywords_en: Kalman filter, state estimation, Bayesian filtering, predict-update cycle, Kalman gain, sensor fusion, state space model
---
Kalman Filter - 잡음이 섞인 관측으로부터 시스템의 숨겨진 상태를 최적으로 추정하는 재귀적 베이지안 필터

## 잡음 속에서 진실을 읽는 제어 이론의 핵심 원리

모든 측정에는 잡음이 끼어든다. GPS 수신기는 건물 반사 때문에 실제 위치에서 5~10미터 벗어난 좌표를 보고하고, 속도계는 진동으로 참값 주변을 흔들린다. 1950년대 미사일 유도 설계자들이 직면한 질문이 바로 이것이었다. 센서가 매순간 조금씩 거짓말을 할 때, 시스템의 **실제 상태**를 어떻게 가장 정확하게 복원할 수 있는가? 짙은 안개 속 항해에서 해도(모델 예측)와 레이더(센서 관측) 중 어디에 더 무게를 둘 것인가 — 이것이 칼만 필터의 핵심 질문이다.

선행 연구인 Norbert Wiener(1949)의 최적 필터링 이론은 주파수 영역에서 잡음을 걸러냈지만, 정상 과정(stationary process, 통계적 성질이 시간에 따라 변하지 않는 과정)에만 적용할 수 있었다. 미사일 궤적처럼 상태가 매초 변하는 시스템에는 맞지 않았다.

## 제어 이론에서 알고리즘으로

칼만 필터는 원래 제어 이론(control theory)의 **상태 추정** 문제를 풀기 위해 탄생했다. 핵심 구조인 "예측하고, 관측하고, 교정한다"는 사이클은 이후 AI의 여러 분야에 직접 이식되었다.

- 1960 -- Kalman이 범용 선형 필터 이론 제시. 초기 핵심 응용이 미사일/우주선 궤적 추정
- 1960s -- NASA 아폴로 프로그램에 실전 배치. 다중 센서 융합의 표준 프레임워크가 됨
- 1986 -- Smith, Self & Cheeseman이 EKF-SLAM 제안. 로봇이 자신의 위치와 환경 지도를 동시에 추정
- 2021 -- Gu et al.의 S4가 제어 이론의 상태 공간 모델을 시퀀스 모델링에 적용. 2023년 Mamba(Gu & Dao)로 발전

## 예측-갱신 사이클: 한 라운드의 흐름

칼만 필터는 두 방정식으로 시스템을 기술한다.

- **상태 전이**: x(k+1) = F * x(k) + B * u(k) + w(k)
- **관측**: z(k) = H * x(k) + v(k)

F는 상태 변화 규칙, H는 상태를 관측값으로 변환하는 행렬이다. w(k)는 모델의 불완전함(공분산 Q), v(k)는 센서의 불완전함(공분산 R)을 나타낸다. 핵심 가정은 시스템이 **선형**이고 잡음이 **가우시안**인 것이다. 이 조건에서 칼만 필터는 평균 제곱 오차를 최소화하는 **최적 추정기**임이 증명된다.

작동은 매 시점 다음 5단계를 반복한다.

1. **상태 예측**: x_pred = F * x(k) + B * u(k) — 해도를 보고 "다음엔 여기 있을 것"이라 예측한다
2. **불확실성 전파**: P_pred = F * P * F^T + Q — 예측의 불확실성도 함께 커진다. 지도 위의 "내가 있을 수 있는 범위" 타원이 한 발짝 넓어지는 것이다
3. **칼만 이득 계산**: K = P_pred * H^T / (H * P_pred * H^T + R) — 예측 불확실성(P)과 센서 잡음(R)을 비교하여 가중치를 자동 결정한다. 해도가 부정확할수록 레이더를 더 믿고, 레이더가 흔들릴수록 해도를 고수한다
4. **상태 갱신**: x_new = x_pred + K * (z - H * x_pred) — 실제 관측과 예측의 차이(혁신, innovation)에 K를 곱해 교정한다. 혁신이 크면 "예상 밖의 놀라움"이 큰 것이다
5. **불확실성 갱신**: P_new = (I - K * H) * P_pred — 관측 덕분에 타원이 줄어든다. 관측이 쌓일수록 추정이 점점 확신을 얻는다

3단계가 칼만 필터의 핵심 우아함이다. K는 수동 설정이 아니라 P와 R의 비율로 매 시점 자동 계산된다.

## 예측과 관측 사이의 트레이드오프

칼만 필터의 핵심 트레이드오프는 **모델 신뢰 vs 센서 신뢰** 사이의 균형이다. 이 균형은 Q(프로세스 잡음 공분산)와 R(관측 잡음 공분산) 두 행렬의 설정에 달려 있다.

- **Q를 크게, R을 작게**: 모델을 불신하고 센서를 신뢰한다. 필터가 관측값을 빠르게 추종하여 **반응이 민감**해지지만, 센서 잡음에도 과민 반응한다.
- **Q를 작게, R을 크게**: 모델을 신뢰하고 센서를 불신한다. **부드러운 추정**을 내놓지만, 차량이 급회전해도 필터가 직진 궤적을 고수하는 식으로 실제 급변에 추종이 느려진다.
- **Q와 R의 최적 조율**: 문제마다 달라야 한다. 실무에서 Q와 R을 정확히 아는 것은 드물며, 추정하거나 튜닝해야 한다. 이것이 칼만 필터 실전 적용의 가장 까다로운 부분이다.


## 베이지안 해석과 비선형 확장

칼만 필터는 **베이지안 추론의 재귀적 구현**이다. 예측이 사전 분포(prior)를, 관측이 가능도(likelihood)를, 갱신이 사후 분포(posterior)를 계산한다. 가우시안의 곱이 가우시안이므로 닫힌 형태(closed-form, 반복 근사 없이 답이 나오는)의 해가 존재한다.

그러나 현실의 대부분 시스템은 비선형이다. 이를 다루는 확장들:

- **확장 칼만 필터(EKF)**: 비선형 함수를 야코비안(Jacobian, 1차 편미분 행렬)으로 선형화한다. 간단하지만 강한 비선형에서 근사 오차가 누적되어 발산할 수 있다
- **무향 칼만 필터(UKF, Julier & Uhlmann 1997)**: 야코비안 대신 소수의 대표 샘플(시그마 포인트)로 변환된 분포를 근사한다. 고차 비선형성을 EKF보다 잘 포착한다

## 현대 AI에서의 칼만 필터 원리

칼만 필터의 핵심 개념은 현대 AI에 대응물을 가진다. 숨겨진 상태 x(k)는 AI의 **잠재 표현**(latent representation)에, 칼만 이득 K는 **모델과 데이터의 가중 결합**에, 예측-갱신 사이클은 **재귀적 상태 갱신**(RNN, SSM)에 각각 대응한다. 다만 각 연결의 성격은 다르다.

**직접 적용 또는 직접 영감:**

- **센서 퓨전과 자율주행**: 자율주행 차량은 LiDAR, 카메라, GPS, IMU를 칼만 필터(또는 EKF/UKF)로 융합하여 위치를 추정한다. 칼만 이득이 센서별 잡음 특성에 따라 가중치를 자동 조절한다
- **SLAM**: 로봇이 자신의 위치와 환경 지도를 EKF로 동시에 추정한다. 상태 벡터에 로봇 자세와 랜드마크 위치를 모두 포함하여 예측-갱신 사이클로 정밀화한다
- **상태 공간 모델(SSM)**: S4(Gu et al. 2021)와 Mamba(Gu & Dao 2023)는 칼만 필터와 같은 뿌리인 제어 이론의 상태 공간 모델을 시퀀스 모델링에 적용했다 — 같은 수학적 골격의 다른 활용이다

**구조적 유사(독립 발전):**

- **RNN의 은닉 상태 갱신**: RNN이 매 시점 은닉 상태를 갱신하는 구조는 예측-갱신 사이클과 유사하나, 순환 신경 회로에서 독립적으로 발전했다

## 한계와 약점

- **선형-가우시안 가정의 취약성**: 원래 칼만 필터는 선형 시스템 + 가우시안 잡음에서만 최적이다. 실제 시스템의 비선형성이 강하면 EKF가 발산할 수 있고, 잡음에 이상치가 많거나 분포가 다봉(multimodal, 봉우리가 여러 개인)이면 가우시안 가정이 깨져 최적성 보장이 사라진다.
- **공분산 행렬의 계산 비용**: P 행렬의 크기는 상태 차원의 제곱에 비례한다. 대규모 SLAM처럼 상태 차원이 수천을 넘으면 공분산 갱신이 병목이 되어, 희소 행렬 기법이나 저랭크 근사가 필수적이다.
- **모델 정확성 의존**: 칼만 필터의 성능은 상태 전이 모델 F와 잡음 공분산 Q, R의 정확성에 전적으로 의존한다. 현실에서 이 값들을 정확히 아는 경우는 드물고, 모델이 부정확하면 필터 자체가 괴리를 감지하지 못한 채 현실과 동떨어진 추정을 내놓는다.
- **고차원 + 비선형 한계**: 파티클 필터 같은 비모수 대안도 상태 차원이 10을 넘으면 차원의 저주에 빠진다. 이론적 보장과 데이터 기반 유연성 사이의 긴장은 미해결이다.

## 용어 정리

상태 벡터(state vector) - 시스템의 현재 상태를 완전히 기술하는 변수 집합. 예: (x좌표, y좌표, x속도, y속도)

공분산 행렬(covariance matrix) - 추정치의 불확실성을 행렬로 표현한 것. 대각 원소는 각 변수의 분산, 비대각 원소는 변수 간 상관을 나타낸다

칼만 이득(Kalman gain) - 예측과 관측의 상대적 신뢰도를 결정하는 가중치 행렬. 0에 가까우면 예측을 신뢰, 크면 관측을 신뢰

혁신(innovation) - 실제 관측값과 예측된 관측값의 차이. 필터에 "예상 밖의 새 정보"를 제공하는 신호

정상 과정(stationary process) - 통계적 성질(평균, 분산 등)이 시간에 따라 변하지 않는 확률 과정

야코비안(Jacobian) - 다변수 함수의 1차 편미분들을 행렬로 정리한 것. EKF에서 비선형 함수를 현재 점 주변에서 선형으로 근사하는 데 사용

파티클 필터(particle filter) - 가중 샘플(파티클) 집합으로 임의 확률 분포를 근사하는 몬테카를로 방법

상태 공간 모델(state space model) - 숨겨진 상태의 시간 진화와 관측 과정을 분리하여 기술하는 수학적 프레임워크
---EN---
Kalman Filter - A recursive Bayesian filter for optimally estimating the hidden state of a system from noisy observations

## The Core Principle of Control Theory: Reading Truth Through Noise

Every measurement carries noise. A GPS receiver reports coordinates 5-10 meters off from the true position due to building reflections. A speedometer fluctuates around the true value due to vibration. The question facing missile guidance designers in the 1950s was precisely this: when sensors tell small lies at every moment, how can we most accurately recover the system's **true state**? Like navigating through dense fog -- do you trust the nautical chart (model prediction) or the radar ping (sensor observation) more? This is the core question the Kalman filter answers.

The precursor was Norbert Wiener's (1949) optimal filtering theory, which analyzed signals in the frequency domain but could only handle stationary processes -- those whose statistical properties don't change over time. It was ill-suited for systems like missile trajectories, where the state changes every second.

## From Control Theory to Algorithm

The Kalman filter was born to solve **state estimation** problems in control theory. Its core structure -- "predict, observe, correct" -- was later transplanted directly into multiple areas of AI.

- 1960 -- Kalman presents a general linear filtering theory. Key early application: missile/spacecraft trajectory estimation
- 1960s -- Deployed in NASA's Apollo program. Becomes the standard framework for multi-sensor fusion
- 1986 -- Smith, Self & Cheeseman propose EKF-SLAM. Robots simultaneously estimate their own position and build environment maps
- 2021 -- Gu et al.'s S4 applies the state space model from control theory to sequence modeling. Evolves into Mamba (Gu & Dao, 2023)

## The Predict-Update Cycle: One Round at a Time

The Kalman filter describes a system with two equations.

- **State transition**: x(k+1) = F * x(k) + B * u(k) + w(k)
- **Observation**: z(k) = H * x(k) + v(k)

F is the state change rule, H maps the state to observable quantities. w(k) captures model imperfections (covariance Q), v(k) captures sensor imperfections (covariance R). The core assumptions are that the system is **linear** and the noise is **Gaussian**. Under these conditions, the Kalman filter is provably the **optimal estimator** minimizing mean squared error.

The filter repeats these five steps at every time step.

1. **State prediction**: x_pred = F * x(k) + B * u(k) -- check the chart and predict "we should be here next"
2. **Uncertainty propagation**: P_pred = F * P * F^T + Q -- the uncertainty grows too. The "circle of where I might be" on the map expands one step wider
3. **Kalman gain**: K = P_pred * H^T / (H * P_pred * H^T + R) -- compares prediction uncertainty (P) against sensor noise (R) to automatically set the weight. The less reliable the chart, the more you trust the radar; the noisier the radar, the more you stick with the chart
4. **State update**: x_new = x_pred + K * (z - H * x_pred) -- corrects the prediction by the difference between actual and predicted observation (the innovation). A large innovation means a big surprise
5. **Uncertainty update**: P_new = (I - K * H) * P_pred -- the circle shrinks thanks to the observation. With each measurement, the estimate grows more confident

Step 3 is the core elegance of the Kalman filter. K is not manually set -- it is automatically computed from the ratio of P and R at every time step.

## The Tradeoff Between Prediction and Observation

The core tradeoff in the Kalman filter is the balance between **model trust vs. sensor trust**. This balance depends on setting two matrices: Q (process noise covariance) and R (observation noise covariance).

- **Large Q, small R**: Distrust the model, trust the sensors. The filter tracks observations rapidly, becoming **highly responsive**, but also overreacts to sensor noise.
- **Small Q, large R**: Trust the model, distrust the sensors. Produces **smooth estimates**, but when the vehicle makes a sharp turn, the filter keeps predicting a straight path -- slow to track real abrupt changes.
- **Optimal Q-R tuning**: Must be tailored to each problem. In practice, Q and R are rarely known exactly and must be estimated or tuned. This is the most challenging aspect of real-world Kalman filter deployment.


## Bayesian Interpretation and Nonlinear Extensions

The Kalman filter is a **recursive implementation of Bayesian inference**. The predict step generates the prior, the observation provides the likelihood, and the update step computes the posterior. Since the product of Gaussians is again Gaussian, a closed-form solution exists -- no iterative approximation needed.

However, most real-world systems are nonlinear. Extensions addressing this:

- **Extended Kalman Filter (EKF)**: Linearizes nonlinear functions using Jacobian matrices (first-order partial derivatives). Simple but can diverge under strong nonlinearity as approximation errors accumulate
- **Unscented Kalman Filter (UKF, Julier & Uhlmann 1997)**: Instead of Jacobians, passes a small set of representative samples (sigma points) through the nonlinear function. Captures higher-order nonlinearities better than EKF

## Kalman Filter Principles in Modern AI

The Kalman filter's core concepts have direct counterparts in modern AI. Hidden state x(k) maps to AI's **latent representation**, Kalman gain K maps to **weighted combination of model and data**, and the predict-update cycle maps to **recursive state updates** (RNNs, SSMs). The nature of each connection differs, however.

**Direct application or direct inspiration:**

- **Sensor fusion and autonomous driving**: Self-driving vehicles fuse LiDAR, cameras, GPS, and IMU using Kalman filters (or EKF/UKF) to estimate position. The Kalman gain automatically adjusts weights by each sensor's noise characteristics
- **SLAM**: Robots simultaneously estimate position and build environment maps using EKF-SLAM. The state vector includes both robot pose and landmark positions, refined through the predict-update cycle
- **State space models (SSM)**: S4 (Gu et al. 2021) and Mamba (Gu & Dao 2023) applied the same mathematical root -- the state space model from control theory -- to sequence modeling. A different use of the same mathematical skeleton

**Structural similarity (independent development):**

- **RNN hidden state updates**: RNNs updating hidden states at each time step is structurally similar to the predict-update cycle, but evolved independently from recurrent neural circuits

## Limitations and Weaknesses

- **Fragility of linear-Gaussian assumptions**: The original Kalman filter is optimal only for linear systems with Gaussian noise. When system nonlinearity is strong, EKF can diverge. When noise contains many outliers or follows a multimodal distribution (multiple peaks), the Gaussian assumption breaks and optimality guarantees vanish.
- **Computational cost of covariance matrices**: The P matrix scales quadratically with state dimension. When dimensions exceed thousands (as in large-scale SLAM), covariance updates become the bottleneck, requiring sparse matrix techniques or low-rank approximations.
- **Dependence on model accuracy**: Performance depends entirely on the accuracy of the state transition model F and noise covariances Q and R. In practice these values are rarely known precisely, and inaccurate models cause the filter to produce estimates disconnected from reality without being able to detect its own divergence.
- **High-dimensional + nonlinear limits**: Nonparametric alternatives like particle filters also fall prey to the curse of dimensionality beyond 10 state dimensions. The tension between theoretical guarantees and data-driven flexibility remains unresolved.

## Glossary

State vector - the set of variables that completely describes a system's current state. E.g., (x-coordinate, y-coordinate, x-velocity, y-velocity)

Covariance matrix - uncertainty of estimates represented as a matrix. Diagonal elements are each variable's variance; off-diagonal elements capture inter-variable correlations

Kalman gain - the weight matrix determining relative trust between prediction and observation. Near zero means trusting prediction; large means trusting observation

Innovation - the difference between actual and predicted observations. The signal providing "unexpected new information" to the filter

Stationary process - a stochastic process whose statistical properties (mean, variance, etc.) do not change over time

Jacobian - first-order partial derivatives of a multivariate function organized as a matrix. Used in EKF to linearly approximate nonlinear functions around the current point

Particle filter - a Monte Carlo method that approximates arbitrary probability distributions using weighted samples (particles)

State space model - a mathematical framework that separately describes the time evolution of hidden states and the observation process
