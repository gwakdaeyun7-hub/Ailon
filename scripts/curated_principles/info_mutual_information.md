---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 상호 정보량, 통계적 의존성, 엔트로피, KL 발산, 데이터 처리 부등식, 대조 학습, InfoNCE, 정보 병목
keywords_en: mutual information, statistical dependence, entropy, KL divergence, data processing inequality, contrastive learning, InfoNCE, information bottleneck
---
Mutual Information - 두 확률변수가 공유하는 정보의 양을 측정하는 정보 이론의 핵심 척도로, 대조 학습과 정보 병목 이론에 직접적 수학적 토대를 제공

## 상관계수가 놓치는 것

두 변수 사이의 관계를 측정하는 가장 흔한 도구는 Pearson 상관계수다. 그런데 이 도구에는 치명적인 맹점이 있다. Y = X^2처럼 완벽한 비선형 관계에서 상관계수가 0이 나온다. X를 알면 Y를 정확히 알 수 있는데, "관계 없음"이라는 답이 돌아오는 것이다. 이유는 단순하다. 상관계수는 **선형** 관계만 측정하기 때문이다.

Claude Shannon이 1948년 논문 "A Mathematical Theory of Communication"에서 정보 이론을 창시했을 때, 그의 핵심 관심사는 통신 채널을 통해 메시지를 얼마나 효율적으로 전달할 수 있는가였다. 이 과정에서 "불확실성"을 수학적으로 정량화하는 도구가 필요했고, 그 결과 엔트로피(entropy)와 상호 정보량(Mutual Information, MI)이 탄생했다. MI는 상관계수와 달리 **모든 형태의 통계적 의존성** -- 선형이든 비선형이든, 연속이든 이산이든 -- 을 포착한다.

MI를 공간적으로 상상하면 이렇다. 두 개의 원이 부분적으로 겹치는 벤 다이어그램을 떠올려보자. 왼쪽 원은 X의 불확실성(엔트로피 H(X)), 오른쪽 원은 Y의 불확실성(H(Y))이다. 두 원이 겹치는 영역이 바로 MI, 즉 X와 Y가 **공유하는 정보의 양**이다. 겹침이 없으면(독립) MI = 0이고, 한쪽이 다른 쪽을 완전히 포함하면 MI는 최대가 된다.

## MI의 수학적 구조

Shannon이 정의한 MI의 공식은 다음과 같다.

I(X; Y) = sum_{x,y} p(x, y) log(p(x, y) / (p(x) p(y)))

이 공식이 측정하는 것은 명확하다. 결합 분포 p(x,y)가 주변 분포의 곱 p(x)p(y)와 얼마나 다른가. X와 Y가 독립이면 p(x,y) = p(x)p(y)이므로 log 안의 비율이 1이 되고, log(1) = 0이라서 I(X;Y) = 0이다. 의존성이 강할수록 결합 분포가 독립 가정에서 크게 벗어나며, MI가 커진다.

동치적 표현들이 MI의 서로 다른 직관을 보여준다.

I(X; Y) = H(X) - H(X|Y) = H(Y) - H(Y|X) = H(X) + H(Y) - H(X, Y)

1. H(X) - H(X|Y): Y를 알았을 때 X에 대한 불확실성이 얼마나 **감소**하는가. 예를 들어, 내일 날씨(X)의 불확실성이 3비트인데 오늘 기압(Y)을 알면 1비트로 줄어든다면, MI = 2비트다.
2. H(Y) - H(Y|X): 반대 방향도 동일하다. MI는 **대칭적**이다. I(X;Y) = I(Y;X). KL 발산(비대칭)과 구별되는 핵심 성질이다.
3. H(X) + H(Y) - H(X,Y): 벤 다이어그램의 겹침 영역 공식 그 자체다. 개별 엔트로피를 더하면 겹치는 부분이 두 번 세어지므로, 결합 엔트로피를 빼서 한 번만 남긴다.

