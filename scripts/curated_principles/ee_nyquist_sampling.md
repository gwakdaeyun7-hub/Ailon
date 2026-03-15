---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 나이퀴스트 정리, 샘플링, 에일리어싱, 안티에일리어싱, 대역 제한, 정보 보존, 다운샘플링, 이동 불변성
keywords_en: Nyquist theorem, sampling, aliasing, anti-aliasing, band-limited, information preservation, downsampling, shift invariance
---
Nyquist-Shannon Sampling Theorem - 연속 신호를 이산 샘플로 완벽하게 복원하기 위한 최소 조건을 규정하는 정보 이론의 기본 정리

## 연속에서 이산으로: 통신 공학의 근본 질문

1920년대 미국 AT&T의 전화 네트워크가 대서양을 횡단하기 시작하면서, 엔지니어들은 비용 문제에 직면했다. 하나의 전선에 여러 통화를 실어 보내려면 연속적인 음성 파형을 일정한 간격으로 찍어서(샘플링) 시분할(time-division) 다중화해야 했다. 그런데 얼마나 자주 찍어야 원래 목소리를 되살릴 수 있는가?

Harry Nyquist(1928)가 "Certain Topics in Telegraph Transmission Theory"에서 이 문제의 이론적 토대를 놓았다. 그는 대역폭 W Hz를 차지하는 신호를 전송하려면 초당 2W개의 샘플이 필요하다는 것을 보였다. 16년 뒤 Claude Shannon(1949)이 "Communication in the Presence of Noise"에서 잡음 환경까지 포함하여 엄밀한 수학적 증명을 완성했다. 결론은 놀랍도록 간결하다.

f_s >= 2 * f_max

신호에 포함된 최고 주파수 f_max의 **두 배 이상**으로 샘플링하면 원래의 연속 신호를 **완벽하게** 복원할 수 있다. 이 임계 주파수 2*f_max를 나이퀴스트 율(Nyquist rate)이라 부른다.

직관적으로 이해하면 이렇다. 1초에 한 번 출렁이는 파도를 사진으로 기록한다고 하자. 봉우리를 찍고, 골짜기를 찍으면 -- 최소 2장 -- 파도의 모양을 복원할 수 있다. 1장만 찍으면 봉우리인지 골짜기인지, 아니면 잔잔한 수면인지 구분할 수 없다.

## 복원의 수학: sinc 보간과 정보 보존

나이퀴스트 정리의 진정한 힘은 "얼마나 자주 찍어야 하는가"라는 부등식이 아니라, "찍은 샘플로 원래 신호를 정확히 되살릴 수 있다"는 복원 공식에 있다.

x(t) = sum_{n} x(nT) * sinc((t - nT) / T)

여기서 T = 1/f_s는 샘플링 간격이고, sinc(u) = sin(pi*u) / (pi*u)다. 이 공식이 작동하는 이유는 sinc 함수의 독특한 성질에 있다. sinc 함수는 자기 자신의 샘플 점(u = 0)에서 값이 정확히 1이고, 다른 모든 정수 점(u = 1, 2, 3, ...)에서 정확히 0이 된다. 따라서 각 샘플이 서로의 복원을 방해하지 않으면서, 샘플 사이의 빈 구간을 부드럽게 채워 넣는다.

이것은 정보 이론적으로 심대한 의미를 가진다. 대역 제한 신호의 **모든 정보**가 이산 샘플 속에 빠짐없이 보존된다. 연속과 이산 사이에 정보 손실이 전혀 없다는 뜻이다. Shannon이 이 정리를 자신의 정보 이론 체계 안에 배치한 것은 우연이 아니다. 연속 세계의 정보를 디지털로 다루는 모든 기술의 이론적 정당성이 여기서 나온다.

## 에일리어싱: 정리를 어기면 벌어지는 일

나이퀴스트 율 미만으로 샘플링하면 **에일리어싱**(aliasing)이 발생한다. 원래의 고주파 성분이 저주파로 위장하여 나타나는 현상이다.

