---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 푸리에 변환, 주파수 분해, 스펙트럼 분석, FFT, 합성곱, 위치 인코딩, 주파수 필터
keywords_en: Fourier transform, frequency decomposition, spectral analysis, FFT, convolution, positional encoding, frequency filter
---
Fourier Transform and Spectral Analysis - 임의의 신호를 정현파 성분으로 분해하여 주파수 영역에서 분석하는 수학적 변환

## 열 전도에서 시작된 혁명

1807년, Joseph Fourier는 나폴레옹의 이집트 원정에서 돌아온 뒤 열 전도 문제를 연구하면서 놀라운 주장을 했다. **어떤 함수든 삼각함수의 무한 합으로 표현할 수 있다**는 것이다. 당시 Lagrange와 Laplace는 이 주장에 회의적이었지만, Fourier의 직관은 옳았다. 열이 금속판을 따라 퍼져나가는 패턴을 각 주파수 성분별로 분리하면, 복잡한 편미분방정식이 단순한 상미분방정식의 집합으로 변한다.

푸리에 급수의 핵심 공식은 다음과 같다.

f(x) = a_0/2 + sum_{n=1}^{inf} [a_n cos(nx) + b_n sin(nx)]

여기서 a_n과 b_n은 각 주파수 성분의 진폭을 나타내는 계수다. 이 공식이 말하는 것은 명확하다. 아무리 복잡한 파형이라도 서로 다른 주파수의 사인파와 코사인파를 적절히 더하면 재현할 수 있다.

## 연속 신호에서 이산 신호로

Fourier의 원래 이론은 연속 함수를 다루지만, 컴퓨터는 연속 신호를 직접 처리할 수 없다. 디지털 세계에서는 신호를 일정 간격으로 샘플링한 이산 데이터를 다룬다. 연속 푸리에 변환의 공식은 다음과 같다.

F(w) = integral_{-inf}^{inf} f(t) e^(-jwt) dt

이를 이산화한 이산 푸리에 변환(DFT)은 다음과 같다.

X(k) = sum_{n=0}^{N-1} x(n) e^(-j2pi*kn/N),  k = 0, 1, ..., N-1

여기서 j는 허수 단위, N은 샘플 수, k는 주파수 인덱스다. X(k)의 크기(magnitude)는 해당 주파수 성분의 세기를, 위상(phase)은 시간적 위치를 나타낸다. DFT를 직접 계산하면 O(N^2) 연산이 필요하다.

1965년 Cooley와 Tukey가 발표한 고속 푸리에 변환(Fast Fourier Transform, FFT)은 이 연산량을 O(N log N)으로 극적으로 줄였다. 분할 정복(divide-and-conquer) 전략으로 N점 DFT를 두 개의 N/2점 DFT로 재귀적으로 분해하는 것이다. 사실 이 알고리즘의 아이디어는 Gauss가 1805년에 이미 사용했으나 출판하지 않았다. FFT는 20세기 가장 중요한 알고리즘 중 하나로, 디지털 신호 처리 전체의 기반이 되었다.

## 주파수 영역의 직관

푸리에 변환의 핵심 직관은 **관점의 전환**이다. 시간 영역에서 복잡해 보이는 신호가 주파수 영역에서는 단순한 구조를 드러낸다. 음성 신호를 예로 들면, 시간 영역의 파형은 해석하기 어렵지만, 주파수 스펙트럼으로 변환하면 어떤 음높이(주파수)가 얼마나 강한지 직관적으로 보인다.

이 관점 전환이 강력한 이유는 **합성곱 정리**(convolution theorem) 때문이다. 시간 영역에서의 합성곱은 주파수 영역에서의 원소별 곱셈과 같다.

F{f * g} = F{f} . F{g}

시간 영역에서 O(N^2)인 합성곱 연산을, FFT로 주파수 영역에서 O(N log N)으로 수행할 수 있다. 이 성질이 AI에서의 FFT 활용의 수학적 토대가 된다.

## AI로의 연결: 주파수 필터로서의 CNN

CNN의 합성곱 필터(convolutional filter)는 주파수 영역의 관점에서 재해석할 수 있다. 3x3 에지 검출 필터는 본질적으로 고주파(경계, 텍스처)를 통과시키고 저주파(균일 영역)를 차단하는 고역 통과 필터(high-pass filter)다. 반대로 평균 필터는 저역 통과 필터(low-pass filter)로 작동한다.

