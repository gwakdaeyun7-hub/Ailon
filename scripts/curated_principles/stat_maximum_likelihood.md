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

Ronald A. Fisher(1922)가 이 아이디어를 체계적 추정 이론으로 격상시켰다. Fisher는 일관성(consistency, 데이터가 많아질수록 참값에 수렴), 효율성(efficiency, 추정 분산이 이론적 최소에 도달), 충분통계량(sufficient statistics, 데이터 정보를 손실 없이 압축)이라는 세 기둥을 세워 추정량의 품질을 엄밀하게 비교할 수 있게 만들었다.

## 우도함수와 로그우도: 곱셈에서 덧셈으로

N개의 독립적 관찰 데이터가 주어졌을 때, 우도함수는 각 데이터의 확률을 모두 곱한 것이다.

L(theta) = P(x_1|theta) * P(x_2|theta) * ... * P(x_N|theta)

MLE는 이 우도를 최대화하는 theta를 찾는다. 그런데 실무에서 곱셈은 치명적 문제를 일으킨다. 0.001 수준의 확률 1,000개를 곱하면 컴퓨터가 표현할 수 있는 최소값보다 작아져 0으로 처리된다(언더플로우). 이를 해결하는 것이 **로그우도**(log-likelihood)다.

l(theta) = log L(theta) = sum_{i=1}^{N} log P(x_i|theta)

로그 함수는 단조 증가하므로 로그우도를 최대화하는 theta와 우도를 최대화하는 theta는 동일하다. 곱셈이 덧셈으로 바뀌어 수치적으로 안정적이고, 미분도 간단해진다. 이 변환은 단순한 계산 편의를 넘어, MLE가 정보 이론과 연결되는 수학적 다리가 된다.

## 통계학에서 AI의 손실함수로

MLE가 현대 AI의 뼈대가 된 핵심 경로는, **세 가지 서로 다른 관점이 동일한 수학적 목적함수**를 가리킨다는 발견이다.

- 관점 1 -- 우도 최대화: argmax_theta sum log P(x_i|theta)
- 관점 2 -- 교차 엔트로피 최소화: argmin_theta [-sum P_data(x) * log P_model(x|theta)]
- 관점 3 -- KL 발산 최소화: argmin_theta KL(P_data || P_model)

관점 3에서 P_data(x) * log P_data(x) 부분은 theta와 무관한 상수이므로, KL 발산 최소화 = 교차 엔트로피 최소화 = 로그우도 최대화, 세 관점이 수학적으로 동치다.

이 동치의 핵심 대응 관계는 다음과 같다.

- Fisher의 파라미터 theta --> **신경망의 가중치**
- 우도함수 L(theta) --> **데이터에 대한 모델의 적합도**
- 음의 로그우도 -l(theta) --> **교차 엔트로피 손실함수**
- 우도 최대화 --> **손실함수 최소화**(gradient descent)

이 대응은 비유가 아니다. 신경망 분류기의 교차 엔트로피는 수학적으로 정확히 음의 로그우도이며, AI의 가장 보편적인 손실함수가 200년 전 통계학 원리의 직접적 구현이다.

## Fisher 정보량: 추정의 한계를 그리는 곡률

Fisher 정보량은 데이터가 파라미터에 대해 얼마나 많은 정보를 담고 있는지를 측정한다.

I(theta) = -E[d^2 log P(x|theta) / d(theta)^2]

이것은 로그우도 곡선의 **곡률**의 기댓값이다. 최댓값 근처가 뾰족한 봉우리면 "여기가 정답"이라는 신호가 강하고(높은 Fisher 정보), 완만한 언덕이면 모호한 신호다(낮은 Fisher 정보).

Cramer-Rao 하한은 어떤 불편추정량의 분산도 1/I(theta) 아래로 내려갈 수 없다고 말한다. Fisher가 증명한 핵심 결과는, MLE가 대표본에서 이 하한에 정확히 도달하는 유일한 추정량이라는 것이다. 이 성질이 **점근적 효율성**이다.