왜 이런 일이 생기는가? 주파수 영역에서 보면, 샘플링은 원래 스펙트럼의 복제본을 f_s 간격으로 반복 배치하는 것과 같다. f_s가 충분히 크면 복제본들 사이에 빈 공간이 있어 원본을 분리해낼 수 있다. 그런데 f_s < 2*f_max이면 복제본들이 서로 겹치고, 겹친 부분은 원래 어느 주파수에서 온 것인지 구분할 수 없게 된다. 한번 겹치면 되돌릴 수 없다.

일상에서 흔히 보이는 사례가 있다. 영화에서 자동차 바퀴가 거꾸로 도는 것처럼 보이는 현상이다. 영화 카메라가 초당 24프레임으로 촬영하는데, 바퀴의 회전 주파수가 12Hz(나이퀴스트 주파수)를 넘으면 실제보다 느리거나 역방향으로 회전하는 것처럼 기록된다. 13Hz 회전이 11Hz 역회전으로 나타나는 식이다.

따라서 실제 시스템에서는 샘플링 전에 **안티에일리어싱 필터**(anti-aliasing filter)를 적용하여 나이퀴스트 주파수 이상의 성분을 미리 제거한다. 모든 ADC(아날로그-디지털 변환기) 앞단에 저역 통과 필터가 반드시 있는 이유다. 정보를 잃더라도 가짜 정보가 생기는 것보다는 낫다는 공학적 판단이다.

## 전기공학에서 딥러닝으로

나이퀴스트 정리가 AI에 직접 연결된 계기는 Richard Zhang(2019)의 "Making Convolutional Networks Shift-Invariant Again"이다. 이 논문은 CNN의 고질적 문제였던 이동 불변성(shift invariance) 위반이 에일리어싱에서 비롯된다는 것을 신호 처리의 언어로 진단했다.

핵심 관찰은 이것이다. CNN에서 stride-2 합성곱이나 맥스 풀링은 특징 맵(feature map)의 공간 해상도를 절반으로 줄인다. 이것은 신호 처리에서 다운샘플링과 정확히 같은 연산이다. 그런데 이 다운샘플링이 안티에일리어싱 없이 수행된다. 특징 맵에 높은 공간 주파수 성분이 있으면, 정리가 위반되어 에일리어싱이 발생한다. 그 결과 입력 이미지를 1픽셀만 이동해도 출력이 크게 달라진다.

대응 관계를 정리하면 다음과 같다.

- 연속 신호 --> CNN 특징 맵
- 샘플링 주파수 f_s --> 1/stride (스트라이드의 역수)
- 안티에일리어싱 필터 --> 블러 커널 (가우시안 저역 통과 필터)
- 에일리어싱 --> 이동에 따른 출력 불안정성
- 나이퀴스트 율 위반 --> stride가 특징 맵의 공간 주파수에 비해 너무 큼

Zhang의 해법은 ADC 설계와 동일한 원리를 따른다. 맥스 풀링이나 스트라이드 합성곱 전에 **블러 필터**(가우시안 커널)를 삽입한다. ImageNet 실험에서 이 한 줄의 수정으로 이동 일관성이 크게 개선되었고, 분류 정확도도 소폭 향상되었다.

## 핵심 트레이드오프: 정보 보존 대 계산 비용

나이퀴스트 정리가 드러내는 근본적 트레이드오프는 **정보 보존과 자원 소비 사이의 긴장**이다.

- **과소 샘플링**(f_s < 2*f_max): 에일리어싱 발생, 정보가 비가역적으로 왜곡된다. CNN에서 stride를 공격적으로 키우면 계산은 빨라지지만 이동 불변성이 깨진다.
- **나이퀴스트 율 샘플링**(f_s = 2*f_max): 이론적으로 완벽한 복원이 가능하지만, 현실에서는 이상적인 sinc 필터를 구현할 수 없어 약간의 마진이 필요하다.
- **과다 샘플링**(f_s >> 2*f_max): 정보는 확실히 보존되지만, 데이터 크기와 계산량이 불필요하게 증가한다. AI에서 입력 해상도를 높이면 고주파 디테일은 유지되지만, 메모리와 연산 비용이 해상도의 제곱에 비례하여 급증한다.

