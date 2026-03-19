---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 나이퀴스트 정리, 샘플링, 에일리어싱, 안티에일리어싱, 대역 제한, 정보 보존, 다운샘플링, 이동 불변성
keywords_en: Nyquist theorem, sampling, aliasing, anti-aliasing, band-limited, information preservation, downsampling, shift invariance
---
Nyquist-Shannon Sampling Theorem - 연속 신호를 이산 샘플로 완벽하게 복원하기 위한 최소 조건을 규정하는 정보 이론의 기본 정리

## 연속에서 이산으로: 통신 공학의 근본 질문

1920년대 AT&T의 전화 네트워크가 대서양을 횡단하면서, 엔지니어들은 비용 문제에 직면했다. 하나의 전선에 여러 통화를 실어 보내려면 연속적인 음성 파형을 일정한 간격으로 찍어서(샘플링) 시분할 다중화해야 했다. 그런데 얼마나 자주 찍어야 원래 목소리를 되살릴 수 있는가?

Harry Nyquist(1928)가 "Certain Topics in Telegraph Transmission Theory"에서 이론적 토대를 놓았다. 대역폭 W Hz를 차지하는 신호를 전송하려면 초당 2W개의 샘플이 필요하다는 것이다. 16년 뒤 Claude Shannon(1949)이 "Communication in the Presence of Noise"에서 잡음 환경까지 포함하여 엄밀한 수학적 증명을 완성했다.

f_s >= 2 * f_max

신호에 포함된 최고 주파수 f_max의 **두 배 이상**으로 샘플링하면 원래의 연속 신호를 **완벽하게** 복원할 수 있다. 이 임계 주파수 2*f_max를 나이퀴스트 율(Nyquist rate)이라 부른다.

직관적으로, 1초에 한 번 출렁이는 파도를 사진으로 기록한다면, 봉우리와 골짜기를 각각 찍으면 -- 최소 2장 -- 파도의 모양을 복원할 수 있다. 1장만 찍으면 봉우리인지 골짜기인지 구분할 수 없다.

## 복원의 수학: sinc 보간과 정보 보존

나이퀴스트 정리의 진정한 힘은 "얼마나 자주 찍어야 하는가"라는 부등식이 아니라, "찍은 샘플로 원래 신호를 정확히 되살릴 수 있다"는 복원 공식에 있다.

x(t) = sum_{n} x(nT) * sinc((t - nT) / T)

T = 1/f_s는 샘플링 간격이고, sinc(u) = sin(pi*u) / (pi*u)다. sinc 함수는 자기 자신의 샘플 점(u = 0)에서 값이 정확히 1이고, 다른 모든 정수 점에서 정확히 0이 된다. 따라서 각 샘플이 서로의 복원을 방해하지 않으면서, 샘플 사이의 빈 구간을 부드럽게 채워 넣는다.

이것은 정보 이론적으로 심대한 의미를 가진다. 대역 제한 신호의 **모든 정보**가 이산 샘플 속에 빠짐없이 보존된다. 연속과 이산 사이에 정보 손실이 전혀 없다는 뜻이다. 연속 세계의 정보를 디지털로 다루는 모든 기술의 이론적 정당성이 여기서 나온다.

## 에일리어싱: 정리를 어기면 벌어지는 일

나이퀴스트 율 미만으로 샘플링하면 **에일리어싱**(aliasing)이 발생한다. 원래의 고주파 성분이 저주파로 위장하여 나타나는 현상이다.

주파수 영역에서 보면, 샘플링은 원래 스펙트럼의 복제본을 f_s 간격으로 반복 배치하는 것과 같다. f_s가 충분히 크면 복제본 사이에 빈 공간이 있어 원본을 분리할 수 있다. f_s < 2*f_max이면 복제본들이 서로 겹치고, 한번 겹치면 되돌릴 수 없다.

일상적 사례가 영화에서 자동차 바퀴가 거꾸로 도는 것처럼 보이는 현상이다. 카메라가 초당 24프레임으로 촬영하는데, 바퀴의 회전 주파수가 12Hz(나이퀴스트 주파수)를 넘으면 역방향으로 기록된다.

따라서 실제 시스템에서는 샘플링 전에 **안티에일리어싱 필터**(anti-aliasing filter)를 적용하여 나이퀴스트 주파수 이상의 성분을 미리 제거한다. 모든 ADC 앞단에 저역 통과 필터가 있는 이유다. 정보를 잃더라도 가짜 정보가 생기는 것보다 낫다는 공학적 판단이다.

## 전기공학에서 딥러닝으로

나이퀴스트 정리가 다루는 에일리어싱 문제는 아날로그 신호에만 국한되지 않는다. CNN에서 스트라이드 합성곱이나 풀링으로 특징 맵의 해상도를 줄일 때도 동일한 원리가 작동한다. 이 연결을 명확히 드러낸 것이 Richard Zhang(2019)의 "Making Convolutional Networks Shift-Invariant Again"이다.

