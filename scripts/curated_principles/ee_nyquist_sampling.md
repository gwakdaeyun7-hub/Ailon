---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 나이퀴스트 정리, 샘플링, 에일리어싱, 안티에일리어싱, 대역 제한, 정보 보존, 스트라이드
keywords_en: Nyquist theorem, sampling, aliasing, anti-aliasing, band-limited, information preservation, stride
---
Nyquist-Shannon Sampling Theorem - 연속 신호를 이산 샘플로 완벽 복원하기 위한 최소 샘플링 조건을 규정하는 정리

## 전신선에서 시작된 질문

1920년대, 전화 통신의 급속한 확산과 함께 근본적인 공학 질문이 떠올랐다. 연속적인 음성 신호를 전신선으로 전송하려면, 초당 몇 번의 샘플을 취해야 원래 신호를 복원할 수 있는가? Harry Nyquist(1928)가 "Certain Topics in Telegraph Transmission Theory"에서 이 문제의 이론적 토대를 놓았고, Claude Shannon(1949)이 "Communication in the Presence of Noise"에서 엄밀한 수학적 증명을 완성했다.

정리의 핵심은 놀랍도록 간결하다.

f_s >= 2 * f_max

신호에 포함된 최고 주파수 f_max의 **두 배 이상**으로 샘플링해야 원래 연속 신호를 **완벽히** 복원할 수 있다. 이 임계 주파수 2*f_max를 나이퀴스트 율(Nyquist rate)이라 부른다. 직관적으로, 한 주기의 파동을 포착하려면 최소한 봉우리와 골짜기 두 점이 필요하다.

## 복원의 수학: sinc 보간

샘플링 정리가 진정으로 말하는 것은 단순한 부등식이 아니다. 나이퀴스트 율 이상으로 샘플링된 대역 제한(band-limited) 신호는 다음 공식으로 **정확히** 복원된다.

x(t) = sum_{n=-inf}^{inf} x(nT) * sinc((t - nT) / T)

여기서 T = 1/f_s는 샘플링 간격이고, sinc(u) = sin(pi*u) / (pi*u)다. 각 샘플 x(nT)에 sinc 함수를 곱해 더하면 원래 연속 신호가 완벽히 재구성된다. sinc 함수의 특성상, 각 샘플 점에서만 값이 1이고 다른 모든 샘플 점에서는 정확히 0이 되므로, 샘플 간의 간섭 없이 보간이 이루어진다.

이 복원 공식은 정보 이론적으로도 중요하다. 대역 제한 신호의 **모든 정보**가 이산 샘플에 보존된다는 것을 의미한다. 연속과 이산 사이에 정보 손실이 없다.

## 에일리어싱: 정리를 어기면 벌어지는 일

나이퀴스트 율 미만으로 샘플링하면 **에일리어싱**(aliasing)이 발생한다. 고주파 성분이 저주파로 위장하여 나타나는 현상으로, 원래 신호와 전혀 다른 허위 패턴이 생긴다. 영화에서 헬리콥터 날개가 거꾸로 도는 것처럼 보이는 것, 모니터에 촬영한 영상에서 물결무늬(moire pattern)가 나타나는 것이 에일리어싱의 일상적 사례다.

주파수 영역에서 보면, 에일리어싱은 스펙트럼의 주기적 복제본들이 겹쳐서 원래 주파수 성분을 구분할 수 없게 되는 현상이다. 한번 겹치면 되돌릴 수 없다. 따라서 실제 시스템에서는 샘플링 전에 **안티에일리어싱 필터**(anti-aliasing filter)를 적용하여 나이퀴스트 주파수 이상의 성분을 제거한다. 이것이 모든 ADC(아날로그-디지털 변환기) 앞단에 저역 통과 필터가 있는 이유다.

## CNN의 에일리어싱 문제

Richard Zhang(2019)의 "Making Convolutional Networks Shift-Invariant Again"은 나이퀴스트 정리가 딥러닝에 직접 관련됨을 보여준 핵심 논문이다. CNN의 스트라이드 합성곱(strided convolution)과 맥스 풀링(max pooling)은 본질적으로 **다운샘플링**(downsampling) 연산이다. 입력의 공간 해상도를 절반으로 줄이는 stride-2 연산은, 신호를 절반 비율로 재샘플링하는 것과 동일하다.