Rippel et al.(2015)의 "Spectral Representations for Convolutional Neural Networks"는 이 관계를 체계적으로 연구했다. CNN 필터의 파라미터를 공간 영역 대신 주파수 영역에서 직접 학습하면, 주파수 특성을 더 효율적으로 제어할 수 있다. 핵심 대응 관계는 다음과 같다.

- 아날로그 주파수 필터 --> CNN 합성곱 커널
- 대역 통과 필터(bandpass filter) --> 특정 스케일의 특징만 추출하는 CNN 레이어
- 필터 뱅크(filter bank) --> CNN의 다중 채널 필터
- 스펙트럼 분석 --> 학습된 필터의 주파수 응답 분석

더 나아가 FFT를 이용한 효율적 합성곱도 실용적으로 중요하다. 입력 크기가 크거나 커널이 클 때, 공간 영역 합성곱 대신 FFT 기반 합성곱(주파수 영역 곱셈 후 역변환)이 더 빠르다.

## Transformer의 사인-코사인 위치 인코딩

Vaswani et al.(2017)의 "Attention Is All You Need"에서 도입한 위치 인코딩(positional encoding)은 Fourier 분석의 직접적 응용이다. 각 토큰 위치 pos에 대해 다음과 같은 인코딩을 부여한다.

PE(pos, 2i) = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))

여기서 i는 차원 인덱스, d_model은 모델 차원이다. 이 설계가 Fourier 급수와 공유하는 구조는 명확하다. 서로 다른 주파수의 사인파와 코사인파를 사용하여, 각 위치를 고유한 주파수 패턴으로 인코딩한다. 낮은 차원(i가 작을 때)은 고주파로 인접 위치를 구분하고, 높은 차원은 저주파로 전체적 위치 관계를 인코딩한다.

이 사인-코사인 기저는 Fourier 급수의 기저 함수와 동일하다. Vaswani et al.은 학습 가능한 위치 인코딩과 비교했을 때 거의 동등한 성능을 보였다고 보고했으며, 이 고정 인코딩은 학습 시 보지 못한 더 긴 시퀀스에 대한 외삽(extrapolation) 가능성을 제공한다.

## FNet: 어텐션을 FFT로 대체하다

Lee-Thorp et al.(2021)의 FNet은 Fourier 변환과 AI의 관계에서 가장 대담한 실험이다. Transformer의 self-attention 레이어를 2D FFT로 완전히 대체했다. 시퀀스 차원과 히든 차원 각각에 FFT를 적용하여, 토큰 간 전역 혼합(global mixing)을 O(N log N)으로 달성한다. Self-attention의 O(N^2)에 비해 계산 효율이 크게 개선된다.

놀라운 점은 이 단순한 대체로도 BERT 정확도의 92-97%를 유지한다는 것이다. 이는 Transformer에서 학습되는 어텐션 패턴의 상당 부분이 전역적 주파수 혼합으로 근사될 수 있음을 시사한다. 물론 FNet은 토큰별 맥락-의존적 가중치(context-dependent weighting)를 포기하기 때문에 특정 태스크에서는 한계가 있다.

## 한계와 약점

푸리에 변환이 AI에 적용될 때의 근본적 한계를 이해하는 것이 중요하다.

- **고정 기저 함수**: 사인과 코사인은 고정된 기저 함수다. 반면 CNN이나 Transformer는 데이터에서 기저를 학습한다. 학습된 표현(learned representations)은 특정 도메인에 최적화되므로, 범용 기저인 Fourier보다 효율적일 수 있다.
- **Gibbs 현상**: 불연속점 근처에서 Fourier 급수가 과도한 진동(ringing)을 보이는 문제다. 이미지의 날카로운 경계를 Fourier로 표현할 때 아티팩트가 생긴다. 웨이블릿(wavelet) 변환이 이 한계를 부분적으로 해결한다.
- **시간-주파수 트레이드오프**: 하이젠베르크의 불확정성 원리와 유사하게, Fourier 변환에서는 시간 해상도와 주파수 해상도를 동시에 높일 수 없다. 짧은 시간 구간을 분석하면 주파수 해상도가 떨어지고, 긴 구간을 분석하면 시간 해상도가 떨어진다. 이 한계 때문에 음성 인식에서는 Short-Time Fourier Transform(STFT)이나 멜 스펙트로그램 같은 변형이 사용된다.
- **비정상 신호**: Fourier 변환은 본질적으로 정상(stationary) 신호를 가정한다. 주파수 특성이 시간에 따라 변하는 비정상 신호에는 적합하지 않다. 현실의 대부분의 신호(음성, 주가, 센서 데이터)는 비정상이다.
- **FNet의 한계**: FFT 기반 토큰 혼합은 내용 무관(content-agnostic)이다. "나는 은행에 갔다"에서 '은행'이 금융기관인지 강변인지 구분하는 맥락 의존적 어텐션을 Fourier 변환은 제공하지 못한다.

