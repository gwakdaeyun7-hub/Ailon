---
difficulty: intermediate
connectionType: mathematical_foundation
keywords: 최대우도추정, 우도함수, 로그우도, 교차 엔트로피, Fisher 정보량, EM 알고리즘, KL 발산, 점근적 효율성
keywords_en: maximum likelihood estimation, likelihood function, log-likelihood, cross-entropy, Fisher information, EM algorithm, KL divergence, asymptotic efficiency
---
Maximum Likelihood Estimation - 관찰된 데이터를 가장 잘 설명하는 파라미터를 찾는 통계적 추론의 기본 원리

## 우도라는 발상: 확률을 뒤집어 보기

동전을 10번 던져 앞면이 7번 나왔다고 하자. "이 동전의 앞면 확률은 얼마인가?" 이 질문에 답하는 가장 직관적인 방법이 최대우도추정(Maximum Likelihood Estimation, MLE)이다. 핵심 발상은 간단하다. **관찰된 결과가 나올 확률을 가장 높게 만드는 파라미터 값을 선택하라.**

확률(probability)은 파라미터를 고정하고 "이 동전으로 앞면 7번이 나올 확률은?"이라 묻는다. 우도(likelihood)는 방향을 뒤집는다. 데이터를 고정하고 "앞면 7번이라는 결과를 가장 그럴듯하게 만드는 동전은?"이라 묻는다. 같은 수식 P(data|theta)를 보는 시선만 다른 것인데, 이 관점 전환이 통계학의 기초를 바꾸었다.

Ronald A. Fisher(1922)가 이 아이디어를 체계적 추정 이론으로 격상시켰다. Fisher 이전에도 가우스(Gauss)와 라플라스(Laplace)가 우도 개념을 사용했지만, Fisher는 일관성(consistency, 데이터가 많아질수록 참값에 수렴), 효율성(efficiency, 추정의 분산이 이론적 최소에 도달), 충분통계량(sufficient statistics, 데이터의 정보를 손실 없이 압축하는 요약치)이라는 세 기둥을 세워 추정량의 품질을 엄밀하게 비교할 수 있게 만들었다.

## 우도함수와 로그우도: 곱셈에서 덧셈으로

N개의 독립적 관찰 데이터 x_1, x_2, ..., x_N이 주어졌을 때, 파라미터 theta에 대한 우도함수는 각 데이터의 확률을 모두 곱한 것이다.

L(theta) = P(x_1|theta) * P(x_2|theta) * ... * P(x_N|theta)

MLE는 이 우도를 최대화하는 theta를 찾는다. theta_MLE = argmax_theta L(theta).

그런데 실무에서 곱셈은 치명적 문제를 일으킨다. 0.001 수준의 확률 1,000개를 곱하면 컴퓨터가 표현할 수 있는 최소값보다 작아져 0으로 처리된다(언더플로우). 이를 해결하는 것이 **로그우도**(log-likelihood)다.

l(theta) = log L(theta) = sum_{i=1}^{N} log P(x_i|theta)

로그 함수는 단조 증가하므로, 로그우도를 최대화하는 theta와 우도를 최대화하는 theta는 동일하다. 곱셈이 덧셈으로 바뀌어 수치적으로 안정적이고, 미분도 곱의 법칙 대신 합의 법칙을 쓰면 되어 훨씬 간단해진다. 이 변환은 단순한 계산 편의를 넘어, MLE가 정보 이론과 연결되는 수학적 다리가 된다.

## 통계학에서 AI의 손실함수로

MLE가 현대 AI의 뼈대가 된 핵심 경로는, **세 가지 서로 다른 관점이 동일한 수학적 목적함수**를 가리킨다는 발견이다. Fisher의 우도 최대화, Shannon의 정보 이론에서 온 교차 엔트로피, Kullback-Leibler가 도입한 분포 간 거리 측도가 하나로 수렴한다.

- 관점 1 -- 우도 최대화: argmax_theta sum log P(x_i|theta)
- 관점 2 -- 교차 엔트로피 최소화: argmin_theta [-sum P_data(x) * log P_model(x|theta)]
- 관점 3 -- KL 발산 최소화: argmin_theta KL(P_data || P_model)

