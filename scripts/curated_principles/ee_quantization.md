---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 양자화, 신호 양자화, 가중치 압축, INT8, 양자화 인식 학습, 디더링, 확률적 반올림
keywords_en: quantization, signal quantization, weight compression, INT8, quantization-aware training, dithering, stochastic rounding
---
Signal Quantization - 연속 값을 유한 이산 수준으로 근사하는 과정과 그 오차 이론이 신경망 가중치 압축의 직접적 토대가 된 원리

## 아날로그에서 디지털로: 양자화의 본질

자연의 신호는 연속적이다. 마이크가 포착한 음압, 온도 센서가 측정한 전압은 무한히 세밀한 값을 가진다. 그러나 디지털 시스템은 이 값을 유한한 비트로 표현해야 한다. 8비트라면 256단계, 16비트라면 65,536단계. 연속적인 실수를 이 유한한 단계 중 가장 가까운 값으로 **스냅**(snap)하는 과정이 양자화(quantization)다.

이를 공간적으로 상상하면 이렇다. 연속적인 값이 매끄러운 경사면이라면, 양자화된 값은 일정 높이 간격으로 깎아놓은 계단이다. 경사면 위의 어떤 점이든 가장 가까운 계단 면으로 밀려난다. 계단이 촘촘할수록(비트 수가 많을수록) 원래 경사면에 가깝고, 성글수록 원래 형태를 잃는다.

가장 단순한 균일 양자화(uniform quantization)의 공식은 다음과 같다.

Q(x) = round(x / s) * s

여기서 s는 양자화 간격(step size)이다. 원래 값 x를 s로 나누고, 가장 가까운 정수로 반올림한 뒤, 다시 s를 곱한다. 결과적으로 모든 값이 s의 정수배로 스냅된다. s가 0.1이면 0.37은 0.4가 되고, s가 1이면 0.37은 0이 된다.

## 양자화 오차의 수학

양자화는 필연적으로 오차를 만든다. 균일 양자화에서 양자화 오차 e = x - Q(x)는 [-s/2, +s/2] 구간에서 균일 분포를 따른다고 모델링할 수 있다(입력이 양자화 간격에 비해 충분히 복잡할 때). 이 오차의 분산은 다음과 같다.

sigma_e^2 = s^2 / 12

여기서 s = (x_max - x_min) / (2^N - 1)이고, N은 비트 수다. 비트를 1개 추가할 때마다 양자화 간격이 절반으로 줄고, 오차 분산은 1/4로 떨어진다. 이를 신호 대 양자화 잡음비(Signal-to-Quantization-Noise Ratio, SQNR)로 표현하면

SQNR = 6.02 * N + 1.76 (dB)

비트 하나당 약 6dB의 SQNR 개선이 있다. 8비트에서 16비트로 올리면 약 48dB가 더해지고, 반대로 32비트에서 8비트로 내리면 약 144dB가 사라진다. 이 관계식은 전기공학 교과서의 기본이며, 나중에 신경망 가중치를 몇 비트로 줄일 수 있는지를 판단하는 이론적 출발점이 된다.

한편 Lloyd(1957/1982)는 입력 분포가 균일하지 않을 때의 최적 양자화를 연구했다. 핵심 아이디어는 단순하다. 값이 밀집된 영역에 양자화 레벨을 더 많이 배정하고, 드문 영역에는 적게 배정하면 같은 비트 수로도 전체 오차를 줄일 수 있다. 인구 밀도가 높은 도심에 우체국을 촘촘히 배치하고, 인구가 적은 외곽에는 듬성듬성 배치하는 것과 같다. 이 비균일 양자화(non-uniform quantization)의 원리가 후에 AI 양자화에서 핵심 역할을 한다.

## 전기공학에서 신경망으로

신호 양자화 이론이 신경망에 직접 도입된 경로는 명확하다. 신경망 가중치도 결국 실수 값의 집합이고, 이 값을 적은 비트로 표현하면 모델이 작아지고 빨라진다는 착안이 출발점이다. 핵심 대응 관계는 다음과 같다.