문제는 이 다운샘플링이 안티에일리어싱 없이 수행된다는 것이다. CNN의 특징 맵(feature map)에 나이퀴스트 주파수보다 높은 고주파 성분이 있을 때, 스트라이드 연산이 에일리어싱을 일으킨다. 그 결과, 입력 이미지를 1픽셀만 이동해도 CNN의 출력이 크게 달라지는 **이동 불변성(shift invariance) 위반**이 발생한다.

핵심 대응 관계는 다음과 같다.

- 연속 신호 --> CNN 특징 맵
- 샘플링 주파수 (f_s) --> 1/stride (스트라이드의 역수)
- 안티에일리어싱 필터 --> 블러 커널 (가우시안 저역 통과)
- 에일리어싱 --> 이동에 따른 출력 불안정성
- 나이퀴스트 율 위반 --> stride가 특징 맵의 공간 주파수에 비해 너무 큼

Zhang의 해법은 우아하다. 맥스 풀링이나 스트라이드 합성곱 전에 **블러 필터**(blur filter)를 삽입한다. 이것은 ADC 전의 안티에일리어싱 필터와 정확히 같은 역할을 한다. 실험 결과, 이 간단한 수정으로 이동 일관성이 크게 개선되고 분류 정확도도 소폭 향상되었다.

## NeRF의 위치 인코딩과 주파수 선택

Mildenhall et al.(2020)의 NeRF(Neural Radiance Fields)에서도 나이퀴스트 정리의 직관이 작동한다. NeRF는 3D 좌표 (x, y, z)를 입력받아 해당 위치의 색상과 밀도를 출력하는 MLP를 학습한다. 그런데 단순한 MLP는 저주파 편향(spectral bias, Rahaman et al. 2019)이 있어 고주파 디테일(텍스처, 날카로운 경계)을 잘 학습하지 못한다.

해결책은 입력 좌표를 다양한 주파수의 사인-코사인 함수로 인코딩하는 것이다.

gamma(p) = [sin(2^0 * pi * p), cos(2^0 * pi * p), ..., sin(2^(L-1) * pi * p), cos(2^(L-1) * pi * p)]

여기서 L은 주파수 대역의 수다. 이것은 본질적으로 입력 신호의 **주파수 대역을 확장**하는 것이다. 저주파 좌표 정보를 고주파 공간으로 들어올려, MLP가 고주파 특징을 표현할 수 있게 한다. L의 선택은 장면의 복잡도에 따른 최고 주파수와 밀접하게 관련되며, 이는 나이퀴스트 정리의 정신과 맞닿아 있다. 필요한 디테일 수준(최고 주파수)에 맞는 충분한 주파수 대역(샘플링 율)을 제공해야 한다.

## 이미지 해상도와 정보 손실

이미지 처리에서 다운샘플링(해상도 축소)은 샘플링 정리의 직접적 적용 영역이다. 고해상도 이미지를 저해상도로 축소할 때, 원본의 고주파 디테일이 새 해상도의 나이퀴스트 주파수를 초과하면 에일리어싱이 발생한다. 이미지 리사이징 알고리즘(bilinear, bicubic, Lanczos)은 모두 내부적으로 안티에일리어싱 필터링을 포함한다.

Super-resolution 네트워크는 이 과정의 역방향이다. 저해상도 이미지에서 잃어버린 고주파 성분을 학습된 prior로 복원한다. 정보 이론적으로, 나이퀴스트 율 미만으로 샘플링된 고주파 정보는 이미 소실되었으므로, 네트워크가 하는 것은 복원이 아니라 **학습된 추정**이다. 이 구분은 중요하다.

## 한계와 약점

나이퀴스트 정리는 이상적 조건에 기반하며, 현실 적용에는 중요한 괴리가 있다.

- **대역 제한 가정의 비현실성**: 정리는 대역 제한(band-limited) 신호를 전제한다. 그러나 자연 이미지, 음성, 텍스트 신호는 엄밀히 대역 제한이 아니다. 점 광원, 날카로운 경계 등은 이론적으로 무한대 주파수 성분을 포함한다. 실무에서는 에너지가 무시할 수준으로 감쇠하는 주파수를 실질적 상한으로 사용한다.
- **무한 sinc 보간의 비실용성**: 완벽 복원에 필요한 sinc 보간은 무한 길이의 필터를 요구한다. 실제로는 유한 길이의 근사 필터를 사용하며, 이는 미소한 복원 오차를 수반한다.
- **CNN과의 유비 한계**: Zhang(2019)의 블러 필터 삽입은 효과적이지만, CNN 특징 맵은 ADC의 아날로그 입력과 근본적으로 다르다. 특징 맵은 학습된 비선형 변환의 결과이며, 그 주파수 특성은 고정되지 않고 학습 과정에서 변한다. 따라서 나이퀴스트 정리의 적용은 **구조적 유비**(structural analogy)로 이해하는 것이 정확하다.
- **과다 샘플링의 비용**: 정보 손실을 피하려면 높은 샘플링 율이 필요하지만, 이는 데이터 크기, 계산량, 저장 공간의 증가를 의미한다. AI에서 입력 해상도를 높이면 정보는 보존되지만 계산 비용이 급증한다.

