---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 푸리에 변환, 주파수 분해, 스펙트럼 분석, FFT, 합성곱 정리, 위치 인코딩, 시간-주파수 영역, 기저 함수
keywords_en: Fourier transform, frequency decomposition, spectral analysis, FFT, convolution theorem, positional encoding, time-frequency domain, basis function
---
Fourier Transform - 복잡한 신호를 단순한 주파수 성분으로 분해하는 수학적 변환이 CNN의 합성곱 연산과 Transformer의 위치 인코딩에 직접 활용된다

## 신호를 해체하는 관점의 전환

기타 줄 하나를 튕기면 하나의 음이 들린다. 그런데 오실로스코프로 그 파형을 보면 단순한 사인파가 아니라 울퉁불퉁한 곡선이다. 이 복잡한 파형은 사실 기본 주파수(1배)와 그 정수배 주파수(2배, 3배, 4배...)의 사인파가 각기 다른 세기로 합쳐진 결과다. **푸리에 변환**(Fourier Transform)은 이 합쳐진 파형을 원래의 개별 주파수 성분으로 되돌려 놓는 수학적 도구다.

이것을 공간적으로 상상하면 이렇다. 시간 영역의 파형은 여러 색깔의 물감을 섞은 결과물이고, 푸리에 변환은 그 혼합물을 원래의 순수한 색깔들로 분리하는 프리즘이다. 프리즘이 백색광을 무지개로 분해하듯, 푸리에 변환은 복잡한 신호를 각 주파수별 세기와 위상으로 분해한다.

Joseph Fourier가 1807년에 제시한 핵심 주장은 이것이었다. 어떤 주기 함수든 서로 다른 주파수의 사인파와 코사인파를 적절한 비율로 더하면 재현할 수 있다. 그가 이 아이디어에 도달한 배경은 열 전도 문제였다. 금속판 위에서 열이 퍼져나가는 패턴을 기술하는 편미분방정식은 직접 풀기 어렵지만, 각 주파수 성분별로 분리하면 각각이 독립적인 단순한 방정식이 된다. Lagrange와 Laplace는 "모든 함수에 적용 가능하다"는 부분에 회의적이었지만, 이 분해 방법 자체의 유용성은 부정할 수 없었다.

## 연속에서 이산으로, 그리고 FFT

푸리에 급수(Fourier series)는 주기 함수에 대한 것이고, 연속 푸리에 변환(Continuous Fourier Transform)은 비주기 함수까지 확장한다.

F(w) = integral_{-inf}^{inf} f(t) * e^(-jwt) dt

여기서 w는 주파수, j는 허수 단위, f(t)는 시간 영역 신호다. 결과 F(w)는 복소수인데, 그 크기(magnitude)가 해당 주파수의 세기를, 각도(phase)가 시간상 위치를 나타낸다.

컴퓨터는 연속 신호를 다룰 수 없으므로, 일정 간격으로 샘플링한 N개의 이산 데이터에 적용하는 **이산 푸리에 변환**(DFT)이 필요하다.

X(k) = sum_{n=0}^{N-1} x(n) * e^(-j*2*pi*k*n/N), k = 0, 1, ..., N-1

DFT를 정직하게 계산하면 모든 n에 대해 모든 k를 계산해야 하므로 O(N^2)의 연산이 든다. N = 1,000이면 1,000,000번, N = 1,000,000이면 1조 번이다. James Cooley와 John Tukey가 1965년에 발표한 **고속 푸리에 변환**(FFT)은 분할 정복(divide-and-conquer) 전략으로 N점 DFT를 두 개의 N/2점 DFT로 재귀 분해하여 연산량을 O(N log N)으로 줄였다. N = 1,000,000일 때 1조 번이 약 2,000만 번으로 줄어드는 것이다. 이 아이디어는 실은 Gauss가 1805년에 천체 궤도 계산에 사용했으나 출판하지 않았다. FFT는 디지털 신호 처리의 토대가 되었고, 오늘날 음성 통화부터 MRI 영상 재구성까지 모든 곳에서 작동한다.