- 아날로그 신호 값 --> **신경망 가중치/활성화 값** (둘 다 연속 실수)
- 양자화 간격 s --> **스케일 팩터**(scale factor) (실수와 정수 사이 변환 비율)
- 양자화 오차 --> **정확도 하락** (비트를 줄일수록 모델 성능 저하)
- SQNR --> **양자화된 모델의 성능 저하 정도** (비트당 손실의 정량 지표)
- Lloyd의 비균일 양자화 --> **분포 인식 양자화** (이상치 처리, 중요 가중치 우대)
- 디더링 --> **확률적 반올림/그래디언트 노이즈**

Jacob et al.(2018)은 TensorFlow Lite에서 INT8 양자화를 체계화했다. FP32(32비트 부동소수점) 가중치를 INT8(8비트 정수)로 변환하면 모델 크기가 4배 줄어들고, 정수 연산이 부동소수점보다 빠르므로 추론 속도도 향상된다. 이 연구가 모바일 기기에서의 실시간 추론을 현실화한 기점이다. 양자화 파라미터(스케일 s와 제로 포인트 z)를 결정하는 공식은 다음과 같다.

q = round(x / s) + z
x_dequant = (q - z) * s

여기서 z는 제로 포인트(zero point)로, 실수 0이 정확히 양자화 값으로 표현되도록 보장한다. 신경망에서 ReLU 활성화의 0 경계가 정확히 보존되어야 하기 때문에 중요하다. z = 0이면 대칭 양자화(symmetric quantization), z != 0이면 비대칭 양자화(asymmetric quantization)가 된다.

## 디더링에서 확률적 반올림으로: 노이즈의 역설

1960년대, 오디오 엔지니어들은 낮은 비트로 양자화할 때 발생하는 양자화 왜곡(quantization distortion)에 직면했다. 조용한 구간에서 계단 모양의 파형이 뚜렷하게 들리는 현상이다. 해결책은 역설적이었다. 양자화 **전에** 미량의 노이즈를 의도적으로 추가하면, 양자화 오차가 입력 신호와 상관관계를 잃고 백색 잡음처럼 변한다. 왜곡이 균일한 잡음으로 전환되어 청각적으로 훨씬 자연스러워진다. 이것이 디더링(dithering)이다. "노이즈를 더해서 품질을 올린다"는 반직관적 아이디어였다.

이 아이디어는 신경망 양자화에서 **확률적 반올림**(stochastic rounding)으로 부활했다. 일반 반올림은 결정론적(deterministic)이다. 0.3은 항상 0으로, 0.7은 항상 1로 간다. 확률적 반올림은 양자화 값을 확률적으로 선택한다.

Q_stoch(x) = floor(x/s)*s  (확률: 1 - f, 여기서 f = x/s - floor(x/s))
           = ceil(x/s)*s   (확률: f)

예를 들어 양자화 간격 s = 1일 때 x = 2.3이면, 2가 될 확률 70%, 3이 될 확률 30%다. 이렇게 하면 반올림의 **기댓값**이 원래 값 x와 같아진다. 즉, 편향(bias)이 0이다. 경사하강법에서 그래디언트 업데이트가 양자화 간격보다 작은 경우를 생각해보자. 가중치가 2.0001인데 양자화 간격이 1이면, 결정론적 반올림은 이 미세한 변화를 영원히 무시한다. 확률적 반올림은 매우 낮은 확률로나마 3으로 올림하여, 작은 업데이트가 장기적으로 누적될 수 있게 한다.

## 핵심 트레이드오프: 비트 수 대 정확도

양자화의 본질적 딜레마는 **압축률과 정확도 사이의 교환**이다.

- **높은 비트 수**(FP32, FP16): 오차가 작아 정확도 손실이 거의 없지만, 모델이 크고 느리다. 70B 파라미터 모델의 FP32 가중치는 약 280GB를 차지한다.
- **낮은 비트 수**(INT8, INT4): 모델이 작고 빠르지만, 양자화 오차가 누적되어 정확도가 하락한다. 같은 70B 모델을 INT4로 양자화하면 약 35GB로 줄어든다.
- **극단적 저비트**(2비트, 1비트): 하드웨어 효율이 극대화되지만, 정확도 하락이 급격해진다.