관점 3을 풀어 쓰면 sum P_data(x) * log(P_data(x) / P_model(x|theta))인데, 여기서 P_data(x) * log P_data(x) 부분은 theta와 무관한 상수다. 따라서 KL 발산 최소화 = 교차 엔트로피 최소화 = 로그우도 최대화, 세 관점이 수학적으로 동치다.

이 동치가 AI에 미친 영향의 핵심 대응 관계는 다음과 같다.

- Fisher의 파라미터 theta --> **신경망의 가중치**(weights)
- 우도함수 L(theta) --> **데이터에 대한 모델의 적합도**
- 음의 로그우도 -l(theta) --> **교차 엔트로피 손실함수**(cross-entropy loss)
- 우도 최대화 --> **손실함수 최소화**(gradient descent)
- 충분통계량 --> **표현 학습**(representation learning)에서 데이터 정보를 보존하는 특징 벡터

이 대응은 비유가 아니다. 신경망 분류기를 훈련할 때 최소화하는 교차 엔트로피는 수학적으로 정확히 음의 로그우도이며, AI의 가장 보편적인 손실함수가 200년 전 통계학 원리의 직접적 구현이라는 뜻이다.

## Fisher 정보량: 추정의 한계를 그리는 곡률

Fisher 정보량(Fisher information)은 데이터가 파라미터에 대해 얼마나 많은 정보를 담고 있는지를 측정한다.

I(theta) = -E[d^2 log P(x|theta) / d(theta)^2]

이것은 로그우도 곡선의 **곡률**(curvature)의 기댓값이다. 공간적으로 상상하면 이렇다. 로그우도를 theta의 함수로 그렸을 때, 최댓값 근처가 뾰족한 봉우리면 "여기가 정답"이라는 신호가 강한 것이고(높은 Fisher 정보), 완만한 언덕이면 "이 근처 어딘가"라는 모호한 신호다(낮은 Fisher 정보).

극단값을 추적하면 의미가 더 명확해진다. I(theta)가 매우 크면(곡률이 급격) 추정의 불확실성이 작다. I(theta)가 0에 가까우면(곡률이 평탄) 데이터가 파라미터에 대해 거의 아무것도 말해주지 않는다.

Cramer-Rao 하한(lower bound)은 어떤 불편추정량(unbiased estimator)의 분산도 1/I(theta) 아래로 내려갈 수 없다고 말한다. 이것은 추정의 물리적 한계와 같다. 아무리 영리한 추정 방법을 고안해도, 데이터에 담긴 정보량 이상의 정밀도는 얻을 수 없다. Fisher가 증명한 핵심 결과는, MLE가 대표본에서 이 하한에 정확히 도달하는 유일한 추정량이라는 것이다. 이 성질이 **점근적 효율성**(asymptotic efficiency)이다.

## 이론적 심화: 자연 기울기와 확률 분포의 기하학

Fisher 정보량은 현대 AI에서 예상치 못한 방향으로 부활했다. Amari(1998)의 자연 기울기법(Natural Gradient)이 그것이다.

일반 경사하강법(SGD)은 유클리드 공간에서 기울기를 따른다. 파라미터 공간의 모든 방향을 동등하게 취급한다는 뜻이다. 그러나 확률 분포를 파라미터로 표현할 때, 유클리드 거리와 분포 간의 실제 차이는 일치하지 않는다. 예를 들어, 정규분포의 평균을 0에서 0.01로 바꾸는 것과 분산을 1에서 1.01로 바꾸는 것은 유클리드 거리는 같지만, 분포의 형태 변화량은 크게 다르다.

자연 기울기법은 Fisher 정보 행렬 F의 역행렬로 기울기를 보정한다. 갱신 규칙은 theta_new = theta_old - alpha * F^(-1) * grad(l) 형태다. 이 보정은 확률 분포가 사는 공간(통계적 다양체)의 기하학을 반영하여, 분포 변화량 기준으로 가장 가파른 방향을 찾는다. 이것이 정보 기하학(information geometry)의 핵심 아이디어다.

실용적으로, Fisher 정보 행렬의 역행렬을 직접 계산하는 것은 파라미터가 수백만 개인 현대 신경망에서 비현실적이다. 그래서 근사가 필요하다. 강화학습의 TRPO(Trust Region Policy Optimization, Schulman et al. 2015)는 KL 발산 제약을 통해 Fisher 정보를 간접적으로 활용하고, K-FAC(Kronecker-Factored Approximate Curvature)은 Fisher 행렬을 크로네커 곱으로 근사하여 계산을 실용화했다.

