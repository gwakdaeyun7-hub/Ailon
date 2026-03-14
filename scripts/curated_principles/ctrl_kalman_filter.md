---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 칼만 필터, 상태 추정, 베이지안 필터링, 예측-갱신 사이클, 공분산, 센서 융합, 상태 공간 모델, 칼만 이득
keywords_en: Kalman filter, state estimation, Bayesian filtering, predict-update cycle, covariance, sensor fusion, state space model, Kalman gain
---
Kalman Filter - 잡음이 섞인 관측으로부터 시스템의 숨겨진 상태를 최적으로 추정하는 재귀적 베이지안 필터

## 관측 너머의 진실을 추정하다

우리가 관측하는 세계는 항상 불완전하다. GPS 수신기는 몇 미터의 오차를 가지고, 주식 가격에는 무작위 변동이 섞여 있으며, 로봇의 센서는 잡음을 피할 수 없다. **관측에 잡음이 있을 때, 시스템의 실제 상태를 어떻게 가장 정확하게 추정할 수 있는가?** 이것이 Rudolf E. Kalman(1930-2016)이 1960년 논문 "A New Approach to Linear Filtering and Prediction Problems"에서 풀어낸 문제다.

Kalman 이전에도 상태 추정 문제는 존재했다. Norbert Wiener(1949)는 주파수 영역에서 최적 필터를 설계하는 이론을 제시했지만, 정상 과정(stationary process)에 한정되어 시변 시스템에 적용하기 어려웠다. Kalman의 혁신은 문제를 **시간 영역의 상태 공간**으로 재정식화하고, **재귀적 알고리즘**으로 풀어낸 것이다. 과거의 모든 데이터를 저장할 필요 없이, 현재 추정치와 새 관측만으로 다음 추정치를 계산할 수 있게 되었다.

칼만 필터의 첫 번째 대규모 실전 적용은 NASA의 아폴로 프로그램(1960년대)이었다. 우주선의 위치와 속도를 다양한 센서 데이터로부터 실시간으로 추정하는 데 사용되어, 인류를 달에 보내는 데 기여했다.

## 상태 공간 모델의 구조

칼만 필터는 두 개의 방정식으로 시스템을 기술한다.

**상태 전이 방정식** (시스템이 어떻게 변하는가):
x(k+1) = F * x(k) + B * u(k) + w(k)

**관측 방정식** (무엇을 관측하는가):
z(k) = H * x(k) + v(k)

각 기호의 의미는 다음과 같다.

- x(k) --> **상태 벡터**, 시스템의 실제 상태 (예: 위치, 속도)
- F --> **상태 전이 행렬**, 이전 상태가 다음 상태에 어떻게 영향을 주는지
- B --> **제어 입력 행렬**, 외부 제어 신호의 영향
- u(k) --> **제어 입력** (예: 가속 명령)
- w(k) --> **프로세스 잡음**, 공분산 Q인 가우시안 잡음 (모델이 완벽하지 않음)
- z(k) --> **관측 벡터**, 센서로 실제 측정한 값
- H --> **관측 행렬**, 상태가 관측에 어떻게 매핑되는지
- v(k) --> **관측 잡음**, 공분산 R인 가우시안 잡음 (센서가 완벽하지 않음)

핵심 가정은 두 가지다. (1) 시스템이 **선형**이다. (2) 잡음이 **가우시안(정규분포)**이다. 이 두 조건이 만족되면 칼만 필터가 **최적 추정기**임이 증명된다. 즉, 평균 제곱 오차(MSE)를 최소화하는 추정기 중에서 가장 좋은 것이다.

## 예측-갱신 사이클

칼만 필터의 작동은 **예측**(predict)과 **갱신**(update)의 두 단계를 반복하는 사이클이다.

**예측 단계** (모델 기반, 다음 상태를 예언한다):
x_pred = F * x(k) + B * u(k)
P_pred = F * P(k) * F^T + Q

첫 번째 줄은 상태의 예측이다. 현재 상태에 물리 법칙(F)을 적용하고 제어 입력(B*u)을 반영한다. 두 번째 줄은 **불확실성의 예측**이다. 현재 불확실성 P(k)가 시스템 역학에 의해 어떻게 변하는지(F*P*F^T) 계산하고, 프로세스 잡음 Q를 더한다. 예측만으로는 불확실성이 항상 **커진다**.