## 합성곱 정리: AI 연결의 수학적 토대

푸리에 변환이 AI에서 중요한 이유는 **합성곱 정리**(convolution theorem) 때문이다. 이 정리는 다음을 말한다.

F{f * g} = F{f} . F{g}

시간(또는 공간) 영역에서의 합성곱(convolution) 연산은 주파수 영역에서의 원소별 곱셈(element-wise multiplication)과 동치다. 합성곱은 한 함수를 밀면서 다른 함수와의 겹침 면적을 계산하는 연산으로, 직접 계산하면 O(N^2)이다. 그런데 두 신호를 각각 FFT로 주파수 영역에 보내고(O(N log N)), 원소별 곱셈을 하고(O(N)), 역FFT로 되돌리면(O(N log N)) 전체가 O(N log N)에 끝난다.

이 사실이 왜 중요한가. CNN(합성곱 신경망)의 핵심 연산이 바로 합성곱이기 때문이다. 입력 이미지에 필터(커널)를 밀어가며 곱하고 더하는 과정이 합성곱이다. 이미지 크기가 크거나 커널이 크면, 공간 영역에서 직접 계산하는 것보다 FFT 경유가 빠르다. 이것은 비유가 아니라 동일한 수학 연산의 계산 경로만 다른 것이다.

## 전기공학에서 AI로: 주파수 필터와 CNN

전기공학에서 주파수 필터는 특정 주파수 대역을 통과시키거나 차단하는 회로다. 고역 통과 필터(high-pass filter)는 빠르게 변하는 성분(고주파)만 통과시키고, 저역 통과 필터(low-pass filter)는 천천히 변하는 성분(저주파)만 통과시킨다. CNN의 합성곱 필터도 주파수 관점에서 동일하게 해석된다.

- 3x3 에지 검출 필터 --> 이미지의 급격한 밝기 변화(경계, 질감)를 잡아내는 **고역 통과 필터**
- 평균 필터(averaging filter) --> 세부 변화를 부드럽게 뭉개는 **저역 통과 필터**
- CNN의 다중 채널 필터 --> 서로 다른 주파수 대역을 병렬로 분리하는 **필터 뱅크**(filter bank)

Rippel, Snoek, Adams(2015)는 "Spectral Representations for Convolutional Neural Networks"에서 이 관계를 체계적으로 연구했다. CNN 필터의 파라미터를 공간 영역이 아니라 주파수 영역에서 직접 학습하면, 원하는 주파수 특성을 더 효율적으로 제어할 수 있다는 것이다. 이 연구는 CNN의 작동 원리를 전기공학의 필터 설계 언어로 재해석한 사례다. 핵심 대응 관계는 다음과 같다.

- 아날로그 주파수 필터 --> CNN 합성곱 커널
- 대역 통과 필터(bandpass filter) --> 특정 스케일의 특징만 추출하는 CNN 레이어
- 스펙트럼 분석 --> 학습된 CNN 필터의 주파수 응답 분석
- 필터 설계 이론 --> CNN 아키텍처 설계에 대한 주파수 관점의 해석

이 연결은 **직접적 수학적 동치**에 해당한다. CNN의 합성곱과 전기공학의 합성곱은 같은 수학 연산이므로, 주파수 영역 분석이 그대로 적용된다.

## Transformer 위치 인코딩과 FNet

Vaswani et al.(2017)의 "Attention Is All You Need"에서 도입한 위치 인코딩(positional encoding)은 푸리에 급수의 기저 함수를 직접 사용한다. 각 토큰 위치 pos에 대해 다음 값을 부여한다.

PE(pos, 2i) = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))

