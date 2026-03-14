---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 상호 정보량, 통계적 의존성, 대조 학습, InfoNCE, 자기지도 학습, 표현 학습, MI 추정
keywords_en: mutual information, statistical dependence, contrastive learning, InfoNCE, self-supervised learning, representation learning, MI estimation
---
Mutual Information - 두 확률변수 간의 통계적 의존성을 정량화하는 정보 이론적 척도로, 자기지도 학습과 대조 학습의 이론적 토대

## 상관관계를 넘어서: 의존성의 참된 척도

Pearson 상관계수는 두 변수 사이의 **선형** 관계만 측정한다. 두 변수가 완벽한 비선형 관계(예: Y = X^2)를 가지더라도 상관계수는 0이 될 수 있다. 상호 정보량(Mutual Information, MI)은 이 근본적 한계를 넘어, **모든 형태의 통계적 의존성**을 포착한다.

Shannon(1948)이 정의한 상호 정보량의 공식은 다음과 같다.

I(X; Y) = sum_{x,y} p(x, y) log(p(x, y) / (p(x) p(y)))

이 공식이 측정하는 것은 명확하다. 결합 분포 p(x,y)가 주변 분포의 곱 p(x)p(y)와 얼마나 다른가. X와 Y가 독립이면 p(x,y) = p(x)p(y)이므로 log 안의 비율이 1이 되어 I(X;Y) = 0이다. 의존성이 있으면 결합 분포가 독립 가정에서 벗어나며, MI가 양수가 된다.

동치적 표현들이 MI의 다양한 직관을 제공한다.

I(X; Y) = H(X) - H(X|Y) = H(Y) - H(Y|X) = H(X) + H(Y) - H(X, Y)

첫 번째: Y를 알면 X에 대한 불확실성이 얼마나 줄어드는가. 두 번째: X를 알면 Y에 대한 불확실성이 얼마나 줄어드는가. 세 번째: 개별 엔트로피의 합에서 결합 엔트로피를 뺀 것, 즉 "공유되는 정보"의 양. 이 세 표현이 동일하다는 것 자체가 MI의 대칭성을 보여준다. KL 발산과 달리, MI는 대칭이다: I(X;Y) = I(Y;X).

## MI와 KL 발산의 관계

상호 정보량은 KL 발산의 특수한 경우로 이해할 수 있다.

I(X; Y) = D_KL(p(x, y) || p(x) p(y))

결합 분포와 독립 가정 하의 분포 사이의 KL 발산이 바로 MI다. 이 관계는 MI가 비음수이고(Gibbs 부등식), 독립일 때만 0이 되는 성질을 즉시 보여준다. 또한 MI가 KL 발산의 모든 수학적 도구(변분 표현, 하한 추정 등)를 상속받는 이유이기도 하다.

데이터 처리 부등식(Data Processing Inequality)도 MI의 핵심 성질이다.

X --> Y --> Z이면 I(X; Z) <= I(X; Y)

데이터를 처리(변환)하면 정보가 **증가하지 않는다**. 신경망의 각 레이어를 거칠 때마다 입력에 대한 정보가 손실될 수 있지만 증가할 수는 없다. 이것이 정보 병목 이론(Tishby et al. 2000)의 수학적 토대 중 하나다.

## CPC와 InfoNCE: MI 최대화의 실용적 돌파구

고차원 공간에서 MI를 직접 계산하는 것은 확률 밀도 추정이 필요하므로 극히 어렵다. Oord, Li & Vinyals(2018)의 CPC(Contrastive Predictive Coding)는 이 문제를 MI의 **하한**(lower bound)을 최대화하는 것으로 우회했다.

InfoNCE 손실 함수는 다음과 같다.

L_InfoNCE = -E[log(exp(f(x, y_pos)) / (exp(f(x, y_pos)) + sum_{j=1}^{K} exp(f(x, y_neg_j))))]