**갱신 단계** (관측 기반, 예측을 교정한다):
K = P_pred * H^T * (H * P_pred * H^T + R)^(-1)
x(k+1) = x_pred + K * (z - H * x_pred)
P(k+1) = (I - K * H) * P_pred

첫 번째 줄의 K가 **칼만 이득**(Kalman Gain)이다. 이것이 칼만 필터의 심장이다. 칼만 이득은 "예측과 관측 중 어느 쪽을 더 믿을 것인가"를 결정한다. P_pred가 크면 (예측 불확실성이 높으면) K가 커져서 관측을 더 신뢰한다. R이 크면 (센서 잡음이 크면) K가 작아져서 예측을 더 신뢰한다.

두 번째 줄에서 (z - H * x_pred)는 **혁신**(innovation) 또는 **잔차**(residual)라 불린다. 실제 관측과 예측된 관측의 차이다. 칼만 이득이 이 잔차에 곱해져서 예측을 교정한다.

세 번째 줄은 갱신 후 불확실성이 **줄어든다**는 것을 보여준다. 관측이 정보를 제공하기 때문이다.

## 칼만 필터의 베이지안 해석

칼만 필터는 **베이지안 추론의 재귀적 구현**이다. 이 관점에서 보면 다음과 같다.

- **사전 분포(prior)**: 예측 단계가 만들어낸 x_pred와 P_pred이다. 관측 전에 상태에 대해 아는 것이다.
- **가능도(likelihood)**: 관측 z가 제공하는 정보다. 관측 모델 H와 잡음 R에 의해 결정된다.
- **사후 분포(posterior)**: 갱신 단계의 결과인 x(k+1)과 P(k+1)이다. 사전 분포와 가능도를 결합한 것이다.

가우시안 분포끼리의 곱은 다시 가우시안이므로, 매 단계 분포의 형태가 보존된다. 이것이 칼만 필터가 닫힌 형태(closed-form)의 해를 가지는 이유이며, 가우시안 가정이 왜 그토록 강력한지를 설명한다. 비가우시안 세계에서는 이 우아함이 깨진다.

## 비선형 확장: EKF, UKF, 파티클 필터

현실 세계의 대부분의 시스템은 비선형이다. 로봇의 회전, GPS 좌표 계산, 화학 반응 속도 모두 비선형이다. 이를 다루기 위한 확장들이 발전했다.

**확장 칼만 필터**(Extended Kalman Filter, EKF): 비선형 함수를 현재 추정치 주변에서 1차 테일러 급수로 선형화한다. 즉 야코비안(Jacobian) 행렬을 계산하여 F와 H를 대체한다. 간단하지만, 강한 비선형성에서 발산할 수 있다.

**무향 칼만 필터**(Unscented Kalman Filter, UKF, Julier & Uhlmann 1997): 야코비안 대신 **시그마 포인트**(sigma points)라는 대표 샘플을 비선형 함수에 통과시켜 분포를 근사한다. EKF보다 2차 이상의 비선형성을 더 잘 포착한다.

**파티클 필터**(Particle Filter, Gordon et al. 1993): 가우시안 가정을 완전히 버리고, 다수의 가중 샘플(파티클)로 임의의 분포를 표현한다. 가장 유연하지만 계산 비용이 높고, 고차원에서 파티클 수가 지수적으로 필요하다.

이 계보는 "정확한 가정 → 근사적 가정 → 가정 없음"의 방향으로 유연성이 증가하되 계산 비용이 올라가는 스펙트럼을 보여준다.

## 현대 AI에서의 칼만 필터 원리

칼만 필터의 예측-갱신 구조와 상태 공간 모델 개념은 현대 AI의 여러 영역에 깊이 스며들어 있다.