SQNR 공식이 예측하는 것처럼, 비트를 줄일수록 잡음이 커진다. 그러나 신경망에서는 SQNR만으로 성능을 예측할 수 없다. 같은 양자화 오차라도 모델의 어떤 레이어에서 발생하느냐에 따라 최종 출력에 미치는 영향이 크게 달라지기 때문이다.

## 이론적 심화: 극단적 양자화와 최적 비트 배정

양자화 연구는 비트 수를 극단까지 줄이는 방향으로 발전했다. Courbariaux et al.(2016)의 BinaryConnect와 XNOR-Net은 가중치를 +1과 -1만으로 표현하는 이진 신경망(Binary Neural Network)을 제안했다. 곱셈 연산이 XNOR 비트 연산으로 대체되어 하드웨어 효율이 극대화되지만, 정확도 하락이 상당하여 대형 모델에서는 제한적으로 사용된다.

GPTQ(Frantar et al. 2022)는 LLM에 특화된 양자화 기법이다. 100B+ 파라미터 모델을 3~4비트로 양자화하면서 성능 저하를 최소화한다. 핵심은 Hessian(목적 함수의 이차 도함수 행렬) 정보를 활용한 최적 비트 배정이다. 각 가중치를 양자화할 때 발생하는 오차를 아직 양자화하지 않은 다른 가중치로 보상하는 전략으로, Lloyd의 최적 양자화 원리 -- 중요한 영역에 더 많은 해상도를 배정한다 -- 의 현대적 확장이다.

AWQ(Lin et al. 2024)는 한 단계 더 나아간다. 활성화(activation) 크기에 기반하여 중요한 가중치를 식별하고 채널별로 스케일을 조정한다. 모든 가중치가 동등하게 중요하지 않다는 관찰에 기반한 적응적 양자화다. 입력 데이터가 실제로 크게 활성화하는 가중치는 높은 정밀도로 보존하고, 거의 활성화하지 않는 가중치는 공격적으로 양자화한다.

양자화 접근법은 크게 두 갈래로 나뉜다. **학습 후 양자화**(Post-Training Quantization, PTQ)는 이미 학습된 모델의 가중치를 직접 양자화한다. 추가 학습이 필요 없어 간편하지만, 낮은 비트에서 성능 저하가 크다. **양자화 인식 학습**(Quantization-Aware Training, QAT)은 학습 과정 자체에 양자화 효과를 시뮬레이션한다. 순전파에서는 양자화된 가중치를 사용하고, 역전파에서는 양자화를 무시하고 FP32 그래디언트를 계산한다. 이를 **직선 관통 추정기**(Straight-Through Estimator, STE)라 부르는데, 양자화 함수가 계단 함수여서 거의 모든 곳에서 그래디언트가 0이므로, 양자화를 항등 함수로 근사하여 그래디언트를 통과시키는 우회 전략이다.

## 현대 AI 기법과의 연결

신호 양자화 이론은 현대 AI의 모델 경량화에서 가장 직접적으로 살아 있는 공학 원리 중 하나다. 다만 각 연결의 성격은 구분해야 한다.

**신호 처리 양자화 이론의 직접적 계승:**

- **INT8/INT4 모델 양자화**: Jacob et al.(2018)의 TensorFlow Lite INT8 양자화부터 GPTQ, AWQ에 이르기까지, 가중치를 적은 비트로 표현하는 모든 기법은 신호 양자화의 Q(x) = round(x/s)*s 공식을 직접 사용한다. 양자화 오차 분석, 스케일 팩터 결정, 비균일 양자화 전략이 모두 전기공학 교과서에서 시작된 것이다.
- **디더링에서 확률적 반올림으로**: 오디오 공학의 디더링 기법이 신경망 학습의 확률적 반올림으로 직접 이어졌다. "의도적 노이즈로 체계적 왜곡을 줄인다"는 핵심 원리가 보존되었다.
- **Lloyd의 비균일 양자화에서 분포 인식 양자화로**: 밀집 영역에 더 많은 레벨을 배정하는 Lloyd의 원리가, GPTQ의 Hessian 기반 오차 보상과 AWQ의 활성화 기반 적응적 스케일링으로 진화했다.