MI는 KL 발산(Kullback-Leibler divergence)의 특수한 경우이기도 하다.

I(X; Y) = D_KL(p(x, y) || p(x) p(y))

결합 분포와 독립 가정 하의 분포 사이의 KL 발산이 MI다. 이 관계 덕분에 MI는 비음수(Gibbs 부등식)이고, 독립일 때만 정확히 0이라는 성질이 보장된다. 또한 KL 발산의 변분 표현(variational representation), 하한 추정(lower bound estimation) 등 수학적 도구를 MI가 그대로 상속받는 경로가 된다. 이 상속이 나중에 신경망 기반 MI 추정의 이론적 근거가 된다.

## 데이터 처리 부등식: 정보는 증가하지 않는다

MI의 핵심 성질 중 하나가 데이터 처리 부등식(Data Processing Inequality, DPI)이다.

X --> Y --> Z 이면 I(X; Z) <= I(X; Y)

데이터를 변환하면 정보가 **증가하지 않는다**. 원본 사진(X)을 흑백으로 변환(Y)한 뒤 다시 축소(Z)하면, 축소 이미지가 원본에 대해 가진 정보는 흑백 이미지가 가진 정보 이하다. 색상 정보는 흑백 변환에서 이미 사라졌고, 축소에서 해상도 정보까지 추가로 잃는다. 변환을 아무리 정교하게 해도, 잃어버린 정보를 되살릴 수는 없다.

이 부등식이 중요한 이유는 신경망의 각 레이어를 하나의 변환으로 볼 수 있기 때문이다. 입력 X가 여러 레이어를 거쳐 표현 Z가 될 때, 각 단계에서 입력에 대한 정보가 손실될 수 있지만 증가할 수는 없다. 이 관찰이 정보 병목 이론(Information Bottleneck)의 수학적 토대가 된다.

## 정보 이론에서 머신러닝으로

MI가 머신러닝에 들어온 경로는 세 갈래다. 특히 대조 학습 경로에서는 구체적 숫자가 중요하다. InfoNCE 손실에서 음성 샘플 K개를 사용하면 추정 가능한 MI의 상한이 log(K+1)로 제한된다. K = 1000이면 상한은 약 6.9비트다. 이 제약 아래에서도 Chen et al.(2020)의 SimCLR은 배치 크기 8192(한 배치 내 다른 이미지들이 음성 샘플 역할)로 ImageNet top-1 정확도 76.5%를 달성하여, 레이블 없이도 지도 학습에 근접한 표현을 학습할 수 있음을 보였다.

- **정보 병목 이론**: Tishby, Pereira & Bialek(2000)이 MI를 학습 목표로 직접 사용했다. "좋은 표현 Z란, 입력 X에 대한 정보 I(X;Z)를 **최소화**하면서 목표 Y에 대한 정보 I(Z;Y)를 **최대화**하는 것"이라는 프레임워크를 제안했다. 압축과 예측의 균형을 MI로 정량화한 것이다.
- **특징 선택(feature selection)**: Battiti(1994), Peng et al.(2005)의 mRMR(minimum Redundancy Maximum Relevance)은 특징과 목표 변수 사이의 MI를 최대화하면서 특징 간 MI(중복)를 최소화하는 기준을 제안했다. MI가 비선형 의존성까지 포착하므로, 상관계수 기반 선택이 놓치는 유용한 특징을 찾을 수 있다.
- **대조 학습(contrastive learning)**: Oord, Li & Vinyals(2018)의 CPC(Contrastive Predictive Coding)가 MI 최대화를 자기지도 학습의 목적 함수로 도입하면서, MI는 현대 표현 학습의 핵심 이론적 언어가 되었다.

핵심 대응 관계는 다음과 같다.

