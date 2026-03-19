---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 칼만 필터, 상태 추정, 베이지안 필터링, 예측-갱신 사이클, 칼만 이득, 센서 융합, 상태 공간 모델
keywords_en: Kalman filter, state estimation, Bayesian filtering, predict-update cycle, Kalman gain, sensor fusion, state space model
---
Kalman Filter - 잡음이 섞인 관측으로부터 시스템의 숨겨진 상태를 최적으로 추정하는 재귀적 베이지안 필터

## 잡음 속에서 진실을 읽는 제어 이론의 핵심 원리

모든 측정에는 잡음이 끼어든다. GPS 수신기는 건물 반사 때문에 실제 위치에서 5~10미터 벗어난 좌표를 보고하고, 자동차의 속도계는 타이어 마모와 진동으로 참값 주변을 흔들린다. 1950년대 미사일 유도 시스템 설계자들이 직면한 핵심 질문이 바로 이것이었다. 센서가 매순간 조금씩 거짓말을 할 때, 시스템의 **실제 상태**를 어떻게 가장 정확하게 복원할 수 있는가?

이 문제의 선행 연구는 Norbert Wiener(1949)의 최적 필터링 이론이었다. Wiener의 접근법은 신호를 주파수 영역에서 분석하여 잡음을 걸러내는 것이었지만, 신호의 통계적 성질이 시간에 따라 변하지 않는 정상 과정(stationary process)에만 적용할 수 있었다. 미사일의 궤적처럼 상태가 매초 변하는 시스템에는 맞지 않았다.

## 제어 이론에서 AI 핵심 구조로

칼만 필터는 원래 제어 이론(control theory)의 **상태 추정** 문제를 풀기 위해 탄생했다. 그러나 그 핵심 구조인 "예측하고, 관측하고, 교정한다"는 사이클이 AI의 여러 분야에 직접 이식되었다. 주요 전환점과 대응 관계는 다음과 같다.

- 1960 -- Kalman이 선형 최적 필터 제시. 원래 목적은 미사일/우주선 궤적 추정
- 1960s -- NASA 아폴로 프로그램에 실전 배치. 다중 센서 융합의 표준 프레임워크가 됨
- 1986 -- Smith, Self & Cheeseman이 EKF-SLAM 제안. 로봇이 자신의 위치 추정과 환경 지도 구축을 동시에 수행. 상태 벡터가 로봇 자세 + 랜드마크 위치를 모두 포함
- 2021 -- Gu et al.의 S4(Structured State Spaces for Sequence Modeling)가 칼만 필터의 상태 공간 표현을 시퀀스 모델링에 적용. 2023년 Mamba(Gu & Dao)로 발전

핵심 대응 관계:

- 숨겨진 상태 x(k) --> AI의 **잠재 표현**(latent representation, 직접 관측 불가능한 내부 상태)
- 상태 전이 모델 F --> **시간 역학 모델** (이전 시점의 표현이 다음 시점에 어떻게 변하는가)
- 잡음 섞인 관측 z(k) --> **불완전한 입력 데이터** (센서 노이즈, 누락, 왜곡)
- 칼만 이득 K --> **모델 예측과 새 관측의 가중 결합** (어텐션의 "어디에 얼마나 집중할지"와 기능적으로 유사)
- 공분산 행렬 P --> **불확실성 추정** (추정치의 신뢰도를 함께 출력)
- 예측-갱신 사이클 --> **재귀적 상태 업데이트** (RNN, SSM의 매 시점 상태 갱신)

## 예측-갱신 사이클: 칼만 필터의 메커니즘

칼만 필터는 두 개의 방정식으로 시스템을 기술한다.

상태 전이 방정식 (시스템이 어떻게 변하는가):
x(k+1) = F * x(k) + B * u(k) + w(k)

관측 방정식 (무엇을 관측하는가):
z(k) = H * x(k) + v(k)

여기서 x(k)는 상태 벡터(시스템의 실제 상태), F는 상태 전이 행렬(이전 상태가 다음 상태에 미치는 영향), B * u(k)는 외부 제어 입력, w(k)는 프로세스 잡음(공분산 Q, 모델의 불완전함), z(k)는 센서 관측값, H는 관측 행렬(상태가 관측에 어떻게 매핑되는지), v(k)는 관측 잡음(공분산 R, 센서의 불완전함)이다.

