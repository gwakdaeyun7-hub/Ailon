---
difficulty: intermediate
connectionType: direct_inspiration
keywords: KL 발산, 쿨백-라이블러, 비대칭 거리, VAE, 지식 증류, 정책 제약, 모드 추구
keywords_en: KL divergence, Kullback-Leibler, asymmetric distance, VAE, knowledge distillation, policy constraint, mode seeking
---
Kullback-Leibler Divergence - 두 확률 분포 사이의 비대칭적 차이를 측정하는 정보 이론적 척도로, 생성 모델과 강화학습의 핵심 수학적 도구

## 두 분포는 얼마나 다른가

1951년, Solomon Kullback과 Richard Leibler는 "On Information and Sufficiency"에서 두 확률 분포 간의 차이를 측정하는 척도를 제안했다. 이들은 이를 "판별 정보"(discriminating information)라 불렀으나, 이후 KL 발산(Kullback-Leibler divergence)이라는 이름으로 정착했다.

D_KL(P || Q) = sum_{x} P(x) log(P(x) / Q(x))

이 공식을 정보 이론적으로 해석하면 다음과 같다. 실제 분포 P에서 생성된 데이터를 Q에 기반한 코드로 부호화할 때, P에 기반한 최적 코드보다 **추가로** 필요한 평균 비트 수다. Q가 P와 같으면 추가 비용이 0이고, 다를수록 비용이 커진다.

수학적 성질 중 가장 중요한 것은 **비음수성**이다.

D_KL(P || Q) >= 0  (Gibbs 부등식)

등호는 P = Q일 때만 성립한다. 이 부등식은 Jensen 부등식에서 직접 유도되며, KL 발산이 최적화 목적 함수로 쓰일 수 있는 근본적 이유다. KL 발산을 최소화하면 두 분포가 동일해지는 방향으로 수렴한다.

## 비대칭성: KL 발산의 결정적 특성

KL 발산의 가장 중요하고도 직관에 반하는 성질은 **비대칭성**이다.

D_KL(P || Q) != D_KL(Q || P)

이것이 KL 발산을 "거리"(distance)가 아닌 "발산"(divergence)이라 부르는 이유다. 진정한 거리 함수는 대칭이어야 하고 삼각 부등식을 만족해야 하지만, KL 발산은 둘 다 만족하지 않는다.

이 비대칭성은 P와 Q 중 어느 것을 기준으로 놓느냐에 따라 완전히 다른 행동을 만든다. 이를 이해하는 것이 현대 AI에서 KL 발산을 올바로 활용하기 위한 핵심이다.

## 전방 KL vs 역방 KL: 실용적 함의

D_KL(P || Q)를 **전방 KL**(forward KL)이라 부른다. P가 참조 분포다. 이를 Q에 대해 최소화하면, P(x) > 0인 모든 곳에서 Q(x)도 양수여야 한다. 그렇지 않으면 log(P(x)/Q(x))가 무한대로 발산한다. 결과적으로 Q는 P의 모든 모드를 **덮으려** 한다. 이를 **모드 커버링**(mode-covering) 행동이라 한다. Q는 P가 확률을 부여하는 모든 영역을 포함하도록 넓게 퍼진다.

D_KL(Q || P)를 **역방 KL**(reverse KL)이라 부른다. Q가 참조 분포다. 이를 Q에 대해 최소화하면, Q(x) > 0인 곳에서 P(x) = 0이면 페널티가 크다. 결과적으로 Q는 P가 확률을 부여하지 않는 곳을 **피하려** 한다. 이를 **모드 추구**(mode-seeking) 행동이라 한다. Q는 P의 하나의 모드에 집중하되, P가 없는 곳에는 절대 가지 않는다.

실용적 의미는 크다. 다봉 분포(multimodal distribution)를 단봉 분포(unimodal distribution)로 근사할 때, 전방 KL은 모든 봉우리 사이에 걸쳐 평균적 위치를 선택하고(봉우리 사이의 빈 공간에도 확률을 부여), 역방 KL은 하나의 봉우리에 정확히 맞춘다(나머지 봉우리는 무시).

## VAE의 ELBO: 생성 모델의 심장

Kingma & Welling(2014)의 변분 오토인코더(VAE)에서 KL 발산은 핵심적 역할을 한다. ELBO(Evidence Lower BOund) 목적 함수는 다음과 같다.

ELBO = E_{q(z|x)}[log p(x|z)] - D_KL(q(z|x) || p(z))

