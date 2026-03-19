---
difficulty: intermediate
connectionType: mathematical_foundation
keywords: 섀넌 엔트로피, 정보량, 불확실성, 교차 엔트로피, KL 발산, 정보 이득, 최적 부호화
keywords_en: Shannon entropy, information content, uncertainty, cross-entropy, KL divergence, information gain, optimal coding
---
Shannon Entropy - 확률 분포의 불확실성을 정량화하는 유일한 척도로, AI의 손실 함수와 학습 이론에 수학적 기반을 제공한 개념

## 정보의 재정의: 의미를 버리고 불확실성만 남기다

1948년, Bell Labs의 수학자 Claude Shannon이 "A Mathematical Theory of Communication"을 발표했다. Shannon에게 정보란 **받는 사람의 불확실성이 얼마나 줄어드느냐**만을 뜻한다. 메시지가 무슨 뜻이든 상관없다.

내일 서울의 날씨를 예측할 때, "내일 비가 옵니다"라는 메시지의 정보량은 비가 올 확률에 따라 달라진다. 장마철에 비 올 확률이 90%라면 놀라움이 적고, 건조한 겨울에 5%라면 같은 메시지가 훨씬 많은 불확실성을 해소한다. Shannon은 사건 x의 정보량을 I(x) = -log p(x)로 정의했다.

p(x) = 1(확실한 사건)이면 I(x) = 0이다. 이미 아는 것은 정보가 아니다. p(x) = 0.5(동전 던지기)이면 I(x) = 1비트다. p(x)가 0에 가까울수록 I(x)는 무한대로 커진다. AI에서는 계산 편의상 자연로그(밑 e, 단위: 냇)를 더 자주 쓴다.

Shannon은 한 걸음 더 나아가 **확률 분포 전체**의 평균 불확실성을 측정하려 했다. 세 가지 공리를 세웠다. (1) 연속성, (2) 동등한 선택지가 많을수록 불확실성 증가, (3) 순차적 분해의 일관성. 이 세 조건을 동시에 만족하는 함수는 유일하게 하나뿐이다.

H(X) = -sum_x p(x) log p(x)

이것이 Shannon 엔트로피다. 공정한 동전이면 H = 1비트. 앞면이 99% 나오는 동전이면 H = 약 0.08비트. 주사위처럼 6면이 동등하면 H = log2(6) = 약 2.58비트. 균일 분포일 때 엔트로피가 최대이고, 한 사건의 확률이 1에 가까울수록 0에 수렴한다.

## 정보 이론에서 AI의 수학으로

Shannon 엔트로피가 AI에 들어온 과정은 여러 연구자가 같은 수학을 서로 다른 AI 문제에 독립적으로 적용한 누적의 결과다.

- Shannon 엔트로피 H(X) --> **분류 손실 함수의 수학적 근거**
- 개별 정보량 -log p(x) --> **교차 엔트로피 손실의 핵심 항**
- 조건부 엔트로피 H(X|Y) <= H(X) --> **특징 선택의 이론적 근거**
- 최적 부호 길이 = -log p(x) --> **최소 기술 길이 원리**
- KL 발산 D_KL(p||q) --> **두 분포 사이의 비대칭적 거리**

Quinlan(1986)이 결정 트리 ID3에서 정보 이득을 분할 기준으로 사용한 것이 머신러닝 직접 적용의 초기 사례다. Shannon의 수학이 AI 문제의 언어로 "번역"된 것이 아니라 **동일한 수학이 변형 없이 그대로 적용**되었다. 이것이 이 연결을 "수학적 기반"(mathematical foundation)이라 부르는 이유다.

## 교차 엔트로피: AI의 핵심 손실 함수

교차 엔트로피(cross-entropy)는 Shannon 엔트로피의 직접적 확장이다.

H(p, q) = -sum_x p(x) log q(x)

p는 실제 데이터 분포, q는 모델의 예측 분포다. 이 함수가 표준 손실이 된 이유를 추적하면 다음과 같다.

1. H(p, q) = H(p) + D_KL(p || q)
2. H(p)는 상수이므로, H(p, q) 최소화는 D_KL(p||q) 최소화와 동치이며, D_KL = 0이 되는 유일한 조건은 q = p다
3. 원-핫 레이블에서 교차 엔트로피는 -log q(정답)으로 단순화된다

모델이 정답에 확률 0.9를 부여하면 손실은 -log2(0.9) = 약 0.15비트. 확률 0.01이면 약 6.64비트로 급증한다. 정답에 대한 확신이 낮을수록 손실이 **비선형적으로** 커져, 학습 초기에 심각하게 틀린 예측을 빠르게 교정한다.