i는 차원 인덱스, d_model은 모델 차원이다. 차원마다 다른 주파수의 사인파와 코사인파를 배정하여, 각 위치를 고유한 주파수 패턴으로 표현한다. i가 작은 차원은 주파수가 높아 인접 위치를 세밀하게 구분하고, i가 큰 차원은 주파수가 낮아 멀리 떨어진 위치 간 관계를 인코딩한다. 이 구조는 푸리에 급수에서 서로 다른 주파수의 기저 함수를 조합하여 임의의 함수를 표현하는 것과 동일한 원리다. Vaswani et al.은 이 고정 인코딩이 학습 가능한 위치 인코딩과 거의 동등한 성능을 보인다고 보고했으며, 학습 시 보지 못한 더 긴 시퀀스에 대한 외삽(extrapolation) 가능성이라는 추가 이점을 가진다.

Lee-Thorp et al.(2021)의 **FNet**은 한 걸음 더 나아간다. Transformer의 self-attention 레이어를 2D FFT로 완전히 대체한 것이다. 시퀀스 차원과 히든 차원 각각에 FFT를 적용하여 토큰 간 전역 혼합(global mixing)을 O(N log N)으로 달성한다. self-attention의 O(N^2)에 비해 계산 효율이 크게 개선되면서도 BERT 정확도의 92-97%를 유지했다. 이 결과는 Transformer가 학습하는 어텐션 패턴의 상당 부분이 전역적 주파수 혼합으로 근사될 수 있음을 시사한다. 다만 FNet은 토큰의 의미에 따라 가중치를 달리하는 맥락 의존적 어텐션(context-dependent attention)을 포기하기 때문에, 동음이의어 처리 같은 과제에서는 한계가 있다.

## 현대 AI 기법과의 연결 정리

각 연결의 성격을 구분하면 다음과 같다.

**동일한 수학의 직접 적용:**

- **CNN의 합성곱 연산**: 합성곱 정리에 의해, CNN의 공간 영역 합성곱은 주파수 영역 곱셈과 수학적으로 동치다. FFT 기반 합성곱은 큰 커널이나 큰 입력에서 실제로 더 빠르다. 이것은 영감이나 유사성이 아니라 같은 연산의 두 가지 계산 방식이다.
- **Transformer 위치 인코딩**: 푸리에 급수의 사인-코사인 기저 함수를 직접 사용한다. 서로 다른 주파수의 주기 함수로 위치를 인코딩하는 설계가 푸리에 분석에서 직접 차용된 것이다.
- **FNet**: FFT를 어텐션 대체물로 직접 사용한다. 주파수 영역에서의 전역 혼합이 어텐션의 전역 상호작용을 근사한다.

**구조적 유사성을 공유하는 독립적 발전:**

- **음성 인식의 MFCC/멜 스펙트로그램**: 음성 신호를 Short-Time Fourier Transform(STFT)으로 시간-주파수 표현으로 바꾼 뒤, 인간 청각 특성을 반영한 멜 스케일로 변환한 것이다. 이것은 전통 신호 처리의 직접 계승이며, 딥러닝 이전부터 음성 인식의 표준 전처리였다. 현대 모델(Whisper 등)도 입력 단계에서 이 변환을 사용한다.
- **주파수 관점의 정규화 해석**: 신경망의 정규화 기법(드롭아웃, 가중치 감쇠 등)을 "고주파 성분을 억제하는 저역 통과 필터"로 해석하는 관점이 있다. 과적합은 훈련 데이터의 노이즈(고주파)까지 학습하는 것이고, 정규화는 이를 걸러내는 것이라는 비유다. 이것은 사후적 해석 프레임워크이지, 정규화 기법이 푸리에 이론에서 영감을 받아 설계된 것은 아니다.

## 한계와 약점

- **고정 기저의 한계**: 사인과 코사인은 미리 정해진 기저 함수다. CNN과 Transformer는 데이터에서 기저를 학습한다. 특정 도메인(의료 영상, 자연어 등)에 최적화된 학습 기저가 범용 푸리에 기저보다 효율적일 수 있다.
- **Gibbs 현상**: 불연속점(이미지의 날카로운 경계 등) 근처에서 푸리에 급수의 부분합이 약 9%의 과도한 진동(ringing)을 보인다. 이 때문에 이미지 처리에서는 국소적 특성을 잘 포착하는 웨이블릿(wavelet) 변환이 대안으로 사용된다.
- **시간-주파수 해상도 트레이드오프**: 짧은 시간 구간을 분석하면 "언제"는 정확히 알지만 "어떤 주파수"인지 흐려지고, 긴 구간을 분석하면 주파수는 정확하지만 시간 위치가 흐려진다. 이 근본적 한계 때문에 음성 인식에서는 STFT나 멜 스펙트로그램 같은 절충안이 필요하다.
- **FNet의 맥락 무관성**: FFT 기반 토큰 혼합은 내용과 무관하게(content-agnostic) 작동한다. 같은 단어가 문맥에 따라 다른 의미를 가질 때 이를 구분하는 능력이 없다. self-attention이 포기할 수 없는 이유다.

