---
difficulty: intermediate
connectionType: structural_analogy
keywords: PID 제어, 피드백 루프, 사이버네틱스, 비례-적분-미분, 정상 상태 오차, 적분 와인드업, 오버슈트, 제어 안정성
keywords_en: PID control, feedback loop, cybernetics, proportional-integral-derivative, steady-state error, integral windup, overshoot, control stability
---
PID Control - 오차를 감지하고 비례-적분-미분 세 가지 경로로 교정하는 피드백 제어의 원형

## 배를 곧게 항해시킨 세 가지 관찰

1922년, Nicolas Minorsky는 해군 함정의 자동 조타 장치를 연구하면서 숙련된 조타수의 행동을 관찰했다. 그가 발견한 것은 세 가지 패턴이었다.

첫째, 조타수는 **현재 빗나간 정도에 비례해서** 키를 돌렸다. 목표 방향에서 30도 벗어났으면 크게, 3도면 작게. 둘째, 미세한 오차가 바람이나 해류 때문에 오래 **누적되면** 점차 키를 더 세게 꺾었다. 조금씩 밀리는 것이 쌓여 경로 전체가 틀어지는 것을 막기 위해서다. 셋째, 오차가 **빠르게 줄어들고 있으면** 키를 완화했다. 교정이 과하면 반대쪽으로 흔들리기 때문이다.

Minorsky는 이 세 가지 직관을 수학으로 옮겼고, 이것이 PID 제어기(Proportional-Integral-Derivative controller)의 탄생이다. 20년 후 Ziegler와 Nichols(1942)가 세 파라미터를 체계적으로 조정하는 방법을 제시하면서, PID는 산업 제어의 사실상 표준이 되었다. 오늘날에도 산업 제어 루프의 약 90%가 PID 또는 그 변형을 사용한다고 추정된다.

핵심을 공간적으로 비유하면 이렇다. 목표 지점을 향해 달리는 사람을 상상하자. P는 "목표가 저 멀리 있으니 빨리 뛰어야 한다"는 현재 판단이다. I는 "아까부터 계속 왼쪽으로 밀리고 있으니 오른쪽으로 더 보정하자"는 과거의 누적 경험이다. D는 "지금 거의 다 왔고 속도도 빠르니 브레이크를 밟아야 한다"는 미래 예측이다. 세 가지가 합쳐져야 목표 지점에 부드럽게 도착한다.

## PID 제어의 수학적 구조

PID 제어기의 출력 u(t)는 세 항의 합이다.

u(t) = Kp * e(t) + Ki * integral(e(tau) dtau, 0, t) + Kd * de(t)/dt

여기서 e(t) = r(t) - y(t)이며, r(t)는 목표값(설정점), y(t)는 현재 시스템 출력이다. 이 차이가 **오차 신호**(error signal)다.

1. **P항 -- 비례(Proportional)**: Kp * e(t). 현재 오차에 정비례하는 교정력을 낸다. Kp를 키우면 반응이 빨라지지만 진동(oscillation)이 생길 수 있다. Kp를 줄이면 안정적이지만 느리다. P항만으로는 **정상 상태 오차**(steady-state error)를 제거할 수 없다. 이유는 단순하다. 오차가 0이 되면 교정력도 0이 되므로, 외란(바람, 마찰 등)이 있는 한 오차가 완전히 사라지지 않는다.

2. **I항 -- 적분(Integral)**: Ki * integral(e(tau) dtau, 0, t). 과거 오차를 시간에 걸쳐 누적한다. 작은 오차라도 오래 지속되면 적분값이 커져서 교정력이 증가한다. P항이 남긴 정상 상태 오차를 제거하는 것이 I항의 역할이다. 그러나 위험이 있다. 오차가 한 방향으로 오래 쌓이면 적분값이 과도하게 커지는 **적분 와인드업**(integral windup)이 발생한다. 상황이 역전된 후에도 거대한 적분값이 남아 과잉 교정을 유발한다. 실무에서는 적분값에 상한을 두거나(clamping), 출력이 포화 상태일 때 적분을 멈추는 anti-windup 기법을 쓴다.