첫 번째 항은 재구성 품질(reconstruction quality)이다. 잠재 변수 z에서 원본 x를 얼마나 잘 복원하는가. 두 번째 항은 KL 정규화(KL regularization)다. 인코더가 학습하는 사후 분포 q(z|x)가 사전 분포 p(z)(보통 표준 정규분포 N(0,I))에서 너무 멀어지지 않도록 제약한다.

두 항의 균형이 VAE의 행동을 결정한다. KL 항이 너무 강하면 잠재 공간이 지나치게 정규화되어 생성 품질이 떨어진다(posterior collapse). 너무 약하면 잠재 공간의 구조가 흐트러져 보간(interpolation)이 의미를 잃는다. beta-VAE(Higgins et al. 2017)는 KL 항에 가중치 beta를 두어 이 균형을 명시적으로 조절한다.

여기서 역방 KL의 모드 추구 성질이 작동한다. q(z|x)는 p(z)의 모든 영역을 덮으려 하지 않고, p(z)가 확률을 부여하는 곳에 집중한다. 이 때문에 VAE의 잠재 공간은 깔끔하게 구조화되지만, 동시에 표현력이 제한될 수 있다.

## 강화학습에서의 정책 제약

Schulman et al.(2017)의 PPO(Proximal Policy Optimization)는 KL 발산을 정책 업데이트의 안정성 장치로 활용한다. 강화학습에서 정책을 너무 크게 변경하면 학습이 불안정해지는데, PPO는 새 정책과 이전 정책 사이의 KL 발산을 제한하여 이를 방지한다.

TRPO(Trust Region Policy Optimization, Schulman et al. 2015)는 이를 더 엄격하게 적용한다. 정책 업데이트가 다음 제약을 만족하도록 한다.

D_KL(pi_old || pi_new) <= delta

여기서 delta는 신뢰 영역(trust region)의 크기다. 이 제약은 정책이 한 번에 너무 많이 변하지 않도록 보장한다. PPO는 이 하드 제약 대신 클리핑(clipping)을 통한 소프트 제약으로 구현의 단순성을 얻었다.

## 지식 증류와 JS 발산

Hinton et al.(2015)의 지식 증류(knowledge distillation)에서, 학생 네트워크는 교사 네트워크의 소프트 출력 분포를 KL 발산으로 모방한다.

L_KD = T^2 * D_KL(p_teacher(T) || p_student(T))

여기서 T는 온도(temperature)로, 소프트맥스 출력을 부드럽게 만든다. 높은 온도에서 교사의 출력은 클래스 간의 유사성 정보("고양이와 호랑이는 비슷하지만 자동차와는 다르다")를 담고 있으며, 학생은 이 "어두운 지식"(dark knowledge)을 학습한다.

Goodfellow et al.(2014)의 GAN은 KL 발산 대신 **Jensen-Shannon 발산**(JS divergence)을 암묵적으로 최적화한다.

D_JS(P || Q) = (1/2) D_KL(P || M) + (1/2) D_KL(Q || M),  M = (P + Q) / 2

JS 발산은 대칭이고 유계(0과 log2 사이)라는 장점이 있다. 그러나 두 분포의 지지(support)가 겹치지 않으면 JS 발산이 상수가 되어 그래디언트가 사라지는 문제가 있다. Wasserstein GAN(Arjovsky et al. 2017)은 이 문제를 해결하기 위해 Earth Mover's distance로 전환했다.

## 한계와 약점

KL 발산은 강력하지만 주의가 필요한 도구다.

- **비대칭성의 혼란**: D_KL(P||Q)와 D_KL(Q||P)가 다르다는 것은 수학적으로는 명확하지만, 실무에서 어느 방향을 선택해야 하는지는 종종 혼란을 준다. 잘못된 방향의 KL을 최적화하면 의도와 다른 결과(예: 모드 커버링 대신 모드 추구)를 얻는다.
- **지지 불일치 문제**: Q(x) = 0인 곳에서 P(x) > 0이면 D_KL(P||Q) = 무한대가 된다. 이는 수치적 불안정성의 원인이며, 실무에서는 epsilon 스무딩이나 클리핑으로 우회한다. 이 문제가 GAN 학습의 불안정성과 직접적으로 연결된다.
- **삼각 부등식 미성립**: D_KL(P||Q) + D_KL(Q||R) >= D_KL(P||R)이 보장되지 않는다. 따라서 KL 발산으로 분포들 간의 "경로"를 추론하거나 군집화에 직접 사용하기 어렵다.
- **고차원 추정의 어려움**: 고차원 공간에서 KL 발산을 정확히 추정하는 것은 극히 어렵다. VAE의 ELBO 최적화에서 이 추정 오차가 학습 품질에 직접 영향을 미친다.
- **정보 이론적 한계 vs 실용적 필요**: KL 발산이 최소화되더라도, 특정 태스크에서 모델 성능이 최적이라는 보장은 없다. 분류에서 교차 엔트로피(KL + 상수)가 표준이지만, 불균형 데이터셋에서는 Focal Loss 같은 대안이 더 효과적일 수 있다.

