---
difficulty: intermediate
connectionType: structural_analogy
keywords: PID 제어, 피드백 루프, 사이버네틱스, 비례-적분-미분, 정상 상태 오차, 적분 와인드업, 오버슈트, 제어 안정성
keywords_en: PID control, feedback loop, cybernetics, proportional-integral-derivative, steady-state error, integral windup, overshoot, control stability
---
PID Control - 오차를 감지하고 비례-적분-미분 세 가지 경로로 교정하는 피드백 제어의 원형

## 배를 곧게 항해시킨 세 가지 관찰

1922년, Nicolas Minorsky는 해군 함정의 자동 조타 장치를 연구하면서 숙련된 조타수의 행동을 관찰했다. 그가 발견한 것은 세 가지 패턴이었다.

첫째, 조타수는 **현재 빗나간 정도에 비례해서** 키를 돌렸다. 목표 방향에서 30도 벗어났으면 크게, 3도면 작게. 둘째, 미세한 오차가 바람이나 해류 때문에 오래 **누적되면** 점차 키를 더 세게 꺾었다. 셋째, 오차가 **빠르게 줄어들고 있으면** 키를 완화했다. 교정이 과하면 반대쪽으로 흔들리기 때문이다.

Minorsky는 이 세 가지 직관을 수학으로 옮겼고, 이것이 PID 제어기(Proportional-Integral-Derivative controller)의 탄생이다. 20년 후 Ziegler와 Nichols(1942)가 세 파라미터를 체계적으로 조정하는 방법을 제시하면서, PID는 산업 제어의 사실상 표준이 되었다. 오늘날에도 산업 제어 루프의 약 90%가 PID 또는 그 변형을 사용한다고 추정된다.

핵심을 공간적으로 비유하면 이렇다. 목표 지점을 향해 달리는 사람을 상상하자. P는 "목표가 저 멀리 있으니 빨리 뛰어야 한다"는 현재 판단이다. I는 "아까부터 계속 왼쪽으로 밀리고 있으니 오른쪽으로 더 보정하자"는 과거의 누적 경험이다. D는 "지금 거의 다 왔고 속도도 빠르니 브레이크를 밟아야 한다"는 미래 예측이다. 세 가지가 합쳐져야 목표 지점에 부드럽게 도착한다.

## PID 제어의 수학적 구조

PID 제어기의 출력 u(t)는 세 항의 합이다.

u(t) = Kp * e(t) + Ki * integral(e(tau) dtau, 0, t) + Kd * de(t)/dt

여기서 e(t) = r(t) - y(t)이며, r(t)는 목표값(설정점), y(t)는 현재 시스템 출력이다. 이 차이가 **오차 신호**(error signal)다.

1. **P항 -- 비례(Proportional)**: Kp * e(t). 현재 오차에 정비례하는 교정력을 낸다. Kp를 키우면 반응이 빨라지지만 진동이 생길 수 있다. P항만으로는 **정상 상태 오차**(steady-state error)를 제거할 수 없다. 오차가 0이 되면 교정력도 0이 되므로, 외란이 있는 한 오차가 완전히 사라지지 않는다.

2. **I항 -- 적분(Integral)**: Ki * integral(e(tau) dtau, 0, t). 과거 오차를 시간에 걸쳐 누적한다. 작은 오차라도 오래 지속되면 적분값이 커져서 교정력이 증가하며, P항이 남긴 정상 상태 오차를 제거한다. 그러나 오차가 한 방향으로 오래 쌓이면 적분값이 과도하게 커지는 **적분 와인드업**(integral windup)이 발생한다. 실무에서는 적분값에 상한을 두거나 출력이 포화 상태일 때 적분을 멈추는 anti-windup 기법을 쓴다.

3. **D항 -- 미분(Derivative)**: Kd * de(t)/dt. 오차의 변화 속도를 본다. 오차가 빠르게 줄어들면 교정력을 줄여서 **오버슈트**(overshoot)를 방지한다. 미래를 "예측"하는 효과가 있다. 그러나 D항은 측정 잡음에 극도로 민감하여, 실무에서는 D항 앞에 저역 통과 필터를 두어 잡음을 걸러낸다.

이 세 항의 상호작용은 히터 온도 제어에서 직관적으로 드러난다. 목표 200도에서 시작하면, P항이 초기에 큰 출력을 내고, 목표에 접근하면서 D항이 오버슈트를 억제하고, P항만으로 남는 미세한 정상 상태 오차를 I항이 시간에 걸쳐 밀어낸다. Kp, Ki, Kd 어느 하나만으로는 부족하고 세 가지의 균형이 핵심이다.

