---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 상호 정보량, 통계적 의존성, 엔트로피, KL 발산, 데이터 처리 부등식, 대조 학습, InfoNCE, 정보 병목
keywords_en: mutual information, statistical dependence, entropy, KL divergence, data processing inequality, contrastive learning, InfoNCE, information bottleneck
---
Mutual Information - 두 확률변수가 공유하는 정보의 양을 측정하는 정보 이론의 핵심 척도로, 대조 학습과 정보 병목 이론에 직접적 수학적 토대를 제공

## 상관계수가 놓치는 것

두 변수 사이의 관계를 측정하는 가장 흔한 도구는 Pearson 상관계수다. 그런데 Y = X^2처럼 완벽한 비선형 관계에서 상관계수가 0이 나온다. X를 알면 Y를 정확히 알 수 있는데, "관계 없음"이라는 답이 돌아오는 것이다. 상관계수는 **선형** 관계만 측정하기 때문이다.

Claude Shannon이 1948년 정보 이론을 창시했을 때, "불확실성"을 수학적으로 정량화하는 도구가 필요했고, 엔트로피와 상호 정보량(Mutual Information, MI)이 탄생했다. MI는 상관계수와 달리 **모든 형태의 통계적 의존성** -- 선형이든 비선형이든 -- 을 포착한다.

벤 다이어그램으로 상상하면, 왼쪽 원은 X의 불확실성(H(X)), 오른쪽 원은 Y의 불확실성(H(Y))이다. 겹치는 영역이 MI, 즉 X와 Y가 **공유하는 정보의 양**이다. 겹침이 없으면(독립) MI = 0이고, 한쪽이 다른 쪽을 완전히 포함하면 MI는 최대가 된다.

## MI의 수학적 구조

Shannon이 정의한 MI의 공식은 다음과 같다.

I(X; Y) = sum_{x,y} p(x, y) log(p(x, y) / (p(x) p(y)))

결합 분포 p(x,y)가 주변 분포의 곱 p(x)p(y)와 얼마나 다른가를 측정한다. X와 Y가 독립이면 p(x,y) = p(x)p(y)이므로 I(X;Y) = 0이다. 의존성이 강할수록 MI가 커진다.

동치적 표현들이 서로 다른 직관을 보여준다.

I(X; Y) = H(X) - H(X|Y) = H(Y) - H(Y|X) = H(X) + H(Y) - H(X, Y)

H(X) - H(X|Y)는 "Y를 알았을 때 X에 대한 불확실성이 얼마나 감소하는가"다. MI는 **대칭적**이다(I(X;Y) = I(Y;X)). 비대칭적인 KL 발산과 구별되는 핵심 성질이다.

MI는 KL 발산의 특수한 경우이기도 하다. I(X; Y) = D_KL(p(x, y) || p(x) p(y)). 이 관계 덕분에 MI는 비음수이고, KL 발산의 변분 표현과 하한 추정 등 수학적 도구를 그대로 상속받는다. 이 상속이 나중에 신경망 기반 MI 추정의 이론적 근거가 된다.

## 데이터 처리 부등식: 정보는 증가하지 않는다

MI의 핵심 성질 중 하나가 데이터 처리 부등식(Data Processing Inequality, DPI)이다.

X --> Y --> Z 이면 I(X; Z) <= I(X; Y)

데이터를 변환하면 정보가 **증가하지 않는다**. 원본 사진(X)을 흑백으로 변환(Y)한 뒤 축소(Z)하면, 축소 이미지가 원본에 대해 가진 정보는 흑백 이미지가 가진 정보 이하다. 변환을 아무리 정교하게 해도 잃어버린 정보를 되살릴 수 없다.

신경망의 각 레이어를 하나의 변환으로 보면, 입력 X가 여러 레이어를 거쳐 표현 Z가 될 때 정보가 손실될 수 있지만 증가할 수는 없다. 이것이 정보 병목 이론의 수학적 토대다.

## 정보 이론에서 머신러닝으로

MI가 머신러닝에 들어온 경로는 세 갈래다.