핵심 가정은 두 가지다. (1) 시스템이 **선형**이다. (2) 잡음이 **가우시안**(정규분포를 따르는)이다. 이 두 조건이 만족되면 칼만 필터가 평균 제곱 오차(MSE)를 최소화하는 **최적 추정기**임이 수학적으로 증명된다.

작동은 **예측-갱신 사이클**의 반복이다.

## 예측과 관측 사이의 트레이드오프

칼만 필터의 핵심 트레이드오프는 **모델 신뢰 vs 센서 신뢰** 사이의 균형이다. 이 균형은 Q(프로세스 잡음 공분산)와 R(관측 잡음 공분산) 두 행렬의 설정에 달려 있다.

- **Q를 크게, R을 작게**: 모델을 불신하고 센서를 신뢰한다. 필터가 관측값을 빠르게 추종하여 **반응이 민감**해지지만, 센서 잡음에도 과민 반응한다. GPS 좌표가 1초마다 1~2미터씩 흔들리는 궤적이 나온다.
- **Q를 작게, R을 크게**: 모델을 신뢰하고 센서를 불신한다. 필터가 관측의 급변에 둔감하여 **부드러운 추정**을 내놓지만, 실제 상태가 급변할 때 추종이 느려진다. 차량이 급회전했는데 필터는 여전히 직진 궤적을 고수하는 상황이 벌어진다.
- **Q와 R의 최적 조율**: 문제마다 달라야 한다. 실무에서 Q와 R을 정확히 아는 것은 드물며, 추정하거나 튜닝해야 한다. 이것이 칼만 필터 실전 적용의 가장 까다로운 부분이다.

SA가 온도라는 단일 파라미터로 탐색-활용 균형을 조절하듯, 칼만 필터는 Q와 R이라는 두 잡음 공분산으로 모델-센서 균형을 조절한다.

## 베이지안 해석과 비선형 확장

칼만 필터는 **베이지안 추론의 재귀적 구현**이다. 이 관점에서 보면 예측 단계가 사전 분포(prior)를 생성하고, 관측이 가능도(likelihood)를 제공하며, 갱신 단계가 사후 분포(posterior)를 계산한다. 가우시안 분포끼리의 곱은 다시 가우시안이므로 매 단계 분포의 형태가 보존된다. 이것이 칼만 필터가 닫힌 형태(closed-form, 반복 근사 없이 한 번에 답이 나오는)의 해를 가지는 이유다.

그러나 현실 세계 대부분의 시스템은 비선형이다. 로봇의 회전, GPS 좌표 계산, 화학 반응 속도 모두 비선형이다. 이를 다루기 위한 확장들이 "가정의 엄격함"에 따라 스펙트럼을 형성한다.

확장 칼만 필터(Extended Kalman Filter, EKF): 비선형 함수를 현재 추정치 주변에서 1차 테일러 급수로 선형화한다. 야코비안(Jacobian, 다변수 함수의 1차 편미분 행렬)을 계산하여 F와 H를 대체한다. 간단하지만 강한 비선형성에서 근사 오차가 누적되어 발산할 수 있다.

무향 칼만 필터(Unscented Kalman Filter, UKF, Julier & Uhlmann 1997): 야코비안을 직접 계산하는 대신, 분포의 평균 주위에 배치한 소수의 대표 샘플(시그마 포인트)을 비선형 함수에 통과시켜 변환된 분포를 근사한다. EKF보다 2차 이상의 비선형성을 더 잘 포착한다.

## 현대 AI에서의 칼만 필터 원리

칼만 필터의 예측-갱신 구조와 상태 공간 모델 개념은 현대 AI의 여러 영역에 깊이 침투해 있다. 다만 각 연결의 성격은 다르다.

**칼만 필터의 직접적 적용 또는 직접적 영감:**