- Shannon의 엔트로피(H) --> 학습에서의 **불확실성/정보량** 측도
- MI I(X;Y) --> 표현 Z가 입력 X에 대해 보존하는 **유용한 정보의 양**
- 데이터 처리 부등식 --> 신경망 레이어가 정보를 **잃을 수 있지만 만들 수 없다**는 제약
- KL 발산의 변분 하한 --> MI를 직접 계산하지 않고 **신경망으로 추정**하는 수학적 근거

## 고차원에서 MI를 추정하는 핵심 트레이드오프

MI를 직접 계산하려면 결합 확률 밀도 p(x,y)를 알아야 한다. 저차원(변수 2~3개)에서는 히스토그램이나 커널 밀도 추정으로 가능하지만, 이미지(수만 차원)나 텍스트 임베딩(수백 차원)에서는 사실상 불가능하다. 차원이 높아질수록 데이터가 공간에 희박하게 흩어져서 밀도 추정이 극도로 부정확해진다. 이른바 "차원의 저주"다.

이 문제를 우회하는 두 가지 접근이 경쟁한다.

**접근 1 -- InfoNCE (Oord et al. 2018)**: MI를 직접 추정하지 않고, MI의 **하한**(lower bound)을 최대화한다.

L_InfoNCE = -E[log(exp(f(x, y_pos)) / (exp(f(x, y_pos)) + sum_{j=1}^{K} exp(f(x, y_neg_j))))]

f(x,y)는 두 입력의 호환성을 측정하는 스코어 함수, y_pos는 x와 관련된 양성 샘플(같은 이미지의 다른 뷰), y_neg_j는 관련 없는 음성 샘플 K개다. 이 손실을 최소화하면 MI의 하한이 최대화된다. 핵심 통찰은 MI 추정을 **양성 쌍과 음성 쌍을 구분하는 분류 문제**로 변환한 것이다. 그러나 추정 가능한 MI의 상한이 log(K+1)로 제한된다. 음성 샘플 K가 1000이면 약 6.9비트가 상한이다. 실제 MI가 이보다 크면 과소추정이 불가피하다. 장점은 분산이 낮아 학습이 안정적이라는 것이다.

**접근 2 -- MINE (Belghazi et al. 2018)**: Donsker-Varadhan 표현을 사용하여 이론적으로 무한한 MI도 추정 가능하다.

I(X; Y) >= E_{p(x,y)}[T(x, y)] - log(E_{p(x)p(y)}[e^{T(x, y)}])

T는 신경망(통계량 네트워크)으로, 하한을 최대한 조이는 방향으로 학습된다. 이론적 상한이 없다는 장점이 있지만, 지수 함수의 log-mean-exp 항 때문에 분산이 높아 학습이 불안정해질 수 있다.

두 방법의 트레이드오프를 정리하면 이렇다. InfoNCE는 분산이 낮지만 MI를 과소추정하고(느슨한 하한), MINE은 이론적으로 정확하지만 분산이 높다(조인 하한). **조임(tightness)과 안정성(variance) 사이의 이 트레이드오프**가 MI 추정 연구의 핵심 긴장이다.

## 정보 병목: 압축과 예측의 최적 균형

Tishby et al.(2000)의 정보 병목(Information Bottleneck, IB) 이론은 MI를 학습의 최적화 목표로 격상시켰다.

min I(X; Z) - beta * I(Z; Y)

X는 입력, Z는 학습된 표현, Y는 예측 대상이다. 첫 항은 표현 Z가 입력 X에 대해 가진 정보를 **최소화**하라는 압축 압력이고, 둘째 항은 Z가 목표 Y에 대해 가진 정보를 **최대화**하라는 예측 압력이다. beta는 두 압력의 균형을 조절한다.

beta가 극단에서 어떻게 되는지 추적하면 의미가 선명해진다. beta가 0이면 I(X;Z)만 최소화하므로 Z는 X에 대해 아무 정보도 담지 않는 상수가 된다 -- 완전 압축, 예측 불가. beta가 무한대이면 I(Z;Y)만 최대화하므로 Z는 X의 사본이 된다 -- 압축 없음, 과적합 위험. 실용적 beta는 이 두 극단 사이에서 "Y를 예측하는 데 **불필요한** X의 세부 정보를 버리는" 최적점을 찾는다.

