---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 채널 용량, 잡음 채널 부호화 정리, 상호 정보량, 정보 병목, Shannon 한계, 오류 정정 부호, 표현 학습
keywords_en: channel capacity, noisy channel coding theorem, mutual information, information bottleneck, Shannon limit, error-correcting codes, representation learning
---
Channel Capacity - 잡음이 있는 통신 채널에서 오류 없는 전송이 가능한 이론적 최대 속도를 규정한 Shannon의 정리

## 잡음 채널에서 오류 없는 통신이 가능하다

1948년, Claude Shannon은 "A Mathematical Theory of Communication"에서 직관에 정면으로 반하는 결과를 증명했다. 잡음이 있는 채널을 통해서도 전송 속도가 특정 한계 이하이기만 하면 오류 확률을 원하는 만큼 낮출 수 있다는 것이다. 그 한계가 채널 용량(channel capacity)이다.

핵심 통찰은 이것이다. 잡음이 메시지를 훼손하는 것은 맞지만, 메시지에 **계획적인 중복성**(redundancy)을 미리 심어두면 수신자가 훼손된 부분을 복원할 수 있다. 비유하자면, 시끄러운 공사장에서 대화할 때 같은 말을 두세 번 반복하거나, 핵심 단어를 강조해서 말하는 것과 같다. 단 Shannon이 증명한 것은 이보다 훨씬 강력하다. 단순 반복이 아니라, 수학적으로 설계된 부호화를 사용하면 전송 속도를 거의 희생하지 않으면서도 오류를 없앨 수 있다.

이것은 **존재 증명**(existence proof)이다. Shannon은 "오류 없는 통신이 가능하다"는 것을 증명했지만, 어떤 구체적 코드가 이를 달성하는지는 제시하지 않았다. 50년 가까이 공학자들이 이 한계에 도달하기 위해 코드를 설계했고, Turbo codes(Berrou et al. 1993)와 LDPC codes(Gallager 1962, 재발견 1996)에 이르러서야 Shannon 한계에 실용적으로 근접했다. "이론적 한계가 먼저, 실용적 방법이 나중에"라는 이 패턴은 정보 이론이 AI에 영향을 준 방식에서도 반복된다.

## 정보 이론에서 기계 학습으로

Shannon의 채널 용량 이론이 AI에 영향을 준 경로는 두 갈래다. 하나는 상호 정보량이라는 수학적 도구가 직접 이식된 것이고, 다른 하나는 "잡음 속에서 본질을 보존하는 부호화"라는 핵심 사고방식이 표현 학습에 재해석된 것이다.

- Shannon(1948)의 채널 용량 C = max I(X;Y) --> Tishby et al.(2000)의 정보 병목(Information Bottleneck) 목적 함수에서 **상호 정보량 I(X;T)와 I(T;Y)가 학습의 핵심 지표**로 재사용됨
- 잡음 채널의 부호기(encoder)/복호기(decoder) 구조 --> Vincent et al.(2008)의 **잡음 제거 오토인코더**(Denoising Autoencoder)에서 인코더-디코더 구조로 직접 대응
- 채널 용량이라는 "전달 가능한 정보의 상한" 개념 --> 네트워크 레이어의 **정보 전달 용량** 개념으로 확장 (Shwartz-Ziv & Tishby 2017)
- 오류 정정 코드의 "중복성으로 잡음에 대항" 원리 --> 드롭아웃이 유도하는 **분산 표현**(distributed representation)의 강건성과 구조적으로 유사
- 전송 속도를 채널 용량 이하로 유지하면 오류가 사라진다는 원리 --> "적절한 병목이 오히려 일반화를 돕는다"는 정보 병목 직관의 근원

## 채널 용량의 수학적 구조

채널 용량은 다음과 같이 정의된다.