- **정보 병목 이론**: Tishby, Pereira & Bialek(2000)이 MI를 학습 목표로 직접 사용했다. "좋은 표현 Z란, 입력 X에 대한 정보 I(X;Z)를 최소화하면서 목표 Y에 대한 정보 I(Z;Y)를 최대화하는 것"이라는 프레임워크다.
- **특징 선택(feature selection)**: Peng et al.(2005)의 mRMR은 특징과 목표 변수 사이의 MI를 최대화하면서 특징 간 MI(중복)를 최소화하는 기준을 제안했다.
- **대조 학습(contrastive learning)**: Oord, Li & Vinyals(2018)의 CPC가 MI 최대화를 자기지도 학습의 목적 함수로 도입하면서, MI는 현대 표현 학습의 핵심 이론적 언어가 되었다.

핵심 대응 관계는 다음과 같다.

- Shannon의 엔트로피(H) --> 학습에서의 **불확실성/정보량** 측도
- MI I(X;Y) --> 표현 Z가 입력 X에 대해 보존하는 **유용한 정보의 양**
- 데이터 처리 부등식 --> 신경망 레이어가 정보를 **잃을 수 있지만 만들 수 없다**는 제약
- KL 발산의 변분 하한 --> MI를 직접 계산하지 않고 **신경망으로 추정**하는 수학적 근거

## 고차원에서 MI를 추정하는 핵심 트레이드오프

MI를 직접 계산하려면 결합 확률 밀도 p(x,y)를 알아야 한다. 이미지나 텍스트 임베딩의 고차원에서는 사실상 불가능하다. 이 문제를 우회하는 두 가지 접근이 경쟁한다.

**InfoNCE (Oord et al. 2018)**: MI의 **하한**을 최대화한다. MI 추정을 **양성 쌍과 음성 쌍을 구분하는 분류 문제**로 변환한 것이다. 음성 샘플 K개를 사용하면 추정 가능한 MI의 상한이 log(K+1)로 제한된다. K = 1000이면 약 6.9비트가 상한이다. 분산이 낮아 학습이 안정적이라는 장점이 있다.

**MINE (Belghazi et al. 2018)**: Donsker-Varadhan 표현을 사용하여 이론적으로 무한한 MI도 추정 가능하다. 이론적 상한이 없다는 장점이 있지만, 분산이 높아 학습이 불안정해질 수 있다.

InfoNCE는 분산이 낮지만 MI를 과소추정하고(느슨한 하한), MINE은 이론적으로 정확하지만 분산이 높다(조인 하한). **조임(tightness)과 안정성(variance) 사이의 트레이드오프**가 MI 추정 연구의 핵심 긴장이다.

## 현대 AI 기법과의 연결

MI는 현대 AI의 여러 영역에서 이론적 언어이자 실용적 목적 함수로 쓰이고 있다.

**직접적 영감 -- MI가 목적 함수 또는 이론적 토대인 경우:**

- **대조 학습(SimCLR, MoCo)**: Chen et al.(2020)의 SimCLR은 같은 이미지에 다른 증강을 적용한 두 뷰 사이의 MI를 InfoNCE 손실로 최대화한다. 배치 크기 8192에서 ImageNet top-1 정확도 76.5%를 달성했다. He et al.(2020)의 MoCo는 모멘텀 인코더로 적은 GPU 메모리로도 풍부한 음성 샘플을 사용할 수 있게 했다.
- **Deep InfoMax (DIM)**: Hjelm et al.(2019)은 전체 이미지의 전역 표현과 각 패치의 지역 표현 사이의 MI를 최대화하여, 공간 정보가 중요한 다운스트림 태스크에서 효과적이었다.
- **정보 병목의 변분 근사**: Alemi et al.(2017)의 Deep Variational Information Bottleneck은 IB 목적 함수를 심층 신경망에서 변분 추론으로 최적화했다.

**구조적 유사성 -- 같은 직관을 공유하나 역사적으로 독립적인 경우:**

- **VAE의 ELBO**: KL 발산 항은 정보 병목의 "압축" 항과 구조적으로 유사하지만, Kingma & Welling(2014)은 변분 베이지안 추론에서 출발했으며 IB 이론을 직접 인용하지 않았다.
- **BYOL과 MI 프레임워크의 한계**: Grill et al.(2020)의 BYOL은 음성 샘플 없이도 표현 학습이 가능함을 보여, MI 최대화 프레임워크의 **필요성 자체에** 의문을 제기했다.

## 한계와 약점