Shwartz-Ziv & Tishby(2017)는 심층 신경망의 학습 과정을 정보 병목 관점에서 분석하여 큰 주목을 받았다. 학습 초기에는 I(X;Z)와 I(Z;Y)가 모두 증가하고(적합 단계), 후기에는 I(X;Z)가 감소하면서 I(Z;Y)는 유지된다(압축 단계)는 "두 단계" 가설을 제시했다. 다만 이 관찰이 모든 아키텍처와 활성화 함수에서 재현되는지에 대해서는 Saxe et al.(2018)의 반론이 있어, 아직 논쟁 중인 주제다.

## 현대 AI 기법과의 연결

MI는 현대 AI의 여러 영역에서 이론적 언어이자 실용적 목적 함수로 쓰이고 있다. 다만 연결의 성격은 다르다.

**직접적 영감 -- MI가 목적 함수 또는 이론적 토대인 경우:**

- **대조 학습(SimCLR, MoCo)**: Chen et al.(2020)의 SimCLR은 같은 이미지에 다른 증강을 적용한 두 뷰 사이의 MI를 InfoNCE 손실로 최대화한다. 배치 크기 8192에서 ImageNet top-1 정확도 76.5%를 달성하여, 레이블 없이도 지도 학습에 근접한 표현을 학습할 수 있음을 보였다. He et al.(2020)의 MoCo는 음성 샘플을 큐에 저장하고 모멘텀 인코더로 일관된 키 표현을 유지하여, 적은 GPU 메모리로도 풍부한 음성 샘플을 사용할 수 있게 했다.
- **Deep InfoMax (DIM)**: Hjelm et al.(2019)은 전체 이미지의 전역 표현과 각 패치의 지역 표현 사이의 MI를 최대화했다. 전역 표현이 모든 공간적 부분의 정보를 보존하게 되어, 객체 탐지나 세그멘테이션처럼 공간 정보가 중요한 다운스트림 태스크에서 효과적이었다.
- **정보 병목의 변분 근사**: Alemi et al.(2017)의 Deep Variational Information Bottleneck은 IB 목적 함수를 심층 신경망에서 변분 추론으로 최적화하는 방법을 제시했다. 일종의 정규화 효과가 있어 과적합을 줄이고 적대적 공격에 대한 강건성을 높였다.

**구조적 유사성 -- 같은 직관을 공유하나 역사적으로 독립적인 경우:**

- **VAE의 ELBO**: 변분 오토인코더의 손실 함수에서 KL 발산 항은 잠재 표현의 정보량을 제한하는 역할을 한다. 정보 병목의 "압축" 항과 구조적으로 유사하지만, Kingma & Welling(2014)은 변분 베이지안 추론에서 출발했으며 IB 이론을 직접 인용하지 않았다.
- **BYOL과 MI 프레임워크의 한계**: Grill et al.(2020)의 BYOL은 음성 샘플 없이도 표현 학습이 가능함을 보여, MI 최대화 프레임워크의 **필요성 자체에** 의문을 제기했다. 대조 학습의 성공이 MI 최대화 때문인지, 아니면 인코더 아키텍처와 증강 전략 때문인지는 아직 열린 질문이다.

## 한계와 약점