이 연결은 우연이 아니다. 모델이 데이터의 진짜 확률 분포를 완벽히 학습하면, 교차 엔트로피가 Shannon 엔트로피와 같아진다. 그 격차가 KL 발산이고, 학습은 이 격차를 줄이는 과정이다.

## 정보와 압축의 등가

사건 x를 부호화할 때 이론적 최소 비트 수는 -log2 p(x)이다. 자주 일어나는 사건은 짧은 코드로, 드문 사건은 긴 코드로 부호화하는 것이 최적이다. 엔트로피가 낮을수록 데이터가 더 예측 가능하고, 더 짧게 기술할 수 있다.

이 관계에서 Rissanen(1978)의 최소 기술 길이(Minimum Description Length, MDL) 원리가 나온다. "데이터를 가장 짧게 기술하는 모델이 최선이다"라는 학습 원리다. 지나치게 복잡한 모델은 데이터를 외우느라 기술 길이가 길어지고(과적합), 지나치게 단순한 모델은 패턴을 놓쳐 기술 길이가 길어진다(과소적합). 최적 모델 복잡도는 이 두 힘의 균형점에 있다.

## KL 발산: 비대칭적 거리의 의미

두 확률 분포 p와 q의 차이를 측정하는 KL 발산은 Shannon 엔트로피에서 직접 파생된다.

D_KL(p || q) = sum_x p(x) log(p(x) / q(x)) = H(p, q) - H(p)

D_KL(p||q)는 "진짜 분포가 p인데 q의 코드를 써서 부호화할 때 낭비되는 비트 수"다. 핵심 성질은 비대칭성이다. D_KL(p||q)를 최소화하면 모드 커버링(mode-covering) 경향이 있고, D_KL(q||p)를 최소화하면 모드 시킹(mode-seeking) 경향이 있다. GAN 학습에서 역방향 KL이 선명한 이미지를 만드는 것이 이 비대칭성의 대표적 결과다.

## 현대 AI에서의 Shannon 엔트로피

**Shannon의 수학을 직접 사용하는 경우:**

- **교차 엔트로피 손실**: 분류 신경망의 표준 손실 함수다. Shannon의 최적 부호 길이 -log p(x)가 그대로 손실의 핵심 항이 된다. 비유가 아니라 수학적 동치다.
- **결정 트리의 정보 이득**: Quinlan(1986)의 ID3 알고리즘에서 IG(S, A) = H(S) - sum_v |S_v|/|S| * H(S_v)로, 불확실성을 가장 많이 줄이는 특징을 먼저 선택한다. 세 색 공이 섞인 상자를 나눌 때, 한쪽이 단색이 되는 특징이 양쪽에 여전히 혼합인 특징보다 정보 이득이 크다.
- **VAE의 ELBO**: KL 발산 항이 잠재 표현의 불필요한 복잡성을 방지하며, Shannon의 "낮은 엔트로피가 더 효율적 부호화"라는 통찰이 정규화로 확장된 것이다.

**동일한 수학적 직관을 독립적으로 공유하는 구조적 유사성:**

- **자기지도 학습의 정보론적 해석**: BERT가 가려진 토큰을 예측하도록 학습하는 것은, 조건부 엔트로피 H(masked|context)를 줄이는 과정으로 해석된다. Shannon의 "정보 = 불확실성 감소"와 정확히 부합하지만, BERT의 설계 동기는 엔트로피 이론이 아니라 양방향 문맥 이해였다
- **MDL과 모델 선택**: Rissanen(1978)의 MDL은 Shannon의 최적 부호 길이에서 직접 파생되었지만, AIC, BIC, 정규화 등은 독립적으로 발전했다. 그러나 "불필요한 복잡성 = 비효율적 부호화"라는 직관은 동일하며, L1/L2 정규화가 가중치의 기술 길이를 줄이는 것으로 해석된다
- **엔트로피 정규화**: RL에서 정책 엔트로피를 손실에 추가하여 탐색을 촉진하는 기법(SAC, Haarnoja et al. 2018)은, 높은 엔트로피가 다양성을 보장한다는 통찰을 최적화에 활용한 것이다

## 한계와 약점