3. **D항 -- 미분(Derivative)**: Kd * de(t)/dt. 오차의 변화 속도를 본다. 오차가 빠르게 줄어들고 있으면 교정력을 줄여서 **오버슈트**(overshoot, 목표를 넘어서는 현상)를 방지한다. 반대로 오차가 빠르게 커지면 교정력을 추가한다. 미래를 "예측"하는 효과가 있다. 그러나 D항은 측정 잡음에 극도로 민감하다. 고주파 잡음이 미분에 의해 증폭되기 때문이다. 실무에서는 D항 앞에 저역 통과 필터(low-pass filter)를 두어 잡음을 걸러낸다.

구체적인 숫자로 추적하면 세 항의 역할이 더 분명해진다. 산업용 히터의 수온 제어를 예로 들어 보자. 목표 온도 200도, 현재 180도, 게인값이 Kp = 2.0, Ki = 0.1, Kd = 1.0이라 하자.

- **t = 0초**: 오차 e = 200 - 180 = 20. P항 = 2.0 * 20 = 40. 히터 출력을 40%로 올린다. I항은 아직 누적 없이 0, D항도 이전 변화가 없으므로 0. 총 출력 = 40%.
- **t = 5초**: 수온이 195도까지 올라갔다. 오차 e = 5. P항 = 2.0 * 5 = 10으로 줄어든다. I항은 그동안 쌓인 오차 면적(대략 5초간 평균 오차 12.5)을 반영하여 0.1 * 62.5 = 6.25. D항은 온도가 5초 동안 15도 올랐으므로 변화율이 -3(오차가 초당 3씩 줄어든다). Kd * (-3) = -3, 교정력을 줄여 오버슈트를 방지한다. 총 출력 = 10 + 6.25 - 3 = 13.25%.
- **t = 20초**: 수온이 199도에서 머문다. P항 = 2.0 * 1 = 2. 여기서 P항만으로는 출력 2%가 열손실과 균형을 이루어 1도 오차가 남는다(정상 상태 오차). 그러나 I항이 20초간 누적된 오차를 반영하여 추가 출력을 제공하고, 이 오차를 0으로 밀어 넣는다.

## 세 항의 극단값이 보여주는 직관

각 게인(Kp, Ki, Kd)을 극단으로 밀면 시스템의 성격이 드러난다.

- Kp만 크게, Ki = Kd = 0: 순수 비례 제어. 빠르지만 정상 상태 오차가 남고, Kp를 과도하게 키우면 진동이 시작된다. Kp가 무한대로 가면 시스템은 발산한다.
- Ki만 크게, Kp = Kd = 0: 오차의 누적만으로 제어. 반응이 극도로 느리고 거대한 오버슈트가 발생한다.
- Kd만 크게, Kp = Ki = 0: 오차의 변화율에만 반응. 오차가 일정하면(변화율 0) 아무 교정도 하지 않는다. 잡음을 과도하게 증폭한다.
- 세 항 모두 0: 제어기가 꺼진 상태. 시스템은 외란에 무방비가 된다.

이 극단값 분석이 보여주는 것은, P-I-D 어느 하나만으로는 부족하고 세 가지의 균형이 핵심이라는 점이다. Ziegler-Nichols 튜닝은 이 균형점을 체계적으로 찾는 최초의 실용적 방법이었다.

## 사이버네틱스: 피드백이라는 보편 원리

PID 제어는 더 넓은 지적 운동의 일부였다. Norbert Wiener는 1948년 저서 *Cybernetics: Or Control and Communication in the Animal and the Machine*에서 **피드백**(feedback)을 기계, 생물, 사회 시스템을 관통하는 보편 원리로 제시했다.

