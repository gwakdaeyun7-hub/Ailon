---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 푸리에 변환, 주파수 분해, 스펙트럼 분석, FFT, 합성곱 정리, 위치 인코딩, 시간-주파수 영역, 기저 함수
keywords_en: Fourier transform, frequency decomposition, spectral analysis, FFT, convolution theorem, positional encoding, time-frequency domain, basis function
---
Fourier Transform - 복잡한 신호를 단순한 주파수 성분으로 분해하는 수학적 변환이 CNN의 합성곱 연산과 Transformer의 위치 인코딩에 직접 활용된다

## 신호를 해체하는 관점의 전환

기타 줄 하나를 튕기면 하나의 음이 들린다. 그런데 오실로스코프로 그 파형을 보면 단순한 사인파가 아니라 울퉁불퉁한 곡선이다. 이 복잡한 파형은 사실 기본 주파수(1배)와 그 정수배 주파수(2배, 3배, 4배...)의 사인파가 각기 다른 세기로 합쳐진 결과다. **푸리에 변환**(Fourier Transform)은 이 합쳐진 파형을 원래의 개별 주파수 성분으로 되돌려 놓는 수학적 도구다.

이것을 공간적으로 상상하면 이렇다. 시간 영역의 파형은 여러 색깔의 물감을 섞은 결과물이고, 푸리에 변환은 그 혼합물을 원래의 순수한 색깔들로 분리하는 프리즘이다.

Joseph Fourier가 1807년에 제시한 핵심 주장은 이것이었다. 어떤 주기 함수든 서로 다른 주파수의 사인파와 코사인파를 적절한 비율로 더하면 재현할 수 있다. 그가 이 아이디어에 도달한 배경은 열 전도 문제였다. 금속판 위에서 열이 퍼져나가는 편미분방정식은 직접 풀기 어렵지만, 각 주파수 성분별로 분리하면 각각이 독립적인 상미분방정식이 되어 개별적으로 풀 수 있다.

## 연속에서 이산으로, 그리고 FFT

연속 푸리에 변환의 공식은 다음과 같다.

F(w) = integral_{-inf}^{inf} f(t) * e^(-jwt) dt

w는 주파수, j는 허수 단위이며, 결과 F(w)의 크기가 해당 주파수의 세기를, 각도(위상)가 시간상 위치를 나타낸다. 컴퓨터는 연속 신호를 다룰 수 없으므로, N개의 이산 샘플에 적용하는 **이산 푸리에 변환**(DFT)이 필요하다.

X(k) = sum_{n=0}^{N-1} x(n) * e^(-j*2*pi*k*n/N), k = 0, 1, ..., N-1

DFT를 직접 계산하면 O(N^2)의 연산이 든다. Cooley와 Tukey(1965)의 **고속 푸리에 변환**(FFT)은 분할 정복 전략으로 이를 O(N log N)으로 줄였다. N = 1,000,000일 때 1조 번이 약 2,000만 번으로 줄어드는 것이다. FFT는 디지털 신호 처리의 토대가 되었고, 오늘날 음성 통화부터 MRI 영상 재구성까지 모든 곳에서 작동한다.

## 합성곱 정리: AI 연결의 수학적 토대

푸리에 변환이 AI에서 중요한 이유는 **합성곱 정리**(convolution theorem) 때문이다.

F{f * g} = F{f} . F{g}

시간 영역에서의 합성곱 연산은 주파수 영역에서의 원소별 곱셈과 동치다. 합성곱은 직접 계산하면 O(N^2)이지만, FFT로 주파수 영역에 보내고 곱셈한 뒤 역FFT로 되돌리면 전체가 O(N log N)에 끝난다.

이 사실이 왜 중요한가. CNN(합성곱 신경망)의 핵심 연산이 바로 합성곱이기 때문이다. 입력 이미지에 필터(커널)를 밀어가며 곱하고 더하는 과정이 합성곱이다. 이미지 크기가 크거나 커널이 크면, 공간 영역에서 직접 계산하는 것보다 FFT 경유가 빠르다. 이것은 비유가 아니라 동일한 수학 연산의 계산 경로만 다른 것이다.

## 전기공학에서 AI로: 주파수 필터와 CNN