Fisher 정보량은 Amari(1998)의 자연 기울기법(Natural Gradient)을 통해 현대 AI에서 부활했다. 일반 경사하강법(SGD)은 유클리드 공간에서 모든 방향을 동등하게 취급하지만, 확률 분포를 파라미터로 표현할 때 유클리드 거리와 분포 간의 실제 차이는 일치하지 않는다. 자연 기울기법은 Fisher 정보 행렬의 역행렬로 기울기를 보정하여 분포 변화량 기준으로 가장 가파른 방향을 찾는다. 실용적으로 Fisher 행렬의 역행렬 직접 계산은 비현실적이므로, TRPO(Schulman et al., 2015)는 KL 발산 제약으로 간접 활용하고, K-FAC은 크로네커 곱으로 근사한다.

## 현대 AI 기법과의 연결

**MLE의 직접적 구현:**

- **교차 엔트로피 손실**: 분류 신경망의 표준 손실함수는 음의 로그우도와 동치다. ImageNet 분류, 감정 분석 등 사실상 모든 분류 문제에서 MLE가 직접 작동한다.
- **자기회귀 언어 모델**: GPT 계열의 사전훈련은 조건부 확률의 연쇄 법칙을 이용한 정확한 MLE다. P(x) = P(x_1) * P(x_2|x_1) * ... 의 각 조건부 확률의 로그우도를 최대화하는 것이 "다음 토큰 예측"이다. 현대 LLM 사전훈련은 본질적으로 수십억 토큰 규모의 대규모 MLE다.
- **정규화 흐름(Normalizing Flows)**: Rezende & Mohamed(2015)의 정규화 흐름은 야코비안으로 정확한 로그우도를 계산하고 직접 최대화한다. MLE를 가장 순수하게 따르는 현대 생성 모델이다.

**MLE를 변형 또는 완화한 확장:**

- **VAE의 ELBO 최적화**: Kingma & Welling(2014)의 VAE는 정확한 로그우도 대신 하한(ELBO)을 최대화한다. 잠재 변수가 있어 직접 MLE가 불가능할 때 변분 추론으로 하한을 조이는 전략이며, EM 알고리즘의 변분 일반화로 볼 수 있다.
- **EM 알고리즘**: Dempster, Laird, Rubin(1977)의 EM은 잠재 변수가 있을 때 E 단계(기대값 계산)와 M 단계(우도 최대화)를 반복한다. HMM의 Baum-Welch, GMM 학습, 초기 LDA에 사용되었다.
- **GAN의 암묵적 MLE**: GAN(Goodfellow et al., 2014)은 명시적 우도를 계산하지 않지만, 최적 판별자 하에서 생성자의 목적함수가 Jensen-Shannon 발산 최소화(KL 발산의 대칭화)와 동치라는 것이 보여졌다. MLE와 같은 목적을 다른 경로로 추구한다.

## 한계와 약점

- **과적합**: MLE는 사전분포를 두지 않으므로 데이터가 적으면 과도하게 맞춘다. Weight decay(L2 정규화) 추가는 사실 MLE를 MAP 추정으로 확장한 것이다.
- **점추정의 한계**: 파라미터의 단일 최적값만 제공하고 불확실성은 알려주지 않는다. 자율주행이나 의료 진단에서는 베이즈 추론이 필요하다.
- **유한 표본 편향**: 대표본에서 일관적이지만 소표본에서는 편향될 수 있다. 고전적 예시가 분산의 MLE(N으로 나눔)와 불편추정량(N-1로 나눔)의 차이다.
- **모델 오명세**: 주어진 모델 가족 안에서 최선의 파라미터를 찾을 뿐, 모델 자체가 틀렸는지는 판단하지 못한다.

## 용어 정리

우도함수(likelihood function) - 관찰된 데이터가 주어졌을 때 파라미터의 함수로서의 확률. 확률과 수식은 같지만 고정하는 변수가 다르다