CD 오디오가 이 트레이드오프의 대표적 사례다. 인간의 청각 한계인 20kHz를 복원하기 위해 나이퀴스트 율 40kHz보다 약간 높은 44.1kHz를 채택했다. 10%의 여유분은 현실적인 안티에일리어싱 필터의 불완전함을 보상하기 위한 것이다.

## 이론적 심화: 주파수 영역의 이중성

나이퀴스트 정리의 수학적 핵심은 시간 영역과 주파수 영역의 **쌍대성**(duality)에 있다.

시간 영역에서 신호를 T 간격으로 샘플링하면, 주파수 영역에서는 원래 스펙트럼 X(f)가 f_s = 1/T 간격으로 무한히 복제된다. 이것을 수식으로 쓰면 다음과 같다.

X_s(f) = (1/T) * sum_{k} X(f - k*f_s)

k = 0이 원본, k = 1, -1, 2, -2, ... 이 복제본이다. 원본의 최고 주파수가 f_max이고 f_s >= 2*f_max이면, 복제본 간에 겹침이 없으므로 이상적 저역 통과 필터(차단 주파수 f_s/2)로 원본만 꺼낼 수 있다. 이 이상적 저역 통과 필터의 시간 영역 임펄스 응답이 바로 sinc 함수다. 즉 주파수 영역에서 "잘라내기"와 시간 영역에서 "sinc로 보간하기"는 수학적으로 동일한 연산의 두 얼굴이다.

이 이중성이 CNN에도 작동한다. 특징 맵을 공간 주파수 관점에서 보면, stride-2 연산은 공간 주파수 축에서 스펙트럼 복제를 일으키고, 블러 필터는 고주파 복제본이 원본과 겹치기 전에 제거하는 역할을 한다.

## 현대 AI 기법과의 연결

나이퀴스트 정리의 원리는 현대 AI 곳곳에서 작동한다. 다만 각 연결의 성격은 뚜렷이 다르다.

**동일한 원리의 직접 적용:**

- **CNN 안티에일리어싱**: Zhang(2019)이 보인 것처럼, CNN의 다운샘플링에 에일리어싱이 발생하며, 이를 해결하기 위해 신호 처리와 동일한 블러 필터를 삽입한다. 논문 제목부터 제1저자의 학위(신호 처리 배경)까지, 나이퀴스트 정리에서 직접 영감을 받았음이 명확하다.
- **이미지 다운샘플링**: 고해상도 이미지를 저해상도로 축소하는 모든 알고리즘(bilinear, bicubic, Lanczos)은 내부적으로 안티에일리어싱 필터링을 수행한다. 원본의 고주파 디테일이 축소된 해상도의 나이퀴스트 주파수를 초과하면 에일리어싱이 발생하기 때문이다. AI 학습 데이터 전처리에서 이미지 리사이징은 이 정리의 일상적 적용이다.

**동일한 직관을 독립적으로 공유하는 구조적 유사성:**

