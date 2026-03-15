---
difficulty: intermediate
connectionType: mathematical_foundation
keywords: KL 발산, 쿨백-라이블러, 비대칭성, 모드 커버링, 모드 추구, 변분 추론, 교차 엔트로피, 정보 이론
keywords_en: KL divergence, Kullback-Leibler, asymmetry, mode-covering, mode-seeking, variational inference, cross-entropy, information theory
---
Kullback-Leibler Divergence - 두 확률 분포 사이의 비대칭적 차이를 측정하는 정보 이론의 척도로, 현대 AI 손실 함수의 수학적 뼈대

## 정보 이론에서 태어난 "판별 정보"

1951년, Solomon Kullback과 Richard Leibler는 논문 "On Information and Sufficiency"에서 두 확률 분포가 얼마나 다른지를 측정하는 양을 정의했다. 그들은 이를 **판별 정보**(discriminating information)라 불렀다. 이 작업은 Shannon(1948)이 정보 엔트로피를 정의한 지 불과 3년 뒤에 이루어졌으며, Shannon의 엔트로피가 "하나의 분포가 얼마나 불확실한가"를 측정한다면, KL 발산은 "두 분포가 얼마나 다른가"를 측정하는 자연스러운 확장이다.

핵심 공식은 다음과 같다.

D_KL(P || Q) = sum_x P(x) log(P(x) / Q(x))

정보 이론적으로 이것은 매우 구체적인 의미를 가진다. 실제 분포 P에서 생성된 데이터를, P 대신 Q에 기반한 부호 체계로 압축할 때, 최적 대비 **추가로** 필요한 평균 비트 수다. 비유하면 이렇다. 서울 날씨 패턴(P)에 맞춰 설계된 옷장이 최적의 옷장이라면, 부산 날씨 패턴(Q)에 맞춰 설계된 옷장으로 서울 생활을 하면 불필요한 옷이 늘어나고 필요한 옷이 빠진다. 그 "비효율의 크기"가 KL 발산이다. 두 날씨 패턴이 같으면 비효율은 0이고, 다를수록 커진다.

수학적으로 가장 중요한 성질은 **비음수성**(Gibbs 부등식)이다.

D_KL(P || Q) >= 0

등호는 P = Q일 때만 성립한다. 이 부등식은 log 함수의 볼록성(concavity)과 Jensen 부등식에서 직접 유도된다. KL 발산이 0 이상이라는 것은, 이를 최소화하면 Q가 P에 가까워지는 방향으로 수렴한다는 뜻이다. 이 성질이 KL 발산을 최적화 목적 함수로 쓸 수 있게 만드는 근본적 이유다.

## 정보 이론에서 기계 학습으로

KL 발산이 AI의 핵심 도구가 된 것은 하나의 사건이 아니라 여러 경로가 합류한 결과다. 핵심 전환점들은 다음과 같다.

- Akaike(1974)의 AIC(Akaike Information Criterion)가 KL 발산을 **모델 선택** 기준으로 처음 활용했다. "여러 통계 모델 중 데이터의 참 분포에 가장 가까운 것을 고르라"는 문제를 KL 최소화로 정식화한 것이다.
- Dempster, Laird & Rubin(1977)의 EM 알고리즘이 잠재 변수 모델의 학습에 KL 발산 기반 하한(lower bound)을 사용했다. 이것이 후에 변분 추론(variational inference)의 뿌리가 된다.
- Hinton & van Camp(1993)가 신경망 가중치의 불확실성을 KL 발산으로 정규화하는 아이디어를 제안했다. 이것이 변분 베이지안 학습의 초기 형태다.
- Kingma & Welling(2014)의 VAE가 KL 발산을 생성 모델의 목적 함수에 직접 내장하면서, KL 발산은 딥러닝 시대의 핵심 구성 요소가 되었다.

핵심 대응 관계는 다음과 같다.

- 참 분포 P --> **데이터의 실제 분포** (학습 목표)
- 근사 분포 Q --> **모델이 학습하는 분포** (파라미터로 조정)
- 추가 비트 수 --> **손실 함수 값** (최소화 대상)
- 비음수성 --> **하한의 존재** (ELBO 등 변분 목적 함수의 이론적 근거)
- 비대칭성 --> **전방 KL과 역방 KL의 행동 차이** (모델 설계 선택)