전기공학에서 주파수 필터는 특정 주파수 대역을 통과시키거나 차단하는 회로다. CNN의 합성곱 필터도 주파수 관점에서 동일하게 해석된다.

- 3x3 에지 검출 필터 --> 급격한 밝기 변화를 잡아내는 **고역 통과 필터**
- 평균 필터 --> 세부 변화를 부드럽게 뭉개는 **저역 통과 필터**
- CNN의 다중 채널 필터 --> 서로 다른 주파수 대역을 병렬로 분리하는 **필터 뱅크**

Rippel, Snoek, Adams(2015)는 CNN 필터의 파라미터를 주파수 영역에서 직접 학습하면 원하는 주파수 특성을 더 효율적으로 제어할 수 있음을 보였다. 핵심 대응 관계는 다음과 같다.

- 아날로그 주파수 필터 --> CNN 합성곱 커널
- 대역 통과 필터 --> 특정 스케일의 특징만 추출하는 CNN 레이어
- 스펙트럼 분석 --> 학습된 CNN 필터의 주파수 응답 분석

이 연결은 **직접적 수학적 동치**에 해당한다. CNN의 합성곱과 전기공학의 합성곱은 같은 수학 연산이다.

## Transformer 위치 인코딩과 FNet

Vaswani et al.(2017)의 위치 인코딩은 푸리에 급수의 기저 함수를 직접 사용한다. 각 토큰 위치 pos에 대해:

PE(pos, 2i) = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))

차원마다 다른 주파수의 사인-코사인파를 배정하여, 각 위치를 고유한 주파수 패턴으로 표현한다. i가 작은 차원은 주파수가 높아 인접 위치를 세밀하게 구분하고, i가 큰 차원은 주파수가 낮아 먼 위치 간 관계를 인코딩한다. 이 구조는 푸리에 급수에서 서로 다른 주파수의 기저 함수를 조합하여 임의의 함수를 표현하는 것과 동일한 원리다.

Lee-Thorp et al.(2021)의 **FNet**은 Transformer의 self-attention을 2D FFT로 완전히 대체했다. 시퀀스와 히든 차원 각각에 FFT를 적용하여 전역 토큰 혼합을 O(N log N)으로 달성하면서 BERT 정확도의 92-97%를 유지했다. 다만 FNet은 토큰의 의미에 따라 가중치를 달리하는 맥락 의존적 어텐션을 포기하기 때문에 한계가 있다.

## 현대 AI 기법과의 연결 정리

**동일한 수학의 직접 적용:**

- **CNN의 합성곱 연산**: 합성곱 정리에 의해, CNN의 공간 영역 합성곱은 주파수 영역 곱셈과 수학적으로 동치다. 영감이나 유사성이 아니라 같은 연산의 두 가지 계산 방식이다
- **Transformer 위치 인코딩**: 푸리에 급수의 사인-코사인 기저 함수를 직접 사용한다
- **FNet**: FFT를 어텐션 대체물로 직접 사용한다

**구조적 유사성을 공유하는 독립적 발전:**

- **음성 인식의 MFCC/멜 스펙트로그램**: 음성 신호를 STFT로 시간-주파수 표현으로 바꾼 뒤 멜 스케일로 변환한 것으로, 전통 신호 처리의 직접 계승이다. 현대 모델(Whisper 등)도 입력 단계에서 사용한다
- **정규화의 주파수 해석**: 과적합을 "고주파 노이즈까지 학습하는 것", 정규화를 "저역 통과 필터"로 해석하는 관점이 있다. 이것은 사후적 해석이지, 정규화가 푸리에 이론에서 영감을 받아 설계된 것은 아니다

## 한계와 약점

- **고정 기저의 한계**: 사인-코사인은 미리 정해진 기저 함수다. CNN과 Transformer는 데이터에서 기저를 학습하며, 특정 도메인에 최적화된 학습 기저가 범용 푸리에 기저보다 효율적일 수 있다
- **Gibbs 현상**: 불연속점 근처에서 푸리에 급수의 부분합이 약 9%의 과도한 진동을 보인다. 이미지 처리에서는 국소적 특성을 잘 포착하는 웨이블릿 변환이 대안으로 사용된다
- **시간-주파수 해상도 트레이드오프**: 짧은 구간 분석은 시간은 정확하지만 주파수가 흐려지고, 긴 구간은 주파수는 정확하지만 시간 위치가 흐려진다. 이 근본적 한계 때문에 STFT나 멜 스펙트로그램 같은 절충안이 필요하다
- **FNet의 맥락 무관성**: FFT 기반 토큰 혼합은 내용과 무관하게 작동하여, 같은 단어가 문맥에 따라 다른 의미를 가질 때 이를 구분할 수 없다