- **고차원 MI 추정의 근본적 한계**: McAllester & Statos(2020)는 MI가 클수록 정확한 추정에 지수적으로 많은 샘플이 필요함을 증명했다. MI 최대화 방법의 피할 수 없는 이론적 천장이다.
- **의미론적 무관심**: Shannon의 MI는 통계적 의존성만 측정하고, 그 정보가 **의미적으로 유용한지**는 판단하지 않는다.
- **조임-분산 트레이드오프의 딜레마**: InfoNCE(느슨하지만 안정)와 MINE(조이지만 불안정) 사이에서 최적 선택의 이론적 가이드라인이 부재하다.
- **대조 학습에서의 MI 필요성 논쟁**: Tschannen et al.(2020)은 대조 학습의 성공이 MI 최대화 자체보다 인코더 구조와 음성 샘플 분포에 더 의존한다고 주장했다. BYOL(2020)이 음성 샘플 없이 성공하면서 MI 최대화가 필요조건인지조차 불확실해졌다.

## 용어 정리

상호 정보량(mutual information) - 두 확률변수가 공유하는 정보의 양. I(X;Y) = H(X) - H(X|Y). 비음수이고 독립이면 0

KL 발산(Kullback-Leibler divergence) - 두 확률분포 간의 비대칭적 차이 측도. MI는 결합 분포와 독립 가정 분포 사이의 KL 발산

데이터 처리 부등식(Data Processing Inequality) - 데이터 변환이 정보를 증가시키지 않는다는 원리. X->Y->Z이면 I(X;Z) <= I(X;Y)

InfoNCE - Oord et al.(2018)이 제안한 대조 학습 손실 함수. MI의 하한을 양성-음성 쌍 분류로 추정하며, 추정 상한은 log(K+1)

대조 학습(contrastive learning) - 양성 쌍은 가깝게, 음성 쌍은 멀게 표현을 학습하는 자기지도 학습 패러다임

정보 병목(Information Bottleneck) - Tishby et al.(2000)이 제안한 프레임워크. 입력에 대한 정보를 압축하면서 목표에 대한 정보를 보존하는 최적 표현을 MI로 정의

변분 하한(variational lower bound) - 직접 계산이 어려운 양의 최적화 가능한 근사 하한. MI 추정에서 InfoNCE와 Donsker-Varadhan 표현이 대표적

조건부 엔트로피(conditional entropy) - 한 변수를 알았을 때 남는 다른 변수의 불확실성. H(X|Y) = H(X) - I(X;Y)
---EN---
Mutual Information - A core information-theoretic measure of the shared information between two random variables, providing the direct mathematical foundation for contrastive learning and information bottleneck theory

## What Correlation Misses

The most common tool for measuring relationships between two variables is Pearson correlation. But for a perfect nonlinear relationship like Y = X^2, correlation returns zero. Knowing X tells you Y exactly, yet the measure says "no relationship." Correlation measures only **linear** relationships.

When Claude Shannon founded information theory in 1948, he needed tools to quantify "uncertainty" mathematically, giving rise to entropy and Mutual Information (MI). Unlike correlation, MI captures **all forms of statistical dependence** -- linear or nonlinear.

Visualize MI as a Venn diagram: the left circle is X's uncertainty (H(X)), the right is Y's (H(Y)). The overlap is MI -- the **shared information**. No overlap (independence) means MI = 0; complete containment maximizes MI.

## The Mathematical Structure of MI

Shannon's formula for MI:

I(X; Y) = sum_{x,y} p(x, y) log(p(x, y) / (p(x) p(y)))

This measures how much the joint distribution p(x,y) differs from the product of marginals p(x)p(y). When independent, I(X;Y) = 0. Stronger dependence increases MI.

Equivalent expressions reveal different intuitions:

I(X; Y) = H(X) - H(X|Y) = H(Y) - H(Y|X) = H(X) + H(Y) - H(X, Y)

H(X) - H(X|Y) is "how much knowing Y reduces uncertainty about X." MI is **symmetric** (I(X;Y) = I(Y;X)), distinguishing it from asymmetric KL divergence.

MI is also a special case of KL divergence: I(X; Y) = D_KL(p(x, y) || p(x) p(y)). This guarantees non-negativity and means MI inherits KL divergence's variational representations and lower bound estimation tools -- the theoretical basis for neural MI estimation.

## Data Processing Inequality: Information Cannot Increase

If X --> Y --> Z, then I(X; Z) <= I(X; Y)

Transforming data **cannot increase** information. Converting a color photo to grayscale then downscaling it: the downscaled image has at most as much information about the original as the grayscale version. No transformation can recover lost information.

Each neural network layer is a transformation. As input X passes through layers to become representation Z, information may be lost but cannot increase. This is the mathematical foundation of Information Bottleneck theory.

