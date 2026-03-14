---
difficulty: intermediate
connectionType: direct_inspiration
keywords: PID 제어, 피드백 시스템, 사이버네틱스, 비례 제어, 적분 제어, 미분 제어, 경사하강법, 학습률
keywords_en: PID control, feedback system, cybernetics, proportional control, integral control, derivative control, gradient descent, learning rate
---
PID Control and Feedback Systems - 오차를 감지하고 교정하는 피드백 제어의 원형으로, AI 최적화와 사이버네틱스의 지적 뿌리를 이루는 제어 메커니즘

## 배를 곧게 항해시키는 문제

1922년, 러시아 태생의 미국 공학자 Nicolas Minorsky(1885-1970)는 해군 함정의 자동 조타 시스템을 연구하고 있었다. 숙련된 조타수가 배를 조종하는 방식을 관찰한 그는 세 가지 행동 패턴을 발견했다.

첫째, 조타수는 현재 방향 오차에 비례하여 키를 돌렸다. 목표 방향에서 많이 벗어났으면 크게, 조금 벗어났으면 작게. 둘째, 오차가 오래 지속되면 키를 점점 더 강하게 돌렸다. 바람이나 해류 때문에 미세한 오차가 계속 쌓이는 것을 교정하기 위해서다. 셋째, 오차가 빠르게 줄어들고 있으면 키를 완화했다. 과도하게 교정하여 반대쪽으로 흔들리는 것을 방지하기 위해서다.

Minorsky는 이 세 가지를 수학적으로 정식화했다. 이것이 **PID 제어기**의 탄생이다. 이후 Ziegler와 Nichols(1942)가 PID 파라미터를 체계적으로 조정하는 방법(Ziegler-Nichols 튜닝)을 제시하면서, PID 제어는 산업 제어의 표준이 되었다. 오늘날에도 산업 제어 루프의 90% 이상이 PID 또는 그 변형을 사용한다고 추정된다.

## PID 제어의 수학적 구조

PID 제어기의 출력은 세 가지 항의 합이다.

u(t) = Kp * e(t) + Ki * integral(e(tau) dtau, 0, t) + Kd * de(t)/dt

여기서 e(t) = r(t) - y(t)로, 목표값 r(t)과 현재 출력 y(t)의 차이인 **오차 신호**다.

P항 (비례, Proportional): Kp * e(t)
현재 오차에 비례하는 교정. Kp가 크면 빠르게 반응하지만, 진동(oscillation)이 생길 수 있다. Kp가 작으면 느리지만 안정적이다. P항만으로는 정상 상태 오차(steady-state error)를 완전히 제거할 수 없다. 오차가 0이 되면 교정력도 0이 되기 때문이다.

I항 (적분, Integral): Ki * integral(e(tau) dtau, 0, t)
과거 오차의 누적. 시간이 지나도 오차가 해소되지 않으면 적분값이 계속 커져서 교정력이 증가한다. 정상 상태 오차를 제거하는 역할을 한다. 하지만 위험이 있다. 오차가 오랫동안 한 방향으로 쌓이면 적분값이 과도하게 커지는 **적분 와인드업**이 발생한다. 상황이 역전된 후에도 거대한 적분값이 과잉 교정을 유발한다.

D항 (미분, Derivative): Kd * de(t)/dt
오차의 변화율. 오차가 빠르게 줄어들고 있으면 교정력을 줄여서 오버슈트(overshoot)를 방지한다. 반대로 오차가 빠르게 커지면 교정력을 추가한다. 미래를 "예측"하는 역할이라 할 수 있다. 그러나 D항은 잡음에 매우 민감하다. 고주파 잡음이 미분에 의해 증폭되기 때문이다. 실무에서는 저역 통과 필터를 D항 앞에 추가하는 경우가 많다.

## 사이버네틱스: 피드백의 철학