로그우도(log-likelihood) - 우도함수의 자연로그. 곱셈을 덧셈으로 변환하여 수치적 언더플로우를 방지한다

교차 엔트로피(cross-entropy) - 두 확률 분포 사이의 차이를 측정하는 정보이론적 척도. 분류 손실함수로 사용될 때 음의 로그우도와 동치

KL 발산(Kullback-Leibler divergence) - 한 확률 분포가 다른 분포와 얼마나 다른지를 측정하는 비대칭 척도

Fisher 정보량(Fisher information) - 로그우도 곡선의 곡률의 기댓값. 데이터가 파라미터에 대해 담고 있는 정보량을 정량화한다

점근적 효율성(asymptotic efficiency) - 대표본에서 추정량의 분산이 Cramer-Rao 하한에 도달하는 성질. MLE만이 이 성질을 갖는다

EM 알고리즘(Expectation-Maximization) - 잠재 변수가 있을 때 E 단계와 M 단계를 반복하여 MLE를 구하는 반복 알고리즘

자연 기울기법(natural gradient) - Fisher 정보 행렬의 역행렬로 기울기를 보정하여 확률 분포 공간의 기하학을 반영하는 최적화 방법. Amari(1998)

---EN---
Maximum Likelihood Estimation - The fundamental statistical principle of finding parameters that make observed data most probable

## The Idea of Likelihood: Flipping the Perspective on Probability

Suppose you flip a coin 10 times and get 7 heads. "What is this coin's probability of heads?" The most intuitive answer comes from Maximum Likelihood Estimation (MLE). The core idea is simple: **choose the parameter value that makes the observed outcome most probable.**

Probability fixes the parameter and asks "what is the chance of 7 heads?" Likelihood reverses the direction, fixing the data and asking "which coin makes 7 heads most plausible?" The formula P(data|theta) is the same -- only the perspective changes. Yet this shift transformed the foundations of statistics.

Ronald A. Fisher (1922) elevated this into systematic estimation theory. Fisher erected three pillars -- consistency (convergence to true value as data grows), efficiency (variance reaching theoretical minimum), and sufficient statistics (compressing data without information loss) -- making rigorous comparison of estimator quality possible.

## The Likelihood Function and Log-Likelihood: From Multiplication to Addition

Given N independent observations, the likelihood function is the product of each data point's probability:

L(theta) = P(x_1|theta) * P(x_2|theta) * ... * P(x_N|theta)

MLE finds the theta maximizing this. In practice, multiplication causes a fatal problem: multiplying 1,000 tiny probabilities produces underflow. The solution is the **log-likelihood**:

l(theta) = log L(theta) = sum_{i=1}^{N} log P(x_i|theta)

Since log is monotonically increasing, maximizing log-likelihood is equivalent. Multiplication becomes addition, yielding numerical stability and simpler differentiation. This transformation also becomes the mathematical bridge connecting MLE to information theory.

## From Statistics to AI's Loss Function

The path through which MLE became AI's backbone: **three different perspectives point to the same mathematical objective.**

- Perspective 1 -- Maximize likelihood: argmax_theta sum log P(x_i|theta)
- Perspective 2 -- Minimize cross-entropy: argmin_theta [-sum P_data(x) * log P_model(x|theta)]
- Perspective 3 -- Minimize KL divergence: argmin_theta KL(P_data || P_model)

Since P_data(x) * log P_data(x) is a constant independent of theta, KL divergence minimization = cross-entropy minimization = log-likelihood maximization -- all three are mathematically equivalent.

The key correspondences:

- Fisher's parameter theta --> **neural network weights**
- Likelihood function L(theta) --> **model's goodness of fit to data**
- Negative log-likelihood -l(theta) --> **cross-entropy loss function**
- Likelihood maximization --> **loss minimization** (gradient descent)

This is not analogy. The cross-entropy minimized when training a classifier is mathematically exactly the negative log-likelihood. AI's most ubiquitous loss function is a direct implementation of a 200-year-old statistical principle.

