---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 채널 용량, 잡음 채널 부호화, 정보 병목, 심층 학습 압축, 상호 정보량, 표현 학습
keywords_en: channel capacity, noisy channel coding, information bottleneck, deep learning compression, mutual information, representation learning
---
Channel Capacity and Noisy Channel Coding - 잡음이 있는 통신 채널에서 오류 없는 전송의 이론적 한계를 규정한 Shannon의 정리와, 이를 재해석한 심층 학습의 정보 병목 이론

## 불가능을 가능으로 만든 존재 증명

1948년, Claude Shannon은 정보 이론을 창시하면서 직관에 반하는 놀라운 결과를 증명했다. 잡음이 있는 채널을 통해서도, 전송 속도가 채널 용량(channel capacity) 이하이기만 하면, **임의로 작은 오류 확률**로 통신할 수 있다는 것이다. 잡음이 반드시 오류를 만드는 것이 아니라, 적절한 부호화(coding)로 오류를 원하는 만큼 줄일 수 있다.

채널 용량의 정의는 다음과 같다.

C = max_{p(x)} I(X; Y)

X는 입력, Y는 출력, I(X;Y)는 상호 정보량(mutual information)이다. 입력 분포 p(x)를 최적으로 선택했을 때, 채널을 통해 전달될 수 있는 최대 정보량이 채널 용량이다.

이것은 **존재 증명**(existence proof)이다. Shannon은 오류 없는 통신이 가능하다는 것을 증명했지만, 어떤 코드가 이를 달성하는지는 제시하지 않았다. 실제로 Shannon 한계에 근접하는 코드(Turbo codes, LDPC codes)가 발견되기까지 거의 50년이 걸렸다. 이론적 한계가 먼저 제시되고 실용적 방법이 뒤따르는 이 패턴은, 정보 병목 이론과 심층 학습의 관계에서도 반복된다.

## 대표적 채널의 용량

가장 기본적인 이산 채널인 이진 대칭 채널(Binary Symmetric Channel, BSC)은 0 또는 1을 전송할 때, 확률 p로 비트가 뒤집히는 채널이다. 이 채널의 용량은 다음과 같다.

C_BSC = 1 - H(p) = 1 - [-p log2(p) - (1-p) log2(1-p)]

p=0(오류 없음)이면 C=1 비트, p=0.5(완전 랜덤)이면 C=0 비트다. 오류가 50%이면 출력이 입력과 완전히 독립이므로 정보 전달이 불가능하다.

연속 채널 중 가장 중요한 것은 가산 백색 가우시안 잡음(Additive White Gaussian Noise, AWGN) 채널이다. Shannon-Hartley 정리에 따르면 이 채널의 용량은 다음과 같다.

C_AWGN = B * log2(1 + S/N)

B는 대역폭(Hz), S/N은 신호 대 잡음 비(Signal-to-Noise Ratio)다. 대역폭이 넓거나 신호가 강할수록 더 많은 정보를 전송할 수 있다. 이 공식은 통신 시스템 설계의 근본적 지침이 되었다. 5G, Wi-Fi, 위성 통신 모두 이 한계에 가능한 한 가까이 접근하려 한다.

## 정보 병목: 심층 학습의 재해석

Tishby, Pereira & Bialek(2000)이 제안한 정보 병목(Information Bottleneck, IB) 방법은 Shannon의 채널 부호화를 학습 이론으로 재해석한 것이다. 핵심 목적 함수는 다음과 같다.

min_{p(t|x)} I(X; T) - beta * I(T; Y)

X는 입력 데이터, Y는 레이블(예측 대상), T는 중간 표현(representation)이다. 이 목적 함수가 요구하는 것은 두 가지다. 첫째, I(X;T)를 최소화하여 T가 X의 **불필요한 정보를 버리도록** 한다(압축). 둘째, I(T;Y)를 최대화하여 T가 Y를 **예측하는 데 필요한 정보를 보존**하도록 한다(예측). beta는 이 두 목표의 균형을 조절한다.

채널 용량과의 대응이 명확하다.

- 잡음 채널 --> 심층 네트워크의 중간 레이어
- 채널 입력 --> 원시 데이터 X
- 채널 출력 --> 중간 표현 T
- 채널 용량 --> 레이어가 전달할 수 있는 최대 정보량
- 부호화 --> 학습된 특징 추출
- 잡음 --> 학습 과정의 정규화/드롭아웃