여기서 f(x,y)는 x와 y의 호환성을 측정하는 스코어 함수(비평가 함수, critic), y_pos는 x와 관련된 양성 샘플, y_neg_j는 관련 없는 음성 샘플 K개다. 이 손실의 최소화가 I(X;Y)의 하한을 최대화한다는 것이 증명되었다.

핵심 통찰은 이것이다. MI를 직접 추정하지 않고, **양성 쌍과 음성 쌍을 구분하는 분류 문제**로 변환한다. 좋은 표현은 양성 쌍(같은 이미지의 다른 뷰, 같은 문장의 다른 부분)을 가깝게, 음성 쌍(다른 이미지, 다른 문장)을 멀게 만든다. 이 분류 정확도가 높을수록 MI의 하한이 커진다.

InfoNCE의 이론적 한계는 log(K+1)이다. 음성 샘플이 K개이면 추정 가능한 MI 상한이 log(K+1)이다. 따라서 더 정확한 MI 하한을 얻으려면 더 많은 음성 샘플이 필요하다.

## MINE: 신경망으로 MI를 추정하다

Belghazi et al.(2018)의 MINE(Mutual Information Neural Estimation)은 MI 추정에 다른 접근을 취했다. Donsker-Varadhan 표현을 사용하여 MI의 하한을 신경망으로 최적화한다.

I(X; Y) >= E_{p(x,y)}[T(x, y)] - log(E_{p(x)p(y)}[e^{T(x, y)}])

T는 통계량 네트워크(statistics network)로, MI의 하한을 최대한 조여주는 방향으로 학습된다. MINE은 이론적으로 임의 정밀도의 MI 추정이 가능하지만, 실제로는 지수 함수의 log-mean-exp 항 때문에 분산이 높아 학습이 불안정할 수 있다.

## SimCLR, MoCo: 대조 학습의 폭발

Oord et al.의 InfoNCE 프레임워크는 시각적 표현 학습에서 대조 학습(contrastive learning)의 폭발적 성장을 촉발했다.

Chen et al.(2020)의 SimCLR은 같은 이미지에 두 가지 다른 데이터 증강(random crop + color jitter + Gaussian blur)을 적용하여 양성 쌍을 만들고, 배치 내 다른 이미지를 음성 샘플로 사용한다. 목적 함수는 정확히 InfoNCE다. 핵심 발견은, 데이터 증강의 구성(composition)이 표현 품질을 결정하며, 큰 배치 크기(더 많은 음성 샘플)가 성능을 향상시킨다는 것이다.

He et al.(2020)의 MoCo(Momentum Contrast)는 SimCLR의 큰 배치 크기 요구를 해결했다. 음성 샘플을 큐(queue)에 저장하고, 모멘텀 인코더(momentum encoder)로 일관된 키 표현을 유지한다. 이를 통해 적은 GPU 메모리로도 풍부한 음성 샘플을 사용할 수 있다.

이론적으로, 이 모든 방법은 입력 이미지 X와 그 표현 Z 사이의 MI를 최대화하려 한다. 그러나 실제로 최대화되는 것은 MI의 하한이며, 이 하한의 조임(tightness)은 보장되지 않는다.

## Deep InfoMax과 지역-전역 MI

Hjelm et al.(2019)의 DIM(Deep InfoMax)은 MI 최대화를 더 세밀하게 활용한다. 전체 이미지 표현(전역, global)과 이미지의 각 패치 표현(지역, local) 사이의 MI를 최대화한다.

I(전역 표현; 지역 패치 표현)을 최대화하면, 전역 표현이 이미지의 모든 공간적 부분의 정보를 보존하게 된다. 이는 전역 표현만 최대화할 때보다 더 풍부한 특징을 학습한다. 특히 다운스트림 태스크에서 공간적 정보가 중요한 경우(객체 탐지, 세그멘테이션) 효과적이다.

