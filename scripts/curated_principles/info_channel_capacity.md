---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 채널 용량, 잡음 채널 부호화 정리, 상호 정보량, 정보 병목, Shannon 한계, 오류 정정 부호, 표현 학습
keywords_en: channel capacity, noisy channel coding theorem, mutual information, information bottleneck, Shannon limit, error-correcting codes, representation learning
---
Channel Capacity - 잡음이 있는 통신 채널에서 오류 없는 전송이 가능한 이론적 최대 속도를 규정한 Shannon의 정리

## 잡음 채널에서 오류 없는 통신이 가능하다

1948년, Claude Shannon은 "A Mathematical Theory of Communication"에서 직관에 정면으로 반하는 결과를 증명했다. 잡음이 있는 채널을 통해서도 전송 속도가 특정 한계 이하이기만 하면 오류 확률을 원하는 만큼 낮출 수 있다는 것이다. 그 한계가 채널 용량(channel capacity)이다.

핵심 통찰은 이것이다. 잡음이 메시지를 훼손하는 것은 맞지만, 메시지에 **계획적인 중복성**(redundancy)을 미리 심어두면 수신자가 훼손된 부분을 복원할 수 있다. 단 Shannon이 증명한 것은 단순 반복이 아니라, 수학적으로 설계된 부호화를 사용하면 전송 속도를 거의 희생하지 않으면서도 오류를 없앨 수 있다는 것이다.

이것은 **존재 증명**(existence proof)이다. Shannon은 "오류 없는 통신이 가능하다"는 것을 증명했지만, 어떤 구체적 코드가 이를 달성하는지는 제시하지 않았다. 50년 가까이 공학자들이 이 한계에 도달하기 위해 코드를 설계했고, Turbo codes(1993)와 LDPC codes(1962, 재발견 1996)에 이르러서야 Shannon 한계에 실용적으로 근접했다. "이론적 한계가 먼저, 실용적 방법이 나중에"라는 이 패턴은 정보 이론이 AI에 영향을 준 방식에서도 반복된다.

## 정보 이론에서 기계 학습으로

Shannon의 채널 용량 이론이 AI에 영향을 준 경로는 두 갈래다. 하나는 상호 정보량이라는 수학적 도구가 직접 이식된 것이고, 다른 하나는 "잡음 속에서 본질을 보존하는 부호화"라는 핵심 사고방식이 표현 학습에 재해석된 것이다.

- Shannon(1948)의 채널 용량 C = max I(X;Y) --> Tishby et al.(2000)의 정보 병목(Information Bottleneck) 목적 함수에서 **상호 정보량 I(X;T)와 I(T;Y)가 학습의 핵심 지표**로 재사용됨
- 잡음 채널의 부호기(encoder)/복호기(decoder) 구조 --> Vincent et al.(2008)의 **잡음 제거 오토인코더**(Denoising Autoencoder)에서 인코더-디코더 구조로 직접 대응
- 채널 용량이라는 "전달 가능한 정보의 상한" 개념 --> 네트워크 레이어의 **정보 전달 용량** 개념으로 확장
- 오류 정정 코드의 "중복성으로 잡음에 대항" 원리 --> 드롭아웃이 유도하는 **분산 표현**(distributed representation)의 강건성과 구조적으로 유사
- 전송 속도를 채널 용량 이하로 유지하면 오류가 사라진다는 원리 --> "적절한 병목이 오히려 일반화를 돕는다"는 정보 병목 직관의 근원

## 채널 용량의 수학적 구조

채널은 입력 X를 받아 출력 Y를 내보낸다. 잡음 때문에 Y는 X와 다를 수 있다. 상호 정보량 I(X;Y) = H(Y) - H(Y|X)는 "Y를 관찰함으로써 X에 대해 알게 되는 정보량"이다. 채널 용량 C = max_{p(x)} I(X;Y)는 입력 분포 p(x)를 최적으로 선택했을 때 얻는 최대 상호 정보량이다.

잡음이 전혀 없으면 H(Y|X) = 0이므로 I(X;Y) = H(Y)가 되어, 입력의 불확실성 전체가 출력에 보존된다. 반대로 잡음이 입력을 완전히 파괴하면 Y가 X와 독립이 되어 I(X;Y) = 0, 즉 정보 전달이 불가능하다.

연속 채널에서 가장 중요한 것은 가산 백색 가우시안 잡음(AWGN) 채널이다. Shannon-Hartley 정리에 따르면 C_AWGN = B * log2(1 + S/N)이다. B는 대역폭(Hz), S/N은 신호 대 잡음 비다. 대역폭을 2배로 늘리면 용량도 2배가 되지만, 신호 세기를 2배로 늘려도 용량은 log 스케일이므로 1비트만 추가된다.