Shwartz-Ziv & Tishby(2017)의 "Opening the Black Box of Deep Learning Using Information"은 이 이론을 실험적으로 검증하려 했다. 심층 네트워크의 학습을 두 단계로 분석했다. 초기 피팅 단계에서 I(X;T)와 I(T;Y)가 모두 증가하고, 이후 압축 단계에서 I(X;T)가 감소하면서 I(T;Y)는 유지된다고 주장했다. 네트워크가 먼저 데이터를 기억한 뒤, 불필요한 정보를 버리며 일반화한다는 해석이다.

## 잡음 제거 오토인코더: 잡음 채널의 구현

Vincent et al.(2008)의 잡음 제거 오토인코더(Denoising Autoencoder, DAE)는 Shannon의 잡음 채널 부호화 원리를 신경망 학습에 직접 구현한 것으로 해석할 수 있다. 입력에 인위적 잡음을 추가한 뒤, 원래 깨끗한 입력을 복원하도록 학습한다.

이는 잡음 채널 통신의 구조와 일치한다. 깨끗한 입력이 "전송할 메시지", 잡음 추가가 "잡음 채널 통과", 인코더가 "부호기", 디코더가 "복호기"에 해당한다. DAE가 성공적으로 학습되면, 인코더는 잡음에 **강건한 표현**(robust representation)을 추출하게 된다. 이는 채널 부호화에서 오류 정정 코드가 잡음에 강건한 이유와 동일한 논리다. 중복성(redundancy)을 적절히 활용하여 잡음의 영향을 줄인다.

## 드롭아웃의 정보 이론적 해석

Srivastava et al.(2014)의 드롭아웃(dropout)도 정보 이론적으로 재해석될 수 있다. 학습 중 뉴런을 무작위로 비활성화하는 것은 네트워크 내부에 **잡음 채널**을 삽입하는 것과 구조적으로 유사하다. 드롭아웃된 레이어를 통해 전달되는 정보량에 상한(채널 용량)이 생기고, 네트워크는 이 제약 아래에서 가장 중요한 정보만 전달하도록 학습한다.

이 해석에 따르면, 드롭아웃이 과적합을 줄이는 이유는 단순히 앙상블 효과뿐 아니라, 정보 병목의 압축 효과 때문이기도 하다. 레이어가 전달할 수 있는 정보량이 제한되면, 불필요한 세부 사항(잡음)은 자연스럽게 탈락하고 예측에 필수적인 특징만 남는다.

## 표현 학습과 채널 용량의 한계

채널 용량 개념은 표현 학습(representation learning) 전반의 이론적 프레임워크를 제공한다. 네트워크의 각 레이어를 하나의 채널로 보면, 레이어 폭(width)과 활성화 함수의 특성이 채널 용량을 결정한다. 너무 좁은 레이어(병목)는 용량 부족으로 필요한 정보를 잃고, 너무 넓은 레이어는 불필요한 정보까지 보존하여 과적합 위험을 높인다.

이 관점에서 네트워크 아키텍처 설계는 **채널 용량의 배분** 문제가 된다. ResNet의 스킵 연결(skip connection)은 우회 채널을 추가하여 총 용량을 늘리는 것으로, Transformer의 어텐션 메커니즘은 입력에 따라 채널 용량을 동적으로 할당하는 것으로 해석할 수 있다.

## 한계와 약점

채널 용량과 정보 병목 이론의 AI 적용에는 중요한 논쟁과 한계가 있다.

- **정보 병목 가설의 논쟁**: Saxe et al.(2018)은 "On the Information Bottleneck Theory of Deep Learning"에서 Shwartz-Ziv & Tishby의 압축 단계가 **활성화 함수에 의존**한다는 반례를 제시했다. ReLU를 사용하면 압축 단계가 관찰되지 않으며, 포화 활성화 함수(tanh)에서만 나타난다고 주장했다. 정보 병목이 심층 학습의 보편적 원리인지는 여전히 열린 문제다.
- **고차원 상호 정보량 추정의 어려움**: 이론은 I(X;T)와 I(T;Y)를 정확히 계산할 수 있다고 가정하지만, 고차원 연속 변수에서 상호 정보량을 정확히 추정하는 것은 극히 어렵다. 추정 방법에 따라 결론이 달라지는 사례가 보고되었다(Goldfeld et al. 2019).
- **존재 증명의 한계**: Shannon의 채널 부호화 정리처럼, 정보 병목도 **달성 가능성**을 보여줄 뿐 **어떻게** 달성하는지는 알려주지 않는다. 현재의 SGD 기반 학습이 정보 병목 최적해에 수렴하는지는 보장되지 않는다.
- **결정론적 네트워크의 무한 MI**: 드롭아웃 없는 결정론적 네트워크에서 I(X;T)는 이론적으로 무한대가 될 수 있다(입력과 은닉층 사이에 일대일 대응이 존재할 때). 이 경우 정보 병목 프레임워크가 적용 불가능하며, 이 문제를 다루기 위해 기하학적 정보(geometric information) 같은 대안이 제안되었다.
- **실용적 가치 vs 이론적 우아함**: 정보 병목 이론이 네트워크 설계에 실질적 지침을 제공하는지에 대한 회의적 시각이 있다. 현재로서는 사후적 해석(post-hoc interpretation) 도구로서의 가치가 설계 도구로서의 가치보다 크다.