- **상태 공간 모델(SSM)과 Mamba**: Gu et al.(2021)의 S4(Structured State Spaces for Sequence Modeling)와 이를 발전시킨 Mamba(Gu & Dao, 2023)는 칼만 필터의 상태 공간 표현을 시퀀스 모델링에 적용한 것이다. 연속 시간 상태 공간 모델을 이산화하여 시퀀스를 처리하며, Transformer의 이차 복잡도를 선형으로 줄였다.
- **SLAM**(Simultaneous Localization and Mapping): 로봇이 미지의 환경에서 자신의 위치를 추정하면서 동시에 지도를 구축하는 문제에 EKF-SLAM이 고전적으로 사용된다. 상태 벡터가 로봇 위치와 랜드마크 위치를 모두 포함한다.
- **센서 융합**: 자율 주행차는 카메라, 라이다, 레이더, GPS, IMU 등 다양한 센서 데이터를 칼만 필터(또는 그 변형)로 결합하여 차량의 위치와 주변 물체를 추정한다. 각 센서의 잡음 특성(R 행렬)이 다르므로, 칼만 이득이 자동으로 가중 평균을 계산해 준다.
- **시계열 예측과 베이지안 필터링**: 금융, 기후, 의료 모니터링에서 잡음이 섞인 시계열 데이터로부터 숨겨진 추세를 추출하는 것은 정확히 칼만 필터의 원래 문제 설정이다.

## 한계와 약점

칼만 필터의 우아함에는 엄격한 조건이 따른다.

- **선형 가정의 취약성**: 원래 칼만 필터는 선형 시스템에서만 최적이다. EKF의 선형화는 강한 비선형성에서 심각한 오차를 낳을 수 있으며, 발산하는 경우도 있다. UKF와 파티클 필터가 대안이지만, 각각 계산 비용과 차원의 저주라는 대가를 치른다.
- **가우시안 가정의 제약**: 실제 잡음 분포가 가우시안이 아닌 경우(예: 이상치가 많은 센서 데이터, 다봉 분포), 칼만 필터의 최적성 보장이 깨진다. 파티클 필터나 비모수적 방법이 필요해진다.
- **공분산 행렬의 계산 비용**: P 행렬은 상태 차원의 제곱에 비례하는 크기를 가진다. 상태 차원이 수천 이상이면(예: 대규모 SLAM) 공분산 갱신 자체가 병목이 된다. 희소 행렬 기법이나 공분산의 저랭크 근사가 필요하다.
- **모델 정확성 의존**: 칼만 필터의 성능은 상태 전이 모델 F와 잡음 공분산 Q, R의 정확성에 크게 의존한다. 모델이 부정확하면 필터가 현실과 동떨어진 추정을 내놓으며, 이를 감지하기도 쉽지 않다.
- **딥러닝과의 간극**: 칼만 필터는 물리 모델(F 행렬)에 기반하는 반면, 현대 딥러닝은 데이터로부터 모델을 학습한다. 두 패러다임의 통합(physics-informed neural networks 등)이 활발히 연구되고 있지만, 이론적 보장과 데이터 기반 유연성 사이의 긴장은 여전하다.

## 용어 정리

상태 벡터(state vector) - 시스템의 현재 상태를 완전히 기술하는 변수들의 집합 (예: 위치, 속도, 가속도)

공분산 행렬(covariance matrix) - 추정치의 불확실성을 나타내는 행렬, 대각 원소는 각 변수의 분산, 비대각 원소는 변수 간 상관

칼만 이득(Kalman gain) - 예측과 관측의 상대적 신뢰도를 결정하는 가중치 행렬, 칼만 필터의 핵심 계산

혁신(innovation) - 실제 관측값과 예측된 관측값의 차이, 필터에 새로운 정보를 제공하는 신호

야코비안(Jacobian) - 다변수 함수의 1차 편미분 행렬, EKF에서 비선형 함수를 국소적으로 선형화하는 데 사용

시그마 포인트(sigma points) - UKF에서 분포를 대표하는 소수의 결정론적 샘플, 비선형 변환 후 통계량을 근사

파티클 필터(particle filter) - 가중 샘플(파티클)의 집합으로 임의의 확률 분포를 근사하는 몬테카를로 기반 필터링 방법

상태 공간 모델(state space model) - 숨겨진 상태의 시간 진화와 관측 과정을 분리하여 기술하는 수학적 프레임워크

센서 융합(sensor fusion) - 여러 센서의 데이터를 통합하여 단일 센서보다 정확한 추정을 도출하는 기법