Wiener의 핵심 주장은 이것이다. 생물의 체온 조절(항상성)이든, 건물의 온도 조절기든, 시장의 가격 조정이든, 모두 같은 구조를 공유한다. "출력을 측정하고, 목표와 비교하고, 차이를 줄이는 방향으로 입력을 조정한다." 이 관점에서 보면 지능이란 환경 변화에 대응하여 목표 상태를 유지하는 적응적 제어 시스템이다.

사이버네틱스는 AI의 두 번째 기원이라 할 수 있다. 첫 번째 기원이 Turing(1936, 1950)의 계산 이론과 기호적 추론이라면, 사이버네틱스는 감각-운동 피드백과 적응의 관점에서 지능에 접근했다. McCulloch와 Pitts(1943)의 신경망 모델도, Rosenblatt(1958)의 퍼셉트론도 이 운동의 영향 아래에 있었다. 1956년 다트머스 회의에서 "인공지능"이라는 이름이 채택되기 전, 이 분야는 사이버네틱스라 불렸다.

그러나 1960년대에 Wiener의 사이버네틱스와 McCarthy-Minsky의 인공지능은 지적으로 분리되었다. AI는 기호 추론과 탐색으로, 제어 이론은 최적 제어(Pontryagin, Bellman)와 견실 제어(robust control)로 각각 발전했다. 이 분리는 수십 년간 지속되었고, 강화학습과 로보틱스에서 최근 두 전통이 재합류하고 있다.

## 제어 이론에서 AI 최적화로: 구조적 대응

PID 제어와 신경망 최적화 사이에는 주목할 만한 구조적 대응이 존재한다. 다만 이것은 PID가 직접 영감을 준 것이 아니라, **동일한 수학적 구조가 다른 맥락에서 독립적으로 재발견**된 것에 가깝다.

**구조적 유사성 (동일 수학 구조의 독립적 재발견):**

- P항(현재 오차 비례 교정) --> SGD의 학습률 * 그래디언트: 현재 손실 함수의 기울기에 비례하여 가중치를 조정한다. 학습률 eta가 Kp에 대응한다. 오차가 크면 큰 보폭으로, 작으면 작은 보폭으로 움직이는 구조가 같다.
- I항(과거 오차 누적) --> SGD 모멘텀: Polyak(1964)의 모멘텀 v(t) = beta * v(t-1) + gradient(t)는 과거 그래디언트의 지수 이동 평균이다. 일관된 방향으로 오차가 쌓이면 가속하는 I항의 역할과 구조적으로 같다.
- D항(오차 변화율 감쇠) --> Adam의 2차 모멘트: Adam(Kingma & Ba, 2015)의 v_hat이 그래디언트 크기의 변동을 추적하여 학습률을 적응적으로 줄이는 것은, 급격한 변화를 감쇠시키는 D항의 안정화 역할과 유사하다.
- 적분 와인드업 --> 그래디언트 폭발: 순환 신경망(RNN)에서 그래디언트가 시간 역전파(BPTT)를 통해 폭발적으로 커지는 것은 오차 누적이 과도해지는 적분 와인드업과 같은 구조다. 그래디언트 클리핑(gradient clipping)이 anti-windup에 대응한다.

**피드백 루프의 직접적 계승:**

- RLHF(Reinforcement Learning from Human Feedback): 대규모 언어 모델(LLM) 정렬에서, 인간 평가자가 모델 출력을 비교 평가하고 그 피드백이 보상 모델을 거쳐 모델의 행동을 교정한다. "출력을 측정하고, 목표와 비교하고, 차이를 줄이는 방향으로 조정한다"는 Wiener의 피드백 원리가 70년 후 AI 정렬이라는 맥락에서 반복되고 있다. 다만 RLHF의 "오차 신호"는 PID의 수치적 오차와 달리 인간 선호도라는 주관적 신호이며, 보상 모델 자체의 오류(reward hacking)가 새로운 문제를 낳는다.