Shannon의 엔트로피와 달리 KL 발산은 원래 학문에서의 수학적 형태가 AI에 **그대로** 보존된 드문 사례다. 물리학 공식이 알고리즘으로 옮겨질 때 단위나 상수가 탈락하는 것(예: SA에서 볼츠만 상수 생략)과 달리, KL 발산은 공식 자체가 변형 없이 손실 함수로 쓰인다.

## 비대칭성: 방향이 행동을 결정한다

KL 발산의 가장 중요하고도 직관에 반하는 성질은 **비대칭성**이다.

D_KL(P || Q) != D_KL(Q || P)

이것이 KL 발산을 "거리"가 아닌 "발산"이라 부르는 이유다. 진정한 거리 함수는 대칭이어야 하고 삼각 부등식(A에서 C까지의 거리가 A에서 B, B에서 C까지의 합보다 클 수 없다)을 만족해야 하지만, KL 발산은 둘 다 만족하지 않는다.

이 비대칭성이 실제로 어떤 차이를 만드는지가 핵심이다.

**전방 KL**(forward KL): D_KL(P || Q)를 Q에 대해 최소화한다. P가 기준이다. P(x) > 0인 모든 곳에서 Q(x)도 양수여야 한다. 그렇지 않으면 log(P(x)/Q(x))가 무한대로 발산한다. 결과적으로 Q는 P가 확률을 부여하는 **모든 영역을 덮으려** 한다. 이를 **모드 커버링**(mode-covering)이라 한다.

**역방 KL**(reverse KL): D_KL(Q || P)를 Q에 대해 최소화한다. Q(x) > 0인 곳에서 P(x) = 0이면 페널티가 크다. 결과적으로 Q는 P가 없는 곳을 **피하려** 한다. 이를 **모드 추구**(mode-seeking)라 한다.

공간적으로 상상하면 이렇다. 참 분포 P가 산맥처럼 두 개의 봉우리를 가진 쌍봉 분포이고, Q는 하나의 봉우리만 가질 수 있다고 하자. 전방 KL은 Q를 두 봉우리 사이의 계곡 위에 넓게 펼쳐서 양쪽 봉우리를 모두 덮으려 한다. 결과적으로 P에서는 확률이 거의 0인 계곡 지역에도 Q가 확률을 부여하게 된다. 역방 KL은 Q를 두 봉우리 중 하나에 정확히 맞춘다. 나머지 봉우리는 완전히 무시하지만, Q가 확률을 부여하는 곳에서는 P와 정밀하게 일치한다.

이 차이가 현대 AI에서 모델을 설계할 때 "어느 방향의 KL을 최적화하는가"가 결정적 선택이 되는 이유다.

## 교차 엔트로피와의 관계: 손실 함수의 뼈대

KL 발산과 교차 엔트로피(cross-entropy)의 관계를 이해하면, 딥러닝에서 가장 널리 쓰이는 손실 함수의 구조가 보인다.

교차 엔트로피 H(P, Q)는 다음과 같이 분해된다.

H(P, Q) = H(P) + D_KL(P || Q)

H(P)는 참 분포 P의 엔트로피로, 데이터가 결정되면 상수다. 따라서 교차 엔트로피를 Q에 대해 최소화하는 것은 전방 KL D_KL(P || Q)를 최소화하는 것과 **수학적으로 동일**하다.

분류 문제에서 표준 손실 함수인 교차 엔트로피 손실이 사실은 KL 발산 최소화와 같다는 것이다. 신경망이 분류를 학습할 때, 출력 분포 Q를 정답 분포 P에 가깝게 만드는 것은 곧 전방 KL을 줄이는 것이다. 이때 전방 KL의 모드 커버링 성질이 작동한다. 모델은 정답이 존재하는 모든 클래스에 최소한의 확률을 부여하려 하며, 정답이 아닌 곳에 확률을 부여하는 것(false positive)보다 정답인 곳의 확률이 0이 되는 것(miss)에 훨씬 큰 페널티를 받는다.

## VAE에서의 역할: 생성과 정규화의 균형

Kingma & Welling(2014)의 변분 오토인코더(VAE)에서 KL 발산은 생성 모델의 목적 함수에 직접 내장된다. ELBO(Evidence Lower BOund)는 다음과 같다.

ELBO = E_{q(z|x)}[log p(x|z)] - D_KL(q(z|x) || p(z))

