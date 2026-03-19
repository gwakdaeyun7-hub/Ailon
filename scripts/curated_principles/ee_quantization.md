---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 양자화, 신호 양자화, 가중치 압축, INT8, 양자화 인식 학습, 디더링, 확률적 반올림
keywords_en: quantization, signal quantization, weight compression, INT8, quantization-aware training, dithering, stochastic rounding
---
Signal Quantization - 연속 값을 유한 이산 수준으로 근사하는 과정과 그 오차 이론이 신경망 가중치 압축의 직접적 토대가 된 원리

## 아날로그에서 디지털로: 양자화의 본질

자연의 신호는 연속적이다. 마이크가 포착한 음압, 온도 센서가 측정한 전압은 무한히 세밀한 값을 가진다. 그러나 디지털 시스템은 유한한 비트로 표현해야 한다. 8비트라면 256단계, 16비트라면 65,536단계. 연속 실수를 이 유한한 단계 중 가장 가까운 값으로 **스냅**하는 과정이 양자화(quantization)다.

이를 공간적으로 상상하면 이렇다. 연속적인 값이 매끄러운 경사면이라면, 양자화된 값은 일정 높이 간격으로 깎아놓은 계단이다. 계단이 촘촘할수록(비트 수가 많을수록) 원래 경사면에 가깝고, 성글수록 원래 형태를 잃는다.

가장 단순한 균일 양자화의 공식은 다음과 같다.

Q(x) = round(x / s) * s

s는 양자화 간격(step size)이다. 원래 값 x를 s로 나누고, 가장 가까운 정수로 반올림한 뒤, 다시 s를 곱한다. s가 0.1이면 0.37은 0.4가 되고, s가 1이면 0.37은 0이 된다.

## 양자화 오차의 수학

양자화는 필연적으로 오차를 만든다. 균일 양자화에서 오차 e = x - Q(x)는 [-s/2, +s/2] 구간에서 균일 분포를 따르며, 분산은 다음과 같다.

sigma_e^2 = s^2 / 12

s = (x_max - x_min) / (2^N - 1)이고, N은 비트 수다. 비트를 1개 추가할 때마다 양자화 간격이 절반으로 줄고, 오차 분산은 1/4로 떨어진다. 신호 대 양자화 잡음비(SQNR)로 표현하면

SQNR = 6.02 * N + 1.76 (dB)

비트 하나당 약 6dB의 개선이 있다. 이 관계식은 나중에 신경망 가중치를 몇 비트로 줄일 수 있는지를 판단하는 이론적 출발점이 된다.

## 전기공학에서 신경망으로

신호 양자화 이론이 신경망에 직접 도입된 경로는 명확하다. 신경망 가중치도 결국 실수 값의 집합이고, 이 값을 적은 비트로 표현하면 모델이 작아지고 빨라진다. 핵심 대응 관계는 다음과 같다.

- 아날로그 신호 값 --> **신경망 가중치/활성화 값** (둘 다 연속 실수)
- 양자화 간격 s --> **스케일 팩터** (실수와 정수 사이 변환 비율)
- 양자화 오차 --> **정확도 하락** (비트를 줄일수록 모델 성능 저하)
- SQNR --> **양자화된 모델의 성능 저하 정도**
- Lloyd의 비균일 양자화 --> **분포 인식 양자화** (이상치 처리, 중요 가중치 우대)
- 디더링 --> **확률적 반올림/그래디언트 노이즈**

Jacob et al.(2018)은 TensorFlow Lite에서 INT8 양자화를 체계화했다. FP32 가중치를 INT8로 변환하면 모델 크기가 4배 줄어들고, 정수 연산이 더 빠르므로 추론 속도도 향상된다. 양자화 파라미터를 결정하는 공식은 다음과 같다.

q = round(x / s) + z
x_dequant = (q - z) * s

## 디더링에서 확률적 반올림으로: 노이즈의 역설

1960년대, 오디오 엔지니어들은 낮은 비트 양자화 시 발생하는 왜곡에 직면했다. 역설적 해결책은 양자화 **전에** 미량의 노이즈를 의도적으로 추가하는 것이었다. 양자화 오차가 입력 신호와 상관관계를 잃고 백색 잡음처럼 변하여, 왜곡이 균일한 잡음으로 전환된다. 이것이 디더링(dithering)이다.

이 아이디어는 신경망 양자화에서 **확률적 반올림**(stochastic rounding)으로 부활했다. 일반 반올림은 결정론적이지만, 확률적 반올림은 양자화 값을 확률적으로 선택한다.

Q_stoch(x) = floor(x/s)*s  (확률: 1 - f, 여기서 f = x/s - floor(x/s))
           = ceil(x/s)*s   (확률: f)