- **고차원 MI 추정의 근본적 한계**: McAllester & Statos(2020)는 MI가 클수록 정확한 추정에 지수적으로 많은 샘플이 필요함을 증명했다. 실제 MI가 크면(예: 고해상도 이미지와 그 표현 사이) 어떤 추정기도 체계적으로 과소추정한다. 이는 MI 최대화 방법의 피할 수 없는 이론적 천장이다.
- **의미론적 무관심**: Shannon의 MI는 통계적 의존성만 측정하고, 그 정보가 **의미적으로 유용한지**는 판단하지 않는다. 이미지의 밝기 분포와 내용은 높은 MI를 가질 수 있지만, 밝기 정보가 분류에 중요한지는 태스크에 따라 다르다.
- **조임-분산 트레이드오프의 딜레마**: InfoNCE(느슨하지만 안정)와 MINE(조이지만 불안정) 사이에서 중간 지점을 찾기 어렵다. 어느 하한을 선택하느냐에 따라 학습 결과가 달라지며, 최적 선택의 이론적 가이드라인이 부재하다.
- **대조 학습에서의 MI 필요성 논쟁**: Tschannen et al.(2020)은 대조 학습의 성공이 MI 최대화 자체보다 인코더 구조와 음성 샘플 분포에 더 의존한다고 주장했다. BYOL(2020)이 음성 샘플 없이 성공하면서 MI 최대화가 필요조건인지조차 불확실해졌다.

## 용어 정리

엔트로피(entropy) - 확률변수의 불확실성 크기. H(X) = -sum p(x) log p(x). 동전 던지기는 1비트, 주사위는 약 2.58비트

상호 정보량(mutual information) - 두 확률변수가 공유하는 정보의 양. I(X;Y) = H(X) - H(X|Y). 비음수이고 독립이면 0

조건부 엔트로피(conditional entropy) - 한 변수를 알았을 때 남는 다른 변수의 불확실성. H(X|Y) = H(X) - I(X;Y)

KL 발산(Kullback-Leibler divergence) - 두 확률분포 간의 비대칭적 차이 측도. MI는 결합 분포와 독립 가정 분포 사이의 KL 발산

데이터 처리 부등식(Data Processing Inequality) - 데이터 변환이 정보를 증가시키지 않는다는 원리. X->Y->Z이면 I(X;Z) <= I(X;Y)

InfoNCE - Oord et al.(2018)이 제안한 대조 학습 손실 함수. MI의 하한을 양성-음성 쌍 분류로 추정하며, 추정 상한은 log(K+1)

대조 학습(contrastive learning) - 양성 쌍(같은 출처의 두 뷰)은 가깝게, 음성 쌍(다른 출처)은 멀게 표현을 학습하는 자기지도 학습 패러다임

정보 병목(Information Bottleneck) - Tishby et al.(2000)이 제안한 프레임워크. 입력에 대한 정보를 압축하면서 목표에 대한 정보를 보존하는 최적 표현을 MI로 정의

변분 하한(variational lower bound) - 직접 계산이 어려운 양의 최적화 가능한 근사 하한. MI 추정에서 InfoNCE와 Donsker-Varadhan 표현이 대표적

거짓 음성(false negative) - 대조 학습에서 실제로는 양성인데 음성으로 취급된 샘플. 배치 내 같은 클래스 이미지가 음성으로 잡히면 학습을 해침

---EN---
Mutual Information - A core information-theoretic measure of the shared information between two random variables, providing the direct mathematical foundation for contrastive learning and information bottleneck theory

## What Correlation Misses

The most common tool for measuring relationships between two variables is Pearson correlation. But it has a critical blind spot: for a perfect nonlinear relationship like Y = X^2, correlation returns zero. Knowing X tells you Y exactly, yet the measure says "no relationship." The reason is simple: correlation measures only **linear** relationships.

When Claude Shannon founded information theory in his 1948 paper "A Mathematical Theory of Communication," his core concern was how efficiently messages could be transmitted through a communication channel. This required tools to mathematically quantify "uncertainty," giving rise to entropy and Mutual Information (MI). Unlike correlation, MI captures **all forms of statistical dependence** -- linear or nonlinear, continuous or discrete.

To visualize MI spatially: imagine a Venn diagram with two partially overlapping circles. The left circle is X's uncertainty (entropy H(X)), the right is Y's uncertainty (H(Y)). The overlapping region is MI -- the amount of **shared information** between X and Y. No overlap (independence) means MI = 0; if one circle completely contains the other, MI is maximized.