## Fisher Information: The Curvature That Draws Estimation's Limits

Fisher information measures how much information data contains about a parameter:

I(theta) = -E[d^2 log P(x|theta) / d(theta)^2]

This is the expected **curvature** of the log-likelihood curve. A sharp peak near the maximum signals strong information; a gentle hill signals vagueness.

The Cramer-Rao lower bound states no unbiased estimator can have variance below 1/I(theta). Fisher proved MLE is the only estimator reaching this bound in large samples -- the property of **asymptotic efficiency**.

Fisher information was revived in modern AI through Amari's (1998) Natural Gradient. Standard SGD treats all parameter directions equally, but Euclidean distance and actual distributional difference do not align. The natural gradient corrects using the inverse Fisher information matrix to find the steepest direction in distribution change. Direct computation is infeasible for large networks, so TRPO (Schulman et al., 2015) leverages Fisher information indirectly through KL constraints, and K-FAC approximates via Kronecker products.

## Connections to Modern AI

**Direct implementations of MLE:**

- **Cross-entropy loss**: The standard classification loss is mathematically equivalent to negative log-likelihood. MLE operates directly in virtually all classification tasks.
- **Autoregressive language models**: GPT pre-training is exact MLE using the chain rule of conditional probabilities. Maximizing each conditional's log-likelihood in P(x) = P(x_1) * P(x_2|x_1) * ... is "next token prediction." Modern LLM pre-training is essentially large-scale MLE over billions of tokens.
- **Normalizing Flows**: Rezende & Mohamed (2015) compute exact log-likelihood via Jacobians and maximize directly. The modern generative model most faithful to pure MLE.

**Extensions that modify or relax MLE:**

- **VAE's ELBO optimization**: Kingma & Welling's (2014) VAE maximizes a lower bound (ELBO) instead of exact log-likelihood. When latent variables make direct MLE intractable, variational inference tightens this bound. A variational generalization of EM.
- **EM algorithm**: Dempster, Laird, and Rubin's (1977) EM alternates E-steps and M-steps when latent variables are present. Used in HMM's Baum-Welch, GMM training, and early LDA.
- **GAN's implicit MLE**: GANs (Goodfellow et al., 2014) compute no explicit likelihood, but under an optimal discriminator the generator's objective equals Jensen-Shannon divergence minimization -- a symmetrized KL. Same goal as MLE through a different path.

## Limitations and Weaknesses

- **Overfitting**: MLE imposes no prior, making it prone to overfitting with limited data. Adding weight decay is in fact extending MLE to MAP estimation.
- **Point estimate limitations**: Provides only a single optimal value with no uncertainty information. Bayesian inference is needed for safety-critical decisions.
- **Finite sample bias**: Consistent in large samples but can be biased in small ones. Classic example: MLE of variance divides by N, while the unbiased estimator divides by N-1.
- **Model misspecification**: Finds the best parameters within a model family but cannot judge whether the model itself is wrong.

## Glossary

Likelihood function - probability as a function of parameters given observed data; same formula as probability but with the fixed variable reversed

Log-likelihood - the natural logarithm of the likelihood function; converts multiplication to addition, preventing numerical underflow

Cross-entropy - an information-theoretic measure of the difference between two distributions; mathematically equivalent to negative log-likelihood when used as classification loss

KL divergence (Kullback-Leibler divergence) - an asymmetric measure of how different one distribution is from another

Fisher information - the expected curvature of the log-likelihood curve; quantifies how much information data carries about a parameter

Asymptotic efficiency - the property that an estimator's variance reaches the Cramer-Rao lower bound in large samples; only MLE possesses this

EM algorithm (Expectation-Maximization) - an iterative algorithm finding MLE by alternating E-steps and M-steps when latent variables are present

Natural gradient - an optimization method correcting gradients using the inverse Fisher information matrix to reflect probability distribution geometry; Amari (1998)