DIM은 또한 MI 최대화만으로는 좋은 표현이 보장되지 않음을 보여주었다. MI가 높아도 픽셀 수준의 사소한 정보(색상 통계, 밝기 분포)를 보존하는 데 용량이 소비될 수 있다. 이 문제를 해결하기 위해, 표현이 특정 사전 분포를 따르도록 하는 추가 정규화를 도입했다.

## 한계와 약점

상호 정보량 기반 학습의 한계는 이론적이면서 동시에 실용적이다.

- **고차원 MI 추정의 근본적 어려움**: McAllester & Statos(2020)는 "Formal Limitations on the Measurement of Mutual Information"에서, MI가 클수록 정확한 추정에 지수적으로 많은 샘플이 필요함을 증명했다. 즉, MI가 클 때 정확히 추정하는 것은 본질적으로 어렵다. 이는 MI 최대화 기반 방법들의 근본적 한계다.
- **조임 vs 느슨함 트레이드오프**: MI 하한의 조임(tightness)과 추정 분산(variance) 사이에 트레이드오프가 있다. 조인 하한(예: MINE의 Donsker-Varadhan)은 분산이 높고, 느슨한 하한(예: InfoNCE)은 분산이 낮지만 MI를 과소추정한다. 어느 하한을 선택하느냐에 따라 학습 결과가 달라진다.
- **MI 최대화의 불충분성**: Tschannen et al.(2020)은 대조 학습의 성공이 MI 최대화 자체보다는 **인코더 아키텍처와 음성 샘플 분포**에 더 의존한다고 주장했다. MI 최대화는 필요조건이지 충분조건이 아닐 수 있다.
- **의미론적 무관심**: Shannon MI는 통계적 의존성만 측정하고 **의미적 관련성**은 무시한다. 이미지의 색상 히스토그램과 내용은 높은 MI를 가질 수 있지만, 색상 정보가 의미적으로 중요한지는 태스크에 따라 다르다. MI 최대화가 태스크에 유용한 정보를 보장하지 않는다.
- **음성 샘플 의존성**: InfoNCE 기반 방법은 음성 샘플의 질과 양에 크게 의존한다. 거짓 음성(false negative) -- 실제로는 양성인데 음성으로 취급된 샘플 -- 이 학습을 해치며, 음성 샘플 수(K)가 MI 추정 상한을 결정한다. BYOL(Grill et al. 2020)과 같은 후속 연구는 음성 샘플 없이도 학습이 가능함을 보여, MI 최대화 프레임워크의 필요성 자체에 의문을 제기했다.

## 용어 정리

상호 정보량(mutual information) - 두 확률변수가 공유하는 정보의 양, I(X;Y) = H(X) - H(X|Y), 모든 형태의 통계적 의존성을 포착

데이터 처리 부등식(Data Processing Inequality) - 데이터 변환이 정보를 증가시키지 않는다는 원리, X->Y->Z이면 I(X;Z) <= I(X;Y)

InfoNCE - Oord et al.(2018)이 제안한 대조 학습 손실 함수, MI 하한을 양성-음성 쌍 분류로 추정

MINE(Mutual Information Neural Estimation) - Donsker-Varadhan 표현을 신경망으로 최적화하여 MI를 추정하는 방법

대조 학습(contrastive learning) - 양성 쌍은 가깝게, 음성 쌍은 멀게 표현을 학습하는 자기지도 학습 패러다임

양성 쌍(positive pair) - 같은 의미 또는 같은 출처에서 온 두 데이터 뷰의 쌍

음성 샘플(negative sample) - 기준 데이터와 관련 없는 것으로 간주되는 샘플

모멘텀 인코더(momentum encoder) - 주 인코더의 지수 이동 평균으로 업데이트되는 보조 인코더, 일관된 키 표현 유지

거짓 음성(false negative) - 실제로는 양성이지만 음성으로 잘못 분류된 샘플, 대조 학습의 학습 품질을 저해

---EN---
Mutual Information - An information-theoretic measure quantifying the statistical dependence between two random variables, serving as the theoretical foundation for self-supervised and contrastive learning