## 핵심 트레이드오프: 속도, 안정성, 정확성의 삼각관계

PID 튜닝의 본질은 세 가지 목표 사이의 타협이다.

- **빠른 응답(fast response)**: Kp를 높이면 빨라지지만, 진동과 오버슈트가 커진다.
- **안정성(stability)**: 진동을 줄이려면 Kp를 낮추거나 Kd를 높여야 하지만, 반응이 느려진다.
- **정확성(zero steady-state error)**: Ki를 높이면 정상 상태 오차가 사라지지만, 와인드업 위험과 오버슈트가 커진다.

이 삼각관계는 신경망 학습에서도 정확히 반복된다. 학습률을 높이면 빠르지만 발산 위험이 있고, 모멘텀을 키우면 지역 최솟값을 넘을 수 있지만 오버슈트가 생기며, 가중치 감쇠(weight decay)를 강하게 걸면 안정적이지만 과소적합의 위험이 있다. 서로 다른 도메인에서 같은 형태의 타협이 나타나는 것은, 피드백 기반 조정 시스템이 공유하는 근본적 제약이다.

## 한계와 약점

- **SISO 한계**: PID는 본질적으로 하나의 오차를 하나의 출력에 매핑하는 단일 변수 제어기다. 수백만 파라미터를 동시에 갱신하는 신경망 최적화와는 차원이 다르다. MIMO(다중 입력-다중 출력) 제어 이론이 존재하지만, 신경망 파라미터 공간의 구조와는 여전히 다르다.
- **선형성 가정**: PID의 이론적 안정성 분석은 선형 시스템을 전제한다. 신경망의 손실 함수 지형은 극도로 비선형이며, 안장점(saddle point)과 다수의 지역 최솟값이 존재하여 PID의 안정성 분석이 직접 적용되지 않는다.
- **목적 함수 부재**: PID는 명시적 목적 함수를 최소화하지 않는다. "오차를 0으로 만드는 것"이 목표이지, 비용 함수를 최적화하는 것이 아니다. 역전파는 명시적 손실 함수의 그래디언트를 따르며, 이것은 PID와 근본적으로 다른 수학적 프레임워크다.
- **역사적 단절**: PID/사이버네틱스 전통과 AI의 기호 추론 전통은 1960년대에 분리되어 수십 년간 독립적으로 발전했다. 현대 AI 옵티마이저(SGD, Adam 등)의 설계자들이 PID에서 직접 영감을 받았다는 기록은 없으며, 대응 관계는 사후적으로 발견된 구조적 유사성이다.

## 용어 정리

피드백(feedback) - 시스템의 출력을 입력에 되돌려 행동을 교정하는 메커니즘. PID 제어의 근간

오차 신호(error signal) - 목표값 r(t)과 현재 출력 y(t)의 차이 e(t). 제어기의 모든 판단이 이 신호에서 출발한다

정상 상태 오차(steady-state error) - 시스템이 과도 응답을 지나 안정된 후에도 남아 있는 목표값과 출력 사이의 잔류 차이. P항만으로는 제거할 수 없다

적분 와인드업(integral windup) - 오차가 한 방향으로 장시간 누적되어 I항이 과도하게 커지는 현상. 상황 역전 후에도 과잉 교정을 유발한다

오버슈트(overshoot) - 교정이 과도하여 출력이 목표값을 넘어서는 현상. Kp가 크거나 D항이 부족할 때 발생한다

사이버네틱스(cybernetics) - Wiener(1948)가 제창한, 기계와 생물을 관통하는 제어와 통신의 통합 이론. AI의 두 번째 지적 기원

진동(oscillation) - 출력이 목표값 주위를 반복적으로 오가는 불안정 현상. Kp 과다 또는 D항 부족 시 발생

외란(disturbance) - 바람, 마찰, 부하 변화 등 시스템 외부에서 출력에 영향을 미치는 예측 불가 요인