## 사이버네틱스: 피드백이라는 보편 원리

PID 제어는 더 넓은 지적 운동의 일부였다. Norbert Wiener는 1948년 저서 *Cybernetics*에서 **피드백**을 기계, 생물, 사회 시스템을 관통하는 보편 원리로 제시했다. 생물의 체온 조절이든, 건물의 온도 조절기든, 시장의 가격 조정이든, 모두 "출력을 측정하고, 목표와 비교하고, 차이를 줄이는 방향으로 입력을 조정한다"는 같은 구조를 공유한다.

사이버네틱스는 AI의 두 번째 기원이라 할 수 있다. 첫 번째 기원이 Turing(1936, 1950)의 계산 이론과 기호적 추론이라면, 사이버네틱스는 감각-운동 피드백과 적응의 관점에서 지능에 접근했다. McCulloch와 Pitts(1943)의 신경망 모델도 이 운동의 영향 아래에 있었다. 그러나 1960년대에 사이버네틱스와 인공지능은 지적으로 분리되었고, 강화학습과 로보틱스에서 최근 두 전통이 재합류하고 있다.

## 제어 이론에서 AI 최적화로: 구조적 대응

PID 제어와 신경망 최적화 사이에는 주목할 만한 구조적 대응이 존재한다. 다만 이것은 PID가 직접 영감을 준 것이 아니라, **동일한 수학적 구조가 다른 맥락에서 독립적으로 재발견**된 것에 가깝다.

**구조적 유사성 (동일 수학 구조의 독립적 재발견):**

- P항(현재 오차 비례 교정) --> SGD의 학습률 * 그래디언트: 현재 손실 함수의 기울기에 비례하여 가중치를 조정한다. 학습률 eta가 Kp에 대응한다
- I항(과거 오차 누적) --> SGD 모멘텀: Polyak(1964)의 모멘텀은 과거 그래디언트의 지수 이동 평균이다. 일관된 방향으로 오차가 쌓이면 가속하는 I항의 역할과 구조적으로 같다
- D항(오차 변화율 감쇠) --> Adam의 2차 모멘트: Adam(Kingma & Ba, 2015)의 v_hat이 그래디언트 크기의 변동을 추적하여 학습률을 적응적으로 줄이는 것은, D항의 안정화 역할과 유사하다
- 적분 와인드업 --> 그래디언트 폭발: RNN에서 그래디언트가 BPTT를 통해 폭발적으로 커지는 것은 적분 와인드업과 같은 구조다. 그래디언트 클리핑이 anti-windup에 대응한다

**피드백 루프의 직접적 계승:**

- RLHF(Reinforcement Learning from Human Feedback): LLM 정렬에서, 인간 평가자가 모델 출력을 비교 평가하고 그 피드백이 보상 모델을 거쳐 모델의 행동을 교정한다. Wiener의 피드백 원리가 70년 후 AI 정렬에서 반복되고 있다. 다만 RLHF의 "오차 신호"는 PID의 수치적 오차와 달리 인간 선호도라는 주관적 신호이며, 보상 모델 자체의 오류(reward hacking)가 새로운 문제를 낳는다.

## 핵심 트레이드오프: 속도, 안정성, 정확성의 삼각관계

PID 튜닝의 본질은 세 가지 목표 사이의 타협이다.

- **빠른 응답**: Kp를 높이면 빨라지지만, 진동과 오버슈트가 커진다
- **안정성**: 진동을 줄이려면 Kp를 낮추거나 Kd를 높여야 하지만, 반응이 느려진다
- **정확성**: Ki를 높이면 정상 상태 오차가 사라지지만, 와인드업 위험과 오버슈트가 커진다

이 삼각관계는 신경망 학습에서도 정확히 반복된다. 학습률을 높이면 빠르지만 발산 위험이 있고, 모멘텀을 키우면 지역 최솟값을 넘을 수 있지만 오버슈트가 생기며, 가중치 감쇠를 강하게 걸면 안정적이지만 과소적합의 위험이 있다. 서로 다른 도메인에서 같은 형태의 타협이 나타나는 것은, 피드백 기반 조정 시스템이 공유하는 근본적 제약이다.

## 한계와 약점