1. 채널은 입력 X를 받아 출력 Y를 내보낸다. 잡음 때문에 Y는 X와 다를 수 있다
2. 상호 정보량 I(X;Y) = H(Y) - H(Y|X)는 "Y를 관찰함으로써 X에 대해 알게 되는 정보량"이다. H(Y)는 출력의 엔트로피(불확실성), H(Y|X)는 입력을 알 때 출력의 잔여 불확실성이다
3. 채널 용량 C = max_{p(x)} I(X;Y)는 입력 분포 p(x)를 최적으로 선택했을 때 얻는 최대 상호 정보량이다

극단값을 추적하면 이 정의가 직관적으로 이해된다. 잡음이 전혀 없으면 H(Y|X) = 0이므로 I(X;Y) = H(Y)가 되어, 입력의 불확실성 전체가 출력에 보존된다. 반대로 잡음이 입력을 완전히 파괴하면 Y가 X와 독립이 되어 H(Y|X) = H(Y)이고 I(X;Y) = 0, 즉 정보 전달이 불가능하다.

가장 기본적인 이산 채널인 이진 대칭 채널(Binary Symmetric Channel, BSC)에서 비트가 확률 p로 뒤집힐 때:

C_BSC = 1 - H(p) = 1 - [-p log2(p) - (1-p) log2(1-p)]

p = 0(오류 없음)이면 H(0) = 0이므로 C = 1 비트. p = 0.5(동전 던지기)이면 H(0.5) = 1이므로 C = 0 비트. 오류율이 50%라는 것은 출력이 입력과 완전히 무관하다는 뜻이므로 정보가 전달되지 않는다.

연속 채널에서 가장 중요한 것은 가산 백색 가우시안 잡음(AWGN) 채널이다. Shannon-Hartley 정리에 따르면:

C_AWGN = B * log2(1 + S/N)

B는 대역폭(Hz), S/N은 신호 대 잡음 비(signal-to-noise ratio)다. 대역폭을 2배로 늘리면 용량도 2배가 되지만, 신호 세기를 2배로 늘려도 용량은 log 스케일이므로 1비트만 추가된다. 이 비대칭이 통신 시스템 설계의 핵심 제약이다. 5G, Wi-Fi, 위성 통신 모두 이 한계에 가능한 한 근접하도록 설계된다.

## 압축과 보존 사이의 근본적 트레이드오프

Shannon의 잡음 채널 부호화 정리에는 근본적 트레이드오프가 내장되어 있다. 전송 속도 R과 오류 확률 사이의 관계다.

- R < C이면: 적절한 부호화로 오류 확률을 임의로 작게 만들 수 있다
- R > C이면: 어떤 부호화를 써도 오류 확률을 0으로 만들 수 없다
- R = C가 정확한 경계선이다

이것을 공간적으로 상상하면 이렇다. 용량 C인 파이프에 물(정보)을 흘려보내는 것과 같다. 파이프 용량 이하로 보내면 물이 온전히 도착하지만, 용량을 초과하면 반드시 넘쳐서 손실이 생긴다. 단, 물리적 파이프와 다른 점이 있다. 정보 채널에서는 C 미만이기만 하면 손실을 **정확히 0으로** 만들 수 있다. 이것이 Shannon 정리의 놀라운 점이다.

이 트레이드오프는 기계 학습에서 더 풍부한 형태로 반복된다. 네트워크의 중간 표현(representation)은 입력 데이터를 압축하면서 동시에 예측에 필요한 정보를 보존해야 한다. 너무 많이 압축하면 예측에 필요한 정보가 사라지고, 너무 적게 압축하면 잡음까지 보존되어 과적합이 발생한다.

## 정보 병목: 학습 이론으로의 재해석

Tishby, Pereira & Bialek(2000)의 정보 병목(Information Bottleneck, IB) 방법은 Shannon의 채널 부호화를 학습 이론의 언어로 재해석한 것이다. 핵심 목적 함수는 다음과 같다.

min_{p(t|x)} I(X; T) - beta * I(T; Y)