핵심 관찰은 이것이다. CNN에서 stride-2 합성곱이나 맥스 풀링은 특징 맵의 해상도를 절반으로 줄이는데, 이것은 신호 처리의 다운샘플링과 동일한 연산이다. 이 다운샘플링이 안티에일리어싱 없이 수행되면, 입력 이미지를 1픽셀만 이동해도 출력이 크게 달라진다.

대응 관계를 정리하면 다음과 같다.

- 연속 신호 --> CNN 특징 맵
- 샘플링 주파수 f_s --> 1/stride (스트라이드의 역수)
- 안티에일리어싱 필터 --> 블러 커널 (가우시안 저역 통과 필터)
- 에일리어싱 --> 이동에 따른 출력 불안정성
- 나이퀴스트 율 위반 --> stride가 특징 맵의 공간 주파수에 비해 너무 큼

## 핵심 트레이드오프: 정보 보존 대 계산 비용

나이퀴스트 정리가 드러내는 근본적 트레이드오프는 **정보 보존과 자원 소비 사이의 긴장**이다.

- **과소 샘플링**(f_s < 2*f_max): 에일리어싱 발생, 정보가 비가역적으로 왜곡된다. CNN에서 stride를 공격적으로 키우면 계산은 빨라지지만 이동 불변성이 깨진다
- **나이퀴스트 율 샘플링**(f_s = 2*f_max): 이론적으로 완벽한 복원이 가능하지만, 이상적인 sinc 필터를 구현할 수 없어 약간의 마진이 필요하다
- **과다 샘플링**(f_s >> 2*f_max): 정보는 확실히 보존되지만, 데이터 크기와 계산량이 불필요하게 증가한다. AI에서 입력 해상도를 높이면 메모리와 연산 비용이 해상도의 제곱에 비례하여 급증한다

CD 오디오가 이 트레이드오프의 대표적 사례다. 인간의 청각 한계인 20kHz를 복원하기 위해 나이퀴스트 율 40kHz보다 약간 높은 44.1kHz를 채택했다. 10%의 여유분은 현실적인 안티에일리어싱 필터의 불완전함을 보상하기 위한 것이다.

## 현대 AI 기법과의 연결

**동일한 원리의 직접 적용:**

- **CNN 안티에일리어싱**: Zhang(2019)이 보인 것처럼, CNN의 다운샘플링에 에일리어싱이 발생하며, 신호 처리와 동일한 블러 필터를 삽입하여 해결한다. 나이퀴스트 정리에서 직접 영감을 받았음이 명확하다
- **이미지 다운샘플링**: 고해상도 이미지를 저해상도로 축소하는 모든 알고리즘(bilinear, bicubic, Lanczos)은 내부적으로 안티에일리어싱 필터링을 수행한다. AI 학습 데이터 전처리에서 이미지 리사이징은 이 정리의 일상적 적용이다

**동일한 직관을 독립적으로 공유하는 구조적 유사성:**

- **스트라이드 합성곱과 다운샘플링**: CNN에서 stride-2 합성곱은 특징 맵의 공간 해상도를 절반으로 줄이는데, 이는 신호 처리에서 2배 다운샘플링과 수학적으로 동일한 연산이다. 스트라이드가 특징 맵의 공간 주파수에 비해 클수록, 나이퀴스트 율 위반에 해당하는 에일리어싱이 발생한다. 다만 CNN 설계자들이 나이퀴스트 정리를 의식하고 스트라이드를 정한 것은 아니며, Zhang(2019) 이전까지 이 연결은 명시적으로 인식되지 않았다
- **토큰화와 이산화**: 텍스트를 토큰으로 분할하는 과정은 연속적인 언어를 이산 단위로 변환한다는 점에서 샘플링과 구조적으로 유사하다. 토큰 단위가 너무 크면(과소 샘플링) 의미의 미세한 차이가 손실되고, 너무 작으면(과다 샘플링) 시퀀스가 불필요하게 길어져 계산 비용이 증가한다
- **신경망의 스펙트럼 편향과 주파수 학습**: 신경망이 저주파 패턴을 먼저 학습하고 고주파 디테일은 나중에 포착하는 스펙트럼 편향(spectral bias)은, 나이퀴스트 정리의 "주파수에 따른 정보 보존 한계"라는 사고방식과 간접적으로 맞닿아 있다

## 한계와 약점