모멘텀(momentum) - 과거 그래디언트의 지수 이동 평균을 누적하여 최적화 방향을 안정화하는 기법. Polyak(1964)가 제안했으며, PID의 I항과 구조적으로 유사하다

RLHF(Reinforcement Learning from Human Feedback) - 인간의 선호도 피드백으로 보상 모델을 학습하고, 이를 이용해 AI 모델을 정렬하는 방법. 피드백 루프의 현대적 형태

---EN---
PID Control - The archetype of feedback control that corrects errors through three pathways: proportional, integral, and derivative

## Three Observations That Steered a Ship Straight

In 1922, Nicolas Minorsky was studying automatic steering systems for naval ships and observed the behavior of experienced helmsmen. He discovered three patterns.

First, helmsmen turned the rudder **in proportion to the current deviation**. Thirty degrees off course meant a large correction; three degrees, a small one. Second, when subtle errors **accumulated** over time due to wind or current, they progressively increased their corrections -- to prevent small drifts from compounding into a completely wrong course. Third, when errors were **decreasing rapidly**, they eased the rudder -- because overcorrection would swing the ship to the other side.

Minorsky translated these three intuitions into mathematics, giving birth to the PID controller (Proportional-Integral-Derivative controller). Twenty years later, Ziegler and Nichols (1942) introduced a systematic method for tuning the three parameters, establishing PID as the de facto standard for industrial control. Even today, an estimated 90% of industrial control loops use PID or its variants.

A spatial analogy makes the core idea vivid. Imagine a person running toward a target point. P is the present judgment: "the target is far away, so I need to sprint." I is cumulative past experience: "I've been drifting left for a while, so I should compensate rightward." D is future anticipation: "I'm almost there and moving fast, so I should hit the brakes." Only when the three work together does the person arrive smoothly at the target.

## The Mathematical Structure of PID Control

The PID controller output u(t) is the sum of three terms:

u(t) = Kp * e(t) + Ki * integral(e(tau) dtau, 0, t) + Kd * de(t)/dt

Here, e(t) = r(t) - y(t), where r(t) is the target value (setpoint) and y(t) is the current system output. This difference is the **error signal**.

1. **P-term -- Proportional**: Kp * e(t). Produces corrective force directly proportional to the current error. Increasing Kp speeds up the response but may cause oscillation. Decreasing Kp is more stable but slower. The P-term alone cannot eliminate **steady-state error**. The reason is simple: when error reaches zero, corrective force also vanishes, so under disturbances (wind, friction, etc.), the error never fully disappears.

2. **I-term -- Integral**: Ki * integral(e(tau) dtau, 0, t). Accumulates past errors over time. Even small errors, if they persist, cause the integral to grow and increase corrective force. The I-term's role is to eliminate the steady-state error that the P-term leaves behind. But there is a risk: when errors accumulate in one direction for too long, the integral becomes excessively large -- **integral windup**. Even after the situation reverses, the massive integral value remains and causes overcorrection. In practice, engineers apply clamping (capping the integral value) or stop integration when the output is saturated (anti-windup techniques).

3. **D-term -- Derivative**: Kd * de(t)/dt. Monitors the rate of error change. When error is decreasing rapidly, it reduces corrective force to prevent **overshoot** (the output exceeding the target). Conversely, rapidly increasing error triggers additional correction. It effectively "anticipates" the future. However, the D-term is extremely sensitive to measurement noise -- high-frequency noise gets amplified through differentiation. In practice, a low-pass filter is placed before the D-term to filter out noise.

Tracking with concrete numbers makes the three terms' roles clearer. Consider water temperature control in an industrial heater. Suppose the target is 200 degrees, the current temperature is 180 degrees, and the gains are Kp = 2.0, Ki = 0.1, Kd = 1.0.