## 용어 정리

기저 함수(basis function) - 복잡한 함수를 표현하기 위해 조합하는 기본 구성 요소. 푸리에 분석에서는 사인파와 코사인파가 기저 함수다

스펙트럼(spectrum) - 신호를 구성하는 각 주파수 성분의 세기와 위상 분포를 나타낸 것

이산 푸리에 변환(DFT) - 연속이 아닌 이산 샘플 데이터에 적용하는 푸리에 변환. N개 샘플에서 N개 주파수 성분을 추출한다

고속 푸리에 변환(FFT) - DFT를 분할 정복으로 O(N^2)에서 O(N log N)으로 가속하는 알고리즘

합성곱 정리(convolution theorem) - 시간/공간 영역의 합성곱이 주파수 영역의 원소별 곱셈과 수학적으로 동치라는 정리

위상(phase) - 주파수 성분의 시간상 위치. 같은 주파수, 같은 세기라도 위상이 다르면 파형의 모양이 달라진다

위치 인코딩(positional encoding) - Transformer에서 토큰의 순서 정보를 벡터로 표현하는 기법. 서로 다른 주파수의 사인-코사인 함수를 사용한다

Gibbs 현상(Gibbs phenomenon) - 불연속점 근처에서 푸리에 급수의 부분합이 실제 값을 약 9% 초과하는 진동을 보이는 현상

멜 스펙트로그램(mel spectrogram) - 인간 청각이 저주파에 민감하고 고주파에 둔감한 특성을 반영하여 주파수 축을 비선형으로 변환한 스펙트로그램

필터 뱅크(filter bank) - 서로 다른 주파수 대역을 병렬로 분리하는 필터 집합. CNN의 다중 채널 필터에 대응된다
---EN---
Fourier Transform - A mathematical transform that decomposes complex signals into simple frequency components, directly used in CNN convolution operations and Transformer positional encoding

## A Change of Perspective: Decomposing Signals

Pluck a single guitar string and you hear one note. But view that waveform on an oscilloscope and it is not a clean sine wave -- it is a jagged curve. This complex waveform is actually the sum of sine waves at the fundamental frequency (1x) and its integer multiples (2x, 3x, 4x...), each at a different intensity. The **Fourier Transform** is the mathematical tool that separates this combined waveform back into its individual frequency components.

Picture it spatially: a time-domain waveform is like paint colors mixed together, and the Fourier transform is a prism that separates the mixture back into pure colors. Just as a prism splits white light into a rainbow, the Fourier transform decomposes a complex signal into the strength and phase of each frequency component.

Joseph Fourier's core claim in 1807 was this: any periodic function can be reproduced by adding sine and cosine waves of different frequencies in the right proportions. He arrived at this idea while studying heat conduction. The partial differential equation describing heat spreading across a metal plate is difficult to solve directly, but separating it into individual frequency components turns each into an independent simple equation. Lagrange and Laplace were skeptical of the claim that this applied to "any function," but the usefulness of the decomposition method itself was undeniable.

## From Continuous to Discrete, and the FFT

The Fourier series handles periodic functions, and the Continuous Fourier Transform extends to non-periodic functions:

F(w) = integral_{-inf}^{inf} f(t) * e^(-jwt) dt

Here w is frequency, j is the imaginary unit, and f(t) is the time-domain signal. The result F(w) is a complex number whose magnitude represents the strength of that frequency and whose angle (phase) indicates its temporal position.