- **NeRF 위치 인코딩**: Mildenhall et al.(2020)의 NeRF는 3D 좌표를 다양한 주파수의 사인-코사인 함수로 변환한다. gamma(p) = [sin(2^0*pi*p), cos(2^0*pi*p), ..., sin(2^(L-1)*pi*p), cos(2^(L-1)*pi*p)] 형태인데, L(주파수 대역 수)을 장면 복잡도에 맞춰야 한다는 점에서 나이퀴스트 정리의 정신과 맞닿아 있다. 다만 Mildenhall의 논문은 나이퀴스트 정리를 직접 인용하지 않으며, 이론적 동기는 MLP의 스펙트럼 편향(Rahaman et al., 2019) 극복에 있었다.
- **Super-resolution 네트워크**: 저해상도 이미지에서 고주파 디테일을 생성하는 네트워크(SRCNN, ESRGAN 등)는 나이퀴스트 율 미만으로 샘플링된 정보를 학습된 사전 확률(prior)로 추정하는 것이다. 정보 이론적으로 소실된 고주파는 복원이 아니라 **추정**이다. 이 구분은 중요하다. 네트워크가 얼마나 정교하든, 원래 없던 정보를 만들어내는 것이지 되살리는 것이 아니다.
- **데이터 증강에서의 다운샘플링 인식**: 학습 데이터를 랜덤 리사이즈할 때 에일리어싱을 방지하기 위해 PIL이나 OpenCV의 안티에일리어싱 옵션을 켜는 것은 나이퀴스트 정리를 암묵적으로 적용하는 실무 관행이다.

## 한계와 약점

- **대역 제한 가정의 비현실성**: 정리는 신호가 특정 주파수 이상의 성분을 전혀 포함하지 않는다고 가정한다. 그러나 자연 이미지의 날카로운 경계, 점 광원 등은 이론적으로 무한대 주파수 성분을 포함한다. 실무에서는 에너지가 무시할 수준으로 감쇠하는 주파수를 실질적 상한으로 사용하는데, 이 "무시할 수준"의 판단은 응용 분야마다 다르다.
- **무한 sinc 보간의 비실용성**: 완벽한 복원에 필요한 sinc 함수는 양방향으로 무한히 뻗어나간다. 실제로는 유한 길이 필터(Lanczos, 카이저 윈도우 등)로 근사하며, 이는 미소한 복원 오차(리플)를 수반한다.
- **CNN과의 유비 한계**: Zhang(2019)의 블러 필터 삽입은 효과적이지만, CNN 특징 맵은 ADC의 아날로그 입력과 근본적으로 다르다. 특징 맵의 주파수 특성은 학습 과정에서 계속 변하며, 고정된 블러 커널이 모든 학습 단계에서 최적이라는 보장은 없다. 이 적용은 직접적 영감이되 완전한 이론적 대응은 아닌, 공학적 휴리스틱에 가깝다.
- **고차원 신호로의 확장 어려움**: 원래 정리는 1차원 시계열 신호에 대해 증명되었다. 2차원 이미지, 3차원 비디오, 고차원 특징 공간으로 확장할 때 "최고 주파수"의 정의가 방향에 따라 달라지며, 이방성(anisotropic) 에일리어싱 문제가 발생한다. CNN 특징 맵의 경우 수평/수직/대각 방향의 공간 주파수가 다를 수 있어 단일 스트라이드 값이 모든 방향에 적합하지 않을 수 있다.

## 용어 정리

나이퀴스트 율(Nyquist rate) - 대역 제한 신호를 완벽히 복원하기 위한 최소 샘플링 주파수, 신호의 최고 주파수의 정확히 2배

에일리어싱(aliasing) - 샘플링 주파수가 부족할 때 고주파 성분이 저주파로 위장되어 나타나는 비가역적 왜곡 현상

안티에일리어싱 필터(anti-aliasing filter) - 샘플링 전에 나이퀴스트 주파수 이상의 성분을 제거하는 저역 통과 필터, ADC의 필수 전단 장치

대역 제한(band-limited) - 특정 최대 주파수 이상의 성분이 전혀 없는 신호의 성질, 나이퀴스트 정리의 전제 조건

sinc 함수(sinc function) - sinc(x) = sin(pi*x)/(pi*x), 이상적 저역 통과 필터의 시간 영역 표현이자 샘플링 복원의 보간 함수

스트라이드(stride) - CNN에서 합성곱 필터가 이동하는 픽셀 간격, 출력 해상도를 결정하며 다운샘플링의 비율을 정한다