## From Information Theory to Machine Learning

MI entered machine learning through three paths:

- **Information Bottleneck theory**: Tishby et al. (2000) used MI directly as a learning objective -- "a good representation Z minimizes I(X;Z) while maximizing I(Z;Y)."
- **Feature selection**: Peng et al.'s (2005) mRMR proposed maximizing MI between features and target while minimizing inter-feature MI (redundancy).
- **Contrastive learning**: Oord et al.'s (2018) CPC introduced MI maximization as the self-supervised learning objective, making MI the central theoretical language of modern representation learning.

Key correspondences:

- Shannon's entropy (H) --> **uncertainty/information** measure in learning
- MI I(X;Y) --> **useful information** preserved by representation Z about input X
- Data Processing Inequality --> neural network layers **can lose but cannot create** information
- Variational lower bounds of KL divergence --> mathematical basis for **neural MI estimation**

## The Core Tradeoff of MI Estimation in High Dimensions

Directly computing MI requires knowing p(x,y). In high-dimensional spaces (images, text embeddings), this is practically impossible. Two competing approaches:

**InfoNCE (Oord et al. 2018)**: Maximizes an MI **lower bound** by transforming estimation into a **classification task** distinguishing positive from negative pairs. With K negative samples, estimable MI is capped at log(K+1). K = 1000 gives a ceiling of roughly 6.9 bits. Advantage: low variance, stable training.

**MINE (Belghazi et al. 2018)**: Uses the Donsker-Varadhan representation, theoretically capable of estimating arbitrarily large MI. Advantage: no theoretical ceiling. Disadvantage: high variance, potentially unstable training.

InfoNCE is stable but underestimates MI (loose bound); MINE is theoretically accurate but has high variance (tight bound). **The tension between tightness and stability** is the core theme of MI estimation research.

## Connections to Modern AI

**Direct inspiration -- MI as objective or theoretical foundation:**

- **Contrastive learning (SimCLR, MoCo)**: SimCLR (2020) maximizes MI between two augmented views via InfoNCE, achieving 76.5% ImageNet top-1 at batch size 8192. MoCo (2020) uses a momentum encoder for rich negatives with limited GPU memory.
- **Deep InfoMax (DIM)**: Hjelm et al. (2019) maximized MI between global and local representations, effective for spatial-aware downstream tasks.
- **Deep Variational Information Bottleneck**: Alemi et al. (2017) optimized the IB objective in deep networks via variational inference.

**Structural similarity -- historically independent:**

- **VAE's ELBO**: The KL term is structurally similar to IB's compression term, but Kingma & Welling (2014) did not cite IB theory.
- **BYOL and MI framework limits**: Grill et al. (2020) showed representation learning without negative samples, questioning the necessity of MI maximization itself.

## Limitations and Weaknesses

- **Fundamental limits of high-dimensional MI estimation**: McAllester & Statos (2020) proved accurate estimation requires exponentially more samples as MI increases -- an inescapable ceiling.
- **Semantic indifference**: MI measures only statistical dependence, not whether the information is semantically useful.
- **Tightness-variance dilemma**: No theoretical guideline exists for choosing between InfoNCE (loose, stable) and MINE (tight, unstable).
- **Necessity debate in contrastive learning**: Tschannen et al. (2020) argued success depends more on encoder architecture than MI maximization. BYOL's success without negatives questions whether MI maximization is even necessary.

## Glossary

Mutual information - the amount of shared information between two random variables. I(X;Y) = H(X) - H(X|Y). Non-negative, zero iff independent

KL divergence - an asymmetric measure of difference between distributions. MI is the KL divergence between joint and product-of-marginals

Data Processing Inequality - the principle that transformation cannot increase information. If X->Y->Z then I(X;Z) <= I(X;Y)

InfoNCE - a contrastive loss (Oord et al. 2018) estimating MI lower bound via positive-negative classification, capped at log(K+1)

Contrastive learning - a self-supervised paradigm pulling positive pairs close and pushing negative pairs apart

Information Bottleneck - framework (Tishby et al. 2000) defining optimal representations via MI: compress input, preserve target information

Variational lower bound - an optimizable approximate lower bound for difficult-to-compute quantities. InfoNCE and Donsker-Varadhan are prominent examples

Conditional entropy - remaining uncertainty of one variable given another. H(X|Y) = H(X) - I(X;Y)
