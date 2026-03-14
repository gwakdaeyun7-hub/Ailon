---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 양자화, 신호 양자화, 가중치 압축, INT8, 양자화 인식 학습, 디더링, 확률적 반올림
keywords_en: quantization, signal quantization, weight compression, INT8, quantization-aware training, dithering, stochastic rounding
---
Signal Quantization - 연속 값을 유한 이산 수준으로 근사하는 과정과 그 오차 이론이 신경망 가중치 압축의 직접적 토대가 된 원리

## 아날로그에서 디지털로: 양자화의 본질

자연의 신호는 연속적이다. 마이크가 포착한 음압, 온도 센서가 측정한 전압은 무한히 세밀한 값을 가진다. 그러나 디지털 시스템에서 이 값을 저장하려면, 유한한 비트 수로 표현해야 한다. 8비트라면 256단계, 16비트라면 65,536단계. 연속적인 값을 이 유한한 단계 중 가장 가까운 값으로 **반올림**하는 것이 양자화(quantization)다.

가장 단순한 균일 양자화(uniform quantization)의 공식은 다음과 같다.

Q(x) = round(x / s) * s

여기서 s는 양자화 간격(step size)이다. 원래 값 x를 s로 나누고, 반올림한 뒤, 다시 s를 곱한다. 결과적으로 모든 값이 s의 정수배로 스냅(snap)된다.

## 양자화 오차의 수학

양자화는 필연적으로 오차를 수반한다. 균일 양자화에서 양자화 오차 e = x - Q(x)는 [-s/2, +s/2] 구간에서 균일 분포를 따른다고 가정할 수 있다(입력이 양자화 간격에 비해 충분히 복잡할 때). 이 오차의 분산은 다음과 같다.

sigma_e^2 = s^2 / 12

여기서 s = (x_max - x_min) / (2^N - 1)이고, N은 비트 수다. 비트를 1개 추가할 때마다 양자화 간격이 절반으로 줄어 오차도 절반이 된다. 이를 신호 대 양자화 잡음비(SQNR)로 표현하면 다음과 같다.

SQNR = 6.02 * N + 1.76 (dB)

비트 하나당 약 6dB의 SQNR 개선이 있다. 이 관계식은 Lloyd(1957/1982)의 최적 양자화 이론과 함께 신호 처리 교과서의 기본이다. Lloyd의 최적 양자화기는 입력 분포가 균일하지 않을 때, 분포가 밀집된 영역에 더 많은 양자화 레벨을 배정하여 전체 오차를 최소화한다. 이 비균일 양자화 아이디어가 후에 AI 양자화에서 중요한 역할을 한다.

## 디더링에서 확률적 반올림으로

1960년대, 오디오 엔지니어들은 낮은 비트 수로 양자화할 때 발생하는 양자화 왜곡(quantization distortion)을 줄이기 위해 **디더링**(dithering)을 도입했다. 양자화 전에 미량의 노이즈를 의도적으로 추가하면, 양자화 오차가 입력 신호와 상관관계를 잃고 백색 잡음처럼 변한다. 왜곡은 균일한 잡음으로 전환되어 청각적으로 훨씬 자연스러워진다.

이 아이디어는 신경망 양자화에서 **확률적 반올림**(stochastic rounding)으로 부활했다. 일반 반올림은 결정론적(deterministic)이지만, 확률적 반올림은 양자화 값을 확률적으로 선택한다.

Q_stoch(x) = floor(x/s)*s  (확률: 1 - (x/s - floor(x/s)))
           = ceil(x/s)*s   (확률: x/s - floor(x/s))

이렇게 하면 반올림의 **기댓값**이 원래 값 x와 같아진다. 즉, 편향(bias)이 없다. 경사하강법의 작은 그래디언트 업데이트가 양자화 간격보다 작아도, 확률적 반올림 덕분에 가중치가 점진적으로 변할 수 있다. 결정론적 반올림이었다면 사라졌을 미세한 업데이트를 보존하는 것이다.

## 신경망 가중치 양자화: 직접적 계승

신경망 모델 압축에서 양자화는 가장 효과적인 기법 중 하나로, 신호 처리의 양자화 이론을 직접 계승한다. FP32(32비트 부동소수점) 가중치를 INT8(8비트 정수)로 변환하면 모델 크기가 4배 줄어들고, 정수 연산은 부동소수점보다 빠르므로 추론 속도도 향상된다.

핵심 대응 관계는 다음과 같다.