## The Mathematical Structure of MI

Shannon's formula for MI is:

I(X; Y) = sum_{x,y} p(x, y) log(p(x, y) / (p(x) p(y)))

What this measures is clear: how much the joint distribution p(x,y) differs from the product of marginals p(x)p(y). When X and Y are independent, p(x,y) = p(x)p(y), making the ratio inside the log equal to 1, and since log(1) = 0, I(X;Y) = 0. Stronger dependence means the joint distribution deviates more from the independence assumption, increasing MI.

Equivalent expressions reveal different intuitions:

I(X; Y) = H(X) - H(X|Y) = H(Y) - H(Y|X) = H(X) + H(Y) - H(X, Y)

1. H(X) - H(X|Y): how much does knowing Y **reduce** uncertainty about X. For example, if tomorrow's weather (X) has 3 bits of uncertainty but knowing today's barometric pressure (Y) reduces it to 1 bit, then MI = 2 bits.
2. H(Y) - H(Y|X): the same in reverse. MI is **symmetric**: I(X;Y) = I(Y;X). This distinguishes it from KL divergence, which is asymmetric.
3. H(X) + H(Y) - H(X,Y): the Venn diagram overlap formula itself. Adding individual entropies double-counts the overlap, so subtracting joint entropy leaves it counted once.

MI is also a special case of KL divergence (Kullback-Leibler divergence):

I(X; Y) = D_KL(p(x, y) || p(x) p(y))

MI is the KL divergence between the joint distribution and the distribution under the independence assumption. This relationship guarantees MI is non-negative (Gibbs inequality) and zero only under independence. It also means MI inherits all mathematical tools of KL divergence -- variational representations, lower bound estimation, and more. This inheritance later becomes the theoretical basis for neural MI estimation.

## Data Processing Inequality: Information Cannot Increase

One of MI's core properties is the Data Processing Inequality (DPI):

If X --> Y --> Z, then I(X; Z) <= I(X; Y)

Transforming data **cannot increase** information. If you convert a color photo (X) to grayscale (Y) then downscale it (Z), the downscaled image has at most as much information about the original as the grayscale version does. Color information was lost in the grayscale conversion; resolution was further lost in downscaling. No matter how sophisticated the transformation, lost information cannot be recovered.

This inequality matters because each layer of a neural network can be viewed as a transformation. As input X passes through multiple layers to become representation Z, information about the input may be lost at each step but cannot increase. This observation becomes the mathematical foundation of Information Bottleneck theory.

## From Information Theory to Machine Learning

MI entered machine learning through three paths. The contrastive learning path is where concrete numbers matter most. In the InfoNCE loss, using K negative samples caps the estimable MI at log(K+1). With K = 1000, the ceiling is approximately 6.9 bits. Even under this constraint, Chen et al.'s (2020) SimCLR used batch size 8192 (other images in the batch serve as negative samples) to achieve 76.5% ImageNet top-1 accuracy, demonstrating that label-free learning can approach supervised performance.

- **Information Bottleneck theory**: Tishby, Pereira & Bialek (2000) used MI directly as a learning objective. They proposed that "a good representation Z minimizes information about input X (I(X;Z)) while maximizing information about target Y (I(Z;Y))" -- quantifying the balance between compression and prediction through MI.
- **Feature selection**: Battiti (1994) and Peng et al.'s (2005) mRMR (minimum Redundancy Maximum Relevance) proposed maximizing MI between features and the target variable while minimizing MI among features (redundancy). Since MI captures nonlinear dependence, it finds useful features that correlation-based selection misses.
- **Contrastive learning**: Oord, Li & Vinyals' (2018) CPC (Contrastive Predictive Coding) introduced MI maximization as the objective for self-supervised learning, making MI the central theoretical language of modern representation learning.

The key correspondences are:

- Shannon's entropy (H) --> **uncertainty/information** measure in learning
- MI I(X;Y) --> amount of **useful information** a representation Z preserves about input X
- Data Processing Inequality --> the constraint that neural network layers **can lose but cannot create** information
- Variational lower bounds of KL divergence --> mathematical basis for **estimating MI with neural networks** without direct computation

## The Core Tradeoff of MI Estimation in High Dimensions

Directly computing MI requires knowing the joint probability density p(x,y). In low dimensions (2-3 variables), histograms or kernel density estimation suffice, but for images (tens of thousands of dimensions) or text embeddings (hundreds of dimensions), this is practically impossible. As dimensionality increases, data becomes sparse in the space, making density estimation extremely inaccurate -- the so-called "curse of dimensionality."

Two competing approaches circumvent this problem:

**Approach 1 -- InfoNCE (Oord et al. 2018)**: Rather than estimating MI directly, maximize a **lower bound** on MI.

L_InfoNCE = -E[log(exp(f(x, y_pos)) / (exp(f(x, y_pos)) + sum_{j=1}^{K} exp(f(x, y_neg_j))))]

f(x,y) is a score function measuring compatibility between two inputs, y_pos is a positive sample related to x (a different view of the same image), and y_neg_j are K unrelated negative samples. Minimizing this loss maximizes a lower bound on MI. The key insight is transforming MI estimation into a **classification task distinguishing positive from negative pairs**. However, the estimable MI is capped at log(K+1). With K = 1000 negatives, the ceiling is approximately 6.9 bits. If true MI exceeds this, systematic underestimation is unavoidable. The advantage is low variance, making training stable.

**Approach 2 -- MINE (Belghazi et al. 2018)**: Using the Donsker-Varadhan representation, theoretically capable of estimating arbitrarily large MI.

I(X; Y) >= E_{p(x,y)}[T(x, y)] - log(E_{p(x)p(y)}[e^{T(x, y)}])

T is a neural network (statistics network) trained to tighten the lower bound as much as possible. The advantage is no theoretical ceiling, but the log-mean-exp term of the exponential causes high variance, potentially destabilizing training.

The tradeoff between these two: InfoNCE has low variance but underestimates MI (loose bound); MINE is theoretically accurate but has high variance (tight bound). **The tension between tightness and stability** is the core theme of MI estimation research.

## Information Bottleneck: The Optimal Balance of Compression and Prediction

Tishby et al.'s (2000) Information Bottleneck (IB) theory elevated MI to a learning optimization objective:

min I(X; Z) - beta * I(Z; Y)

X is the input, Z the learned representation, Y the prediction target. The first term is compression pressure -- **minimize** information Z has about X. The second is prediction pressure -- **maximize** information Z has about Y. Beta controls the balance.

Tracking what happens at extremes clarifies the meaning. When beta = 0, only I(X;Z) is minimized, so Z becomes a constant with no information about X -- total compression, no prediction possible. When beta approaches infinity, only I(Z;Y) is maximized, so Z becomes a copy of X -- no compression, overfitting risk. Practical beta values find the sweet spot between these extremes: "discard details of X that are **unnecessary** for predicting Y."

Shwartz-Ziv & Tishby (2017) analyzed deep neural network learning through the IB lens, garnering significant attention. They proposed a "two-phase" hypothesis: early in training, both I(X;Z) and I(Z;Y) increase (fitting phase); later, I(X;Z) decreases while I(Z;Y) is maintained (compression phase). However, whether this observation reproduces across all architectures and activation functions remains debated, with Saxe et al. (2018) offering counterarguments.

## Connections to Modern AI

MI serves as both a theoretical language and practical objective function across multiple areas of modern AI. The nature of each connection differs.

**Direct inspiration -- MI as objective function or theoretical foundation:**