## 압축과 보존의 트레이드오프, 그리고 정보 병목

Shannon의 잡음 채널 부호화 정리에는 근본적 트레이드오프가 내장되어 있다. 전송 속도 R < C이면 적절한 부호화로 오류 확률을 **정확히 0에** 수렴시킬 수 있고, R > C이면 어떤 부호화를 써도 오류를 없앨 수 없다.

이 트레이드오프는 기계 학습에서 더 풍부한 형태로 반복된다. 네트워크의 중간 표현(representation)은 입력 데이터를 압축하면서 동시에 예측에 필요한 정보를 보존해야 한다. 너무 많이 압축하면 예측에 필요한 정보가 사라지고, 너무 적게 압축하면 잡음까지 보존되어 과적합이 발생한다.

Tishby, Pereira & Bialek(2000)의 정보 병목(Information Bottleneck, IB) 방법은 Shannon의 채널 부호화를 학습 이론의 언어로 재해석한 것이다. 핵심 목적 함수는 min_{p(t|x)} I(X; T) - beta * I(T; Y)이다. X는 입력 데이터, Y는 레이블, T는 네트워크의 중간 표현이다. I(X;T)를 최소화하여 불필요한 세부 정보를 버리게 하고(압축), I(T;Y)를 최대화하여 예측에 필요한 정보를 보존하게 한다(예측). beta가 무한대로 가면 압축 없이 모든 정보를 보존하고, beta가 0이면 예측과 무관하게 정보를 최대한 버린다.

## 현대 AI 기법과의 연결

채널 용량의 핵심 원리 -- "잡음 속에서 본질을 보존하는 부호화" -- 는 현대 AI의 여러 기법에서 변형되어 살아 있다.

**같은 정보 이론적 원리의 직접적 영감:**

- **잡음 제거 오토인코더(Denoising Autoencoder)**: Vincent et al.(2008)은 입력에 인위적 잡음을 추가한 뒤 원래 입력을 복원하도록 학습시켰다. 깨끗한 입력이 "전송할 메시지", 잡음 추가가 "잡음 채널 통과", 인코더가 "부호기", 디코더가 "복호기"에 해당한다.
- **정보 병목 기반 학습**: Tishby et al.(2000)의 IB 목적 함수는 Shannon의 rate-distortion 이론과 수학적으로 동일한 구조다. Alemi et al.(2017)의 Deep Variational Information Bottleneck(VIB)은 이를 심층 학습에 실제로 적용한 사례다.

**동일한 직관을 독립적으로 공유하는 구조적 유사성:**

- **VAE의 rate-distortion 트레이드오프**: VAE의 ELBO에서 재구성 오차(distortion)와 KL 발산(rate)의 균형은 Shannon의 rate-distortion 이론과 수학적으로 동일한 구조다. beta-VAE(Higgins et al. 2017)에서 beta 조절은 전송 속도 제한으로 잠재 표현의 간결성과 재구성 품질을 조율한다. 다만 Kingma & Welling(2014)은 VAE 설계 시 rate-distortion 이론을 직접 참조하지 않았으며, 이 연결은 사후적으로 명확해졌다
- **드롭아웃과 잡음 채널의 유사성**: 드롭아웃이 뉴런을 무작위로 제거하는 것은, 잡음 채널에서 정보가 소실되는 과정과 구조적으로 닮았다. 드롭아웃은 분산 표현을 형성하여 뉴런 탈락에 강건해진다. 다만 앙상블 근사에서 개발된 것으로, 채널 이론에서 영감을 받은 것은 아니다
- **오토인코더 병목과 채널 용량**: 잠재 차원을 입력보다 작게 설정하는 것은, 제한된 용량의 채널로 정보를 전달하는 것과 같다. 병목이 좁을수록 핵심 정보만 보존하는 효율적 부호화가 강제된다

## 한계와 약점