이동 불변성(shift invariance) - 입력이 이동하면 출력도 동일하게 이동하는 성질, CNN이 이상적으로 가져야 할 속성이나 에일리어싱으로 위반된다

스펙트럼 편향(spectral bias) - 신경망이 학습 초기에 저주파 성분을 먼저 학습하고 고주파 디테일은 나중에야 포착하는 경향

다운샘플링(downsampling) - 신호나 이미지의 샘플 수를 줄이는 연산, 나이퀴스트 조건을 충족하지 않으면 에일리어싱을 수반한다

시분할 다중화(time-division multiplexing) - 하나의 통신 채널을 시간 구간으로 나누어 여러 신호를 번갈아 전송하는 기술, 나이퀴스트 정리가 탄생한 실용적 배경

---EN---
Nyquist-Shannon Sampling Theorem - A foundational theorem in information theory specifying the minimum condition for perfectly reconstructing a continuous signal from discrete samples

## From Continuous to Discrete: A Fundamental Question in Communications Engineering

In the 1920s, as AT&T's telephone network began spanning the Atlantic, engineers faced a cost problem. Carrying multiple conversations over a single wire required sampling the continuous voice waveform at regular intervals for time-division multiplexing. But how often must those samples be taken to recover the original voice?

Harry Nyquist (1928) laid the theoretical groundwork in "Certain Topics in Telegraph Transmission Theory." He showed that transmitting a signal occupying bandwidth W Hz requires 2W samples per second. Sixteen years later, Claude Shannon (1949) completed the rigorous mathematical proof in "Communication in the Presence of Noise," extending the framework to noisy environments. The conclusion is remarkably concise:

f_s >= 2 * f_max

Sampling at **at least twice** the signal's highest frequency component f_max enables **perfect** reconstruction of the original continuous signal. This critical frequency 2*f_max is called the Nyquist rate.

The intuition is straightforward. Imagine photographing a wave that oscillates once per second. Capture the peak and the trough -- a minimum of 2 shots -- and you can reconstruct the wave's shape. With only 1 shot, you cannot tell whether you caught a peak, a trough, or a flat surface.

## The Mathematics of Reconstruction: sinc Interpolation and Information Preservation

The true power of the Nyquist theorem lies not in the inequality "how often to sample" but in the reconstruction formula that says "the original signal can be exactly recovered from its samples."

x(t) = sum_{n} x(nT) * sinc((t - nT) / T)

Here T = 1/f_s is the sampling interval and sinc(u) = sin(pi*u)/(pi*u). This formula works because of a distinctive property of the sinc function: it equals exactly 1 at its own sample point (u = 0) and exactly 0 at every other integer point (u = 1, 2, 3, ...). Each sample therefore fills in the gaps between samples smoothly without interfering with the reconstruction of its neighbors.

The information-theoretic implications are profound. **All information** in a band-limited signal is preserved without exception in its discrete samples. There is zero information loss between continuous and discrete representations. It is no coincidence that Shannon placed this theorem within his information theory framework. The theoretical justification for every technology that handles continuous-world information digitally originates here.

## Aliasing: What Happens When the Theorem Is Violated

Sampling below the Nyquist rate produces **aliasing** -- high-frequency components masquerading as low-frequency ones.

Why does this happen? In the frequency domain, sampling is equivalent to placing periodic copies of the original spectrum at intervals of f_s. When f_s is large enough, there is empty space between copies, and the original can be isolated. But when f_s < 2*f_max, copies overlap, and the overlapping portions become indistinguishable from the original. Once overlapped, the damage is irreversible.

A familiar everyday example: car wheels appearing to spin backward in movies. Film cameras capture 24 frames per second. When the wheel's rotation frequency exceeds 12 Hz (the Nyquist frequency), it appears to rotate more slowly or in reverse. A 13 Hz rotation shows up as an 11 Hz reverse rotation.