- **대역 제한 가정의 비현실성**: 정리는 신호가 특정 주파수 이상의 성분을 전혀 포함하지 않는다고 가정한다. 그러나 자연 이미지의 날카로운 경계 등은 이론적으로 무한대 주파수 성분을 포함한다. 실무에서는 에너지가 무시할 수준으로 감쇠하는 주파수를 실질적 상한으로 사용한다
- **무한 sinc 보간의 비실용성**: 완벽한 복원에 필요한 sinc 함수는 양방향으로 무한히 뻗어나간다. 실제로는 유한 길이 필터로 근사하며, 미소한 복원 오차를 수반한다
- **CNN과의 유비 한계**: Zhang(2019)의 블러 필터 삽입은 효과적이지만, CNN 특징 맵의 주파수 특성은 학습 과정에서 계속 변하며, 고정된 블러 커널이 모든 학습 단계에서 최적이라는 보장은 없다. 직접적 영감이되 완전한 이론적 대응은 아닌 공학적 휴리스틱에 가깝다
- **고차원 확장 어려움**: 원래 정리는 1차원 시계열에 대해 증명되었다. 2차원 이미지나 고차원 특징 공간으로 확장할 때 "최고 주파수"의 정의가 방향에 따라 달라지며, 이방성 에일리어싱 문제가 발생한다

## 용어 정리

나이퀴스트 율(Nyquist rate) - 대역 제한 신호를 완벽히 복원하기 위한 최소 샘플링 주파수, 신호의 최고 주파수의 정확히 2배

에일리어싱(aliasing) - 샘플링 주파수가 부족할 때 고주파 성분이 저주파로 위장되어 나타나는 비가역적 왜곡 현상

안티에일리어싱 필터(anti-aliasing filter) - 샘플링 전에 나이퀴스트 주파수 이상의 성분을 제거하는 저역 통과 필터

대역 제한(band-limited) - 특정 최대 주파수 이상의 성분이 전혀 없는 신호의 성질, 나이퀴스트 정리의 전제 조건

sinc 함수(sinc function) - sinc(x) = sin(pi*x)/(pi*x), 이상적 저역 통과 필터의 시간 영역 표현이자 샘플링 복원의 보간 함수

스트라이드(stride) - CNN에서 합성곱 필터가 이동하는 픽셀 간격, 출력 해상도를 결정하며 다운샘플링의 비율을 정한다

이동 불변성(shift invariance) - 입력이 이동하면 출력도 동일하게 이동하는 성질, CNN이 이상적으로 가져야 할 속성이나 에일리어싱으로 위반된다

스펙트럼 편향(spectral bias) - 신경망이 학습 초기에 저주파 성분을 먼저 학습하고 고주파 디테일은 나중에야 포착하는 경향
---EN---
Nyquist-Shannon Sampling Theorem - A foundational theorem in information theory specifying the minimum condition for perfectly reconstructing a continuous signal from discrete samples

## From Continuous to Discrete: A Fundamental Question in Communications Engineering

In the 1920s, as AT&T's telephone network began spanning the Atlantic, engineers faced a cost problem. Carrying multiple conversations over a single wire required sampling the continuous voice waveform at regular intervals for time-division multiplexing. But how often must those samples be taken to recover the original voice?

Harry Nyquist (1928) laid the theoretical groundwork in "Certain Topics in Telegraph Transmission Theory." He showed that transmitting a signal occupying bandwidth W Hz requires 2W samples per second. Sixteen years later, Claude Shannon (1949) completed the rigorous mathematical proof in "Communication in the Presence of Noise."

f_s >= 2 * f_max

Sampling at **at least twice** the signal's highest frequency f_max enables **perfect** reconstruction. This critical frequency 2*f_max is called the Nyquist rate.

The intuition: photographing a wave that oscillates once per second, capture the peak and the trough -- a minimum of 2 shots -- and you can reconstruct its shape. With only 1 shot, you cannot distinguish a peak from a trough or a flat surface.

## The Mathematics of Reconstruction: sinc Interpolation and Information Preservation

The true power of the Nyquist theorem lies not in the inequality but in the reconstruction formula:

x(t) = sum_{n} x(nT) * sinc((t - nT) / T)

Here T = 1/f_s is the sampling interval and sinc(u) = sin(pi*u)/(pi*u). The sinc function equals exactly 1 at its own sample point (u = 0) and exactly 0 at every other integer point. Each sample fills in gaps smoothly without interfering with its neighbors.

The information-theoretic implications are profound. **All information** in a band-limited signal is preserved in its discrete samples. There is zero information loss between continuous and discrete representations. The theoretical justification for every technology that handles continuous-world information digitally originates here.

## Aliasing: What Happens When the Theorem Is Violated

Sampling below the Nyquist rate produces **aliasing** -- high-frequency components masquerading as low-frequency ones.

In the frequency domain, sampling places periodic copies of the spectrum at intervals of f_s. When f_s is large enough, copies are isolated. When f_s < 2*f_max, copies overlap irreversibly.

A familiar example: car wheels appearing to spin backward in movies. At 24 fps, rotation above 12 Hz (Nyquist frequency) appears reversed.