- **정보 병목 가설의 활성화 함수 의존성**: Saxe et al.(2018)은 Shwartz-Ziv & Tishby가 보고한 압축 단계가 tanh 같은 포화 활성화 함수에서만 나타나고, ReLU에서는 관찰되지 않는다는 반례를 제시했다. 정보 병목이 보편적 원리인지 특정 조건에서만 성립하는 현상인지는 미해결 문제다.
- **고차원 상호 정보량 추정의 불안정성**: IB 이론은 I(X;T)와 I(T;Y)를 정확히 계산할 수 있다고 전제하지만, 수천 차원의 연속 변수에서 상호 정보량을 정확히 추정하는 것은 극히 어렵다(Goldfeld et al. 2019).
- **결정론적 네트워크에서의 이론적 한계**: 드롭아웃 없는 결정론적 네트워크에서 입력과 은닉층 사이에 가역 함수가 존재하면 I(X;T)가 이론적으로 무한대가 되어, IB 프레임워크 자체가 적용 불가능해진다.
- **존재 증명에서 설계 도구로의 간극**: Shannon의 원래 정리와 마찬가지로, IB도 최적 표현이 존재한다는 것을 보여줄 뿐 SGD가 그 최적해에 수렴하는지는 보장하지 않는다.

## 용어 정리

채널 용량(channel capacity) - 잡음 채널을 통해 오류 없이 전송할 수 있는 최대 정보율. C = max I(X;Y)

상호 정보량(mutual information) - 두 변수가 공유하는 정보량. I(X;Y) = H(Y) - H(Y|X)

Shannon-Hartley 정리(Shannon-Hartley theorem) - AWGN 채널의 용량 C = B log2(1 + S/N)을 규정하는 정리

정보 병목(Information Bottleneck) - 입력 압축 I(X;T)과 예측 보존 I(T;Y)의 균형을 상호 정보량으로 최적화하는 학습 이론 프레임워크. Tishby et al.(2000)

잡음 제거 오토인코더(Denoising Autoencoder) - 입력에 인위적 잡음을 추가한 뒤 원본을 복원하도록 학습하여 잡음에 강건한 표현을 추출하는 신경망. Vincent et al.(2008)

존재 증명(existence proof) - 해가 존재함을 보이되 구체적 구성 방법은 제시하지 않는 증명 방식

KL 발산(Kullback-Leibler divergence) - 두 확률 분포 사이의 차이를 측정하는 비대칭 지표. 교차 엔트로피 손실 함수의 수학적 토대

rate-distortion 이론(rate-distortion theory) - 주어진 왜곡 수준에서 데이터를 압축하는 데 필요한 최소 비트율을 규정하는 정보 이론의 분야
---EN---
Channel Capacity - Shannon's theorem establishing the theoretical maximum rate at which information can be transmitted error-free through a noisy channel

## Error-Free Communication Through Noisy Channels Is Possible

In 1948, Claude Shannon proved a result in "A Mathematical Theory of Communication" that directly defied intuition. Even through a noisy channel, the error probability can be made arbitrarily small as long as the transmission rate stays below a specific limit. That limit is channel capacity.

The key insight is this. Noise does corrupt messages, but if **deliberate redundancy** is embedded in the message beforehand, the receiver can recover the corrupted portions. What Shannon proved is far more powerful than simple repetition. With mathematically designed coding, errors can be eliminated while sacrificing almost none of the transmission speed.

This is an **existence proof**. Shannon proved that error-free communication is possible but did not specify which concrete code achieves it. For nearly 50 years, engineers designed codes to reach this limit. Only with Turbo codes (1993) and LDPC codes (1962, rediscovered 1996) did practical performance approach the Shannon limit. This pattern -- "theoretical limit first, practical method later" -- repeats in how information theory influenced AI.

## From Information Theory to Machine Learning

Shannon's channel capacity theory influenced AI along two paths. One is the direct transplantation of mutual information as a mathematical tool. The other is the reinterpretation of "coding that preserves essence amid noise" into representation learning.

- Shannon's (1948) C = max I(X;Y) --> In Tishby et al.'s (2000) Information Bottleneck, **mutual information I(X;T) and I(T;Y) reused as core learning metrics**
- The noisy channel's encoder/decoder structure --> Directly mapped to Vincent et al.'s (2008) **Denoising Autoencoder**
- Channel capacity as an "upper bound on transmittable information" --> Extended to **information transmission capacity** of network layers
- Error-correcting codes' "combating noise with redundancy" --> Structurally similar to robustness of **distributed representations** from dropout
- Keeping rate below capacity eliminates errors --> Source of the IB intuition that "appropriate bottlenecks help generalization"

## The Mathematical Structure of Channel Capacity

A channel receives input X and produces output Y. Due to noise, Y may differ from X. Mutual information I(X;Y) = H(Y) - H(Y|X) is "the information gained about X by observing Y." Channel capacity C = max_{p(x)} I(X;Y) is the maximum mutual information when the input distribution is optimally chosen.