## 용어 정리

기저 함수(basis function) - 복잡한 함수를 표현하기 위해 조합하는 기본 구성 요소. 푸리에 분석에서는 사인파와 코사인파가 기저 함수다

스펙트럼(spectrum) - 신호를 구성하는 각 주파수 성분의 세기와 위상 분포를 나타낸 것

고속 푸리에 변환(FFT) - DFT를 분할 정복으로 O(N^2)에서 O(N log N)으로 가속하는 알고리즘

합성곱 정리(convolution theorem) - 시간/공간 영역의 합성곱이 주파수 영역의 원소별 곱셈과 수학적으로 동치라는 정리

위상(phase) - 주파수 성분의 시간상 위치. 같은 주파수, 같은 세기라도 위상이 다르면 파형의 모양이 달라진다

위치 인코딩(positional encoding) - Transformer에서 토큰의 순서 정보를 벡터로 표현하는 기법. 서로 다른 주파수의 사인-코사인 함수를 사용한다

Gibbs 현상(Gibbs phenomenon) - 불연속점 근처에서 푸리에 급수의 부분합이 실제 값을 약 9% 초과하는 진동을 보이는 현상

필터 뱅크(filter bank) - 서로 다른 주파수 대역을 병렬로 분리하는 필터 집합. CNN의 다중 채널 필터에 대응된다

---EN---
Fourier Transform - A mathematical transform that decomposes complex signals into simple frequency components, directly used in CNN convolution operations and Transformer positional encoding

## A Change of Perspective: Decomposing Signals

Pluck a single guitar string and you hear one note. But view that waveform on an oscilloscope and it is not a clean sine wave -- it is a jagged curve. This complex waveform is actually the sum of sine waves at the fundamental frequency (1x) and its integer multiples (2x, 3x, 4x...), each at a different intensity. The **Fourier Transform** is the mathematical tool that separates this combined waveform back into its individual frequency components.

Picture it spatially: a time-domain waveform is like paint colors mixed together, and the Fourier transform is a prism that separates the mixture back into pure colors.

Joseph Fourier's core claim in 1807: any periodic function can be reproduced by adding sine and cosine waves of different frequencies in the right proportions. He arrived at this idea while studying heat conduction. The partial differential equation describing heat spreading across a metal plate is difficult to solve directly, but separating it into frequency components turns each into an independent ordinary differential equation that can be solved individually.

## From Continuous to Discrete, and the FFT

The continuous Fourier Transform formula:

F(w) = integral_{-inf}^{inf} f(t) * e^(-jwt) dt

Here w is frequency, j is the imaginary unit. The result F(w) is a complex number whose magnitude represents strength and whose angle (phase) indicates temporal position. Since computers cannot handle continuous signals, the **Discrete Fourier Transform** (DFT) is needed:

X(k) = sum_{n=0}^{N-1} x(n) * e^(-j*2*pi*k*n/N), k = 0, 1, ..., N-1

Direct DFT computation costs O(N^2). Cooley and Tukey's (1965) **Fast Fourier Transform** (FFT) uses divide-and-conquer to reduce this to O(N log N). For N = 1,000,000, one trillion operations drop to roughly 20 million. FFT became the foundation of digital signal processing, operating today in everything from voice calls to MRI image reconstruction.

## The Convolution Theorem: Mathematical Foundation for AI

The reason the Fourier transform matters in AI is the **convolution theorem**:

F{f * g} = F{f} . F{g}

Convolution in the time domain equals element-wise multiplication in the frequency domain. Direct convolution costs O(N^2), but sending both signals to the frequency domain via FFT, multiplying, and converting back completes in O(N log N).

Why does this matter? Because the core operation of CNNs is convolution. Sliding a filter across an input image, multiplying and summing, is convolution. When images or kernels are large, the FFT route is faster. This is not an analogy -- it is the same mathematical operation computed via a different path.