Practical systems apply an **anti-aliasing filter** before sampling. This is why every ADC has a low-pass filter at its input. Losing information is preferable to creating false information.

## From Electrical Engineering to Deep Learning

The aliasing problem is not confined to analog signals. The same principle operates in CNNs. Richard Zhang's (2019) "Making Convolutional Networks Shift-Invariant Again" diagnosed a chronic CNN problem -- shift invariance violation -- as stemming from aliasing.

The key observation: stride-2 convolutions and max pooling halve feature map resolution -- exactly downsampling. Without anti-aliasing, a single-pixel input shift can dramatically change outputs.

The correspondences:

- Continuous signal --> CNN feature map
- Sampling frequency f_s --> 1/stride
- Anti-aliasing filter --> blur kernel (Gaussian low-pass filter)
- Aliasing --> output instability under translation
- Nyquist rate violation --> stride too large relative to feature map spatial frequency

## The Core Tradeoff: Information Preservation vs. Computational Cost

The fundamental tradeoff is the **tension between preserving information and consuming resources**.

- **Undersampling** (f_s < 2*f_max): aliasing, irreversible distortion. In CNNs, aggressive strides speed computation but break shift invariance
- **Nyquist-rate sampling** (f_s = 2*f_max): theoretically perfect but requires margin for impractical ideal filters
- **Oversampling** (f_s >> 2*f_max): reliable preservation but unnecessary data size and computation increase. In AI, higher resolution means memory and compute scaling quadratically

CD audio exemplifies this tradeoff. To reproduce 20 kHz (human hearing limit), 44.1 kHz was adopted -- slightly above the 40 kHz Nyquist rate, with 10% margin compensating for imperfect filters.

## Connections to Modern AI

**Direct application of the same principle:**

- **CNN anti-aliasing**: Zhang (2019) showed that CNN downsampling produces aliasing, solved by inserting signal-processing blur filters. Directly inspired by the Nyquist theorem
- **Image downsampling**: Every resolution-reduction algorithm (bilinear, bicubic, Lanczos) performs internal anti-aliasing. Image resizing in AI data preprocessing is a routine application

**Structural similarities sharing the same intuition independently:**

- **Strided convolutions and downsampling**: Stride-2 convolutions in CNNs halve feature map spatial resolution -- mathematically the same operation as 2x downsampling in signal processing. The larger the stride relative to the feature map's spatial frequency, the more aliasing occurs -- analogous to violating the Nyquist rate. However, CNN designers did not consciously set strides based on the Nyquist theorem; this connection was not explicitly recognized until Zhang (2019)
- **Tokenization and discretization**: Splitting text into tokens is structurally similar to sampling, in that continuous language is converted to discrete units. Tokens that are too large (undersampling) lose subtle semantic differences; tokens that are too small (oversampling) create unnecessarily long sequences and increased computation
- **Spectral bias and frequency learning in neural networks**: The spectral bias phenomenon -- where networks learn low-frequency patterns first and capture high-frequency detail later -- indirectly connects to the Nyquist theorem's framing of "frequency-dependent limits on information preservation"

## Limitations and Weaknesses

- **Unrealistic band-limited assumption**: The theorem assumes no frequency components above a certain limit. Natural images' sharp edges theoretically contain infinite frequency components. In practice, the frequency where energy becomes negligible serves as the practical upper bound
- **Impractical infinite sinc interpolation**: Perfect reconstruction requires infinite sinc, approximated in practice by finite-length filters with minor errors
- **CNN analogy limits**: Zhang's blur filter is effective but CNN feature map frequency characteristics change during training, and a fixed blur kernel may not be optimal at every stage. This is an engineering heuristic rather than a complete theoretical correspondence
- **High-dimensional extension difficulty**: The original theorem was proven for 1D time series. Extending to 2D images and high-dimensional feature spaces introduces direction-dependent "highest frequency" definitions and anisotropic aliasing

## Glossary

Nyquist rate - the minimum sampling frequency for perfect reconstruction of a band-limited signal, exactly twice the highest frequency

Aliasing - irreversible distortion where high-frequency components masquerade as low-frequency ones when sampling rate is insufficient

Anti-aliasing filter - a low-pass filter removing components above the Nyquist frequency before sampling

Band-limited - a signal property of containing no components above a specified maximum frequency, the Nyquist theorem's precondition

sinc function - sinc(x) = sin(pi*x)/(pi*x), the ideal low-pass filter's time-domain representation and sampling reconstruction interpolation function

Stride - the pixel interval at which a CNN convolution filter moves, determining output resolution and downsampling ratio

Shift invariance - the property where translating the input produces an equivalently translated output, an ideal CNN property violated by aliasing

Spectral bias - the tendency of neural networks to learn low-frequency components first during early training, capturing high-frequency detail only later