PID 제어는 더 넓은 지적 운동의 일부였다. Norbert Wiener(1894-1964)는 1948년 저서 *Cybernetics: Or Control and Communication in the Animal and the Machine*에서 **피드백** 개념을 기계, 생물, 사회 시스템을 관통하는 보편 원리로 제시했다.

Wiener의 핵심 통찰은 다음과 같다. 생물의 항상성(homeostasis)이든, 기계의 온도 조절기든, 사회의 시장 가격 조정이든, 모두 같은 구조를 공유한다. "출력을 측정하고, 목표와 비교하고, 차이를 줄이는 방향으로 입력을 조정한다." 이 피드백 루프의 관점에서 보면, 지능이란 목표 상태를 유지하기 위한 적응적 제어 시스템이다.

사이버네틱스는 AI의 두 번째 기원이라 할 수 있다. 첫 번째 기원이 Turing(1936, 1950)의 계산 이론과 기호적 추론이라면, 사이버네틱스는 감각-운동 피드백과 적응 시스템의 관점에서 지능에 접근했다. McCulloch와 Pitts(1943)의 신경망 모델도, Rosenblatt(1958)의 퍼셉트론도 이 사이버네틱스 운동의 영향 아래에 있었다. 1956년 다트머스 회의에서 "인공지능"이라는 이름이 채택되기 전까지, 이 분야는 사이버네틱스라 불렸다.

## PID에서 현대 AI 최적화로: 구조적 대응

PID 제어와 신경망 최적화 사이에는 흥미로운 구조적 대응이 존재한다. 이것은 직접적 영감이라기보다 동일한 수학적 구조가 다른 맥락에서 재발견된 것에 가깝다.

- P항 (현재 오차에 비례한 교정) --> SGD의 학습률 * 그래디언트: 현재 손실 함수의 기울기(오차에 대한 파라미터의 민감도)에 비례하여 가중치를 조정한다. 학습률 eta가 Kp에 대응한다.
- I항 (과거 오차의 누적) --> SGD 모멘텀: Polyak(1964)의 모멘텀은 과거 그래디언트의 지수 이동 평균을 누적한다. v(t) = beta * v(t-1) + gradient(t)에서 v(t)는 과거 그래디언트의 누적으로, 일관된 방향의 오차가 쌓이면 가속하는 I항과 유사한 역할을 한다.
- D항 (오차 변화율에 의한 감쇠) --> 그래디언트 변화 감쇠: Adam 옵티마이저(Kingma & Ba, 2015)의 2차 모멘트 추정 v_hat이 그래디언트 크기의 변동을 추적하여 학습률을 적응적으로 조정하는 것은 D항의 안정화 역할과 구조적으로 유사하다.
- 적분 와인드업 --> 그래디언트 폭발: 오차 누적이 과도해지는 현상은 순환 신경망(RNN)에서 그래디언트가 시간 역전파(BPTT)를 통해 폭발적으로 커지는 것과 유사하다. 그래디언트 클리핑(gradient clipping)이 anti-windup 기법에 대응한다.

그러나 이 대응에는 중요한 한계가 있다. PID는 단일 오차 신호를 단일 제어 출력에 매핑하는 SISO(단일 입력-단일 출력) 시스템이다. 신경망의 역전파는 수백만 개의 파라미터를 동시에 갱신하는 고차원 최적화이다. PID의 직관이 통찰을 주지만, 수학적으로 동일한 것은 아니다.

## RLHF: AI 정렬의 피드백 루프

피드백의 원리는 대규모 언어 모델(LLM)의 정렬에서 가장 현대적인 형태로 나타난다. **RLHF**(Reinforcement Learning from Human Feedback)는 인간 평가자가 모델 출력을 비교 평가하고, 그 피드백이 보상 모델을 거쳐 언어 모델의 행동을 교정하는 구조다.

