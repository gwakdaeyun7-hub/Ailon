---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 최대우도추정, 우도함수, 로그우도, 교차 엔트로피, Fisher 정보량, EM 알고리즘, KL 발산, 생성 모델
keywords_en: maximum likelihood estimation, likelihood function, log-likelihood, cross-entropy, Fisher information, EM algorithm, KL divergence, generative models
---
Maximum Likelihood Estimation - 관찰된 데이터를 가장 잘 설명하는 파라미터를 찾는 통계적 추론의 기본 원리

## Fisher의 혁신: 데이터가 말하게 하라

Ronald A. Fisher(1922)가 최대우도추정(Maximum Likelihood Estimation, MLE)을 공식적으로 체계화했을 때, 그는 통계학의 방향을 근본적으로 바꾸었다. 핵심 질문은 이것이다. "이 데이터를 관찰할 확률을 **가장 높게 만드는 파라미터 값**은 무엇인가?" 사전 지식이나 주관적 믿음을 배제하고, 오직 데이터가 파라미터에 대해 말하는 것에 집중하는 철학이다.

Fisher 이전에도 우도(likelihood)의 개념은 존재했지만, 그가 이를 일관된 추정 이론으로 격상시켰다. 일관성(consistency), 효율성(efficiency), 충분통계량(sufficient statistics)이라는 개념을 도입하여 추정량의 품질을 평가하는 프레임워크를 만들었다.

## 우도함수와 로그우도

N개의 독립적 관찰 데이터 x_1, x_2, ..., x_N이 주어졌을 때, 파라미터 theta에 대한 우도함수는 다음과 같다.

L(theta) = P(x_1|theta) * P(x_2|theta) * ... * P(x_N|theta) = product_{i=1}^{N} P(x_i|theta)

MLE는 이 우도를 최대화하는 theta를 찾는다.

theta_MLE = argmax_theta L(theta)

실무에서는 곱셈의 수치적 불안정성(아주 작은 확률들의 곱은 컴퓨터에서 언더플로우를 일으킨다)을 피하기 위해 **로그우도**(log-likelihood)를 사용한다.

l(theta) = log L(theta) = sum_{i=1}^{N} log P(x_i|theta)

로그는 단조 증가 함수이므로, 로그우도를 최대화하는 theta와 우도를 최대화하는 theta는 동일하다. 곱셈이 덧셈으로 바뀌어 계산이 안정적이고 미분이 쉬워진다.

## 세 관점, 하나의 목적함수

MLE가 현대 AI에서 갖는 핵심적 위치를 이해하려면, 다음 **세 관점이 동일한 수학적 목적함수**를 가리킨다는 사실을 알아야 한다.

관점 1 -- 우도 최대화: argmax_theta sum log P(x_i|theta)
관점 2 -- 교차 엔트로피 최소화: argmin_theta [-sum P_data(x) * log P_model(x|theta)]
관점 3 -- KL 발산 최소화: argmin_theta KL(P_data || P_model) = argmin_theta [sum P_data(x) * log(P_data(x) / P_model(x|theta))]

관점 3에서 P_data(x) * log P_data(x)는 theta와 무관한 상수이므로, KL 발산 최소화는 교차 엔트로피 최소화와 동치이고, 이는 로그우도 최대화와 동치다.

이 동치가 중요한 이유는, AI에서 쓰는 "**교차 엔트로피 손실**(cross-entropy loss)"이 별개의 발명이 아니라 **MLE의 정보이론적 재해석**이라는 것을 보여주기 때문이다. 신경망 분류기를 훈련할 때 최소화하는 교차 엔트로피는 곧 음의 로그우도(negative log-likelihood)다.

## Fisher 정보량: 추정의 한계를 아는 것

Fisher 정보량은 데이터가 파라미터에 대해 얼마나 많은 정보를 담고 있는지를 측정한다.

I(theta) = -E[d^2 log P(x|theta) / d(theta)^2]

직관적으로, 로그우도 곡선이 최댓값 근처에서 **급격히 꺾이면**(곡률이 크면) 데이터가 파라미터 값을 강하게 특정하므로 정보가 많다. 완만하면 정보가 적다.