**동일한 수학적 구조를 독립적으로 공유하는 구조적 유사성:**

- **드롭아웃과 양자화 노이즈**: 드롭아웃(Srivastava et al. 2014)은 학습 중 뉴런을 무작위로 끄는 정규화 기법이다. 양자화 노이즈와 마찬가지로 의도적 정보 손실이 과적합을 방지하는 효과를 낸다. 그러나 드롭아웃은 양자화 이론에서 영감을 받은 것이 아니라 생물학적 시냅스 가지치기에서 독립적으로 영감을 받았다.
- **혼합 정밀도 학습과 비균일 양자화**: Micikevicius et al.(2018)의 혼합 정밀도 학습은 레이어마다 다른 비트 수를 쓰는 전략이다. Lloyd의 비균일 양자화와 같은 직관 -- 모든 부분을 동일하게 다룰 필요가 없다 -- 을 공유하지만, GPU 하드웨어 제약에서 독립적으로 발전했다.

## 한계와 약점

- **이상치(outlier) 민감성**: 신경망 가중치/활성화 분포는 종종 긴 꼬리(heavy tail)를 가진다. 극단적 이상치가 하나라도 있으면 양자화 범위 전체를 지배하여, 나머지 값들의 해상도가 희생된다. 신호 양자화 이론은 입력이 양자화 간격에 비해 균일하게 분포한다고 가정하지만, 실제 신경망은 이 가정을 자주 위반한다. LLM에서 특히 심각하여, SmoothQuant(Xiao et al. 2022)처럼 이상치 전용 처리가 필수적이다.
- **STE의 이론적 약점**: 양자화 함수의 그래디언트를 1로 근사하는 STE는 수학적으로 정당화가 약하다. 학습 후반에 가중치가 양자화 경계를 넘나들 때 진동이 발생할 수 있으며, 이 문제는 저비트 양자화일수록 심해진다.
- **태스크 의존적 성능**: 분류처럼 출력이 이산적인 태스크는 양자화에 강하지만, 텍스트/이미지 생성처럼 연속 출력의 미세한 차이가 품질을 좌우하는 태스크는 양자화에 훨씬 민감하다. 신호 양자화 이론의 SQNR로는 이 태스크별 차이를 예측할 수 없다.
- **하드웨어 의존성**: INT8 연산의 실제 속도 향상은 칩의 정수 연산 유닛 지원에 달려 있다. 양자화 연산에 최적화되지 않은 하드웨어에서는 이론적 4배 압축이 속도 향상으로 이어지지 않을 수 있다.

## 용어 정리

균일 양자화(uniform quantization) - 모든 양자화 간격이 동일한 양자화 방식. 구현이 단순하지만 분포가 불균일한 입력에서는 비효율적

비균일 양자화(non-uniform quantization) - 입력 분포에 따라 양자화 간격을 달리하는 방식. 밀집 영역에 더 많은 레벨을 배정하여 같은 비트 수로도 오차를 줄임

스케일 팩터(scale factor) - 양자화에서 연속 실수 값과 이산 정수 값 사이의 변환 비율. s = (x_max - x_min) / (2^N - 1)

제로 포인트(zero point) - 실수 0에 대응하는 양자화된 정수 값. 비대칭 양자화에서 ReLU의 0 경계를 정확히 보존하는 데 필수

디더링(dithering) - 양자화 전 미량의 노이즈를 의도적으로 추가하여 체계적 양자화 왜곡을 균일한 백색 잡음으로 전환하는 기법

확률적 반올림(stochastic rounding) - 양자화 값을 확률적으로 선택하여 편향 없는 반올림을 달성하는 기법. 기댓값이 원래 값과 같아 미세한 그래디언트 업데이트를 보존

직선 관통 추정기(Straight-Through Estimator, STE) - 양자화 함수의 역전파에서 그래디언트를 1로 근사하여 통과시키는 우회 기법. 계단 함수의 0 그래디언트 문제를 회피