- 아날로그 신호 값 --> 신경망 가중치/활성화 값
- 양자화 간격 (s) --> 스케일 팩터 (scale factor)
- 양자화 오차 --> 정확도 하락
- SQNR --> 양자화된 모델의 성능 저하 정도
- Lloyd의 비균일 양자화 --> 분포 인식 양자화 (outlier 처리)
- 디더링 --> 확률적 반올림/그래디언트 노이즈

Jacob et al.(2018)의 연구는 TensorFlow Lite에서 INT8 양자화를 표준화했다. 가중치와 활성화를 모두 8비트로 양자화하여, 모바일 기기에서 실시간 추론을 가능하게 했다. 양자화 파라미터(스케일 s와 제로 포인트 z)를 결정하는 방식이 핵심이다.

q = round(x / s) + z
x_dequant = (q - z) * s

여기서 z는 제로 포인트(zero point)로, 실수 0이 정확히 양자화 값으로 표현되도록 보장한다. ReLU 활성화의 0 경계가 정확히 보존되어야 하기 때문에 중요하다.

## 극단적 양자화: 2비트에서 1비트까지

양자화 연구는 비트 수를 극단까지 줄이는 방향으로 발전했다. Courbariaux et al.(2016)의 BinaryConnect와 XNOR-Net은 가중치를 +1과 -1만으로 표현하는 **이진 신경망**(Binary Neural Network)을 제안했다. 곱셈 연산이 XNOR 비트 연산으로 대체되어 하드웨어 효율이 극대화된다. 물론 정확도 하락이 상당하여, 대형 모델에서는 제한적으로 사용된다.

GPTQ(Frantar et al. 2022)는 LLM에 특화된 양자화 기법이다. 100B+ 파라미터 모델을 3~4비트로 양자화하면서 성능 저하를 최소화한다. 핵심은 Hessian 정보를 활용한 **최적 비트 배정**이다. 각 가중치를 양자화할 때 발생하는 오차를 다른 가중치로 보상하는 전략으로, 이는 Lloyd의 최적 양자화 원리의 현대적 확장이라 할 수 있다.

AWQ(Lin et al. 2024)는 한 단계 더 나아가, 활성화(activation) 크기에 기반하여 중요한 가중치를 식별하고 채널별로 스케일을 조정한다. 모든 가중치가 동등하게 중요하지 않다는 관찰에 기반한 적응적 양자화다.

## 양자화 인식 학습

양자화 접근법은 크게 두 갈래로 나뉜다. **학습 후 양자화**(Post-Training Quantization, PTQ)는 이미 학습된 모델의 가중치를 직접 양자화한다. 추가 학습이 필요 없어 간편하지만, 낮은 비트에서 성능 저하가 크다.

**양자화 인식 학습**(Quantization-Aware Training, QAT)은 학습 과정 자체에 양자화 효과를 시뮬레이션한다. 순전파에서는 양자화된 가중치를 사용하고, 역전파에서는 양자화를 무시하고 FP32 그래디언트를 계산한다. 이를 **직선 관통 추정기**(Straight-Through Estimator, STE)라 부른다. 양자화 함수는 계단 함수여서 거의 모든 곳에서 그래디언트가 0이기 때문에, 양자화를 항등 함수로 근사하여 그래디언트를 통과시키는 것이다.

QAT는 학습 중에 모델이 양자화 오차에 적응하도록 만들어, PTQ보다 훨씬 작은 성능 저하를 달성한다. 이 접근은 신호 처리에서의 양자화 보상(quantization compensation) 기법과 개념적으로 유사하다.

## 한계와 약점

신경망 양자화에는 신호 양자화 이론이 예측하지 못하는 고유한 도전이 있다.

- **이상치(outlier) 민감성**: 신경망 가중치/활성화의 분포는 종종 긴 꼬리(heavy tail)를 가진다. 극단적 이상치가 하나라도 있으면 양자화 범위를 지배하여, 나머지 값들의 해상도가 희생된다. LLM에서 특히 심각하여, 이상치 전용 처리(예: SmoothQuant의 활성화 스케일링)가 필수적이다.
- **레이어 간 불균등한 민감도**: 모든 레이어가 양자화에 동일하게 민감하지 않다. 첫 번째 레이어와 마지막 레이어는 중간 레이어보다 양자화 오차에 더 취약한 경우가 많다. 혼합 정밀도(mixed precision) 양자화가 이를 해결하지만, 최적 비트 배정 자체가 NP-hard에 가까운 탐색 문제다.
- **태스크 의존적 성능**: 분류처럼 출력이 이산적인 태스크는 양자화에 강하지만, 생성 태스크(텍스트, 이미지 생성)는 연속적 출력의 미세한 차이가 품질에 큰 영향을 미쳐 양자화에 더 민감하다.
- **STE의 이론적 약점**: 양자화 함수의 그래디언트를 1로 근사하는 STE는 수학적으로 정당화가 약하다. 학습 후반에 가중치 변화가 양자화 경계를 넘나들 때 진동이 발생할 수 있다.
- **하드웨어 의존성**: INT8 연산의 실제 속도 향상은 하드웨어 지원에 의존한다. 양자화 연산에 최적화되지 않은 하드웨어에서는 이론적 속도 향상이 실현되지 않을 수 있다.