X는 입력 데이터, Y는 레이블(예측 대상), T는 네트워크의 중간 표현이다. 이 식은 두 가지를 동시에 요구한다. I(X;T)를 최소화하여 T가 X의 불필요한 세부 정보를 버리게 하고(압축), I(T;Y)를 최대화하여 T가 Y를 예측하는 데 필요한 정보를 보존하게 한다(예측). beta는 이 두 목표의 균형을 조절하는 파라미터로, beta가 크면 예측 보존을, 작으면 압축을 우선시한다.

극단값을 추적하면: beta가 무한대로 가면 압축 항이 무시되어 T가 X의 모든 정보를 보존하고(압축 없음), beta가 0이면 예측과 무관하게 T가 X의 정보를 최대한 버린다(예측 불능). 실용적 학습은 이 양극단 사이의 적절한 지점에서 이루어진다.

Shwartz-Ziv & Tishby(2017)는 "Opening the Black Box of Deep Learning Using Information"에서 이 이론을 실험적으로 검증하려 했다. 심층 네트워크의 학습을 두 단계로 나누어 분석했는데, 초기 피팅(fitting) 단계에서 I(X;T)와 I(T;Y)가 모두 증가하고, 이후 압축(compression) 단계에서 I(X;T)가 감소하면서 I(T;Y)는 유지된다고 보고했다. 네트워크가 먼저 데이터를 있는 그대로 기억한 뒤, 불필요한 정보를 서서히 버리면서 일반화 능력을 얻는다는 해석이다. 다만 이 가설에는 중요한 반론이 있으며, "한계와 약점" 섹션에서 다룬다.

## 현대 AI 기법과의 연결

채널 용량의 핵심 원리 -- "잡음 속에서 본질을 보존하는 부호화" -- 는 현대 AI의 여러 기법에서 변형되어 살아 있다. 다만 각 연결의 성격은 다르다.

**같은 정보 이론적 원리의 직접적 영감:**

- **잡음 제거 오토인코더(Denoising Autoencoder)**: Vincent et al.(2008)은 입력에 인위적 잡음을 추가한 뒤 원래 입력을 복원하도록 학습시켰다. 깨끗한 입력이 "전송할 메시지", 잡음 추가가 "잡음 채널 통과", 인코더가 "부호기", 디코더가 "복호기"에 해당한다. 오류 정정 코드가 중복성을 활용해 잡음에 대항하듯, 성공적으로 학습된 인코더는 잡음에 강건한 표현을 추출한다.
- **정보 병목 기반 학습**: Tishby et al.(2000)의 IB 목적 함수는 Shannon의 rate-distortion 이론과 수학적으로 동일한 구조다. rate-distortion에서 "전송률 제약 하에서 왜곡을 최소화"하는 문제가, IB에서는 "표현의 정보량 제약 하에서 예측 손실을 최소화"하는 문제로 대응된다. Alemi et al.(2017)의 Deep Variational Information Bottleneck(VIB)은 이를 심층 학습에 실제로 적용한 사례다.
- **교차 엔트로피 손실 함수**: 분류 문제의 표준 손실 함수인 교차 엔트로피 H(p,q) = -sum p(x) log q(x)는 Shannon 엔트로피의 직접적 확장이다. 이 손실을 최소화하는 것은 모델 출력 q와 실제 분포 p 사이의 KL 발산(Kullback-Leibler divergence)을 최소화하는 것과 동치이며, 이는 정보 이론의 핵심 도구다.

**동일한 직관을 독립적으로 공유하는 구조적 유사성:**