Cramer-Rao 하한은 어떤 불편추정량(unbiased estimator)의 분산도 1/I(theta) 아래로 내려갈 수 없다고 말한다. MLE는 대표본에서 이 하한에 도달하는 유일한 추정량이다 -- Fisher가 증명한 **점근적 효율성**(asymptotic efficiency)이다.

현대 AI에서 Fisher 정보량은 자연 기울기법(Natural Gradient, Amari 1998)의 핵심이다. 일반 경사하강법은 유클리드 공간에서의 기울기를 따르지만, 자연 기울기법은 Fisher 정보 행렬의 역행렬로 기울기를 보정하여 확률 분포 공간의 기하학을 반영한다. TRPO(Schulman et al. 2015)와 같은 강화학습 알고리즘의 이론적 기반이 여기에 있다.

## EM 알고리즘: 숨겨진 변수가 있을 때

데이터에 관찰되지 않은 **잠재 변수**(latent variable)가 있으면 직접적인 MLE 최적화가 어렵다. Dempster, Laird, Rubin(1977)의 EM(Expectation-Maximization) 알고리즘은 이 문제를 두 단계의 반복으로 해결한다.

E 단계: 현재 파라미터 추정값으로 잠재 변수의 기대값을 계산한다.
M 단계: 그 기대값을 이용해 우도를 최대화하는 새로운 파라미터를 구한다.

가우시안 혼합 모델(GMM)의 학습이 대표적 사례다. 각 데이터 포인트가 어떤 가우시안에서 왔는지(잠재 변수)를 E 단계에서 추정하고, M 단계에서 각 가우시안의 평균과 분산을 갱신한다.

AI에서 EM은 은닉 마르코프 모델(HMM)의 Baum-Welch 알고리즘, VAE의 ELBO 최적화, 그리고 초기 토픽 모델링(LDA)의 학습에 사용된다. VAE에서 ELBO 최대화는 사실 EM의 변분 일반화다.

## 현대 생성 모델에서의 MLE

현대 생성 모델은 MLE를 다양한 형태로 확장하고 있다.

정규화 흐름(Normalizing Flows, Rezende & Mohamed 2015): 변환의 야코비안(Jacobian)을 이용해 정확한 로그우도를 계산하고 직접 최대화한다. MLE를 가장 충실하게 따르는 현대 생성 모델이다.

VAE(Kingma & Welling 2014): 정확한 로그우도 대신 그 하한(ELBO)을 최대화한다. 변분 추론과 MLE의 결합이다.

자기회귀 모델(Autoregressive models): GPT와 같은 언어 모델은 **조건부 확률의 연쇄 법칙**을 이용한 정확한 MLE를 수행한다. P(x) = P(x_1) * P(x_2|x_1) * ... * P(x_N|x_{1:N-1})의 각 조건부 확률의 로그우도를 최대화하는 것이 바로 "다음 토큰 예측" 학습이다. 현대 LLM의 사전훈련은 본질적으로 대규모 MLE다.

## 한계와 약점

- **과적합**: MLE는 사전분포(prior)를 두지 않으므로, 데이터가 적으면 과적합에 취약하다. 이를 베이즈 관점에서 보면, MLE는 균일 사전분포(= 아무런 정규화 없음)를 가정한 것과 같다.
- **점추정의 한계**: MLE는 파라미터의 단일 최적값만 제공하고, 그 추정에 대한 불확실성 정보를 주지 않는다. 불확실성이 중요한 응용에서는 베이즈 추론이 필요하다.
- **유한 표본 편향**: MLE는 대표본에서 일관적이고 효율적이지만, 소표본에서는 편향될 수 있다. 분산의 MLE가 N-1이 아닌 N으로 나누는 것이 고전적 예시다.
- **모델 오명세**: MLE는 주어진 모델 가족 안에서 최선의 파라미터를 찾지만, 모델 자체가 틀렸으면(데이터의 참 분포가 모델 가족에 없으면) 의미 있는 보장이 사라진다. 신경망의 표현력이 이 문제를 완화하지만, 완전히 해결하지는 못한다.

## 용어 정리