- **알려진 분포 가정**: 엔트로피 계산은 p(x)를 알고 있다고 가정한다. 유한 데이터에서 추정한 엔트로피는 편향을 가지며, 샘플이 부족하면 과소추정되는 경향이 있다.
- **의미론적 무관심**: "의미 있는 정보"와 "의미 없는 정보"를 구분할 수 없다. 무작위 잡음은 최대 엔트로피를 가지지만 유용한 정보는 전혀 담고 있지 않다.
- **연속 분포 확장의 문제**: 미분 엔트로피(differential entropy)는 좌표 변환에 불변이 아니며 음수가 될 수 있다. "평균 비트 수"라는 해석이 연속 영역에서는 성립하지 않는다.
- **교차 엔트로피의 레이블 의존성**: 교차 엔트로피 손실은 레이블이 정확하다고 가정한다. 노이즈 레이블이 섞이면 잘못된 분포를 학습한다. 레이블 스무딩이 부분적으로 완화하지만 근본 해결은 아니다.

## 용어 정리

엔트로피(entropy) - 확률 분포의 평균적 불확실성. H(X) = -sum p(x) log p(x). 균일 분포에서 최대, 확정적 분포에서 0

비트(bit) - 정보의 기본 단위. 동등한 확률의 이진 선택 하나가 가지는 정보량

교차 엔트로피(cross-entropy) - 실제 분포 p로 발생한 데이터를 모델 분포 q의 코드로 부호화할 때 필요한 평균 비트 수. H(p, q) = -sum p(x) log q(x)

KL 발산(Kullback-Leibler divergence) - 분포 q가 분포 p로부터 얼마나 벗어났는지 측정하는 비대칭적 척도. D_KL(p||q) = H(p,q) - H(p)

정보 이득(information gain) - 특정 특징으로 데이터를 분할했을 때 감소하는 엔트로피의 양. 결정 트리의 분할 기준

최소 기술 길이(Minimum Description Length, MDL) - 데이터를 가장 짧게 기술하는 모델이 최선이라는 학습 원리. Rissanen(1978)

상호 정보량(mutual information) - 두 변수가 공유하는 정보의 양. I(X;Y) = H(X) - H(X|Y). 정보 병목 이론의 핵심 도구

모드 커버링/모드 시킹(mode-covering/mode-seeking) - KL 발산의 비대칭성에서 비롯되는 두 가지 최적화 행동. D_KL(p||q) 최소화는 모든 봉우리를 포괄, D_KL(q||p) 최소화는 가장 높은 봉우리에 집중
---EN---
Shannon Entropy - The unique measure quantifying the uncertainty of probability distributions, providing the mathematical foundation for AI loss functions and learning theory

## Redefining Information: Discarding Meaning, Keeping Only Uncertainty

In 1948, mathematician Claude Shannon at Bell Labs published "A Mathematical Theory of Communication." For Shannon, information means only **how much the receiver's uncertainty is reduced**. What the message means is irrelevant.

When predicting tomorrow's weather in Seoul, the information content of "it will rain" depends on rain probability. During monsoon season with 90% probability, it tells little you didn't expect. In dry winter with 5%, the same message resolves far more uncertainty. Shannon defined information content as I(x) = -log p(x).

When p(x) = 1 (certain), I(x) = 0. What you already know is not information. When p(x) = 0.5 (coin flip), I(x) = 1 bit. As p(x) approaches 0, I(x) grows toward infinity. AI typically uses natural logarithm (base e, unit: nats) for computational convenience.

Shannon sought to measure the **average uncertainty of an entire distribution**. He established three axioms: (1) continuity, (2) uncertainty increases with more equally likely choices, (3) consistent sequential decomposition. Exactly one function satisfies all three:

H(X) = -sum_x p(x) log p(x)

This is Shannon entropy. A fair coin gives H = 1 bit. A 99% heads coin gives roughly 0.08 bits. A fair six-sided die gives roughly 2.58 bits. Entropy is maximized for uniform distributions and approaches 0 as one event's probability nears 1.

## From Information Theory to AI's Mathematics

Shannon entropy's adoption into AI was cumulative -- multiple researchers independently applied the same mathematics to different AI problems.

- Shannon entropy H(X) --> **mathematical basis for classification loss**
- Individual information -log p(x) --> **core term in cross-entropy loss**
- Conditional entropy H(X|Y) <= H(X) --> **theoretical basis for feature selection**
- Optimal code length = -log p(x) --> **Minimum Description Length principle**
- KL divergence D_KL(p||q) --> **asymmetric distance between distributions**

Quinlan (1986) using information gain in ID3 was an early direct ML application. Shannon's mathematics was not translated but **applied identically without modification**. This is why the connection is called a "mathematical foundation."

## Cross-Entropy: AI's Core Loss Function