## From Electrical Engineering to AI: Frequency Filters and CNNs

In electrical engineering, a frequency filter passes or blocks specific frequency bands. CNN convolutional filters admit the same interpretation:

- 3x3 edge detection filter --> a **high-pass filter** capturing sharp brightness changes
- Averaging filter --> a **low-pass filter** smoothing fine variations
- CNN's multi-channel filters --> a **filter bank** separating frequency bands in parallel

Rippel, Snoek, and Adams (2015) showed that learning CNN filter parameters directly in the frequency domain enables more efficient control of frequency characteristics. The key correspondences:

- Analog frequency filter --> CNN convolutional kernel
- Bandpass filter --> CNN layer extracting features at a specific scale
- Spectral analysis --> frequency response analysis of learned CNN filters

This connection is **direct mathematical equivalence**. CNN convolution and electrical engineering convolution are the same operation.

## Transformer Positional Encoding and FNet

Vaswani et al.'s (2017) positional encoding directly uses Fourier series basis functions. For each token position pos:

PE(pos, 2i) = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))

Each dimension is assigned a different-frequency sine or cosine wave, representing each position as a unique frequency pattern. Small i dimensions have high frequencies for fine adjacent-position distinction; large i dimensions have low frequencies encoding distant relationships. This follows the same principle as Fourier series combining different-frequency basis functions to represent arbitrary functions.

Lee-Thorp et al.'s (2021) **FNet** completely replaces Transformer self-attention with 2D FFT, achieving global token mixing in O(N log N) while retaining 92-97% of BERT's accuracy. However, FNet sacrifices context-dependent attention, limiting its ability to disambiguate words with multiple meanings.

## Organizing Connections to Modern AI

**Direct application of the same mathematics:**

- **CNN convolution**: By the convolution theorem, spatial-domain CNN convolution is mathematically equivalent to frequency-domain multiplication. Not inspiration or analogy -- two computational paths for the same operation
- **Transformer positional encoding**: Directly uses sine-cosine basis functions from Fourier series
- **FNet**: Directly uses FFT as an attention substitute

**Independent developments sharing structural similarity:**

- **MFCC/mel spectrograms in speech recognition**: Speech signals converted to time-frequency representations via STFT, then to mel scale. A direct continuation of traditional signal processing; modern models (Whisper, etc.) still use this
- **Frequency-domain regularization interpretation**: Overfitting as "learning high-frequency noise," regularization as "low-pass filtering." This is a post-hoc interpretive framework, not a design inspiration from Fourier theory

## Limitations and Weaknesses

- **Fixed basis limitation**: Sine-cosine are predetermined basis functions. CNNs and Transformers learn bases from data, and learned domain-specific bases can be more efficient than universal Fourier bases
- **Gibbs phenomenon**: Near discontinuities, Fourier series partial sums exhibit approximately 9% overshoot oscillation. Wavelet transforms, better at capturing local features, are used as alternatives in image processing
- **Time-frequency resolution tradeoff**: Short windows yield precise timing but blur frequency; long windows yield precise frequency but blur timing. This fundamental limitation requires compromises like STFT or mel spectrograms
- **FNet's context blindness**: FFT-based token mixing operates content-agnostically, unable to distinguish context-dependent word meanings. This is why self-attention remains indispensable

## Glossary

Basis function - a fundamental building block combined to represent complex functions. In Fourier analysis, sine and cosine waves serve as basis functions

Spectrum - the distribution of strength and phase across frequency components constituting a signal

Fast Fourier Transform (FFT) - an algorithm accelerating DFT from O(N^2) to O(N log N) using divide-and-conquer

Convolution theorem - the theorem that convolution in time/spatial domain is mathematically equivalent to element-wise multiplication in the frequency domain

Phase - the temporal position of a frequency component. Same frequency and strength but different phases produce different waveforms

Positional encoding - a Transformer technique representing token order as vectors using sine-cosine functions of different frequencies

Gibbs phenomenon - approximately 9% overshoot oscillation in Fourier series partial sums near discontinuities

Filter bank - a set of parallel filters separating different frequency bands, corresponding to CNN's multi-channel filters