- **t = 0s**: Error e = 200 - 180 = 20. P-term = 2.0 * 20 = 40. Heater output goes to 40%. The I-term has no accumulation yet (0), and the D-term has no prior change (0). Total output = 40%.
- **t = 5s**: Temperature has risen to 195 degrees. Error e = 5. P-term = 2.0 * 5 = 10, much reduced. The I-term reflects accumulated error area over 5 seconds (roughly average error 12.5 over 5 seconds): 0.1 * 62.5 = 6.25. The D-term sees temperature rising 15 degrees in 5 seconds, so the error rate of change is -3 (error decreasing by 3 per second). Kd * (-3) = -3, reducing corrective force to prevent overshoot. Total output = 10 + 6.25 - 3 = 13.25%.
- **t = 20s**: Temperature settles at 199 degrees. P-term = 2.0 * 1 = 2. With P alone, this 2% output balances heat loss, leaving a 1-degree error (steady-state error). But the I-term, reflecting accumulated error over 20 seconds, provides additional output that pushes this error to zero.

## What Extreme Values Reveal

Pushing each gain (Kp, Ki, Kd) to extremes reveals the system's character:

- Kp large, Ki = Kd = 0: Pure proportional control. Fast but leaves steady-state error, and excessive Kp initiates oscillation. As Kp approaches infinity, the system diverges.
- Ki large, Kp = Kd = 0: Control by cumulative error alone. Extremely slow response with massive overshoot.
- Kd large, Kp = Ki = 0: Responds only to the rate of error change. If error is constant (zero rate of change), no correction occurs at all. Excessively amplifies noise.
- All three at 0: Controller is off. The system is defenseless against disturbances.

This extreme-value analysis demonstrates that no single P, I, or D term suffices alone -- the balance among the three is what matters. Ziegler-Nichols tuning was the first practical method for systematically finding this balance point.

## Cybernetics: Feedback as a Universal Principle

PID control was part of a broader intellectual movement. Norbert Wiener, in his 1948 book *Cybernetics: Or Control and Communication in the Animal and the Machine*, presented **feedback** as a universal principle spanning mechanical, biological, and social systems.

Wiener's core argument: whether biological thermoregulation (homeostasis), a building's thermostat, or market price adjustment, all share the same structure. "Measure the output, compare it with the target, and adjust the input to reduce the difference." From this perspective, intelligence is an adaptive control system that maintains a target state in the face of environmental change.

Cybernetics can be called AI's second origin. If the first origin was Turing's (1936, 1950) computation theory and symbolic reasoning, cybernetics approached intelligence from the perspective of sensorimotor feedback and adaptation. McCulloch and Pitts' (1943) neural network model and Rosenblatt's (1958) perceptron were both under the influence of this movement. Before the name "artificial intelligence" was adopted at the 1956 Dartmouth conference, the field was called cybernetics.

However, in the 1960s, Wiener's cybernetics and McCarthy-Minsky's artificial intelligence intellectually separated. AI developed toward symbolic reasoning and search, while control theory moved toward optimal control (Pontryagin, Bellman) and robust control. This separation lasted decades, and only recently have the two traditions reconverged through reinforcement learning and robotics.

## From Control Theory to AI Optimization: Structural Correspondences

Notable structural correspondences exist between PID control and neural network optimization. These are not cases of PID directly inspiring AI, but rather **the same mathematical structures independently rediscovered in different contexts**.

**Structural similarities (independent rediscovery of the same mathematics):**

- P-term (correction proportional to current error) --> SGD's learning rate * gradient: Weights are adjusted proportionally to the current loss function's gradient. Learning rate eta corresponds to Kp. The structure is the same -- large error means large steps, small error means small steps.
- I-term (accumulation of past errors) --> SGD momentum: Polyak's (1964) momentum v(t) = beta * v(t-1) + gradient(t) is an exponential moving average of past gradients. When errors consistently point in the same direction, it accelerates -- structurally the same role as the I-term.
- D-term (dampening from error rate of change) --> Adam's second moment: Adam's (Kingma & Ba, 2015) v_hat tracks gradient magnitude fluctuations and adaptively reduces the learning rate, resembling the D-term's stabilizing role of dampening sudden changes.
- Integral windup --> Gradient explosion: In recurrent neural networks (RNNs), gradients exploding through backpropagation through time (BPTT) shares the same structure as excessive error accumulation in integral windup. Gradient clipping corresponds to anti-windup techniques.