혼합 정밀도(mixed precision) - 레이어마다 다른 비트 수를 적용하여 성능과 효율의 균형을 맞추는 전략. 민감한 레이어는 높은 비트, 덜 민감한 레이어는 낮은 비트 배정

학습 후 양자화(Post-Training Quantization, PTQ) - 학습 완료된 모델에 추가 학습 없이 직접 양자화를 적용하는 방식. 간편하지만 저비트에서 성능 저하가 큼

양자화 인식 학습(Quantization-Aware Training, QAT) - 학습 중 양자화 효과를 시뮬레이션하여 모델이 양자화 오차에 적응하도록 만드는 방식. PTQ보다 성능 저하가 작지만 추가 학습 비용 발생

---EN---
Signal Quantization - The process of approximating continuous values to finite discrete levels, whose error theory directly underpins neural network weight compression

## From Analog to Digital: The Essence of Quantization

Natural signals are continuous. Sound pressure captured by a microphone, voltage measured by a temperature sensor -- these hold infinitely fine values. But digital systems must represent them with a finite number of bits. 8 bits yields 256 levels; 16 bits yields 65,536 levels. **Snapping** continuous real numbers to the nearest among these finite levels is quantization.

To visualize this spatially: if continuous values form a smooth slope, quantized values are a staircase carved at fixed height intervals. Any point on the slope gets pushed to the nearest stair surface. The more stairs (more bits), the closer the staircase approximates the original slope; the fewer stairs, the more the original shape is lost.

The simplest uniform quantization formula is:

Q(x) = round(x / s) * s

Here s is the quantization step size. The original value x is divided by s, rounded to the nearest integer, then multiplied by s again. All values effectively snap to integer multiples of s. With s = 0.1, the value 0.37 becomes 0.4; with s = 1, it becomes 0.

## The Mathematics of Quantization Error

Quantization inevitably introduces error. In uniform quantization, the quantization error e = x - Q(x) can be modeled as uniformly distributed over [-s/2, +s/2] (when the input is sufficiently complex relative to the step size). The variance of this error is:

sigma_e^2 = s^2 / 12

Here s = (x_max - x_min) / (2^N - 1) where N is the number of bits. Each additional bit halves the step size and reduces error variance to one quarter. Expressed as Signal-to-Quantization-Noise Ratio (SQNR):

SQNR = 6.02 * N + 1.76 (dB)

Each bit yields approximately 6 dB of SQNR improvement. Going from 8 to 16 bits adds about 48 dB; going from 32 down to 8 bits loses about 144 dB. This relationship is a textbook fundamental of electrical engineering and later becomes the theoretical starting point for judging how many bits neural network weights can be reduced to.

Meanwhile, Lloyd (1957/1982) studied optimal quantization for non-uniform input distributions. The core idea is simple: assign more quantization levels to densely populated regions and fewer to sparse regions, and the same number of bits yields lower total error. Like placing post offices densely in high-population urban areas and sparsely in low-population outskirts. This non-uniform quantization principle later plays a key role in AI quantization.

## From Electrical Engineering to Neural Networks

The path from signal quantization theory to neural networks is direct. Neural network weights are ultimately a collection of real-valued numbers, and representing them with fewer bits makes models smaller and faster -- that observation was the starting point. The key correspondences are:

- Analog signal values --> **neural network weights/activations** (both continuous real numbers)
- Quantization step size s --> **scale factor** (conversion ratio between real and integer values)
- Quantization error --> **accuracy degradation** (fewer bits means more model performance loss)
- SQNR --> **degree of quantized model performance loss** (quantitative per-bit loss metric)
- Lloyd's non-uniform quantization --> **distribution-aware quantization** (outlier handling, prioritizing important weights)
- Dithering --> **stochastic rounding / gradient noise**

Jacob et al. (2018) systematized INT8 quantization in TensorFlow Lite. Converting FP32 (32-bit floating point) weights to INT8 (8-bit integer) reduces model size by 4x, and since integer arithmetic is faster than floating point, inference speed also improves. This work was the inflection point that made real-time inference on mobile devices practical. The formulas for determining quantization parameters (scale s and zero point z) are:

q = round(x / s) + z
x_dequant = (q - z) * s

Here z is the zero point, ensuring that real-valued 0 maps exactly to a quantized value. This matters because the 0 boundary of ReLU activations must be precisely preserved. When z = 0, it is symmetric quantization; when z != 0, asymmetric quantization.

## From Dithering to Stochastic Rounding: The Noise Paradox

In the 1960s, audio engineers faced quantization distortion at low bit depths -- staircase-shaped waveforms audibly prominent in quiet passages. The solution was paradoxical: intentionally adding a small amount of noise **before** quantization breaks the correlation between quantization error and the input signal, turning distortion into white noise-like hiss. Distortion converts to uniform noise that sounds far more natural. This is dithering. "Adding noise to improve quality" was a counterintuitive idea.

This idea was revived in neural network quantization as **stochastic rounding**. Regular rounding is deterministic: 0.3 always goes to 0, 0.7 always goes to 1. Stochastic rounding selects quantized values probabilistically:

Q_stoch(x) = floor(x/s)*s  (probability: 1 - f, where f = x/s - floor(x/s))
           = ceil(x/s)*s   (probability: f)

For example, with step size s = 1 and x = 2.3, the result is 2 with 70% probability and 3 with 30% probability. This makes the **expected value** of rounding equal to the original value x -- zero bias. Consider what happens when gradient descent updates are smaller than the quantization step: if a weight is 2.0001 and the quantization step is 1, deterministic rounding ignores this tiny change forever. Stochastic rounding, with very low probability, rounds up to 3, allowing small updates to accumulate over time.

## The Core Tradeoff: Bits vs. Accuracy

The essential dilemma of quantization is the **exchange between compression ratio and accuracy**.

- **High bit width** (FP32, FP16): Small error means near-zero accuracy loss, but models are large and slow. FP32 weights for a 70B parameter model occupy roughly 280 GB.
- **Low bit width** (INT8, INT4): Models are small and fast, but accumulated quantization error degrades accuracy. The same 70B model quantized to INT4 shrinks to roughly 35 GB.
- **Extreme low-bit** (2-bit, 1-bit): Hardware efficiency is maximized, but accuracy drops sharply.

As the SQNR formula predicts, fewer bits mean more noise. But in neural networks, SQNR alone cannot predict performance. The same quantization error has vastly different effects on final output depending on which layer it occurs in.

## Theoretical Depth: Extreme Quantization and Optimal Bit Allocation

Quantization research has pushed toward extreme bit reduction. Courbariaux et al.'s (2016) BinaryConnect and XNOR-Net proposed binary neural networks representing weights with only +1 and -1. Multiplication operations are replaced by XNOR bit operations, maximizing hardware efficiency, but accuracy degradation is substantial and limits use in large models.

GPTQ (Frantar et al. 2022) is a quantization technique specialized for LLMs. It quantizes 100B+ parameter models to 3-4 bits while minimizing performance loss. The key is optimal bit allocation using Hessian (the second-derivative matrix of the objective function) information. The strategy compensates quantization error in each weight by adjusting other not-yet-quantized weights -- a modern extension of Lloyd's optimal quantization principle of allocating more resolution where it matters most.

AWQ (Lin et al. 2024) goes further, identifying important weights based on activation magnitudes and adjusting per-channel scales. This is adaptive quantization based on the observation that not all weights are equally important. Weights that input data actually activates strongly are preserved at high precision, while rarely-activated weights are quantized aggressively.

Quantization approaches divide into two main branches. **Post-Training Quantization (PTQ)** directly quantizes already-trained model weights. It requires no additional training, making it convenient, but suffers greater performance loss at low bit widths. **Quantization-Aware Training (QAT)** simulates quantization effects during training itself. Forward passes use quantized weights; backward passes ignore quantization and compute FP32 gradients. This is called the **Straight-Through Estimator (STE)** -- since the quantization function is a step function with zero gradient almost everywhere, quantization is approximated as the identity function to let gradients pass through, a workaround strategy.