이것은 정확히 PID의 피드백 루프와 같은 구조다. 목표 상태(유용하고 안전한 응답)와 현재 출력(모델의 생성)의 차이(인간 선호도 평가)를 측정하고, 그 차이를 줄이는 방향으로 모델을 조정한다. Wiener가 말한 "출력을 측정하고, 목표와 비교하고, 차이를 줄이는 방향으로 입력을 조정한다"는 원리가 70년 후에 AI 정렬이라는 전혀 다른 맥락에서 반복되고 있다.

다만, RLHF의 "오차 신호"는 PID의 수치적 오차와 달리 **인간 선호도**라는 주관적이고 비정량적인 신호다. 보상 모델이 이 신호를 수치화하지만, 보상 모델 자체의 오류(reward model misalignment)가 새로운 문제를 낳는다.

## 한계와 약점

PID 제어와 AI 최적화의 대응 관계에는 본질적 한계가 있다.

- SISO vs 고차원: PID는 본질적으로 단일 변수 제어기다. 수백만 파라미터의 동시 최적화와는 차원이 다른 문제다. MIMO(다중 입력-다중 출력) 제어 이론이 존재하지만, 신경망의 파라미터 공간과는 여전히 다른 구조다.
- 선형 가정: PID의 이론적 분석은 선형 시스템을 전제한다. 신경망의 손실 함수 풍경은 극도로 비선형이며, 안장점(saddle points)과 다수의 지역 최솟값이 존재한다. PID의 안정성 분석이 직접 적용되지 않는다.
- 목적 함수의 부재: PID 제어는 명시적인 목적 함수를 최적화하지 않는다. 오차를 0으로 만드는 것이 목표이지, 어떤 비용 함수를 최소화하는 것이 아니다. 역전파는 명시적 손실 함수의 그래디언트를 따르며, 이것은 PID와 근본적으로 다른 수학적 프레임워크다.
- 튜닝 문제의 유사성과 차이: PID의 Kp, Ki, Kd 튜닝은 하이퍼파라미터 튜닝과 유사하지만, PID는 3개 파라미터인 반면 현대 신경망 옵티마이저는 학습률, 모멘텀, 가중치 감쇠, 스케줄러 등 복합적 하이퍼파라미터를 가진다.
- 사이버네틱스에서 AI로의 단절: Wiener의 사이버네틱스와 McCarthy-Minsky의 인공지능은 1960년대에 지적으로 분리되었다. AI는 기호 추론과 탐색으로, 제어 이론은 최적 제어와 견실 제어(robust control)로 각각 발전했다. 최근 RL과 로보틱스에서 두 전통이 재합류하고 있지만, 그 사이 수십 년의 독립적 발전이 있었다는 점을 간과해서는 안 된다.

## 용어 정리

피드백(feedback) - 시스템의 출력을 입력에 되돌려 행동을 교정하는 메커니즘

오차 신호(error signal) - 목표값과 현재 출력의 차이, PID에서는 e(t) = r(t) - y(t)

정상 상태 오차(steady-state error) - 시스템이 안정된 후에도 남아 있는 목표값과 출력 사이의 지속적 차이

적분 와인드업(integral windup) - 오차가 한 방향으로 장시간 누적되어 적분항이 과도하게 커지는 현상

오버슈트(overshoot) - 교정이 과도하여 목표값을 넘어서는 현상

사이버네틱스(cybernetics) - Wiener(1948)가 제창한, 기계와 생물을 관통하는 제어와 통신의 통합 이론

경사하강법(gradient descent) - 손실 함수의 그래디언트 방향으로 파라미터를 반복 갱신하는 최적화 알고리즘

모멘텀(momentum) - 과거 그래디언트의 이동 평균을 누적하여 최적화 방향을 안정화하는 기법, Polyak(1964)

그래디언트 클리핑(gradient clipping) - 그래디언트의 크기가 임계값을 초과하면 잘라내어 폭발을 방지하는 기법

RLHF(Reinforcement Learning from Human Feedback) - 인간의 선호도 피드백으로 보상 모델을 학습하고, 이를 이용해 AI 모델을 정렬하는 방법