## 현대 AI 기법과의 연결

MLE는 현대 AI의 학습 목표 그 자체다. 다만 각 연결의 성격을 구분할 필요가 있다.

**MLE의 직접적 구현:**

- **교차 엔트로피 손실**: 분류 신경망의 표준 손실함수는 음의 로그우도와 수학적으로 동치다. ImageNet 분류, 감정 분석, 문서 분류 등 사실상 모든 분류 문제에서 MLE가 손실함수의 형태로 직접 작동한다.
- **자기회귀 언어 모델**: GPT 계열의 사전훈련은 조건부 확률의 연쇄 법칙을 이용한 정확한 MLE다. P(x) = P(x_1) * P(x_2|x_1) * ... * P(x_N|x_{1:N-1})의 각 조건부 확률의 로그우도를 최대화하는 것이 "다음 토큰 예측"이다. 현대 LLM의 사전훈련은 본질적으로 수십억 토큰 규모의 대규모 MLE다.
- **정규화 흐름(Normalizing Flows)**: Rezende & Mohamed(2015)의 정규화 흐름은 변환의 야코비안(Jacobian)을 이용해 정확한 로그우도를 계산하고 직접 최대화한다. MLE를 가장 순수하게 따르는 현대 생성 모델이다.

**MLE를 변형 또는 완화한 확장:**

- **VAE의 ELBO 최적화**: Kingma & Welling(2014)의 변분 오토인코더(VAE)는 정확한 로그우도 대신 그 하한인 ELBO(Evidence Lower Bound)를 최대화한다. 잠재 변수(latent variable)가 있어 직접 MLE가 불가능할 때, 변분 추론(variational inference)으로 하한을 조이는 전략이다. EM 알고리즘의 변분 일반화로 볼 수 있다.
- **EM 알고리즘의 AI 적용**: Dempster, Laird, Rubin(1977)의 EM은 잠재 변수가 있을 때 E 단계(현재 파라미터로 잠재 변수의 기대값 계산)와 M 단계(그 기대값을 이용해 우도 최대화)를 반복한다. 은닉 마르코프 모델(HMM)의 Baum-Welch 알고리즘, 가우시안 혼합 모델(GMM)의 학습, 초기 토픽 모델링(LDA)에 사용되었다.
- **GAN의 암묵적 MLE**: GAN(Goodfellow et al. 2014)은 명시적 우도를 계산하지 않지만, 생성자가 수렴할 때 모델 분포가 데이터 분포에 근접하는 것을 목표로 한다. Goodfellow가 보인 것은 최적 판별자 하에서 생성자의 목적함수가 Jensen-Shannon 발산 최소화와 동치라는 것이며, 이는 KL 발산의 대칭화 버전이다. MLE와 같은 목적(모델 분포를 데이터 분포에 맞추기)을 다른 경로로 추구한다.

## 한계와 약점

- **과적합**: MLE는 사전분포(prior)를 두지 않으므로, 데이터가 적으면 관찰된 패턴에 과도하게 맞춘다. 베이즈 관점에서 보면, MLE는 균일 사전분포를 가정한 것과 같다. 즉 정규화(regularization)가 전혀 없다. 현대 신경망에서 weight decay(L2 정규화)를 추가하는 것은 사실 MLE를 MAP(Maximum A Posteriori) 추정으로 확장한 것이다.
- **점추정의 한계**: MLE는 파라미터의 단일 최적값만 제공하고, 그 추정이 얼마나 불확실한지는 알려주지 않는다. 자율주행이나 의료 진단처럼 불확실성 자체가 중요한 의사결정에서는 베이즈 추론이 필요하다.
- **유한 표본 편향**: MLE는 대표본에서 일관적이고 효율적이지만, 소표본에서는 편향될 수 있다. 고전적 예시가 분산의 MLE다. 데이터 5개의 분산을 구할 때 MLE는 N(=5)으로 나누지만, 불편추정량은 N-1(=4)로 나눈다. 이 차이는 N이 커질수록 무시할 수 있지만, 소표본에서는 체계적으로 분산을 과소추정한다.
- **모델 오명세**: MLE는 주어진 모델 가족 안에서 최선의 파라미터를 찾을 뿐, 모델 자체가 틀렸는지는 판단하지 못한다. 데이터의 참 분포가 지수 분포인데 정규분포 가족에서 MLE를 수행하면, 정규분포 중 가장 나은 것을 찾을 뿐이다. 신경망의 높은 표현력이 이 문제를 완화하지만, 완전히 해결하지는 못한다.