**Direct inheritance of the feedback loop:**

- RLHF (Reinforcement Learning from Human Feedback): In large language model (LLM) alignment, human evaluators comparatively rate model outputs, and that feedback, channeled through a reward model, corrects the model's behavior. Wiener's feedback principle -- "measure the output, compare it with the target, adjust to reduce the difference" -- repeats 70 years later in the context of AI alignment. However, RLHF's "error signal" is unlike PID's numerical error -- it is a subjective signal of human preference, and reward model errors (reward hacking) create a new class of problems.

## The Core Tradeoff: The Triangle of Speed, Stability, and Accuracy

The essence of PID tuning is the compromise among three goals:

- **Fast response**: Increasing Kp speeds things up, but oscillation and overshoot grow.
- **Stability**: Reducing oscillation requires lowering Kp or raising Kd, but response slows down.
- **Accuracy (zero steady-state error)**: Raising Ki eliminates steady-state error, but increases windup risk and overshoot.

This triangle repeats precisely in neural network training. Raising the learning rate is faster but risks divergence; increasing momentum can escape local minima but causes overshoot; applying strong weight decay stabilizes but risks underfitting. The same form of compromise appearing across different domains reflects a fundamental constraint shared by all feedback-based adjustment systems.

## Limitations and Weaknesses

- **SISO limitation**: PID is inherently a single-variable controller mapping one error to one output. This is fundamentally different from neural network optimization, which simultaneously updates millions of parameters. MIMO (multiple-input, multiple-output) control theory exists but still differs structurally from neural network parameter spaces.
- **Linearity assumption**: PID stability analysis assumes linear systems. Neural network loss landscapes are extremely nonlinear, featuring saddle points and numerous local minima, so PID stability analysis does not directly apply.
- **No objective function**: PID does not minimize an explicit objective function. The goal is driving error to zero, not minimizing a cost function. Backpropagation follows the gradient of an explicit loss function -- a fundamentally different mathematical framework.
- **Historical disconnect**: The PID/cybernetics tradition and AI's symbolic reasoning tradition separated in the 1960s and developed independently for decades. There is no documented record of modern AI optimizer designers (SGD, Adam, etc.) drawing direct inspiration from PID -- the correspondences are structural similarities identified after the fact.

## Glossary

Feedback - a mechanism that returns a system's output to its input to correct behavior; the foundation of PID control

Error signal - the difference between target value r(t) and current output y(t), denoted e(t); all controller decisions originate from this signal

Steady-state error - the residual difference between target and output that persists after the system's transient response has settled; cannot be eliminated by the P-term alone

Integral windup - the phenomenon where the I-term grows excessively due to prolonged one-directional error accumulation, causing overcorrection even after the situation reverses

Overshoot - the phenomenon where output exceeds the target value due to excessive correction; occurs when Kp is too large or the D-term is insufficient

Cybernetics - the unified theory of control and communication across machines and organisms, proposed by Wiener (1948); the second intellectual origin of AI

Oscillation - an instability where output repeatedly swings back and forth around the target value; caused by excessive Kp or insufficient D-term

Disturbance - unpredictable external factors (wind, friction, load changes, etc.) that affect the system output

Momentum - a technique that stabilizes optimization direction by accumulating an exponential moving average of past gradients; proposed by Polyak (1964) and structurally analogous to the PID I-term

RLHF (Reinforcement Learning from Human Feedback) - a method of aligning AI models by learning a reward model from human preference feedback; a modern manifestation of the feedback loop