## 용어 정리

나이퀴스트 율(Nyquist rate) - 대역 제한 신호를 완벽 복원하기 위한 최소 샘플링 주파수, 최고 주파수의 2배

에일리어싱(aliasing) - 샘플링 율이 부족할 때 고주파가 저주파로 위장되어 나타나는 왜곡 현상

안티에일리어싱 필터(anti-aliasing filter) - 샘플링 전 나이퀴스트 주파수 이상의 성분을 제거하는 저역 통과 필터

대역 제한(band-limited) - 특정 최대 주파수 이상의 성분이 없는 신호의 성질

sinc 함수(sinc function) - sinc(x) = sin(pi*x)/(pi*x), 이상적 저역 통과 필터의 임펄스 응답이자 샘플링 복원의 보간 함수

스트라이드(stride) - CNN에서 필터가 이동하는 간격, 출력 해상도를 결정

이동 불변성(shift invariance) - 입력이 이동해도 출력이 동일하게 이동하는 성질, 이상적 CNN의 기대 속성

스펙트럼 편향(spectral bias) - 신경망이 학습 초기에 저주파 성분을 먼저 학습하는 경향

다운샘플링(downsampling) - 신호나 이미지의 샘플 수를 줄이는 연산, 정보 손실 가능성 수반

---EN---
Nyquist-Shannon Sampling Theorem - A theorem specifying the minimum sampling condition for perfectly reconstructing a continuous signal from discrete samples

## A Question Born from Telegraph Lines

In the 1920s, the rapid expansion of telephone communication raised a fundamental engineering question: how many samples per second must be taken from a continuous voice signal to reconstruct the original over telegraph lines? Harry Nyquist (1928) laid the theoretical groundwork in "Certain Topics in Telegraph Transmission Theory," and Claude Shannon (1949) completed the rigorous mathematical proof in "Communication in the Presence of Noise."

The theorem's core is remarkably concise:

f_s >= 2 * f_max

A signal must be sampled at **at least twice** its highest frequency component f_max to enable **perfect** reconstruction of the original continuous signal. This critical frequency 2*f_max is called the Nyquist rate. Intuitively, capturing one cycle of a wave requires at minimum two points -- the peak and the trough.

## The Mathematics of Reconstruction: sinc Interpolation

What the sampling theorem truly states goes beyond a simple inequality. A band-limited signal sampled above the Nyquist rate can be **exactly** reconstructed by:

x(t) = sum_{n=-inf}^{inf} x(nT) * sinc((t - nT) / T)

Here T = 1/f_s is the sampling interval, and sinc(u) = sin(pi*u)/(pi*u). Multiplying each sample x(nT) by a sinc function and summing perfectly reconstructs the original continuous signal. Due to the sinc function's properties -- it equals 1 at its own sample point and exactly 0 at all other sample points -- interpolation occurs without inter-sample interference.

This reconstruction formula is also significant from an information-theoretic perspective: **all information** in a band-limited signal is preserved in its discrete samples. There is zero information loss between continuous and discrete representations.

## Aliasing: What Happens When the Theorem Is Violated

Sampling below the Nyquist rate produces **aliasing**. High-frequency components masquerade as low-frequency ones, creating false patterns entirely different from the original signal. The apparent reverse rotation of helicopter blades in film, or moire patterns in video footage of screens, are everyday examples of aliasing.

In the frequency domain, aliasing occurs when periodic spectral replicas overlap, making it impossible to distinguish original frequency components. Once overlapped, the damage is irreversible. Therefore, practical systems apply an **anti-aliasing filter** before sampling to remove components above the Nyquist frequency. This is why every ADC (analog-to-digital converter) has a low-pass filter at its input stage.

## The Aliasing Problem in CNNs

Richard Zhang's (2019) "Making Convolutional Networks Shift-Invariant Again" demonstrated that the Nyquist theorem is directly relevant to deep learning. CNN strided convolution and max pooling are fundamentally **downsampling** operations. A stride-2 operation that halves spatial resolution is equivalent to resampling a signal at half its rate.