Since computers cannot handle continuous signals, the **Discrete Fourier Transform** (DFT) is needed, applying to N samples taken at regular intervals:

X(k) = sum_{n=0}^{N-1} x(n) * e^(-j*2*pi*k*n/N), k = 0, 1, ..., N-1

Computing the DFT directly requires calculating every k for every n, costing O(N^2) operations. For N = 1,000 that is 1,000,000 operations; for N = 1,000,000 it is one trillion. The **Fast Fourier Transform** (FFT), published by James Cooley and John Tukey in 1965, uses a divide-and-conquer strategy to recursively decompose an N-point DFT into two N/2-point DFTs, reducing the cost to O(N log N). For N = 1,000,000, one trillion operations drop to roughly 20 million. The idea was actually used by Gauss in 1805 for orbital calculations, though he never published it. FFT became the foundation of digital signal processing and operates today in everything from voice calls to MRI image reconstruction.

## The Convolution Theorem: Mathematical Foundation for AI

The reason the Fourier transform matters in AI is the **convolution theorem**:

F{f * g} = F{f} . F{g}

Convolution in the time (or spatial) domain is equivalent to element-wise multiplication in the frequency domain. Convolution -- the operation of sliding one function over another and computing the overlap area -- costs O(N^2) when computed directly. But sending both signals to the frequency domain via FFT (O(N log N)), performing element-wise multiplication (O(N)), and converting back via inverse FFT (O(N log N)) completes the entire process in O(N log N).

Why does this matter? Because the core operation of CNNs (convolutional neural networks) is convolution. Sliding a filter (kernel) across an input image, multiplying and summing at each position, is convolution. When images are large or kernels are large, the FFT route is faster than direct spatial computation. This is not an analogy -- it is the same mathematical operation computed via a different path.

## From Electrical Engineering to AI: Frequency Filters and CNNs

In electrical engineering, a frequency filter is a circuit that passes or blocks specific frequency bands. A high-pass filter passes only rapidly changing components (high frequencies); a low-pass filter passes only slowly changing components (low frequencies). CNN convolutional filters admit the same frequency-domain interpretation:

- 3x3 edge detection filter --> a **high-pass filter** capturing sharp brightness changes (edges, textures)
- Averaging filter --> a **low-pass filter** smoothing out fine variations
- CNN's multi-channel filters --> a **filter bank** separating different frequency bands in parallel

Rippel, Snoek, and Adams (2015) systematically studied this relationship in "Spectral Representations for Convolutional Neural Networks." Learning CNN filter parameters directly in the frequency domain rather than the spatial domain enables more efficient control of desired frequency characteristics. This work reinterpreted CNN operation through the lens of electrical engineering filter design. The key correspondences are:

- Analog frequency filter --> CNN convolutional kernel
- Bandpass filter --> CNN layer extracting features at a specific scale
- Spectral analysis --> frequency response analysis of learned CNN filters
- Filter design theory --> frequency-domain perspective on CNN architecture design

This connection constitutes **direct mathematical equivalence**. Since CNN convolution and electrical engineering convolution are the same mathematical operation, frequency-domain analysis applies directly.

## Transformer Positional Encoding and FNet

The positional encoding introduced in Vaswani et al.'s (2017) "Attention Is All You Need" directly uses the basis functions of Fourier series. For each token position pos, the following values are assigned:

PE(pos, 2i) = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))

Here i is the dimension index and d_model is the model dimension. Each dimension is assigned a sine or cosine wave of a different frequency, representing each position as a unique frequency pattern. Dimensions with small i have high frequencies that finely distinguish adjacent positions, while dimensions with large i have low frequencies that encode relationships between distant positions. This structure follows the same principle as combining basis functions of different frequencies in Fourier series to represent arbitrary functions. Vaswani et al. reported that this fixed encoding performed nearly on par with learned positional encodings, with the added benefit of potential extrapolation to longer sequences not seen during training.