## 용어 정리

우도함수(likelihood function) - 관찰된 데이터가 주어졌을 때 파라미터의 함수로서의 확률. 확률 P(data|theta)를 theta의 함수로 볼 때의 명칭. 확률과 수식은 같지만 고정하는 변수가 다르다

로그우도(log-likelihood) - 우도함수의 자연로그. 곱셈을 덧셈으로 변환하여 수치적 언더플로우를 방지하고 미분을 간소화한다

교차 엔트로피(cross-entropy) - 두 확률 분포 사이의 차이를 측정하는 정보이론적 척도. 분류 손실함수로 사용될 때 음의 로그우도와 수학적으로 동치

KL 발산(Kullback-Leibler divergence) - 한 확률 분포가 다른 분포와 얼마나 다른지를 측정하는 비대칭 척도. KL(P||Q) ≠ KL(Q||P)

Fisher 정보량(Fisher information) - 로그우도 곡선의 곡률(이차 미분)의 기댓값. 데이터가 파라미터에 대해 담고 있는 정보의 양을 정량화한다

Cramer-Rao 하한(Cramer-Rao lower bound) - 불편추정량 분산의 이론적 최소치. 1/I(theta). 어떤 추정 방법으로도 이보다 정밀할 수 없다

점근적 효율성(asymptotic efficiency) - 대표본에서 추정량의 분산이 Cramer-Rao 하한에 도달하는 성질. MLE만이 이 성질을 갖는다

EM 알고리즘(Expectation-Maximization) - 잠재 변수가 있을 때 E 단계(기대값 계산)와 M 단계(우도 최대화)를 반복하여 MLE를 구하는 반복 알고리즘

정규화 흐름(normalizing flows) - 단순 분포에 가역적 변환을 연쇄 적용하여 복잡한 분포를 모델링하는 생성 모델. 야코비안으로 정확한 로그우도 계산이 가능

자연 기울기법(natural gradient) - Fisher 정보 행렬의 역행렬로 기울기를 보정하여 확률 분포 공간의 기하학을 반영하는 최적화 방법. Amari(1998)가 정보 기하학에서 도출

---EN---
Maximum Likelihood Estimation - The fundamental statistical principle of finding parameters that make observed data most probable

## The Idea of Likelihood: Flipping the Perspective on Probability

Suppose you flip a coin 10 times and get 7 heads. "What is this coin's probability of heads?" The most intuitive way to answer is Maximum Likelihood Estimation (MLE). The core idea is simple: **choose the parameter value that makes the observed outcome most probable.**

Probability fixes the parameter and asks "what is the chance of 7 heads with this coin?" Likelihood reverses the direction. It fixes the data and asks "which coin makes 7 heads most plausible?" The formula P(data|theta) is the same -- only the perspective changes. Yet this shift in viewpoint transformed the foundations of statistics.

Ronald A. Fisher (1922) elevated this idea into a systematic estimation theory. Before Fisher, Gauss and Laplace had used the concept of likelihood, but Fisher erected three pillars -- consistency (convergence to the true value as data grows), efficiency (estimation variance reaching the theoretical minimum), and sufficient statistics (summary measures that compress data without information loss) -- that made rigorous comparison of estimator quality possible.

## The Likelihood Function and Log-Likelihood: From Multiplication to Addition

Given N independent observations x_1, x_2, ..., x_N, the likelihood function for parameter theta is the product of each data point's probability:

L(theta) = P(x_1|theta) * P(x_2|theta) * ... * P(x_N|theta)

MLE finds the theta that maximizes this likelihood: theta_MLE = argmax_theta L(theta).

In practice, multiplication causes a fatal problem. Multiplying 1,000 probabilities around 0.001 each produces a number smaller than a computer can represent, collapsing to zero (underflow). The solution is the **log-likelihood**:

l(theta) = log L(theta) = sum_{i=1}^{N} log P(x_i|theta)