---EN---
PID Control and Feedback Systems - The archetype of error-sensing feedback control that forms the intellectual roots of AI optimization and cybernetics

## The Problem of Steering a Ship Straight

In 1922, Russian-born American engineer Nicolas Minorsky (1885-1970) was studying automatic steering systems for naval ships. Observing how experienced helmsmen steered, he identified three behavioral patterns.

First, helmsmen turned the rudder in proportion to the current heading error. Large deviation meant large correction; small deviation, small correction. Second, when errors persisted, they turned the rudder progressively harder -- to compensate for subtle, accumulating drift from wind or current. Third, when errors were rapidly decreasing, they eased the rudder -- preventing overcorrection that would swing the ship to the opposite side.

Minorsky formalized these three behaviors mathematically. This was the birth of the **PID controller**. Ziegler and Nichols (1942) later introduced a systematic method for tuning PID parameters (Ziegler-Nichols tuning), establishing PID as the standard for industrial control. Even today, an estimated 90% or more of industrial control loops use PID or its variants.

## The Mathematical Structure of PID Control

The PID controller output is the sum of three terms:

u(t) = Kp * e(t) + Ki * integral(e(tau) dtau, 0, t) + Kd * de(t)/dt

Here, e(t) = r(t) - y(t), the **error signal** -- the difference between target value r(t) and current output y(t).

**P-term (Proportional)**: Kp * e(t)
Correction proportional to current error. Large Kp gives fast response but may cause oscillation. Small Kp is slower but more stable. The P-term alone cannot fully eliminate steady-state error -- when error reaches zero, corrective force also vanishes.

**I-term (Integral)**: Ki * integral(e(tau) dtau, 0, t)
Accumulation of past errors. When error persists over time, the integral grows, increasing corrective force. This eliminates steady-state error. But there is a risk: when errors accumulate in one direction for too long, the integral becomes excessively large -- **integral windup**. Even after the situation reverses, the massive integral value causes overcorrection.

**D-term (Derivative)**: Kd * de(t)/dt
Rate of error change. When error is decreasing rapidly, it reduces corrective force to prevent overshoot. Conversely, rapidly increasing error triggers additional correction. It effectively "anticipates" the future. However, the D-term is highly sensitive to noise -- high-frequency noise gets amplified through differentiation. In practice, a low-pass filter is often added before the D-term.

## Cybernetics: The Philosophy of Feedback

PID control was part of a broader intellectual movement. Norbert Wiener (1894-1964), in his 1948 book *Cybernetics: Or Control and Communication in the Animal and the Machine*, presented **feedback** as a universal principle spanning mechanical, biological, and social systems.

Wiener's core insight: whether biological homeostasis, a mechanical thermostat, or market price adjustment in society, all share the same structure. "Measure the output, compare it with the target, and adjust the input to reduce the difference." From this feedback loop perspective, intelligence is an adaptive control system for maintaining a target state.

Cybernetics can be called AI's second origin. If the first origin was Turing's (1936, 1950) computation theory and symbolic reasoning, cybernetics approached intelligence from the perspective of sensorimotor feedback and adaptive systems. McCulloch and Pitts' (1943) neural network model and Rosenblatt's (1958) perceptron were both under the influence of this cybernetics movement. Before the name "artificial intelligence" was adopted at the 1956 Dartmouth conference, the field was called cybernetics.

## From PID to Modern AI Optimization: Structural Correspondences

Interesting structural correspondences exist between PID control and neural network optimization. These are less direct inspiration and more the same mathematical structures rediscovered in different contexts.