---EN---
Kalman Filter - A recursive Bayesian filter for optimally estimating the hidden state of a system from noisy observations

## Estimating Truth Beyond Observation

The world we observe is always imperfect. GPS receivers have errors of several meters, stock prices include random fluctuations, and robot sensors inevitably produce noise. **When observations are noisy, how can we most accurately estimate the true state of a system?** This is the problem Rudolf E. Kalman (1930-2016) solved in his 1960 paper "A New Approach to Linear Filtering and Prediction Problems."

State estimation problems existed before Kalman. Norbert Wiener (1949) presented a theory for designing optimal filters in the frequency domain, but it was limited to stationary processes and difficult to apply to time-varying systems. Kalman's innovation was reformulating the problem in **time-domain state space** and solving it as a **recursive algorithm**. No need to store all past data -- the next estimate could be computed from just the current estimate and new observation.

The Kalman filter's first large-scale deployment was NASA's Apollo program (1960s). It was used to estimate spacecraft position and velocity in real-time from various sensor data, contributing to landing humans on the Moon.

## The Structure of the State Space Model

The Kalman filter describes a system with two equations.

**State transition equation** (how the system evolves):
x(k+1) = F * x(k) + B * u(k) + w(k)

**Observation equation** (what we measure):
z(k) = H * x(k) + v(k)

The meaning of each symbol:

- x(k) --> **state vector**, the system's true state (e.g., position, velocity)
- F --> **state transition matrix**, how the previous state influences the next
- B --> **control input matrix**, the effect of external control signals
- u(k) --> **control input** (e.g., acceleration command)
- w(k) --> **process noise**, Gaussian noise with covariance Q (the model is imperfect)
- z(k) --> **observation vector**, values actually measured by sensors
- H --> **observation matrix**, how states map to observations
- v(k) --> **measurement noise**, Gaussian noise with covariance R (sensors are imperfect)

Two core assumptions: (1) The system is **linear**. (2) The noise is **Gaussian (normally distributed)**. When both conditions hold, the Kalman filter is provably the **optimal estimator** -- the best among all estimators that minimize mean squared error (MSE).

## The Predict-Update Cycle

The Kalman filter operates by repeating a cycle of **predict** and **update** steps.

**Predict step** (model-based, forecasting the next state):
x_pred = F * x(k) + B * u(k)
P_pred = F * P(k) * F^T + Q

The first line predicts the state -- applying physical laws (F) to the current state and incorporating control inputs (B*u). The second line predicts **uncertainty**. It computes how current uncertainty P(k) transforms through system dynamics (F*P*F^T) and adds process noise Q. Prediction alone always **increases** uncertainty.

**Update step** (observation-based, correcting the prediction):
K = P_pred * H^T * (H * P_pred * H^T + R)^(-1)
x(k+1) = x_pred + K * (z - H * x_pred)
P(k+1) = (I - K * H) * P_pred

K in the first line is the **Kalman Gain** -- the heart of the Kalman filter. It determines "how much to trust the prediction versus the observation." When P_pred is large (high prediction uncertainty), K grows larger, trusting the observation more. When R is large (high sensor noise), K shrinks, trusting the prediction more.

In the second line, (z - H * x_pred) is called the **innovation** or **residual** -- the difference between actual and predicted observations. The Kalman gain multiplied by this residual corrects the prediction.

The third line shows that post-update uncertainty **decreases** -- because the observation provides information.

## Bayesian Interpretation of the Kalman Filter

The Kalman filter is a **recursive implementation of Bayesian inference**. From this perspective:

- **Prior distribution**: x_pred and P_pred produced by the predict step -- what we know about the state before observing.
- **Likelihood**: Information provided by observation z, determined by observation model H and noise R.
- **Posterior distribution**: x(k+1) and P(k+1) from the update step -- the combination of prior and likelihood.

Since the product of Gaussians is again Gaussian, the distributional form is preserved at every step. This is why the Kalman filter has a closed-form solution and explains why the Gaussian assumption is so powerful. In non-Gaussian worlds, this elegance breaks down.

## Nonlinear Extensions: EKF, UKF, Particle Filters

Most real-world systems are nonlinear. Robot rotation, GPS coordinate calculations, chemical reaction rates -- all nonlinear. Several extensions address this.