이렇게 하면 반올림의 **기댓값**이 원래 값 x와 같아진다. 즉 편향(bias)이 0이다. 그래디언트 업데이트가 양자화 간격보다 작은 경우, 결정론적 반올림은 이 변화를 영원히 무시하지만, 확률적 반올림은 작은 업데이트가 장기적으로 누적될 수 있게 한다.

## 핵심 트레이드오프: 비트 수 대 정확도

양자화의 본질적 딜레마는 **압축률과 정확도 사이의 교환**이다.

- **높은 비트 수**(FP32, FP16): 오차가 작아 정확도 손실이 거의 없지만, 모델이 크고 느리다. 70B 파라미터 모델의 FP32 가중치는 약 280GB다
- **낮은 비트 수**(INT8, INT4): 모델이 작고 빠르지만, 양자화 오차가 누적되어 정확도가 하락한다. 같은 70B 모델을 INT4로 양자화하면 약 35GB로 줄어든다
- **극단적 저비트**(2비트, 1비트): 하드웨어 효율이 극대화되지만, 정확도 하락이 급격해진다

양자화 접근법은 크게 두 갈래다. **학습 후 양자화**(PTQ)는 이미 학습된 모델을 직접 양자화하여 간편하지만, 저비트에서 성능 저하가 크다. **양자화 인식 학습**(QAT)은 학습 과정에 양자화 효과를 시뮬레이션하여, 모델이 양자화 오차에 적응하도록 만든다. 순전파에서는 양자화된 가중치를, 역전파에서는 FP32 그래디언트를 사용하는데, 양자화 함수의 그래디언트가 거의 모든 곳에서 0이므로 이를 항등 함수로 근사하는 **직선 관통 추정기**(STE)라는 우회 전략을 쓴다.

## 현대 AI 기법과의 연결

**신호 처리 양자화 이론의 직접적 계승:**

- **INT8/INT4 모델 양자화**: Jacob et al.(2018)부터 GPTQ(Frantar et al. 2022), AWQ(Lin et al. 2024)에 이르기까지, 가중치를 적은 비트로 표현하는 모든 기법은 Q(x) = round(x/s)*s 공식을 직접 사용한다. GPTQ는 Hessian 정보를 활용한 최적 비트 배정으로, Lloyd의 원리를 현대적으로 확장했다. AWQ는 활성화 크기에 기반하여 중요한 가중치를 식별하고 채널별 스케일을 조정하는 적응적 양자화다
- **디더링에서 확률적 반올림으로**: 오디오 공학의 디더링이 신경망 학습의 확률적 반올림으로 직접 이어졌다. "의도적 노이즈로 체계적 왜곡을 줄인다"는 핵심 원리가 보존되었다
- **Lloyd의 비균일 양자화에서 분포 인식 양자화로**: 밀집 영역에 더 많은 레벨을 배정하는 원리가 GPTQ와 AWQ로 진화했다

**동일한 수학적 구조를 독립적으로 공유하는 구조적 유사성:**

- **드롭아웃과 디더링의 유사성**: 드롭아웃(Srivastava et al. 2014)은 학습 중 뉴런을 무작위로 비활성화하여 과적합을 방지한다. 이는 디더링이 양자화 전에 의도적 노이즈를 추가하여 체계적 왜곡을 줄이는 것과 구조적으로 유사하다. 둘 다 "의도적 무작위성이 체계적 오류를 완화한다"는 원리를 공유하지만, 드롭아웃은 디더링에서 영감을 받은 것이 아니라 앙상블 학습의 근사로 독립적으로 개발되었다
- **혼합 정밀도 훈련과 적응적 양자화**: Micikevicius et al.(2018)의 혼합 정밀도 훈련은 순전파에서 FP16을, 기울기 누적에서 FP32를 사용하여 속도와 정확도를 동시에 추구한다. 이는 비균일 양자화가 밀집 영역에 더 많은 비트를 할당하는 것과 같은 "중요한 곳에 정밀도를 집중한다"는 직관을 공유하지만, 하드웨어 수준의 부동소수점 설계에서 독립적으로 발전한 기법이다
- **지식 증류와 손실 압축**: Hinton et al.(2015)의 지식 증류에서 큰 모델의 출력 분포를 작은 모델이 모방하는 과정은, 고비트 신호를 저비트로 압축하면서 핵심 정보를 보존하려는 양자화의 목표와 구조적으로 닮았다

## 한계와 약점