## 용어 정리

채널 용량(channel capacity) - 잡음 채널을 통해 오류 없이 전송할 수 있는 최대 정보율, C = max I(X;Y)

이진 대칭 채널(Binary Symmetric Channel, BSC) - 비트가 확률 p로 뒤집히는 가장 단순한 이산 잡음 채널

가산 백색 가우시안 잡음(AWGN) - 통신에서 가장 표준적인 연속 잡음 모델, 주파수에 무관한 균일 잡음

Shannon-Hartley 정리(Shannon-Hartley theorem) - AWGN 채널 용량 C = B log2(1 + S/N)을 규정하는 정리

정보 병목(Information Bottleneck) - 입력 압축과 예측 보존의 균형을 상호 정보량으로 최적화하는 프레임워크

상호 정보량(mutual information) - 두 변수가 공유하는 정보량, I(X;Y) = H(X) - H(X|Y)

잡음 제거 오토인코더(Denoising Autoencoder) - 입력에 잡음을 추가한 뒤 원본을 복원하도록 학습하여 강건한 표현을 추출하는 신경망

존재 증명(existence proof) - 해가 존재함을 보이되 구체적 구성 방법은 제시하지 않는 증명 방식

드롭아웃(dropout) - 학습 중 뉴런을 무작위로 비활성화하여 과적합을 줄이는 정규화 기법

---EN---
Channel Capacity and Noisy Channel Coding - Shannon's theorem establishing the theoretical limit of error-free transmission through noisy channels, and its reinterpretation as the Information Bottleneck theory of deep learning

## An Existence Proof That Made the Impossible Possible

In 1948, while founding information theory, Claude Shannon proved a result that defied intuition. Even through a noisy channel, communication with **arbitrarily small error probability** is possible as long as the transmission rate stays below channel capacity. Noise does not inevitably cause errors -- appropriate coding can reduce errors to any desired level.

Channel capacity is defined as:

C = max_{p(x)} I(X; Y)

X is the input, Y is the output, and I(X;Y) is mutual information. Channel capacity is the maximum information that can be transmitted through a channel when the input distribution p(x) is optimally chosen.

This is an **existence proof**. Shannon proved error-free communication is possible but did not specify which codes achieve it. Nearly 50 years passed before codes approaching the Shannon limit (Turbo codes, LDPC codes) were discovered. This pattern -- theoretical limits first, practical methods later -- repeats in the relationship between Information Bottleneck theory and deep learning.

## Capacity of Representative Channels

The most basic discrete channel, the Binary Symmetric Channel (BSC), transmits 0 or 1 with each bit flipping with probability p. Its capacity is:

C_BSC = 1 - H(p) = 1 - [-p log2(p) - (1-p) log2(1-p)]

When p=0 (no errors), C=1 bit; when p=0.5 (fully random), C=0 bits. At 50% error rate, the output is completely independent of the input, making information transfer impossible.

The most important continuous channel is the Additive White Gaussian Noise (AWGN) channel. By the Shannon-Hartley theorem, its capacity is:

C_AWGN = B * log2(1 + S/N)

B is bandwidth (Hz) and S/N is the Signal-to-Noise Ratio. Greater bandwidth or stronger signal allows more information transmission. This formula became the foundational guideline for communication system design. 5G, Wi-Fi, and satellite communications all strive to approach this limit.

## Information Bottleneck: Reinterpreting Deep Learning

The Information Bottleneck (IB) method proposed by Tishby, Pereira & Bialek (2000) reinterprets Shannon's channel coding as learning theory. The core objective is:

min_{p(t|x)} I(X; T) - beta * I(T; Y)

X is input data, Y is labels (prediction target), and T is the intermediate representation. This objective demands two things. First, minimize I(X;T) so T **discards unnecessary information** from X (compression). Second, maximize I(T;Y) so T **preserves information needed to predict** Y (prediction). Beta controls the balance between these objectives.

The correspondence with channel capacity is clear:

- Noisy channel --> deep network intermediate layers
- Channel input --> raw data X
- Channel output --> intermediate representation T
- Channel capacity --> maximum information a layer can transmit
- Encoding --> learned feature extraction
- Noise --> regularization / dropout in the learning process