## 용어 정리

푸리에 급수(Fourier series) - 주기 함수를 사인파와 코사인파의 무한 합으로 표현하는 전개 방식

이산 푸리에 변환(Discrete Fourier Transform, DFT) - 이산 신호의 유한 샘플에 대한 푸리에 변환

고속 푸리에 변환(Fast Fourier Transform, FFT) - DFT를 O(N log N)으로 계산하는 분할 정복 알고리즘

합성곱 정리(convolution theorem) - 시간 영역 합성곱이 주파수 영역 원소별 곱셈과 동치라는 정리

위치 인코딩(positional encoding) - Transformer에서 토큰 순서 정보를 벡터로 인코딩하는 기법

스펙트럼(spectrum) - 신호를 구성하는 각 주파수 성분의 크기와 위상 분포

Gibbs 현상(Gibbs phenomenon) - 불연속점 근처에서 Fourier 급수의 부분합이 약 9%의 과도한 진동을 보이는 현상

멜 스펙트로그램(mel spectrogram) - 인간 청각의 주파수 감도를 반영하여 멜 스케일로 변환한 스펙트로그램

필터 뱅크(filter bank) - 서로 다른 주파수 대역을 분리하는 병렬 필터 집합

---EN---
Fourier Transform and Spectral Analysis - A mathematical transform that decomposes arbitrary signals into sinusoidal components for frequency-domain analysis

## A Revolution Born from Heat Conduction

In 1807, Joseph Fourier, recently returned from Napoleon's Egyptian expedition, made a remarkable claim while studying heat conduction: **any function can be represented as an infinite sum of trigonometric functions**. Lagrange and Laplace were skeptical, but Fourier's intuition proved correct. By separating the pattern of heat spreading through a metal plate into individual frequency components, a complex partial differential equation transforms into a set of simple ordinary differential equations.

The core formula of the Fourier series is:

f(x) = a_0/2 + sum_{n=1}^{inf} [a_n cos(nx) + b_n sin(nx)]

Here a_n and b_n are coefficients representing the amplitude of each frequency component. The formula states clearly: no matter how complex a waveform, it can be reproduced by appropriately summing sine and cosine waves of different frequencies.

## From Continuous to Discrete Signals

Fourier's original theory handles continuous functions, but computers cannot process continuous signals directly. In the digital world, we work with discrete data sampled at regular intervals. The continuous Fourier transform formula is:

F(w) = integral_{-inf}^{inf} f(t) e^(-jwt) dt

Its discretized version, the Discrete Fourier Transform (DFT), is:

X(k) = sum_{n=0}^{N-1} x(n) e^(-j2pi*kn/N),  k = 0, 1, ..., N-1

Here j is the imaginary unit, N is the number of samples, and k is the frequency index. The magnitude of X(k) represents the strength of that frequency component, while the phase indicates its temporal position. Direct computation of DFT requires O(N^2) operations.

In 1965, Cooley and Tukey published the Fast Fourier Transform (FFT), dramatically reducing the computational cost to O(N log N). Using a divide-and-conquer strategy, it recursively decomposes an N-point DFT into two N/2-point DFTs. The idea actually dates back to Gauss in 1805, though he never published it. FFT became one of the most important algorithms of the 20th century, forming the foundation of all digital signal processing.

## The Intuition of Frequency Domain

The core intuition of the Fourier transform is a **change of perspective**. Signals that appear complex in the time domain reveal simple structures in the frequency domain. Take a speech signal: the time-domain waveform is difficult to interpret, but transforming it into a frequency spectrum intuitively shows which pitches (frequencies) are present and how strong they are.

This perspective shift is powerful because of the **convolution theorem**: convolution in the time domain equals element-wise multiplication in the frequency domain.

F{f * g} = F{f} . F{g}

The O(N^2) convolution in the time domain can be performed in O(N log N) in the frequency domain via FFT. This property forms the mathematical foundation for FFT applications in AI.

## AI Connection: CNNs as Frequency Filters