- **SISO 한계**: PID는 본질적으로 하나의 오차를 하나의 출력에 매핑하는 단일 변수 제어기다. 수백만 파라미터를 동시에 갱신하는 신경망 최적화와는 차원이 다르다.
- **선형성 가정**: PID의 안정성 분석은 선형 시스템을 전제한다. 신경망의 손실 함수 지형은 극도로 비선형이며, 안장점과 다수의 지역 최솟값이 존재하여 PID의 안정성 분석이 직접 적용되지 않는다.
- **목적 함수 부재**: PID는 명시적 목적 함수를 최소화하지 않는다. 역전파는 명시적 손실 함수의 그래디언트를 따르며, 이것은 근본적으로 다른 수학적 프레임워크다.
- **역사적 단절**: PID/사이버네틱스 전통과 AI의 기호 추론 전통은 1960년대에 분리되어 수십 년간 독립적으로 발전했다. 현대 AI 옵티마이저 설계자들이 PID에서 직접 영감을 받았다는 기록은 없으며, 대응 관계는 사후적으로 발견된 구조적 유사성이다.

## 용어 정리

피드백(feedback) - 시스템의 출력을 입력에 되돌려 행동을 교정하는 메커니즘. PID 제어의 근간

오차 신호(error signal) - 목표값 r(t)과 현재 출력 y(t)의 차이 e(t). 제어기의 모든 판단이 이 신호에서 출발한다

정상 상태 오차(steady-state error) - 시스템이 안정된 후에도 남아 있는 목표값과 출력 사이의 잔류 차이. P항만으로는 제거할 수 없다

적분 와인드업(integral windup) - 오차가 한 방향으로 장시간 누적되어 I항이 과도하게 커지는 현상. 상황 역전 후에도 과잉 교정을 유발한다

오버슈트(overshoot) - 교정이 과도하여 출력이 목표값을 넘어서는 현상. Kp가 크거나 D항이 부족할 때 발생한다

사이버네틱스(cybernetics) - Wiener(1948)가 제창한, 기계와 생물을 관통하는 제어와 통신의 통합 이론. AI의 두 번째 지적 기원

모멘텀(momentum) - 과거 그래디언트의 지수 이동 평균을 누적하여 최적화 방향을 안정화하는 기법. Polyak(1964)가 제안했으며, PID의 I항과 구조적으로 유사하다

RLHF(Reinforcement Learning from Human Feedback) - 인간의 선호도 피드백으로 보상 모델을 학습하고, 이를 이용해 AI 모델을 정렬하는 방법. 피드백 루프의 현대적 형태

---EN---
PID Control - The archetype of feedback control that corrects errors through three pathways: proportional, integral, and derivative

## Three Observations That Steered a Ship Straight

In 1922, Nicolas Minorsky was studying automatic steering systems for naval ships and observed the behavior of experienced helmsmen. He discovered three patterns.

First, helmsmen turned the rudder **in proportion to the current deviation**. Thirty degrees off course meant a large correction; three degrees, a small one. Second, when subtle errors **accumulated** over time due to wind or current, they progressively increased their corrections. Third, when errors were **decreasing rapidly**, they eased the rudder -- because overcorrection would swing the ship to the other side.

Minorsky translated these three intuitions into mathematics, giving birth to the PID controller. Twenty years later, Ziegler and Nichols (1942) introduced a systematic tuning method, establishing PID as the de facto standard for industrial control. Even today, an estimated 90% of industrial control loops use PID or its variants.

A spatial analogy: imagine a person running toward a target point. P is the present judgment: "the target is far, so sprint." I is cumulative past experience: "I've been drifting left, so compensate rightward." D is future anticipation: "I'm almost there and moving fast, so hit the brakes." Only when the three work together does the person arrive smoothly.

## The Mathematical Structure of PID Control

The PID controller output u(t) is the sum of three terms:

u(t) = Kp * e(t) + Ki * integral(e(tau) dtau, 0, t) + Kd * de(t)/dt

Here, e(t) = r(t) - y(t), where r(t) is the target value and y(t) is the current system output. This difference is the **error signal**.

1. **P-term -- Proportional**: Kp * e(t). Produces corrective force proportional to current error. Increasing Kp speeds response but may cause oscillation. The P-term alone cannot eliminate **steady-state error** -- when error reaches zero, corrective force also vanishes, so under disturbances the error never fully disappears.

2. **I-term -- Integral**: Ki * integral(e(tau) dtau, 0, t). Accumulates past errors over time. Even small persistent errors cause the integral to grow, eliminating the steady-state error left by the P-term. But prolonged one-directional accumulation causes **integral windup** -- overcorrection even after the situation reverses. In practice, engineers use anti-windup techniques like clamping.

3. **D-term -- Derivative**: Kd * de(t)/dt. Monitors the rate of error change. When error decreases rapidly, it reduces corrective force to prevent **overshoot**. It effectively "anticipates" the future. However, it is extremely sensitive to measurement noise, requiring a low-pass filter in practice.