Shwartz-Ziv & Tishby's (2017) "Opening the Black Box of Deep Learning Using Information" attempted experimental verification. They analyzed deep network learning in two phases: an initial fitting phase where both I(X;T) and I(T;Y) increase, followed by a compression phase where I(X;T) decreases while I(T;Y) is maintained. The interpretation: networks first memorize data, then discard unnecessary information to generalize.

## Denoising Autoencoders: Implementing the Noisy Channel

Vincent et al.'s (2008) Denoising Autoencoder (DAE) can be interpreted as directly implementing Shannon's noisy channel coding principle in neural network learning. Artificial noise is added to the input, and the network learns to recover the original clean input.

This matches the structure of noisy channel communication. The clean input is the "message to transmit," noise addition is "passing through the noisy channel," the encoder is the "encoder," and the decoder is the "decoder." When a DAE learns successfully, the encoder extracts **noise-robust representations**. This follows the same logic as error-correcting codes being robust to noise in channel coding: appropriately leveraging redundancy to reduce noise impact.

## Information-Theoretic Interpretation of Dropout

Srivastava et al.'s (2014) dropout can also be reinterpreted information-theoretically. Randomly deactivating neurons during training is structurally similar to inserting **noisy channels** within the network. A dropped-out layer imposes an upper bound (channel capacity) on the information transmitted through it, and the network learns to transmit only the most important information under this constraint.

Under this interpretation, dropout reduces overfitting not merely through ensemble effects but also through the compression effect of the information bottleneck. When a layer's information capacity is limited, unnecessary details (noise) naturally drop out, leaving only features essential for prediction.

## Representation Learning and Channel Capacity Limits

The channel capacity concept provides a theoretical framework for representation learning broadly. Viewing each network layer as a channel, layer width and activation function characteristics determine channel capacity. Layers that are too narrow (bottlenecks) lose necessary information due to insufficient capacity; layers that are too wide preserve unnecessary information, increasing overfitting risk.

From this perspective, network architecture design becomes a problem of **channel capacity allocation**. ResNet's skip connections can be interpreted as adding bypass channels to increase total capacity, while Transformer attention mechanisms can be seen as dynamically allocating channel capacity based on input.

## Limitations and Weaknesses

Applying channel capacity and Information Bottleneck theory to AI involves significant debates and limitations.

- **Information Bottleneck hypothesis controversy**: Saxe et al. (2018), in "On the Information Bottleneck Theory of Deep Learning," presented counterexamples showing that Shwartz-Ziv & Tishby's compression phase **depends on the activation function**. With ReLU, no compression phase is observed; it appears only with saturating activation functions (tanh). Whether the information bottleneck is a universal principle of deep learning remains an open question.
- **High-dimensional mutual information estimation difficulty**: The theory assumes I(X;T) and I(T;Y) can be computed exactly, but accurately estimating mutual information for high-dimensional continuous variables is extremely difficult. Cases where conclusions vary depending on the estimation method have been reported (Goldfeld et al. 2019).
- **Limits of existence proofs**: Like Shannon's channel coding theorem, the information bottleneck shows **achievability** but not **how** to achieve it. Whether current SGD-based learning converges to the information bottleneck optimum is not guaranteed.
- **Infinite MI in deterministic networks**: In deterministic networks without dropout, I(X;T) can theoretically be infinite (when a bijection exists between input and hidden layer). In such cases the information bottleneck framework becomes inapplicable, and alternatives like geometric information have been proposed.
- **Practical value vs theoretical elegance**: There is skepticism about whether Information Bottleneck theory provides practical guidance for network design. Currently, its value as a post-hoc interpretation tool exceeds its value as a design tool.

## Glossary

Channel capacity - the maximum information rate achievable with arbitrarily low error through a noisy channel, C = max I(X;Y)

Binary Symmetric Channel (BSC) - the simplest discrete noisy channel where bits flip with probability p

Additive White Gaussian Noise (AWGN) - the most standard continuous noise model in communications, uniform noise independent of frequency

Shannon-Hartley theorem - the theorem establishing AWGN channel capacity C = B log2(1 + S/N)

Information Bottleneck - a framework optimizing the balance between input compression and prediction preservation through mutual information

Mutual information - the information shared between two variables, I(X;Y) = H(X) - H(X|Y)

Denoising Autoencoder - a neural network that learns robust representations by adding noise to inputs and training to recover the originals

Existence proof - a proof showing a solution exists without providing a specific construction method

Dropout - a regularization technique that randomly deactivates neurons during training to reduce overfitting