## 용어 정리

KL 발산(KL divergence) - 두 확률 분포 P와 Q 사이의 비대칭적 차이를 측정하는 정보 이론적 척도

전방 KL(forward KL) - D_KL(P||Q), 참 분포 P 기준으로 Q의 차이를 측정, 모드 커버링 유도

역방 KL(reverse KL) - D_KL(Q||P), 모델 분포 Q 기준으로 P의 차이를 측정, 모드 추구 유도

모드 커버링(mode-covering) - 근사 분포가 참 분포의 모든 모드를 포함하도록 넓게 퍼지는 행동

모드 추구(mode-seeking) - 근사 분포가 참 분포의 하나의 모드에 집중하는 행동

ELBO(Evidence Lower BOund) - VAE 목적 함수, 재구성 항과 KL 정규화 항의 합

Jensen-Shannon 발산(JS divergence) - KL 발산의 대칭 버전, D_JS = (D_KL(P||M) + D_KL(Q||M))/2, M=(P+Q)/2

지식 증류(knowledge distillation) - 큰 교사 모델의 출력 분포를 작은 학생 모델이 모방하는 모델 압축 기법

Gibbs 부등식(Gibbs inequality) - D_KL(P||Q) >= 0을 보장하는 부등식, Jensen 부등식에서 유도

신뢰 영역(trust region) - 정책 업데이트가 이전 정책으로부터 벗어날 수 있는 최대 범위

---EN---
Kullback-Leibler Divergence - An information-theoretic measure of the asymmetric difference between two probability distributions, serving as a core mathematical tool in generative models and reinforcement learning

## How Different Are Two Distributions?

In 1951, Solomon Kullback and Richard Leibler proposed a measure of difference between two probability distributions in "On Information and Sufficiency." They called it "discriminating information," but it became known as KL divergence.

D_KL(P || Q) = sum_{x} P(x) log(P(x) / Q(x))

The information-theoretic interpretation is as follows: when encoding data generated from the true distribution P using codes based on Q, the **additional** average bits needed beyond the optimal code based on P. If Q equals P, the extra cost is zero; the greater the difference, the higher the cost.

The most important mathematical property is **non-negativity**:

D_KL(P || Q) >= 0  (Gibbs inequality)

Equality holds only when P = Q. This inequality derives directly from Jensen's inequality and is the fundamental reason KL divergence can serve as an optimization objective. Minimizing KL divergence drives two distributions toward identity.

## Asymmetry: The Defining Property of KL Divergence

The most important and counter-intuitive property of KL divergence is its **asymmetry**:

D_KL(P || Q) != D_KL(Q || P)

This is why it is called a "divergence" rather than a "distance." A true distance function must be symmetric and satisfy the triangle inequality, but KL divergence satisfies neither.

This asymmetry creates completely different behaviors depending on which distribution serves as the reference. Understanding this is key to correctly applying KL divergence in modern AI.

## Forward KL vs Reverse KL: Practical Implications

D_KL(P || Q) is called **forward KL**. P is the reference distribution. Minimizing it with respect to Q requires Q(x) > 0 wherever P(x) > 0, otherwise log(P(x)/Q(x)) diverges to infinity. Consequently, Q tries to **cover** all modes of P. This is called **mode-covering** behavior. Q spreads broadly to include all regions where P assigns probability.

D_KL(Q || P) is called **reverse KL**. Q is the reference distribution. Minimizing it with respect to Q penalizes heavily when Q(x) > 0 where P(x) = 0. Consequently, Q tries to **avoid** regions where P assigns no probability. This is called **mode-seeking** behavior. Q concentrates on one mode of P while never venturing where P is absent.

The practical implications are significant. When approximating a multimodal distribution with a unimodal one, forward KL selects an average position spanning all peaks (assigning probability even in empty space between peaks), while reverse KL fits precisely to one peak (ignoring the rest).

## VAE's ELBO: The Heart of Generative Models

In Kingma & Welling's (2014) Variational Autoencoder (VAE), KL divergence plays a central role. The ELBO objective function is:

ELBO = E_{q(z|x)}[log p(x|z)] - D_KL(q(z|x) || p(z))