## Beyond Correlation: The True Measure of Dependence

Pearson correlation measures only **linear** relationships between two variables. Even with a perfect nonlinear relationship (e.g., Y = X^2), correlation can be zero. Mutual Information (MI) transcends this fundamental limitation, capturing **all forms of statistical dependence**.

Shannon's (1948) formula for mutual information is:

I(X; Y) = sum_{x,y} p(x, y) log(p(x, y) / (p(x) p(y)))

What this measures is clear: how much the joint distribution p(x,y) differs from the product of marginals p(x)p(y). When X and Y are independent, p(x,y) = p(x)p(y), making the ratio inside the log equal to 1, so I(X;Y) = 0. With dependence, the joint distribution deviates from the independence assumption, and MI becomes positive.

Equivalent expressions provide various intuitions about MI:

I(X; Y) = H(X) - H(X|Y) = H(Y) - H(Y|X) = H(X) + H(Y) - H(X, Y)

First: how much does knowing Y reduce uncertainty about X. Second: how much does knowing X reduce uncertainty about Y. Third: the sum of individual entropies minus joint entropy -- the amount of "shared information." That these three expressions are identical demonstrates MI's symmetry. Unlike KL divergence, MI is symmetric: I(X;Y) = I(Y;X).

## MI and KL Divergence Relationship

Mutual information can be understood as a special case of KL divergence:

I(X; Y) = D_KL(p(x, y) || p(x) p(y))

MI is the KL divergence between the joint distribution and the distribution under independence assumption. This relationship immediately shows that MI is non-negative (Gibbs inequality) and zero only under independence. It also explains why MI inherits all mathematical tools of KL divergence (variational representations, lower bound estimation, etc.).

The Data Processing Inequality is also a core property of MI:

If X --> Y --> Z, then I(X; Z) <= I(X; Y)

Processing (transforming) data **cannot increase** information. As data passes through each layer of a neural network, information about the input may be lost but cannot increase. This is one of the mathematical foundations of Information Bottleneck theory (Tishby et al. 2000).

## CPC and InfoNCE: A Practical Breakthrough in MI Maximization

Directly computing MI in high-dimensional spaces requires probability density estimation and is extremely difficult. Oord, Li & Vinyals' (2018) CPC (Contrastive Predictive Coding) circumvented this by maximizing a **lower bound** on MI.

The InfoNCE loss function is:

L_InfoNCE = -E[log(exp(f(x, y_pos)) / (exp(f(x, y_pos)) + sum_{j=1}^{K} exp(f(x, y_neg_j))))]

Here f(x,y) is a score function (critic) measuring compatibility between x and y, y_pos is a positive sample related to x, and y_neg_j are K unrelated negative samples. Minimizing this loss was proven to maximize a lower bound on I(X;Y).

The key insight: rather than estimating MI directly, the problem transforms into a **classification task distinguishing positive from negative pairs**. Good representations bring positive pairs (different views of the same image, different parts of the same sentence) close together and push negative pairs (different images, different sentences) apart. Higher classification accuracy means a tighter MI lower bound.

InfoNCE's theoretical limit is log(K+1). With K negative samples, the estimable MI upper bound is log(K+1). More negative samples are needed for a more accurate MI lower bound.

## MINE: Estimating MI with Neural Networks

Belghazi et al.'s (2018) MINE (Mutual Information Neural Estimation) took a different approach to MI estimation. Using the Donsker-Varadhan representation, it optimizes an MI lower bound with a neural network:

I(X; Y) >= E_{p(x,y)}[T(x, y)] - log(E_{p(x)p(y)}[e^{T(x, y)}])

T is a statistics network trained to tighten the MI lower bound as much as possible. MINE theoretically enables MI estimation at arbitrary precision, but in practice the log-mean-exp term of the exponential function causes high variance, potentially destabilizing training.

## SimCLR, MoCo: The Contrastive Learning Explosion