우도함수(likelihood function) - 관찰된 데이터가 주어졌을 때 파라미터의 함수로서의 확률. P(D|theta)를 theta의 함수로 볼 때의 명칭

로그우도(log-likelihood) - 우도함수의 자연로그. 곱셈을 덧셈으로 변환하여 수치적 안정성과 미분 용이성을 확보

교차 엔트로피(cross-entropy) - 두 확률 분포 사이의 차이를 측정하는 정보이론적 척도. 분류 손실함수로 사용될 때 음의 로그우도와 동치

KL 발산(Kullback-Leibler divergence) - 한 확률 분포가 다른 분포와 얼마나 다른지를 측정하는 비대칭 척도

Fisher 정보량(Fisher information) - 데이터가 파라미터에 대해 담고 있는 정보의 양. 로그우도의 이차 미분의 기댓값의 음수

Cramer-Rao 하한(Cramer-Rao lower bound) - 불편추정량 분산의 이론적 최소치. 1/I(theta)

EM 알고리즘(Expectation-Maximization) - 잠재 변수가 있을 때 E 단계(기대값 계산)와 M 단계(우도 최대화)를 반복하여 MLE를 구하는 알고리즘

정규화 흐름(normalizing flows) - 단순 분포에 가역적 변환을 연쇄 적용하여 복잡한 분포를 모델링하는 생성 모델. 정확한 로그우도 계산이 가능

점근적 효율성(asymptotic efficiency) - 대표본에서 추정량의 분산이 Cramer-Rao 하한에 도달하는 성질. MLE의 핵심 이론적 장점

---EN---
Maximum Likelihood Estimation - The fundamental statistical principle of finding parameters that make observed data most probable

## Fisher's Revolution: Let the Data Speak

When Ronald A. Fisher (1922) formally systematized Maximum Likelihood Estimation (MLE), he fundamentally changed the direction of statistics. The core question is: "What **parameter value makes the probability of observing this data highest**?" The philosophy is to exclude prior knowledge or subjective beliefs and focus solely on what the data says about the parameters.

The concept of likelihood existed before Fisher, but he elevated it into a coherent estimation theory. By introducing concepts of consistency, efficiency, and sufficient statistics, he created a framework for evaluating the quality of estimators.

## The Likelihood Function and Log-Likelihood

Given N independent observations x_1, x_2, ..., x_N, the likelihood function for parameter theta is:

L(theta) = P(x_1|theta) * P(x_2|theta) * ... * P(x_N|theta) = product_{i=1}^{N} P(x_i|theta)

MLE finds theta that maximizes this likelihood:

theta_MLE = argmax_theta L(theta)

In practice, the **log-likelihood** is used to avoid numerical instability from multiplying very small probabilities (which causes underflow in computers):

l(theta) = log L(theta) = sum_{i=1}^{N} log P(x_i|theta)

Since log is a monotonically increasing function, the theta maximizing log-likelihood is identical to the one maximizing likelihood. Multiplication becomes addition, making computation stable and differentiation easy.

## Three Perspectives, One Objective Function

To understand MLE's central position in modern AI, one must recognize that **three perspectives point to the same mathematical objective**:

Perspective 1 -- Maximize likelihood: argmax_theta sum log P(x_i|theta)
Perspective 2 -- Minimize cross-entropy: argmin_theta [-sum P_data(x) * log P_model(x|theta)]
Perspective 3 -- Minimize KL divergence: argmin_theta KL(P_data || P_model) = argmin_theta [sum P_data(x) * log(P_data(x) / P_model(x|theta))]

In Perspective 3, P_data(x) * log P_data(x) is a constant independent of theta, so KL divergence minimization is equivalent to cross-entropy minimization, which is equivalent to log-likelihood maximization.

This equivalence matters because it reveals that "**cross-entropy loss**" used in AI is not a separate invention but an **information-theoretic reinterpretation of MLE**. The cross-entropy minimized when training a neural network classifier is precisely the negative log-likelihood.

## Fisher Information: Knowing the Limits of Estimation

Fisher information measures how much information data contains about a parameter:

I(theta) = -E[d^2 log P(x|theta) / d(theta)^2]