- **센서 퓨전과 자율주행**: 자율주행 차량은 LiDAR, 카메라, GPS, IMU 등을 칼만 필터(또는 EKF/UKF)로 융합하여 위치와 속도를 추정한다. 칼만 이득이 센서별 잡음 특성에 따라 가중 결합을 자동 조절한다
- **SLAM**: 로봇이 자신의 위치 추정과 환경 지도 구축을 동시에 수행하는 문제에 EKF-SLAM이 사용된다. 상태 벡터에 로봇 자세와 랜드마크 위치를 포함하여 예측-갱신 사이클로 동시 정밀화한다
- **상태 공간 모델과 시퀀스 모델링**: S4(Gu et al. 2021)와 Mamba(Gu & Dao 2023)는 칼만 필터의 상태 공간 표현을 시퀀스 모델링에 직접 적용했다. 숨겨진 상태의 선형 재귀 갱신이 Transformer의 대안으로 부상했다
- **RNN의 은닉 상태 갱신**: RNN이 매 시간 단계에서 은닉 상태를 갱신하는 구조는 칼만 필터의 예측-갱신 사이클과 동일하다. 새 입력(관측)으로 이전 은닉 상태(예측)를 교정한다

## 한계와 약점

- **선형-가우시안 가정의 취약성**: 원래 칼만 필터는 선형 시스템 + 가우시안 잡음에서만 최적이다. 실제 시스템의 비선형성이 강하면 EKF가 발산할 수 있고, 잡음에 이상치가 많거나 분포가 다봉(multimodal, 봉우리가 여러 개인)이면 가우시안 가정이 깨져 최적성 보장이 사라진다.
- **공분산 행렬의 계산 비용**: 불확실성을 표현하는 P 행렬의 크기는 상태 차원의 제곱에 비례한다. 상태 변수가 100개이면 P는 10,000개 원소를 가진다. 대규모 SLAM처럼 상태 차원이 수천을 넘으면 공분산 갱신 자체가 병목이 되어, 희소 행렬 기법이나 저랭크 근사가 필수적이다.
- **모델 정확성 의존**: 칼만 필터의 성능은 상태 전이 모델 F와 잡음 공분산 Q, R의 정확성에 전적으로 의존한다. 현실에서는 이 값들을 정확히 아는 경우가 드물며, 모델이 부정확하면 필터가 현실과 동떨어진 추정을 내놓는다. 더 문제적인 것은 이 괴리를 필터 자체가 감지하기 어렵다는 점이다.
- **고차원 + 비선형 한계**: 파티클 필터는 가정을 버리는 대가로 차원의 저주를 감수해야 한다. 상태 차원이 10만 넘어도 필요한 파티클 수가 기하급수적으로 증가한다. 칼만 필터 계열과 딥러닝의 통합(physics-informed neural networks 등)이 연구되고 있지만, 이론적 보장과 데이터 기반 유연성 사이의 긴장은 여전하다.

## 용어 정리

상태 벡터(state vector) - 시스템의 현재 상태를 완전히 기술하는 변수들의 집합. 위치 추적이라면 (x좌표, y좌표, x속도, y속도)처럼 구성된다

공분산 행렬(covariance matrix) - 추정치의 불확실성을 행렬로 표현한 것. 대각 원소는 각 변수의 분산(얼마나 흔들리는지), 비대각 원소는 변수 간 상관(하나가 커지면 다른 것도 커지는 정도)

칼만 이득(Kalman gain) - 예측과 관측의 상대적 신뢰도를 결정하는 가중치 행렬. 0에 가까우면 예측을 신뢰, 크면 관측을 신뢰

혁신(innovation) - 실제 관측값과 예측된 관측값의 차이. 필터에 "예상 밖의 새 정보"를 제공하는 신호

정상 과정(stationary process) - 통계적 성질(평균, 분산 등)이 시간에 따라 변하지 않는 확률 과정

야코비안(Jacobian) - 다변수 함수의 1차 편미분들을 행렬로 정리한 것. EKF에서 비선형 함수를 현재 점 주변에서 선형으로 근사하는 데 사용

파티클 필터(particle filter) - 가중 샘플(파티클)의 집합으로 임의의 확률 분포를 근사하는 몬테카를로 기반 필터링 방법

상태 공간 모델(state space model) - 숨겨진 상태의 시간 진화와 관측 과정을 분리하여 기술하는 수학적 프레임워크. 칼만 필터의 기본 표현 방식
---EN---
Kalman Filter - A recursive Bayesian filter for optimally estimating the hidden state of a system from noisy observations