Cross-entropy is a direct extension of Shannon entropy:

H(p, q) = -sum_x p(x) log q(x)

Here p is the true distribution and q the model's prediction. Why this became the standard loss:

1. H(p, q) = H(p) + D_KL(p || q)
2. H(p) is constant, so minimizing H(p, q) equals minimizing D_KL(p||q), which reaches zero only when q = p
3. With one-hot labels, cross-entropy simplifies to -log q(correct)

At probability 0.9 for the correct class, loss is roughly 0.15 bits. At 0.01, roughly 6.64 bits. Loss grows **nonlinearly** as confidence drops, driving rapid correction of wrong predictions early in training.

This is not coincidental. When the model perfectly learns the true distribution, cross-entropy equals Shannon entropy. The gap is KL divergence, and training closes that gap.

## The Equivalence of Information and Compression

The theoretical minimum bits to encode event x is -log2 p(x). Frequent events get short codes; rare events get long codes. Lower entropy means more predictable, more compressible data.

From this comes Rissanen's (1978) MDL principle: "the model providing the shortest data description is best." Overly complex models memorize (overfitting); overly simple ones miss patterns (underfitting). Optimal complexity lies at the balance point.

## KL Divergence: The Meaning of Asymmetric Distance

KL divergence derives directly from Shannon entropy:

D_KL(p || q) = sum_x p(x) log(p(x) / q(x)) = H(p, q) - H(p)

It measures "wasted bits when encoding data from p using codes for q." The crucial asymmetry: minimizing D_KL(p||q) produces mode-covering; minimizing D_KL(q||p) produces mode-seeking. GAN's reverse KL producing sharp images is a prime example of this asymmetry.

## Shannon Entropy in Modern AI

**Directly using Shannon's mathematics:**

- **Cross-entropy loss**: The standard classification loss. Shannon's -log p(x) becomes the core term -- mathematical equivalence, not analogy.
- **Information gain in decision trees**: Quinlan's (1986) ID3 selects features that reduce uncertainty most. Splitting mixed-color balls so one side becomes single-colored yields far more information gain than a split leaving both sides mixed.
- **VAE's ELBO**: The KL term prevents unnecessary latent complexity -- Shannon's "lower entropy encodes more efficiently" extended into regularization.

**Structural similarities sharing the same intuition independently:**

- **Information-theoretic view of self-supervised learning**: BERT learning to predict masked tokens can be interpreted as reducing conditional entropy H(masked|context). This matches Shannon's "information = uncertainty reduction," though BERT's motivation was bidirectional understanding, not entropy theory
- **MDL and model selection**: Rissanen's (1978) MDL derives from Shannon's optimal code length, but AIC, BIC, and regularization developed independently. The shared intuition -- "unnecessary complexity = inefficient coding" -- is identical, with L1/L2 regularization interpretable as reducing weight description length
- **Entropy regularization**: Adding policy entropy to the RL loss to encourage exploration (SAC, Haarnoja et al. 2018) leverages the insight that high entropy ensures diversity, repurposed for optimization

## Limitations and Weaknesses

- **Known distribution assumption**: Entropy computation assumes known p(x). Estimated from finite data, entropy carries bias and tends to be underestimated with insufficient samples.
- **Semantic indifference**: Random noise has maximum entropy yet contains no useful information.
- **Continuous distribution issues**: Differential entropy is not coordinate-invariant and can be negative. The "average bits" interpretation fails in continuous domains.
- **Cross-entropy's label dependence**: Cross-entropy assumes accurate labels. Noisy labels cause learning incorrect distributions. Label smoothing partially mitigates but doesn't solve this.

## Glossary

Entropy - the average uncertainty of a probability distribution. H(X) = -sum p(x) log p(x). Maximized for uniform, 0 for deterministic

Bit - the fundamental unit of information. One binary choice between equally likely outcomes

Cross-entropy - average bits to encode data from true distribution p using model distribution q's codes. H(p, q) = -sum p(x) log q(x)

KL divergence - an asymmetric measure of how much q deviates from p. D_KL(p||q) = H(p,q) - H(p)

Information gain - entropy reduction when splitting data by a specific feature. Decision tree splitting criterion

Minimum Description Length (MDL) - the principle that the shortest-describing model is best. Rissanen (1978)

Mutual information - shared information between two variables. I(X;Y) = H(X) - H(X|Y). Core tool of Information Bottleneck theory

Mode-covering/mode-seeking - two optimization behaviors from KL asymmetry. D_KL(p||q) covers all peaks; D_KL(q||p) concentrates on the tallest