Intuitively, if the log-likelihood curve **bends sharply** near its maximum (high curvature), the data strongly specifies the parameter value -- high information. If the curve is gentle, information is low.

The Cramer-Rao lower bound states that no unbiased estimator can have variance below 1/I(theta). MLE is the only estimator that achieves this bound in large samples -- Fisher's proof of **asymptotic efficiency**.

In modern AI, Fisher information is central to the Natural Gradient method (Amari 1998). Standard gradient descent follows gradients in Euclidean space, but the natural gradient corrects gradients using the inverse Fisher information matrix, reflecting the geometry of probability distribution space. This is the theoretical foundation for reinforcement learning algorithms like TRPO (Schulman et al. 2015).

## The EM Algorithm: When Variables Are Hidden

When data involves unobserved **latent variables**, direct MLE optimization becomes difficult. The EM (Expectation-Maximization) algorithm by Dempster, Laird, and Rubin (1977) solves this through iterating two steps:

E-step: Compute the expected value of latent variables using the current parameter estimate.
M-step: Find new parameters that maximize the likelihood using those expected values.

Training Gaussian Mixture Models (GMM) is the canonical example. The E-step estimates which Gaussian each data point came from (latent variable), and the M-step updates each Gaussian's mean and variance.

In AI, EM appears in the Baum-Welch algorithm for Hidden Markov Models (HMM), ELBO optimization in VAEs, and early topic modeling (LDA) training. ELBO maximization in VAEs is in fact a variational generalization of EM.

## MLE in Modern Generative Models

Modern generative models extend MLE in various forms.

Normalizing Flows (Rezende & Mohamed 2015): Compute exact log-likelihood using the Jacobian of transformations and maximize it directly. The modern generative model most faithful to MLE.

VAE (Kingma & Welling 2014): Maximizes a lower bound (ELBO) on the log-likelihood rather than the exact value. A combination of variational inference and MLE.

Autoregressive models: Language models like GPT perform exact MLE using the **chain rule of conditional probabilities**. Maximizing the log-likelihood of each conditional in P(x) = P(x_1) * P(x_2|x_1) * ... * P(x_N|x_{1:N-1}) is precisely "next token prediction" training. Modern LLM pre-training is essentially large-scale MLE.

## Limitations and Weaknesses

- **Overfitting**: MLE imposes no prior, making it vulnerable to overfitting with limited data. From a Bayesian perspective, MLE assumes a uniform prior -- equivalent to no regularization at all.
- **Point estimate limitations**: MLE provides only a single optimal parameter value and gives no uncertainty information. Applications requiring uncertainty need Bayesian inference.
- **Finite sample bias**: MLE is consistent and efficient in large samples, but can be biased in small samples. The classic example is the MLE of variance dividing by N instead of N-1.
- **Model misspecification**: MLE finds the best parameters within a given model family, but if the model itself is wrong (the true data distribution is not in the model family), meaningful guarantees disappear. Neural network expressiveness mitigates but does not fully resolve this issue.

## Glossary

Likelihood function - the probability as a function of parameters given observed data; P(D|theta) viewed as a function of theta

Log-likelihood - the natural logarithm of the likelihood function; converts multiplication to addition for numerical stability and easier differentiation

Cross-entropy - an information-theoretic measure of the difference between two probability distributions; equivalent to negative log-likelihood when used as a classification loss function

KL divergence (Kullback-Leibler divergence) - an asymmetric measure of how different one probability distribution is from another

Fisher information - the amount of information that data carries about a parameter; the negative expected value of the second derivative of the log-likelihood

Cramer-Rao lower bound - the theoretical minimum variance of an unbiased estimator; equals 1/I(theta)

EM algorithm (Expectation-Maximization) - an algorithm that finds MLE by alternating E-steps (computing expected values) and M-steps (maximizing likelihood) when latent variables are present

Normalizing flows - a generative model that models complex distributions by chaining invertible transformations on a simple distribution; enables exact log-likelihood computation

Asymptotic efficiency - the property that an estimator's variance reaches the Cramer-Rao lower bound in large samples; the key theoretical advantage of MLE