Practical systems therefore apply an **anti-aliasing filter** before sampling to remove components above the Nyquist frequency. This is why every ADC (analog-to-digital converter) has a low-pass filter at its input stage. The engineering judgment is clear: losing some information is preferable to creating false information.

## From Electrical Engineering to Deep Learning

The Nyquist theorem's direct connection to AI was established by Richard Zhang's (2019) "Making Convolutional Networks Shift-Invariant Again." This paper diagnosed a chronic CNN problem -- violation of shift invariance -- as stemming from aliasing, using the language of signal processing.

The key observation: in CNNs, stride-2 convolutions and max pooling halve the spatial resolution of feature maps. This is exactly a downsampling operation in signal processing terms. The problem is that this downsampling is performed without anti-aliasing. When feature maps contain high spatial frequency components, the theorem is violated and aliasing occurs. The result: shifting an input image by just one pixel can dramatically change the output.

The correspondences are:

- Continuous signal --> CNN feature map
- Sampling frequency f_s --> 1/stride (inverse of stride)
- Anti-aliasing filter --> blur kernel (Gaussian low-pass filter)
- Aliasing --> output instability under translation
- Nyquist rate violation --> stride too large relative to feature map spatial frequency

Zhang's solution follows the same principle as ADC design: insert a **blur filter** (Gaussian kernel) before max pooling or strided convolution. On ImageNet, this single modification substantially improved shift consistency and modestly improved classification accuracy.

## The Core Tradeoff: Information Preservation vs. Computational Cost

The fundamental tradeoff the Nyquist theorem reveals is the **tension between preserving information and consuming resources**.

- **Undersampling** (f_s < 2*f_max): aliasing occurs, information is irreversibly distorted. In CNNs, aggressive stride increases speed computation but breaks shift invariance.
- **Nyquist-rate sampling** (f_s = 2*f_max): theoretically perfect reconstruction, but in practice the ideal sinc filter cannot be implemented, requiring some margin.
- **Oversampling** (f_s >> 2*f_max): information is reliably preserved, but data size and computation increase unnecessarily. In AI, increasing input resolution preserves high-frequency detail but causes memory and compute costs to scale quadratically with resolution.

CD audio is the canonical example of this tradeoff. To reproduce the human hearing limit of 20 kHz, a sampling rate of 44.1 kHz was adopted -- slightly above the Nyquist rate of 40 kHz. The 10% margin compensates for the imperfection of practical anti-aliasing filters.

## Theoretical Deep Dive: Duality in the Frequency Domain

The mathematical core of the Nyquist theorem lies in the **duality** between the time domain and the frequency domain.

Sampling a signal at interval T in the time domain produces periodic copies of the original spectrum X(f) at intervals of f_s = 1/T in the frequency domain:

X_s(f) = (1/T) * sum_{k} X(f - k*f_s)

k = 0 is the original; k = 1, -1, 2, -2, ... are the copies. When the signal's highest frequency is f_max and f_s >= 2*f_max, the copies do not overlap, so an ideal low-pass filter (cutoff at f_s/2) can extract the original alone. The time-domain impulse response of this ideal low-pass filter is precisely the sinc function. That is, "cutting out" in the frequency domain and "interpolating with sinc" in the time domain are two faces of the same mathematical operation.

This duality operates in CNNs as well. Viewing feature maps through the lens of spatial frequency, a stride-2 operation causes spectral replication along the spatial frequency axis, and a blur filter removes high-frequency copies before they overlap with the original.

## Connections to Modern AI

The principles of the Nyquist theorem are at work throughout modern AI. However, the nature of each connection differs distinctly.

**Direct application of the same principle:**

- **CNN anti-aliasing**: As Zhang (2019) demonstrated, CNN downsampling produces aliasing, and the solution is inserting the same blur filter used in signal processing. From the paper's title to the first author's signal processing background, the direct inspiration from the Nyquist theorem is explicit.
- **Image downsampling**: Every algorithm that reduces high-resolution images to lower resolution (bilinear, bicubic, Lanczos) internally performs anti-aliasing filtering. Aliasing occurs whenever the original's high-frequency details exceed the Nyquist frequency of the target resolution. Image resizing in AI training data preprocessing is a routine application of this theorem.