- **Contrastive learning (SimCLR, MoCo)**: Chen et al.'s (2020) SimCLR maximizes MI between two differently augmented views of the same image via InfoNCE loss. With batch size 8192, it achieved 76.5% ImageNet top-1 accuracy, demonstrating that label-free learning can approach supervised performance. He et al.'s (2020) MoCo stores negative samples in a queue with a momentum encoder for consistent key representations, enabling rich negatives with limited GPU memory.
- **Deep InfoMax (DIM)**: Hjelm et al. (2019) maximized MI between an image's global representation and each local patch representation. This ensures the global representation preserves information from all spatial parts, proving effective for downstream tasks where spatial information matters, such as object detection and segmentation.
- **Variational approximation of IB**: Alemi et al.'s (2017) Deep Variational Information Bottleneck optimizes the IB objective in deep networks via variational inference. It provides a regularization effect that reduces overfitting and improves robustness to adversarial attacks.

**Structural similarity -- sharing the same intuition but historically independent:**

- **VAE's ELBO**: In variational autoencoders, the KL divergence term in the loss function constrains the information content of latent representations. This is structurally similar to IB's "compression" term, but Kingma & Welling (2014) started from variational Bayesian inference and did not directly cite IB theory.
- **BYOL and the limits of the MI framework**: Grill et al.'s (2020) BYOL demonstrated that representation learning is possible without negative samples, questioning the **necessity of the MI maximization framework itself**. Whether contrastive learning succeeds because of MI maximization or because of encoder architecture and augmentation strategy remains an open question.

## Limitations and Weaknesses

- **Fundamental limits of high-dimensional MI estimation**: McAllester & Statos (2020) proved that accurate MI estimation requires exponentially more samples as MI increases. When true MI is large (e.g., between a high-resolution image and its representation), any estimator systematically underestimates. This is an inescapable theoretical ceiling for MI maximization methods.
- **Semantic indifference**: Shannon's MI measures only statistical dependence, not whether the information is **semantically useful**. Brightness distribution and image content may share high MI, but whether brightness matters for classification depends on the task.
- **Tightness-variance tradeoff dilemma**: Finding a middle ground between InfoNCE (loose but stable) and MINE (tight but unstable) is difficult. Learning outcomes vary by bound choice, and no theoretical guideline for the optimal choice exists.
- **The necessity debate in contrastive learning**: Tschannen et al. (2020) argued that contrastive learning success depends more on encoder architecture and negative sample distribution than MI maximization itself. With BYOL (2020) succeeding without negatives, whether MI maximization is even a necessary condition has become uncertain.

## Glossary

Entropy - the magnitude of uncertainty in a random variable. H(X) = -sum p(x) log p(x). A coin flip is 1 bit; a die roll is approximately 2.58 bits

Mutual information - the amount of information shared between two random variables. I(X;Y) = H(X) - H(X|Y). Non-negative and zero if and only if independent

Conditional entropy - the remaining uncertainty of one variable given knowledge of another. H(X|Y) = H(X) - I(X;Y)

KL divergence (Kullback-Leibler divergence) - an asymmetric measure of difference between two probability distributions. MI is the KL divergence between the joint distribution and the product of marginals

Data Processing Inequality - the principle that data transformation cannot increase information. If X->Y->Z then I(X;Z) <= I(X;Y)

InfoNCE - a contrastive learning loss function proposed by Oord et al. (2018). Estimates an MI lower bound through positive-negative pair classification, with an estimation ceiling of log(K+1)

Contrastive learning - a self-supervised learning paradigm that learns representations by pulling positive pairs (two views from the same source) close and pushing negative pairs (different sources) apart

Information Bottleneck - a framework proposed by Tishby et al. (2000). Defines optimal representations through MI as those that compress input information while preserving target information

Variational lower bound - an optimizable approximate lower bound on quantities that are difficult to compute directly. InfoNCE and the Donsker-Varadhan representation are prominent examples in MI estimation

False negative - a sample that is actually positive but treated as negative in contrastive learning. Same-class images within a batch being captured as negatives degrades learning quality