## 용어 정리

균일 양자화(uniform quantization) - 모든 양자화 간격이 동일한 양자화 방식

비균일 양자화(non-uniform quantization) - 입력 분포에 따라 양자화 간격을 달리하여 오차를 최소화하는 방식

스케일 팩터(scale factor) - 양자화에서 실수 값과 정수 값 사이의 변환 비율

제로 포인트(zero point) - 실수 0에 대응하는 양자화된 정수 값, 비대칭 양자화에서 사용

디더링(dithering) - 양자화 전 미량의 노이즈를 의도적으로 추가하여 양자화 왜곡을 백색 잡음으로 전환하는 기법

확률적 반올림(stochastic rounding) - 양자화 값을 확률적으로 선택하여 편향 없는 반올림을 달성하는 기법

직선 관통 추정기(Straight-Through Estimator, STE) - 양자화 함수의 역전파에서 그래디언트를 1로 근사하여 통과시키는 기법

혼합 정밀도(mixed precision) - 레이어마다 다른 비트 수를 적용하여 성능과 효율의 균형을 맞추는 전략

학습 후 양자화(Post-Training Quantization, PTQ) - 학습 완료된 모델에 추가 학습 없이 직접 양자화를 적용하는 방식

양자화 인식 학습(Quantization-Aware Training, QAT) - 학습 중 양자화 효과를 시뮬레이션하여 모델이 양자화 오차에 적응하도록 만드는 방식

---EN---
Signal Quantization - The process of approximating continuous values to finite discrete levels, whose error theory directly underpins neural network weight compression

## From Analog to Digital: The Essence of Quantization

Natural signals are continuous. Sound pressure captured by a microphone, voltage measured by a temperature sensor -- these hold infinitely fine values. But to store them in a digital system, they must be represented with a finite number of bits. 8 bits yields 256 levels; 16 bits yields 65,536 levels. **Rounding** continuous values to the nearest among these finite levels is quantization.

The simplest uniform quantization formula is:

Q(x) = round(x / s) * s

Here s is the quantization step size. The original value x is divided by s, rounded, then multiplied by s again. Effectively, all values snap to integer multiples of s.

## The Mathematics of Quantization Error

Quantization inevitably introduces error. In uniform quantization, the quantization error e = x - Q(x) can be modeled as uniformly distributed over [-s/2, +s/2] (when the input is sufficiently complex relative to the step size). The variance of this error is:

sigma_e^2 = s^2 / 12

Here s = (x_max - x_min) / (2^N - 1) where N is the number of bits. Each additional bit halves the step size and halves the error. Expressed as Signal-to-Quantization-Noise Ratio (SQNR):

SQNR = 6.02 * N + 1.76 (dB)

Each bit yields approximately 6 dB of SQNR improvement. This relationship, along with Lloyd's (1957/1982) optimal quantization theory, forms a textbook fundamental of signal processing. Lloyd's optimal quantizer, when the input distribution is non-uniform, assigns more quantization levels to densely populated regions to minimize total error. This non-uniform quantization idea later plays a crucial role in AI quantization.

## From Dithering to Stochastic Rounding

In the 1960s, audio engineers introduced **dithering** to reduce quantization distortion at low bit depths. By intentionally adding a small amount of noise before quantization, the quantization error loses its correlation with the input signal and becomes white noise-like. Distortion converts to uniform noise, which sounds far more natural.

This idea was revived in neural network quantization as **stochastic rounding**. Regular rounding is deterministic, but stochastic rounding selects quantized values probabilistically:

Q_stoch(x) = floor(x/s)*s  (probability: 1 - (x/s - floor(x/s)))
           = ceil(x/s)*s   (probability: x/s - floor(x/s))

This makes the **expected value** of rounding equal to the original value x -- zero bias. Even when gradient descent updates are smaller than the quantization step, stochastic rounding allows weights to change gradually. It preserves fine updates that deterministic rounding would eliminate.

## Neural Network Weight Quantization: Direct Succession