**Structural similarities sharing the same intuition independently:**

- **NeRF positional encoding**: Mildenhall et al.'s (2020) NeRF transforms 3D coordinates into sine-cosine functions at various frequencies: gamma(p) = [sin(2^0*pi*p), cos(2^0*pi*p), ..., sin(2^(L-1)*pi*p), cos(2^(L-1)*pi*p)]. The need to choose L (number of frequency bands) to match scene complexity resonates with the Nyquist theorem's spirit. However, Mildenhall's paper does not cite the Nyquist theorem directly; the theoretical motivation was overcoming MLP spectral bias (Rahaman et al., 2019).
- **Super-resolution networks**: Networks that generate high-frequency detail from low-resolution images (SRCNN, ESRGAN, etc.) are estimating information that was lost by sampling below the Nyquist rate, using learned priors. Information-theoretically, lost high-frequency content is not reconstructed but **estimated**. This distinction matters: no matter how sophisticated the network, it is generating information that was never there, not recovering it.
- **Anti-aliasing awareness in data augmentation**: Enabling anti-aliasing options in PIL or OpenCV during random resize augmentation is an implicit application of the Nyquist theorem in everyday ML practice.

## Limitations and Weaknesses

- **Unrealistic band-limited assumption**: The theorem assumes signals contain absolutely no frequency components above a certain limit. But natural images' sharp edges, point light sources, and similar features theoretically contain infinite frequency components. In practice, the frequency where energy attenuates to negligible levels serves as the practical upper bound, though what counts as "negligible" varies by application.
- **Impractical infinite sinc interpolation**: Perfect reconstruction requires a sinc function extending infinitely in both directions. Practical systems use finite-length approximations (Lanczos, Kaiser window, etc.), introducing minor reconstruction errors (ripple).
- **Limits of the CNN analogy**: Zhang's (2019) blur filter insertion is effective, but CNN feature maps are fundamentally different from ADC analog inputs. Feature map frequency characteristics change throughout training, and there is no guarantee that a fixed blur kernel is optimal at every training stage. This application is a direct inspiration but closer to an engineering heuristic than a complete theoretical correspondence.
- **Difficulty extending to high-dimensional signals**: The original theorem was proven for one-dimensional time series. Extending to 2D images, 3D video, and high-dimensional feature spaces requires redefining "highest frequency" per direction, introducing anisotropic aliasing problems. CNN feature maps may have different spatial frequencies along horizontal, vertical, and diagonal axes, meaning a single stride value may not suit all directions.

## Glossary

Nyquist rate - the minimum sampling frequency for perfect reconstruction of a band-limited signal, exactly twice the signal's highest frequency

Aliasing - irreversible distortion where high-frequency components masquerade as low-frequency ones when the sampling rate is insufficient

Anti-aliasing filter - a low-pass filter that removes components above the Nyquist frequency before sampling, an essential front-end component of ADCs

Band-limited - the property of a signal containing no frequency components above a specified maximum frequency, the precondition of the Nyquist theorem

sinc function - sinc(x) = sin(pi*x)/(pi*x), the time-domain representation of an ideal low-pass filter and the interpolation function for sampling reconstruction

Stride - the pixel interval at which a convolution filter moves in a CNN, determining output resolution and defining the downsampling ratio

Shift invariance - the property where translating the input produces an equivalently translated output, an ideal CNN property that aliasing violates

Spectral bias - the tendency of neural networks to learn low-frequency components first during early training, capturing high-frequency detail only later

Downsampling - an operation that reduces the number of samples in a signal or image, incurring aliasing when the Nyquist condition is not met

Time-division multiplexing - a technique for transmitting multiple signals over a single channel by dividing it into alternating time slots, the practical context from which the Nyquist theorem emerged