- **이상치 민감성**: 신경망 가중치/활성화 분포는 종종 긴 꼬리를 가진다. 극단적 이상치가 하나라도 있으면 양자화 범위 전체를 지배하여 나머지 값들의 해상도가 희생된다. LLM에서 특히 심각하여, SmoothQuant(Xiao et al. 2022)처럼 이상치 전용 처리가 필수적이다
- **STE의 이론적 약점**: 양자화 함수의 그래디언트를 1로 근사하는 STE는 수학적 정당화가 약하다. 학습 후반에 진동이 발생할 수 있다
- **태스크 의존적 성능**: 분류는 양자화에 강하지만, 텍스트/이미지 생성처럼 연속 출력의 미세한 차이가 품질을 좌우하는 태스크는 민감하다. SQNR로는 이 차이를 예측할 수 없다
- **하드웨어 의존성**: INT8 연산의 실제 속도 향상은 칩의 정수 연산 유닛 지원에 달려 있다. 최적화되지 않은 하드웨어에서는 이론적 4배 압축이 속도 향상으로 이어지지 않을 수 있다

## 용어 정리

균일 양자화(uniform quantization) - 모든 양자화 간격이 동일한 방식. 구현이 단순하지만 분포가 불균일한 입력에서는 비효율적

비균일 양자화(non-uniform quantization) - 입력 분포에 따라 간격을 달리하는 방식. 밀집 영역에 더 많은 레벨을 배정하여 같은 비트 수로도 오차를 줄임

스케일 팩터(scale factor) - 양자화에서 연속 실수 값과 이산 정수 값 사이의 변환 비율

디더링(dithering) - 양자화 전 미량의 노이즈를 의도적으로 추가하여 체계적 양자화 왜곡을 균일한 백색 잡음으로 전환하는 기법

확률적 반올림(stochastic rounding) - 양자화 값을 확률적으로 선택하여 편향 없는 반올림을 달성하는 기법. 기댓값이 원래 값과 같아 미세한 그래디언트 업데이트를 보존

직선 관통 추정기(Straight-Through Estimator, STE) - 양자화 함수의 역전파에서 그래디언트를 1로 근사하여 통과시키는 우회 기법

학습 후 양자화(Post-Training Quantization, PTQ) - 학습 완료된 모델에 직접 양자화를 적용하는 방식. 간편하지만 저비트에서 성능 저하가 큼

양자화 인식 학습(Quantization-Aware Training, QAT) - 학습 중 양자화 효과를 시뮬레이션하여 모델이 양자화 오차에 적응하도록 만드는 방식
---EN---
Signal Quantization - The process of approximating continuous values to finite discrete levels, whose error theory directly underpins neural network weight compression

## From Analog to Digital: The Essence of Quantization

Natural signals are continuous. Sound pressure from a microphone, voltage from a temperature sensor -- these hold infinitely fine values. But digital systems must represent them with finite bits. 8 bits yields 256 levels; 16 bits yields 65,536. **Snapping** continuous values to the nearest finite level is quantization.

Visualize it spatially: continuous values form a smooth slope; quantized values are a staircase at fixed height intervals. More stairs (more bits) approximate the original slope more closely; fewer stairs lose the original shape.

The simplest uniform quantization formula:

Q(x) = round(x / s) * s

Here s is the step size. The value x is divided by s, rounded to the nearest integer, then multiplied by s. With s = 0.1, 0.37 becomes 0.4; with s = 1, it becomes 0.

## The Mathematics of Quantization Error

Quantization inevitably introduces error. In uniform quantization, error e = x - Q(x) is modeled as uniformly distributed over [-s/2, +s/2], with variance:

sigma_e^2 = s^2 / 12

Here s = (x_max - x_min) / (2^N - 1) where N is bits. Each additional bit halves the step size and quarters error variance. As SQNR:

SQNR = 6.02 * N + 1.76 (dB)

Each bit yields approximately 6 dB improvement. This relationship becomes the theoretical starting point for judging how many bits neural network weights can be reduced to.

## From Electrical Engineering to Neural Networks

The path from signal quantization to neural networks is direct. Neural network weights are real-valued numbers; representing them with fewer bits makes models smaller and faster. The key correspondences:

- Analog signal values --> **neural network weights/activations** (both continuous)
- Step size s --> **scale factor** (real-to-integer conversion ratio)
- Quantization error --> **accuracy degradation**
- SQNR --> **degree of quantized model performance loss**
- Lloyd's non-uniform quantization --> **distribution-aware quantization**
- Dithering --> **stochastic rounding / gradient noise**

Jacob et al. (2018) systematized INT8 quantization in TensorFlow Lite. Converting FP32 to INT8 reduces model size by 4x and improves inference speed. The quantization parameter formulas:

q = round(x / s) + z
x_dequant = (q - z) * s

## From Dithering to Stochastic Rounding: The Noise Paradox

In the 1960s, audio engineers faced quantization distortion at low bit depths. The paradoxical solution: intentionally adding small noise **before** quantization breaks the correlation between error and signal, converting distortion into white noise-like hiss. This is dithering.