Quantization is one of the most effective techniques in neural network model compression, directly inheriting signal processing quantization theory. Converting FP32 (32-bit floating point) weights to INT8 (8-bit integer) reduces model size by 4x, and integer arithmetic being faster than floating point also improves inference speed.

The key correspondences are:

- Analog signal values --> neural network weights/activations
- Quantization step size (s) --> scale factor
- Quantization error --> accuracy degradation
- SQNR --> degree of quantized model performance loss
- Lloyd's non-uniform quantization --> distribution-aware quantization (outlier handling)
- Dithering --> stochastic rounding / gradient noise

Jacob et al.'s (2018) work standardized INT8 quantization in TensorFlow Lite. Quantizing both weights and activations to 8 bits enabled real-time inference on mobile devices. The method for determining quantization parameters (scale s and zero point z) is key:

q = round(x / s) + z
x_dequant = (q - z) * s

Here z is the zero point, ensuring that real-valued 0 maps exactly to a quantized value. This is important because the 0 boundary of ReLU activations must be precisely preserved.

## Extreme Quantization: From 2 Bits to 1 Bit

Quantization research has pushed toward extreme bit reduction. Courbariaux et al.'s (2016) BinaryConnect and XNOR-Net proposed **binary neural networks** representing weights with only +1 and -1. Multiplication operations are replaced by XNOR bit operations, maximizing hardware efficiency. The accuracy degradation is substantial, however, limiting use in large models.

GPTQ (Frantar et al. 2022) is a quantization technique specialized for LLMs. It quantizes 100B+ parameter models to 3-4 bits while minimizing performance loss. The key is **optimal bit allocation** using Hessian information. The strategy compensates quantization error in one weight by adjusting others -- a modern extension of Lloyd's optimal quantization principle.

AWQ (Lin et al. 2024) goes further, identifying important weights based on activation magnitudes and adjusting per-channel scales. This is adaptive quantization based on the observation that not all weights are equally important.

## Quantization-Aware Training

Quantization approaches divide into two main branches. **Post-Training Quantization (PTQ)** directly quantizes already-trained model weights. It requires no additional training, making it convenient, but suffers greater performance loss at low bit widths.

**Quantization-Aware Training (QAT)** simulates quantization effects during the training process itself. Forward passes use quantized weights; backward passes ignore quantization and compute FP32 gradients. This is called the **Straight-Through Estimator (STE)**. Since the quantization function is a step function with zero gradient almost everywhere, quantization is approximated as the identity function to pass gradients through.

QAT enables the model to adapt to quantization error during training, achieving far less performance degradation than PTQ. This approach is conceptually similar to quantization compensation techniques in signal processing.

## Limitations and Weaknesses

Neural network quantization faces unique challenges that signal quantization theory does not predict.

- **Outlier sensitivity**: Neural network weight/activation distributions often have heavy tails. Even a single extreme outlier can dominate the quantization range, sacrificing resolution for all remaining values. This is particularly severe in LLMs, making outlier-specific handling (e.g., SmoothQuant's activation scaling) essential.
- **Unequal sensitivity across layers**: Not all layers are equally sensitive to quantization. First and last layers are often more vulnerable to quantization error than middle layers. Mixed-precision quantization addresses this, but the optimal bit allocation itself is a search problem approaching NP-hard.
- **Task-dependent performance**: Tasks with discrete outputs like classification are robust to quantization, but generation tasks (text, image generation) are more sensitive because subtle differences in continuous outputs significantly affect quality.
- **Theoretical weakness of STE**: Approximating the quantization function's gradient as 1 lacks strong mathematical justification. Oscillation can occur in later training when weight changes straddle quantization boundaries.
- **Hardware dependence**: The actual speedup from INT8 operations depends on hardware support. On hardware not optimized for quantized operations, theoretical speed gains may not materialize.

## Glossary

Uniform quantization - a quantization scheme where all step sizes are equal

Non-uniform quantization - a scheme that varies step sizes according to input distribution to minimize total error

Scale factor - the conversion ratio between real values and integer values in quantization

Zero point - the quantized integer value corresponding to real-valued 0, used in asymmetric quantization

Dithering - a technique that intentionally adds small noise before quantization to convert quantization distortion into white noise

Stochastic rounding - a technique that probabilistically selects quantized values to achieve unbiased rounding

Straight-Through Estimator (STE) - a technique that approximates the quantization function's gradient as 1 during backpropagation

Mixed precision - a strategy applying different bit widths per layer to balance performance and efficiency

Post-Training Quantization (PTQ) - applying quantization directly to an already-trained model without additional training

Quantization-Aware Training (QAT) - training that simulates quantization effects so the model adapts to quantization error