The problem is that this downsampling occurs without anti-aliasing. When CNN feature maps contain frequency components above the Nyquist frequency, stride operations cause aliasing. The result is a violation of **shift invariance** -- shifting the input image by just one pixel can dramatically change CNN output.

The key correspondences are:

- Continuous signal --> CNN feature map
- Sampling frequency (f_s) --> 1/stride (inverse of stride)
- Anti-aliasing filter --> blur kernel (Gaussian low-pass)
- Aliasing --> output instability under translation
- Nyquist rate violation --> stride too large relative to feature map spatial frequency

Zhang's solution is elegant: insert a **blur filter** before max pooling or strided convolution. This plays exactly the same role as the anti-aliasing filter before an ADC. Experiments showed this simple modification substantially improved shift consistency and modestly improved classification accuracy.

## NeRF's Positional Encoding and Frequency Selection

The intuition of the Nyquist theorem also operates in Mildenhall et al.'s (2020) NeRF (Neural Radiance Fields). NeRF trains an MLP that takes 3D coordinates (x, y, z) as input and outputs color and density at that location. However, plain MLPs exhibit spectral bias (Rahaman et al. 2019), struggling to learn high-frequency details like textures and sharp edges.

The solution is to encode input coordinates using sine-cosine functions at various frequencies:

gamma(p) = [sin(2^0 * pi * p), cos(2^0 * pi * p), ..., sin(2^(L-1) * pi * p), cos(2^(L-1) * pi * p)]

Here L is the number of frequency bands. This essentially **extends the frequency bandwidth** of the input signal, lifting low-frequency coordinate information into high-frequency space so the MLP can represent high-frequency features. The choice of L is closely related to the maximum frequency needed for scene complexity -- a spirit aligned with the Nyquist theorem. Sufficient frequency bands (sampling rate) must be provided to match the required level of detail (highest frequency).

## Image Resolution and Information Loss

In image processing, downsampling (resolution reduction) is a direct application domain of the sampling theorem. When reducing a high-resolution image to low resolution, aliasing occurs if the original's high-frequency details exceed the Nyquist frequency of the new resolution. Image resizing algorithms (bilinear, bicubic, Lanczos) all internally include anti-aliasing filtering.

Super-resolution networks are the reverse of this process. They restore lost high-frequency components from low-resolution images using learned priors. Information-theoretically, high-frequency information sampled below the Nyquist rate is already lost, so what the network performs is not reconstruction but **learned estimation**. This distinction is important.

## Limitations and Weaknesses

The Nyquist theorem is based on ideal conditions, and significant gaps exist in real-world applications.

- **Unrealistic band-limited assumption**: The theorem presupposes band-limited signals. However, natural images, speech, and text signals are not strictly band-limited. Point light sources, sharp edges, and similar features theoretically contain infinite frequency components. In practice, the frequency where energy attenuates to negligible levels serves as the practical upper bound.
- **Impractical infinite sinc interpolation**: Perfect reconstruction requires an infinite-length sinc filter. In practice, finite-length approximations are used, introducing minor reconstruction errors.
- **Limits of the CNN analogy**: Zhang's (2019) blur filter insertion is effective, but CNN feature maps are fundamentally different from ADC analog inputs. Feature maps are results of learned nonlinear transformations, and their frequency characteristics are not fixed but change during training. The application of the Nyquist theorem is more accurately understood as a **structural analogy**.
- **Cost of oversampling**: Avoiding information loss requires high sampling rates, which means increased data size, computation, and storage. In AI, increasing input resolution preserves information but causes computational costs to surge.

## Glossary

Nyquist rate - the minimum sampling frequency for perfect reconstruction of a band-limited signal, equal to twice the highest frequency

Aliasing - distortion where high frequencies masquerade as low frequencies when the sampling rate is insufficient

Anti-aliasing filter - a low-pass filter that removes components above the Nyquist frequency before sampling

Band-limited - the property of a signal having no frequency components above a specified maximum frequency

sinc function - sinc(x) = sin(pi*x)/(pi*x), the impulse response of an ideal low-pass filter and the interpolation function for sampling reconstruction

Stride - the step size of filter movement in a CNN, determining output resolution

Shift invariance - the property where translating the input produces an equivalently translated output, an expected property of ideal CNNs

Spectral bias - the tendency of neural networks to learn low-frequency components earlier during training

Downsampling - an operation that reduces the number of samples in a signal or image, potentially incurring information loss