The first term is reconstruction quality -- how well the original x is recovered from latent variable z. The second term is KL regularization -- constraining the encoder's learned posterior q(z|x) from straying too far from the prior p(z) (typically standard normal N(0,I)).

The balance between these terms determines VAE behavior. If the KL term is too strong, the latent space becomes overly regularized and generation quality suffers (posterior collapse). If too weak, the latent space loses structure and interpolation becomes meaningless. beta-VAE (Higgins et al. 2017) explicitly controls this balance by weighting the KL term with beta.

Here the reverse KL's mode-seeking property is at work. q(z|x) concentrates where p(z) assigns probability rather than trying to cover all of p(z). This gives VAE latent spaces clean structure, but can simultaneously limit expressiveness.

## Policy Constraints in Reinforcement Learning

Schulman et al.'s (2017) PPO (Proximal Policy Optimization) uses KL divergence as a stability mechanism for policy updates. In RL, changing policy too drastically destabilizes learning; PPO prevents this by constraining the KL divergence between new and old policies.

TRPO (Trust Region Policy Optimization, Schulman et al. 2015) applies this more strictly, requiring policy updates to satisfy:

D_KL(pi_old || pi_new) <= delta

Here delta is the trust region size. This constraint ensures policy changes are bounded per update. PPO trades the hard constraint for soft clipping, gaining implementation simplicity.

## Knowledge Distillation and JS Divergence

In Hinton et al.'s (2015) knowledge distillation, the student network mimics the teacher network's soft output distribution via KL divergence:

L_KD = T^2 * D_KL(p_teacher(T) || p_student(T))

Here T is temperature, softening the softmax outputs. At high temperatures, the teacher's output contains inter-class similarity information ("cats and tigers are similar but different from cars"), and the student learns this "dark knowledge."

Goodfellow et al.'s (2014) GAN implicitly optimizes **Jensen-Shannon divergence** instead of KL divergence:

D_JS(P || Q) = (1/2) D_KL(P || M) + (1/2) D_KL(Q || M),  M = (P + Q) / 2

JS divergence has the advantage of being symmetric and bounded (between 0 and log 2). However, when two distributions have non-overlapping supports, JS divergence becomes constant and gradients vanish. Wasserstein GAN (Arjovsky et al. 2017) switched to Earth Mover's distance to address this problem.

## Limitations and Weaknesses

KL divergence is powerful but requires careful use.

- **Asymmetry confusion**: That D_KL(P||Q) differs from D_KL(Q||P) is mathematically clear, but choosing the correct direction in practice often causes confusion. Optimizing the wrong direction produces unintended results (e.g., mode-covering instead of mode-seeking).
- **Support mismatch problem**: When Q(x) = 0 where P(x) > 0, D_KL(P||Q) = infinity. This causes numerical instability and is worked around in practice with epsilon smoothing or clipping. This problem is directly linked to GAN training instability.
- **Triangle inequality failure**: D_KL(P||Q) + D_KL(Q||R) >= D_KL(P||R) is not guaranteed. Therefore KL divergence cannot be directly used to reason about "paths" between distributions or for clustering.
- **High-dimensional estimation difficulty**: Accurately estimating KL divergence in high-dimensional spaces is extremely difficult. In VAE ELBO optimization, this estimation error directly affects learning quality.
- **Information-theoretic limits vs practical needs**: Even if KL divergence is minimized, there is no guarantee of optimal model performance on a specific task. Cross-entropy (KL + constant) is standard for classification, but alternatives like Focal Loss can be more effective for imbalanced datasets.

## Glossary

KL divergence - an information-theoretic measure of the asymmetric difference between two probability distributions P and Q

Forward KL - D_KL(P||Q), measuring Q's difference from the reference true distribution P, inducing mode-covering

Reverse KL - D_KL(Q||P), measuring P's difference from the reference model distribution Q, inducing mode-seeking

Mode-covering - behavior where the approximating distribution spreads broadly to include all modes of the true distribution

Mode-seeking - behavior where the approximating distribution concentrates on a single mode of the true distribution

ELBO (Evidence Lower BOund) - the VAE objective function, sum of reconstruction and KL regularization terms

Jensen-Shannon divergence - a symmetric version of KL divergence, D_JS = (D_KL(P||M) + D_KL(Q||M))/2, M=(P+Q)/2

Knowledge distillation - a model compression technique where a small student model mimics the output distribution of a large teacher model

Gibbs inequality - the inequality guaranteeing D_KL(P||Q) >= 0, derived from Jensen's inequality

Trust region - the maximum extent to which a policy update can deviate from the previous policy