- **드롭아웃의 정보 병목 해석**: Srivastava et al.(2014)의 드롭아웃은 뉴런을 무작위로 비활성화하는 정규화 기법으로, 앙상블 효과가 원래 설계 동기다. 그러나 정보 이론적으로 재해석하면, 레이어 내부에 잡음 채널을 삽입하여 전달 가능한 정보량에 상한을 두는 것과 구조적으로 유사하다. 이 유사성은 사후적 해석이며, 드롭아웃이 정보 이론에서 직접 영감을 받은 것은 아니다.
- **네트워크 아키텍처와 용량 배분**: ResNet의 스킵 연결(skip connection)은 우회 채널을 추가하여 총 정보 전달 용량을 늘리는 것으로, Transformer의 어텐션 메커니즘은 입력에 따라 정보 전달 경로를 동적으로 선택하는 것으로 해석할 수 있다. 이들은 정보 이론에서 영감을 받아 설계된 것이 아니라, 사후적으로 채널 용량 프레임워크로 분석 가능한 사례다.

## 한계와 약점

- **정보 병목 가설의 활성화 함수 의존성**: Saxe et al.(2018)은 Shwartz-Ziv & Tishby가 보고한 압축 단계가 tanh 같은 포화 활성화 함수에서만 나타나고, ReLU에서는 관찰되지 않는다는 반례를 제시했다. 정보 병목이 심층 학습의 보편적 원리인지, 특정 조건에서만 성립하는 현상인지는 여전히 미해결 문제다.
- **고차원 상호 정보량 추정의 불안정성**: IB 이론은 I(X;T)와 I(T;Y)를 정확히 계산할 수 있다고 전제하지만, 수천 차원의 연속 변수에서 상호 정보량을 정확히 추정하는 것은 극히 어렵다. 추정 방법(binning, KDE, MINE 등)에 따라 결론이 달라지는 사례가 보고되었다(Goldfeld et al. 2019).
- **결정론적 네트워크에서의 이론적 한계**: 드롭아웃 없는 결정론적 네트워크에서 입력과 은닉층 사이에 일대일 대응(가역 함수)이 존재하면 I(X;T)가 이론적으로 무한대가 된다. 이 경우 IB 프레임워크 자체가 적용 불가능해지며, 기하학적 정보(geometric information) 같은 대안적 측도가 제안되고 있다.
- **존재 증명에서 설계 도구로의 간극**: Shannon의 원래 정리와 마찬가지로, IB도 최적 표현이 존재한다는 것을 보여줄 뿐 SGD가 그 최적해에 수렴하는지는 보장하지 않는다. 현재로서 IB는 학습된 네트워크를 사후적으로 분석하는 해석 도구로서의 가치가, 네트워크를 설계하는 처방적 도구로서의 가치보다 크다.

## 용어 정리

채널 용량(channel capacity) - 잡음 채널을 통해 오류 없이 전송할 수 있는 최대 정보율. C = max I(X;Y)로 정의되며, 단위는 비트/사용(bits per channel use)

상호 정보량(mutual information) - 두 변수가 공유하는 정보량. I(X;Y) = H(Y) - H(Y|X). 한 변수를 관찰함으로써 다른 변수에 대해 알게 되는 정보의 양

엔트로피(entropy) - 확률 변수의 불확실성을 측정하는 양. H(X) = -sum p(x) log2 p(x). 동전 던지기처럼 결과가 균일할수록 엔트로피가 높다

이진 대칭 채널(Binary Symmetric Channel, BSC) - 비트가 확률 p로 뒤집히는 가장 단순한 이산 잡음 채널. 잡음 채널의 기본 모델로 교과서에서 가장 먼저 등장한다

Shannon-Hartley 정리(Shannon-Hartley theorem) - AWGN 채널의 용량 C = B log2(1 + S/N)을 규정하는 정리. 대역폭과 신호 세기가 정보 전달 한계를 결정한다는 것을 정량화

정보 병목(Information Bottleneck) - 입력 압축 I(X;T)과 예측 보존 I(T;Y)의 균형을 상호 정보량으로 최적화하는 학습 이론 프레임워크. Tishby et al.(2000) 제안

잡음 제거 오토인코더(Denoising Autoencoder) - 입력에 인위적 잡음을 추가한 뒤 원본을 복원하도록 학습하여 잡음에 강건한 표현을 추출하는 신경망. Vincent et al.(2008)