1. 첫 번째 항은 **재구성 품질**이다. 잠재 변수 z에서 원본 x를 얼마나 잘 복원하는가.
2. 두 번째 항은 **KL 정규화**다. 인코더가 학습하는 사후 분포 q(z|x)가 사전 분포 p(z)(보통 표준 정규분포 N(0,I))에서 너무 멀어지지 않도록 제약한다.

두 항 사이에 핵심 트레이드오프가 존재한다. KL 항이 지나치게 강하면 잠재 공간이 과도하게 정규화되어 모든 입력이 비슷한 잠재 표현으로 수렴한다. 인코더가 입력의 고유한 특징을 잠재 변수에 담지 못하는 것이다. 이를 **사후 붕괴**(posterior collapse)라 부른다. 반대로 KL 항이 너무 약하면 잠재 공간의 구조가 흐트러져서, 잠재 공간 위의 두 점 사이를 보간(interpolation)해도 의미 있는 중간 생성물이 나오지 않는다. beta-VAE(Higgins et al. 2017)는 KL 항에 가중치 beta를 곱하여 이 균형을 명시적으로 조절한다. beta > 1이면 정규화가 강해지고, beta < 1이면 재구성 품질을 우선시한다.

여기서 역방 KL의 모드 추구 성질이 작동한다. q(z|x)는 p(z)가 확률을 부여하지 않는 영역을 피하므로, 잠재 공간이 깔끔하게 구조화된다. 그러나 동시에 q(z|x)가 p(z)의 하나의 모드에 집중하기 때문에, 복잡한 사후 분포를 표현하는 데는 한계가 있다.

## 현대 AI 기법과의 연결

KL 발산은 정보 이론의 수학적 도구가 AI에 직접 이식된 사례다. 원래의 수학적 형태가 변형 없이 보존되었으므로, 대부분의 연결은 "직접적 수학적 기반"에 해당한다.

**정보 이론의 수학이 그대로 쓰이는 직접적 기반:**

- **교차 엔트로피 손실**: 분류에서 사실상 표준인 손실 함수가 전방 KL과 상수 차이다. 신경망 분류 학습의 수학적 뼈대가 KL 발산이다.
- **VAE의 ELBO**: Kingma & Welling(2014)이 생성 모델 학습에 KL 발산을 정규화 항으로 내장했다. 잠재 공간의 구조를 결정하는 핵심 요소다.
- **정책 제약**: Schulman et al.(2015)의 TRPO는 새 정책과 이전 정책 사이의 KL 발산을 D_KL(pi_old || pi_new) <= delta로 제한하여 학습 안정성을 확보한다. PPO(2017)는 이 하드 제약을 클리핑으로 대체하여 구현을 단순화했다.
- **지식 증류**: Hinton et al.(2015)에서 학생 네트워크가 교사 네트워크의 출력 분포를 KL 발산으로 모방한다. 온도 T로 소프트맥스를 부드럽게 만들어, "고양이와 호랑이는 비슷하지만 자동차와는 다르다"는 클래스 간 유사성 정보(dark knowledge)를 전달한다.

**KL 발산의 한계를 보완하기 위해 등장한 대안:**

- **Jensen-Shannon 발산**: Goodfellow et al.(2014)의 GAN이 암묵적으로 최적화하는 척도다. D_JS(P || Q) = (1/2)D_KL(P || M) + (1/2)D_KL(Q || M), M = (P+Q)/2. KL 발산의 비대칭성과 무한대 문제를 해결한 대칭 버전이지만, 두 분포의 지지(support)가 겹치지 않으면 기울기가 사라지는 문제가 남았다.
- **Wasserstein 거리**: Arjovsky et al.(2017)의 WGAN이 JS 발산의 기울기 소실 문제를 해결하기 위해 도입했다. KL/JS 계열과 달리 분포 간 "지형을 이동하는 비용"으로 거리를 측정하여, 지지가 겹치지 않아도 의미 있는 기울기를 제공한다.

## 한계와 약점