**Extended Kalman Filter (EKF)**: Linearizes nonlinear functions via first-order Taylor expansion around the current estimate. Jacobian matrices replace F and H. Simple but can diverge under strong nonlinearity.

**Unscented Kalman Filter (UKF, Julier & Uhlmann 1997)**: Instead of Jacobians, passes deterministic **sigma points** through the nonlinear function to approximate the distribution. Captures higher-order nonlinearities better than EKF.

**Particle Filter (Gordon et al. 1993)**: Completely abandons the Gaussian assumption, representing arbitrary distributions with many weighted samples (particles). Most flexible but computationally expensive, with particle count growing exponentially in high dimensions.

This lineage shows a spectrum: "exact assumptions -> approximate assumptions -> no assumptions" -- flexibility increases while computational cost rises.

## Kalman Filter Principles in Modern AI

The Kalman filter's predict-update structure and state space model concept are deeply embedded in multiple areas of modern AI.

- **State Space Models (SSM) and Mamba**: Gu et al.'s (2021) S4 (Structured State Spaces for Sequence Modeling) and its successor Mamba (Gu & Dao, 2023) apply the Kalman filter's state space representation to sequence modeling. Discretizing continuous-time state space models for sequence processing, they reduced Transformer's quadratic complexity to linear.
- **SLAM** (Simultaneous Localization and Mapping): EKF-SLAM is classically used for robots estimating their position while simultaneously building a map of an unknown environment. The state vector encompasses both robot pose and landmark positions.
- **Sensor fusion**: Autonomous vehicles combine data from cameras, lidar, radar, GPS, and IMU through Kalman filters (or variants) to estimate vehicle position and surrounding objects. Since each sensor has different noise characteristics (R matrices), the Kalman gain automatically computes appropriate weighted averages.
- **Time series prediction and Bayesian filtering**: Extracting hidden trends from noisy time series data in finance, climate science, and medical monitoring is precisely the Kalman filter's original problem setting.

## Limitations and Weaknesses

The Kalman filter's elegance comes with strict conditions.

- **Fragility of the linearity assumption**: The original Kalman filter is optimal only for linear systems. EKF linearization can produce severe errors under strong nonlinearity and sometimes diverges. UKF and particle filters are alternatives, but each pays the price of computational cost or curse of dimensionality.
- **Constraints of the Gaussian assumption**: When actual noise distributions are non-Gaussian (e.g., sensor data with many outliers, multimodal distributions), the Kalman filter's optimality guarantee breaks. Particle filters or nonparametric methods become necessary.
- **Computational cost of covariance matrices**: The P matrix scales quadratically with state dimension. When the state dimension reaches thousands or more (e.g., large-scale SLAM), covariance updates become a bottleneck. Sparse matrix techniques or low-rank covariance approximations are required.
- **Dependence on model accuracy**: The Kalman filter's performance heavily depends on the accuracy of the state transition model F and noise covariances Q and R. Inaccurate models produce estimates disconnected from reality, and detecting such failures is not straightforward.
- **Gap with deep learning**: The Kalman filter relies on physics-based models (F matrix), while modern deep learning learns models from data. Integrating both paradigms (physics-informed neural networks, etc.) is an active research area, but the tension between theoretical guarantees and data-driven flexibility persists.

## Glossary

State vector - the set of variables that completely describes the current state of a system (e.g., position, velocity, acceleration)

Covariance matrix - a matrix representing the uncertainty of estimates; diagonal elements are variances of each variable, off-diagonal elements capture inter-variable correlations

Kalman gain - the weight matrix determining the relative trust between prediction and observation, the core computation of the Kalman filter

Innovation - the difference between actual and predicted observations, the signal providing new information to the filter

Jacobian - the matrix of first-order partial derivatives of a multivariate function, used in EKF for local linearization of nonlinear functions

Sigma points - a small set of deterministic samples representing a distribution in UKF, used to approximate statistics after nonlinear transformation

Particle filter - a Monte Carlo-based filtering method that approximates arbitrary probability distributions using a set of weighted samples (particles)

State space model - a mathematical framework that separately describes the time evolution of hidden states and the observation process

Sensor fusion - the technique of integrating data from multiple sensors to achieve more accurate estimates than any single sensor alone