존재 증명(existence proof) - 해가 존재함을 보이되 구체적 구성 방법은 제시하지 않는 증명 방식. Shannon의 채널 부호화 정리가 대표적 사례

KL 발산(Kullback-Leibler divergence) - 두 확률 분포 사이의 차이를 측정하는 비대칭 지표. DKL(p||q) = sum p(x) log(p(x)/q(x)). 교차 엔트로피 손실 함수의 수학적 토대

rate-distortion 이론(rate-distortion theory) - 주어진 왜곡 수준에서 데이터를 압축하는 데 필요한 최소 비트율을 규정하는 정보 이론의 분야. 정보 병목 방법의 수학적 모체
---EN---
Channel Capacity - Shannon's theorem establishing the theoretical maximum rate at which information can be transmitted error-free through a noisy channel

## Error-Free Communication Through Noisy Channels Is Possible

In 1948, Claude Shannon proved a result in "A Mathematical Theory of Communication" that directly defied intuition. Even through a noisy channel, the error probability can be made arbitrarily small as long as the transmission rate stays below a specific limit. That limit is channel capacity.

The key insight is this. Noise does corrupt messages, but if **deliberate redundancy** is embedded in the message beforehand, the receiver can recover the corrupted portions. Think of it like talking at a noisy construction site -- you might repeat key words or emphasize them to get your point across. But what Shannon proved is far more powerful. With mathematically designed coding, errors can be eliminated while sacrificing almost none of the transmission speed.

This is an **existence proof**. Shannon proved that error-free communication is possible but did not specify which concrete code achieves it. For nearly 50 years, engineers designed codes to reach this limit. Only with Turbo codes (Berrou et al. 1993) and LDPC codes (Gallager 1962, rediscovered 1996) did practical performance approach the Shannon limit. This pattern -- "theoretical limit first, practical method later" -- repeats in how information theory influenced AI.

## From Information Theory to Machine Learning

Shannon's channel capacity theory influenced AI along two paths. One is the direct transplantation of mutual information as a mathematical tool. The other is the reinterpretation of the core mindset -- "coding that preserves essence amid noise" -- into representation learning.

- Shannon's (1948) channel capacity C = max I(X;Y) --> In Tishby et al.'s (2000) Information Bottleneck objective, **mutual information I(X;T) and I(T;Y) were reused as the core metrics of learning**
- The noisy channel's encoder/decoder structure --> Directly mapped to the **encoder-decoder architecture** in Vincent et al.'s (2008) Denoising Autoencoder
- The concept of channel capacity as an "upper bound on transmittable information" --> Extended to the concept of **information transmission capacity** of network layers (Shwartz-Ziv & Tishby 2017)
- Error-correcting codes' principle of "combating noise with redundancy" --> Structurally similar to the robustness of **distributed representations** induced by dropout
- The principle that keeping transmission rate below channel capacity eliminates errors --> The source of the Information Bottleneck intuition that "appropriate bottlenecks actually help generalization"

## The Mathematical Structure of Channel Capacity

Channel capacity is defined as follows:

1. A channel receives input X and produces output Y. Due to noise, Y may differ from X
2. Mutual information I(X;Y) = H(Y) - H(Y|X) is "the amount of information gained about X by observing Y." H(Y) is the entropy (uncertainty) of the output, and H(Y|X) is the remaining uncertainty of the output when the input is known
3. Channel capacity C = max_{p(x)} I(X;Y) is the maximum mutual information obtainable when the input distribution p(x) is optimally chosen

Tracking the extreme values makes this definition intuitive. With zero noise, H(Y|X) = 0, so I(X;Y) = H(Y) -- the input's entire uncertainty is preserved in the output. Conversely, if noise completely destroys the input, Y becomes independent of X, giving H(Y|X) = H(Y) and I(X;Y) = 0 -- no information gets through.

For the most basic discrete channel, the Binary Symmetric Channel (BSC), where bits flip with probability p:

C_BSC = 1 - H(p) = 1 - [-p log2(p) - (1-p) log2(1-p)]

When p = 0 (no errors), H(0) = 0 so C = 1 bit. When p = 0.5 (coin flip), H(0.5) = 1 so C = 0 bits. A 50% error rate means the output is completely unrelated to the input, so no information is transmitted.

The most important continuous channel is the Additive White Gaussian Noise (AWGN) channel. By the Shannon-Hartley theorem:

C_AWGN = B * log2(1 + S/N)

B is bandwidth (Hz) and S/N is the signal-to-noise ratio. Doubling the bandwidth doubles the capacity, but doubling the signal strength adds only 1 bit due to the log scale. This asymmetry is a fundamental design constraint in communication systems. 5G, Wi-Fi, and satellite communications are all designed to approach this limit as closely as possible.

## The Fundamental Tradeoff Between Compression and Preservation

Shannon's noisy channel coding theorem has a fundamental tradeoff built in -- the relationship between transmission rate R and error probability:

- If R < C: appropriate coding can make the error probability arbitrarily small
- If R > C: no coding can reduce the error probability to zero
- R = C is the exact boundary

Spatially, imagine it like this. It is like sending water (information) through a pipe with capacity C. Sending below the pipe's capacity means water arrives intact, but exceeding the capacity inevitably causes overflow and loss. But unlike a physical pipe, in an information channel, as long as the rate is below C, loss can be reduced to **exactly zero**. This is what makes Shannon's theorem remarkable.

This tradeoff recurs in richer forms in machine learning. A network's intermediate representation must compress input data while preserving information needed for prediction. Compressing too much destroys necessary information; compressing too little preserves noise and causes overfitting.

## Information Bottleneck: Reinterpretation as Learning Theory

The Information Bottleneck (IB) method by Tishby, Pereira & Bialek (2000) reinterpreted Shannon's channel coding in the language of learning theory. The core objective is:

min_{p(t|x)} I(X; T) - beta * I(T; Y)

X is input data, Y is labels (the prediction target), and T is the network's intermediate representation. This expression demands two things simultaneously: minimize I(X;T) so T discards unnecessary details from X (compression), and maximize I(T;Y) so T preserves information needed to predict Y (prediction). Beta balances these two objectives -- larger beta prioritizes prediction preservation, smaller beta prioritizes compression.

Tracking the extremes: as beta approaches infinity, the compression term is ignored and T preserves all information from X (no compression). When beta is 0, T discards information from X regardless of prediction (prediction fails). Practical learning occurs at an appropriate point between these extremes.

Shwartz-Ziv & Tishby (2017), in "Opening the Black Box of Deep Learning Using Information," attempted to experimentally verify this theory. They analyzed deep network learning in two phases: an initial fitting phase where both I(X;T) and I(T;Y) increase, followed by a compression phase where I(X;T) decreases while I(T;Y) is maintained. The interpretation: networks first memorize data as-is, then gradually discard unnecessary information to gain generalization ability. However, this hypothesis faces important counterarguments, discussed in the "Limitations and Weaknesses" section.

## Connections to Modern AI

The core principle of channel capacity -- "coding that preserves essence amid noise" -- lives on in transformed forms across modern AI techniques. However, the nature of each connection differs.

**Direct inspiration from the same information-theoretic principle:**

- **Denoising Autoencoder**: Vincent et al. (2008) added artificial noise to inputs and trained networks to recover the originals. The clean input is the "message to transmit," noise addition is "passing through the noisy channel," the encoder is the "encoder," and the decoder is the "decoder." Just as error-correcting codes leverage redundancy to combat noise, a successfully trained encoder extracts noise-robust representations.
- **Information Bottleneck-based learning**: Tishby et al.'s (2000) IB objective is mathematically isomorphic to Shannon's rate-distortion theory. Rate-distortion's "minimize distortion under a rate constraint" corresponds to IB's "minimize prediction loss under a representation information constraint." Alemi et al.'s (2017) Deep Variational Information Bottleneck (VIB) is a practical application of this to deep learning.
- **Cross-entropy loss function**: The standard classification loss, cross-entropy H(p,q) = -sum p(x) log q(x), is a direct extension of Shannon entropy. Minimizing this loss is equivalent to minimizing the KL divergence between the model output q and the true distribution p -- a core tool of information theory.