- **비대칭성의 실무적 혼란**: D_KL(P||Q)와 D_KL(Q||P) 중 어느 방향을 써야 하는가는 이론적으로는 명확하지만, 실무에서 잘못된 방향을 선택하면 모드 커버링 대신 모드 추구가 일어나거나 그 반대가 된다. 코드 한 줄의 P, Q 순서가 모델의 행동을 근본적으로 바꾼다.
- **지지 불일치 시 발산**: Q(x) = 0인 곳에서 P(x) > 0이면 D_KL(P||Q)가 무한대가 된다. 이는 수치적 불안정성의 직접적 원인이며, 실무에서 epsilon 스무딩(Q에 작은 양수를 더함)이나 클리핑으로 우회한다. 이 문제가 GAN 학습 초기의 불안정성과 직결된다.
- **삼각 부등식 미성립**: D_KL(P||R)이 D_KL(P||Q) + D_KL(Q||R)보다 클 수 있다. 따라서 KL 발산으로 "분포 A에서 B를 거쳐 C로 가는 경로"를 추론하거나, 분포 간 군집화를 수행하기 어렵다.
- **고차원 추정의 어려움**: 차원이 높아질수록 KL 발산의 정확한 추정이 극히 어려워진다. VAE의 ELBO 최적화에서 이 추정 오차가 학습 품질에 직접 영향을 미치며, 이는 고차원 잠재 공간에서 VAE 성능이 저하되는 원인 중 하나다.

## 용어 정리

KL 발산(KL divergence) - 두 확률 분포 P와 Q 사이의 비대칭적 차이를 측정하는 정보 이론의 척도. Kullback과 Leibler(1951)가 정의

엔트로피(entropy) - 하나의 확률 분포가 가진 불확실성(정보량)의 척도. Shannon(1948)이 정의한 H(P) = -sum_x P(x) log P(x)

교차 엔트로피(cross-entropy) - 참 분포 P 기준으로 분포 Q를 써서 부호화할 때의 평균 비트 수. H(P, Q) = H(P) + D_KL(P||Q)

전방 KL(forward KL) - D_KL(P||Q), 참 분포 P를 기준으로 Q의 차이를 측정. 모드 커버링 행동을 유도

역방 KL(reverse KL) - D_KL(Q||P), 모델 분포 Q를 기준으로 P의 차이를 측정. 모드 추구 행동을 유도

모드 커버링(mode-covering) - 근사 분포가 참 분포의 모든 봉우리(모드)를 포함하도록 넓게 퍼지는 행동

모드 추구(mode-seeking) - 근사 분포가 참 분포의 하나의 봉우리에 집중하는 행동

ELBO(Evidence Lower BOund) - VAE의 목적 함수. 재구성 항과 KL 정규화 항의 합으로, 데이터 로그 가능도의 하한

사후 붕괴(posterior collapse) - VAE에서 KL 정규화가 과도할 때 인코더가 입력 정보를 잠재 변수에 담지 못하는 현상

변분 추론(variational inference) - 다루기 어려운 사후 분포를 간단한 분포로 근사하는 방법. KL 발산 최소화가 핵심 원리

---EN---
Kullback-Leibler Divergence - An information-theoretic measure of the asymmetric difference between two probability distributions, forming the mathematical backbone of modern AI loss functions

## "Discriminating Information" Born in Information Theory

In 1951, Solomon Kullback and Richard Leibler defined a quantity measuring how different two probability distributions are in their paper "On Information and Sufficiency." They called it **discriminating information**. This work came just three years after Shannon (1948) defined information entropy. If Shannon's entropy measures "how uncertain a single distribution is," KL divergence is the natural extension measuring "how different two distributions are."

The core formula is:

D_KL(P || Q) = sum_x P(x) log(P(x) / Q(x))

In information-theoretic terms, this has a very concrete meaning: when compressing data generated from the true distribution P using a coding scheme based on Q instead of P, it is the **additional** average bits required beyond optimal. An analogy helps here. If a wardrobe designed for Seoul's weather patterns (P) is optimal, then living in Seoul with a wardrobe designed for Miami's weather (Q) means unnecessary items taking up space and needed items missing. The "size of that inefficiency" is KL divergence. If the two weather patterns are identical, the inefficiency is zero; the more they differ, the larger it grows.

The most important mathematical property is **non-negativity** (Gibbs inequality):

D_KL(P || Q) >= 0

Equality holds only when P = Q. This inequality derives directly from the concavity of the log function and Jensen's inequality. That KL divergence is always non-negative means minimizing it drives Q toward P. This property is the fundamental reason KL divergence can serve as an optimization objective.

## From Information Theory to Machine Learning

KL divergence becoming a core AI tool was not a single event but the confluence of multiple paths. The key transition points are:

- Akaike (1974) first used KL divergence for **model selection** through AIC (Akaike Information Criterion). The problem of "choosing which statistical model is closest to the true data distribution" was formalized as KL minimization.
- Dempster, Laird & Rubin (1977) used a KL divergence-based lower bound for learning latent variable models in the EM algorithm. This later became the root of variational inference.
- Hinton & van Camp (1993) proposed regularizing neural network weight uncertainty via KL divergence. This was an early form of variational Bayesian learning.
- Kingma & Welling (2014) embedded KL divergence directly in the generative model objective through VAE, making it a core component of the deep learning era.

The key correspondences are:

- True distribution P --> **actual data distribution** (learning target)
- Approximate distribution Q --> **model's learned distribution** (adjusted via parameters)
- Additional bits --> **loss function value** (quantity to minimize)
- Non-negativity --> **existence of a lower bound** (theoretical basis for variational objectives like ELBO)
- Asymmetry --> **behavioral difference between forward and reverse KL** (model design choice)

Unlike many physical formulas translated into algorithms, KL divergence is a rare case where the original mathematical form is **preserved without modification** in AI. While physics-to-algorithm transfers typically drop units or constants (e.g., SA dropping the Boltzmann constant), KL divergence's formula is used as a loss function with no transformation whatsoever.

## Asymmetry: Direction Determines Behavior

The most important and counter-intuitive property of KL divergence is its **asymmetry**:

D_KL(P || Q) != D_KL(Q || P)

This is why it is called a "divergence" rather than a "distance." A true distance function must be symmetric and satisfy the triangle inequality (the distance from A to C cannot exceed the sum of distances from A to B and B to C), but KL divergence satisfies neither.

What matters is the practical difference this asymmetry creates.

**Forward KL**: Minimizing D_KL(P || Q) with respect to Q. P is the reference. Wherever P(x) > 0, Q(x) must also be positive, otherwise log(P(x)/Q(x)) diverges to infinity. Consequently, Q tries to **cover all regions** where P assigns probability. This is called **mode-covering**.

**Reverse KL**: Minimizing D_KL(Q || P) with respect to Q. Where Q(x) > 0 but P(x) = 0, the penalty is severe. Consequently, Q tries to **avoid** regions where P is absent. This is called **mode-seeking**.

To visualize this spatially: imagine the true distribution P as a mountain range with two peaks (a bimodal distribution), and Q can have only one peak. Forward KL stretches Q broadly over the valley between the two peaks, trying to cover both. As a result, Q assigns probability even to the valley floor where P has near-zero probability. Reverse KL fits Q precisely to one peak, completely ignoring the other. Where Q does assign probability, it matches P closely.

This difference is why "which direction of KL to optimize" becomes a critical design choice in modern AI.

## Relationship to Cross-Entropy: The Backbone of Loss Functions

Understanding the relationship between KL divergence and cross-entropy reveals the structure behind deep learning's most widely used loss function.

Cross-entropy H(P, Q) decomposes as follows:

H(P, Q) = H(P) + D_KL(P || Q)

H(P) is the entropy of the true distribution P -- a constant once the data is fixed. Therefore, minimizing cross-entropy with respect to Q is **mathematically identical** to minimizing forward KL D_KL(P || Q).

The standard cross-entropy loss in classification is in fact KL divergence minimization. When a neural network learns to classify, making its output distribution Q closer to the target distribution P is equivalent to reducing forward KL. Here forward KL's mode-covering property is at work: the model tries to assign at least some probability to every correct class, and receives far greater penalty for assigning zero probability to a correct answer (a miss) than for assigning probability to an incorrect one (false positive).

## Role in VAEs: Balancing Generation and Regularization

In Kingma & Welling's (2014) Variational Autoencoder (VAE), KL divergence is embedded directly in the generative model's objective. The ELBO (Evidence Lower BOund) is:

ELBO = E_{q(z|x)}[log p(x|z)] - D_KL(q(z|x) || p(z))

1. The first term is **reconstruction quality** -- how well the original x is recovered from latent variable z.
2. The second term is **KL regularization** -- constraining the encoder's learned posterior q(z|x) from straying too far from the prior p(z) (typically standard normal N(0,I)).

A core tradeoff exists between these terms. If the KL term is too strong, the latent space becomes excessively regularized and all inputs converge to similar latent representations. The encoder fails to capture each input's distinctive features in the latent variable. This is called **posterior collapse**. Conversely, if the KL term is too weak, the latent space loses structure, and interpolating between two points in latent space no longer produces meaningful intermediate outputs. beta-VAE (Higgins et al. 2017) explicitly controls this balance by multiplying the KL term by beta. beta > 1 strengthens regularization; beta < 1 prioritizes reconstruction quality.