## Connections to Modern AI

Signal quantization theory is one of the most directly surviving engineering principles in modern AI model compression. However, the nature of each connection must be distinguished.

**Direct succession of signal processing quantization theory:**

- **INT8/INT4 model quantization**: From Jacob et al.'s (2018) TensorFlow Lite INT8 quantization to GPTQ and AWQ, every technique for representing weights with fewer bits directly uses signal quantization's Q(x) = round(x/s)*s formula. Quantization error analysis, scale factor determination, and non-uniform quantization strategies all originate from electrical engineering textbooks.
- **From dithering to stochastic rounding**: Audio engineering's dithering technique directly carried over to stochastic rounding in neural network training. The core principle of "using intentional noise to reduce systematic distortion" was preserved.
- **From Lloyd's non-uniform quantization to distribution-aware quantization**: Lloyd's principle of allocating more levels to dense regions evolved into GPTQ's Hessian-based error compensation and AWQ's activation-based adaptive scaling.

**Structural similarities sharing the same mathematical structure independently:**

- **Dropout and quantization noise**: Dropout (Srivastava et al. 2014) is a regularization technique that randomly disables neurons during training. Like quantization noise, intentional information loss prevents overfitting. However, dropout was not inspired by quantization theory but independently by biological synaptic pruning.
- **Mixed-precision training and non-uniform quantization**: Micikevicius et al.'s (2018) mixed-precision training uses different bit widths per layer. It shares the same intuition as Lloyd's non-uniform quantization -- not all parts need equal treatment -- but developed independently from GPU hardware constraints.

## Limitations and Weaknesses

- **Outlier sensitivity**: Neural network weight/activation distributions often have heavy tails. Even a single extreme outlier can dominate the entire quantization range, sacrificing resolution for all remaining values. Signal quantization theory assumes inputs are uniformly distributed relative to the step size, but real neural networks frequently violate this assumption. This is particularly severe in LLMs, making outlier-specific handling like SmoothQuant (Xiao et al. 2022) essential.
- **Theoretical weakness of STE**: Approximating the quantization function's gradient as 1 lacks strong mathematical justification. Oscillation can occur in later training when weights straddle quantization boundaries, and this problem worsens at lower bit widths.
- **Task-dependent performance**: Tasks with discrete outputs like classification are robust to quantization, but generation tasks where subtle differences in continuous outputs determine quality (text, image generation) are far more sensitive. Signal quantization theory's SQNR cannot predict these task-specific differences.
- **Hardware dependence**: The actual speedup from INT8 operations depends on chip-level integer arithmetic unit support. On hardware not optimized for quantized operations, the theoretical 4x compression may not translate to speed gains.

## Glossary

Uniform quantization - a quantization scheme where all step sizes are equal; simple to implement but inefficient for non-uniformly distributed inputs

Non-uniform quantization - a scheme that varies step sizes according to input distribution, assigning more levels to dense regions to reduce error with the same number of bits

Scale factor - the conversion ratio between continuous real values and discrete integer values in quantization; s = (x_max - x_min) / (2^N - 1)

Zero point - the quantized integer value corresponding to real-valued 0; essential in asymmetric quantization for precisely preserving ReLU's 0 boundary

Dithering - a technique that intentionally adds small noise before quantization to convert systematic quantization distortion into uniform white noise

Stochastic rounding - a technique that probabilistically selects quantized values to achieve unbiased rounding; the expected value equals the original, preserving fine gradient updates

Straight-Through Estimator (STE) - a workaround technique that approximates the quantization function's gradient as 1 during backpropagation, bypassing the step function's zero gradient problem

Mixed precision - a strategy applying different bit widths per layer to balance performance and efficiency; sensitive layers get higher bits, less sensitive layers get lower bits

Post-Training Quantization (PTQ) - applying quantization directly to an already-trained model without additional training; convenient but suffers greater performance loss at low bit widths

Quantization-Aware Training (QAT) - training that simulates quantization effects so the model adapts to quantization error; less performance degradation than PTQ but incurs additional training cost