Since log is monotonically increasing, the theta maximizing log-likelihood is identical to the one maximizing likelihood. Multiplication becomes addition, yielding numerical stability and simpler differentiation (sum rule instead of product rule). This transformation goes beyond computational convenience -- it becomes the mathematical bridge connecting MLE to information theory.

## From Statistics to AI's Loss Function

The path through which MLE became the backbone of modern AI is the discovery that **three different perspectives point to the same mathematical objective**. Fisher's likelihood maximization, Shannon's information-theoretic cross-entropy, and the distributional distance measure introduced by Kullback and Leibler all converge to one.

- Perspective 1 -- Maximize likelihood: argmax_theta sum log P(x_i|theta)
- Perspective 2 -- Minimize cross-entropy: argmin_theta [-sum P_data(x) * log P_model(x|theta)]
- Perspective 3 -- Minimize KL divergence: argmin_theta KL(P_data || P_model)

Expanding Perspective 3 gives sum P_data(x) * log(P_data(x) / P_model(x|theta)), where P_data(x) * log P_data(x) is a constant independent of theta. Therefore KL divergence minimization = cross-entropy minimization = log-likelihood maximization -- all three are mathematically equivalent.

The key correspondences between this equivalence and AI are:

- Fisher's parameter theta --> **neural network weights**
- Likelihood function L(theta) --> **model's goodness of fit to data**
- Negative log-likelihood -l(theta) --> **cross-entropy loss function**
- Likelihood maximization --> **loss minimization** (gradient descent)
- Sufficient statistics --> **feature vectors** in representation learning that preserve data information

This correspondence is not merely an analogy. The cross-entropy minimized when training a neural network classifier is mathematically exactly the negative log-likelihood. AI's most ubiquitous loss function is a direct implementation of a 200-year-old statistical principle.

## Fisher Information: The Curvature That Draws the Limits of Estimation

Fisher information measures how much information data contains about a parameter:

I(theta) = -E[d^2 log P(x|theta) / d(theta)^2]

This is the expected **curvature** of the log-likelihood curve. To visualize spatially: plot the log-likelihood as a function of theta. If the region near the maximum forms a sharp peak, the signal saying "this is the answer" is strong (high Fisher information). If it forms a gentle hill, the signal is vague -- "somewhere around here" (low Fisher information).

Tracking extreme values clarifies the meaning further. When I(theta) is very large (sharp curvature), estimation uncertainty is small. When I(theta) approaches zero (flat curvature), the data says almost nothing about the parameter.

The Cramer-Rao lower bound states that no unbiased estimator can have variance below 1/I(theta). This is like a physical limit on estimation -- no matter how clever the method, you cannot achieve precision beyond the information content of the data. Fisher's key result was proving that MLE is the only estimator reaching this bound in large samples. This property is **asymptotic efficiency**.

## Theoretical Deep Dive: Natural Gradient and the Geometry of Probability Distributions

Fisher information was revived in modern AI in an unexpected direction through Amari's (1998) Natural Gradient method.

Standard gradient descent (SGD) follows gradients in Euclidean space, treating all parameter directions as equal. But when parameters represent probability distributions, Euclidean distance and the actual difference between distributions do not align. For example, shifting a normal distribution's mean from 0 to 0.01 and shifting its variance from 1 to 1.01 have the same Euclidean distance, but vastly different effects on the distribution's shape.

The natural gradient corrects gradients using the inverse of the Fisher information matrix F: theta_new = theta_old - alpha * F^(-1) * grad(l). This correction reflects the geometry of the space where probability distributions live (the statistical manifold), finding the steepest direction in terms of distributional change. This is the core idea of information geometry.

Practically, directly computing the inverse Fisher information matrix is infeasible for modern neural networks with millions of parameters. Approximations are needed. TRPO (Trust Region Policy Optimization, Schulman et al. 2015) in reinforcement learning leverages Fisher information indirectly through KL divergence constraints, while K-FAC (Kronecker-Factored Approximate Curvature) approximates the Fisher matrix via Kronecker products to make computation practical.

## Connections to Modern AI

MLE is the learning objective itself in modern AI. However, the nature of each connection must be distinguished.

**Direct implementations of MLE:**