Here reverse KL's mode-seeking property is at work. q(z|x) avoids regions where p(z) assigns no probability, giving the latent space clean structure. However, because q(z|x) concentrates on a single mode of p(z), it has limited capacity for representing complex posterior distributions.

## Connections to Modern AI Techniques

KL divergence is a case where an information-theoretic mathematical tool was directly transplanted into AI. Since its original mathematical form is preserved without modification, most connections are "direct mathematical foundations."

**Information theory's mathematics used directly:**

- **Cross-entropy loss**: The de facto standard loss function for classification differs from forward KL by a constant. KL divergence is the mathematical backbone of neural network classification.
- **VAE's ELBO**: Kingma & Welling (2014) embedded KL divergence as a regularization term in generative model learning. It is the key element determining latent space structure.
- **Policy constraints**: Schulman et al.'s (2015) TRPO constrains KL divergence between new and old policies via D_KL(pi_old || pi_new) <= delta for learning stability. PPO (2017) replaced this hard constraint with clipping, simplifying implementation.
- **Knowledge distillation**: In Hinton et al. (2015), the student network mimics the teacher's output distribution via KL divergence. Temperature T softens the softmax, transmitting inter-class similarity information such as "cats and tigers are similar but different from cars" (dark knowledge).

**Alternatives that emerged to address KL divergence's limitations:**

- **Jensen-Shannon divergence**: The measure implicitly optimized by Goodfellow et al.'s (2014) GAN. D_JS(P || Q) = (1/2)D_KL(P || M) + (1/2)D_KL(Q || M), M = (P+Q)/2. A symmetric version resolving KL's asymmetry and infinity issues, but gradients still vanish when the two distributions' supports do not overlap.
- **Wasserstein distance**: Introduced by Arjovsky et al.'s (2017) WGAN to solve JS divergence's vanishing gradient problem. Unlike the KL/JS family, it measures the "cost of moving terrain" between distributions, providing meaningful gradients even with non-overlapping supports.

## Limitations and Weaknesses

- **Practical confusion from asymmetry**: While which direction to use is theoretically clear, choosing the wrong one in practice causes mode-covering instead of mode-seeking or vice versa. The order of P and Q in a single line of code fundamentally changes the model's behavior.
- **Divergence to infinity on support mismatch**: When Q(x) = 0 where P(x) > 0, D_KL(P||Q) becomes infinite. This directly causes numerical instability and is worked around with epsilon smoothing (adding a small positive value to Q) or clipping. This problem is directly linked to early GAN training instability.
- **Triangle inequality failure**: D_KL(P||R) can exceed D_KL(P||Q) + D_KL(Q||R). Therefore, KL divergence cannot be directly used to reason about "paths from distribution A through B to C" or for distribution clustering.
- **High-dimensional estimation difficulty**: As dimensionality increases, accurately estimating KL divergence becomes extremely difficult. In VAE ELBO optimization, this estimation error directly affects learning quality and is one reason VAE performance degrades in high-dimensional latent spaces.

## Glossary

KL divergence - an information-theoretic measure of the asymmetric difference between two probability distributions P and Q, defined by Kullback and Leibler (1951)

Entropy - a measure of uncertainty (information content) in a single probability distribution, defined by Shannon (1948) as H(P) = -sum_x P(x) log P(x)

Cross-entropy - the average bits needed when encoding with distribution Q given true distribution P. H(P, Q) = H(P) + D_KL(P||Q)

Forward KL - D_KL(P||Q), measuring Q's difference from the reference true distribution P, inducing mode-covering behavior

Reverse KL - D_KL(Q||P), measuring P's difference from the reference model distribution Q, inducing mode-seeking behavior

Mode-covering - behavior where the approximating distribution spreads broadly to include all modes (peaks) of the true distribution

Mode-seeking - behavior where the approximating distribution concentrates on a single peak of the true distribution

ELBO (Evidence Lower BOund) - the VAE objective function, sum of reconstruction and KL regularization terms, a lower bound on the data log-likelihood

Posterior collapse - a phenomenon in VAEs where excessive KL regularization prevents the encoder from encoding input information into latent variables

Variational inference - a method for approximating intractable posterior distributions with simpler ones, with KL divergence minimization as its core principle