This idea was revived as **stochastic rounding** in neural network quantization. Regular rounding is deterministic; stochastic rounding selects values probabilistically:

Q_stoch(x) = floor(x/s)*s  (probability: 1 - f, where f = x/s - floor(x/s))
           = ceil(x/s)*s   (probability: f)

The **expected value** equals the original x -- zero bias. When gradient updates are smaller than the step size, deterministic rounding ignores them forever, but stochastic rounding allows small updates to accumulate over time.

## The Core Tradeoff: Bits vs. Accuracy

The essential dilemma is the **exchange between compression ratio and accuracy**.

- **High bit width** (FP32, FP16): near-zero accuracy loss, but large and slow models. A 70B parameter model in FP32 occupies roughly 280 GB
- **Low bit width** (INT8, INT4): small and fast, but accumulated error degrades accuracy. The same 70B model in INT4 shrinks to roughly 35 GB
- **Extreme low-bit** (2-bit, 1-bit): maximum hardware efficiency but sharp accuracy drops

Two main approaches exist. **Post-Training Quantization (PTQ)** directly quantizes trained models -- convenient but suffers at low bits. **Quantization-Aware Training (QAT)** simulates quantization during training so models adapt to error. Forward passes use quantized weights; backward passes compute FP32 gradients, using the **Straight-Through Estimator (STE)** -- approximating the step function's gradient as 1 to let gradients pass through.

## Connections to Modern AI

**Direct succession of signal processing quantization theory:**

- **INT8/INT4 model quantization**: From Jacob et al. (2018) to GPTQ (Frantar et al. 2022) and AWQ (Lin et al. 2024), all weight compression techniques directly use Q(x) = round(x/s)*s. GPTQ extends Lloyd's principle via Hessian-based optimal bit allocation. AWQ identifies important weights by activation magnitude and adjusts per-channel scales
- **From dithering to stochastic rounding**: Audio engineering's dithering directly carried over. The principle "intentional noise reduces systematic distortion" was preserved
- **From Lloyd's non-uniform quantization to distribution-aware quantization**: The principle of allocating more levels to dense regions evolved into GPTQ and AWQ

**Structural similarities sharing the same mathematical structure independently:**

- **Dropout and dithering**: Dropout (Srivastava et al. 2014) randomly deactivates neurons during training to prevent overfitting. This is structurally similar to dithering adding intentional noise before quantization to reduce systematic distortion. Both share the principle that "intentional randomness mitigates systematic error," but dropout was developed independently as an approximation of ensemble learning, not inspired by dithering
- **Mixed-precision training and adaptive quantization**: Micikevicius et al.'s (2018) mixed-precision training uses FP16 for forward passes and FP32 for gradient accumulation, pursuing both speed and accuracy. This shares the intuition of "concentrating precision where it matters most" with non-uniform quantization's allocation of more bits to dense regions, but evolved independently from hardware-level floating-point design
- **Knowledge distillation and lossy compression**: In Hinton et al.'s (2015) knowledge distillation, a small model mimicking a large model's output distribution structurally resembles quantization's goal of compressing high-bit signals to low-bit while preserving essential information

## Limitations and Weaknesses

- **Outlier sensitivity**: Neural network distributions often have heavy tails. A single extreme outlier dominates the quantization range, sacrificing resolution for all other values. Particularly severe in LLMs, making specialized handling like SmoothQuant (Xiao et al. 2022) essential
- **STE's theoretical weakness**: Approximating quantization gradient as 1 lacks strong mathematical justification. Oscillation can occur in later training
- **Task-dependent performance**: Classification is robust to quantization, but generation tasks where subtle output differences determine quality are far more sensitive. SQNR cannot predict these differences
- **Hardware dependence**: Actual INT8 speedup depends on chip-level integer unit support. Without optimization, theoretical 4x compression may not translate to speed gains

## Glossary

Uniform quantization - a scheme where all step sizes are equal; simple but inefficient for non-uniform distributions

Non-uniform quantization - varying step sizes by distribution, assigning more levels to dense regions to reduce error

Scale factor - the conversion ratio between continuous real values and discrete integer values in quantization

Dithering - intentionally adding small noise before quantization to convert systematic distortion into uniform white noise

Stochastic rounding - probabilistically selecting quantized values for unbiased rounding; expected value equals the original, preserving fine gradient updates

Straight-Through Estimator (STE) - approximating quantization gradient as 1 during backpropagation to bypass the step function's zero gradient

Post-Training Quantization (PTQ) - applying quantization to trained models without additional training; convenient but suffers at low bits

Quantization-Aware Training (QAT) - training that simulates quantization effects so models adapt to error; less degradation than PTQ but incurs training cost