With zero noise, H(Y|X) = 0, so I(X;Y) = H(Y) -- all input uncertainty is preserved. If noise completely destroys the input, Y becomes independent of X, giving I(X;Y) = 0 -- no information gets through.

The most important continuous channel is the AWGN channel. By the Shannon-Hartley theorem, C_AWGN = B * log2(1 + S/N). B is bandwidth (Hz) and S/N is the signal-to-noise ratio. Doubling bandwidth doubles capacity, but doubling signal strength adds only 1 bit due to the log scale.

## The Compression-Preservation Tradeoff and Information Bottleneck

Shannon's noisy channel coding theorem has a fundamental tradeoff built in. If transmission rate R < C, appropriate coding can drive error probability to **exactly zero**. If R > C, no coding can eliminate errors.

This tradeoff recurs in richer forms in machine learning. A network's intermediate representation must compress input data while preserving information needed for prediction. Too much compression destroys needed information; too little preserves noise and causes overfitting.

Tishby, Pereira & Bialek's (2000) Information Bottleneck (IB) reinterpreted Shannon's channel coding in learning theory language. The core objective is min_{p(t|x)} I(X; T) - beta * I(T; Y). X is input, Y is labels, T is the intermediate representation. Minimize I(X;T) to discard unnecessary details (compression) and maximize I(T;Y) to preserve predictive information (prediction). As beta approaches infinity, all information is preserved; when beta is 0, information is maximally discarded.

## Connections to Modern AI

The core principle -- "coding that preserves essence amid noise" -- lives on across modern AI.

**Direct inspiration from information-theoretic principles:**

- **Denoising Autoencoder**: Vincent et al. (2008) added artificial noise to inputs and trained networks to recover originals. Clean input is the "message," noise is the "channel," encoder and decoder map directly to coding theory.
- **IB-based learning**: Tishby et al.'s (2000) IB objective is mathematically isomorphic to rate-distortion theory. Alemi et al.'s (2017) Deep VIB applied this to deep learning.

**Structural similarities sharing the same intuition independently:**

- **VAE's rate-distortion tradeoff**: In the VAE's ELBO, the balance between reconstruction error (distortion) and KL divergence (rate) is structurally identical to Shannon's rate-distortion theory. Adjusting beta in beta-VAE (Higgins et al. 2017) is akin to limiting transmission rate, trading latent compactness against reconstruction quality. However, Kingma & Welling (2014) did not reference rate-distortion theory directly; this connection was clarified in hindsight
- **Dropout and noisy channel similarity**: Dropout randomly removing neurons resembles information loss through a noisy channel. Dropout forms distributed representations robust to neuron removal. However, it was developed from ensemble approximation, not channel coding theory
- **Autoencoder bottleneck and channel capacity**: Setting latent dimension smaller than input is like transmitting through a limited-capacity channel. Narrower bottlenecks force efficient coding that preserves only essential information

## Limitations and Weaknesses

- **IB hypothesis depends on activation function**: Saxe et al. (2018) showed the compression phase appears only with saturating activations like tanh, not with ReLU. Whether IB is universal or condition-specific remains unresolved.
- **High-dimensional MI estimation instability**: IB theory assumes exact MI computation, but this is extremely difficult for thousands of continuous dimensions (Goldfeld et al. 2019).
- **Theoretical limits in deterministic networks**: Without dropout, if a bijection exists between input and hidden layer, I(X;T) becomes infinite, making IB inapplicable.
- **Gap from existence proof to design tool**: Like Shannon's theorem, IB shows optimal representations exist but does not guarantee SGD convergence to them.

## Glossary

Channel capacity - the maximum information rate achievable with arbitrarily low error through a noisy channel. C = max I(X;Y)

Mutual information - the amount of information shared between two variables. I(X;Y) = H(Y) - H(Y|X)

Shannon-Hartley theorem - the theorem establishing AWGN channel capacity C = B log2(1 + S/N)

Information Bottleneck - a learning theory framework optimizing the balance between input compression I(X;T) and prediction preservation I(T;Y). Tishby et al. (2000)

Denoising Autoencoder - a neural network extracting noise-robust representations by adding noise to inputs and training to recover originals. Vincent et al. (2008)

Existence proof - a proof showing a solution exists without providing a specific construction method

KL divergence (Kullback-Leibler divergence) - an asymmetric measure of difference between two probability distributions. Foundation of cross-entropy loss

Rate-distortion theory - the branch of information theory establishing the minimum bit rate for data compression at a given distortion level