These three terms interact in a characteristic way: P drives the initial response, D suppresses overshoot as the target approaches, and I eliminates the residual steady-state error over time. No single term suffices alone -- their balance is what matters.

## Cybernetics: Feedback as a Universal Principle

PID control was part of a broader intellectual movement. Norbert Wiener, in his 1948 book *Cybernetics*, presented **feedback** as a universal principle spanning mechanical, biological, and social systems. Whether biological thermoregulation, a building's thermostat, or market price adjustment, all share the structure: "measure the output, compare it with the target, and adjust the input to reduce the difference."

Cybernetics can be called AI's second origin. If the first was Turing's (1936, 1950) computation theory, cybernetics approached intelligence from sensorimotor feedback and adaptation. McCulloch and Pitts' (1943) neural network model was under this movement's influence. However, in the 1960s, cybernetics and AI intellectually separated, and only recently have the two traditions reconverged through reinforcement learning and robotics.

## From Control Theory to AI Optimization: Structural Correspondences

Notable structural correspondences exist between PID control and neural network optimization. These are not cases of PID directly inspiring AI, but rather **the same mathematical structures independently rediscovered in different contexts**.

**Structural similarities (independent rediscovery):**

- P-term --> SGD's learning rate * gradient: weights adjusted proportionally to the current loss gradient. Learning rate eta corresponds to Kp
- I-term --> SGD momentum: Polyak's (1964) momentum is an exponential moving average of past gradients. When errors consistently point the same direction, it accelerates -- structurally the same as the I-term
- D-term --> Adam's second moment: Adam's (Kingma & Ba, 2015) v_hat tracks gradient magnitude fluctuations and adaptively reduces the learning rate, resembling the D-term's stabilizing role
- Integral windup --> Gradient explosion: RNN gradients exploding through BPTT shares the same structure as excessive integral accumulation. Gradient clipping corresponds to anti-windup

**Direct inheritance of the feedback loop:**

- RLHF: In LLM alignment, human evaluators rate model outputs and that feedback corrects the model's behavior through a reward model. Wiener's feedback principle repeats 70 years later. However, RLHF's "error signal" is subjective human preference, and reward model errors (reward hacking) create new problems.

## The Core Tradeoff: The Triangle of Speed, Stability, and Accuracy

The essence of PID tuning is the compromise among three goals:

- **Fast response**: Increasing Kp speeds things up, but oscillation and overshoot grow
- **Stability**: Reducing oscillation requires lowering Kp or raising Kd, but response slows
- **Accuracy**: Raising Ki eliminates steady-state error, but increases windup risk and overshoot

This triangle repeats precisely in neural network training. Raising the learning rate is faster but risks divergence; increasing momentum can escape local minima but causes overshoot; strong weight decay stabilizes but risks underfitting. The same compromise across different domains reflects a fundamental constraint of feedback-based adjustment systems.

## Limitations and Weaknesses

- **SISO limitation**: PID is inherently a single-variable controller. This is fundamentally different from neural network optimization simultaneously updating millions of parameters.
- **Linearity assumption**: PID stability analysis assumes linear systems. Neural network loss landscapes are extremely nonlinear with saddle points and numerous local minima.
- **No objective function**: PID does not minimize an explicit objective function. Backpropagation follows an explicit loss function's gradient -- a fundamentally different framework.
- **Historical disconnect**: The PID/cybernetics tradition and AI's symbolic reasoning tradition separated in the 1960s. Modern AI optimizer designers have no documented record of drawing direct inspiration from PID.

## Glossary

Feedback - a mechanism that returns a system's output to its input to correct behavior; the foundation of PID control

Error signal - the difference between target value r(t) and current output y(t), denoted e(t); all controller decisions originate from this signal

Steady-state error - the residual difference between target and output that persists after settling; cannot be eliminated by the P-term alone

Integral windup - excessive I-term growth due to prolonged one-directional error accumulation, causing overcorrection after reversal

Overshoot - output exceeding the target value due to excessive correction; occurs when Kp is too large or D-term is insufficient

Cybernetics - the unified theory of control and communication across machines and organisms, proposed by Wiener (1948); AI's second intellectual origin

Momentum - a technique stabilizing optimization direction by accumulating an exponential moving average of past gradients; proposed by Polyak (1964), structurally analogous to the PID I-term

RLHF (Reinforcement Learning from Human Feedback) - aligning AI models by learning a reward model from human preference feedback; a modern manifestation of the feedback loop