## The Core Principle of Control Theory: Reading Truth Through Noise

Every measurement carries noise. A GPS receiver reports coordinates 5-10 meters off from the true position due to building reflections. A car's speedometer fluctuates around the true value because of tire wear and vibration. The central question facing missile guidance system designers in the 1950s was precisely this: when sensors tell small lies at every moment, how can we most accurately recover the system's **true state**?

The precursor to this problem was Norbert Wiener's (1949) optimal filtering theory. Wiener's approach analyzed signals in the frequency domain to filter out noise, but it could only handle stationary processes -- those whose statistical properties don't change over time. It was ill-suited for systems like missile trajectories, where the state changes every second.

## From Control Theory to Core AI Architecture

The Kalman filter was born to solve **state estimation** problems in control theory. But its core structure -- "predict, observe, correct" -- was directly transplanted into multiple areas of AI. Key milestones and correspondences:

- 1960 -- Kalman presents the linear optimal filter. Original purpose: missile/spacecraft trajectory estimation
- 1960s -- Deployed in NASA's Apollo program. Becomes the standard framework for multi-sensor fusion
- 1986 -- Smith, Self & Cheeseman propose EKF-SLAM. Robots estimate their own position while simultaneously building a map. The state vector includes both robot pose and landmark positions
- 2021 -- Gu et al.'s S4 (Structured State Spaces for Sequence Modeling) applies the Kalman filter's state space representation to sequence modeling. Evolves into Mamba (Gu & Dao, 2023)

Key correspondences:

- Hidden state x(k) --> AI's **latent representation** (internal state not directly observable)
- State transition model F --> **temporal dynamics model** (how representation at one time step evolves to the next)
- Noisy observation z(k) --> **imperfect input data** (sensor noise, missing values, distortion)
- Kalman gain K --> **weighted combination of model prediction and new observation** (functionally similar to attention's "where and how much to focus")
- Covariance matrix P --> **uncertainty estimation** (outputting confidence alongside the estimate)
- Predict-update cycle --> **recursive state update** (state updates at each time step in RNNs and SSMs)

## The Predict-Update Cycle: Core Mechanism

The Kalman filter describes a system with two equations.

State transition equation (how the system evolves):
x(k+1) = F * x(k) + B * u(k) + w(k)

Observation equation (what we measure):
z(k) = H * x(k) + v(k)

Here x(k) is the state vector (the system's true state), F is the state transition matrix (how the previous state influences the next), B * u(k) is the external control input, w(k) is process noise (covariance Q, reflecting model imperfections), z(k) is the sensor observation, H is the observation matrix (how states map to observations), and v(k) is measurement noise (covariance R, reflecting sensor imperfections).

Two core assumptions: (1) the system is **linear**, and (2) the noise is **Gaussian**. When both hold, the Kalman filter is mathematically proven to be the **optimal estimator** that minimizes mean squared error (MSE).

The filter operates by repeating a **predict-update cycle**.

## The Tradeoff Between Prediction and Observation

The core tradeoff in the Kalman filter is the balance between **model trust vs. sensor trust**. This balance depends on setting two matrices: Q (process noise covariance) and R (observation noise covariance).

- **Large Q, small R**: Distrust the model, trust the sensors. The filter tracks observations rapidly, becoming **highly responsive**, but also overreacts to sensor noise. The result is a GPS trajectory that jitters 1-2 meters every second.
- **Small Q, large R**: Trust the model, distrust the sensors. The filter resists sudden changes in observations, producing **smooth estimates**, but responds slowly when the true state changes abruptly. The vehicle makes a sharp turn, but the filter keeps predicting a straight path.
- **Optimal Q-R tuning**: Must be tailored to each problem. In practice, Q and R are rarely known exactly and must be estimated or tuned. This is the most challenging aspect of real-world Kalman filter deployment.

Just as SA controls the exploration-exploitation balance through the single parameter of temperature, the Kalman filter controls the model-sensor balance through the two noise covariances Q and R.

## Bayesian Interpretation and Nonlinear Extensions

The Kalman filter is a **recursive implementation of Bayesian inference**. The predict step generates the prior distribution, the observation provides the likelihood, and the update step computes the posterior. Since the product of Gaussians is again Gaussian, the distributional form is preserved at every step. This is why the Kalman filter has a closed-form solution -- one that yields the answer in a single computation without iterative approximation.

However, most real-world systems are nonlinear. Robot rotation, GPS coordinate calculations, chemical reaction rates -- all nonlinear. Extensions addressing this form a spectrum of increasingly relaxed assumptions.

Extended Kalman Filter (EKF): Linearizes nonlinear functions via first-order Taylor expansion around the current estimate. Jacobian matrices (matrices of first-order partial derivatives) replace F and H. Simple but can diverge when nonlinearity is strong, as approximation errors accumulate.

Unscented Kalman Filter (UKF, Julier & Uhlmann 1997): Instead of computing Jacobians directly, passes a small set of representative samples (sigma points) placed around the mean through the nonlinear function to approximate the transformed distribution. Captures higher-order nonlinearities better than EKF.

## Kalman Filter Principles in Modern AI

The Kalman filter's predict-update structure and state space model concept are deeply embedded across modern AI. However, the nature of each connection differs.

**Direct application or direct inspiration from the Kalman filter:**

- **Sensor fusion and autonomous driving**: Self-driving vehicles fuse LiDAR, cameras, GPS, and IMU using Kalman filters (or EKF/UKF) to estimate position and velocity. The Kalman gain automatically adjusts weighted combination by each sensor's noise characteristics
- **SLAM**: EKF-SLAM is standard for robots simultaneously estimating position and building environment maps. The state vector includes robot pose and landmark positions, refining both through the predict-update cycle
- **State space models and sequence modeling**: S4 (Gu et al. 2021) and Mamba (Gu & Dao 2023) directly applied the Kalman filter's state space representation to sequence modeling. Linear recurrent hidden state updates emerged as a Transformer alternative
- **RNN hidden state updates**: RNNs updating hidden states at each time step mirrors the Kalman filter's predict-update cycle. Each new input (observation) corrects the previous hidden state (prediction)

## Limitations and Weaknesses

- **Fragility of linear-Gaussian assumptions**: The original Kalman filter is optimal only for linear systems with Gaussian noise. When system nonlinearity is strong, EKF can diverge. When noise contains many outliers or follows a multimodal distribution (multiple peaks), the Gaussian assumption breaks and optimality guarantees vanish.
- **Computational cost of covariance matrices**: The P matrix representing uncertainty scales quadratically with state dimension. With 100 state variables, P has 10,000 elements. When state dimensions exceed thousands (as in large-scale SLAM), covariance updates become the bottleneck, requiring sparse matrix techniques or low-rank approximations.
- **Dependence on model accuracy**: Performance depends entirely on the accuracy of the state transition model F and noise covariances Q and R. In practice these values are rarely known precisely, and inaccurate models produce estimates disconnected from reality. What makes this worse is that the filter itself has difficulty detecting such divergence.
- **High-dimensional + nonlinear limits**: Particle filters pay for their assumption-free flexibility with the curse of dimensionality -- beyond just 10 state dimensions, required particle counts grow exponentially. Integration of Kalman-family filters with deep learning (physics-informed neural networks, etc.) is actively researched, but the tension between theoretical guarantees and data-driven flexibility persists.

## Glossary

State vector - the set of variables that completely describes the current state of a system. For position tracking, it might consist of (x-coordinate, y-coordinate, x-velocity, y-velocity)

Covariance matrix - uncertainty of estimates represented as a matrix. Diagonal elements are the variance of each variable (how much it fluctuates); off-diagonal elements capture inter-variable correlations (the degree to which one growing implies another grows too)

Kalman gain - the weight matrix determining relative trust between prediction and observation. Near zero means trusting prediction; large means trusting observation

Innovation - the difference between actual and predicted observations. The signal providing "unexpected new information" to the filter

Stationary process - a stochastic process whose statistical properties (mean, variance, etc.) do not change over time

Jacobian - first-order partial derivatives of a multivariate function organized as a matrix. Used in EKF to linearly approximate nonlinear functions around the current point

Particle filter - a Monte Carlo-based filtering method that approximates arbitrary probability distributions using a set of weighted samples (particles)

State space model - a mathematical framework that separately describes the time evolution of hidden states and the observation process. The foundational representation of the Kalman filter