**Structural similarities sharing the same intuition independently:**

- **Information-theoretic interpretation of dropout**: Srivastava et al.'s (2014) dropout is a regularization technique that randomly deactivates neurons, originally motivated by ensemble effects. However, reinterpreted information-theoretically, it is structurally similar to inserting noisy channels within layers, imposing an upper bound on transmittable information. This similarity is a post-hoc interpretation; dropout was not directly inspired by information theory.
- **Network architecture and capacity allocation**: ResNet's skip connections can be interpreted as adding bypass channels to increase total information transmission capacity, while Transformer attention mechanisms can be seen as dynamically selecting information transmission paths based on input. These were not designed with information theory as inspiration but can be analyzed post-hoc through the channel capacity framework.

## Limitations and Weaknesses

- **Activation function dependence of the IB hypothesis**: Saxe et al. (2018) presented counterexamples showing that the compression phase reported by Shwartz-Ziv & Tishby appears only with saturating activation functions like tanh and is not observed with ReLU. Whether the information bottleneck is a universal principle of deep learning or a phenomenon specific to certain conditions remains unresolved.
- **Instability of high-dimensional mutual information estimation**: IB theory assumes I(X;T) and I(T;Y) can be computed exactly, but accurately estimating mutual information for continuous variables with thousands of dimensions is extremely difficult. Cases where conclusions vary depending on the estimation method (binning, KDE, MINE, etc.) have been reported (Goldfeld et al. 2019).
- **Theoretical limits in deterministic networks**: In deterministic networks without dropout, if a bijection (invertible function) exists between input and hidden layer, I(X;T) becomes theoretically infinite. In such cases the IB framework itself becomes inapplicable, and alternative measures like geometric information have been proposed.
- **The gap from existence proof to design tool**: Like Shannon's original theorem, IB shows that an optimal representation exists but does not guarantee that SGD converges to that optimum. Currently, IB has greater value as a post-hoc analytical tool for interpreting trained networks than as a prescriptive tool for designing them.

## Glossary

Channel capacity - the maximum information rate achievable with arbitrarily low error through a noisy channel. Defined as C = max I(X;Y), measured in bits per channel use

Mutual information - the amount of information shared between two variables. I(X;Y) = H(Y) - H(Y|X). The information gained about one variable by observing the other

Entropy - a measure of uncertainty for a random variable. H(X) = -sum p(x) log2 p(x). The more uniform the outcomes (like a fair coin), the higher the entropy

Binary Symmetric Channel (BSC) - the simplest discrete noisy channel where bits flip with probability p. The fundamental noise channel model, introduced first in textbooks

Shannon-Hartley theorem - the theorem establishing AWGN channel capacity C = B log2(1 + S/N). Quantifies how bandwidth and signal strength determine the information transmission limit

Information Bottleneck - a learning theory framework that optimizes the balance between input compression I(X;T) and prediction preservation I(T;Y) through mutual information. Proposed by Tishby et al. (2000)

Denoising Autoencoder - a neural network that extracts noise-robust representations by adding artificial noise to inputs and training to recover the originals. Vincent et al. (2008)

Existence proof - a proof that shows a solution exists without providing a specific construction method. Shannon's channel coding theorem is the canonical example

KL divergence (Kullback-Leibler divergence) - an asymmetric measure of difference between two probability distributions. DKL(p||q) = sum p(x) log(p(x)/q(x)). The mathematical foundation of the cross-entropy loss function

Rate-distortion theory - the branch of information theory that establishes the minimum bit rate needed to compress data at a given distortion level. The mathematical parent of the Information Bottleneck method