- **Cross-entropy loss**: The standard loss function for classification neural networks is mathematically equivalent to negative log-likelihood. MLE operates directly as the loss function in virtually all classification tasks -- ImageNet classification, sentiment analysis, document classification, and beyond.
- **Autoregressive language models**: Pre-training of GPT-family models is exact MLE using the chain rule of conditional probabilities. Maximizing the log-likelihood of each conditional in P(x) = P(x_1) * P(x_2|x_1) * ... * P(x_N|x_{1:N-1}) is precisely "next token prediction." Modern LLM pre-training is essentially large-scale MLE over billions of tokens.
- **Normalizing Flows**: Rezende & Mohamed (2015) compute exact log-likelihood using the Jacobian of transformations and maximize it directly. The modern generative model most faithful to MLE in its purest form.

**Extensions that modify or relax MLE:**

- **VAE's ELBO optimization**: Kingma & Welling's (2014) Variational Autoencoder maximizes a lower bound on the log-likelihood (ELBO, Evidence Lower Bound) rather than the exact value. When latent variables make direct MLE intractable, variational inference tightens this lower bound. It can be viewed as a variational generalization of the EM algorithm.
- **EM algorithm in AI**: Dempster, Laird, and Rubin's (1977) EM alternates between an E-step (computing expected values of latent variables given current parameters) and an M-step (maximizing likelihood using those expected values). It has been used in the Baum-Welch algorithm for Hidden Markov Models (HMM), Gaussian Mixture Model (GMM) training, and early topic modeling (LDA).
- **GAN's implicit MLE**: GANs (Goodfellow et al. 2014) do not compute explicit likelihood, but aim for the model distribution to approximate the data distribution at convergence. Goodfellow showed that under an optimal discriminator, the generator's objective is equivalent to minimizing the Jensen-Shannon divergence -- a symmetrized version of KL divergence. It pursues the same goal as MLE (matching model to data distribution) through a different path.

## Limitations and Weaknesses

- **Overfitting**: MLE imposes no prior, making it prone to overfitting with limited data. From a Bayesian perspective, MLE assumes a uniform prior -- equivalent to no regularization. Adding weight decay (L2 regularization) in modern neural networks is in fact extending MLE to MAP (Maximum A Posteriori) estimation.
- **Point estimate limitations**: MLE provides only a single optimal parameter value with no uncertainty information. For decisions where uncertainty itself matters -- autonomous driving, medical diagnosis -- Bayesian inference is needed.
- **Finite sample bias**: MLE is consistent and efficient in large samples but can be biased in small ones. The classic example is the MLE of variance: with 5 data points, MLE divides by N (=5) while the unbiased estimator divides by N-1 (=4). This difference becomes negligible as N grows, but systematically underestimates variance in small samples.
- **Model misspecification**: MLE finds the best parameters within a given model family but cannot judge whether the model itself is wrong. If the true distribution is exponential but you perform MLE within the normal family, you find the best normal fit -- nothing more. Neural network expressiveness mitigates but does not fully resolve this issue.

## Glossary

Likelihood function - the probability as a function of parameters given observed data; P(data|theta) viewed as a function of theta. Same formula as probability but with the fixed variable reversed

Log-likelihood - the natural logarithm of the likelihood function; converts multiplication to addition, preventing numerical underflow and simplifying differentiation

Cross-entropy - an information-theoretic measure of the difference between two probability distributions; mathematically equivalent to negative log-likelihood when used as a classification loss function

KL divergence (Kullback-Leibler divergence) - an asymmetric measure of how different one probability distribution is from another. KL(P||Q) ≠ KL(Q||P)

Fisher information - the expected curvature (second derivative) of the log-likelihood curve; quantifies how much information data carries about a parameter

Cramer-Rao lower bound - the theoretical minimum variance of an unbiased estimator; equals 1/I(theta). No estimation method can be more precise than this

Asymptotic efficiency - the property that an estimator's variance reaches the Cramer-Rao lower bound in large samples; only MLE possesses this property

EM algorithm (Expectation-Maximization) - an iterative algorithm that finds MLE by alternating E-steps (computing expected values) and M-steps (maximizing likelihood) when latent variables are present

Normalizing flows - a generative model that models complex distributions by chaining invertible transformations on a simple distribution; enables exact log-likelihood computation via the Jacobian

Natural gradient - an optimization method that corrects gradients using the inverse Fisher information matrix to reflect the geometry of probability distribution space; derived by Amari (1998) from information geometry