- P-term (correction proportional to current error) --> **SGD's learning rate * gradient**: Weights are adjusted proportionally to the current loss function's gradient (sensitivity of parameters to error). Learning rate eta corresponds to Kp.
- I-term (accumulation of past errors) --> **SGD momentum**: Polyak's (1964) momentum accumulates an exponential moving average of past gradients. In v(t) = beta * v(t-1) + gradient(t), v(t) is a cumulative sum of past gradients, playing a role similar to the I-term -- accelerating when errors consistently point in the same direction.
- D-term (damping from error rate of change) --> **Gradient change dampening**: Adam optimizer's (Kingma & Ba, 2015) second moment estimate v_hat tracks gradient magnitude fluctuations and adaptively adjusts the learning rate, structurally resembling the D-term's stabilizing role.
- Integral windup --> **Gradient explosion**: Excessive error accumulation parallels gradients exploding through backpropagation through time (BPTT) in recurrent neural networks (RNNs). Gradient clipping corresponds to anti-windup techniques.

However, this correspondence has important limitations. PID is inherently a SISO (single-input, single-output) controller. Neural network backpropagation simultaneously updates millions of parameters in high-dimensional optimization. PID intuition provides insight, but the mathematics are not identical.

## RLHF: The Feedback Loop of AI Alignment

The feedback principle appears in its most modern form in large language model (LLM) alignment. **RLHF** (Reinforcement Learning from Human Feedback) is a structure where human evaluators comparatively rate model outputs, and that feedback, channeled through a reward model, corrects the language model's behavior.

This is exactly the same structure as PID's feedback loop. The difference (human preference evaluation) between the target state (helpful and safe responses) and the current output (model's generation) is measured, and the model is adjusted to reduce that difference. Wiener's principle -- "measure the output, compare it with the target, adjust the input to reduce the difference" -- repeats 70 years later in the entirely different context of AI alignment.

However, RLHF's "error signal" is unlike PID's numerical error -- it is a subjective, non-quantitative signal of human preference. The reward model numerates this signal, but reward model misalignment creates a new class of problems.

## Limitations and Weaknesses

The correspondence between PID control and AI optimization has inherent limitations.

- SISO vs. high-dimensional: PID is inherently a single-variable controller. Simultaneous optimization of millions of parameters is a fundamentally different class of problem. MIMO (multiple-input, multiple-output) control theory exists but still differs structurally from neural network parameter spaces.
- Linearity assumption: PID theoretical analysis assumes linear systems. Neural network loss landscapes are extremely nonlinear, featuring saddle points and numerous local minima. PID stability analysis does not directly apply.
- Absence of an objective function: PID control does not optimize an explicit objective function. The goal is driving error to zero, not minimizing a cost function. Backpropagation follows the gradient of an explicit loss function -- a fundamentally different mathematical framework from PID.
- Similarity and difference in tuning: PID tuning of Kp, Ki, Kd resembles hyperparameter tuning, but PID has 3 parameters while modern neural network optimizers have complex hyperparameters including learning rate, momentum, weight decay, and schedulers.
- The cybernetics-AI disconnect: Wiener's cybernetics and McCarthy-Minsky's artificial intelligence intellectually separated in the 1960s. AI developed toward symbolic reasoning and search, while control theory moved toward optimal and robust control. Recently, RL and robotics have seen these two traditions reconverge, but decades of independent development in between should not be overlooked.

## Glossary

Feedback - a mechanism that returns a system's output to its input to correct behavior

Error signal - the difference between target value and current output; in PID, e(t) = r(t) - y(t)

Steady-state error - the persistent difference between target and output that remains even after the system has stabilized

Integral windup - the phenomenon where the integral term becomes excessively large due to prolonged one-directional error accumulation

Overshoot - the phenomenon where correction overshoots the target value

Cybernetics - the unified theory of control and communication across machines and organisms, proposed by Wiener (1948)

Gradient descent - an optimization algorithm that repeatedly updates parameters in the direction of the loss function's gradient

Momentum - a technique that stabilizes the optimization direction by accumulating an exponential moving average of past gradients, Polyak (1964)

Gradient clipping - a technique that clips gradient magnitudes when they exceed a threshold to prevent explosion

RLHF (Reinforcement Learning from Human Feedback) - a method of aligning AI models by learning a reward model from human preference feedback