CNN convolutional filters can be reinterpreted from a frequency-domain perspective. A 3x3 edge detection filter is essentially a high-pass filter that passes high frequencies (edges, textures) while blocking low frequencies (uniform regions). Conversely, an averaging filter acts as a low-pass filter.

Rippel et al. (2015), in "Spectral Representations for Convolutional Neural Networks," systematically studied this relationship. Learning CNN filter parameters directly in the frequency domain rather than the spatial domain enables more efficient control of frequency characteristics. The key correspondences are:

- Analog frequency filter --> CNN convolutional kernel
- Bandpass filter --> CNN layer extracting features at a specific scale
- Filter bank --> CNN's multi-channel filters
- Spectral analysis --> Frequency response analysis of learned filters

Furthermore, FFT-based efficient convolution is practically important. When inputs or kernels are large, FFT-based convolution (frequency-domain multiplication followed by inverse transform) is faster than spatial-domain convolution.

## Transformer's Sine-Cosine Positional Encoding

The positional encoding introduced in Vaswani et al.'s (2017) "Attention Is All You Need" is a direct application of Fourier analysis. For each token position pos, the following encoding is assigned:

PE(pos, 2i) = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))

Here i is the dimension index and d_model is the model dimension. The shared structure with Fourier series is clear: sine and cosine waves of different frequencies encode each position with a unique frequency pattern. Lower dimensions (small i) use high frequencies to distinguish adjacent positions, while higher dimensions use low frequencies to encode global positional relationships.

These sine-cosine basis functions are identical to the basis functions of Fourier series. Vaswani et al. reported nearly equivalent performance compared to learned positional encodings, and this fixed encoding offers the potential for extrapolation to longer sequences not seen during training.

## FNet: Replacing Attention with FFT

Lee-Thorp et al.'s (2021) FNet represents the boldest experiment in the Fourier-AI relationship. It completely replaces Transformer self-attention layers with 2D FFT. By applying FFT along both the sequence and hidden dimensions, it achieves global token mixing in O(N log N), a significant improvement over self-attention's O(N^2).

Remarkably, this simple replacement retains 92-97% of BERT's accuracy. This suggests that a substantial portion of the attention patterns learned by Transformers can be approximated by global frequency mixing. However, FNet sacrifices context-dependent weighting per token, limiting its performance on certain tasks.

## Limitations and Weaknesses

Understanding the fundamental limitations of applying Fourier transforms to AI is crucial.

- **Fixed basis functions**: Sine and cosine are fixed basis functions. In contrast, CNNs and Transformers learn their bases from data. Learned representations, optimized for specific domains, can be more efficient than Fourier's universal basis.
- **Gibbs phenomenon**: Fourier series exhibit excessive oscillation (ringing) near discontinuities. This creates artifacts when representing sharp edges in images with Fourier methods. Wavelet transforms partially address this limitation.
- **Time-frequency tradeoff**: Analogous to Heisenberg's uncertainty principle, the Fourier transform cannot simultaneously achieve high resolution in both time and frequency. Analyzing short time windows reduces frequency resolution; analyzing long windows reduces temporal resolution. This limitation is why speech recognition uses variants like Short-Time Fourier Transform (STFT) or mel spectrograms.
- **Non-stationary signals**: The Fourier transform inherently assumes stationary signals. It is unsuitable for non-stationary signals whose frequency characteristics change over time. Most real-world signals (speech, stock prices, sensor data) are non-stationary.
- **FNet limitations**: FFT-based token mixing is content-agnostic. It cannot provide the context-dependent attention needed to distinguish homonyms based on surrounding context.

## Glossary

Fourier series - a representation of a periodic function as an infinite sum of sine and cosine waves

Discrete Fourier Transform (DFT) - the Fourier transform applied to a finite set of discrete signal samples

Fast Fourier Transform (FFT) - a divide-and-conquer algorithm computing DFT in O(N log N)

Convolution theorem - the theorem stating that convolution in the time domain equals element-wise multiplication in the frequency domain

Positional encoding - a technique in Transformers that encodes token order information as vectors

Spectrum - the distribution of magnitude and phase across frequency components that constitute a signal

Gibbs phenomenon - the phenomenon where partial sums of Fourier series exhibit approximately 9% overshoot oscillation near discontinuities

Mel spectrogram - a spectrogram converted to the mel scale reflecting human auditory frequency sensitivity

Filter bank - a set of parallel filters that separate different frequency bands