Lee-Thorp et al.'s (2021) **FNet** takes this a step further. It completely replaces Transformer self-attention layers with 2D FFT. By applying FFT along both the sequence and hidden dimensions, it achieves global token mixing in O(N log N) -- a significant improvement over self-attention's O(N^2) -- while retaining 92-97% of BERT's accuracy. This result suggests that a substantial portion of the attention patterns Transformers learn can be approximated by global frequency mixing. However, FNet sacrifices context-dependent attention that adjusts weights based on token meaning, which limits its performance on tasks like disambiguating words with multiple meanings.

## Organizing Connections to Modern AI

The nature of each connection differs:

**Direct application of the same mathematics:**

- **CNN convolution**: By the convolution theorem, spatial-domain convolution in CNNs is mathematically equivalent to frequency-domain multiplication. FFT-based convolution is genuinely faster for large kernels or inputs. This is not inspiration or analogy -- it is two computational paths for the same operation.
- **Transformer positional encoding**: Directly uses sine-cosine basis functions from Fourier series. The design of encoding positions with periodic functions of different frequencies is borrowed directly from Fourier analysis.
- **FNet**: Directly uses FFT as an attention substitute. Global mixing in the frequency domain approximates the global interaction of attention.

**Independent developments sharing structural similarity:**

- **MFCC/mel spectrograms in speech recognition**: Speech signals are converted to time-frequency representations via Short-Time Fourier Transform (STFT), then to the mel scale reflecting human auditory characteristics. This is a direct continuation of traditional signal processing and was the standard preprocessing for speech recognition long before deep learning. Modern models (Whisper, etc.) still use this transform at the input stage.
- **Frequency-domain interpretation of regularization**: There is a perspective interpreting neural network regularization techniques (dropout, weight decay, etc.) as "low-pass filters suppressing high-frequency components." Overfitting means learning even the noise (high frequency) in training data, and regularization filters it out. This is a post-hoc interpretive framework -- regularization techniques were not designed with inspiration from Fourier theory.

## Limitations and Weaknesses

- **Fixed basis limitation**: Sine and cosine are predetermined basis functions. CNNs and Transformers learn their bases from data. Learned bases optimized for specific domains (medical imaging, natural language, etc.) can be more efficient than Fourier's universal basis.
- **Gibbs phenomenon**: Near discontinuities (sharp edges in images, etc.), partial sums of Fourier series exhibit approximately 9% overshoot oscillation (ringing). This is why wavelet transforms, which better capture local features, are used as alternatives in image processing.
- **Time-frequency resolution tradeoff**: Analyzing short time windows yields precise "when" but blurs "which frequency"; analyzing long windows yields precise frequency but blurs temporal position. This fundamental limitation is why speech recognition requires compromises like STFT or mel spectrograms.
- **FNet's context blindness**: FFT-based token mixing operates content-agnostically. It cannot distinguish when the same word carries different meanings depending on context. This is why self-attention remains indispensable.

## Glossary

Basis function - a fundamental building block combined to represent complex functions. In Fourier analysis, sine and cosine waves serve as basis functions

Spectrum - the distribution of strength and phase across the frequency components that constitute a signal

Discrete Fourier Transform (DFT) - the Fourier transform applied to discrete sampled data rather than continuous signals. Extracts N frequency components from N samples

Fast Fourier Transform (FFT) - an algorithm that accelerates DFT from O(N^2) to O(N log N) using divide-and-conquer

Convolution theorem - the theorem stating that convolution in the time/spatial domain is mathematically equivalent to element-wise multiplication in the frequency domain

Phase - the temporal position of a frequency component. Waves of the same frequency and strength produce different waveforms if their phases differ

Positional encoding - a technique in Transformers that represents token order information as vectors, using sine-cosine functions of different frequencies

Gibbs phenomenon - the phenomenon where partial sums of Fourier series overshoot the actual value by approximately 9% near discontinuities

Mel spectrogram - a spectrogram with a nonlinearly transformed frequency axis reflecting human hearing's greater sensitivity to low frequencies than high frequencies

Filter bank - a set of parallel filters separating different frequency bands, corresponding to CNN's multi-channel filters