Oord et al.'s InfoNCE framework triggered explosive growth in contrastive learning for visual representation learning.

Chen et al.'s (2020) SimCLR creates positive pairs by applying two different data augmentations (random crop + color jitter + Gaussian blur) to the same image, using other images in the batch as negative samples. The objective is precisely InfoNCE. The key finding: the composition of data augmentations determines representation quality, and larger batch sizes (more negative samples) improve performance.

He et al.'s (2020) MoCo (Momentum Contrast) solved SimCLR's large batch size requirement. It stores negative samples in a queue and maintains consistent key representations via a momentum encoder. This enables rich negative samples with limited GPU memory.

Theoretically, all these methods seek to maximize MI between input image X and its representation Z. In practice, however, what is maximized is a lower bound on MI, and the tightness of this bound is not guaranteed.

## Deep InfoMax and Local-Global MI

Hjelm et al.'s (2019) DIM (Deep InfoMax) leverages MI maximization more granularly. It maximizes MI between the global image representation and each local patch representation:

Maximizing I(global representation; local patch representation) ensures the global representation preserves information from all spatial parts of the image. This learns richer features than maximizing global representation alone, and is particularly effective when downstream tasks require spatial information (object detection, segmentation).

DIM also demonstrated that MI maximization alone does not guarantee good representations. Even with high MI, capacity may be consumed preserving trivial pixel-level information (color statistics, brightness distributions). To address this, additional regularization constraining representations to follow a specific prior distribution was introduced.

## Limitations and Weaknesses

The limitations of MI-based learning are both theoretical and practical.

- **Fundamental difficulty of high-dimensional MI estimation**: McAllester & Statos (2020), in "Formal Limitations on the Measurement of Mutual Information," proved that accurate MI estimation requires exponentially more samples as MI increases. Precisely estimating large MI values is inherently difficult, representing a fundamental limitation of MI maximization methods.
- **Tightness vs looseness tradeoff**: A tradeoff exists between the tightness of MI lower bounds and estimation variance. Tight bounds (e.g., MINE's Donsker-Varadhan) have high variance; loose bounds (e.g., InfoNCE) have low variance but underestimate MI. The choice of bound affects learning outcomes.
- **Insufficiency of MI maximization**: Tschannen et al. (2020) argued that contrastive learning's success depends more on **encoder architecture and negative sample distribution** than MI maximization itself. MI maximization may be necessary but not sufficient.
- **Semantic indifference**: Shannon MI measures only statistical dependence, ignoring **semantic relevance**. An image's color histogram and content may share high MI, but whether color information is semantically important depends on the task. MI maximization does not guarantee task-useful information.
- **Negative sample dependence**: InfoNCE-based methods heavily depend on negative sample quality and quantity. False negatives -- samples that are actually positive but treated as negative -- harm learning, and the number of negatives (K) determines the MI estimation upper bound. Subsequent work like BYOL (Grill et al. 2020) showed learning is possible without negative samples at all, questioning the necessity of the MI maximization framework itself.

## Glossary

Mutual information - the amount of information shared between two random variables, I(X;Y) = H(X) - H(X|Y), capturing all forms of statistical dependence

Data Processing Inequality - the principle that data transformation cannot increase information, if X->Y->Z then I(X;Z) <= I(X;Y)

InfoNCE - a contrastive learning loss function proposed by Oord et al. (2018) that estimates an MI lower bound through positive-negative pair classification

MINE (Mutual Information Neural Estimation) - a method estimating MI by optimizing the Donsker-Varadhan representation with a neural network

Contrastive learning - a self-supervised learning paradigm that learns representations by pulling positive pairs close and pushing negative pairs apart

Positive pair - a pair of two data views from the same source or with the same meaning

Negative sample - a sample considered unrelated to the reference data

Momentum encoder - an auxiliary encoder updated as an exponential moving average of the main encoder, maintaining consistent key representations

False negative - a sample that is actually positive but incorrectly classified as negative, degrading contrastive learning quality
